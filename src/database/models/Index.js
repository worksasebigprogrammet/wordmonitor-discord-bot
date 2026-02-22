/**
 * src/database/models/Index.js
 * Historique des index de tension (global + régional + catégorie)
 * Permet de calculer les tendances et d'afficher l'évolution
 */

'use strict';

const mongoose = require('mongoose');

const indexSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
        expires: 7 * 24 * 3600, // TTL : suppression après 7 jours
    },

    // ─── Index global ─────────────────────────────────────────────────────
    global: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
    },

    // ─── Index par continent ──────────────────────────────────────────────
    continents: {
        europe: { type: Number, min: 0, max: 10, default: 0 },
        middle_east: { type: Number, min: 0, max: 10, default: 0 },
        asia: { type: Number, min: 0, max: 10, default: 0 },
        africa: { type: Number, min: 0, max: 10, default: 0 },
        americas: { type: Number, min: 0, max: 10, default: 0 },
    },

    // ─── Index par catégorie ──────────────────────────────────────────────
    categories: {
        conflicts: { type: Number, min: 0, max: 10, default: 0 },
        military_movements: { type: Number, min: 0, max: 10, default: 0 },
        nuclear: { type: Number, min: 0, max: 10, default: 0 },
        economy: { type: Number, min: 0, max: 10, default: 0 },
        maritime: { type: Number, min: 0, max: 10, default: 0 },
        natural_disasters: { type: Number, min: 0, max: 10, default: 0 },
        terrorism: { type: Number, min: 0, max: 10, default: 0 },
        outages: { type: Number, min: 0, max: 10, default: 0 },
        health: { type: Number, min: 0, max: 10, default: 0 },
        diplomacy: { type: Number, min: 0, max: 10, default: 0 },
    },

    // ─── Top pays par tension ─────────────────────────────────────────────
    hotZones: [{
        country: { type: String },
        score: { type: Number, min: 0, max: 10 },
        continent: { type: String },
    }],

    // ─── Nombre de news par catégorie (pour ce snapshot) ─────────────────
    newsCounts: {
        type: Map,
        of: Number,
        default: {},
    },
});

module.exports = mongoose.model('Index', indexSchema);
