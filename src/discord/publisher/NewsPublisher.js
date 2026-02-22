/**
 * src/discord/publisher/NewsPublisher.js
 * Publication des news dans les bons channels Discord
 * Gère: logique de routage, webhooks, rate limiting
 */

'use strict';

const { WebhookClient, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const { discordQueue } = require('../../utils/queue');
const { buildNewsEmbed } = require('../embeds/newsEmbed');
const ServerConfig = require('../../database/models/ServerConfig');
const News = require('../../database/models/News');
const BotStats = require('../../database/models/BotStats');
const { CATEGORIES } = require('../../config/categories');
const { COUNTRIES } = require('../../config/countries');

// Cache des webhooks actifs
const webhookCache = new Map();

/**
 * Obtient ou crée un client WebhookClient depuis l'URL
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
        logger.error(`[NewsPublisher] Webhook invalide: ${error.message}`);
        return null;
    }
}

/**
 * Détermine le channel cible pour un article
 * @param {object} news - Document News
 * @param {object} serverConfig - Configuration du serveur
 * @returns {string|null} Nom du channel cible
 */
function getTargetChannel(news, serverConfig) {
    // Vérifier si la catégorie est active
    if (!serverConfig.isCategoryEnabled(news.category)) return null;
    // Vérifier si le niveau d'alerte est actif
    if (!serverConfig.isAlertLevelEnabled(news.severity)) return null;

    const catData = CATEGORIES[news.category];
    if (!catData) return null;

    // 1. Channel spécifique au pays (si configuré)
    if (news.country && serverConfig.isCountryMonitored(news.country)) {
        const countryChannel = serverConfig.getChannelId(`country-${news.country.toLowerCase()}`);
        if (countryChannel) return `country-${news.country.toLowerCase()}`;
    }

    // 2. Channel de catégorie
    const categoryChannelName = catData.channelName;
    const categoryChannel = serverConfig.getChannelId(categoryChannelName);
    if (categoryChannel) return categoryChannelName;

    // 3. Channel breaking-news comme fallback pour les nouvelles critiques
    if (['critical', 'high'].includes(news.severity)) {
        const breakingChannel = serverConfig.getChannelId('breaking-news');
        if (breakingChannel) return 'breaking-news';
    }

    return null;
}

/**
 * Publie une news dans un serveur Discord
 * @param {object} news - Document News MongoDB
 * @param {object} serverConfig - Configuration du serveur
 */
async function publishToServer(news, serverConfig) {
    const lang = serverConfig.language || 'fr';
    const targetChannelName = getTargetChannel(news, serverConfig);

    if (!targetChannelName) {
        return; // News filtrée pour ce serveur
    }

    const channelId = serverConfig.getChannelId(targetChannelName);
    const webhookUrl = serverConfig.getWebhookUrl(targetChannelName);

    if (!channelId && !webhookUrl) {
        return; // Ni channel ni webhook configuré
    }

    const embed = buildNewsEmbed(news, lang);

    try {
        if (webhookUrl) {
            // Publication via webhook (permet avatar personnalisé)
            const webhookClient = getWebhookClient(webhookUrl);
            if (!webhookClient) return;

            const catData = CATEGORIES[news.category] || {};

            await webhookClient.send({
                username: `WorldMonitor — ${catData.name?.[lang] || news.category}`,
                avatarURL: `https://i.imgur.com/worldmonitor-${news.severity}.png`, // Icons par gravité
                embeds: [embed],
            });
        }

        // Marquer comme publié
        await News.findByIdAndUpdate(news._id, {
            $set: { published: true, publishedAt: new Date() },
            $addToSet: { publishedTo: serverConfig.guildId },
        });

        // Stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await BotStats.findOneAndUpdate(
            { date: today },
            { $inc: { newsPublished: 1 } },
            { upsert: true }
        );

        logger.debug(`[NewsPublisher] ✅ Publié dans ${serverConfig.guildId}/${targetChannelName}`);
    } catch (error) {
        logger.error(`[NewsPublisher] ❌ Erreur publication ${serverConfig.guildId}: ${error.message}`);

        // Si l'erreur vient d'un webhook invalide, le supprimer du cache
        if (webhookUrl && (error.code === 10015 || error.message.includes('Unknown Webhook'))) {
            webhookCache.delete(webhookUrl);
            logger.warn(`[NewsPublisher] Webhook supprimé du cache: ${webhookUrl.substring(0, 50)}...`);
        }
    }
}

/**
 * Publie une news dans tous les serveurs configurés
 * @param {object} news - Document News MongoDB
 */
async function publishNews(news) {
    try {
        // Charger tous les serveurs avec setup complet
        const servers = await ServerConfig.find({ setupComplete: true }).lean();

        if (servers.length === 0) return;

        logger.debug(`[NewsPublisher] Publication de "${news.title?.substring(0, 50)}" vers ${servers.length} serveurs`);

        for (const serverData of servers) {
            // Recréer l'objet avec les méthodes
            const serverConfig = new ServerConfig(serverData);

            // Ajouter à la file de publication avec la bonne priorité
            discordQueue.add(
                () => publishToServer(news, serverConfig),
                news.severity || 'low'
            );
        }
    } catch (error) {
        logger.error(`[NewsPublisher] Erreur publication globale: ${error.message}`);
    }
}

/**
 * Publie le briefing dans le channel prévu
 * @param {EmbedBuilder[]} embeds - Embeds du briefing
 * @param {object} serverConfig - Configuration du serveur
 */
async function publishBriefing(embeds, serverConfig) {
    const channelId = serverConfig.getChannelId('daily-briefing') || serverConfig.getChannelId('breaking-news');
    const webhookUrl = serverConfig.getWebhookUrl('daily-briefing');

    if (!channelId && !webhookUrl) return;

    try {
        if (webhookUrl) {
            const webhookClient = getWebhookClient(webhookUrl);
            if (webhookClient) {
                await webhookClient.send({ embeds: embeds.slice(0, 10) });
            }
        }
        logger.info(`[NewsPublisher] ✅ Briefing publié dans ${serverConfig.guildId}`);
    } catch (error) {
        logger.error(`[NewsPublisher] Erreur briefing: ${error.message}`);
    }
}

module.exports = { publishNews, publishToServer, publishBriefing };
