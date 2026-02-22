/**
 * src/discord/publisher/NewsPublisher.js
 * Publication des news dans les bons channels Discord
 * Gère: logique de routage, webhooks, rate limiting, channels pays
 *
 * BUG 6 CORRIGÉ :
 * - Routage vers les channels pays avec la convention country-{code_iso_lowercase}
 * - Une news est publiée dans PLUSIEURS endroits :
 *   1. Channel du pays (si le pays est monitoré) via countryChannels[]
 *   2. Channel de catégorie global (mouvements-militaires, economie-mondiale, etc.)
 *   3. #breaking-news si severity === 'critical'
 * - Lookup par code ISO et par nom de pays (fallback)
 * - Serveurs chargés sans filtre setupComplete (le champ n'existe pas toujours)
 */

'use strict';

const { WebhookClient, Client } = require('discord.js');
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
 */
async function sendToChannel(channelId, embed) {
    if (!_client || !channelId) return false;
    try {
        const channel = await _client.channels.fetch(channelId).catch(() => null);
        if (channel?.isTextBased()) {
            await channel.send({ embeds: [embed] });
            return true;
        }
    } catch (err) {
        logger.debug(`[NewsPublisher] Erreur sendToChannel ${channelId}: ${err.message}`);
    }
    return false;
}

/**
 * Envoie un embed via webhook (avec nom/avatar custom)
 * @param {string} webhookUrl
 * @param {EmbedBuilder} embed
 * @param {string} username
 * @returns {boolean}
 */
async function sendViaWebhook(webhookUrl, embed, username = 'WorldMonitor') {
    if (!webhookUrl) return false;
    const wh = getWebhookClient(webhookUrl);
    if (!wh) return false;
    try {
        await wh.send({ username, embeds: [embed] });
        return true;
    } catch (err) {
        if (err.code === 10015 || String(err.message).includes('Unknown Webhook')) {
            invalidateWebhook(webhookUrl);
        }
        throw err;
    }
}

// ─── Logique de routage (BUG 6 FIX) ─────────────────────────────────────────

/**
 * Résout les destinations de publication pour une news dans un serveur.
 * Une news peut aller dans PLUSIEURS channels :
 *   1. Channel pays (country-{code})
 *   2. Channel catégorie (mouvements-militaires, economie-mondiale…)
 *   3. #breaking-news (si critique)
 *
 * @param {object} news - Document News
 * @param {object} serverConfigDoc - Document JSON ServerConfig
 * @returns {Array<{channelId, webhookUrl, label}>}
 */
function resolvePublishTargets(news, serverConfigDoc) {
    const targets = [];
    const seen = new Set(); // éviter les doublons de channelId

    const addTarget = (channelId, webhookUrl, label) => {
        if (!channelId || seen.has(channelId)) return;
        seen.add(channelId);
        targets.push({ channelId, webhookUrl: webhookUrl || null, label });
    };

    const cfg = serverConfigDoc;
    const channels = cfg.channels || {};

    // Vérifier que la catégorie est activée pour ce serveur
    const enabledCats = cfg.enabledCategories || [];
    if (news.category && !enabledCats.includes(news.category)) return targets;

    // Vérifier que le niveau d'alerte est activé
    const enabledLevels = cfg.alertLevels || ['critical'];
    if (!enabledLevels.includes(news.severity)) return targets;

    // ── 1. Channel du PAYS (prioritaire) ──────────────────────────────────
    if (news.country) {
        const code = news.country.toUpperCase();
        const codeKey = `country-${code.toLowerCase()}`; // convention: country-fr

        // Chercher dans countryChannels[]
        const countryEntry = (channels.countryChannels || []).find(
            c => c.code === code || c.key === codeKey
        );

        if (countryEntry?.channelId) {
            addTarget(countryEntry.channelId, countryEntry.webhookUrl, `country:${code}`);
        }
    }

    // ── 2. Channel de CATÉGORIE global ────────────────────────────────────
    const categoryChannelMap = {
        conflicts: channels.newsChannelId,          // fallback → breaking
        military_movements: channels.militaryChannelId,
        nuclear: channels.nuclearChannelId,
        economy: channels.economyChannelId,
        maritime: channels.maritimeChannelId,
        natural_disasters: channels.disastersChannelId,
        outages: channels.outagesChannelId,
        terrorism: channels.newsChannelId,          // fallback
        health: channels.newsChannelId,          // fallback
        diplomacy: channels.newsChannelId,          // fallback
    };

    const catChannelId = categoryChannelMap[news.category];
    if (catChannelId) {
        // Le webhook du channel catégorie (si disponible)
        const catWebhook = channels.breakingNewsUrl || null; // pas de webhook spécifique par catégorie → null
        addTarget(catChannelId, catWebhook, `category:${news.category}`);
    }

    // ── 3. #breaking-news pour les alertes critiques ───────────────────────
    if (news.severity === 'critical' && channels.newsChannelId) {
        addTarget(channels.newsChannelId, channels.breakingNewsUrl, 'breaking-news');
    }

    // ── 4. Fallback : si aucune destination, utiliser breaking-news pour high+─
    if (targets.length === 0 && ['critical', 'high'].includes(news.severity) && channels.newsChannelId) {
        addTarget(channels.newsChannelId, channels.breakingNewsUrl, 'fallback');
    }

    return targets;
}

// ─── Publication ──────────────────────────────────────────────────────────────

/**
 * Publie une news dans un serveur Discord spécifique
 * @param {object} news - Document News MongoDB
 * @param {object} serverConfigDoc - Config du serveur (plain object ou Mongoose doc)
 */
async function publishToServer(news, serverConfigDoc) {
    const lang = serverConfigDoc.language || 'fr';
    const targets = resolvePublishTargets(news, serverConfigDoc);

    if (targets.length === 0) return; // News filtrée pour ce serveur

    const embed = buildNewsEmbed(news, lang);
    const catData = CATEGORIES[news.category] || {};
    const countryData = news.country ? COUNTRIES[news.country] : null;
    const username = countryData
        ? `${countryData.emoji} WorldMonitor — ${countryData.name}`
        : `🌍 WorldMonitor — ${catData.name?.[lang] || news.category || 'Actualité'}`;

    let published = false;

    for (const target of targets) {
        try {
            if (target.webhookUrl) {
                await sendViaWebhook(target.webhookUrl, embed, username);
                published = true;
            } else if (target.channelId) {
                await sendToChannel(target.channelId, embed);
                published = true;
            }
            logger.debug(`[NewsPublisher] ✅ Publié [${target.label}] dans ${serverConfigDoc.guildId}`);
        } catch (error) {
            logger.warn(`[NewsPublisher] ❌ Erreur [${target.label}] ${serverConfigDoc.guildId}: ${error.message}`);
        }
    }

    if (published) {
        // Marquer comme publié dans la BDD
        try {
            await News.findByIdAndUpdate(news._id, {
                $set: { published: true, publishedAt: new Date() },
                $addToSet: { publishedTo: serverConfigDoc.guildId },
            });

            // Mettre à jour les stats
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await BotStats.findOneAndUpdate(
                { date: today },
                { $inc: { newsPublished: 1 } },
                { upsert: true }
            );
        } catch (err) {
            logger.debug(`[NewsPublisher] Erreur MAJ BDD: ${err.message}`);
        }
    }
}

/**
 * Publie une news dans tous les serveurs configurés
 * @param {object} news - Document News MongoDB
 */
async function publishNews(news) {
    try {
        // Charger tous les serveurs configurés (sans filtre setupComplete qui n'existe pas toujours)
        const servers = await ServerConfig.find({}).lean();

        if (servers.length === 0) {
            logger.debug('[NewsPublisher] Aucun serveur configuré');
            return;
        }

        logger.debug(`[NewsPublisher] Publication "${news.title?.substring(0, 50)}" → ${servers.length} serveurs`);

        for (const serverData of servers) {
            // Priorité pour la file : critiques en premier
            const priority = news.severity === 'critical' ? 1
                : news.severity === 'high' ? 2
                    : news.severity === 'medium' ? 3 : 4;

            discordQueue.add(
                () => publishToServer(news, serverData),
                { priority }
            );
        }
    } catch (error) {
        logger.error(`[NewsPublisher] Erreur publication globale: ${error.message}`);
    }
}

/**
 * Publie un briefing dans le channel prévu du serveur
 * @param {Array<EmbedBuilder>} embeds - Embeds du briefing (max 10)
 * @param {object} serverConfigDoc - Config du serveur
 */
async function publishBriefing(embeds, serverConfigDoc) {
    const channels = serverConfigDoc.channels || {};
    const channelId = channels.briefingChannelId || channels.newsChannelId;
    const webhookUrl = channels.briefingUrl || channels.breakingNewsUrl;

    if (!channelId && !webhookUrl) {
        logger.debug(`[NewsPublisher] Pas de channel briefing pour ${serverConfigDoc.guildId}`);
        return;
    }

    const batch = embeds.slice(0, 10); // Limite Discord

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
                // Discord limite : 10 embeds par message
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
    // Exposer pour tests
    resolvePublishTargets,
};
