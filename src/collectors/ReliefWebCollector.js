/**
 * src/collectors/ReliefWebCollector.js
 * Collecteur ReliefWeb (catastrophes humanitaires)
 * Gratuit, sans clé API, fiabilité 10/10
 */

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.reliefweb.int/v1';
const TIMEOUT = 10000;

async function collectReliefWeb() {
    logger.info('[ReliefWeb] 🔄 Collecte des catastrophes humanitaires...');
    const articles = [];

    try {
        // Disasters récents
        const response = await axios.get(`${BASE_URL}/disasters`, {
            timeout: TIMEOUT,
            params: {
                appname: 'worldmonitor',
                'sort[]': 'date:desc',
                limit: 20,
                'fields[include][]': ['name', 'description', 'url', 'date', 'type', 'country', 'status'],
            },
        });

        if (response.data?.data) {
            for (const item of response.data.data) {
                const fields = item.fields;
                const country = fields.country?.[0]?.name || '';
                const type = fields.type?.[0]?.name || 'Catastrophe';

                articles.push({
                    title: fields.name || `Urgence humanitaire: ${type}`,
                    description: fields.description?.slice(0, 500) || `${type} en ${country}`,
                    url: fields.url || `https://reliefweb.int/disaster/${item.id}`,
                    imageUrl: null,
                    sourceName: 'ReliefWeb (OCHA)',
                    sourceType: 'reliefweb',
                    sourceReliability: 10,
                    sourceLang: 'en',
                    category: 'natural_disasters',
                    originalDate: fields.date?.created ? new Date(fields.date.created) : new Date(),
                });
            }
        }

        logger.info(`[ReliefWeb] ✅ ${articles.length} événements humanitaires collectés`);
    } catch (error) {
        logger.warn(`[ReliefWeb] Erreur: ${error.message}`);
    }

    return articles;
}

module.exports = { collectReliefWeb };
