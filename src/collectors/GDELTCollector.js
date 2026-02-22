/**
 * src/collectors/GDELTCollector.js
 * Collecteur GDELT API (Priorité 3)
 * Interroge l'API GDELT v2 pour des événements géopolitiques
 * Gratuit, sans clé API, limite: 1 req/sec
 */

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');
const { rateLimiters, sleep } = require('../utils/rateLimiter');

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';
const TIMEOUT = 12000;

// Requêtes GDELT par thème géopolitique
const GDELT_QUERIES = [
    { query: 'war OR conflict OR military', label: 'Conflits' },
    { query: 'nuclear OR ICBM OR missile', label: 'Nucléaire' },
    { query: 'earthquake OR tsunami OR hurricane', label: 'Catastrophes' },
    { query: 'sanctions OR embargo OR trade war', label: 'Économie' },
    { query: 'terrorism OR attack OR bomb', label: 'Terrorisme' },
];

/**
 * Interroge GDELT pour une requête
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function fetchGDELT(query) {
    await rateLimiters.gdelt.waitForSlot();

    try {
        const url = `${GDELT_BASE}?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=25&format=json&timespan=1440`; // Dernières 24h
        const response = await axios.get(url, { timeout: TIMEOUT });

        if (!response.data || !response.data.articles) {
            return [];
        }

        return response.data.articles.map(art => ({
            title: art.title || '',
            description: art.seenbefore ? `Repris ${art.seenbefore} fois` : '',
            url: art.url || '',
            imageUrl: null,
            sourceName: art.domain || 'GDELT',
            sourceType: 'gdelt',
            sourceReliability: 7,
            sourceLang: art.language || 'en',
            originalDate: art.seendate ? new Date(art.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')) : new Date(),
            gdeltExtra: {
                tone: art.tone,
                themes: art.themes,
                locations: art.locations,
            },
        })).filter(a => a.title && a.url);
    } catch (error) {
        logger.warn(`[GDELT] Erreur pour "${query}": ${error.message}`);
        return [];
    }
}

/**
 * Collecte toutes les requêtes GDELT en séquence
 * @returns {Promise<Array>}
 */
async function collectGDELT() {
    logger.info(`[GDELT] 🔄 Collecte GDELT (${GDELT_QUERIES.length} requêtes)...`);
    const allArticles = [];

    for (const { query, label } of GDELT_QUERIES) {
        const articles = await fetchGDELT(query);
        allArticles.push(...articles);
        logger.debug(`[GDELT] ${label}: ${articles.length} articles`);
        await sleep(1200); // Respecter le rate limit 1 req/sec
    }

    logger.info(`[GDELT] ✅ ${allArticles.length} articles collectés`);
    return allArticles;
}

module.exports = { collectGDELT, fetchGDELT };
