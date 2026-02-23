/**
 * src/collectors/GoogleNewsCollector.js
 * Collecteur d'articles depuis Google News RSS
 *
 * Exporte : collect()
 * Utilise : rss-parser
 * Sources : 3 flux Google News (géopolitique EN + FR)
 * Retourne [] si les flux sont indisponibles
 */

'use strict';

const Parser = require('rss-parser');
const logger = require('../utils/logger');

const parser = new Parser({
    timeout: 10_000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WorldMonitor/2.0)',
        'Accept': 'application/rss+xml, application/xml, */*',
    },
});

// Flux Google News à collecter
const GOOGLE_NEWS_FEEDS = [
    {
        url: 'https://news.google.com/rss/search?q=geopolitics+war+conflict&hl=en&gl=US&ceid=US:en',
        lang: 'en',
        category: 'conflicts',
    },
    {
        url: 'https://news.google.com/rss/search?q=war+military+sanctions&hl=en&gl=US&ceid=US:en',
        lang: 'en',
        category: 'military_movements',
    },
    {
        url: 'https://news.google.com/rss/search?q=crise+internationale+conflit&hl=fr&gl=FR&ceid=FR:fr',
        lang: 'fr',
        category: 'conflicts',
    },
];

// Déduplication par URL
const seenUrls = new Set();
setInterval(() => seenUrls.clear(), 3_600_000 * 2); // Reset toutes les 2h

/**
 * Nettoie les titres Google News qui contiennent souvent " - Source"
 * @param {string} title
 * @returns {string}
 */
function cleanGoogleTitle(title) {
    if (!title) return '';
    // Google News: "Ukraine ceasefire talks - BBC News" → "Ukraine ceasefire talks"
    return title.replace(/\s[-–—]\s[^-–—]{2,50}$/, '').trim();
}

/**
 * Collecte les articles d'un seul flux Google News
 * @param {object} feedConfig - { url, lang, category }
 * @returns {Promise<Array>}
 */
async function collectOneFeed(feedConfig) {
    try {
        const feed = await parser.parseURL(feedConfig.url);
        const items = feed?.items || [];
        const results = [];

        for (const item of items) {
            const url = item.link || item.guid;
            if (!url || seenUrls.has(url)) continue;
            seenUrls.add(url);

            let publishedAt;
            try {
                publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
                if (isNaN(publishedAt.getTime())) publishedAt = new Date();
            } catch {
                publishedAt = new Date();
            }

            // Ignorer les articles trop vieux (> 12h pour Google News)
            const ageHours = (Date.now() - publishedAt.getTime()) / 3_600_000;
            if (ageHours > 12) continue;

            const title = cleanGoogleTitle(item.title || '');
            if (!title) continue;

            // Description = snippet ou titre seul (Google News ne donne pas de contenu)
            const description = item.contentSnippet || item.content || title;

            // Source = nom du journal si présent dans le titre
            const sourceMatch = item.title?.match(/[-–—]\s+(.{2,60})$/);
            const sourceName = sourceMatch ? sourceMatch[1].trim() : 'Google News';

            results.push({
                title: title.substring(0, 500),
                description: description.substring(0, 800),
                url,
                source: 'Google News',
                sourceName,
                sourceReliability: 6,
                publishedAt,
                lang: feedConfig.lang,
                category: feedConfig.category,
                reliability: 6,
                raw: item,
            });
        }

        return results;
    } catch (error) {
        logger.debug(`[GoogleNewsCollector] ${feedConfig.url.substring(0, 60)}: ${error.message}`);
        return [];
    }
}

/**
 * Collecte depuis tous les flux Google News
 * @returns {Promise<Array>} Tableau d'articles standardisés
 */
async function collect() {
    try {
        const results = await Promise.allSettled(
            GOOGLE_NEWS_FEEDS.map(feed => collectOneFeed(feed))
        );

        const articles = results
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value);

        if (articles.length > 0) {
            logger.debug(`[GoogleNewsCollector] ${articles.length} article(s) collecté(s)`);
        }

        return articles;
    } catch (error) {
        logger.debug(`[GoogleNewsCollector] Erreur: ${error.message}`);
        return [];
    }
}

module.exports = { collect };
