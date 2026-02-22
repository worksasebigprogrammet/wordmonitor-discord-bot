/**
 * src/discord/commands/panel.js
 * Commande /panel - Panneau de contrôle principal
 * Affiche les stats, index et permet des actions rapides
 *
 * BUG 4 CORRIGÉ : Handlers panel_config et panel_reset ajoutés
 * BUG 5 CORRIGÉ : Chemin require BriefingPublisher corrigé
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
const { SEVERITY_COLORS, CONTINENT_NAMES, CONTINENT_EMOJIS } = require('../../config/constants');
const { getStats } = require('../../collectors/CollectorManager');
const logger = require('../../utils/logger');

// ─── Builder du panneau principal ─────────────────────────────────────────────

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
                    `Pays: **${serverConfig.channels?.countryChannels?.length || 0}**`,
                ].join('\n') : '*Non configuré — utilisez `/setup`*',
                inline: true,
            }
        )
        .setTimestamp()
        .setFooter({ text: 'WorldMonitor • Mise à jour en temps réel' });

    if (hotZones.length > 0) {
        embed.addFields({
            name: '🔥 Zones Chaudes',
            value: hotZones.slice(0, 3).map(z => `🔥 **${z.country}** — ${z.count} événements`).join('\n'),
            inline: false,
        });
    }

    return embed;
}

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

// ─── Commande ────────────────────────────────────────────────────────────────

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

        // ─── Actualiser ──────────────────────────────────────────────────────
        if (customId === 'panel_refresh') {
            await interaction.deferUpdate();
            const embed = await buildPanel(interaction.guildId);
            return interaction.editReply({ embeds: [embed], components: buildPanelButtons() });
        }

        // ─── Voir l'index ────────────────────────────────────────────────────
        if (customId === 'panel_index') {
            const indexData = await getLatestIndex();
            const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId }).lean();
            const embed = buildIndexEmbed(indexData, { lang: serverConfig?.language || 'fr' });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ─── BUG 5 FIX : chemin corrigé '../publisher/BriefingPublisher' ────
        if (customId === 'panel_briefing') {
            await interaction.deferReply({ ephemeral: true });
            try {
                const { publishBriefingForServer } = require('../publisher/BriefingPublisher');
                const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId });
                if (!serverConfig) {
                    return interaction.editReply({ content: '❌ Serveur non configuré. Utilisez `/setup` d\'abord.' });
                }
                await publishBriefingForServer(serverConfig, serverConfig.briefingInterval || '24h');
                return interaction.editReply({ content: '✅ Briefing publié avec succès !' });
            } catch (error) {
                logger.error(`[Panel] Erreur briefing: ${error.message}`);
                return interaction.editReply({ content: `❌ Erreur lors du briefing: ${error.message}` });
            }
        }

        // ─── Sources actives ─────────────────────────────────────────────────
        if (customId === 'panel_sources') {
            const { ALL_RSS_FEEDS } = require('../../config/sources');
            const active = ALL_RSS_FEEDS.length;
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📡 Sources de données actives')
                .addFields(
                    { name: '📰 Flux RSS', value: `${active} flux actifs`, inline: true },
                    { name: '🌐 API GDELT', value: '✅ Actif (sans clé)', inline: true },
                    { name: '🌋 USGS', value: '✅ Actif (sans clé)', inline: true },
                    { name: '🗞️ Google News', value: '✅ Actif (sans clé)', inline: true },
                    { name: '🐦 Twitter/Nitter', value: process.env.NITTER_URL ? '✅ Actif' : '❌ Non configuré', inline: true },
                    { name: '🌐 DeepL', value: process.env.DEEPL_API_KEY ? '✅ Actif' : '⚠️ Non configuré (traduction désactivée)', inline: false },
                );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ─── BUG 4 FIX : Configuration (panel_config) ────────────────────────
        if (customId === 'panel_config') {
            return showConfigPanel(interaction);
        }

        // ─── BUG 4 FIX : Reset (panel_reset) ─────────────────────────────────
        if (customId === 'panel_reset') {
            return showResetConfirm(interaction);
        }

        // ─── Confirmation reset ───────────────────────────────────────────────
        if (customId === 'panel_reset_confirm') {
            return executeReset(interaction);
        }

        // ─── Annuler reset ────────────────────────────────────────────────────
        if (customId === 'panel_reset_cancel') {
            const embed = await buildPanel(interaction.guildId);
            return interaction.update({ embeds: [embed], components: buildPanelButtons() });
        }

        // ─── Sauvegarde config depuis panel_config ────────────────────────────
        if (customId === 'panel_config_continents') {
            return handleContinentConfig(interaction);
        }

        if (customId === 'panel_config_categories') {
            return handleCategoryConfig(interaction);
        }

        if (customId === 'panel_config_language') {
            return handleLanguageConfig(interaction);
        }

        if (customId === 'panel_config_briefing') {
            return handleBriefingConfig(interaction);
        }
    },
};

// ─── Handlers Configuration (Bug 4) ──────────────────────────────────────────

/**
 * Affiche le panneau de configuration avec des menus dropdown
 */
async function showConfigPanel(interaction) {
    const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId }).lean();
    if (!serverConfig) {
        return interaction.reply({ content: '❌ Serveur non configuré. Utilisez `/setup` d\'abord.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('⚙️ Configuration WorldMonitor')
        .setDescription('Modifiez les paramètres de WorldMonitor pour ce serveur.')
        .addFields(
            { name: 'Preset actuel', value: `**${serverConfig.preset}**`, inline: true },
            { name: 'Langue', value: `**${serverConfig.language === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}**`, inline: true },
            { name: 'Briefing', value: `**${serverConfig.briefingInterval}** (${serverConfig.briefingEnabled ? '✅' : '❌'})`, inline: true },
            { name: 'Catégories', value: `${serverConfig.enabledCategories?.length || 0} activées`, inline: true },
            { name: 'Niveaux d\'alerte', value: serverConfig.alertLevels?.join(', ') || 'Tous', inline: true },
        );

    // Menu langue
    const langMenu = new StringSelectMenuBuilder()
        .setCustomId('panel_config_language')
        .setPlaceholder('🌐 Changer la langue...')
        .addOptions([
            { label: '🇫🇷 Français', value: 'fr', description: 'Interface et news en français', default: serverConfig.language === 'fr' },
            { label: '🇬🇧 English', value: 'en', description: 'Interface and news in English', default: serverConfig.language === 'en' },
        ]);

    // Menu briefing
    const briefingMenu = new StringSelectMenuBuilder()
        .setCustomId('panel_config_briefing')
        .setPlaceholder('⏰ Fréquence des briefings...')
        .addOptions([
            { label: '⏰ Toutes les heures', value: '1h', description: 'Briefing toutes les heures' },
            { label: '⏰ Toutes les 3h', value: '3h', description: 'Briefing toutes les 3 heures' },
            { label: '⏰ Toutes les 5h', value: '5h', description: 'Briefing toutes les 5 heures' },
            { label: '⏰ Toutes les 12h', value: '12h', description: 'Briefing deux fois par jour', default: serverConfig.briefingInterval === '12h' },
            { label: '⏰ Une fois par jour', 'value': '24h', description: 'Briefing quotidien', default: serverConfig.briefingInterval === '24h' },
            { label: '❌ Désactiver', value: 'off', description: 'Pas de briefing automatique' },
        ]);

    // Menu niveaux d'alerte
    const alertMenu = new StringSelectMenuBuilder()
        .setCustomId('panel_config_categories')
        .setPlaceholder('⚡ Niveaux d\'alerte minimum...')
        .addOptions([
            { label: '🔴 Critique uniquement', value: 'critical', description: 'Seulement les alertes critiques' },
            { label: '🟠 Haute et critique', value: 'high', description: 'Alertes hautes et critiques' },
            { label: '🟡 Moyenne, haute et critique', value: 'medium', description: 'Tout sauf les infos basses' },
            { label: '🟢 Tout (incl. info basse)', value: 'low', description: 'Toutes les alertes sans exception' },
        ]);

    const rows = [
        new ActionRowBuilder().addComponents(langMenu),
        new ActionRowBuilder().addComponents(briefingMenu),
        new ActionRowBuilder().addComponents(alertMenu),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('panel_refresh').setLabel('◀️ Retour').setStyle(ButtonStyle.Secondary),
        ),
    ];

    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
}

/**
 * Met à jour la langue du serveur
 */
async function handleLanguageConfig(interaction) {
    const lang = interaction.values[0];
    await ServerConfig.updateOne({ guildId: interaction.guildId }, { language: lang });
    return interaction.reply({
        content: `✅ Langue mise à jour : **${lang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}**`,
        ephemeral: true,
    });
}

/**
 * Met à jour la fréquence de briefing
 */
async function handleBriefingConfig(interaction) {
    const value = interaction.values[0];
    if (value === 'off') {
        await ServerConfig.updateOne({ guildId: interaction.guildId }, { briefingEnabled: false });
        return interaction.reply({ content: '✅ Briefing automatique **désactivé**.', ephemeral: true });
    }
    await ServerConfig.updateOne({ guildId: interaction.guildId }, {
        briefingInterval: value,
        briefingEnabled: true,
    });
    return interaction.reply({ content: `✅ Briefing automatique : toutes les **${value}**.`, ephemeral: true });
}

/**
 * Met à jour le niveau d'alerte minimum
 */
async function handleCategoryConfig(interaction) {
    const minLevel = interaction.values[0];
    const levels = { critical: ['critical'], high: ['critical', 'high'], medium: ['critical', 'high', 'medium'], low: ['critical', 'high', 'medium', 'low'] };
    const alertLevels = levels[minLevel] || ['critical'];
    await ServerConfig.updateOne({ guildId: interaction.guildId }, { alertLevels });
    return interaction.reply({
        content: `✅ Niveaux d'alerte mis à jour : **${alertLevels.join(', ')}**`,
        ephemeral: true,
    });
}

async function handleContinentConfig(interaction) {
    // Placeholder — l'implémentation complète nécessiterait un menu multi-select
    return interaction.reply({ content: '⚙️ Utilisez `/monitor add` pour gérer les continents et pays.', ephemeral: true });
}

// ─── Handler Reset (Bug 4) ────────────────────────────────────────────────────

/**
 * Affiche la confirmation de reset
 */
async function showResetConfirm(interaction) {
    const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId }).lean();

    const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('⚠️ Réinitialiser WorldMonitor ?')
        .setDescription(
            '**ATTENTION** : Cette action va :\n\n' +
            '❌ Supprimer tous les channels WorldMonitor\n' +
            '❌ Supprimer tous les rôles WorldMonitor\n' +
            '❌ Supprimer la configuration de ce serveur\n\n' +
            `Configuration actuelle : **${serverConfig?.preset || 'N/A'}**\n\n` +
            'Vous devrez relancer `/setup` pour reconfigurer le bot.'
        )
        .setFooter({ text: '⚠️ Cette action est irréversible' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('panel_reset_confirm')
            .setLabel('⚠️ Oui, réinitialiser')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('panel_reset_cancel')
            .setLabel('❌ Annuler')
            .setStyle(ButtonStyle.Secondary),
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

/**
 * Exécute le reset complet
 */
async function executeReset(interaction) {
    await interaction.deferUpdate();

    try {
        const guild = interaction.guild;
        const serverConfig = await ServerConfig.findOne({ guildId: guild.id });

        if (serverConfig) {
            // Cleanup via la même logique que setup.js
            const { ChannelType } = require('discord.js');
            const { CONTINENT_NAMES } = require('../../config/constants');

            // Supprimer les channels sauvegardés
            const allChannelIds = [
                serverConfig.channels?.newsChannelId,
                serverConfig.channels?.indexChannelId,
                serverConfig.channels?.briefingChannelId,
                serverConfig.channels?.mapChannelId,
                serverConfig.channels?.panelChannelId,
                serverConfig.channels?.configChannelId,
                serverConfig.channels?.logsChannelId,
                serverConfig.channels?.statusChannelId,
                serverConfig.channels?.militaryChannelId,
                serverConfig.channels?.economyChannelId,
                serverConfig.channels?.nuclearChannelId,
                serverConfig.channels?.maritimeChannelId,
                serverConfig.channels?.disastersChannelId,
                serverConfig.channels?.outagesChannelId,
                ...(serverConfig.channels?.continentChannels?.flatMap(c => Object.values(c).filter(v => typeof v === 'string')) || []),
                ...(serverConfig.channels?.countryChannels?.map(c => c.channelId) || []),
            ].filter(Boolean);

            await Promise.allSettled(allChannelIds.map(id => {
                const ch = guild.channels.cache.get(id);
                return ch ? ch.delete('WorldMonitor Reset').catch(() => { }) : Promise.resolve();
            }));

            // Supprimer les catégories WorldMonitor restantes
            const wmCats = guild.channels.cache.filter(
                ch => ch.type === ChannelType.GuildCategory &&
                    (ch.name.includes('WorldMonitor') || ch.name.includes('Configuration') ||
                        Object.values(CONTINENT_NAMES).some(n => ch.name.includes(n.fr) || ch.name.includes(n.en)))
            );
            await Promise.allSettled([...wmCats.values()].map(c => c.delete('WorldMonitor Reset').catch(() => { })));

            // Supprimer les rôles
            const roleIds = (serverConfig.roles || []).map(r => r.roleId).filter(Boolean);
            await Promise.allSettled(roleIds.map(id => {
                const role = guild.roles.cache.get(id);
                return role ? role.delete('WorldMonitor Reset').catch(() => { }) : Promise.resolve();
            }));

            // Supprimer la config en base
            await ServerConfig.deleteOne({ guildId: guild.id });
        }

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ WorldMonitor réinitialisé')
            .setDescription('Tous les channels, rôles et la configuration ont été supprimés.\n\nUtilisez `/setup` pour reconfigurer le bot.');

        return interaction.editReply({ embeds: [embed], components: [] });

    } catch (error) {
        logger.error(`[Panel] Erreur reset: ${error.message}`);
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Erreur lors du reset')
            .setDescription(`${error.message}\n\nCertains éléments ont peut-être été supprimés partiellement.`);
        return interaction.editReply({ embeds: [embed], components: [] });
    }
}
