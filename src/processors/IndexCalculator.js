/**
 * src/processors/IndexCalculator.js
 * Calcule les index de tension global, régional et par catégorie
 * Basé sur: nombre d'articles, gravité, fréquence, catégories
 */

'use strict';

const News = require('../database/models/News');
const IndexModel = require('../database/models/Index');
const logger = require('../utils/logger');
const { CONTINENTS } = require('../config/countries');
const { CATEGORIES } = require('../config/categories');
const { SEVERITY_SCORES } = require('./SeverityScorer');

/**
 * Calcule l'index de tension pour une liste de news
 * @param {Array} newsList - News de la dernière heure
 * @returns {number} Index entre 0 et 10
 */
function calculateTensionIndex(newsList) {
    if (!newsList || newsList.length === 0) return 0;

    let total = 0;
    for (const news of newsList) {
        const severity = news.severity || 'low';
        total += SEVERITY_SCORES[severity] || 1;
    }

    // Normalisation: 50 articles critiques = index 10
    const normalized = Math.min(total / 50, 10);
    return Math.round(normalized * 10) / 10; // 1 décimale
}

/**
 * Calcule et sauvegarde tous les index
 * @returns {Promise<object>} Snapshot des index
 */
async function calculateAndSaveIndexes() {
    try {
        const oneHourAgo = new Date(Date.now() - 3_600_000);
        const allRecentNews = await News.find({ createdAt: { $gte: oneHourAgo } }).lean();

        const snapshot = {
            global: 0,
            continents: {},
            categories: {},
            hotZones: [],
            newsCounts: {},
        };

        // ─── Index global ─────────────────────────────────────────────────────
        snapshot.global = calculateTensionIndex(allRecentNews);

        // ─── Index par continent ───────────────────────────────────────────────
        for (const continent of CONTINENTS) {
            const continentNews = allRecentNews.filter(n => n.continent === continent);
            snapshot.continents[continent] = calculateTensionIndex(continentNews);
        }

        // ─── Index par catégorie ───────────────────────────────────────────────
        for (const category of Object.keys(CATEGORIES)) {
            const catNews = allRecentNews.filter(n => n.category === category);
            snapshot.categories[category] = calculateTensionIndex(catNews);
            snapshot.newsCounts[category] = catNews.length;
        }

        // ─── Zones chaudes (par pays) ──────────────────────────────────────────
        const countryGroups = {};
        for (const news of allRecentNews) {
            if (news.country) {
                if (!countryGroups[news.country]) countryGroups[news.country] = [];
                countryGroups[news.country].push(news);
            }
        }

        snapshot.hotZones = Object.entries(countryGroups)
            .map(([country, news]) => ({
                country,
                score: calculateTensionIndex(news),
                continent: news[0]?.continent || null,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Top 10

        // Sauvegarder en base
        await IndexModel.create(snapshot);
        logger.debug(`[IndexCalculator] ✅ Index sauvegardé - Global: ${snapshot.global}`);

        return snapshot;
    } catch (error) {
        logger.error(`[IndexCalculator] Erreur: ${error.message}`);
        return null;
    }
}

/**
 * Obtient le dernier index calculé
 * @returns {Promise<object|null>}
 */
async function getLatestIndex() {
    try {
        return await IndexModel.findOne({}).sort({ timestamp: -1 }).lean();
    } catch {
        return null;
    }
}

module.exports = { calculateAndSaveIndexes, getLatestIndex, calculateTensionIndex };
