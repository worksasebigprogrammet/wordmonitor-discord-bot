'use strict';

const { REST, Routes } = require('@discordjs/rest');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

async function registerCommands(client) {
    const clientId = client?.application?.id
        || process.env.CLIENT_ID
        || process.env.DISCORD_CLIENT_ID;

    if (!clientId) {
        throw new Error('CLIENT_ID introuvable');
    }

    const token = process.env.DISCORD_TOKEN;
    if (!token) {
        throw new Error('DISCORD_TOKEN manquant');
    }

    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

    const commands = [];
    for (const file of commandFiles) {
        try {
            const cmd = require(path.join(commandsPath, file));
            if (cmd?.data?.toJSON) {
                commands.push(cmd.data.toJSON());
            }
        } catch (err) {
            logger.warn(`[Register] ⚠️ Impossible de charger ${file}: ${err.message}`);
        }
    }

    logger.info(`[Register] 📝 Enregistrement de ${commands.length} commandes (ID: ${clientId})...`);

    const rest = new REST({ version: '10' }).setToken(token);

    const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
    );

    const names = data.map(c => `/${c.name}`).join(', ');
    logger.info(`[Register] ✅ ${data.length} commandes enregistrées: ${names}`);

    return data;
}

module.exports = { registerCommands };
