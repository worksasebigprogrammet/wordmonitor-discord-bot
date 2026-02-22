/**
 * src/collectors/CollectorManager.js
 * Gestionnaire principal des collecteurs
 * Orchestre la file d'attente, le scheduling et le traitement de tous les articles
 */

'use strict';

const cron = require('node-cron');
const logger = require('../utils/logger');
const { collectionQueue, PRIORITY_MAP } = require('../utils/queue');
const { INTERVALS } = require('../config/constants');

// Collecteurs
const { collectRSS } = require('./RSSCollector');
const { collectGoogleNews } = require('./GoogleNewsCollector');
const { collectGDELT } = require('./GDELTCollector');
const { collectTwitter } = require('./TwitterCollector');
const { collectUSGS } = require('./USGSCollector');
const { collectWeather } = require('./WeatherCollector');
const { collectNetBlocks } = require('./NetBlocksCollector');
const { collectReliefWeb } = require('./ReliefWebCollector');
const { collectNewsAPI } = require('./NewsAPICollector');
const { collectMediastack } = require('./MediastackCollector');
const { collectCurrentsAPI } = require('./CurrentsAPICollector');
const { collectLiveuamap } = require('./LiveuamapCollector');

// Processeurs (chargés dynamiquement pour éviter les dépendances circulaires)
let processArticles = null;

/**
 * Initialise le processeur (chargé après coup pour éviter les dépendances circulaires)
 * @param {Function} processor
 */
function setProcessor(processor) {
    processArticles = processor;
}

// Statistiques de la session
const stats = {
    lastRun: null,
    totalArticles: 0,
    totalPublished: 0,
    cycleCount: 0,
    errors: 0,
};

// Indicateur si un cycle est en cours (pour éviter les chevauchements)
let isRunning = false;

// Zones chaudes (pays avec beaucoup d'événements récents)
const hotZones = new Map(); // countryCode → { count, lastEvent }

/**
 * Marque un pays comme zone chaude si threshold atteint
 * @param {string} countryCode
 */
function trackHotZone(countryCode) {
    if (!countryCode) return;
    const entry = hotZones.get(countryCode) || { count: 0, lastEvent: null, isHot: false };

    // Réinitialiser le compteur si plus d'une heure
    if (entry.lastEvent && (Date.now() - entry.lastEvent) > 3_600_000) {
        entry.count = 0;
        entry.isHot = false;
    }

    entry.count++;
    entry.lastEvent = Date.now();

    // Seuil: 10 événements en 1h = zone chaude
    if (entry.count >= 10 && !entry.isHot) {
        entry.isHot = true;
        logger.warn(`[CollectorManager] 🔥 Zone chaude détectée: ${countryCode} (${entry.count} événements en 1h)`);
    }

    hotZones.set(countryCode, entry);
}

/**
 * Obtient la liste des zones chaudes actuelles
 * @returns {Array<string>} Codes pays des zones chaudes
 */
function getHotZones() {
    const zones = [];
    for (const [code, data] of hotZones.entries()) {
        if (data.isHot) zones.push(code);
    }
    return zones;
}

/**
 * Exécute un cycle complet de collecte
 * Ordre de priorité: RSS → Google News → GDELT → Twitter → APIs optionnelles
 */
async function runCollectionCycle() {
    if (isRunning) {
        logger.debug('[CollectorManager] Cycle déjà en cours, skip');
        return;
    }

    if (!processArticles) {
        logger.warn('[CollectorManager] Processeur non initialisé, skip');
        return;
    }

    isRunning = true;
    stats.cycleCount++;
    stats.lastRun = new Date();

    logger.info(`[CollectorManager] 🔄 Cycle #${stats.cycleCount} démarré`);
    const cycleStart = Date.now();
    let cycleArticles = 0;

    try {
        // ─── Priorité 1: RSS (source principale la plus stable) ──────────────
        const rssArticles = await collectRSS({ maxFeeds: 30 }); // Max 30 feeds par cycle
        const rssProcessed = await processArticles(rssArticles, 'rss');
        cycleArticles += rssProcessed;

        // ─── Priorité 2: Google News ──────────────────────────────────────────
        const gnArticles = await collectGoogleNews();
        const gnProcessed = await processArticles(gnArticles, 'google_news');
        cycleArticles += gnProcessed;

        // ─── Collecte spécialisée: USGS ───────────────────────────────────────
        const usgsArticles = await collectUSGS();
        const usgsProcessed = await processArticles(usgsArticles, 'usgs');
        cycleArticles += usgsProcessed;

        // ─── Priorité 3: GDELT (avec throttle) ───────────────────────────────
        const gdeltArticles = await collectGDELT();
        const gdeltProcessed = await processArticles(gdeltArticles, 'gdelt');
        cycleArticles += gdeltProcessed;

        // ─── Priorité 4: Twitter (peut échouer sans impact) ───────────────────
        const twitterArticles = await collectTwitter();
        const twitterProcessed = await processArticles(twitterArticles, 'twitter');
        cycleArticles += twitterProcessed;

        // ─── Sources spécialisées ─────────────────────────────────────────────
        const weatherArticles = await collectWeather();
        await processArticles(weatherArticles, 'weather');

        const netblocksArticles = await collectNetBlocks();
        await processArticles(netblocksArticles, 'netblocks');

        // ReliefWeb toutes les 30 minutes seulement
        if (stats.cycleCount % 6 === 0) {
            const reliefwebArticles = await collectReliefWeb();
            await processArticles(reliefwebArticles, 'reliefweb');
        }

        // ─── APIs optionnelles (si quotas disponibles) ────────────────────────
        // Liveuamap toutes les 2 cycles
        if (stats.cycleCount % 2 === 0) {
            const liveuamapArticles = await collectLiveuamap();
            await processArticles(liveuamapArticles, 'liveuamap');
        }

        // NewsAPI toutes les 4h pour économiser le quota
        if (stats.cycleCount % 48 === 0 && process.env.NEWSAPI_KEY) {
            const newsAPIArticles = await collectNewsAPI();
            await processArticles(newsAPIArticles, 'newsapi');
        }

        // Mediastack une fois par jour
        if (stats.cycleCount % 288 === 0 && process.env.MEDIASTACK_API) {
            const mediastackArticles = await collectMediastack();
            await processArticles(mediastackArticles, 'mediastack');
        }

        // CurrentsAPI toutes les 4h
        if (stats.cycleCount % 48 === 0 && process.env.CURRENTS_API) {
            const currentsArticles = await collectCurrentsAPI();
            await processArticles(currentsArticles, 'currentsapi');
        }

    } catch (error) {
        stats.errors++;
        logger.error(`[CollectorManager] ❌ Erreur cycle #${stats.cycleCount}: ${error.message}`);
    } finally {
        isRunning = false;
        const duration = ((Date.now() - cycleStart) / 1000).toFixed(1);
        stats.totalArticles += cycleArticles;
        logger.info(`[CollectorManager] ✅ Cycle #${stats.cycleCount} terminé en ${duration}s (${cycleArticles} articles traités)`);
    }
}

/**
 * Démarre le scheduling automatique des cycles de collecte
 */
function startScheduler() {
    const intervalMinutes = Math.floor(INTERVALS.SCRAPE / 60_000);

    // Cycle toutes les N minutes (défaut: 5)
    cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
        await runCollectionCycle();
    });

    logger.info(`[CollectorManager] ⏰ Scheduler démarré - Cycle toutes les ${intervalMinutes} minutes`);
}

/**
 * Obtient les statistiques du cycle de collecte
 */
function getStats() {
    return {
        ...stats,
        isRunning,
        hotZones: Array.from(hotZones.entries())
            .filter(([, v]) => v.isHot)
            .map(([k, v]) => ({ country: k, count: v.count })),
    };
}

module.exports = {
    runCollectionCycle,
    startScheduler,
    setProcessor,
    trackHotZone,
    getHotZones,
    getStats,
};
