/**
 * src/utils/recoveryManager.js
 * Rattrapage des news manquées après un crash ou redémarrage
 * Compare le timestamp du dernier article avec l'heure actuelle
 */

'use strict';

const logger = require('./logger');
const News = require('../database/models/News');
const BotStats = require('../database/models/BotStats');

/**
 * Vérifie depuis quand le bot était éteint et récupère les stats
 * @returns {Promise<object>} Informations de recovery
 */
async function checkRecovery() {
    try {
        // Trouver le dernier article en base
        const lastNews = await News.findOne({}).sort({ createdAt: -1 }).lean();

        if (!lastNews) {
            logger.info('[Recovery] Aucune news en base - Premier démarrage ou base vide');
            return { needed: false, gapMinutes: 0, lastSeen: null };
        }

        const lastSeenAt = lastNews.createdAt;
        const now = new Date();
        const gapMs = now - lastSeenAt;
        const gapMinutes = Math.floor(gapMs / 60_000);

        if (gapMinutes > 5) {
            logger.warn(`[Recovery] ⚠️ Le bot était éteint depuis ${gapMinutes} minutes (dernière news: ${lastSeenAt.toISOString()})`);
            logger.info('[Recovery] 🔄 Démarrage du mode recovery - collecte immédiate au démarrage');
            return { needed: true, gapMinutes, lastSeen: lastSeenAt };
        }

        logger.info(`[Recovery] ✅ Pas de recovery nécessaire (gap: ${gapMinutes} min)`);
        return { needed: false, gapMinutes, lastSeen: lastSeenAt };
    } catch (error) {
        logger.error(`[Recovery] Erreur lors du check: ${error.message}`);
        return { needed: false, gapMinutes: 0, lastSeen: null };
    }
}

/**
 * Enregistre le démarrage du bot dans les stats
 * @param {boolean} wasRecovery - Si un recovery a eu lieu
 */
async function recordStartup(wasRecovery = false) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await BotStats.findOneAndUpdate(
            { date: today },
            { $setOnInsert: { date: today } },
            { upsert: true }
        );

        logger.info(`[Recovery] 📝 Démarrage enregistré${wasRecovery ? ' (mode recovery)' : ''}`);
    } catch (error) {
        logger.error(`[Recovery] Erreur enregistrement démarrage: ${error.message}`);
    }
}

module.exports = { checkRecovery, recordStartup };
