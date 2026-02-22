/**
 * src/database/models/ServerConfig.js
 * Configuration par serveur Discord
 * Stocke tous les paramètres du bot pour chaque guild
 */

'use strict';

const mongoose = require('mongoose');

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
        type: [String], // Codes ISO des pays surveillés
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

    // ─── Channels Discord ─────────────────────────────────────────────────
    channels: {
        type: Map,
        of: String, // Nom du channel → ID du channel Discord
        default: {},
    },

    // ─── Webhooks Discord ─────────────────────────────────────────────────
    webhooks: {
        type: Map,
        of: String, // Catégorie/channel → URL du webhook
        default: {},
    },

    // ─── Rôles Discord ────────────────────────────────────────────────────
    roles: {
        type: Map,
        of: String, // Nom du rôle → ID du rôle Discord
        default: {},
    },

    // ─── Permissions du bot ───────────────────────────────────────────────
    adminRoles: {
        type: [String], // IDs des rôles pouvant utiliser /setup et /panel
        default: [],
    },
    modRoles: {
        type: [String], // IDs des rôles pouvant utiliser /crisis et /monitor
        default: [],
    },

    // ─── Intervalles configurables ────────────────────────────────────────
    scrapeInterval: {
        type: Number,
        default: 300_000, // 5 min
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

    // ─── Sources custom (ajoutées par l'utilisateur) ──────────────────────
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
serverConfigSchema.methods.getChannelId = function (channelName) {
    return this.channels.get(channelName) || null;
};

serverConfigSchema.methods.getWebhookUrl = function (key) {
    return this.webhooks.get(key) || null;
};

serverConfigSchema.methods.getRoleId = function (roleName) {
    return this.roles.get(roleName) || null;
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

module.exports = mongoose.model('ServerConfig', serverConfigSchema);
