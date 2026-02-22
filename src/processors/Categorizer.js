/**
 * src/processors/Categorizer.js
 * Classification automatique des articles par pays et catégorie
 * Utilise les mots-clés multilingues définis dans countries.js et categories.js
 */

'use strict';

const { CATEGORIES, classifyCategory } = require('../config/categories');
const { detectCountry, detectContinent, COUNTRIES } = require('../config/countries');
const logger = require('../utils/logger');

/**
 * Catégorise et localise un article
 * @param {object} article - Article brut normalisé
 * @returns {object} Article enrichi avec category, country, continent, severity
 */
function categorizeArticle(article) {
    // Texte combiné pour l'analyse
    const text = `${article.title || ''} ${article.description || ''}`;
    const lang = article.sourceLang || 'en';

    // ─── Classification par catégorie ────────────────────────────────────────
    const { category, confidence } = classifyCategory(text, lang);

    // ─── Détection du pays ────────────────────────────────────────────────────
    const country = article.country || detectCountry(text);
    const continent = country && COUNTRIES[country]
        ? COUNTRIES[country].continent
        : detectContinent(text);

    // ─── Surcharger avec la catégorie de la source si définie ─────────────────
    const finalCategory = article.category && article.category !== 'general'
        ? article.category
        : category;

    return {
        ...article,
        category: finalCategory,
        categoryConfidence: confidence,
        country: country || null,
        continent: continent || null,
    };
}

/**
 * Catégorise un lot d'articles
 * @param {Array} articles
 * @returns {Array} Articles catégorisés
 */
function categorizeArticles(articles) {
    const results = [];

    for (const article of articles) {
        try {
            results.push(categorizeArticle(article));
        } catch (error) {
            logger.debug(`[Categorizer] Erreur pour article: ${error.message}`);
            results.push({ ...article, category: 'diplomacy', country: null, continent: null });
        }
    }

    return results;
}

module.exports = { categorizeArticle, categorizeArticles };
