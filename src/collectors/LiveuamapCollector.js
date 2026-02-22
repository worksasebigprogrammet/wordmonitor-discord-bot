/**
 * src/collectors/LiveuamapCollector.js
 * Collecteur Liveuamap (conflits actifs)
 * Scraping RSS de liveuamap.com
 */

'use strict';

const RSSParser = require('rss-parser');
const logger = require('../utils/logger');

const LIVEUAMAP_FEED = 'https://liveuamap.com/rss';
const parser = new RSSParser({ timeout: 8000 });

async function collectLiveuamap() {
    logger.info('[Liveuamap] 🔄 Collecte conflits...');
    const articles = [];

    try {
        const feed = await parser.parseURL(LIVEUAMAP_FEED);
        for (const item of (feed.items || []).slice(0, 15)) {
            articles.push({
                title: item.title || 'Événement de conflit',
                description: item.contentSnippet || item.summary || '',
                url: item.link || LIVEUAMAP_FEED,
                imageUrl: null,
                sourceName: 'Liveuamap',
                sourceType: 'rss',
                sourceReliability: 7,
                sourceLang: 'en',
                category: 'conflicts',
                originalDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            });
        }
        logger.info(`[Liveuamap] ✅ ${articles.length} événements collectés`);
    } catch (error) {
        logger.warn(`[Liveuamap] Erreur: ${error.message}`);
    }

    return articles;
}

module.exports = { collectLiveuamap };
