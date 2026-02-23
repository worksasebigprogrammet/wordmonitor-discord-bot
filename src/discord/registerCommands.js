/**
 * src/discord/registerCommands.js
 * Enregistrement des commandes slash via l'API Discord REST
 *
 * V2 FIX :
 * - Accepte un paramètre client optionnel
 * - Utilise client.application.id en priorité (disponible seulement après ready)
 * - Fallback sur CLIENT_ID ou DISCORD_CLIENT_ID (les deux supportés)
 * - Enregistrement global (toutes les guilds)
 */

'use strict';

require('dotenv').config();
const { REST, Routes } = require('@discordjs/rest');
const logger = require('../utils/logger');
const commandHandler = require('./CommandHandler');

/**
 * Enregistre toutes les commandes slash dans l'API Discord
 * @param {Client} [client] - Client Discord (optionnel, utilisé pour récupérer l'application ID)
 */
async function registerCommands(client) {
    // Priorité : client.application.id (fiable après ready)
    // puis CLIENT_ID, puis DISCORD_CLIENT_ID (les deux sont supportés)
    const clientId =
        client?.application?.id ||
        process.env.CLIENT_ID ||
        process.env.DISCORD_CLIENT_ID;

    if (!clientId) {
        throw new Error(
            'Impossible de trouver le Client ID. ' +
            'Définissez CLIENT_ID dans les variables d\'environnement de Pterodactyl.'
        );
    }

    const token = process.env.DISCORD_TOKEN;
    if (!token) {
        throw new Error('DISCORD_TOKEN manquant dans .env');
    }

    // S'assurer que les commandes sont chargées
    if (commandHandler.commands.size === 0) {
        commandHandler.loadCommands();
    }

    const commands = commandHandler.getCommandsJSON();
    if (commands.length === 0) {
        logger.warn('[Register] Aucune commande à enregistrer');
        return [];
    }

    const rest = new REST({ version: '10' }).setToken(token);

    logger.info(`[Register] 📝 Enregistrement de ${commands.length} commandes (ID: ${clientId})...`);

    try {
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        const names = data.map(c => `/${c.name}`).join(', ');
        logger.info(`[Register] ✅ ${data.length} commandes enregistrées: ${names}`);
        return data;
    } catch (error) {
        logger.error(`[Register] ❌ Erreur: ${error.message}`);
        throw error;
    }
}

// Exécution directe (node src/discord/registerCommands.js)
if (require.main === module) {
    registerCommands()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Erreur:', err.message);
            process.exit(1);
        });
}

module.exports = { registerCommands };
