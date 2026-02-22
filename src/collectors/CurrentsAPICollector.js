/**
 * src/collectors/CurrentsAPICollector.js
 * Collecteur CurrentsAPI (optionnel, 600 req/jour gratuit)
 */

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

async function collectCurrentsAPI() {
    const apiKey = process.env.CURRENTS_API;
    if (!apiKey) return [];

    logger.info('[CurrentsAPI] 🔄 Collecte CurrentsAPI...');
    const articles = [];

    try {
        const response = await axios.get('https://api.currentsapi.services/v1/latest-news', {
            timeout: 10000,
            params: { apiKey, language: 'en', limit: 20 },
        });

        if (response.data?.news) {
            for (const art of response.data.news) {
                if (!art.title) continue;
                articles.push({
                    title: art.title,
                    description: art.description || '',
                    url: art.url,
                    imageUrl: art.image || null,
                    sourceName: 'CurrentsAPI',
                    sourceType: 'currentsapi',
                    sourceReliability: 7,
                    sourceLang: art.language || 'en',
                    originalDate: art.published ? new Date(art.published) : new Date(),
                });
            }
        }

        logger.info(`[CurrentsAPI] ✅ ${articles.length} articles collectés`);
    } catch (error) {
        logger.warn(`[CurrentsAPI] Erreur: ${error.message}`);
    }

    return articles;
}

module.exports = { collectCurrentsAPI };
