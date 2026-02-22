/**
 * src/discord/publisher/BriefingPublisher.js
 * Publication automatique des briefings périodiques
 * Génère et publie les résumés selon le preset du serveur (3h/5h/12h/24h)
 */

'use strict';

const cron = require('node-cron');
const logger = require('../../utils/logger');
const { buildBriefingEmbed } = require('../embeds/briefingEmbed');
const { publishBriefing } = require('./NewsPublisher');
const News = require('../../database/models/News');
const ServerConfig = require('../../database/models/ServerConfig');
const { getLatestIndex } = require('../../processors/IndexCalculator');
const { getCurrentHotZones } = require('../../processors/HotZoneDetector');

/**
 * Collecte les données pour un briefing
 * @param {number} hoursBack - Nombre d'heures en arrière
 * @returns {Promise<object>}
 */
async function collectBriefingData(hoursBack = 24) {
    const since = new Date(Date.now() - hoursBack * 3600_000);

    // Top news par gravité
    const topNews = await News.find({ createdAt: { $gte: since } })
        .sort({ severityScore: -1, reportCount: -1 })
        .limit(10)
        .lean();

    // Stats globales
    const allNews = await News.find({ createdAt: { $gte: since } }).lean();
    const stats = {
        total: allNews.length,
        critical: allNews.filter(n => n.severity === 'critical').length,
        high: allNews.filter(n => n.severity === 'high').length,
        medium: allNews.filter(n => n.severity === 'medium').length,
        low: allNews.filter(n => n.severity === 'low').length,
        byCategory: {},
    };

    for (const news of allNews) {
        if (news.category) {
            stats.byCategory[news.category] = (stats.byCategory[news.category] || 0) + 1;
        }
    }

    const hotZones = getCurrentHotZones().slice(0, 5);
    const indexData = await getLatestIndex();

    return { topNews, stats, hotZones, indexData };
}

/**
 * Publie un briefing pour un serveur
 * @param {object} serverConfig - Config du serveur
 * @param {string} period - Période ('3h'|'5h'|'12h'|'24h')
 */
async function publishBriefingForServer(serverConfig, period) {
    const lang = serverConfig.language || 'fr';
    const hoursBack = parseInt(period) || 24;

    const data = await collectBriefingData(hoursBack);
    const embeds = buildBriefingEmbed({ ...data, period }, lang);

    await publishBriefing(embeds, serverConfig);

    // Mise à jour du dernier briefing
    await ServerConfig.findByIdAndUpdate(serverConfig._id, {
        lastBriefingAt: new Date(),
    });

    logger.info(`[BriefingPublisher] ✅ Briefing ${period} publié pour ${serverConfig.guildId}`);
}

/**
 * Vérifie si un serveur est prêt pour son briefing
 * @param {object} serverConfig
 * @returns {boolean}
 */
function isBriefingDue(serverConfig) {
    if (!serverConfig.briefingEnabled) return false;
    const interval = parseInt(serverConfig.briefingInterval) || 24;
    const lastBriefing = serverConfig.lastBriefingAt;
    if (!lastBriefing) return true;
    const elapsed = (Date.now() - new Date(lastBriefing)) / 3600_000; // en heures
    return elapsed >= interval;
}

/**
 * Démarre les schedulers de briefing
 * Les briefings sont vérifiés toutes les heures
 */
function startBriefingScheduler() {
    // Vérification toutes les heures, à la minute 30
    cron.schedule('30 * * * *', async () => {
        try {
            const servers = await ServerConfig.find({ briefingEnabled: true }).lean();
            for (const serverData of servers) {
                const serverConfig = new ServerConfig(serverData);
                if (isBriefingDue(serverConfig)) {
                    await publishBriefingForServer(serverConfig, serverConfig.briefingInterval || '24h');
                }
            }
        } catch (error) {
            logger.error(`[BriefingPublisher] Erreur scheduler: ${error.message}`);
        }
    });

    logger.info('[BriefingPublisher] ⏰ Scheduler briefing démarré (vérification toutes les heures)');
}

module.exports = { startBriefingScheduler, publishBriefingForServer, collectBriefingData };
