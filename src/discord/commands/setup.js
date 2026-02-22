/**
 * src/discord/commands/setup.js
 * Commande /setup - Configuration initiale du bot dans le serveur
 * Lance l'assistant de configuration en plusieurs étapes
 */

'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ChannelType,
    PermissionsBitField,
} = require('discord.js');

const ServerConfig = require('../../database/models/ServerConfig');
const { PRESETS, getPreset, listPresetsForMenu } = require('../../config/presets');
const { SEVERITY_COLORS, DISCORD_LIMITS } = require('../../config/constants');
const logger = require('../../utils/logger');

// Cache des sessions de setup en cours
const setupSessions = new Map();

/**
 * Démarrage du setup - Sélection du preset
 */
async function startSetup(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('🌍 WorldMonitor — Assistant de Configuration')
        .setDescription([
            '**Bienvenue !** Configurons WorldMonitor pour votre serveur.',
            '',
            'Choisissez un **profil de surveillance** adapté à votre communauté :',
            '',
            '🟢 **Débutant** — Breaking news mondial uniquement (peu de notifications)',
            '🟡 **Moyen** — Breaking + conflits + économie par continent',
            '🟠 **Expérimenté** — Tout + channels par pays majeurs',
            '🔴 **Expert** — Tout activé, OSINT militaire, 6 pays/continent',
            '',
            '*Vous pourrez personnaliser les catégories et pays après le setup de base.*',
        ].join('\n'))
        .setFooter({ text: 'Cette interaction expire dans 5 minutes' });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('setup_preset_select')
        .setPlaceholder('Choisissez votre profil...')
        .addOptions(listPresetsForMenu());

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
    });

    // Créer la session de setup
    setupSessions.set(interaction.user.id, {
        guildId: interaction.guildId,
        step: 'preset',
        data: {},
    });
}

/**
 * Traitement de la sélection du preset
 */
async function handlePresetSelect(interaction) {
    const presetId = interaction.values[0];
    const preset = getPreset(presetId);

    const session = setupSessions.get(interaction.user.id) || {};
    session.preset = presetId;
    session.step = 'confirm';
    setupSessions.set(interaction.user.id, session);

    const embed = new EmbedBuilder()
        .setColor(
            presetId === 'expert' ? SEVERITY_COLORS.critical
                : presetId === 'experienced' ? SEVERITY_COLORS.high
                    : presetId === 'intermediate' ? SEVERITY_COLORS.medium
                        : SEVERITY_COLORS.low
        )
        .setTitle(`${preset.emoji} Profil : ${preset.name.fr}`)
        .setDescription(preset.description.fr)
        .addFields(
            {
                name: '📺 Channels créés',
                value: preset.channels.map(c => `\`#${c}\``).join(', '),
                inline: false,
            },
            {
                name: '📋 Catégories surveillées',
                value: preset.categories.map(c => `\`${c}\``).join(', ') || 'Toutes',
                inline: false,
            },
            {
                name: '⚡ Niveaux d\'alerte',
                value: preset.alertLevels.join(' + '),
                inline: true,
            },
            {
                name: '⏱️ Briefing',
                value: preset.briefingEnabled ? `Toutes les ${preset.briefingInterval}` : 'Désactivé',
                inline: true,
            },
            {
                name: '🗺️ Carte mondiale',
                value: preset.mapEnabled ? 'Activée' : 'Désactivée',
                inline: true,
            }
        )
        .setFooter({ text: 'Le bot créera automatiquement les channels et webhooks nécessaires' });

    const confirmBtn = new ButtonBuilder()
        .setCustomId('setup_confirm')
        .setLabel('✅ Confirmer et démarrer')
        .setStyle(ButtonStyle.Success);

    const cancelBtn = new ButtonBuilder()
        .setCustomId('setup_cancel')
        .setLabel('↩️ Changer de profil')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

    await interaction.update({
        embeds: [embed],
        components: [row],
    });
}

/**
 * Confirmation du setup - Création des channels et webhooks
 */
async function handleSetupConfirm(interaction) {
    const session = setupSessions.get(interaction.user.id);
    if (!session) {
        return interaction.update({ content: '❌ Session expirée.', components: [], embeds: [] });
    }

    await interaction.update({
        embeds: [new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('⏳ Installation en cours...')
            .setDescription('Création des channels et webhooks, veuillez patienter...')],
        components: [],
    });

    const preset = getPreset(session.preset);
    const guild = interaction.guild;
    const channelIds = new Map();
    const webhookUrls = new Map();
    const errors = [];

    try {
        // ─── Créer la catégorie principale ───────────────────────────────────
        let category;
        try {
            category = await guild.channels.create({
                name: '🌍 WorldMonitor',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                        deny: [PermissionsBitField.Flags.SendMessages],
                    },
                ],
            });
        } catch (e) {
            errors.push(`Catégorie: ${e.message}`);
            logger.error(`[Setup] Erreur création catégorie: ${e.message}`);
        }

        // ─── Créer les channels du preset ────────────────────────────────────
        for (const channelName of preset.channels) {
            try {
                const channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category?.id,
                    topic: `WorldMonitor — ${channelName.replace(/-/g, ' ')}`,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                    ],
                });
                channelIds.set(channelName, channel.id);

                // Créer un webhook pour ce channel
                const webhook = await channel.createWebhook({
                    name: `WorldMonitor — ${channelName}`,
                    reason: 'WorldMonitor setup',
                });
                webhookUrls.set(channelName, webhook.url);
            } catch (e) {
                errors.push(`Channel #${channelName}: ${e.message}`);
                logger.warn(`[Setup] Erreur channel ${channelName}: ${e.message}`);
            }
        }

        // ─── Sauvegarder la configuration ────────────────────────────────────
        let serverConfig = await ServerConfig.findOne({ guildId: guild.id });
        if (serverConfig) {
            // Reset complet
            serverConfig.set({
                preset: session.preset,
                setupComplete: true,
                language: 'fr',
                enabledCategories: preset.categories,
                alertLevels: preset.alertLevels,
                briefingInterval: preset.briefingInterval,
                briefingEnabled: preset.briefingEnabled,
                mapEnabled: preset.mapEnabled,
                crisisSystem: preset.crisisSystem,
                militaryTracking: preset.militaryTracking,
                economyTracking: preset.economyTracking,
                scrapeInterval: preset.scrapeInterval,
                maxNewsPerHour: preset.maxNewsPerHour,
            });
        } else {
            serverConfig = new ServerConfig({
                guildId: guild.id,
                guildName: guild.name,
                preset: session.preset,
                setupComplete: true,
                language: 'fr',
                enabledCategories: preset.categories,
                alertLevels: preset.alertLevels,
                briefingInterval: preset.briefingInterval,
                briefingEnabled: preset.briefingEnabled,
                mapEnabled: preset.mapEnabled,
                crisisSystem: preset.crisisSystem,
                militaryTracking: preset.militaryTracking,
                economyTracking: preset.economyTracking,
                scrapeInterval: preset.scrapeInterval,
            });
        }

        // Sauvegarder les channels et webhooks
        for (const [name, id] of channelIds) serverConfig.channels.set(name, id);
        for (const [name, url] of webhookUrls) serverConfig.webhooks.set(name, url);

        await serverConfig.save();
        setupSessions.delete(interaction.user.id);

        // ─── Message de succès ────────────────────────────────────────────────
        const successEmbed = new EmbedBuilder()
            .setColor(0x57F287) // Vert
            .setTitle('✅ WorldMonitor installé avec succès !')
            .setDescription([
                `**Profil:** ${preset.emoji} ${preset.name.fr}`,
                `**Channels créés:** ${channelIds.size}`,
                errors.length > 0 ? `\n⚠️ **Avertissements:** ${errors.join(', ')}` : '',
                '',
                '**Prochaines étapes:**',
                '• `/panel` — Configurer les pays et catégories',
                '• `/monitor add` — Ajouter des pays à surveiller',
                '• Les news commenceront à arriver dans les prochaines minutes !',
            ].filter(Boolean).join('\n'))
            .setFooter({ text: 'WorldMonitor est maintenant actif sur votre serveur' });

        await interaction.editReply({ embeds: [successEmbed], components: [] });

    } catch (error) {
        logger.error(`[Setup] Erreur critique: ${error.message}`);
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor(SEVERITY_COLORS.critical)
                .setTitle('❌ Erreur lors du setup')
                .setDescription(`Une erreur s'est produite: ${error.message}`)],
            components: [],
        });
    }
}

// Définition de la commande Slash
const command = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('🔧 Configure WorldMonitor sur ce serveur (admin requis)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports = {
    data: command,
    async execute(interaction) {
        // Vérifier les permissions
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                ephemeral: true,
            });
        }
        await startSetup(interaction);
    },
    // Handlers pour les composants interactifs
    async handleComponent(interaction) {
        const { customId } = interaction;
        if (customId === 'setup_preset_select') return handlePresetSelect(interaction);
        if (customId === 'setup_confirm') return handleSetupConfirm(interaction);
        if (customId === 'setup_cancel') return startSetup(interaction);
    },
    setupSessions,
};
