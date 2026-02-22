/**
 * src/database/connection.js
 * Connexion MongoDB Atlas via Mongoose
 * Gère la reconnexion automatique et les événements de connexion
 */

'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Options de connexion Mongoose
const MONGOOSE_OPTIONS = {
    maxPoolSize: 5,           // Pool de connexions réduit pour économiser la RAM
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,               // Forcer IPv4
    connectTimeoutMS: 10000,
};

let isConnected = false;

/**
 * Établit la connexion à MongoDB Atlas
 * @returns {Promise<void>}
 */
async function connectDatabase() {
    if (isConnected) {
        logger.info('[DB] Déjà connecté à MongoDB');
        return;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI manquant dans le fichier .env');
    }

    try {
        await mongoose.connect(uri, MONGOOSE_OPTIONS);
        isConnected = true;
        logger.info('[DB] ✅ Connecté à MongoDB Atlas avec succès');
    } catch (error) {
        logger.error(`[DB] ❌ Erreur de connexion MongoDB: ${error.message}`);
        throw error;
    }
}

// ─── Événements de connexion Mongoose ────────────────────────────────────────

mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info('[DB] MongoDB connecté');
});

mongoose.connection.on('error', (err) => {
    isConnected = false;
    logger.error(`[DB] Erreur MongoDB: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('[DB] MongoDB déconnecté - Tentative de reconnexion...');
});

mongoose.connection.on('reconnected', () => {
    isConnected = true;
    logger.info('[DB] MongoDB reconnecté');
});

// Fermeture propre lors de l'arrêt du processus
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('[DB] Connexion MongoDB fermée proprement');
    process.exit(0);
});

/**
 * Vérifie si la connexion est active
 * @returns {boolean}
 */
function isDatabaseConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Ferme la connexion proprement
 * @returns {Promise<void>}
 */
async function closeDatabase() {
    if (isConnected) {
        await mongoose.connection.close();
        isConnected = false;
        logger.info('[DB] Connexion MongoDB fermée');
    }
}

module.exports = { connectDatabase, isDatabaseConnected, closeDatabase };
