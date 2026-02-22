/**
 * src/utils/cooldown.js
 * Cooldown pour les commandes Discord
 * Empêche le spam des commandes (10s par défaut pour les utilisateurs normaux)
 */

'use strict';

const { BOT_LIMITS } = require('../config/constants');

// Map: commandName_userId → timestamp de la dernière utilisation
const cooldowns = new Map();

// Nettoyage périodique pour éviter les fuites mémoire
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of cooldowns.entries()) {
        if (now - timestamp > 60_000) { // Nettoyage après 1 min
            cooldowns.delete(key);
        }
    }
}, 60_000);

/**
 * Vérifie si un utilisateur est en cooldown pour une commande
 * @param {string} commandName - Nom de la commande
 * @param {string} userId - ID Discord de l'utilisateur
 * @param {number} cooldownSeconds - Durée du cooldown en secondes (défaut: 10)
 * @returns {{ onCooldown: boolean, remaining: number }} Statut et secondes restantes
 */
function checkCooldown(commandName, userId, cooldownSeconds = BOT_LIMITS.COOLDOWN_SECONDS) {
    const key = `${commandName}_${userId}`;
    const now = Date.now();
    const cooldownMs = cooldownSeconds * 1000;

    if (cooldowns.has(key)) {
        const lastUsed = cooldowns.get(key);
        const elapsed = now - lastUsed;

        if (elapsed < cooldownMs) {
            const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
            return { onCooldown: true, remaining };
        }
    }

    cooldowns.set(key, now);
    return { onCooldown: false, remaining: 0 };
}

/**
 * Re-initialise le cooldown d'un utilisateur (pour les admins par exemple)
 * @param {string} commandName
 * @param {string} userId
 */
function resetCooldown(commandName, userId) {
    cooldowns.delete(`${commandName}_${userId}`);
}

module.exports = { checkCooldown, resetCooldown };
