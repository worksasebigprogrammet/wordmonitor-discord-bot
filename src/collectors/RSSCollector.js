/**
 * src/collectors/RSSCollector.js
 * Collecteur RSS - Source principale (Priorité 1)
 * Parse 80+ flux RSS en séquence avec gestion d'erreurs et fallback
 */

'use strict';

const RSSParser = require('rss-parser');
const { ALL_RSS_FEEDS } = require('../config/sources');
const logger = require('../utils/logger');
const { sleep } = require('../utils/rateLimiter');
const { BOT_LIMITS } = require('../config/constants');

// Personnalisation du parser RSS pour catcher les formats non-standard
const parser = new RSSParser({
    timeout: 10000,
    headers: {
        'User-Agent': 'WorldMonitor/1.0 RSS Reader',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: false }],
            ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
            ['enclosure', 'enclosure', { keepArray: false }],
        ],
    },
});

/**
 * Extrait l'image d'un article RSS depuis différentes sources
 * @param {object} item - Item RSS
 * @returns {string|null}
 */
function extractImage(item) {
    try {
        if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
        if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
        if (item.enclosure?.url) return item.enclosure.url;
        // Tenter d'extraire depuis le contenu HTML
        const content = item.content || item['content:encoded'] || '';
        const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) return imgMatch[1];
    } catch (_) { }
    return null;
}

/**
 * Convertit un item RSS en format standard WorldMonitor
 * @param {object} item - Item RSS brut
 * @param {object} feed - Configuration de la source
 * @returns {object} Article normalisé
 */
function normalizeItem(item, feed) {
    return {
        title: item.title?.trim() || 'Titre inconnu',
        description: item.contentSnippet || item.summary || item.description || '',
        url: item.link || item.guid || '',
        imageUrl: extractImage(item),
        sourceName: feed.name,
        sourceType: 'rss',
        sourceReliability: feed.reliability,
        sourceLang: feed.lang,
        originalDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        raw: {
            guid: item.guid,
            categories: item.categories,
        },
    };
}

/**
 * Collecte les articles d'un seul flux RSS
 * @param {object} feed - Configuration du flux
 * @returns {Promise<Array>} Articles collectés
 */
async function fetchFeed(feed) {
    const articles = [];

    try {
        const result = await parser.parseURL(feed.url);

        for (const item of (result.items || []).slice(0, 20)) {
            const normalized = normalizeItem(item, feed);
            if (normalized.url && normalized.title) {
                articles.push(normalized);
            }
        }

        logger.debug(`[RSS] ✅ ${feed.name}: ${articles.length} articles`);
        feed.errorCount = 0; // Reset error count on success
        feed.lastFetch = new Date();
    } catch (error) {
        feed.errorCount = (feed.errorCount || 0) + 1;
        logger.warn(`[RSS] ⚠️ ${feed.name} (${feed.url}): ${error.message}`);

        // Désactiver temporairement si trop d'erreurs consécutives
        if (feed.errorCount >= 5) {
            feed.active = false;
            logger.error(`[RSS] ❌ ${feed.name} désactivé après 5 erreurs consécutives`);
        }
    }

    return articles;
}

/**
 * Collecte tous les flux RSS en séquence (une source à la fois)
 * @param {object} options - Options de collecte
 * @param {number} options.maxFeeds - Nombre max de feeds à collecter
 * @returns {Promise<Array>} Tous les articles collectés
 */
async function collectRSS(options = {}) {
    const { maxFeeds = ALL_RSS_FEEDS.length } = options;
    const allArticles = [];

    const activeFeeds = ALL_RSS_FEEDS
        .filter(f => f.active !== false)
        .slice(0, maxFeeds);

    logger.info(`[RSS] 🔄 Démarrage collecte de ${activeFeeds.length} flux RSS...`);

    for (const feed of activeFeeds) {
        const articles = await fetchFeed(feed);
        allArticles.push(...articles);

        // Délai entre les sources pour économiser la RAM et être poli
        await sleep(BOT_LIMITS.SOURCE_DELAY_MS);
    }

    logger.info(`[RSS] ✅ Collecte terminée: ${allArticles.length} articles bruts de ${activeFeeds.length} sources`);
    return allArticles;
}

/**
 * Collecte uniquement les feeds d'une catégorie spécifique
 * @param {string} category - Catégorie à collecter
 * @returns {Promise<Array>}
 */
async function collectRSSByCategory(category) {
    const categoryFeeds = ALL_RSS_FEEDS.filter(f => f.category === category && f.active !== false);

    if (categoryFeeds.length === 0) {
        return [];
    }

    const allArticles = [];
    for (const feed of categoryFeeds) {
        const articles = await fetchFeed(feed);
        allArticles.push(...articles);
        await sleep(1000);
    }

    return allArticles;
}

module.exports = { collectRSS, collectRSSByCategory, fetchFeed };
