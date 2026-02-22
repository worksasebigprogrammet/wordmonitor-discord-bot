/**
 * src/config/constants.js
 * Constantes globales du bot WorldMonitor
 * Contient : couleurs, intervalles, limites, emojis, etc.
 */

'use strict';

// ─── COULEURS PAR GRAVITÉ ───────────────────────────────────────────────────
const SEVERITY_COLORS = {
    critical: 0xFF0000, // 🔴 Rouge - Guerre, nucléaire, attentat majeur
    high: 0xFF8C00, // 🟠 Orange - Conflit actif, sanctions majeures
    medium: 0xFFD700, // 🟡 Jaune - Tensions, exercices militaires
    low: 0x00FF00, // 🟢 Vert - Diplomatie, économie standard
    info: 0x0099FF, // 🔵 Bleu - Information neutre
};

// ─── EMOJIS DE GRAVITÉ ─────────────────────────────────────────────────────
const SEVERITY_EMOJIS = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
    info: '🔵',
};

// ─── LABELS DE GRAVITÉ ─────────────────────────────────────────────────────
const SEVERITY_LABELS = {
    critical: { fr: 'ALERTE CRITIQUE', en: 'CRITICAL ALERT' },
    high: { fr: 'ALERTE HAUTE', en: 'HIGH ALERT' },
    medium: { fr: 'ALERTE MOYENNE', en: 'MEDIUM ALERT' },
    low: { fr: 'INFO', en: 'INFO' },
};

// ─── INTERVALLES (en millisecondes) ────────────────────────────────────────
const INTERVALS = {
    SCRAPE: parseInt(process.env.SCRAPE_INTERVAL) || 300_000,  // 5 min
    INDEX_UPDATE: parseInt(process.env.INDEX_UPDATE_INTERVAL) || 600_000,  // 10 min
    MAP: parseInt(process.env.MAP_GENERATION_INTERVAL) || 3_600_000, // 1 heure
    CLEANUP: 3_600_000,  // 1 heure
    HEALTH_CHECK: 1_800_000,  // 30 min
    HOT_ZONE: 120_000,    // 2 min pour les zones chaudes
    STATUS_REPORT: 3_600_000, // 1 heure
};

// ─── LIMITES DISCORD ───────────────────────────────────────────────────────
const DISCORD_LIMITS = {
    MESSAGES_PER_MINUTE: 30,
    EMBEDS_PER_MESSAGE: 10,
    EMBED_TITLE_MAX: 256,
    EMBED_DESC_MAX: 4096,
    EMBED_FIELD_NAME_MAX: 256,
    EMBED_FIELD_VALUE_MAX: 1024,
    EMBED_FOOTER_MAX: 2048,
    EMBED_TOTAL_MAX: 6000,
    AUTOCOMPLETE_MAX: 25,
};

// ─── LIMITES BOT ───────────────────────────────────────────────────────────
const BOT_LIMITS = {
    NEWS_TTL_HOURS: parseInt(process.env.NEWS_TTL_HOURS) || 24,
    MAX_NEWS_PER_CYCLE: parseInt(process.env.MAX_NEWS_PER_CYCLE) || 50,
    DEDUP_SIMILARITY: 0.7,    // Seuil de similarité pour dédoublonnage
    HOT_ZONE_THRESHOLD: 10,     // Événements en 1h → zone chaude
    MAX_SUMMARY_SENTENCES: 5,
    SOURCE_DELAY_MS: parseInt(process.env.SOURCE_DELAY) || 2000,
    COOLDOWN_SECONDS: 10,     // Cooldown commandes utilisateurs
    COMMAND_TIMEOUT_MS: 30_000, // Timeout interactions boutons
};

// ─── EMOJIS PAR CATÉGORIE ──────────────────────────────────────────────────
const CATEGORY_EMOJIS = {
    conflicts: '⚔️',
    military_movements: '🎖️',
    nuclear: '⚛️',
    economy: '💰',
    maritime: '🚢',
    natural_disasters: '🌊',
    terrorism: '🔴',
    outages: '📡',
    health: '🏥',
    diplomacy: '🤝',
};

// ─── EMOJIS PAR CONTINENT ──────────────────────────────────────────────────
const CONTINENT_EMOJIS = {
    europe: '🇪🇺',
    middle_east: '🌍',
    asia: '🌏',
    africa: '🌍',
    americas: '🌎',
};

// ─── NOMS DES CONTINENTS ───────────────────────────────────────────────────
const CONTINENT_NAMES = {
    europe: { fr: 'Europe', en: 'Europe' },
    middle_east: { fr: 'Moyen-Orient', en: 'Middle East' },
    asia: { fr: 'Asie', en: 'Asia' },
    africa: { fr: 'Afrique', en: 'Africa' },
    americas: { fr: 'Amériques', en: 'Americas' },
};

// ─── COULEURS DE LA CARTE ──────────────────────────────────────────────────
const MAP_COLORS = {
    background: '#1a1a2e',
    land: '#16213e',
    borders: '#0f3460',
    water: '#0a0a1a',
    // Points sur la carte par niveau de tension
    tension: {
        critical: '#FF0000',
        high: '#FF8C00',
        medium: '#FFD700',
        low: '#00FF00',
        none: '#4444AA',
    },
};

// ─── URLs WEBHOOKS PAR CATÉGORIE (avatars custom) ──────────────────────────
const WEBHOOK_AVATARS = {
    conflicts: 'https://i.imgur.com/vT0RJAM.png',
    military_movements: 'https://i.imgur.com/vT0RJAM.png',
    nuclear: 'https://i.imgur.com/vT0RJAM.png',
    economy: 'https://i.imgur.com/vT0RJAM.png',
    maritime: 'https://i.imgur.com/vT0RJAM.png',
    natural_disasters: 'https://i.imgur.com/vT0RJAM.png',
    terrorism: 'https://i.imgur.com/vT0RJAM.png',
    outages: 'https://i.imgur.com/vT0RJAM.png',
    health: 'https://i.imgur.com/vT0RJAM.png',
    diplomacy: 'https://i.imgur.com/vT0RJAM.png',
    breaking: 'https://i.imgur.com/vT0RJAM.png',
};

// ─── NOMS DES WEBHOOKS PAR CATÉGORIE ──────────────────────────────────────
const WEBHOOK_NAMES = {
    conflicts: '⚔️ WorldMonitor Conflits',
    military_movements: '🎖️ WorldMonitor Militaire',
    nuclear: '⚛️ WorldMonitor Nucléaire',
    economy: '💰 WorldMonitor Économie',
    maritime: '🚢 WorldMonitor Maritime',
    natural_disasters: '🌊 WorldMonitor Catastrophes',
    terrorism: '🔴 WorldMonitor Terrorisme',
    outages: '📡 WorldMonitor Pannes',
    health: '🏥 WorldMonitor Santé',
    diplomacy: '🤝 WorldMonitor Diplomatie',
    breaking: '🌍 WorldMonitor Breaking',
};

// ─── STRUCTURE DES CHANNELS PAR PRESET ────────────────────────────────────
const CHANNEL_STRUCTURE = {
    // Channels globaux (toujours créés)
    global: [
        { name: 'breaking-news', topic: '🔴 Alertes breaking news mondiales en temps réel', type: 'news' },
        { name: 'index-global', topic: '📊 Index de tension mondiale - Mis à jour toutes les 10 min', type: 'index' },
        { name: 'carte-mondiale', topic: '🗺️ Carte mondiale des tensions - Mise à jour toutes les heures', type: 'map' },
        { name: 'daily-briefing', topic: '📋 Résumés périodiques de l\'actualité mondiale', type: 'briefing' },
        { name: 'bot-status', topic: '🤖 Statut et santé du bot WorldMonitor', type: 'status' },
        { name: 'bot-logs', topic: '📝 Logs d\'activité du bot', type: 'logs' },
        { name: 'panel', topic: '⚙️ Panel de configuration WorldMonitor', type: 'panel' },
        { name: 'alert-config', topic: '🔔 Configurer vos alertes - Choisissez vos rôles', type: 'config' },
    ],
    // Channels thématiques (selon preset)
    thematic: [
        { name: 'mouvements-militaires', topic: '🎖️ Mouvements militaires et OSINT', type: 'news', category: 'military_movements' },
        { name: 'nucleaire', topic: '⚛️ Actualité nucléaire et armes de destruction massive', type: 'news', category: 'nuclear' },
        { name: 'economie-mondiale', topic: '💰 Économie mondiale et sanctions', type: 'news', category: 'economy' },
        { name: 'maritime', topic: '🚢 Sécurité maritime et voies navigables', type: 'news', category: 'maritime' },
        { name: 'catastrophes-naturelles', topic: '🌊 Catastrophes naturelles et urgences', type: 'news', category: 'natural_disasters' },
        { name: 'pannes-blackouts', topic: '📡 Pannes internet et blackouts', type: 'news', category: 'outages' },
        { name: 'sante-epidemies', topic: '🏥 Santé mondiale et épidémies', type: 'news', category: 'health' },
    ],
};

// ─── RÔLES D'ALERTE ────────────────────────────────────────────────────────
const ALERT_ROLES = [
    {
        name: 'Alerte-Critique', color: 0xFF0000, hoist: true, mentionable: true,
        description: '🔴 Alertes critiques mondiales (guerres, nucléaire, attentats)'
    },
    {
        name: 'Alerte-Europe', color: 0x003399, hoist: false, mentionable: true,
        description: '🇪🇺 Alertes Europe'
    },
    {
        name: 'Alerte-Moyen-Orient', color: 0x008000, hoist: false, mentionable: true,
        description: '🌍 Alertes Moyen-Orient'
    },
    {
        name: 'Alerte-Asie', color: 0xFF6600, hoist: false, mentionable: true,
        description: '🌏 Alertes Asie'
    },
    {
        name: 'Alerte-Afrique', color: 0x8B4513, hoist: false, mentionable: true,
        description: '🌍 Alertes Afrique'
    },
    {
        name: 'Alerte-Ameriques', color: 0x8B0000, hoist: false, mentionable: true,
        description: '🌎 Alertes Amériques'
    },
    {
        name: 'Alerte-Nucleaire', color: 0xFFD700, hoist: true, mentionable: true,
        description: '⚛️ Alertes nucléaires uniquement'
    },
    {
        name: 'Alerte-Maritime', color: 0x1E90FF, hoist: false, mentionable: true,
        description: '🚢 Alertes maritimes'
    },
    {
        name: 'WorldMonitor-Admin', color: 0x7B68EE, hoist: true, mentionable: false,
        description: '⚙️ Administrateurs WorldMonitor'
    },
];

// ─── INTERVALLES DE BRIEFING ───────────────────────────────────────────────
const BRIEFING_INTERVALS = {
    '1h': 3_600_000,
    '3h': 10_800_000,
    '5h': 18_000_000,
    '12h': 43_200_000,
    '24h': 86_400_000,
};

// ─── LANGUES SUPPORTÉES ────────────────────────────────────────────────────
const SUPPORTED_LANGUAGES = ['fr', 'en'];
const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE || 'fr';

module.exports = {
    SEVERITY_COLORS,
    SEVERITY_EMOJIS,
    SEVERITY_LABELS,
    INTERVALS,
    DISCORD_LIMITS,
    BOT_LIMITS,
    CATEGORY_EMOJIS,
    CONTINENT_EMOJIS,
    CONTINENT_NAMES,
    MAP_COLORS,
    WEBHOOK_AVATARS,
    WEBHOOK_NAMES,
    CHANNEL_STRUCTURE,
    ALERT_ROLES,
    BRIEFING_INTERVALS,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
};
