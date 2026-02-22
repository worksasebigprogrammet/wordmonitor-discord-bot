/**
 * src/database/models/Crisis.js
 * Modèle pour le suivi des crises actives
 * Créées via /crisis create, fermées via /crisis close
 */

'use strict';

const mongoose = require('mongoose');

const crisisSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        maxlength: 100,
    },
    description: {
        type: String,
        maxlength: 500,
        default: '',
    },
    keywords: {
        type: [String],
        default: [],
    },
    // Statut de la crise
    status: {
        type: String,
        enum: ['active', 'monitoring', 'closed'],
        default: 'active',
    },
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'high',
    },
    // IDs Discord de la structure créée
    categoryId: {
        type: String,
        default: null,
    },
    mainChannelId: {
        type: String,
        default: null,
    },
    webhookUrl: {
        type: String,
        default: null,
    },
    // Statistiques
    newsCount: {
        type: Number,
        default: 0,
    },
    lastNewsAt: {
        type: Date,
        default: null,
    },
    // Utilisateur qui a créé la crise
    createdBy: {
        type: String,
        required: true,
    },
    closedBy: {
        type: String,
        default: null,
    },
    closedAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

crisisSchema.index({ guildId: 1, status: 1 });

module.exports = mongoose.model('Crisis', crisisSchema);
