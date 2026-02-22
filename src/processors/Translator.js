/**
 * src/processors/Translator.js
 * Traduction des articles en français
 * Chaîne de fallback: DeepL → LibreTranslate → pas de traduction
 */

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');
const { rateLimiters } = require('../utils/rateLimiter');

// ─── Configuration DeepL ──────────────────────────────────────────────────────
function getDeepLConfig() {
    const key = process.env.DEEPL_API_KEY;
    if (!key) return null;

    const isFree = key.endsWith(':fx');
    return {
        key,
        baseUrl: isFree ? 'https://api-free.deepl.com/v2' : 'https://api.deepl.com/v2',
        charLimit: 500_000, // Limite mensuelle gratuite
    };
}

// Compteur de caractères traduits (pour respecter le quota DeepL Free)
let deepLCharsUsed = 0;
const DEEPL_MONTHLY_LIMIT = 490_000; // On garde une marge

// Instances LibreTranslate publiques (backup)
const LIBRETRANSLATE_INSTANCES = [
    'https://libretranslate.de',
    'https://translate.argosopentech.com',
    'https://libretranslate.com',
];
let currentLibreIndex = 0;

/**
 * Traduit via DeepL API
 * @param {string} text - Texte à traduire
 * @param {string} sourceLang - Langue source ('en', 'de', etc.)
 * @returns {Promise<string|null>}
 */
async function translateWithDeepL(text, sourceLang = 'EN') {
    const config = getDeepLConfig();
    if (!config) return null;

    if (deepLCharsUsed + text.length > DEEPL_MONTHLY_LIMIT) {
        logger.warn('[Translator] Quota DeepL proche de la limite, passage à LibreTranslate');
        return null;
    }

    try {
        await rateLimiters.deepl.waitForSlot();

        const response = await axios.post(
            `${config.baseUrl}/translate`,
            {
                text: [text],
                target_lang: 'FR',
                source_lang: sourceLang.toUpperCase().substring(0, 2),
                preserve_formatting: 1,
            },
            {
                headers: {
                    Authorization: `DeepL-Auth-Key ${config.key}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            }
        );

        if (response.data?.translations?.[0]?.text) {
            deepLCharsUsed += text.length;
            return response.data.translations[0].text;
        }

        return null;
    } catch (error) {
        logger.debug(`[Translator] DeepL erreur: ${error.message}`);
        return null;
    }
}

/**
 * Traduit via LibreTranslate (fallback)
 * @param {string} text
 * @param {string} sourceLang
 * @returns {Promise<string|null>}
 */
async function translateWithLibreTranslate(text, sourceLang = 'en') {
    const instance = LIBRETRANSLATE_INSTANCES[currentLibreIndex % LIBRETRANSLATE_INSTANCES.length];

    try {
        const response = await axios.post(
            `${instance}/translate`,
            {
                q: text,
                source: sourceLang.substring(0, 2).toLowerCase(),
                target: 'fr',
                format: 'text',
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000,
            }
        );

        return response.data?.translatedText || null;
    } catch (error) {
        // Tourner vers l'instance suivante
        currentLibreIndex++;
        logger.debug(`[Translator] LibreTranslate (${instance}) erreur: ${error.message}`);
        return null;
    }
}

/**
 * Traduit un texte en français avec fallback automatique
 * @param {string} text - Texte à traduire
 * @param {string} sourceLang - Langue source
 * @returns {Promise<string>} Texte traduit ou original si échec
 */
async function translateToFR(text, sourceLang = 'en') {
    // Pas besoin de traduire si déjà en français
    if (sourceLang === 'fr') return text;
    // Texte vide ou trop court
    if (!text || text.length < 10) return text;
    // Limiter la longueur pour les APIs
    const truncated = text.substring(0, 1000);

    // 1. Essai DeepL
    const deepLResult = await translateWithDeepL(truncated, sourceLang);
    if (deepLResult) return deepLResult;

    // 2. Fallback LibreTranslate
    const libreResult = await translateWithLibreTranslate(truncated, sourceLang);
    if (libreResult) return libreResult;

    // 3. Retourner le texte original si tout échoue
    logger.debug('[Translator] Tous les traducteurs ont échoué, texte original conservé');
    return text;
}

/**
 * Traduit le titre et la description d'un article
 * @param {object} article - Article à traduire
 * @returns {Promise<object>} Article avec champs FR ajoutés
 */
async function translateArticle(article) {
    const lang = article.sourceLang || 'en';

    if (lang === 'fr') {
        // Déjà en français - copier les champs
        return {
            ...article,
            titleFr: article.title,
            descriptionFr: article.description,
        };
    }

    try {
        const titleFr = await translateToFR(article.title || '', lang);
        const descriptionFr = article.description
            ? await translateToFR(article.description.substring(0, 500), lang)
            : '';

        return {
            ...article,
            titleFr: titleFr || article.title,
            descriptionFr: descriptionFr || article.description || '',
        };
    } catch (error) {
        logger.debug(`[Translator] Erreur traduction article: ${error.message}`);
        return {
            ...article,
            titleFr: article.title,
            descriptionFr: article.description || '',
        };
    }
}

/**
 * Obtient les statistiques d'utilisation DeepL
 * @returns {Promise<object>}
 */
async function getDeepLUsage() {
    const config = getDeepLConfig();
    if (!config) return { available: false };

    try {
        await rateLimiters.deepl.waitForSlot();
        const response = await axios.get(`${config.baseUrl}/usage`, {
            headers: { Authorization: `DeepL-Auth-Key ${config.key}` },
            timeout: 5000,
        });
        return {
            available: true,
            charCount: response.data.character_count,
            charLimit: response.data.character_limit,
            localUsed: deepLCharsUsed,
        };
    } catch {
        return { available: false };
    }
}

module.exports = { translateToFR, translateArticle, getDeepLUsage };
