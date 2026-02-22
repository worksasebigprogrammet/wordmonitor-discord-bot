/**
 * src/discord/commands/panel.js
 * Commande /panel - Panneau de contrôle principal
 * Affiche les stats, index et permet des actions rapides
 */

'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} = require('discord.js');

const ServerConfig = require('../../database/models/ServerConfig');
const News = require('../../database/models/News');
const BotStats = require('../../database/models/BotStats');
const { getLatestIndex } = require('../../processors/IndexCalculator');
const { getCurrentHotZones } = require('../../processors/HotZoneDetector');
const { buildIndexEmbed, indexToBar, indexToLabel } = require('../embeds/indexEmbed');
const { SEVERITY_COLORS, SEVERITY_EMOJIS } = require('../../config/constants');
const { getStats } = require('../../collectors/CollectorManager');
const logger = require('../../utils/logger');

/**
 * Construit le panneau de contrôle principal
 */
async function buildPanel(guildId) {
    const serverConfig = await ServerConfig.findOne({ guildId }).lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats, latestIndex, hotZones] = await Promise.all([
        BotStats.findOne({ date: today }).lean(),
        getLatestIndex(),
        Promise.resolve(getCurrentHotZones()),
    ]);

    const collectorStats = getStats();
    const globalScore = latestIndex?.global ?? 0;
    const globalLabel = indexToLabel(globalScore);
    const globalBar = indexToBar(globalScore);

    const embed = new EmbedBuilder()
        .setColor(globalScore >= 7 ? SEVERITY_COLORS.critical
            : globalScore >= 5 ? SEVERITY_COLORS.high
                : globalScore >= 3 ? SEVERITY_COLORS.medium
                    : 0x5865F2)
        .setTitle('🌍 WorldMonitor — Panneau de Contrôle')
        .setDescription(
            `## ${globalBar}\n**Index Global: ${globalScore.toFixed(1)}/10 — ${globalLabel}**`
        )
        .addFields(
            {
                name: '📊 Stats du jour',
                value: [
                    `📥 Collectées: **${stats?.newsScraped || 0}**`,
                    `📤 Publiées: **${stats?.newsPublished || 0}**`,
                    `🔴 Critiques: **${stats?.criticalCount || 0}**`,
                    `🟠 Hautes: **${stats?.highCount || 0}**`,
                ].join('\n'),
                inline: true,
            },
            {
                name: '⚙️ Collecteur',
                value: [
                    `Cycle #${collectorStats.cycleCount}`,
                    `En cours: ${collectorStats.isRunning ? '✅' : '⬤'}`,
                    `Erreurs: ${collectorStats.errors}`,
                    `Dernière collecte: ${collectorStats.lastRun ? `<t:${Math.floor(new Date(collectorStats.lastRun).getTime() / 1000)}:R>` : 'N/A'}`,
                ].join('\n'),
                inline: true,
            },
            {
                name: '🔧 Configuration',
                value: serverConfig ? [
                    `Preset: **${serverConfig.preset}**`,
                    `Langue: **${serverConfig.language}**`,
                    `Catégories: **${serverConfig.enabledCategories?.length || 0}**`,
                    `Pays: **${serverConfig.monitoredCountries?.length || 0}**`,
                ].join('\n') : '*Non configuré*',
                inline: true,
            }
        )
        .setTimestamp()
        .setFooter({ text: 'WorldMonitor • Mise à jour en temps réel' });

    // Zones chaudes
    if (hotZones.length > 0) {
        embed.addFields({
            name: '🔥 Zones Chaudes',
            value: hotZones.slice(0, 3).map(z => `🔥 **${z.country}** — ${z.count} événements`).join('\n'),
            inline: false,
        });
    }

    return embed;
}

/**
 * Boutons du panneau de contrôle
 */
function buildPanelButtons() {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('panel_refresh')
            .setLabel('🔄 Actualiser')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('panel_briefing')
            .setLabel('📊 Briefing maintenant')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('panel_index')
            .setLabel('📈 Voir l\'index')
            .setStyle(ButtonStyle.Primary),
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('panel_sources')
            .setLabel('📡 Sources actives')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('panel_config')
            .setLabel('⚙️ Configuration')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('panel_reset')
            .setLabel('♻️ Réinitialiser')
            .setStyle(ButtonStyle.Danger),
    );

    return [row1, row2];
}

const command = new SlashCommandBuilder()
    .setName('panel')
    .setDescription('📊 Panneau de contrôle WorldMonitor')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

module.exports = {
    data: command,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const embed = await buildPanel(interaction.guildId);
            const buttons = buildPanelButtons();
            await interaction.editReply({ embeds: [embed], components: buttons });
        } catch (error) {
            logger.error(`[Panel] Erreur: ${error.message}`);
            await interaction.editReply({ content: `❌ Erreur: ${error.message}` });
        }
    },
    async handleComponent(interaction) {
        const { customId } = interaction;

        if (customId === 'panel_refresh') {
            const embed = await buildPanel(interaction.guildId);
            return interaction.update({ embeds: [embed], components: buildPanelButtons() });
        }

        if (customId === 'panel_index') {
            const { getLatestIndex: getLI } = require('../../processors/IndexCalculator');
            const indexData = await getLI();
            const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId }).lean();
            const embed = buildIndexEmbed(indexData, { lang: serverConfig?.language || 'fr' });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (customId === 'panel_briefing') {
            const { publishBriefingForServer } = require('./BriefingPublisher');
            const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId });
            if (serverConfig) {
                await publishBriefingForServer(serverConfig, serverConfig.briefingInterval || '24h');
            }
            return interaction.reply({ content: '✅ Briefing publié !', ephemeral: true });
        }

        if (customId === 'panel_sources') {
            const { ALL_RSS_FEEDS } = require('../../config/sources');
            const active = ALL_RSS_FEEDS.filter(f => f.active !== false).length;
            return interaction.reply({
                content: `📡 **Sources actives:** ${active} flux RSS + GDELT + USGS + Google News + Nitter`,
                ephemeral: true,
            });
        }
    },
};
