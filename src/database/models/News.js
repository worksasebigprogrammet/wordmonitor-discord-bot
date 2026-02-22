/**
 * src/database/models/News.js
 * Modèle Mongoose pour les articles de news
 * TTL: Suppression automatique après 24h (configurable via NEWS_TTL_HOURS)
 */

'use strict';

const mongoose = require('mongoose');
const { BOT_LIMITS } = require('../../config/constants');

const newsSchema = new mongoose.Schema({
    // ─── Identification ───────────────────────────────────────────────────
    hash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    // ─── Contenu ──────────────────────────────────────────────────────────
    title: {
        type: String,
        required: true,
        maxlength: 500,
    },
    titleFr: {
        type: String,
        maxlength: 500,
    },
    description: {
        type: String,
        maxlength: 2000,
    },
    descriptionFr: {
        type: String,
        maxlength: 2000,
    },
    summary: {
        type: String,
        maxlength: 1500,
    },
    url: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        default: null,
    },

    // ─── Source ───────────────────────────────────────────────────────────
    sourceName: {
        type: String,
        required: true,
    },
    sourceType: {
        type: String,
        enum: ['rss', 'twitter', 'gdelt', 'usgs', 'google_news', 'reliefweb', 'newsapi', 'mediastack', 'currentsapi', 'netblocks'],
        default: 'rss',
    },
    sourceReliability: {
        type: Number,
        min: 0,
        max: 10,
        default: 7,
    },
    sourceLang: {
        type: String,
        default: 'en',
    },

    // ─── Classification ───────────────────────────────────────────────────
    country: {
        type: String,
        default: null,
        index: true,
    },
    continent: {
        type: String,
        enum: ['europe', 'middle_east', 'asia', 'africa', 'americas', null],
        default: null,
        index: true,
    },
    category: {
        type: String,
        default: 'diplomacy',
        index: true,
    },
    categoryConfidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
    },

    // ─── Gravité ──────────────────────────────────────────────────────────
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'low',
        index: true,
    },
    severityScore: {
        type: Number,
        min: 0,
        max: 10,
        default: 1,
    },

    // ─── Dédoublonnage ────────────────────────────────────────────────────
    reportedBy: {
        type: [String], // Liste des sources qui ont rapporté cet article
        default: [],
    },
    reportCount: {
        type: Number,
        default: 1,
    },

    // ─── Statut de publication ────────────────────────────────────────────
    published: {
        type: Boolean,
        default: false,
    },
    publishedAt: {
        type: Date,
        default: null,
    },
    publishedTo: {
        type: [String], // IDs des guilds où l'article a été publié
        default: [],
    },
    discordMessageIds: {
        type: Map,
        of: String, // guildId → messageId
        default: {},
    },

    // ─── Timestamps ───────────────────────────────────────────────────────
    originalDate: {
        type: Date,
        default: Date.now,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // TTL index: suppression auto après NEWS_TTL_HOURS heures
        expires: (BOT_LIMITS.NEWS_TTL_HOURS || 24) * 3600,
    },
});

// ─── Index composés pour les requêtes fréquentes ──────────────────────────
newsSchema.index({ category: 1, createdAt: -1 });
newsSchema.index({ country: 1, createdAt: -1 });
newsSchema.index({ continent: 1, createdAt: -1 });
newsSchema.index({ severity: 1, createdAt: -1 });
newsSchema.index({ published: 1, severity: 1 });

// ─── Méthodes d'instance ─────────────────────────────────────────────────
newsSchema.methods.addSource = function (sourceName) {
    if (!this.reportedBy.includes(sourceName)) {
        this.reportedBy.push(sourceName);
        this.reportCount = this.reportedBy.length;
    }
    return this;
};

module.exports = mongoose.model('News', newsSchema);
