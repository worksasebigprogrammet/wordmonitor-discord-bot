/**
 * src/collectors/GdeltCollector.js
 * Collecteur d'articles depuis l'API GDELT v2
 *
 * Exporte : collect()
 * Source : https://api.gdeltproject.org/api/v2/doc/doc
 * Retourne [] si l'API est indisponible (she est souvent instable)
 */

'use strict';

const logger = require('../utils/logger');

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';
const TIMEOUT_MS = 10_000;

// Requêtes GDELT pour différents thèmes géopolitiques
const GDELT_QUERIES = [
    { q: 'war OR conflict OR crisis OR military', category: 'conflicts' },
    { q: 'sanctions OR ceasefire OR diplomacy OR treaty', category: 'diplomacy' },
    { q: 'nuclear OR missile OR weapons', category: 'nuclear_wmd' },
];

// Déduplication par URL
const seenUrls = new Set();
setInterval(() => seenUrls.clear(), 3_600_000 * 3); // Reset toutes les 3h

/**
 * Interroge l'API GDELT avec une requête donnée
 * @param {string} query - Requête de recherche
 * @param {string} category - Catégorie WorldMonitor
 * @returns {Promise<Array>}
 */
async function queryGdelt(query, category) {
    const params = new URLSearchParams({
        query,
        mode: 'artlist',
        maxrecords: '25',
        sort: 'DateDesc',
        format: 'json',
    });

    const url = `${GDELT_BASE}?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'WorldMonitor/2.0' },
        });
        clearTimeout(timeout);

        if (!response.ok) {
            logger.debug(`[GdeltCollector] HTTP ${response.status} pour "${query}"`);
            return [];
        }

        const text = await response.text();
        if (!text?.trim()) return [];

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            // GDELT renvoie parfois du HTML d'erreur au lieu de JSON
            logger.debug(`[GdeltCollector] Réponse non-JSON pour "${query}"`);
            return [];
        }

        const articles = data?.articles || [];
        const results = [];

        for (const article of articles) {
            const url2 = article.url;
            if (!url2 || seenUrls.has(url2)) continue;
            seenUrls.add(url2);

            let publishedAt;
            try {
                // GDELT format: "20240115T120000Z"
                publishedAt = article.seendate
                    ? new Date(article.seendate.replace(
                        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
                        '$1-$2-$3T$4:$5:$6Z'
                    ))
                    : new Date();
                if (isNaN(publishedAt.getTime())) publishedAt = new Date();
            } catch {
                publishedAt = new Date();
            }

            results.push({
                title: (article.title || '').trim().substring(0, 500),
                description: (article.title || '').substring(0, 500), // GDELT ne donne que le titre
                url: url2,
                source: article.domain || 'GDELT',
                sourceName: article.domain || 'GDELT',
                sourceReliability: 7,
                publishedAt,
                lang: article.language === 'French' ? 'fr' : 'en',
                category,
                reliability: 7,
                country: article.sourcecountry || '',
                continent: '',
                raw: article,
            });
        }

        return results;
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            logger.debug(`[GdeltCollector] Timeout pour "${query}"`);
        } else {
            logger.debug(`[GdeltCollector] Erreur: ${error.message}`);
        }
        return [];
    }
}

/**
 * Collecte les événements depuis GDELT (multiples requêtes)
 * @returns {Promise<Array>} Tableau d'articles standardisés
 */
async function collect() {
    try {
        // Exécuter les requêtes en parallèle mais ne pas faire échouer si l'une plante
        const results = await Promise.allSettled(
            GDELT_QUERIES.map(q => queryGdelt(q.q, q.category))
        );

        const articles = results
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value);

        if (articles.length > 0) {
            logger.debug(`[GdeltCollector] ${articles.length} article(s) collected`);
        }

        return articles;
    } catch (error) {
        logger.debug(`[GdeltCollector] Erreur globale: ${error.message}`);
        return [];
    }
}

module.exports = { collect };
