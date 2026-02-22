/**
 * src/collectors/USGSCollector.js
 * Collecteur de séismes USGS (US Geological Survey)
 * Gratuit, sans clé API, fiabilité 10/10
 */

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const USGS_ENDPOINTS = {
    significant: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson',
    m45: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
};

const TIMEOUT = 10000;

/**
 * Convertit un feature USGS en article WorldMonitor
 * @param {object} feature - Feature GeoJSON USGS
 * @returns {object} Article normalisé
 */
function featureToArticle(feature) {
    const props = feature.properties;
    const magnitude = props.mag;
    const place = props.place || 'Localisation inconnue';
    const time = new Date(props.time);

    // Description détaillée
    const title = `Séisme M${magnitude.toFixed(1)} - ${place}`;
    const description = [
        `Magnitude ${magnitude.toFixed(1)} à ${place}.`,
        props.depth ? `Profondeur: ${props.depth} km.` : '',
        props.tsunami ? '⚠️ Alerte tsunami émise.' : '',
        `Ressenti: ${props.felt || 0} personnes.`,
    ].filter(Boolean).join(' ');

    // Gravité basée sur la magnitude
    let severity = 'low';
    if (magnitude >= 8.0) severity = 'critical';
    else if (magnitude >= 7.0) severity = 'high';
    else if (magnitude >= 6.0) severity = 'medium';
    else if (magnitude >= 4.5) severity = 'low';

    return {
        title,
        description,
        url: props.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${props.ids?.split(',')[0] || 'unknown'}`,
        imageUrl: null,
        sourceName: 'USGS Earthquakes',
        sourceType: 'usgs',
        sourceReliability: 10,
        sourceLang: 'en',
        category: 'natural_disasters',
        severity,
        originalDate: time,
        coordinates: feature.geometry?.coordinates || [],
        usgsExtra: {
            magnitude,
            place,
            depth: props.depth,
            tsunami: props.tsunami === 1,
            felt: props.felt,
            type: props.type,
        },
    };
}

/**
 * Collecte les séismes USGS
 * @returns {Promise<Array>}
 */
async function collectUSGS() {
    logger.info('[USGS] 🔄 Collecte des séismes...');
    const articles = [];

    try {
        // Séismes significatifs de l'heure
        const sigResponse = await axios.get(USGS_ENDPOINTS.significant, { timeout: TIMEOUT });
        if (sigResponse.data?.features) {
            for (const feature of sigResponse.data.features) {
                if (feature.properties.mag >= 4.0) {
                    articles.push(featureToArticle(feature));
                }
            }
        }

        // Séismes M4.5+ du jour (si peu de significatifs)
        if (articles.length === 0) {
            const m45Response = await axios.get(USGS_ENDPOINTS.m45, { timeout: TIMEOUT });
            if (m45Response.data?.features) {
                // Prendre seulement les M5.0+ pour ne pas flooder
                const strong = m45Response.data.features
                    .filter(f => f.properties.mag >= 5.0)
                    .slice(0, 10);
                for (const feature of strong) {
                    articles.push(featureToArticle(feature));
                }
            }
        }

        logger.info(`[USGS] ✅ ${articles.length} séismes collectés`);
    } catch (error) {
        logger.warn(`[USGS] ❌ Erreur: ${error.message}`);
    }

    return articles;
}

module.exports = { collectUSGS };
