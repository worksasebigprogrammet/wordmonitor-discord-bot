/**
 * src/discord/commands/refresh.js
 * Commande /refresh — Met à jour la configuration Discord sans tout recréer
 *
 * Sous-commandes :
 * - /refresh setup   : Crée les channels/rôles manquants selon la config actuelle
 * - /refresh sources : Teste les sources RSS et désactive les défaillantes
 * - /refresh all     : Effectue refresh setup + sources
 */

'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType,
} = require('discord.js');
const ServerConfig = require('../../database/models/ServerConfig');
const { CHANNEL_STRUCTURE, ALERT_ROLES } = require('../../config/constants');
const { ALL_RSS_FEEDS } = require('../../config/sources');
const logger = require('../../utils/logger');

const data = new SlashCommandBuilder()
    .setName('refresh')
    .setDescription('🔄 Met à jour la configuration WorldMonitor')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
        sub.setName('setup')
            .setDescription('🏗️ Crée les channels/rôles manquants selon la config actuelle')
    )
    .addSubcommand(sub =>
        sub.setName('sources')
            .setDescription('📡 Teste les sources RSS et désactive les défaillantes')
    )
    .addSubcommand(sub =>
        sub.setName('all')
            .setDescription('🔄 Effectue refresh setup + sources')
    );

async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId });
    if (!serverConfig) {
        return interaction.editReply({
            content: '❌ Ce serveur n\'est pas configuré. Utilisez `/setup` d\'abord.',
        });
    }

    if (sub === 'setup' || sub === 'all') {
        await interaction.editReply({ content: '⏳ Vérification des channels et rôles...' });
        const result = await refreshSetup(interaction, serverConfig);

        if (sub === 'setup') {
            return interaction.editReply({ embeds: [result], components: [] });
        }
        // all → continuer avec sources
        await interaction.followUp({ embeds: [result], ephemeral: true });
    }

    if (sub === 'sources' || sub === 'all') {
        if (sub === 'sources') {
            await interaction.editReply({ content: '⏳ Test des sources RSS en cours...' });
        }
        const result = await refreshSources(interaction, serverConfig);
        return interaction.editReply({ embeds: [result] });
    }
}

/**
 * Vérifie et crée les channels/rôles manquants
 */
async function refreshSetup(interaction, serverConfig) {
    const { guild } = interaction;
    const updates = {
        channelsCreated: 0,
        channelsExisting: 0,
        rolesCreated: 0,
        rolesExisting: 0,
        errors: [],
    };

    // Obtenir la catégorie principale WorldMonitor
    const categories = guild.channels.cache.filter(
        c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('worldmonitor')
    );
    const mainCategory = categories.first();

    // ── Vérifier les channels globaux ─────────────────────────────────────
    const allChannelsToCheck = [
        ...CHANNEL_STRUCTURE.global,
        ...CHANNEL_STRUCTURE.thematic.filter(ch =>
            serverConfig.enabledCategories?.includes(ch.category)
        ),
    ];

    const channelUpdates = {};

    for (const channelDef of allChannelsToCheck) {
        const existingId = serverConfig.getChannelId(channelDef.name);
        if (existingId) {
            const existing = guild.channels.cache.get(existingId);
            if (existing) {
                updates.channelsExisting++;
                continue;
            }
        }

        // Channel manquant → créer
        try {
            const newChannel = await guild.channels.create({
                name: channelDef.name,
                type: ChannelType.GuildText,
                topic: channelDef.topic,
                parent: mainCategory?.id,
                reason: 'WorldMonitor /refresh setup',
            });
            channelUpdates[channelDef.name] = newChannel.id;
            updates.channelsCreated++;
            logger.info(`[RefreshCmd] ✅ Channel créé: #${channelDef.name}`);
        } catch (err) {
            updates.errors.push(`#${channelDef.name}: ${err.message}`);
        }
    }

    // ── Vérifier les rôles d'alerte ───────────────────────────────────────
    const roleUpdates = {};

    for (const roleDef of ALERT_ROLES) {
        const existingId = serverConfig.getRoleId(roleDef.name);
        if (existingId) {
            const existing = guild.roles.cache.get(existingId);
            if (existing) {
                updates.rolesExisting++;
                continue;
            }
        }

        // Rôle manquant → créer
        try {
            const newRole = await guild.roles.create({
                name: roleDef.name,
                color: roleDef.color,
                hoist: roleDef.hoist,
                mentionable: roleDef.mentionable,
                reason: 'WorldMonitor /refresh setup',
            });
            roleUpdates[roleDef.name] = newRole.id;
            updates.rolesCreated++;
            logger.info(`[RefreshCmd] ✅ Rôle créé: @${roleDef.name}`);
        } catch (err) {
            updates.errors.push(`@${roleDef.name}: ${err.message}`);
        }
    }

    // Sauvegarder les nouvelles IDs
    if (Object.keys(channelUpdates).length > 0 || Object.keys(roleUpdates).length > 0) {
        const update = {};
        for (const [name, id] of Object.entries(channelUpdates)) {
            update[`channels.${name}`] = id;
        }
        for (const [name, id] of Object.entries(roleUpdates)) {
            update[`roles.${name}`] = id;
        }
        await ServerConfig.findOneAndUpdate(
            { guildId: interaction.guildId },
            { $set: update }
        );
    }

    // Construire l'embed résumé
    const embed = new EmbedBuilder()
        .setColor(updates.errors.length > 0 ? 0xFF8C00 : 0x00FF00)
        .setTitle('🏗️ Refresh Setup — Résumé')
        .addFields(
            { name: '📺 Channels', value: `✅ ${updates.channelsCreated} créé(s)\n📌 ${updates.channelsExisting} existant(s)`, inline: true },
            { name: '🎗️ Rôles', value: `✅ ${updates.rolesCreated} créé(s)\n📌 ${updates.rolesExisting} existant(s)`, inline: true },
        )
        .setTimestamp();

    if (updates.errors.length > 0) {
        embed.addFields({
            name: '⚠️ Erreurs',
            value: updates.errors.slice(0, 5).join('\n') || 'Aucune',
        });
    }

    return embed;
}

/**
 * Teste les sources RSS et désactive les défectueuses
 */
async function refreshSources(interaction, serverConfig) {
    const activeSources = ALL_RSS_FEEDS.filter(s => s.active !== false);
    const toTest = activeSources.slice(0, 20); // Tester les 20 premières (éviter le timeout)

    const results = { ok: 0, slow: 0, failed: 0, failedNames: [] };

    await Promise.allSettled(
        toTest.map(async (src) => {
            const start = Date.now();
            try {
                const ctrl = new AbortController();
                const timeout = setTimeout(() => ctrl.abort(), 5000);
                const resp = await fetch(src.url, {
                    method: 'HEAD',
                    signal: ctrl.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0 WorldMonitor Bot' },
                });
                clearTimeout(timeout);
                const elapsed = Date.now() - start;

                if (resp.ok) {
                    if (elapsed > 3000) results.slow++;
                    else results.ok++;
                } else {
                    results.failed++;
                    results.failedNames.push(`${src.name} (HTTP ${resp.status})`);
                }
            } catch {
                results.failed++;
                results.failedNames.push(`${src.name} (timeout/erreur)`);
            }
        })
    );

    // Ajouter les sources défaillantes à la liste blacklist du serveur
    if (results.failedNames.length > 0 && serverConfig) {
        const failedUrls = toTest
            .filter(s => results.failedNames.some(n => n.startsWith(s.name)))
            .map(s => s.url);

        if (failedUrls.length > 0) {
            await ServerConfig.findOneAndUpdate(
                { guildId: interaction.guildId },
                { $addToSet: { disabledSources: { $each: failedUrls } } }
            );
        }
    }

    const embed = new EmbedBuilder()
        .setColor(results.failed > 5 ? 0xFF0000 : results.failed > 0 ? 0xFF8C00 : 0x00FF00)
        .setTitle('📡 Refresh Sources — Résumé')
        .setDescription(`Test de **${toTest.length}** sources sur ${activeSources.length} actives`)
        .addFields(
            { name: '✅ Opérationnelles', value: String(results.ok), inline: true },
            { name: '🐢 Lentes (>3s)', value: String(results.slow), inline: true },
            { name: '❌ Défaillantes', value: String(results.failed), inline: true },
        )
        .setTimestamp();

    if (results.failedNames.length > 0) {
        embed.addFields({
            name: '⚠️ Sources en erreur (désactivées)',
            value: results.failedNames.slice(0, 10).join('\n') || 'Aucune',
        });
    }

    return embed;
}

module.exports = { data, execute };
