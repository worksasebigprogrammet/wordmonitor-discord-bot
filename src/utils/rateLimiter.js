/**
 * src/utils/rateLimiter.js
 * Rate limiter pour les APIs externes et Discord
 * Gère les quotas par source et par API
 */

'use strict';

const logger = require('./logger');

/**
 * Rate limiter simple basé sur token bucket
 */
class RateLimiter {
    /**
     * @param {number} maxRequests - Nombre max de requêtes
     * @param {number} windowMs - Fenêtre temporelle en ms
     * @param {string} name - Nom pour le logging
     */
    constructor(maxRequests, windowMs, name = 'API') {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.name = name;
        this._requests = [];
    }

    /**
     * Attendre jusqu'à ce qu'une requête puisse être faite
     * @returns {Promise<void>}
     */
    async waitForSlot() {
        const now = Date.now();
        // Nettoyer les requêtes expirées
        this._requests = this._requests.filter(t => now - t < this.windowMs);

        if (this._requests.length >= this.maxRequests) {
            // Calculer le temps d'attente
            const oldestRequest = Math.min(...this._requests);
            const waitTime = this.windowMs - (now - oldestRequest) + 100;
            logger.debug(`[RateLimit] ${this.name}: attente de ${Math.ceil(waitTime / 1000)}s`);
            await sleep(waitTime);
            return this.waitForSlot(); // Récursion après attente
        }

        this._requests.push(Date.now());
    }

    /**
     * Vérifie si une requête peut être faite immédiatement
     * @returns {boolean}
     */
    canRequest() {
        const now = Date.now();
        this._requests = this._requests.filter(t => now - t < this.windowMs);
        return this._requests.length < this.maxRequests;
    }

    /**
     * Nombre de requêtes restantes dans la fenêtre
     */
    get remaining() {
        const now = Date.now();
        const active = this._requests.filter(t => now - t < this.windowMs).length;
        return Math.max(0, this.maxRequests - active);
    }

    reset() {
        this._requests = [];
    }
}

/**
 * Utilitaire sleep
 * @param {number} ms - Durée en millisecondes
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Rate limiters prédéfinis ─────────────────────────────────────────────────
const rateLimiters = {
    // Discord: 30 msg/min (conservatif)
    discord: new RateLimiter(25, 60_000, 'Discord'),
    // GDELT: 1 req/sec
    gdelt: new RateLimiter(1, 1_000, 'GDELT'),
    // USGS: 10 req/min (pas de limite stricte mais on est polis)
    usgs: new RateLimiter(10, 60_000, 'USGS'),
    // Google News: 5 req/min (scraping, on est très conservatifs)
    googleNews: new RateLimiter(5, 60_000, 'GoogleNews'),
    // DeepL Free: 500K chars/mois → environ 1 req/2s pour être safe
    deepl: new RateLimiter(1, 2_000, 'DeepL'),
    // NewsAPI: 100/jour → 1 toutes les 14.4 min
    newsapi: new RateLimiter(1, 14_400_000 / 100 * 100, 'NewsAPI'),
    // Generic scraping
    scraper: new RateLimiter(10, 60_000, 'Scraper'),
};

/**
 * Exécute une fonction avec rate limiting
 * @param {string} limiterName - Nom du rate limiter
 * @param {Function} fn - Fonction async à exécuter
 * @returns {Promise} Résultat de la fonction
 */
async function withRateLimit(limiterName, fn) {
    const limiter = rateLimiters[limiterName];
    if (limiter) {
        await limiter.waitForSlot();
    }
    return fn();
}

module.exports = {
    RateLimiter,
    rateLimiters,
    withRateLimit,
    sleep,
};
