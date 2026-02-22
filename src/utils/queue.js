/**
 * src/utils/queue.js
 * File d'attente avec priorité pour le traitement des news
 * Utilise p-queue pour limiter la concurrence (une source à la fois)
 * Priorités: critical(4) > high(3) > medium(2) > low(1)
 */

'use strict';

const logger = require('./logger');

// Priorités numériques (plus élevé = traité en premier)
const PRIORITY_MAP = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    default: 1,
};

/**
 * File d'attente basée sur priorité (PriorityQueue simple)
 * Implémentation interne pour éviter les modules ESM
 */
class PriorityQueue {
    constructor() {
        this._queue = [];
        this._running = false;
        this._concurrency = 1; // Une tâche à la fois
    }

    /**
     * Ajouter une tâche à la file
     * @param {Function} task - Fonction async à exécuter
     * @param {object} options - { priority: 'critical'|'high'|'medium'|'low' }
     * @returns {Promise} Résultat de la tâche
     */
    add(task, options = {}) {
        const priority = PRIORITY_MAP[options.priority] || PRIORITY_MAP.default;
        return new Promise((resolve, reject) => {
            this._queue.push({ task, priority, resolve, reject });
            // Trier par priorité décroissante
            this._queue.sort((a, b) => b.priority - a.priority);
            this._run();
        });
    }

    /**
     * Exécute la prochaine tâche en attente
     */
    async _run() {
        if (this._running || this._queue.length === 0) return;
        this._running = true;

        const { task, resolve, reject } = this._queue.shift();
        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this._running = false;
            // Continuer avec la prochaine tâche
            setImmediate(() => this._run());
        }
    }

    /**
     * Nombre de tâches en attente
     */
    get size() {
        return this._queue.length;
    }

    /**
     * Vider la file
     */
    clear() {
        this._queue.length = 0;
    }
}

// ─── File d'attente pour la collecte (une source à la fois) ──────────────────
const collectionQueue = new PriorityQueue();

// ─── File d'attente pour la publication Discord (rate limiting) ──────────────
class DiscordPublishQueue {
    constructor() {
        this._queue = [];
        this._running = false;
        this._msgCount = 0;
        this._windowStart = Date.now();
        this.MAX_PER_MINUTE = 30;
        this.MIN_DELAY = 2100; // 2.1 secondes entre les messages
    }

    /**
     * Ajouter un message Discord à publier
     * @param {Function} publishFn - Fonction de publication Discord
     * @param {string} priority - 'critical'|'high'|'medium'|'low'
     */
    add(publishFn, priority = 'low') {
        const numPriority = PRIORITY_MAP[priority] || 1;
        return new Promise((resolve, reject) => {
            this._queue.push({ fn: publishFn, priority: numPriority, resolve, reject });
            this._queue.sort((a, b) => b.priority - a.priority);
            this._schedule();
        });
    }

    /**
     * Planifie l'exécution en respectant les rate limits Discord
     */
    _schedule() {
        if (this._running || this._queue.length === 0) return;
        this._running = true;

        // Vérifier la fenêtre de rate limit
        const now = Date.now();
        if (now - this._windowStart > 60_000) {
            this._msgCount = 0;
            this._windowStart = now;
        }

        if (this._msgCount >= this.MAX_PER_MINUTE) {
            // Attendre la fin de la fenêtre
            const wait = 60_000 - (now - this._windowStart) + 1000;
            logger.warn(`[Queue] Rate limit Discord atteint, attente de ${Math.ceil(wait / 1000)}s`);
            this._running = false;
            setTimeout(() => this._schedule(), wait);
            return;
        }

        this._process();
    }

    async _process() {
        if (this._queue.length === 0) {
            this._running = false;
            return;
        }

        const { fn, resolve, reject } = this._queue.shift();
        try {
            this._msgCount++;
            const result = await fn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            // Délai minimum entre les messages
            setTimeout(() => {
                this._running = false;
                this._schedule();
            }, this.MIN_DELAY);
        }
    }

    get size() {
        return this._queue.length;
    }
}

const discordQueue = new DiscordPublishQueue();

module.exports = {
    collectionQueue,
    discordQueue,
    PriorityQueue,
    PRIORITY_MAP,
};
