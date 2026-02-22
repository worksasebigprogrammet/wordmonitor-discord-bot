/**
 * src/collectors/GoogleNewsCollector.js
 * Collecteur Google News via scraping RSS (Priorité 2)
 * Gratuit, sans clé API mais sensible au blocage
 */

'use strict';

const RSSParser = require('rss-parser');
const logger = require('../utils/logger');
const { sleep } = require('../utils/rateLimiter');

const parser = new RSSParser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WorldMonitor/1.0)',
    },
});

// Requêtes Google News par thème prioritaire
const NEWS_QUERIES = [
    { query: 'breaking news war conflict', lang: 'en', country: 'US', label: 'Conflits EN' },
    { query: 'nuclear missile ICBM', lang: 'en', country: 'US', label: 'Nucléaire EN' },
    { query: 'earthquake tsunami disaster', lang: 'en', country: 'US', label: 'Catastrophes EN' },
    { query: 'actualité guerre conflit', lang: 'fr', country: 'FR', label: 'Conflits FR' },
    { query: 'actualité internationale', lang: 'fr', country: 'FR', label: 'International FR' },
    { query: 'Ukraine Russia war', lang: 'en', country: 'US', label: 'Ukraine' },
    { query: 'Israel Gaza Palestine', lang: 'en', country: 'US', label: 'Gaza' },
    { query: 'China Taiwan Taiwan Strait', lang: 'en', country: 'US', label: 'Taïwan' },
];

/**
 * Construit l'URL Google News RSS pour une requête
 * @param {string} query
 * @param {string} lang
 * @param {string} country
 * @returns {string}
 */
function buildGoogleNewsURL(query, lang = 'en', country = 'US') {
    const ceid = `${country}:${lang}`;
    const encoded = encodeURIComponent(query);
    return `https://news.google.com/rss/search?q=${encoded}&hl=${lang}&gl=${country}&ceid=${ceid}`;
}

/**
 * Collecte une requête Google News
 * @param {object} queryConfig
 * @returns {Promise<Array>}
 */
async function fetchGoogleNews(queryConfig) {
    const { query, lang, country, label } = queryConfig;
    const url = buildGoogleNewsURL(query, lang, country);

    try {
        const feed = await parser.parseURL(url);
        const articles = (feed.items || []).slice(0, 15).map(item => ({
            title: item.title?.replace(/\s*-\s*[\w\s]+$/, '').trim() || '', // Supprimer " - Source" à la fin
            description: item.contentSnippet || '',
            url: item.link || '',
            imageUrl: null,
            sourceName: `Google News (${label})`,
            sourceType: 'google_news',
            sourceReliability: 7,
            sourceLang: lang,
            originalDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            googleSource: item.source?.$?.url || '',
        })).filter(a => a.title && a.url);

        logger.debug(`[GoogleNews] ${label}: ${articles.length} articles`);
        return articles;
    } catch (error) {
        logger.warn(`[GoogleNews] Erreur pour "${label}": ${error.message}`);
        return [];
    }
}

/**
 * Collecte Google News pour toutes les requêtes
 * @returns {Promise<Array>}
 */
async function collectGoogleNews() {
    logger.info(`[GoogleNews] 🔄 Collecte Google News (${NEWS_QUERIES.length} requêtes)...`);
    const allArticles = [];

    for (const query of NEWS_QUERIES) {
        const articles = await fetchGoogleNews(query);
        allArticles.push(...articles);
        await sleep(2500); // Délai conservatif entre les requêtes scraping
    }

    logger.info(`[GoogleNews] ✅ ${allArticles.length} articles collectés`);
    return allArticles;
}

module.exports = { collectGoogleNews, fetchGoogleNews };
