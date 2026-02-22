/**
 * src/utils/healthCheck.js
 * Vérification de santé des APIs et sources au démarrage
 * Affiche le status dans la console et met à jour les configurations
 */

'use strict';

const axios = require('axios');
const logger = require('./logger');
const { APIS } = require('../config/sources');
const { sleep } = require('./rateLimiter');

// Timeout pour les health checks
const CHECK_TIMEOUT = 8000;

/**
 * Vérifie une URL RSS
 * @param {string} url - URL à tester
 * @returns {Promise<boolean>}
 */
async function checkRSSFeed(url) {
    try {
        const response = await axios.get(url, {
            timeout: CHECK_TIMEOUT,
            headers: {
                'User-Agent': 'WorldMonitor/1.0 (+https://github.com/worldmonitor)',
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
            maxRedirects: 3,
        });
        return response.status === 200 && response.data.length > 100;
    } catch {
        return false;
    }
}

/**
 * Vérifie l'API GDELT
 * @returns {Promise<boolean>}
 */
async function checkGDELT() {
    try {
        const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=war&mode=artlist&maxrecords=1&format=json';
        const response = await axios.get(url, { timeout: CHECK_TIMEOUT });
        return response.status === 200;
    } catch {
        return false;
    }
}

/**
 * Vérifie l'API USGS
 * @returns {Promise<boolean>}
 */
async function checkUSGS() {
    try {
        const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson';
        const response = await axios.get(url, { timeout: CHECK_TIMEOUT });
        return response.status === 200 && response.data.type === 'FeatureCollection';
    } catch {
        return false;
    }
}

/**
 * Vérifie l'API DeepL
 * @returns {Promise<boolean>}
 */
async function checkDeepL() {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) return false;

    try {
        const baseUrl = apiKey.endsWith(':fx')
            ? 'https://api-free.deepl.com/v2'
            : 'https://api.deepl.com/v2';
        const response = await axios.get(`${baseUrl}/usage`, {
            timeout: CHECK_TIMEOUT,
            headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
        });
        return response.status === 200;
    } catch {
        return false;
    }
}

/**
 * Vérifie la connexion MongoDB (via la connexion déjà établie)
 * @returns {boolean}
 */
function checkMongoDB() {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
}

/**
 * Lance tous les health checks et affiche le rapport
 * @returns {Promise<object>} Résultats des health checks
 */
async function runHealthChecks() {
    logger.info('[HealthCheck] 🔍 Vérification des services...');

    const results = {
        mongodb: false,
        gdelt: false,
        usgs: false,
        deepl: false,
        rss_sample: false,
        newsapi: false,
    };

    // MongoDB
    results.mongodb = checkMongoDB();
    logger.info(`[HealthCheck] MongoDB: ${results.mongodb ? '✅' : '❌'}`);

    // GDELT
    results.gdelt = await checkGDELT();
    logger.info(`[HealthCheck] GDELT API: ${results.gdelt ? '✅' : '❌'}`);
    await sleep(500);

    // USGS
    results.usgs = await checkUSGS();
    logger.info(`[HealthCheck] USGS Earthquakes: ${results.usgs ? '✅' : '❌'}`);
    await sleep(500);

    // DeepL
    results.deepl = await checkDeepL();
    logger.info(`[HealthCheck] DeepL API: ${results.deepl ? '✅' : process.env.DEEPL_API_KEY ? '❌' : '⚠️ Clé non fournie'}`);
    await sleep(500);

    // Exemple de flux RSS (BBC World)
    results.rss_sample = await checkRSSFeed('https://feeds.bbci.co.uk/news/world/rss.xml');
    logger.info(`[HealthCheck] RSS (BBC World sample): ${results.rss_sample ? '✅' : '❌'}`);

    // NewsAPI (si clé fournie)
    if (process.env.NEWSAPI_KEY) {
        try {
            const response = await axios.get(
                `https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEWSAPI_KEY}&pageSize=1`,
                { timeout: CHECK_TIMEOUT }
            );
            results.newsapi = response.status === 200;
        } catch {
            results.newsapi = false;
        }
        logger.info(`[HealthCheck] NewsAPI: ${results.newsapi ? '✅' : '❌'}`);
    }

    // Résumé
    const working = Object.values(results).filter(Boolean).length;
    const total = Object.values(results).filter(v => v !== null).length;
    logger.info(`[HealthCheck] 📊 Résultats: ${working}/${total} services opérationnels`);

    if (!results.mongodb) {
        logger.error('[HealthCheck] ❌ CRITIQUE: MongoDB non connecté ! Le bot ne peut pas fonctionner.');
    }

    return results;
}

/**
 * Vérifie une source RSS spécifique (utilisé pendant la collecte)
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function isSourceReachable(url) {
    return checkRSSFeed(url);
}

module.exports = {
    runHealthChecks,
    isSourceReachable,
    checkGDELT,
    checkUSGS,
    checkDeepL,
    checkMongoDB,
};
