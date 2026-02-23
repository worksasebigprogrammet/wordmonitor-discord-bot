/**
 * src/discord/publisher/IndexPublisher.js
 * Mise à jour de l'embed d'index de tension (en direct editing)
 * Met à jour le message fixé dans le channel index-global toutes les 10 min
 *
 * V3 FIX :
 * - Logs explicites à chaque étape pour tracer les échecs silencieux
 * - Le scheduler continue même si la première mise à jour échoue
 * - Catch complets avec stack traces dans les erreurs
 * - discordQueue errors properly caught
 */

'use strict';

const cron = require('node-cron');
const logger = require('../../utils/logger');
const { buildIndexEmbed } = require('../embeds/indexEmbed');
const { calculateAndSaveIndexes } = require('../../processors/IndexCalculator');
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
    const guildId = serverConfigDoc.guildId;
    const lang = serverConfigDoc.language || 'fr';

    logger.debug(`[IndexPublisher] Traitement serveur ${guildId}...`);

    let embed;
    try {
        embed = buildIndexEmbed(indexData, { lang });
    } catch (err) {
        logger.error(`[IndexPublisher] ❌ Erreur buildIndexEmbed pour ${guildId}: ${err.message}`);
        return;
    }

    const channels = serverConfigDoc.channels || {};
    const webhooks = serverConfigDoc.webhooks || {};

    // Clé 'index-global' — correspond au nom du channel créé par setup.js
    const channelId = getChannel(channels, 'index-global');
    const webhookUrl = getChannel(webhooks, 'index-global');

    if (!channelId && !webhookUrl) {
        logger.debug(`[IndexPublisher] Pas de channel/webhook index-global pour guild ${guildId} — ignoré`);
        return;
    }

    logger.debug(`[IndexPublisher] Guild ${guildId}: channelId=${channelId || 'N/A'}, webhook=${webhookUrl ? 'oui' : 'non'}`);

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
                    logger.debug(`[IndexPublisher] ✅ Message ${existingMsgId} mis à jour via webhook (guild ${guildId})`);
                    return;
                } catch (editErr) {
                    // Le message n'existe plus (supprimé manuellement), créer un nouveau
                    logger.debug(`[IndexPublisher] Message ${existingMsgId} introuvable (${editErr.message}), création d'un nouveau`);
                }
            }

            const msg = await webhookClient.send({ embeds: [embed] });
            logger.info(`[IndexPublisher] ✅ Nouveau message index créé via webhook: ${msg.id} (guild ${guildId})`);
            await ServerConfig.findOneAndUpdate(
                { guildId },
                { indexMessageId: msg.id }
            );

        } else if (client && channelId) {
            const channel = await client.channels.fetch(channelId).catch(fetchErr => {
                logger.warn(`[IndexPublisher] Impossible de fetch channel ${channelId} (guild ${guildId}): ${fetchErr.message}`);
                return null;
            });
            if (!channel) return;

            const existingMsgId = serverConfigDoc.indexMessageId;
            if (existingMsgId) {
                try {
                    const existingMsg = await channel.messages.fetch(existingMsgId);
                    await existingMsg.edit({ embeds: [embed] });
                    logger.debug(`[IndexPublisher] ✅ Message ${existingMsgId} mis à jour dans channel (guild ${guildId})`);
                    return;
                } catch (editErr) {
                    // Message disparu, créer un nouveau
                    logger.debug(`[IndexPublisher] Message ${existingMsgId} introuvable (${editErr.message}), création d'un nouveau`);
                }
            }

            const msg = await channel.send({ embeds: [embed] });
            logger.info(`[IndexPublisher] ✅ Nouveau message index créé: ${msg.id} (guild ${guildId})`);
            await ServerConfig.findOneAndUpdate(
                { guildId },
                { indexMessageId: msg.id }
            );
        }
    } catch (error) {
        logger.error(`[IndexPublisher] ❌ Erreur mise à jour index pour guild ${guildId}: ${error.message}\n${error.stack}`);
    }
}

/**
 * Met à jour l'index pour tous les serveurs configurés
 * @param {object} client - Client Discord.js
 */
async function updateAllIndexes(client) {
    try {
        logger.debug('[IndexPublisher] 📊 Calcul des index...');
        const indexData = await calculateAndSaveIndexes();

        if (!indexData) {
            logger.warn('[IndexPublisher] ⚠️ calculateAndSaveIndexes() a retourné null — aucun index à publier (normal au premier démarrage)');
            return;
        }

        logger.info(`[IndexPublisher] 📊 Index global calculé: ${indexData.global}/10`);

        // Charger TOUS les serveurs (sans filtre setupComplete pour les anciens docs)
        const servers = await ServerConfig.find({}).lean();

        if (servers.length === 0) {
            logger.warn('[IndexPublisher] ⚠️ Aucun serveur configuré en base — rien à publier');
            return;
        }

        logger.debug(`[IndexPublisher] Publication vers ${servers.length} serveur(s)...`);

        for (const serverData of servers) {
            // On catch les erreurs de la queue pour éviter les unhandled rejections
            discordQueue.add(
                () => updateIndexForServer(serverData, indexData, client),
                'low'
            ).catch(err => {
                logger.error(`[IndexPublisher] ❌ Erreur dans la queue pour guild ${serverData.guildId}: ${err.message}`);
            });
        }
    } catch (error) {
        logger.error(`[IndexPublisher] ❌ Erreur mise à jour globale: ${error.message}\n${error.stack}`);
    }
}

/**
 * Démarre le scheduler de mise à jour de l'index
 * Lance une mise à jour IMMÉDIATE au démarrage, puis toutes les N minutes
 * Le scheduler continue même si la première mise à jour échoue.
 * @param {object} client - Client Discord.js
 */
function startIndexScheduler(client) {
    const intervalMinutes = Math.max(1, Math.floor(INTERVALS.INDEX_UPDATE / 60_000));

    // ── Scheduler cron récurrent ──────────────────────────────────────────
    cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
        logger.debug('[IndexPublisher] ⏰ Mise à jour périodique...');
        await updateAllIndexes(client);
    });

    logger.info(`[IndexPublisher] ⏰ Scheduler index démarré (toutes les ${intervalMinutes} min)`);

    // ── Lancement immédiat au démarrage (après 5s) ────────────────────────
    // Enveloppé dans un try/catch pour ne JAMAIS bloquer le boot
    setTimeout(async () => {
        logger.info('[IndexPublisher] 🚀 Mise à jour initiale de l\'index...');
        try {
            await updateAllIndexes(client);
            logger.info('[IndexPublisher] ✅ Mise à jour initiale terminée');
        } catch (err) {
            logger.error(`[IndexPublisher] ❌ Erreur lors de la mise à jour initiale: ${err.message}\n${err.stack}`);
            logger.info('[IndexPublisher] ⏰ Le scheduler cron continue normalement malgré l\'erreur initiale');
        }
    }, 5_000);
}

module.exports = { updateAllIndexes, startIndexScheduler, updateIndexForServer };
