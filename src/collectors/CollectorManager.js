/**
 * src/collectors/CollectorManager.js
 * Gestionnaire de collecte en flux continu
 *
 * V2 — Polling staggeré (Enhancement 1) :
 * - RSS  : groupes de 5 feeds, toutes les 10s → cycle complet ~60-90s
 * - USGS : toutes les 3 min
 * - GDELT: toutes les 2 min
 * - Google News: toutes les 2 min
 * - Dès qu'un article est détecté → traitement et publication immédiate
 */

'use strict';

const cron = require('node-cron');
const logger = require('../utils/logger');
const { processArticle } = require('../processors/ArticleProcessor');
const { ALL_RSS_FEEDS } = require('../config/sources');
const { BOT_LIMITS } = require('../config/constants');

// Import paresseux des collecteurs pour éviter les dépendances circulaires
let RssCollector, GdeltCollector, UsgsCollector, GoogleNewsCollector;

function loadCollectors() {
    if (!RssCollector) {
        try { RssCollector = require('./RSSCollector'); } catch { logger.warn('[CM] RssCollector manquant'); }
        try { GdeltCollector = require('./GDELTCollector'); } catch { logger.warn('[CM] GdeltCollector manquant'); }
        try { UsgsCollector = require('./USGSCollector'); } catch { logger.warn('[CM] UsgsCollector manquant'); }
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
        articlesPublished: 0,
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

async function collectRssGroup(feedGroup) {
    if (!RssCollector) return;

    await Promise.allSettled(feedGroup.map(async (feed) => {
        try {
            const articles = await RssCollector.collectFeed(feed);
            if (articles?.length > 0) {
                state.stats.articlesFound += articles.length;
                for (const article of articles.slice(0, BOT_LIMITS.MAX_NEWS_PER_CYCLE)) {
                    await processArticle(article).catch(err =>
                        logger.debug(`[CM] Erreur traitement article: ${err.message}`)
                    );
                    if (article.country) {
                        const count = (state.hotZones.get(article.country) || 0) + 1;
                        state.hotZones.set(article.country, count);
                    }
                }
                logger.debug(`[CM] ✅ ${feed.name}: ${articles.length} article(s)`);
            }
            state.stats.rssPolled++;
        } catch (err) {
            state.stats.errors++;
            logger.debug(`[CM] ❌ ${feed.name}: ${err.message}`);
        }
    }));
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
            for (const article of articles) {
                await processArticle(article).catch(() => { });
            }
            logger.debug(`[CM] 🌍 USGS: ${articles.length} séisme(s)`);
        }
    } catch (err) {
        state.stats.errors++;
        logger.debug(`[CM] USGS erreur: ${err.message}`);
    }
}

async function collectGdelt() {
    if (!GdeltCollector) return;
    try {
        const articles = await GdeltCollector.collect();
        if (articles?.length > 0) {
            state.stats.articlesFound += articles.length;
            for (const article of articles.slice(0, 30)) {
                await processArticle(article).catch(() => { });
            }
            logger.debug(`[CM] 🌐 GDELT: ${articles.length} événement(s)`);
        }
    } catch (err) {
        state.stats.errors++;
        logger.debug(`[CM] GDELT erreur: ${err.message}`);
    }
}

async function collectGoogleNews() {
    if (!GoogleNewsCollector) return;
    try {
        const articles = await GoogleNewsCollector.collect();
        if (articles?.length > 0) {
            state.stats.articlesFound += articles.length;
            for (const article of articles.slice(0, 20)) {
                await processArticle(article).catch(() => { });
            }
            logger.debug(`[CM] 🔍 Google News: ${articles.length} article(s)`);
        }
    } catch (err) {
        state.stats.errors++;
        logger.debug(`[CM] Google News erreur: ${err.message}`);
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
