/**
 * src/collectors/UsgsCollector.js
 * Collecteur de séismes depuis l'API USGS (GeoJSON)
 *
 * Exporte : collect()
 * Source : https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson
 * Ne retourne que les séismes de magnitude >= 4.5
 */

'use strict';

const logger = require('../utils/logger');

const USGS_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';
const TIMEOUT_MS = 8_000;
const MIN_MAGNITUDE = 4.5;

// Déduplication entre cycles (hash = id USGS)
const seenIds = new Set();
setInterval(() => seenIds.clear(), 3_600_000 * 6); // Reset toutes les 6h

/**
 * Détermine la sévérité en fonction de la magnitude
 * @param {number} mag
 * @returns {string}
 */
function magnitudeToSeverity(mag) {
    if (mag >= 7.0) return 'critical';
    if (mag >= 6.0) return 'high';
    if (mag >= 5.0) return 'medium';
    return 'low';
}

/**
 * Déduit grossièrement le continent depuis les coordonnées
 * @param {number} lon
 * @param {number} lat
 * @returns {string}
 */
function coordsToContinent(lon, lat) {
    if (lat > 35 && lon > -30 && lon < 60) return 'europe';
    if (lat > 10 && lon > 25 && lon < 65) return 'middle_east';
    if (lat > -10 && lon > 60 && lon < 180) return 'asia';
    if (lat < 37 && lon > -20 && lon < 55) return 'africa';
    if (lon > -170 && lon < -30) return 'americas';
    return 'unknown';
}

/**
 * Déduit le nom de pays ou région depuis le champ "place" USGS
 * @param {string} place - Ex: "15 km NE of Istanbul, Turkey"
 * @returns {string}
 */
function extractCountry(place) {
    if (!place) return '';
    // Le pays est souvent après la dernière virgule
    const parts = place.split(',');
    return parts[parts.length - 1]?.trim() || place;
}

/**
 * Collecte les séismes significatifs depuis l'API USGS
 * @returns {Promise<Array>} Tableau d'articles standardisés
 */
async function collect() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(USGS_URL, {
            signal: controller.signal,
            headers: { 'User-Agent': 'WorldMonitor/2.0' },
        });
        clearTimeout(timeout);

        if (!response.ok) {
            logger.debug(`[UsgsCollector] HTTP ${response.status}`);
            return [];
        }

        const data = await response.json();
        const features = data?.features || [];

        const articles = [];

        for (const feature of features) {
            const props = feature.properties || {};
            const coords = feature.geometry?.coordinates || [];
            const id = feature.id;

            const mag = props.mag;
            if (!mag || mag < MIN_MAGNITUDE) continue;

            // Déduplication
            if (id && seenIds.has(id)) continue;
            if (id) seenIds.add(id);

            const place = props.place || 'Localisation inconnue';
            const country = extractCountry(place);
            const [lon, lat] = coords;
            const continent = coordsToContinent(lon || 0, lat || 0);
            const severity = magnitudeToSeverity(mag);
            const depth = coords[2] ? Math.round(coords[2]) : '?';

            const publishedAt = props.time ? new Date(props.time) : new Date();

            const title = `🌍 M${mag.toFixed(1)} — ${place}`;
            const description =
                `Séisme de magnitude **${mag.toFixed(1)}** détecté à ${place}. ` +
                `Profondeur : ${depth} km. ` +
                (props.tsunami === 1 ? '⚠️ **Alerte tsunami déclenchée.** ' : '') +
                `Données USGS — ${publishedAt.toISOString()}`;

            articles.push({
                title,
                description,
                url: props.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
                source: 'USGS',
                sourceName: 'USGS Earthquakes',
                sourceReliability: 10,
                publishedAt,
                lang: 'en',
                category: 'natural_disasters',
                continent,
                country,
                severity,
                reliability: 10,
                magnitude: mag,
                coordinates: [lon, lat],
                tsunami: props.tsunami === 1,
                raw: feature,
            });
        }

        if (articles.length > 0) {
            logger.debug(`[UsgsCollector] ${articles.length} séisme(s) M${MIN_MAGNITUDE}+`);
        }

        return articles;
    } catch (error) {
        if (error.name === 'AbortError') {
            logger.debug('[UsgsCollector] Timeout');
        } else {
            logger.debug(`[UsgsCollector] Erreur: ${error.message}`);
        }
        return [];
    }
}

module.exports = { collect };
