/**
 * src/collectors/MediastackCollector.js
 * Collecteur Mediastack (optionnel, 500 req/mois)
 */

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

async function collectMediastack() {
    const apiKey = process.env.MEDIASTACK_API;
    if (!apiKey) return [];

    logger.info('[Mediastack] 🔄 Collecte Mediastack...');
    const articles = [];

    try {
        const response = await axios.get('http://api.mediastack.com/v1/news', {
            timeout: 10000,
            params: {
                access_key: apiKey,
                languages: 'en,fr',
                categories: 'general,politics,world',
                limit: 25,
                sort: 'published_desc',
            },
        });

        if (response.data?.data) {
            for (const art of response.data.data) {
                if (!art.title) continue;
                articles.push({
                    title: art.title,
                    description: art.description || '',
                    url: art.url,
                    imageUrl: art.image || null,
                    sourceName: art.source || 'Mediastack',
                    sourceType: 'mediastack',
                    sourceReliability: 7,
                    sourceLang: art.language || 'en',
                    originalDate: art.published_at ? new Date(art.published_at) : new Date(),
                });
            }
        }

        logger.info(`[Mediastack] ✅ ${articles.length} articles collectés`);
    } catch (error) {
        logger.warn(`[Mediastack] Erreur: ${error.message}`);
    }

    return articles;
}

module.exports = { collectMediastack };
