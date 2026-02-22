/**
 * src/discord/commands/sources.js
 * Commande /sources - Gérer les sources RSS personnalisées
 */

'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require('discord.js');

const ServerConfig = require('../../database/models/ServerConfig');
const { SEVERITY_COLORS } = require('../../config/constants');
const { ALL_RSS_FEEDS } = require('../../config/sources');

const command = new SlashCommandBuilder()
    .setName('sources')
    .setDescription('📡 Gérer les sources de collecte')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
        sub.setName('add')
            .setDescription('Ajouter un flux RSS personnalisé')
            .addStringOption(opt => opt.setName('url').setDescription('URL du flux RSS').setRequired(true))
            .addStringOption(opt => opt.setName('nom').setDescription('Nom de la source').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('remove')
            .setDescription('Retirer un flux RSS personnalisé')
            .addStringOption(opt => opt.setName('nom').setDescription('Nom de la source').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('list')
            .setDescription('Voir toutes les sources actives')
    );

module.exports = {
    data: command,

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId });

        if (!serverConfig) {
            return interaction.reply({ content: '❌ Utilisez `/setup` d\'abord.', ephemeral: true });
        }

        if (sub === 'add') {
            const url = interaction.options.getString('url');
            const nom = interaction.options.getString('nom');

            if (!url.startsWith('http') || !url.includes('://')) {
                return interaction.reply({ content: '❌ URL invalide. Doit commencer par http:// ou https://', ephemeral: true });
            }

            // Max 10 sources custom
            if (serverConfig.customRssFeeds.length >= 10) {
                return interaction.reply({ content: '❌ Maximum 10 sources personnalisées autorisées.', ephemeral: true });
            }

            serverConfig.customRssFeeds.push({ name: nom, url, active: true });
            await serverConfig.save();
            return interaction.reply({ content: `✅ Source ajoutée: **${nom}** (${url})`, ephemeral: true });
        }

        if (sub === 'remove') {
            const nom = interaction.options.getString('nom');
            const before = serverConfig.customRssFeeds.length;
            serverConfig.customRssFeeds = serverConfig.customRssFeeds.filter(f => f.name !== nom);

            if (serverConfig.customRssFeeds.length === before) {
                return interaction.reply({ content: `❌ Source "${nom}" introuvable.`, ephemeral: true });
            }

            await serverConfig.save();
            return interaction.reply({ content: `✅ Source supprimée: **${nom}**`, ephemeral: true });
        }

        if (sub === 'list') {
            const active = ALL_RSS_FEEDS.filter(f => f.active !== false);
            const custom = serverConfig.customRssFeeds;

            const embed = new EmbedBuilder()
                .setColor(SEVERITY_COLORS.info)
                .setTitle('📡 Sources de Collecte')
                .addFields(
                    {
                        name: `📻 Flux RSS intégrés (${active.length})`,
                        value: active.slice(0, 10).map(f => `• ${f.name} (${f.reliability}/10)`).join('\n') +
                            (active.length > 10 ? `\n*...et ${active.length - 10} autres*` : ''),
                        inline: false,
                    },
                    {
                        name: `🔧 Sources personnalisées (${custom.length}/10)`,
                        value: custom.length > 0
                            ? custom.map(f => `• ${f.active ? '✅' : '❌'} ${f.name}`).join('\n')
                            : '*Aucune source personnalisée*',
                        inline: false,
                    },
                    {
                        name: '🌐 APIs',
                        value: ['GDELT ✅', 'USGS ✅', 'Google News ✅', 'Nitter ⚠️', 'ReliefWeb ✅'].join(' | '),
                        inline: false,
                    }
                );

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
