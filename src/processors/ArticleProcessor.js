/**
 * src/processors/ArticleProcessor.js
 * Pipeline principal de traitement des articles
 * Étapes: Déduplication → Categorisation → Traduction → Scoring → Sauvegarde → Publication
 */

'use strict';

const logger = require('../utils/logger');
const News = require('../database/models/News');
const BotStats = require('../database/models/BotStats');

const { isDuplicate, generateHash, updateCache, addSourceToDuplicate } = require('./Deduplicator');
const { categorizeArticles } = require('./Categorizer');
const { translateArticle } = require('./Translator');
const { scoreSeverity } = require('./SeverityScorer');
const { generateSummary } = require('./Summarizer');
const { BOT_LIMITS } = require('../config/constants');

// Le publisher est injecté après pour éviter les dépendances circulaires
let newsPublisher = null;

/**
 * Injecte le publisher Discord
 * @param {object} publisher
 */
function setPublisher(publisher) {
    newsPublisher = publisher;
}

/**
 * Pipeline de traitement d'un seul article
 * @param {object} rawArticle - Article brut du collecteur
 * @returns {Promise<object|null>} Article sauvegardé ou null si doublon
 */
async function processSingleArticle(rawArticle) {
    // ─── Étape 1: Catégorisation ─────────────────────────────────────────────
    const [categorized] = categorizeArticles([rawArticle]);

    // ─── Étape 2: Déduplication ───────────────────────────────────────────────
    const { isDuplicate: dup, existingId } = await isDuplicate(categorized);

    if (dup) {
        if (existingId) {
            await addSourceToDuplicate(existingId, categorized.sourceName);
        }
        return null;
    }

    // ─── Étape 3: Traduction ──────────────────────────────────────────────────
    const translated = await translateArticle(categorized);

    // ─── Étape 4: Score de gravité ────────────────────────────────────────────
    const { severity, severityScore } = scoreSeverity(translated);

    // ─── Étape 5: Résumé ──────────────────────────────────────────────────────
    const summary = generateSummary({ ...translated, severity });

    // ─── Étape 6: Sauvegarde en base ──────────────────────────────────────────
    const hash = generateHash(rawArticle.title);
    const newsDoc = new News({
        hash,
        title: translated.title,
        titleFr: translated.titleFr,
        description: translated.description || '',
        descriptionFr: translated.descriptionFr || '',
        summary,
        url: translated.url,
        imageUrl: translated.imageUrl || null,
        sourceName: translated.sourceName,
        sourceType: translated.sourceType || 'rss',
        sourceReliability: translated.sourceReliability || 7,
        sourceLang: translated.sourceLang || 'en',
        category: translated.category,
        categoryConfidence: translated.categoryConfidence || 0,
        country: translated.country,
        continent: translated.continent,
        severity,
        severityScore,
        reportedBy: [translated.sourceName],
        originalDate: translated.originalDate instanceof Date ? translated.originalDate : new Date(),
    });

    await newsDoc.save();
    updateCache(translated.url, hash, newsDoc._id);

    // ─── Mise à jour des stats ────────────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const updateOp = { $inc: { newsScraped: 1 } };
    updateOp.$inc[`${severity}Count`] = 1;
    await BotStats.findOneAndUpdate({ date: today }, updateOp, { upsert: true });

    return newsDoc;
}

/**
 * Traite un lot d'articles (collecte d'un seul cycle)
 * @param {Array} rawArticles - Articles bruts
 * @param {string} source - Identifiant de la source (pour les logs)
 * @returns {Promise<number>} Nombre d'articles nouvellement traités
 */
async function processArticles(rawArticles, source = 'unknown') {
    if (!rawArticles || rawArticles.length === 0) return 0;

    // Limiter le nombre d'articles par cycle
    const toProcess = rawArticles.slice(0, BOT_LIMITS.MAX_NEWS_PER_CYCLE);
    let saved = 0;
    let duplicates = 0;
    const newArticles = [];

    for (const article of toProcess) {
        // Vérification basique avant de traiter (URL vide, titre vide)
        if (!article.url || !article.title) {
            continue;
        }

        try {
            const result = await processSingleArticle(article);
            if (result) {
                saved++;
                newArticles.push(result);
            } else {
                duplicates++;
            }
        } catch (error) {
            logger.debug(`[ArticleProcessor] Erreur article (${source}): ${error.message}`);
        }
    }

    logger.info(`[ArticleProcessor] [${source}] ${saved} nouveaux, ${duplicates} doublons sur ${toProcess.length} articles`);

    // ─── Publication des nouveaux articles ────────────────────────────────────
    if (newArticles.length > 0 && newsPublisher) {
        // Tri par gravité avant de publier
        newArticles.sort((a, b) => (b.severityScore || 0) - (a.severityScore || 0));

        for (const article of newArticles) {
            try {
                await newsPublisher.publishNews(article);
            } catch (error) {
                logger.error(`[ArticleProcessor] Erreur publication: ${error.message}`);
            }
        }
    }

    return saved;
}

module.exports = { processArticles, processSingleArticle, setPublisher };
