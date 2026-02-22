/**
 * src/collectors/NetBlocksCollector.js
 * Collecteur NetBlocks (pannes internet mondiales)
 * Scraping du flux RSS NetBlocks
 */

'use strict';

const RSSParser = require('rss-parser');
const logger = require('../utils/logger');

const NETBLOCKS_URL = 'https://netblocks.org/feed';
const parser = new RSSParser({ timeout: 8000 });

async function collectNetBlocks() {
    logger.info('[NetBlocks] 🔄 Collecte des pannes internet...');
    const articles = [];

    try {
        const feed = await parser.parseURL(NETBLOCKS_URL);
        for (const item of (feed.items || []).slice(0, 10)) {
            articles.push({
                title: item.title || 'Panne internet signalée',
                description: item.contentSnippet || item.summary || '',
                url: item.link || NETBLOCKS_URL,
                imageUrl: null,
                sourceName: 'NetBlocks',
                sourceType: 'netblocks',
                sourceReliability: 8,
                sourceLang: 'en',
                category: 'outages',
                originalDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            });
        }
        logger.info(`[NetBlocks] ✅ ${articles.length} articles collectés`);
    } catch (error) {
        logger.warn(`[NetBlocks] Erreur: ${error.message}`);
    }

    return articles;
}

module.exports = { collectNetBlocks };
