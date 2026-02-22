/**
 * src/processors/HotZoneDetector.js
 * Détection des zones chaudes (pays avec beaucoup d'événements récents)
 * Seuil: 10 événements en 1h → zone chaude → surveillance renforcée
 */

'use strict';

const News = require('../database/models/News');
const logger = require('../utils/logger');
const { BOT_LIMITS } = require('../config/constants');
const { COUNTRIES } = require('../config/countries');

// Cache des zones chaudes actuelles
const hotZoneCache = new Map(); // countryCode → { score, detectedAt, notified }

/**
 * Détecte les zones chaudes basées sur les news récentes
 * @returns {Promise<Array>} Zones chaudes détectées
 */
async function detectHotZones() {
    try {
        const oneHourAgo = new Date(Date.now() - 3_600_000);

        // Agrégation par pays dans la dernière heure
        const pipeline = [
            { $match: { createdAt: { $gte: oneHourAgo }, country: { $ne: null } } },
            { $group: { _id: '$country', count: { $sum: 1 }, avgSeverity: { $avg: '$severityScore' } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
        ];

        const results = await News.aggregate(pipeline);
        const newHotZones = [];

        for (const { _id: country, count, avgSeverity } of results) {
            const wasHot = hotZoneCache.has(country);
            const isHot = count >= BOT_LIMITS.HOT_ZONE_THRESHOLD;

            if (isHot) {
                const existing = hotZoneCache.get(country) || { notified: false };
                hotZoneCache.set(country, {
                    count,
                    score: avgSeverity,
                    detectedAt: existing.detectedAt || new Date(),
                    notified: existing.notified,
                    countryData: COUNTRIES[country] || null,
                });

                // Nouveau hot zone (pas encore notifié)
                if (!wasHot || !existing.notified) {
                    newHotZones.push({
                        country,
                        count,
                        score: avgSeverity,
                        countryData: COUNTRIES[country],
                    });
                }
            } else if (wasHot) {
                // Sortie de zone chaude
                hotZoneCache.delete(country);
                logger.info(`[HotZone] ${country} n'est plus une zone chaude`);
            }
        }

        if (newHotZones.length > 0) {
            logger.warn(`[HotZone] 🔥 ${newHotZones.length} nouvelle(s) zone(s) chaude(s) détectée(s)`);
        }

        return newHotZones;
    } catch (error) {
        logger.error(`[HotZone] Erreur détection: ${error.message}`);
        return [];
    }
}

/**
 * Marque une zone chaude comme notifiée
 * @param {string} countryCode
 */
function markNotified(countryCode) {
    const zone = hotZoneCache.get(countryCode);
    if (zone) {
        zone.notified = true;
        hotZoneCache.set(countryCode, zone);
    }
}

/**
 * Obtient les zones chaudes actuelles
 * @returns {Array}
 */
function getCurrentHotZones() {
    return Array.from(hotZoneCache.entries()).map(([country, data]) => ({
        country,
        ...data,
    }));
}

module.exports = { detectHotZones, markNotified, getCurrentHotZones };
