/**
 * src/collectors/RssCollector.js
 * Collecteur de flux RSS
 *
 * Exporte : collectFeed(feed)
 * Utilise : rss-parser
 * Format de retour : tableau d'articles standardisés
 */

'use strict';

const Parser = require('rss-parser');
const logger = require('../utils/logger');

// Instance du parser RSS, réutilisée pour toutes les requêtes
const parser = new Parser({
    timeout: 10_000, // 10 secondes max par feed
    headers: {
        'User-Agent': 'WorldMonitor/2.0 (+https://github.com/worldmonitor)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
            ['dc:creator', 'creator'],
        ],
    },
});

// Déduplication par URL dans la session courante (évite les doublons entre cycles)
const seenUrls = new Set();
// Nettoyer le cache toutes les heures
setInterval(() => seenUrls.clear(), 3_600_000);

/**
 * Normalise un item RSS en article standardisé WorldMonitor
 * @param {object} item - Item RSS brut (rss-parser)
 * @param {object} feed - Configuration du feed source
 * @returns {object|null} Article standardisé
 */
function normalizeItem(item, feed) {
    // Extraire l'URL (link ou guid)
    const url = item.link || item.guid || null;
    if (!url) return null;

    // Extraire la date de publication
    let publishedAt;
    try {
        publishedAt = (item.pubDate || item.isoDate)
            ? new Date(item.pubDate || item.isoDate)
            : new Date();
        if (isNaN(publishedAt.getTime())) publishedAt = new Date();
    } catch {
        publishedAt = new Date();
    }

    // Description : nettoyer le HTML basique
    const rawDesc = item.contentSnippet || item.content || item.summary || item.description || '';
    const description = rawDesc
        .replace(/<[^>]+>/g, ' ')  // strip HTML
        .replace(/\s{2,}/g, ' ')   // espaces multiples
        .trim()
        .substring(0, 1000);

    return {
        title: (item.title || '').trim().substring(0, 500),
        description,
        url,
        source: feed.name,
        sourceName: feed.name,
        sourceReliability: feed.reliability || 7,
        publishedAt,
        lang: feed.lang || 'en',
        category: feed.category || 'general',
        reliability: feed.reliability || 7,
        // Image si disponible
        imageUrl: item.mediaContent?.$.url
            || item.mediaThumbnail?.$.url
            || item.enclosure?.url
            || null,
        raw: item,
    };
}

/**
 * Collecte les articles d'un flux RSS
 * @param {object} feed - { name, url, reliability, lang, category }
 * @returns {Promise<Array>} Tableau d'articles standardisés ([] en cas d'erreur)
 */
async function collectFeed(feed) {
    if (!feed?.url) return [];

    try {
        const parsedFeed = await parser.parseURL(feed.url);
        const items = parsedFeed?.items || [];

        const articles = [];

        for (const item of items) {
            const article = normalizeItem(item, feed);
            if (!article) continue;

            // Déduplication par URL
            if (seenUrls.has(article.url)) continue;
            seenUrls.add(article.url);

            // Ignorer les articles trop vieux (> 24h)
            const ageHours = (Date.now() - article.publishedAt.getTime()) / 3_600_000;
            if (ageHours > 24) continue;

            articles.push(article);
        }

        return articles;
    } catch (error) {
        // Erreurs silencieuses — les feeds tombent souvent
        logger.debug(`[RssCollector] ${feed.name}: ${error.message}`);
        return [];
    }
}

module.exports = { collectFeed };
