/**
 * src/database/models/ServerConfig.js
 * Configuration par serveur Discord
 * Stocke tous les paramètres du bot pour chaque guild
 *
 * V2 : Refactorisation du stockage des channels
 * - channels Map<String,String> : nom_channel → channelId (ex: 'economie-mondiale' → '123')
 * - countryChannels[] : tableau top-level pour les pays
 * - continentChannels[] : tableau top-level pour les continents
 * - techConfig : configuration du module /tech
 */

'use strict';

const mongoose = require('mongoose');

// ─── Sous-schémas ─────────────────────────────────────────────────────────────

const countryChannelSchema = new mongoose.Schema({
    code: { type: String, required: true },        // ISO du pays (ex: 'FR')
    key: String,                                   // 'country-fr' (convention)
    channelId: { type: String, required: true },
    webhookUrl: String,
    continent: String,
}, { _id: false });

const continentChannelSchema = new mongoose.Schema({
    continent: { type: String, required: true },
    categoryId: String,
    indexChannelId: String,
    mapChannelId: String,
    militaryChannelId: String,
    economyChannelId: String,
}, { _id: false });

const techChannelSchema = new mongoose.Schema({
    name: String,   // ex: 'tech-ai'
    channelId: String,
    webhookUrl: String,
}, { _id: false });

// ─── Schéma principal ─────────────────────────────────────────────────────────

const serverConfigSchema = new mongoose.Schema({
    // ─── Identification du serveur ────────────────────────────────────────
    guildId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    guildName: {
        type: String,
        required: true,
    },

    // ─── Statut du setup ─────────────────────────────────────────────────
    setupComplete: {
        type: Boolean,
        default: false,
    },
    preset: {
        type: String,
        enum: ['beginner', 'intermediate', 'experienced', 'expert'],
        default: 'beginner',
    },

    // ─── Configuration de la langue ───────────────────────────────────────
    language: {
        type: String,
        enum: ['fr', 'en'],
        default: 'fr',
    },

    // ─── Configuration géographique ───────────────────────────────────────
    enabledContinents: {
        type: [String],
        default: [],
    },
    monitoredCountries: {
        type: [String],
        default: [],
    },

    // ─── Catégories actives ───────────────────────────────────────────────
    enabledCategories: {
        type: [String],
        default: ['conflicts', 'nuclear', 'natural_disasters', 'terrorism'],
    },

    // ─── Niveaux d'alerte actifs ──────────────────────────────────────────
    alertLevels: {
        type: [String],
        enum: ['critical', 'high', 'medium', 'low'],
        default: ['critical'],
    },

    // ─── Channels Discord (Map nom_channel → channelId) ───────────────────
    // Convention : utiliser le nom Discord exact du channel comme clé
    // Exemples: 'breaking-news', 'index-global', 'economie-mondiale', 'nucleaire'
    channels: {
        type: Map,
        of: String,
        default: {},
    },

    // ─── Webhooks Discord (Map nom_channel → webhookUrl) ─────────────────
    webhooks: {
        type: Map,
        of: String,
        default: {},
    },

    // ─── Rôles Discord (Map nom_rôle → roleId) ────────────────────────────
    // Exemples: 'Alerte-Critique' → '123456', 'Alerte-Europe' → '789012'
    roles: {
        type: Map,
        of: String,
        default: {},
    },

    // ─── Channels pays (tableau top-level) ────────────────────────────────
    // Séparé du channels Map car ce sont des objets complexes
    countryChannels: {
        type: [countryChannelSchema],
        default: [],
    },

    // ─── Channels par continent (tableau top-level) ───────────────────────
    continentChannels: {
        type: [continentChannelSchema],
        default: [],
    },

    // ─── Module Tech Monitor (/tech setup) ────────────────────────────────
    techConfig: {
        enabled: { type: Boolean, default: false },
        preset: { type: String, enum: ['basic', 'standard', 'full'], default: 'basic' },
        channels: { type: [techChannelSchema], default: [] },
        enabledCategories: { type: [String], default: [] },
    },

    // ─── Permissions du bot ───────────────────────────────────────────────
    adminRoles: {
        type: [String],
        default: [],
    },
    modRoles: {
        type: [String],
        default: [],
    },

    // ─── Intervalles configurables ────────────────────────────────────────
    scrapeInterval: {
        type: Number,
        default: 300_000,
    },
    briefingInterval: {
        type: String,
        enum: ['1h', '3h', '5h', '12h', '24h'],
        default: '24h',
    },
    briefingEnabled: {
        type: Boolean,
        default: true,
    },
    mapEnabled: {
        type: Boolean,
        default: false,
    },
    crisisSystem: {
        type: Boolean,
        default: false,
    },

    // ─── Sources custom ───────────────────────────────────────────────────
    customRssFeeds: {
        type: [{
            name: String,
            url: String,
            reliability: { type: Number, default: 7 },
            active: { type: Boolean, default: true },
        }],
        default: [],
    },
    customTwitterAccounts: {
        type: [String],
        default: [],
    },

    // ─── Sources désactivées ──────────────────────────────────────────────
    disabledSources: {
        type: [String],
        default: [],
    },

    // ─── Filtres ──────────────────────────────────────────────────────────
    keywordFilters: {
        whitelist: { type: [String], default: [] },
        blacklist: { type: [String], default: [] },
    },

    // ─── Message IDs pour editer (index, briefing, panel) ─────────────────
    indexMessageId: {
        type: String,
        default: null,
    },
    panelMessageId: {
        type: String,
        default: null,
    },
    lastBriefingAt: {
        type: Date,
        default: null,
    },
    lastMapAt: {
        type: Date,
        default: null,
    },

    // ─── Rapport automatique ──────────────────────────────────────────────
    rapportEnabled: {
        type: Boolean,
        default: false,
    },
    rapportInterval: {
        type: String,
        enum: ['1h', '3h', '6h', '12h', '24h'],
        default: '24h',
    },
    rapportChannelId: {
        type: String,
        default: null,
    },

    // ─── Timestamps ───────────────────────────────────────────────────────
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Mise à jour automatique du timestamp updatedAt
serverConfigSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// ─── Méthodes pratiques ──────────────────────────────────────────────────

/**
 * Obtient l'ID d'un channel par son nom Discord
 * @param {string} channelName - Nom du channel (ex: 'economie-mondiale')
 * @returns {string|null}
 */
serverConfigSchema.methods.getChannelId = function (channelName) {
    if (!this.channels) return null;
    // Supporte Map Mongoose et plain object (après .lean())
    if (typeof this.channels.get === 'function') {
        return this.channels.get(channelName) || null;
    }
    return this.channels[channelName] || null;
};

/**
 * Obtient l'URL webhook d'un channel par son nom
 * @param {string} key - Nom du channel ou clé webhook
 * @returns {string|null}
 */
serverConfigSchema.methods.getWebhookUrl = function (key) {
    if (!this.webhooks) return null;
    if (typeof this.webhooks.get === 'function') {
        return this.webhooks.get(key) || null;
    }
    return this.webhooks[key] || null;
};

/**
 * Obtient l'ID d'un rôle par son nom
 * @param {string} roleName - Nom du rôle (ex: 'Alerte-Critique')
 * @returns {string|null}
 */
serverConfigSchema.methods.getRoleId = function (roleName) {
    if (!this.roles) return null;
    if (typeof this.roles.get === 'function') {
        return this.roles.get(roleName) || null;
    }
    return this.roles[roleName] || null;
};

serverConfigSchema.methods.isCategoryEnabled = function (category) {
    return this.enabledCategories.includes(category);
};

serverConfigSchema.methods.isAlertLevelEnabled = function (level) {
    return this.alertLevels.includes(level);
};

serverConfigSchema.methods.isCountryMonitored = function (countryCode) {
    return this.monitoredCountries.includes(countryCode);
};

/**
 * Trouve l'entrée de channel pays par code ISO
 * @param {string} countryCode - Code ISO (ex: 'FR')
 * @returns {object|null}
 */
serverConfigSchema.methods.getCountryChannel = function (countryCode) {
    if (!this.countryChannels) return null;
    return this.countryChannels.find(c => c.code === countryCode.toUpperCase()) || null;
};

module.exports = mongoose.model('ServerConfig', serverConfigSchema);
