/**
 * src/processors/Summarizer.js
 * Génère un résumé de 4-5 phrases pour chaque article
 * Extraction des phrases les plus pertinentes
 */

'use strict';

const logger = require('../utils/logger');

// Phrases transitionnelles pour créer un résumé cohérent
const TRANSITION_WORDS_FR = ['En effet,', 'Par ailleurs,', 'De plus,', 'Selon les sources,', 'À noter que'];

/**
 * Extrait les phrases d'un texte
 * @param {string} text
 * @returns {string[]}
 */
function extractSentences(text) {
    if (!text) return [];
    return text
        .replace(/([.!?]\s)/g, '$1|')
        .split('|')
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.length < 300);
}

/**
 * Score une phrase selon sa pertinence
 * @param {string} sentence
 * @param {string[]} keywords - Mots-clés de l'article
 * @returns {number}
 */
function scoreSentence(sentence, keywords) {
    let score = 0;
    const lower = sentence.toLowerCase();
    // Bonus pour les mots-clés présents
    for (const kw of keywords) {
        if (lower.includes(kw.toLowerCase())) score++;
    }
    // Bonus pour les chiffres (dates, statistiques)
    if (/\d/.test(sentence)) score += 0.5;
    // Malus pour les phrases trop courtes
    if (sentence.length < 50) score -= 1;
    return score;
}

/**
 * Génère un résumé de 4-5 phrases à partir du texte
 * @param {object} article - Article avec title, description (en) et descriptionFr
 * @returns {string} Résumé en français
 */
function generateSummary(article) {
    const {
        title = '',
        titleFr = '',
        description = '',
        descriptionFr = '',
        category = '',
        country = '',
        sourceName = '',
    } = article;

    // Texte principal disponible
    const frText = descriptionFr || description;
    const mainTitle = titleFr || title;

    // Si pas de description, résumé minimal
    if (!frText || frText.length < 50) {
        const countryTxt = country ? ` en ${country}` : '';
        return [
            `📰 ${mainTitle}.`,
            `Source: ${sourceName}${countryTxt}.`,
        ].join(' ');
    }

    // Extraire les mots-clés du titre
    const keywords = mainTitle
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4);

    // Extraire et scorer les phrases
    const sentences = extractSentences(frText);
    if (sentences.length === 0) {
        return frText.substring(0, 300) + (frText.length > 300 ? '...' : '');
    }

    const scored = sentences.map(s => ({ sentence: s, score: scoreSentence(s, keywords) }));
    scored.sort((a, b) => b.score - a.score);

    // Prendre les 4 meilleures phrases, dans l'ordre original
    const topSentences = scored.slice(0, 4).map(s => s.sentence);
    const originalOrder = sentences.filter(s => topSentences.includes(s));

    return originalOrder.join(' ').substring(0, 1200);
}

module.exports = { generateSummary };
