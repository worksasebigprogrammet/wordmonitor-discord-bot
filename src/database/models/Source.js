/**
 * src/database/models/Source.js
 * Sources configurées avec leur fiabilité et historique d'erreurs
 */

'use strict';

const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: {
        type: String,
        enum: ['rss', 'twitter', 'api'],
        default: 'rss',
    },
    reliability: { type: Number, min: 0, max: 10, default: 7 },
    lang: { type: String, default: 'en' },
    category: { type: String, default: 'general' },
    active: { type: Boolean, default: true },
    // Statistiques de fiabilité observée
    successCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    lastSuccess: { type: Date, default: null },
    lastError: { type: Date, default: null },
    lastErrorMessage: { type: String, default: null },
    // Articles trouvés
    totalArticles: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Source', sourceSchema);
