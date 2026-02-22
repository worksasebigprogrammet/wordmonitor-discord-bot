/**
 * src/collectors/NewsAPICollector.js
 * Collecteur NewsAPI.org (optionnel, 100 req/jour gratuit)
 * Activé uniquement si la clé NEWSAPI_KEY est fournie
 */

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://newsapi.org/v2';
const TIMEOUT = 10000;

// Requêtes périodiques (espacées pour respecter le quota de 100/jour)
const QUERIES = [
    { q: 'war conflict military', lang: 'en' },
    { q: 'nuclear weapon missile', lang: 'en' },
    { q: 'earthquake tsunami disaster', lang: 'en' },
];

async function collectNewsAPI() {
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) return [];

    logger.info('[NewsAPI] 🔄 Collecte NewsAPI...');
    const articles = [];

    try {
        const response = await axios.get(`${BASE_URL}/top-headlines`, {
            timeout: TIMEOUT,
            params: { apiKey, language: 'en', pageSize: 20, category: 'general' },
        });

        if (response.data?.articles) {
            for (const art of response.data.articles) {
                if (!art.title || art.title === '[Removed]') continue;
                articles.push({
                    title: art.title,
                    description: art.description || art.content || '',
                    url: art.url,
                    imageUrl: art.urlToImage || null,
                    sourceName: art.source?.name || 'NewsAPI',
                    sourceType: 'newsapi',
                    sourceReliability: 8,
                    sourceLang: 'en',
                    originalDate: art.publishedAt ? new Date(art.publishedAt) : new Date(),
                });
            }
        }

        logger.info(`[NewsAPI] ✅ ${articles.length} articles collectés`);
    } catch (error) {
        logger.warn(`[NewsAPI] Erreur: ${error.message}`);
    }

    return articles;
}

module.exports = { collectNewsAPI };
