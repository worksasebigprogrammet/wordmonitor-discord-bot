/**
 * src/discord/publisher/IndexPublisher.js
 * Mise à jour de l'embed d'index de tension (en direct editing)
 * Met à jour le message fixé dans le channel index-global toutes les 10 min
 */

'use strict';

const cron = require('node-cron');
const logger = require('../../utils/logger');
const { buildIndexEmbed } = require('../embeds/indexEmbed');
const { calculateAndSaveIndexes, getLatestIndex } = require('../../processors/IndexCalculator');
const ServerConfig = require('../../database/models/ServerConfig');
const { WebhookClient } = require('discord.js');
const { discordQueue } = require('../../utils/queue');
const { INTERVALS } = require('../../config/constants');

// Cache des webhooks d'index
const indexWebhookCache = new Map();

/**
 * Met à jour le message d'index pour un serveur
 * @param {object} serverConfig - Config du serveur (instance Mongoose)
 * @param {object} indexData - Données de l'index
 * @param {object} client - Client Discord.js
 */
async function updateIndexForServer(serverConfig, indexData, client) {
    const lang = serverConfig.language || 'fr';
    const embed = buildIndexEmbed(indexData, { lang });

    // Chercher le channel index-global
    const channelId = serverConfig.getChannelId('index-global');
    const webhookUrl = serverConfig.getWebhookUrl('index-global');

    if (!channelId && !webhookUrl) return;

    try {
        if (webhookUrl) {
            let webhookClient = indexWebhookCache.get(webhookUrl);
            if (!webhookClient) {
                webhookClient = new WebhookClient({ url: webhookUrl });
                indexWebhookCache.set(webhookUrl, webhookClient);
            }

            // Si un message d'index existe déjà, l'éditer
            const existingMsgId = serverConfig.indexMessageId;
            if (existingMsgId) {
                try {
                    await webhookClient.editMessage(existingMsgId, { embeds: [embed] });
                    return;
                } catch {
                    // Le message n'existe plus, en créer un nouveau
                }
            }

            // Envoyer un nouveau message
            const msg = await webhookClient.send({ embeds: [embed] });
            await ServerConfig.findByIdAndUpdate(serverConfig._id, { indexMessageId: msg.id });
        } else if (client && channelId) {
            // Utiliser le client Discord directement si pas de webhook
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel) return;

            const existingMsgId = serverConfig.indexMessageId;
            if (existingMsgId) {
                try {
                    const msg = await channel.messages.fetch(existingMsgId);
                    await msg.edit({ embeds: [embed] });
                    return;
                } catch {
                    // Message non trouvé, créer un nouveau
                }
            }

            const msg = await channel.send({ embeds: [embed] });
            await ServerConfig.findByIdAndUpdate(serverConfig._id, { indexMessageId: msg.id });
        }
    } catch (error) {
        logger.error(`[IndexPublisher] Erreur mise à jour index ${serverConfig.guildId}: ${error.message}`);
    }
}

/**
 * Met à jour l'index pour tous les serveurs configurés
 * @param {object} client - Client Discord.js
 */
async function updateAllIndexes(client) {
    try {
        // Calculer les nouveaux index
        const indexData = await calculateAndSaveIndexes();
        if (!indexData) return;

        logger.debug(`[IndexPublisher] 📊 Index global: ${indexData.global}`);

        const servers = await ServerConfig.find({ setupComplete: true }).lean();
        for (const serverData of servers) {
            const serverConfig = new ServerConfig(serverData);
            discordQueue.add(
                () => updateIndexForServer(serverConfig, indexData, client),
                'low'
            );
        }
    } catch (error) {
        logger.error(`[IndexPublisher] Erreur mise à jour globale: ${error.message}`);
    }
}

/**
 * Démarre le scheduler de mise à jour de l'index
 * @param {object} client - Client Discord.js
 */
function startIndexScheduler(client) {
    const intervalMinutes = Math.floor(INTERVALS.INDEX_UPDATE / 60_000);
    cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
        await updateAllIndexes(client);
    });
    logger.info(`[IndexPublisher] ⏰ Scheduler index démarré (toutes les ${intervalMinutes} min)`);
}

module.exports = { updateAllIndexes, startIndexScheduler, updateIndexForServer };
