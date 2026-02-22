/**
 * src/discord/commands/status.js
 * Commande /status - Voir le statut du bot et des sources
 */

'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStats } = require('../../collectors/CollectorManager');
const { getDeepLUsage } = require('../../processors/Translator');
const { isDatabaseConnected } = require('../../database/connection');
const BotStats = require('../../database/models/BotStats');
const { SEVERITY_COLORS } = require('../../config/constants');
const { checkCooldown } = require('../../utils/cooldown');
const { ALL_RSS_FEEDS } = require('../../config/sources');
const logger = require('../../utils/logger');
const os = require('os');

const command = new SlashCommandBuilder()
    .setName('status')
    .setDescription('🔧 Statut du bot et des sources de données');

module.exports = {
    data: command,
    async execute(interaction) {
        const { onCooldown, remaining } = checkCooldown('status', interaction.user.id, 60);
        if (onCooldown) {
            return interaction.reply({ content: `⏱️ Cooldown: ${remaining}s`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const collectorStats = getStats();
            const deepLUsage = await getDeepLUsage();
            const dbConnected = isDatabaseConnected();

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const botStats = await BotStats.findOne({ date: today }).lean();

            const activeRSSFeeds = ALL_RSS_FEEDS.filter(f => f.active !== false).length;
            const uptime = process.uptime();
            const uptimeHours = Math.floor(uptime / 3600);
            const uptimeMinutes = Math.floor((uptime % 3600) / 60);
            const memUsage = process.memoryUsage();

            const embed = new EmbedBuilder()
                .setColor(dbConnected ? SEVERITY_COLORS.low : SEVERITY_COLORS.critical)
                .setTitle('🔧 Statut WorldMonitor')
                .addFields(
                    {
                        name: '💾 Infrastructure',
                        value: [
                            `MongoDB: ${dbConnected ? '✅ Connecté' : '❌ Déconnecté'}`,
                            `Uptime: **${uptimeHours}h ${uptimeMinutes}min**`,
                            `RAM: **${Math.round(memUsage.heapUsed / 1024 / 1024)}MB** / ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
                        ].join('\n'),
                        inline: true,
                    },
                    {
                        name: '📡 Collecteur',
                        value: [
                            `Cycles: **#${collectorStats.cycleCount}**`,
                            `En cours: ${collectorStats.isRunning ? '🔄 Oui' : '⬤ Non'}`,
                            `Erreurs: **${collectorStats.errors}**`,
                            `Total collecté: **${collectorStats.totalArticles}**`,
                        ].join('\n'),
                        inline: true,
                    },
                    {
                        name: '📰 Stats du jour',
                        value: [
                            `Scrapées: **${botStats?.newsScraped || 0}**`,
                            `Publiées: **${botStats?.newsPublished || 0}**`,
                            `Dédupliquées: **${botStats?.newsDeduplicated || 0}**`,
                            `Erreurs sources: **${botStats?.sourceErrors || 0}**`,
                        ].join('\n'),
                        inline: true,
                    },
                    {
                        name: '🌐 Sources',
                        value: [
                            `RSS actifs: **${activeRSSFeeds}** flux`,
                            `GDELT: ✅`,
                            `USGS: ✅`,
                            `Google News: ✅`,
                            `Nitter: ⚠️ Variable`,
                        ].join('\n'),
                        inline: true,
                    },
                    {
                        name: '🌍 Traduction',
                        value: deepLUsage.available
                            ? [
                                `DeepL: ✅ Actif`,
                                `Utilisé: **${(deepLUsage.charCount || 0).toLocaleString()}** / ${(deepLUsage.charLimit || 0).toLocaleString()} chars`,
                                `Reste: **${Math.round(((deepLUsage.charLimit - deepLUsage.charCount) / deepLUsage.charLimit) * 100)}%**`,
                            ].join('\n')
                            : 'DeepL: ⚠️ Non configuré\nFallback: LibreTranslate',
                        inline: true,
                    },
                )
                .setTimestamp()
                .setFooter({ text: `WorldMonitor v1.0.0 • Node ${process.version}` });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error(`[Status] Erreur: ${error.message}`);
            await interaction.editReply({ content: `❌ Erreur: ${error.message}` });
        }
    },
};
