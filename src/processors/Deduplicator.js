/**
 * src/processors/Deduplicator.js
 * Dédoublonnage intelligent des articles
 * Utilise la similarité de Levenshtein pour détecter les doublons
 * Seuil: similarité > 0.7 = doublon
 */

'use strict';

const stringSimilarity = require('string-similarity');
const crypto = require('crypto');
const News = require('../database/models/News');
const logger = require('../utils/logger');
const { BOT_LIMITS } = require('../config/constants');

// Cache en mémoire des URLs et hash des articles récents (TTL 24h)
// Pour éviter des requêtes MongoDB pour chaque article
const urlCache = new Map();     // URL → hash
const titleCache = new Map();   // hash → title normalisé
const CACHE_TTL = 24 * 3600_000;

// Nettoyage périodique du cache
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of urlCache.entries()) {
        if (value.timestamp && now - value.timestamp > CACHE_TTL) {
            urlCache.delete(key);
        }
    }
    for (const [key, value] of titleCache.entries()) {
        if (value.timestamp && now - value.timestamp > CACHE_TTL) {
            titleCache.delete(key);
        }
    }
}, 3_600_000);

/**
 * Génère un hash unique pour un article basé sur son titre normalisé
 * @param {string} title - Titre de l'article
 * @returns {string} Hash MD5
 */
function generateHash(title) {
    const normalized = normalizeTitle(title);
    return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Normalise un titre pour la comparaison
 * Supprime la ponctuation, les majuscules et les mots vides
 * @param {string} title
 * @returns {string}
 */
function normalizeTitle(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')   // Supprimer la ponctuation
        .replace(/\s+/g, ' ')        // Espaces multiples
        .replace(/\b(the|a|an|in|on|at|to|for|of|and|or|but|avec|dans|le|la|les|un|une|des|du|de|et|ou|en)\b/g, '')
        .trim()
        .substring(0, 100);          // Limiter à 100 chars pour la comparaison
}

/**
 * Vérifie si un article est un doublon
 * @param {object} article - Article à vérifier
 * @returns {Promise<{ isDuplicate: boolean, existingId: string|null, similarity: number }>}
 */
async function isDuplicate(article) {
    const { title, url } = article;

    // 1. Vérification par URL (doublon exact)
    if (url && urlCache.has(url)) {
        return { isDuplicate: true, existingId: urlCache.get(url).id, similarity: 1.0 };
    }

    // 2. Vérification par URL en base de données
    if (url) {
        try {
            const existing = await News.findOne({ url }).select('_id hash').lean();
            if (existing) {
                urlCache.set(url, { id: existing._id, hash: existing.hash, timestamp: Date.now() });
                return { isDuplicate: true, existingId: existing._id, similarity: 1.0 };
            }
        } catch (error) {
            logger.debug(`[Deduplicator] Erreur vérif URL: ${error.message}`);
        }
    }

    // 3. Vérification par hash du titre
    const hash = generateHash(title);

    if (titleCache.has(hash)) {
        return { isDuplicate: true, existingId: titleCache.get(hash).id, similarity: 0.95 };
    }

    try {
        const existingByHash = await News.findOne({ hash }).select('_id').lean();
        if (existingByHash) {
            titleCache.set(hash, { id: existingByHash._id, timestamp: Date.now() });
            return { isDuplicate: true, existingId: existingByHash._id, similarity: 0.95 };
        }
    } catch (error) {
        logger.debug(`[Deduplicator] Erreur vérif hash: ${error.message}`);
    }

    // 4. Vérification par similarité textuelle (titre proches)
    const normalizedTitle = normalizeTitle(title);
    const recentTitles = Array.from(titleCache.values())
        .filter(v => v.normalizedTitle)
        .map(v => v.normalizedTitle);

    if (recentTitles.length > 0 && normalizedTitle.length > 20) {
        const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(normalizedTitle, recentTitles);

        if (bestMatch.rating >= BOT_LIMITS.DEDUP_SIMILARITY) {
            // Trouver l'ID correspondant
            const cacheValues = Array.from(titleCache.values()).filter(v => v.normalizedTitle);
            const matchedEntry = cacheValues[bestMatchIndex];

            return {
                isDuplicate: true,
                existingId: matchedEntry?.id || null,
                similarity: bestMatch.rating,
            };
        }
    }

    // Pas un doublon → ajouter au cache
    urlCache.set(url, { id: null, hash, timestamp: Date.now() });
    titleCache.set(hash, { id: null, normalizedTitle, timestamp: Date.now() });

    return { isDuplicate: false, existingId: null, similarity: 0 };
}

/**
 * Met à jour le cache après insertion en base
 * @param {string} url
 * @param {string} hash
 * @param {string} id - ID MongoDB
 */
function updateCache(url, hash, id) {
    if (url) urlCache.set(url, { id, hash, timestamp: Date.now() });
    if (hash) titleCache.set(hash, { id, normalizedTitle: null, timestamp: Date.now() });
}

/**
 * Ajoute une source à un article doublon existant
 * @param {string} existingId - ID MongoDB de l'article existant
 * @param {string} sourceName - Nom de la nouvelle source
 */
async function addSourceToDuplicate(existingId, sourceName) {
    try {
        await News.findByIdAndUpdate(existingId, {
            $addToSet: { reportedBy: sourceName },
            $inc: { reportCount: 1 },
        });
    } catch (error) {
        logger.debug(`[Deduplicator] Erreur update doublon: ${error.message}`);
    }
}

module.exports = {
    isDuplicate,
    generateHash,
    normalizeTitle,
    updateCache,
    addSourceToDuplicate,
};
