/**
 * src/discord/publisher/NewsPublisher.js
 * Publication des news dans les bons channels Discord
 * Gère: logique de routage, webhooks, rate limiting, channels pays
 *
 * V2 :
 * - Routage basé sur les noms de channels (Map keys)
 * - countryChannels et continentChannels en top-level
 * - Boutons interactifs (⭐ Favori, 🌐 Traduire, 📋 Résumé+, 🔗 Source) sous chaque news
 */

'use strict';

const { WebhookClient, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../utils/logger');
const { discordQueue } = require('../../utils/queue');
const { buildNewsEmbed } = require('../embeds/newsEmbed');
const ServerConfig = require('../../database/models/ServerConfig');
const News = require('../../database/models/News');
const BotStats = require('../../database/models/BotStats');
const { CATEGORIES } = require('../../config/categories');
const { COUNTRIES } = require('../../config/countries');

// Cache des webhooks actifs (URL → WebhookClient)
const webhookCache = new Map();

// Référence au client Discord (injectée depuis index.js)
let _client = null;

/**
 * Injecter la référence au client Discord
 * @param {Client} client
 */
function setClient(client) {
    _client = client;
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

/**
 * Obtient ou crée un WebhookClient depuis son URL
 * @param {string} webhookUrl
 * @returns {WebhookClient|null}
 */
function getWebhookClient(webhookUrl) {
    if (!webhookUrl) return null;
    if (webhookCache.has(webhookUrl)) return webhookCache.get(webhookUrl);
    try {
        const client = new WebhookClient({ url: webhookUrl });
        webhookCache.set(webhookUrl, client);
        return client;
    } catch (error) {
        logger.warn(`[NewsPublisher] Webhook invalide: ${error.message}`);
        return null;
    }
}

/**
 * Supprime un webhook du cache (quand il devient invalide)
 * @param {string} webhookUrl
 */
function invalidateWebhook(webhookUrl) {
    if (webhookUrl) {
        webhookCache.delete(webhookUrl);
        logger.warn(`[NewsPublisher] Webhook retiré du cache: ${webhookUrl.substring(0, 60)}...`);
    }
}

/**
 * Envoie un embed dans un channel Discord via ID (sans webhook)
 * @param {string} channelId
 * @param {EmbedBuilder} embed
 * @param {ActionRowBuilder[]} components
 */
async function sendToChannel(channelId, embed, components = []) {
    if (!_client || !channelId) return false;
    try {
        const channel = await _client.channels.fetch(channelId).catch(() => null);
        if (channel?.isTextBased()) {
            const payload = { embeds: [embed] };
            if (components.length > 0) payload.components = components;
            await channel.send(payload);
            return true;
        }
    } catch (err) {
        logger.debug(`[NewsPublisher] Erreur sendToChannel ${channelId}: ${err.message}`);
    }
    return false;
}

/**
 * Envoie un embed via webhook
 * @param {string} webhookUrl
 * @param {EmbedBuilder} embed
 * @param {string} username
 * @param {ActionRowBuilder[]} components
 * @returns {boolean}
 */
async function sendViaWebhook(webhookUrl, embed, username = 'WorldMonitor', components = []) {
    if (!webhookUrl) return false;
    const wh = getWebhookClient(webhookUrl);
    if (!wh) return false;
    try {
        const payload = { username, embeds: [embed] };
        if (components.length > 0) payload.components = components;
        await wh.send(payload);
        return true;
    } catch (err) {
        if (err.code === 10015 || String(err.message).includes('Unknown Webhook')) {
            invalidateWebhook(webhookUrl);
        }
        throw err;
    }
}

// ─── Boutons interactifs ──────────────────────────────────────────────────────

/**
 * Construit la rangée de boutons interactifs pour une news
 * @param {string} newsId - ID MongoDB de la news
 * @returns {ActionRowBuilder}
 */
function buildNewsButtons(newsId) {
    const id = String(newsId);
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`news_fav_${id}`)
            .setEmoji('⭐')
            .setLabel('Favori')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`news_translate_${id}`)
            .setEmoji('🌐')
            .setLabel('Traduire')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`news_summary_${id}`)
            .setEmoji('📋')
            .setLabel('Résumé+')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`news_sources_${id}`)
            .setEmoji('🔗')
            .setLabel('Source')
            .setStyle(ButtonStyle.Secondary),
    );
}

// ─── Logique de routage ───────────────────────────────────────────────────────

/**
 * Obtient la valeur d'une clé dans un channels Map ou plain object
 * Supporte les deux formats (Mongoose Map post-lean ou Map instance)
 * @param {Map|object} channels
 * @param {string} key
 * @returns {string|null}
 */
function getChannel(channels, key) {
    if (!channels) return null;
    if (typeof channels.get === 'function') return channels.get(key) || null;
    return channels[key] || null;
}

/**
 * Résout les destinations de publication pour une news dans un serveur.
 * Une news peut aller dans PLUSIEURS channels :
 *   1. Channel pays (country-{code})
 *   2. Channel catégorie (mouvements-militaires, economie-mondiale…)
 *   3. #breaking-news (si critique)
 *
 * @param {object} news - Document News
 * @param {object} serverConfigDoc - Document JSON ServerConfig (lean)
 * @returns {Array<{channelId, webhookUrl, label}>}
 */
function resolvePublishTargets(news, serverConfigDoc) {
    const targets = [];
    const seen = new Set();

    const addTarget = (channelId, webhookUrl, label) => {
        if (!channelId || seen.has(channelId)) return;
        seen.add(channelId);
        targets.push({ channelId, webhookUrl: webhookUrl || null, label });
    };

    const cfg = serverConfigDoc;
    const channels = cfg.channels || {};   // Map lean = plain object avec channel_name → channelId
    const webhooks = cfg.webhooks || {};

    // Helpers pour lire le channels object
    const ch = (name) => getChannel(channels, name);
    const wh = (name) => getChannel(webhooks, name);

    // Vérifier que la catégorie est activée pour ce serveur
    // Si enabledCategories est vide ou absent → TOUTES les catégories sont autorisées
    const enabledCats = cfg.enabledCategories || [];
    if (enabledCats.length > 0 && news.category && !enabledCats.includes(news.category)) {
        logger.debug(`[NewsPublisher] ⛔ Catégorie "${news.category}" non activée pour guild ${cfg.guildId}`);
        return targets;
    }

    // Vérifier que le niveau d'alerte est activé
    // Par défaut, tous les niveaux sont activés
    const enabledLevels = cfg.alertLevels || ['critical', 'high', 'medium', 'low'];
    if (!enabledLevels.includes(news.severity)) {
        logger.debug(`[NewsPublisher] ⛔ Sévérité "${news.severity}" non activée pour guild ${cfg.guildId}`);
        return targets;
    }

    // ── 1. Channel du PAYS (prioritaire) ──────────────────────────────────
    if (news.country) {
        const code = news.country.toUpperCase();
        // Chercher dans le tableau countryChannels (top-level V2)
        const countryChannels = cfg.countryChannels || [];
        const countryEntry = countryChannels.find(
            c => c.code === code || c.key === `country-${code.toLowerCase()}`
        );
        if (countryEntry?.channelId) {
            addTarget(countryEntry.channelId, countryEntry.webhookUrl, `country:${code}`);
        }
    }

    // ── 2. Channel de CATÉGORIE global ────────────────────────────────────
    // Les clés correspondent aux noms Discord des channels créés par setup.js
    const categoryChannelMap = {
        conflicts: ch('conflits-armes') || ch('breaking-news'),
        military_movements: ch('mouvements-militaires'),
        nuclear: ch('nucleaire'),
        economy: ch('economie-mondiale'),
        maritime: ch('maritime'),
        natural_disasters: ch('catastrophes-naturelles'),
        outages: ch('pannes-blackouts'),
        terrorism: ch('terrorisme-securite') || ch('breaking-news'),
        health: ch('sante-epidemies') || ch('breaking-news'),
        diplomacy: ch('diplomatie') || ch('breaking-news'),
        // Catégories tech (module /tech)
        tech_ai: ch('tech-ai'),
        tech_hardware: ch('tech-hardware'),
        tech_cyber: ch('tech-cyber'),
        tech_general: ch('tech-general'),
        tech_gaming: ch('tech-gaming'),
        tech_crypto: ch('tech-crypto'),
    };

    const catChannelId = categoryChannelMap[news.category];
    if (catChannelId) {
        const catWebhook = wh(news.category) || wh('breaking-news') || null;
        addTarget(catChannelId, catWebhook, `category:${news.category}`);
    }

    // ── 3. #breaking-news pour les alertes critiques ───────────────────────
    if (news.severity === 'critical' && ch('breaking-news')) {
        addTarget(ch('breaking-news'), wh('breaking-news'), 'breaking-news');
    }

    // ── 4. Fallback : si aucune destination, utiliser breaking-news pour high+
    if (targets.length === 0 && ['critical', 'high'].includes(news.severity) && ch('breaking-news')) {
        addTarget(ch('breaking-news'), wh('breaking-news'), 'fallback');
    }

    return targets;
}

// ─── Publication ──────────────────────────────────────────────────────────────

/**
 * Publie une news dans un serveur Discord spécifique
 * @param {object} news - Document News MongoDB
 * @param {object} serverConfigDoc - Config du serveur (plain object lean)
 */
async function publishToServer(news, serverConfigDoc) {
    const lang = serverConfigDoc.language || 'fr';
    const targets = resolvePublishTargets(news, serverConfigDoc);

    if (targets.length === 0) return;

    const embed = buildNewsEmbed(news, lang);
    const catData = CATEGORIES[news.category] || {};
    const countryData = news.country ? COUNTRIES[news.country] : null;
    const username = countryData
        ? `${countryData.emoji} WorldMonitor — ${countryData.name}`
        : `🌍 WorldMonitor — ${catData.name?.[lang] || news.category || 'Actualité'}`;

    // Boutons interactifs sous chaque news
    const newsButtons = news._id ? buildNewsButtons(news._id) : null;
    const components = newsButtons ? [newsButtons] : [];

    let published = false;

    for (const target of targets) {
        try {
            if (target.webhookUrl) {
                await sendViaWebhook(target.webhookUrl, embed, username, components);
                published = true;
            } else if (target.channelId) {
                await sendToChannel(target.channelId, embed, components);
                published = true;
            }
            logger.debug(`[NewsPublisher] ✅ Publié [${target.label}] dans ${serverConfigDoc.guildId}`);
        } catch (error) {
            logger.warn(`[NewsPublisher] ❌ Erreur [${target.label}] ${serverConfigDoc.guildId}: ${error.message}`);
        }
    }

    if (published) {
        try {
            await News.findByIdAndUpdate(news._id, {
                $set: { published: true, publishedAt: new Date() },
                $addToSet: { publishedTo: serverConfigDoc.guildId },
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await BotStats.findOneAndUpdate(
                { date: today },
                { $inc: { newsPublished: 1 } },
                { upsert: true }
            );
            logger.debug(`[NewsPublisher] ✅ Statuts de publication mis à jour pour "${news.title?.substring(0, 50)}"`);
        } catch (err) {
            logger.debug(`[NewsPublisher] Erreur MAJ BDD: ${err.message}`);
        }
    } else {
        logger.debug(`[NewsPublisher] ⚠️ Aucune publication réussie pour "${news.title?.substring(0, 50)}" dans ${serverConfigDoc.guildId}`);
    }
}

/**
 * Publie une news dans tous les serveurs configurés
 * @param {object} news - Document News MongoDB
 */
async function publishNews(news) {
    try {
        if (!_client) {
            logger.warn(`[NewsPublisher] ⚠️ Client Discord non injecté — setClient() manquant`);
        }

        const servers = await ServerConfig.find({}).lean();

        if (servers.length === 0) {
            logger.warn('[NewsPublisher] ⚠️ Aucun serveur configuré en base');
            return;
        }

        logger.debug(`[NewsPublisher] 📰 Publication "${news.title?.substring(0, 60)}" [${news.severity}/${news.category}] → ${servers.length} serveur(s)`);

        for (const serverData of servers) {
            // DiscordPublishQueue.add() attend un STRING de priorité, pas un nombre
            const priority = news.severity || 'low';

            discordQueue.add(
                () => publishToServer(news, serverData),
                priority
            ).catch(err => {
                logger.error(`[NewsPublisher] ❌ Erreur queue pour guild ${serverData.guildId}: ${err.message}`);
            });
        }
    } catch (error) {
        logger.error(`[NewsPublisher] ❌ Erreur publication globale: ${error.message}\n${error.stack}`);
    }
}

/**
 * Publie un briefing dans le channel prévu du serveur
 * @param {Array<EmbedBuilder>} embeds - Embeds du briefing (max 10)
 * @param {object} serverConfigDoc - Config du serveur
 */
async function publishBriefing(embeds, serverConfigDoc) {
    const channels = serverConfigDoc.channels || {};
    const channelId = getChannel(channels, 'daily-briefing') || getChannel(channels, 'breaking-news');
    const webhookUrl = getChannel(serverConfigDoc.webhooks || {}, 'daily-briefing')
        || getChannel(serverConfigDoc.webhooks || {}, 'breaking-news');

    if (!channelId && !webhookUrl) {
        logger.debug(`[NewsPublisher] Pas de channel briefing pour ${serverConfigDoc.guildId}`);
        return;
    }

    const batch = embeds.slice(0, 10);

    try {
        if (webhookUrl) {
            const wh = getWebhookClient(webhookUrl);
            if (wh) {
                await wh.send({ username: '📋 WorldMonitor Briefing', embeds: batch });
                logger.info(`[NewsPublisher] ✅ Briefing webhook publié dans ${serverConfigDoc.guildId}`);
                return;
            }
        }
        if (channelId) {
            const channel = await _client?.channels.fetch(channelId).catch(() => null);
            if (channel?.isTextBased()) {
                for (let i = 0; i < batch.length; i += 10) {
                    await channel.send({ embeds: batch.slice(i, i + 10) });
                }
                logger.info(`[NewsPublisher] ✅ Briefing channel publié dans ${serverConfigDoc.guildId}`);
            }
        }
    } catch (error) {
        logger.error(`[NewsPublisher] Erreur briefing ${serverConfigDoc.guildId}: ${error.message}`);
    }
}

module.exports = {
    publishNews,
    publishToServer,
    publishBriefing,
    setClient,
    resolvePublishTargets,
    buildNewsButtons,
    getChannel,
};
