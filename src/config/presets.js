/**
 * src/config/presets.js
 * Configurations prédéfinies pour WorldMonitor
 * 4 niveaux : Débutant, Moyen, Expérimenté, Expert
 * Chaque preset définit : channels, catégories, pays, intervalles, etc.
 */

'use strict';

const { CATEGORIES } = require('./categories');

const PRESETS = {
    // ────────────────────────────────────────────────────────────────────────
    // 🟢 DÉBUTANT – Breaking news mondial uniquement
    // ────────────────────────────────────────────────────────────────────────
    beginner: {
        id: 'beginner',
        name: { en: 'Beginner', fr: 'Débutant' },
        emoji: '🟢',
        description: {
            fr: 'Breaking news mondial uniquement, alertes critiques seulement.\nParfait pour débuter sans être submergé.',
            en: 'Worldwide breaking news only, critical alerts only.\nPerfect to start without being overwhelmed.',
        },
        // Channels Discord créés
        channels: ['breaking-news', 'index-global'],
        // Catégories de news activées
        categories: ['conflicts', 'nuclear', 'natural_disasters', 'terrorism'],
        // Pas de découpage géographique
        continents: [],
        countriesPerContinent: 0,
        defaultCountries: {},
        // Fréquence des résumés
        briefingInterval: '24h',
        briefingEnabled: true,
        // Niveaux d'alerte envoyés (🔴 critique seulement)
        alertLevels: ['critical'],
        // Options
        mapEnabled: false,
        militaryTracking: false,
        economyTracking: false,
        maritimeTracking: false,
        crisisSystem: false,
        continentMaps: false,
        continentMilitaryChannels: false,
        continentEconomyChannels: false,
        // Nombre max de news/heure pour ne pas flood
        maxNewsPerHour: 5,
        // Scraping interval en ms
        scrapeInterval: 600_000, // 10 min
    },

    // ────────────────────────────────────────────────────────────────────────
    // 🟡 MOYEN – Breaking + conflits + économie, par continent
    // ────────────────────────────────────────────────────────────────────────
    intermediate: {
        id: 'intermediate',
        name: { en: 'Intermediate', fr: 'Moyen' },
        emoji: '🟡',
        description: {
            fr: 'Breaking + conflits majeurs + économie.\nChannels organisés par continent.',
            en: 'Breaking + major conflicts + economy.\nChannels organized by continent.',
        },
        channels: ['breaking-news', 'index-global', 'daily-briefing'],
        categories: ['conflicts', 'nuclear', 'natural_disasters', 'terrorism', 'economy', 'diplomacy'],
        continents: ['europe', 'middle_east', 'asia', 'africa', 'americas'],
        countriesPerContinent: 0, // Juste index par continent, pas de pays individuels
        defaultCountries: {},
        briefingInterval: '12h',
        briefingEnabled: true,
        alertLevels: ['critical', 'high'],
        mapEnabled: true,
        militaryTracking: false,
        economyTracking: true,
        maritimeTracking: false,
        crisisSystem: false,
        continentMaps: false,
        continentMilitaryChannels: false,
        continentEconomyChannels: false,
        maxNewsPerHour: 15,
        scrapeInterval: 300_000, // 5 min
    },

    // ────────────────────────────────────────────────────────────────────────
    // 🟠 EXPÉRIMENTÉ – Tout + channels par pays majeurs
    // ────────────────────────────────────────────────────────────────────────
    experienced: {
        id: 'experienced',
        name: { en: 'Experienced', fr: 'Expérimenté' },
        emoji: '🟠',
        description: {
            fr: 'Tout sauf OSINT détaillé.\nChannels par pays majeurs (top 3 par continent).',
            en: 'Everything except detailed OSINT.\nChannels for major countries (top 3 per continent).',
        },
        channels: ['breaking-news', 'index-global', 'daily-briefing', 'carte-mondiale'],
        categories: [
            'conflicts', 'nuclear', 'natural_disasters', 'terrorism',
            'economy', 'diplomacy', 'maritime', 'outages', 'health',
        ],
        continents: ['europe', 'middle_east', 'asia', 'africa', 'americas'],
        countriesPerContinent: 3,
        defaultCountries: {
            europe: ['UA', 'RU', 'FR'],
            middle_east: ['IL', 'IR', 'SY'],
            asia: ['CN', 'TW', 'KP'],
            africa: ['SD', 'CD', 'ET'],
            americas: ['US', 'MX', 'VE'],
        },
        briefingInterval: '5h',
        briefingEnabled: true,
        alertLevels: ['critical', 'high', 'medium'],
        mapEnabled: true,
        militaryTracking: true,
        economyTracking: true,
        maritimeTracking: true,
        crisisSystem: true,
        continentMaps: false,
        continentMilitaryChannels: false,
        continentEconomyChannels: false,
        maxNewsPerHour: 30,
        scrapeInterval: 300_000, // 5 min
    },

    // ────────────────────────────────────────────────────────────────────────
    // 🔴 EXPERT – Tout activé, OSINT, 6 pays/continent
    // ────────────────────────────────────────────────────────────────────────
    expert: {
        id: 'expert',
        name: { en: 'Expert', fr: 'Expert' },
        emoji: '🔴',
        description: {
            fr: 'Tout activé : OSINT militaire, 6 pays par continent, raw intelligence.\nPour les analystes géopolitiques chevronnés.',
            en: 'Everything enabled: military OSINT, 6 countries per continent, raw intelligence.\nFor seasoned geopolitical analysts.',
        },
        channels: [
            'breaking-news', 'index-global', 'daily-briefing', 'carte-mondiale',
            'mouvements-militaires', 'economie-mondiale', 'nucleaire', 'maritime',
            'catastrophes-naturelles', 'pannes-blackouts',
        ],
        categories: Object.keys(CATEGORIES), // TOUTES les catégories
        continents: ['europe', 'middle_east', 'asia', 'africa', 'americas'],
        countriesPerContinent: 6,
        defaultCountries: {
            europe: ['FR', 'UA', 'RU', 'GB', 'DE', 'PL'],
            middle_east: ['IL', 'IR', 'SA', 'TR', 'SY', 'YE'],
            asia: ['CN', 'TW', 'KP', 'KR', 'JP', 'IN'],
            africa: ['EG', 'SD', 'NG', 'CD', 'ML', 'ET'],
            americas: ['US', 'BR', 'MX', 'CA', 'VE', 'CO'],
        },
        briefingInterval: '3h',
        briefingEnabled: true,
        alertLevels: ['critical', 'high', 'medium', 'low'],
        mapEnabled: true,
        militaryTracking: true,
        economyTracking: true,
        maritimeTracking: true,
        crisisSystem: true,
        continentMaps: true,
        continentMilitaryChannels: true,
        continentEconomyChannels: true,
        maxNewsPerHour: 60,
        scrapeInterval: 300_000, // 5 min
    },
};

/**
 * Obtenir un preset par son ID
 * @param {string} presetId - ID du preset ('beginner'|'intermediate'|'experienced'|'expert')
 * @returns {object} Configuration du preset
 */
function getPreset(presetId) {
    return PRESETS[presetId] || PRESETS.beginner;
}

/**
 * Lister tous les presets pour les menus Discord
 * @returns {Array<{label, value, description, emoji}>}
 */
function listPresetsForMenu() {
    return Object.values(PRESETS).map(p => ({
        label: p.name.fr,
        value: p.id,
        description: p.description.fr.split('\n')[0].substring(0, 100),
        emoji: p.emoji,
    }));
}

module.exports = { PRESETS, getPreset, listPresetsForMenu };
