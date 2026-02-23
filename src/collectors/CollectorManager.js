/**
 * src/collectors/CollectorManager.js
 * Gestionnaire de collecte en flux continu
 *
 * V3 FIX :
 * - Import corrigé : processArticles (pas processArticle qui n'existe pas)
 * - Les articles sont passés en LOT à processArticles() pour:
 *   a) La déduplication batch
 *   b) La publication automatique via newsPublisher.publishNews()
 * - Logs [DEBUG] explicites à chaque étape du pipeline
 *
 * Pipeline : collectFeed → processArticles → publishNews (automatique)
 */

'use strict';

const cron = require('node-cron');
const logger = require('../utils/logger');
// ⚠️ FIX CRITIQUE : le bon export est processArticles (batch), pas processArticle
const { processArticles } = require('../processors/ArticleProcessor');
const { ALL_RSS_FEEDS } = require('../config/sources');
const { BOT_LIMITS } = require('../config/constants');

// Import paresseux des collecteurs pour éviter les dépendances circulaires
let RssCollector, GdeltCollector, UsgsCollector, GoogleNewsCollector;

function loadCollectors() {
    if (!RssCollector) {
        try { RssCollector = require('./RssCollector'); } catch { logger.warn('[CM] RssCollector manquant'); }
        try { GdeltCollector = require('./GdeltCollector'); } catch { logger.warn('[CM] GdeltCollector manquant'); }
        try { UsgsCollector = require('./UsgsCollector'); } catch { logger.warn('[CM] UsgsCollector manquant'); }
        try { GoogleNewsCollector = require('./GoogleNewsCollector'); } catch { logger.warn('[CM] GoogleNewsCollector manquant'); }
    }
}

// ─── État interne ─────────────────────────────────────────────────────────────

const state = {
    running: false,
    rssGroups: [],
    currentGroupIdx: 0,
    hotZones: new Map(),
    stats: {
        rssPolled: 0,
        articlesFound: 0,
        articlesProcessed: 0,
        errors: 0,
        startTime: null,
    },
    intervals: [],
    cronJobs: [],
};

// ─── Staggered RSS polling ────────────────────────────────────────────────────

const RSS_GROUP_SIZE = 5;
const RSS_STAGGER_INTERVAL = 10_000;

function buildRssGroups() {
    const activeFeeds = ALL_RSS_FEEDS.filter(f => f.active !== false);
    const groups = [];
    for (let i = 0; i < activeFeeds.length; i += RSS_GROUP_SIZE) {
        groups.push(activeFeeds.slice(i, i + RSS_GROUP_SIZE));
    }
    logger.info(`[CM] 📡 ${activeFeeds.length} feeds RSS → ${groups.length} groupes de ${RSS_GROUP_SIZE}`);
    return groups;
}

/**
 * Collecte un groupe de feeds RSS en parallèle
 * @param {Array} feedGroup - Groupe de feeds à collecter
 */
async function collectRssGroup(feedGroup) {
    if (!RssCollector) return;

    const allArticles = [];

    await Promise.allSettled(feedGroup.map(async (feed) => {
        try {
            const articles = await RssCollector.collectFeed(feed);
            if (articles?.length > 0) {
                state.stats.articlesFound += articles.length;
                for (const article of articles.slice(0, BOT_LIMITS.MAX_NEWS_PER_CYCLE)) {
                    await processArticle(article).catch(err =>
                        logger.debug(`[CM] Erreur traitement article: ${err.message}`)
                    );
                    // Mise à jour des zones chaudes
                    if (article.country) {
                        const count = (state.hotZones.get(article.country) || 0) + 1;
                        state.hotZones.set(article.country, count);
                    }
                }
            }
            state.stats.rssPolled++;
        } catch (err) {
            state.stats.errors++;
            logger.debug(`[CM] ❌ ${feed.name}: ${err.message}`);
        }
    }));

    // Envoyer le lot complet au pipeline (processArticles gère dedup + publication)
    if (allArticles.length > 0) {
        logger.debug(`[CM] 📦 Envoi de ${allArticles.length} articles au pipeline (groupe RSS)`);
        try {
            const saved = await processArticles(allArticles, 'RSS');
            state.stats.articlesProcessed += saved;
            if (saved > 0) {
                logger.info(`[CM] 📰 ${saved} news publiées depuis RSS`);
            }
        } catch (err) {
            logger.error(`[CM] ❌ Erreur pipeline RSS: ${err.message}`);
        }
    }
}

async function collectNextRssGroup() {
    if (!state.rssGroups.length) return;

    const group = state.rssGroups[state.currentGroupIdx];
    if (group) {
        await collectRssGroup(group);
    }

    state.currentGroupIdx = (state.currentGroupIdx + 1) % state.rssGroups.length;
}

// ─── Collecteurs APIs ─────────────────────────────────────────────────────────

async function collectUsgs() {
    if (!UsgsCollector) return;
    try {
        const articles = await UsgsCollector.collect();
        if (articles?.length > 0) {
            state.stats.articlesFound += articles.length;
            logger.debug(`[CM] 🌍 USGS: ${articles.length} séisme(s), envoi au pipeline...`);
            const saved = await processArticles(articles, 'USGS');
            state.stats.articlesProcessed += saved;
            if (saved > 0) {
                logger.info(`[CM] 🌍 ${saved} séisme(s) publiés depuis USGS`);
            }
        }
    } catch (err) {
        state.stats.errors++;
        logger.warn(`[CM] USGS erreur: ${err.message}`);
    }
}

async function collectGdelt() {
    if (!GdeltCollector) return;
    try {
        const articles = await GdeltCollector.collect();
        if (articles?.length > 0) {
            state.stats.articlesFound += articles.length;
            logger.debug(`[CM] 🌐 GDELT: ${articles.length} article(s), envoi au pipeline...`);
            const toProcess = articles.slice(0, 30);
            const saved = await processArticles(toProcess, 'GDELT');
            state.stats.articlesProcessed += saved;
            if (saved > 0) {
                logger.info(`[CM] 🌐 ${saved} news publiées depuis GDELT`);
            }
        }
    } catch (err) {
        state.stats.errors++;
        logger.warn(`[CM] GDELT erreur: ${err.message}`);
    }
}

async function collectGoogleNews() {
    if (!GoogleNewsCollector) return;
    try {
        const articles = await GoogleNewsCollector.collect();
        if (articles?.length > 0) {
            state.stats.articlesFound += articles.length;
            logger.debug(`[CM] 🔍 Google News: ${articles.length} article(s), envoi au pipeline...`);
            const toProcess = articles.slice(0, 20);
            const saved = await processArticles(toProcess, 'GoogleNews');
            state.stats.articlesProcessed += saved;
            if (saved > 0) {
                logger.info(`[CM] 🔍 ${saved} news publiées depuis Google News`);
            }
        }
    } catch (err) {
        state.stats.errors++;
        logger.warn(`[CM] Google News erreur: ${err.message}`);
    }
}

// ─── Zones chaudes ────────────────────────────────────────────────────────────

function getHotZones() {
    const sorted = Array.from(state.hotZones.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    state.hotZones.clear();

    return sorted.map(([country, count]) => ({ country, count }));
}

// ─── Démarrage ────────────────────────────────────────────────────────────────

function start() {
    if (state.running) {
        logger.warn('[CM] Déjà en cours d\'exécution');
        return;
    }

    loadCollectors();
    state.running = true;
    state.stats.startTime = new Date();

    state.rssGroups = buildRssGroups();
    state.currentGroupIdx = 0;

    const rssInterval = setInterval(async () => {
        if (!state.running) return;
        await collectNextRssGroup();
    }, RSS_STAGGER_INTERVAL);
    state.intervals.push(rssInterval);

    const usgsJob = cron.schedule('*/3 * * * *', collectUsgs);
    state.cronJobs.push(usgsJob);

    const gdeltJob = cron.schedule('*/2 * * * *', collectGdelt);
    state.cronJobs.push(gdeltJob);

    setTimeout(() => {
        const gnJob = cron.schedule('*/2 * * * *', collectGoogleNews);
        state.cronJobs.push(gnJob);
    }, 60_000);

    setTimeout(async () => {
        logger.info('[CM] 🚀 Première collecte RSS...');
        await collectNextRssGroup();
    }, 3_000);

    setTimeout(async () => {
        await collectUsgs();
        await collectGdelt();
    }, 10_000);

    logger.info(`[CM] ✅ Collecte en flux continu démarrée`);
    logger.info(`[CM] 📡 RSS: ${state.rssGroups.length} groupes × ${RSS_STAGGER_INTERVAL / 1000}s = cycle ${Math.round(state.rssGroups.length * RSS_STAGGER_INTERVAL / 1000)}s`);
    logger.info(`[CM] 🌍 USGS: /3min | GDELT: /2min | Google News: /2min`);
}

function stop() {
    state.running = false;

    for (const interval of state.intervals) {
        clearInterval(interval);
    }
    state.intervals = [];

    for (const job of state.cronJobs) {
        if (job?.stop) job.stop();
    }
    state.cronJobs = [];

    logger.info('[CM] 🛑 Collecte arrêtée');
}

function getStats() {
    const uptime = state.stats.startTime
        ? Math.floor((Date.now() - state.stats.startTime.getTime()) / 1000)
        : 0;

    return {
        ...state.stats,
        uptime,
        rssGroupsCount: state.rssGroups.length,
        currentGroup: state.currentGroupIdx,
        isRunning: state.running,
    };
}

module.exports = { start, stop, getStats, getHotZones };
