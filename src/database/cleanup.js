/**
 * src/database/cleanup.js
 * Nettoyage automatique des données expirées
 * Vérifie toutes les heures et supprime les données > 24h non gérées par TTL
 */

'use strict';

const cron = require('node-cron');
const News = require('./models/News');
const BotStats = require('./models/BotStats');
const logger = require('../utils/logger');
const { BOT_LIMITS } = require('../config/constants');

/**
 * Nettoyage des news expirées (backup au cas où le TTL MongoDB échoue)
 */
async function cleanupExpiredNews() {
    try {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() - BOT_LIMITS.NEWS_TTL_HOURS);

        const result = await News.deleteMany({ createdAt: { $lt: expiry } });
        if (result.deletedCount > 0) {
            logger.info(`[Cleanup] 🗑️ ${result.deletedCount} news expirées supprimées`);
        }
    } catch (error) {
        logger.error(`[Cleanup] Erreur nettoyage news: ${error.message}`);
    }
}

/**
 * Nettoyage des statistiques > 30 jours
 */
async function cleanupOldStats() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await BotStats.deleteMany({ date: { $lt: thirtyDaysAgo } });
        if (result.deletedCount > 0) {
            logger.info(`[Cleanup] 🗑️ ${result.deletedCount} entrées de stats anciennes supprimées`);
        }
    } catch (error) {
        logger.error(`[Cleanup] Erreur nettoyage stats: ${error.message}`);
    }
}

/**
 * Lance toutes les tâches de nettoyage
 */
async function runCleanup() {
    logger.debug('[Cleanup] Démarrage du nettoyage...');
    await cleanupExpiredNews();
    await cleanupOldStats();
    logger.debug('[Cleanup] Nettoyage terminé');
}

/**
 * Planifie le nettoyage toutes les heures
 */
function scheduleCleanup() {
    // Toutes les heures à la minute 0
    cron.schedule('0 * * * *', async () => {
        await runCleanup();
    });
    logger.info('[Cleanup] 📅 Nettoyage automatique planifié (toutes les heures)');
}

module.exports = { runCleanup, scheduleCleanup, cleanupExpiredNews };
