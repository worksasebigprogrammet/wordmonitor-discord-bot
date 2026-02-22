/**
 * src/database/models/BotStats.js
 * Statistiques globales du bot (news scrapées, erreurs, uptime, etc.)
 */

'use strict';

const mongoose = require('mongoose');

const botStatsSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: () => new Date().setHours(0, 0, 0, 0), // Début du jour
        unique: true,
        index: true,
    },
    // Compteurs de news
    newsScraped: { type: Number, default: 0 },
    newsPublished: { type: Number, default: 0 },
    newsDeduplicated: { type: Number, default: 0 },
    newsTranslated: { type: Number, default: 0 },
    // Compteurs par gravité
    criticalCount: { type: Number, default: 0 },
    highCount: { type: Number, default: 0 },
    mediumCount: { type: Number, default: 0 },
    lowCount: { type: Number, default: 0 },
    // Par catégorie
    categoryBreakdown: {
        type: Map,
        of: Number,
        default: {},
    },
    // Par continent
    continentBreakdown: {
        type: Map,
        of: Number,
        default: {},
    },
    // Erreurs
    sourceErrors: { type: Number, default: 0 },
    apiErrors: { type: Number, default: 0 },
    translationErrors: { type: Number, default: 0 },
    // Performance
    avgProcessingTime: { type: Number, default: 0 }, // en ms
    peakNewsPerHour: { type: Number, default: 0 },
    // Sources actives
    activeSources: { type: Number, default: 0 },
    failedSources: { type: Number, default: 0 },
});

module.exports = mongoose.model('BotStats', botStatsSchema);
