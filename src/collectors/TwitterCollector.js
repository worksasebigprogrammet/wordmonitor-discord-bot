/**
 * src/collectors/TwitterCollector.js
 * Collecteur Twitter/X scraping (Priorité 4)
 * Note: Si le scraping est bloqué, le bot continue sans Twitter
 * Utilise nitter.net (mirror de Twitter) si disponible
 */

'use strict';

const RSSParser = require('rss-parser');
const axios = require('axios');
const logger = require('../utils/logger');
const { sleep } = require('../utils/rateLimiter');
const { ALL_TWITTER_ACCOUNTS } = require('../config/sources');

// Instances Nitter publiques (miroirs Twitter)
const NITTER_INSTANCES = [
    'https://nitter.privacydev.net',
    'https://nitter.poast.org',
    'https://nitter.cz',
    'https://nitter.unixfox.eu',
];

let currentNitterIndex = 0;

const parser = new RSSParser({
    timeout: 8000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
    },
});

/**
 * Obtient l'instance Nitter active (rotation si erreur)
 * @returns {string}
 */
function getCurrentNitter() {
    return NITTER_INSTANCES[currentNitterIndex % NITTER_INSTANCES.length];
}

/**
 * Tourne vers l'instance Nitter suivante en cas d'erreur
 */
function rotateNitter() {
    currentNitterIndex = (currentNitterIndex + 1) % NITTER_INSTANCES.length;
}

/**
 * Teste si Nitter est accessible
 * @returns {Promise<boolean>}
 */
async function isNitterAvailable() {
    try {
        const response = await axios.get(getCurrentNitter(), {
            timeout: 5000,
            validateStatus: s => s < 500,
        });
        return response.status < 400;
    } catch {
        return false;
    }
}

/**
 * Scrape le flux RSS d'un compte Twitter via Nitter
 * @param {string} handle - Handle Twitter (avec @)
 * @returns {Promise<Array>}
 */
async function fetchTwitterAccount(handle) {
    const username = handle.replace('@', '');
    const nitter = getCurrentNitter();
    const url = `${nitter}/${username}/rss`;

    try {
        const feed = await parser.parseURL(url);
        const tweets = (feed.items || []).slice(0, 5).map(item => {
            // Nettoyer le contenu du tweet
            const content = item.contentSnippet || item.content || item.title || '';
            const cleanContent = content
                .replace(/<[^>]+>/g, '') // Supprimer HTML
                .replace(/RT @\w+:/i, '') // Supprimer les RT
                .trim();

            if (cleanContent.length < 20) return null; // Trop court

            return {
                title: cleanContent.substring(0, 200),
                description: cleanContent,
                url: item.link || `https://x.com/${username}`,
                imageUrl: null,
                sourceName: `@${username} (Twitter)`,
                sourceType: 'twitter',
                sourceReliability: 7,
                sourceLang: 'en', // On suppose EN par défaut
                originalDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                twitterHandle: handle,
            };
        }).filter(Boolean);

        return tweets;
    } catch (error) {
        // Si Nitter bloqué, tourner vers l'instance suivante
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.response?.status === 429) {
            rotateNitter();
            logger.debug(`[Twitter] Instance Nitter rotée → ${getCurrentNitter()}`);
        }
        logger.debug(`[Twitter] Impossible de scraper @${username}: ${error.message}`);
        return [];
    }
}

/**
 * Collecte Twitter pour tous les comptes configurés
 * @returns {Promise<Array>}
 */
async function collectTwitter() {
    // Vérifier si Nitter est disponible
    const available = await isNitterAvailable();
    if (!available) {
        logger.warn('[Twitter] ⚠️ Nitter non disponible - Skip Twitter (le bot continue sans)');
        return [];
    }

    logger.info(`[Twitter] 🔄 Collecte Twitter (${ALL_TWITTER_ACCOUNTS.length} comptes)...`);
    const allTweets = [];
    let errors = 0;

    // Prendre un sous-ensemble pour ne pas prendre trop de temps
    const priorityAccounts = ALL_TWITTER_ACCOUNTS.filter(a =>
        ['osint_military', 'breaking_news'].includes(a.group)
    );

    for (const account of priorityAccounts.slice(0, 20)) { // Max 20 comptes par cycle
        const tweets = await fetchTwitterAccount(account.handle);
        allTweets.push(...tweets);

        if (tweets.length === 0) errors++;
        if (errors >= 5) {
            logger.warn('[Twitter] Trop d\'erreurs consécutives, arrêt de la collecte Twitter');
            break;
        }

        await sleep(1500); // Délai entre les comptes
    }

    logger.info(`[Twitter] ✅ ${allTweets.length} tweets collectés`);
    return allTweets;
}

module.exports = { collectTwitter, fetchTwitterAccount };
