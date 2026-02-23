/**
 * src/discord/publisher/IndexPublisher.js
 * Mise à jour de l'embed d'index de tension (en direct editing)
 * Met à jour le message fixé dans le channel index-global toutes les 10 min
 *
 * V2 : Utilise les noms de channels comme clés (index-global)
 *      Lance une mise à jour immédiate au démarrage
 *      Utilise getChannel() helper pour compatibilité Map/plain object
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
 * Obtient la valeur d'une clé dans un channels Map ou plain object
 * @param {Map|object} channels
 * @param {string} key
 * @returns {string|null}
 */
function getChannel(channels, key) {
    if (!channels) return null;
    if (typeof channels.get === 'function') return channels.get(key) || null;
    return channels[key] || null;
}

/**
 * Met à jour le message d'index pour un serveur
 * @param {object} serverConfigDoc - Plain object (lean) ou instance Mongoose
 * @param {object} indexData - Données de l'index
 * @param {object} client - Client Discord.js
 */
async function updateIndexForServer(serverConfigDoc, indexData, client) {
    const lang = serverConfigDoc.language || 'fr';
    const embed = buildIndexEmbed(indexData, { lang });

    const channels = serverConfigDoc.channels || {};
    const webhooks = serverConfigDoc.webhooks || {};

    // Clé 'index-global' — correspond au nom du channel créé par setup.js
    const channelId = getChannel(channels, 'index-global');
    const webhookUrl = getChannel(webhooks, 'index-global');

    if (!channelId && !webhookUrl) {
        logger.debug(`[IndexPublisher] Pas de channel index-global pour guild ${serverConfigDoc.guildId}`);
        return;
    }

    try {
        if (webhookUrl) {
            let webhookClient = indexWebhookCache.get(webhookUrl);
            if (!webhookClient) {
                webhookClient = new WebhookClient({ url: webhookUrl });
                indexWebhookCache.set(webhookUrl, webhookClient);
            }

            // Si un message d'index existe déjà, l'éditer
            const existingMsgId = serverConfigDoc.indexMessageId;
            if (existingMsgId) {
                try {
                    await webhookClient.editMessage(existingMsgId, { embeds: [embed] });
                    return;
                } catch {
                    // Le message n'existe plus (supprimé manuellement), créer un nouveau
                    logger.debug(`[IndexPublisher] Message ${existingMsgId} introuvable, création d'un nouveau`);
                }
            }

            const msg = await webhookClient.send({ embeds: [embed] });
            await ServerConfig.findOneAndUpdate(
                { guildId: serverConfigDoc.guildId },
                { indexMessageId: msg.id }
            );

        } else if (client && channelId) {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel) return;

            const existingMsgId = serverConfigDoc.indexMessageId;
            if (existingMsgId) {
                try {
                    const existingMsg = await channel.messages.fetch(existingMsgId);
                    await existingMsg.edit({ embeds: [embed] });
                    return;
                } catch {
                    // Message disparu, créer un nouveau
                    logger.debug(`[IndexPublisher] Message ${existingMsgId} introuvable, création d'un nouveau`);
                }
            }

            const msg = await channel.send({ embeds: [embed] });
            await ServerConfig.findOneAndUpdate(
                { guildId: serverConfigDoc.guildId },
                { indexMessageId: msg.id }
            );
        }
    } catch (error) {
        logger.error(`[IndexPublisher] Erreur mise à jour index ${serverConfigDoc.guildId}: ${error.message}`);
    }
}

/**
 * Met à jour l'index pour tous les serveurs configurés
 * @param {object} client - Client Discord.js
 */
async function updateAllIndexes(client) {
    try {
        const indexData = await calculateAndSaveIndexes();
        if (!indexData) return;

        logger.debug(`[IndexPublisher] 📊 Index global: ${indexData.global}`);

        // Charger TOUS les serveurs (sans filtre setupComplete pour les anciens docs)
        const servers = await ServerConfig.find({}).lean();

        for (const serverData of servers) {
            discordQueue.add(
                () => updateIndexForServer(serverData, indexData, client),
                'low'
            );
        }
    } catch (error) {
        logger.error(`[IndexPublisher] Erreur mise à jour globale: ${error.message}`);
    }
}

/**
 * Démarre le scheduler de mise à jour de l'index
 * Lance une mise à jour IMMÉDIATE au démarrage, puis toutes les N minutes
 * @param {object} client - Client Discord.js
 */
function startIndexScheduler(client) {
    const intervalMinutes = Math.max(1, Math.floor(INTERVALS.INDEX_UPDATE / 60_000));

    cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
        await updateAllIndexes(client);
    });

    // 🚀 Lancement immédiat au démarrage (après 5s pour laisser le bot se connecter)
    setTimeout(() => {
        logger.info('[IndexPublisher] 🚀 Mise à jour initiale de l\'index...');
        updateAllIndexes(client).catch(err =>
            logger.warn(`[IndexPublisher] Erreur initiale: ${err.message}`)
        );
    }, 5_000);

    logger.info(`[IndexPublisher] ⏰ Scheduler index démarré (toutes les ${intervalMinutes} min)`);
}

module.exports = { updateAllIndexes, startIndexScheduler, updateIndexForServer };
