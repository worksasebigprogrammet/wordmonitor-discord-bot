/**
 * src/processors/Summarizer.js
 * Génère un résumé de 4-5 phrases clair et factuel pour chaque article
 *
 * V2 — Enhancement 6 :
 * - Extraction des phrases clés (Qui, Quoi, Où, Quand)
 * - Suppression du contenu marketing / publicitaire
 * - Formatage en 4-5 phrases structurées
 * - Traduction en français si source anglaise (avec indicateur)
 * - Fallback sur le titre si pas de description
 */

'use strict';

const logger = require('../utils/logger');

// ─── Filtres de qualité ───────────────────────────────────────────────────────

// Patterns marketing/publicitaire à supprimer
const MARKETING_PATTERNS = [
    /click here/gi, /read more/gi, /subscribe/gi, /sign up/gi,
    /newsletter/gi, /advertisement/gi, /sponsored/gi, /cookie policy/gi,
    /privacy policy/gi, /terms of service/gi, /all rights reserved/gi,
    /follow us on/gi, /share this article/gi, /related articles?/gi,
    /vous pourriez aimer/gi, /en savoir plus/gi, /abonnez-vous/gi,
    /notre newsletter/gi, /cliquez ici/gi, /politique de confidentialité/gi,
];

// Mots à weight positif (indiquent un contenu substantiel)
const HIGH_VALUE_INDICATORS = [
    'killed', 'died', 'attack', 'explosion', 'announced', 'signed', 'launched',
    'confirmed', 'deployed', 'arrested', 'sanctions', 'ceasefire', 'agreement',
    'tué', 'mort', 'annoncé', 'signé', 'lancé', 'confirmé', 'déployé', 'accord',
    'séisme', 'magnitude', 'bloqué', 'attaque', 'accord', 'réunion',
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────

/**
 * Extrait les phrases d'un texte
 * @param {string} text
 * @returns {string[]}
 */
function extractSentences(text) {
    if (!text) return [];
    return text
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/([.!?])\s+/g, '$1|')
        .split('|')
        .map(s => s.trim())
        .filter(s => s.length > 25 && s.length < 400);
}

/**
 * Nettoie un texte de tout le contenu marketing
 * @param {string} text
 * @returns {string}
 */
function cleanText(text) {
    if (!text) return '';
    let cleaned = text;
    for (const pattern of MARKETING_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }
    // Supprimer les URLs
    cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');
    // Supprimer les mentions HTML
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');
    // Normaliser les espaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    return cleaned;
}

/**
 * Score une phrase selon sa pertinence
 * @param {string} sentence
 * @param {string[]} keywords - Mots-clés du titre
 * @returns {number}
 */
function scoreSentence(sentence, keywords) {
    let score = 0;
    const lower = sentence.toLowerCase();

    // Bonus pour les mots-clés du titre
    for (const kw of keywords) {
        if (kw.length > 3 && lower.includes(kw.toLowerCase())) score += 1.5;
    }

    // Bonus pour les indicateurs haute valeur (facts)
    for (const indicator of HIGH_VALUE_INDICATORS) {
        if (lower.includes(indicator.toLowerCase())) score += 0.8;
    }

    // Bonus pour les chiffres (stats, dates, victimes)
    const numberMatches = sentence.match(/\d+/g) || [];
    score += Math.min(numberMatches.length * 0.3, 1.5);

    // Bonus pour les noms propres (commence par majuscule après espace)
    const properNouns = sentence.match(/\s[A-Z][a-z]+/g) || [];
    score += Math.min(properNouns.length * 0.2, 1.0);

    // Malus pour les phrases trop courtes
    if (sentence.length < 40) score -= 1.5;

    // Bonus pour positionnement (premières phrases = plus importantes)
    return score;
}

// ─── Résumé principal ─────────────────────────────────────────────────────────

/**
 * Génère un résumé de 4-5 phrases structuré et factuel
 * @param {object} article - Article avec title, description, titleFr, descriptionFr, etc.
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
        severity = '',
    } = article;

    const mainTitle = titleFr || title;
    const lang = article.lang || 'en';

    // ── Fallback : si pas de description ─────────────────────────────────
    const rawText = (descriptionFr || description || '').trim();
    if (!rawText || rawText.length < 30) {
        const countryTxt = country ? ` en ${country}` : '';
        const catTxt = category ? ` [${category}]` : '';
        return `📰 **${mainTitle}**.${countryTxt ? ` Événement${countryTxt}.` : ''}${catTxt}`;
    }

    // ── Nettoyage du texte ────────────────────────────────────────────────
    const cleanedText = cleanText(rawText);
    if (!cleanedText || cleanedText.length < 20) {
        return mainTitle.substring(0, 300);
    }

    // ── Extraction des keywords depuis le titre ───────────────────────────
    const keywords = mainTitle
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);

    // ── Extraction et scoring des phrases ─────────────────────────────────
    const sentences = extractSentences(cleanedText);

    if (sentences.length === 0) {
        return cleanedText.substring(0, 400);
    }

    if (sentences.length <= 3) {
        // Pas assez de phrases pour filtrer → prendre tout
        return sentences.join(' ').substring(0, 800);
    }

    // Scorer et trier
    const scored = sentences.map((s, idx) => ({
        sentence: s,
        score: scoreSentence(s, keywords) + (idx < 3 ? 0.5 : 0), // Bonus premières phrases
        idx,
    }));

    scored.sort((a, b) => b.score - a.score);

    // Prendre les 4 meilleures phrases, les réordonner par position originale
    const topSentences = scored
        .slice(0, 4)
        .sort((a, b) => a.idx - b.idx)
        .map(s => s.sentence);

    let summary = topSentences.join(' ');

    // Tronquer si trop long
    if (summary.length > 900) {
        summary = summary.substring(0, 900).replace(/\s\w+$/, '') + '…';
    }

    // ── Indicateur de traduction si source EN ─────────────────────────────
    if (lang === 'en' && descriptionFr && descriptionFr !== description) {
        summary += '\n*📝 Résumé traduit depuis la source anglaise.*';
    }

    return summary;
}

module.exports = { generateSummary, cleanText, extractSentences };
