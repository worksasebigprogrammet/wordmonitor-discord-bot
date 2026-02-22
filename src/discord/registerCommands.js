/**
 * src/discord/registerCommands.js
 * Enregistrement des commandes slash via l'API Discord REST
 * À lancer une fois (ou après chaque changement de commande)
 */

'use strict';

require('dotenv').config();
const { REST, Routes } = require('@discordjs/rest');
const logger = require('../utils/logger');
const commandHandler = require('./CommandHandler');

async function registerCommands() {
    commandHandler.loadCommands();
    const commands = commandHandler.getCommandsJSON();

    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!token || !clientId) {
        throw new Error('DISCORD_TOKEN et DISCORD_CLIENT_ID requis dans .env');
    }

    const rest = new REST({ version: '10' }).setToken(token);

    logger.info(`[Register] 📝 Enregistrement de ${commands.length} commandes...`);

    try {
        // Enregistrement global (toutes les guilds)
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        logger.info(`[Register] ✅ ${data.length} commandes enregistrées avec succès`);
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
            console.error('Erreur:', err);
            process.exit(1);
        });
}

module.exports = { registerCommands };
