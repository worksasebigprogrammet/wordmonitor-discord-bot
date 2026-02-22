/**
 * src/processors/SeverityScorer.js
 * Calcule le niveau de gravité d'un article: critical/high/medium/low
 * Prend en compte: mots-clés, catégorie, source, contexte
 */

'use strict';

const { CATEGORIES } = require('../config/categories');

// ─── Mots-clés amplificateurs de gravité ──────────────────────────────────────
const CRITICAL_KEYWORDS = [
    // Armement nucléaire
    'nuclear explosion', 'nuclear strike', 'nuclear attack', 'mushroom cloud', 'atomic bomb',
    'explosion nucléaire', 'frappe nucléaire', 'bombe atomique',
    // Attentat majeur
    'mass casualties', 'hundreds killed', 'thousands dead', 'major terrorist attack',
    'centaines de morts', 'milliers de morts', 'attentat majeur',
    // Guerre déclarée
    'war declared', 'declaration of war', 'invasion launched', 'full-scale war',
    'guerre déclarée', 'invasion lancée', 'guerre totale',
    // Catastrophes extrêmes
    'magnitude 8', 'magnitude 9', 'category 5', 'mega-tsunami',
    // Urgences sanitaires majeures
    'pandemic declared', 'global health emergency', 'pandémie déclarée',
];

const HIGH_KEYWORDS = [
    'airstrike', 'bombing', 'killed', 'casualties', 'military offensive',
    'coup d\'état', 'missile attack', 'troops deployed', 'sanctions imposed',
    'frappe aérienne', 'bombardement', 'victimes', 'offensive militaire',
    'attaque missile', 'troupes déployées', 'sanctions imposées',
    'earthquake', 'tsunami warning', 'hurricane landfall', 'eruption',
    'séisme', 'alerte tsunami', 'ouragan', 'éruption',
    'hostage', 'terrorist attack', 'mass shooting', 'explosion',
    'otage', 'attentat', 'fusillade', 'explosion',
    'ship seized', 'naval blockade', 'pipeline explosion',
    'navire saisi', 'blocus naval',
];

const MEDIUM_KEYWORDS = [
    'tension', 'military exercise', 'drills', 'protest', 'unrest', 'clashes',
    'tensions', 'exercice militaire', 'manœuvres', 'manifestation', 'troubles', 'affrontements',
    'sanctions threat', 'economic warning', 'health alert', 'wildfire', 'flood warning',
    'menace de sanctions', 'alerte sanitaire', 'incendie', 'alerte inondation',
    'diplomatic', 'summit', 'talks', 'negotiations',
    'diplomatique', 'sommet', 'pourparlers', 'négociations',
];

// ─── Multiplicateurs par catégorie (base gravité) ─────────────────────────────
const CATEGORY_BASE_SEVERITY = {
    nuclear: 'critical',  // Nucléaire = toujours au moins critique
    terrorism: 'high',
    conflicts: 'high',
    military_movements: 'medium',
    maritime: 'medium',
    natural_disasters: 'medium',
    outages: 'medium',
    economy: 'low',
    health: 'medium',
    diplomacy: 'low',
};

// ─── Score numérique selon gravité ────────────────────────────────────────────
const SEVERITY_SCORES = {
    critical: 9,
    high: 7,
    medium: 5,
    low: 2,
};

/**
 * Calcule la gravité d'un article
 * @param {object} article - Article catégorisé
 * @returns {{ severity: string, severityScore: number }}
 */
function scoreSeverity(article) {
    const text = `${article.title || ''} ${article.description || ''} ${article.titleFr || ''}`.toLowerCase();
    const category = article.category || 'diplomacy';

    // Vérifier si la gravité est déjà définie (ex: USGS qui la calcule)
    if (article.severity && ['critical', 'high', 'medium', 'low'].includes(article.severity)) {
        return {
            severity: article.severity,
            severityScore: SEVERITY_SCORES[article.severity],
        };
    }

    // ─── Détection par mots-clés ─────────────────────────────────────────────
    // Critical: vérifier les mots-clés critiques
    for (const kw of CRITICAL_KEYWORDS) {
        if (text.includes(kw.toLowerCase())) {
            return { severity: 'critical', severityScore: 9 };
        }
    }

    // High: vérifier les mots-clés haute gravité
    let highScore = 0;
    for (const kw of HIGH_KEYWORDS) {
        if (text.includes(kw.toLowerCase())) highScore++;
    }
    if (highScore >= 2) {
        return { severity: 'high', severityScore: 7 };
    }

    // Medium: mots-clés moyens OU catégorie critique
    let mediumScore = 0;
    for (const kw of MEDIUM_KEYWORDS) {
        if (text.includes(kw.toLowerCase())) mediumScore++;
    }

    // Base de la catégorie
    const categoryBase = CATEGORY_BASE_SEVERITY[category] || 'low';

    if (mediumScore >= 2 || categoryBase === 'critical' || (highScore >= 1 && categoryBase === 'high')) {
        const severity = (categoryBase === 'critical' || (highScore >= 1 && categoryBase === 'high')) ? 'high' : 'medium';
        return { severity, severityScore: SEVERITY_SCORES[severity] };
    }

    if (categoryBase === 'high' || mediumScore >= 1) {
        return { severity: 'medium', severityScore: SEVERITY_SCORES.medium };
    }

    // Par défaut, gravité basée sur la catégorie
    const defaultSeverity = categoryBase === 'medium' ? 'medium' : 'low';
    return { severity: defaultSeverity, severityScore: SEVERITY_SCORES[defaultSeverity] };
}

module.exports = { scoreSeverity, SEVERITY_SCORES };
