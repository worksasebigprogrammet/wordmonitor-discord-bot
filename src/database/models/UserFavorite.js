/**
 * src/database/models/UserFavorite.js
 * Modèle MongoDB pour les favoris utilisateur (bouton ⭐ sur les news)
 */

'use strict';

const mongoose = require('mongoose');

const userFavoriteSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    guildId: {
        type: String,
        required: true,
    },
    newsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News',
        required: true,
    },
    // Snapshot de la news au moment de la sauvegarde (pour afficher même si la news est supprimée)
    newsSnapshot: {
        title: String,
        titleFr: String,
        url: String,
        category: String,
        severity: String,
        country: String,
        sourceName: String,
        summary: String,
    },
    savedAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// Index composé pour vérification rapide "cet utilisateur a-t-il déjà ce favori ?"
userFavoriteSchema.index({ userId: 1, newsId: 1 }, { unique: true });

module.exports = mongoose.model('UserFavorite', userFavoriteSchema);
