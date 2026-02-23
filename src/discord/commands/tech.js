/**
 * src/discord/commands/tech.js
 * Commande /tech — Configuration du module Tech Monitor
 *
 * Sous-commandes :
 * - /tech setup [preset] : Crée la catégorie Tech Monitor + channels selon le preset
 * - /tech panel          : Affiche le panel de configuration tech
 */

'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const ServerConfig = require('../../database/models/ServerConfig');
const { TECH_CATEGORIES } = require('../../config/categories');
const logger = require('../../utils/logger');

// ─── Définition des presets ───────────────────────────────────────────────────

const TECH_PRESETS = {
    basic: {
        label: '🔰 Basic',
        description: 'IA + Cybersécurité (2 channels)',
        categories: ['tech_ai', 'tech_cyber'],
    },
    standard: {
        label: '⭐ Standard',
        description: 'Basic + Hardware + Tech Générale (4 channels)',
        categories: ['tech_ai', 'tech_cyber', 'tech_hardware', 'tech_general'],
    },
    full: {
        label: '💎 Full',
        description: 'Toutes les catégories tech (6 channels)',
        categories: ['tech_ai', 'tech_hardware', 'tech_cyber', 'tech_general', 'tech_gaming', 'tech_crypto'],
    },
};

// ─── Commande Slash ───────────────────────────────────────────────────────────

const data = new SlashCommandBuilder()
    .setName('tech')
    .setDescription('💻 Module Tech Monitor')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
        sub.setName('setup')
            .setDescription('🏗️ Configure le module Tech Monitor')
            .addStringOption(opt =>
                opt.setName('preset')
                    .setDescription('Preset de configuration')
                    .setRequired(true)
                    .addChoices(
                        { name: '🔰 Basic — IA + Cybersécurité', value: 'basic' },
                        { name: '⭐ Standard — + Hardware + Tech', value: 'standard' },
                        { name: '💎 Full — Tous les channels tech', value: 'full' },
                    )
            )
    )
    .addSubcommand(sub =>
        sub.setName('panel')
            .setDescription('⚙️ Affiche le panel de configuration Tech Monitor')
    );

async function execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
        await handleTechSetup(interaction);
    } else if (sub === 'panel') {
        await handleTechPanel(interaction);
    }
}

// ─── /tech setup ─────────────────────────────────────────────────────────────

async function handleTechSetup(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const presetId = interaction.options.getString('preset');
    const preset = TECH_PRESETS[presetId];
    if (!preset) {
        return interaction.editReply({ content: '❌ Preset invalide.' });
    }

    const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId });
    if (!serverConfig) {
        return interaction.editReply({ content: '❌ Configurez d\'abord le bot avec `/setup`.' });
    }

    const { guild } = interaction;
    const progress = [];
    const errors = [];

    // Créer ou trouver la catégorie "💻 Tech Monitor"
    let techCategory = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('tech monitor')
    );

    if (!techCategory) {
        try {
            techCategory = await guild.channels.create({
                name: '💻 Tech Monitor',
                type: ChannelType.GuildCategory,
                reason: 'WorldMonitor /tech setup',
            });
            progress.push('✅ Catégorie **💻 Tech Monitor** créée');
        } catch (err) {
            errors.push(`Catégorie: ${err.message}`);
        }
    } else {
        progress.push('📌 Catégorie **💻 Tech Monitor** existante');
    }

    // Créer les channels pour chaque catégorie du preset
    const createdChannels = [];

    for (const catKey of preset.categories) {
        const catData = TECH_CATEGORIES[catKey];
        if (!catData) continue;

        const channelName = catData.channelName; // ex: 'tech-ai'

        // Vérifier si déjà créé
        const existingId = serverConfig.getChannelId(channelName);
        if (existingId) {
            const existing = guild.channels.cache.get(existingId);
            if (existing) {
                progress.push(`📌 **#${channelName}** existant`);
                createdChannels.push({ name: channelName, id: existingId });
                continue;
            }
        }

        try {
            const newChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                topic: `${catData.icon} ${catData.name.fr} — Tech Monitor WorldMonitor`,
                parent: techCategory?.id,
                reason: 'WorldMonitor /tech setup',
            });

            // Créer un webhook pour ce channel
            let webhookUrl = null;
            try {
                const wh = await newChannel.createWebhook({
                    name: `${catData.icon} Tech Monitor — ${catData.name.fr}`,
                    reason: 'WorldMonitor webhook tech',
                });
                webhookUrl = wh.url;
            } catch { /* Pas de webhook, pas grave */ }

            createdChannels.push({ name: channelName, id: newChannel.id, webhookUrl });
            progress.push(`✅ **#${channelName}** créé`);
        } catch (err) {
            errors.push(`#${channelName}: ${err.message}`);
        }
    }

    // Sauvegarder dans ServerConfig
    const channelEntries = Object.fromEntries(createdChannels.map(c => [c.name, c.id]));
    const webhookEntries = Object.fromEntries(
        createdChannels.filter(c => c.webhookUrl).map(c => [c.name, c.webhookUrl])
    );

    const techConfigSave = {
        enabled: true,
        preset: presetId,
        channels: createdChannels.map(c => ({
            name: c.name,
            channelId: c.id,
            webhookUrl: c.webhookUrl || null,
        })),
        enabledCategories: preset.categories,
    };

    // Mettre à jour les channels Map et techConfig
    const dbUpdate = { 'techConfig': techConfigSave };
    for (const [name, id] of Object.entries(channelEntries)) {
        dbUpdate[`channels.${name}`] = id;
    }
    for (const [name, url] of Object.entries(webhookEntries)) {
        dbUpdate[`webhooks.${name}`] = url;
    }
    // Ajouter les catégories tech aux catégories activées
    dbUpdate['$addToSet'] = { enabledCategories: { $each: preset.categories } };

    await ServerConfig.findOneAndUpdate(
        { guildId: interaction.guildId },
        { $set: dbUpdate, ...dbUpdate['$addToSet'] ? {} : {} }
    );

    // Aussi activer les catégories
    await ServerConfig.findOneAndUpdate(
        { guildId: interaction.guildId },
        { $addToSet: { enabledCategories: { $each: preset.categories } } }
    );

    logger.info(`[TechCmd] ✅ Preset "${presetId}" configuré dans ${interaction.guildId} — ${createdChannels.length} channels`);

    const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle(`💻 Tech Monitor configuré — ${preset.label}`)
        .setDescription(
            progress.join('\n') +
            (errors.length > 0 ? '\n\n⚠️ **Erreurs :**\n' + errors.join('\n') : '')
        )
        .addFields(
            { name: '📡 Catégories actives', value: preset.categories.map(k => `${TECH_CATEGORIES[k]?.icon} ${TECH_CATEGORIES[k]?.name?.fr}`).join('\n'), inline: true },
            { name: '🔔 Sources', value: 'Les sources tech sont maintenant actives\nLes news seront publiées dans leurs channels respectifs', inline: true },
        )
        .setFooter({ text: 'Utilisez /tech panel pour configurer les niveaux d\'alertes' })
        .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
}

// ─── /tech panel ─────────────────────────────────────────────────────────────

async function handleTechPanel(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId });
    if (!serverConfig?.techConfig?.enabled) {
        return interaction.editReply({
            content: '❌ Le module Tech Monitor n\'est pas encore configuré. Utilisez `/tech setup` d\'abord.',
        });
    }

    const techConfig = serverConfig.techConfig;
    const preset = TECH_PRESETS[techConfig.preset] || TECH_PRESETS.basic;

    const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('💻 Tech Monitor — Panel de configuration')
        .setDescription(`**Preset actif :** ${preset.label}\n**Catégories :** ${techConfig.enabledCategories?.length || 0} actives`)
        .addFields(
            {
                name: '📺 Channels configurés',
                value: (techConfig.channels || [])
                    .map(c => `${TECH_CATEGORIES[c.name.replace('tech-', 'tech_')]?.icon || '💻'} **#${c.name}**`)
                    .join('\n') || 'Aucun',
                inline: true,
            },
            {
                name: '📡 Catégories actives',
                value: (techConfig.enabledCategories || [])
                    .map(k => `${TECH_CATEGORIES[k]?.icon || '▪'} ${TECH_CATEGORIES[k]?.name?.fr || k}`)
                    .join('\n') || 'Aucune',
                inline: true,
            },
        )
        .setFooter({ text: 'WorldMonitor • Tech Monitor' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('tech_upgrade_standard')
            .setLabel('⬆ Upgrade Standard')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(techConfig.preset === 'standard' || techConfig.preset === 'full'),
        new ButtonBuilder()
            .setCustomId('tech_upgrade_full')
            .setLabel('💎 Upgrade Full')
            .setStyle(ButtonStyle.Success)
            .setDisabled(techConfig.preset === 'full'),
        new ButtonBuilder()
            .setCustomId('tech_disable')
            .setLabel('🚫 Désactiver')
            .setStyle(ButtonStyle.Danger),
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
}

// ─── Handler des composants (/tech panel boutons) ─────────────────────────────

async function handleComponent(interaction) {
    const { customId, guild } = interaction;
    await interaction.deferUpdate();

    if (customId === 'tech_disable') {
        await ServerConfig.findOneAndUpdate(
            { guildId: interaction.guildId },
            { 'techConfig.enabled': false }
        );
        return interaction.editReply({ content: '🚫 Module Tech Monitor désactivé.', embeds: [], components: [] });
    }

    if (customId === 'tech_upgrade_standard' || customId === 'tech_upgrade_full') {
        const newPreset = customId === 'tech_upgrade_full' ? 'full' : 'standard';
        // Re-trigger the setup flow with new preset
        interaction.options = {
            getSubcommand: () => 'setup',
            getString: () => newPreset,
        };
        return handleTechSetup(interaction);
    }
}

module.exports = { data, execute, handleComponent };
