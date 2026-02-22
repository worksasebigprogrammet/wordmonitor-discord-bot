/**
 * src/discord/commands/crisis.js
 * Commande /crisis - Gérer les crises actives
 * create, close, list
 */

'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType,
    PermissionsBitField,
} = require('discord.js');

const Crisis = require('../../database/models/Crisis');
const ServerConfig = require('../../database/models/ServerConfig');
const { SEVERITY_COLORS } = require('../../config/constants');
const logger = require('../../utils/logger');

const command = new SlashCommandBuilder()
    .setName('crisis')
    .setDescription('🚨 Gérer les crises et événements majeurs')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
        sub.setName('create')
            .setDescription('Créer une nouvelle crise')
            .addStringOption(opt => opt.setName('nom').setDescription('Nom de la crise').setRequired(true))
            .addStringOption(opt => opt.setName('description').setDescription('Description').setRequired(false))
            .addStringOption(opt => opt.setName('mots_cles').setDescription('Mots-clés (séparés par ,)').setRequired(false))
            .addStringOption(opt =>
                opt.setName('gravite')
                    .setDescription('Niveau de gravité')
                    .setRequired(false)
                    .addChoices(
                        { name: '🔴 Critique', value: 'critical' },
                        { name: '🟠 Haute', value: 'high' },
                        { name: '🟡 Moyenne', value: 'medium' },
                    ))
    )
    .addSubcommand(sub =>
        sub.setName('close')
            .setDescription('Fermer une crise')
            .addStringOption(opt => opt.setName('nom').setDescription('Nom de la crise').setRequired(true).setAutocomplete(true))
    )
    .addSubcommand(sub =>
        sub.setName('list')
            .setDescription('Voir les crises actives')
    );

module.exports = {
    data: command,

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            const nom = interaction.options.getString('nom');
            const description = interaction.options.getString('description') || '';
            const motsCles = (interaction.options.getString('mots_cles') || '').split(',').map(k => k.trim()).filter(Boolean);
            const severity = interaction.options.getString('gravite') || 'high';

            await interaction.deferReply({ ephemeral: true });

            // Créer un channel dédié
            let channelId = null;
            try {
                const channel = await interaction.guild.channels.create({
                    name: `🚨-${nom.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}`,
                    type: ChannelType.GuildText,
                    topic: `Crise: ${nom} | ${description}`,
                });
                channelId = channel.id;
            } catch (e) {
                logger.warn(`[Crisis] Impossible de créer le channel: ${e.message}`);
            }

            const crisis = new Crisis({
                guildId: interaction.guildId,
                name: nom,
                description,
                keywords: motsCles,
                severity,
                mainChannelId: channelId,
                createdBy: interaction.user.id,
            });
            await crisis.save();

            const embed = new EmbedBuilder()
                .setColor(SEVERITY_COLORS[severity])
                .setTitle(`🚨 Crise créée: ${nom}`)
                .addFields(
                    { name: 'Gravité', value: severity, inline: true },
                    { name: 'Mots-clés', value: motsCles.join(', ') || '*aucun*', inline: true },
                    { name: 'Channel', value: channelId ? `<#${channelId}>` : 'Non créé', inline: true },
                )
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'close') {
            const nom = interaction.options.getString('nom');
            const crisis = await Crisis.findOne({ guildId: interaction.guildId, name: nom, status: 'active' });
            if (!crisis) {
                return interaction.reply({ content: `❌ Crise "${nom}" introuvable ou déjà fermée.`, ephemeral: true });
            }
            crisis.status = 'closed';
            crisis.closedBy = interaction.user.id;
            crisis.closedAt = new Date();
            await crisis.save();
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(SEVERITY_COLORS.low)
                    .setTitle(`✅ Crise fermée: ${nom}`)
                    .setDescription(`Durée: ${Math.round((crisis.closedAt - crisis.createdAt) / 3600_000)} heures\nNews collectées: ${crisis.newsCount}`)],
                ephemeral: true,
            });
        }

        if (sub === 'list') {
            const crises = await Crisis.find({ guildId: interaction.guildId, status: 'active' }).lean();
            if (crises.length === 0) {
                return interaction.reply({ content: '✅ Aucune crise active actuellement.', ephemeral: true });
            }
            const embed = new EmbedBuilder()
                .setColor(SEVERITY_COLORS.high)
                .setTitle('🚨 Crises actives')
                .setDescription(crises.map(c => `**${c.name}** — ${c.severity} — ${c.newsCount} news`).join('\n'));
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async autocomplete(interaction) {
        const crises = await Crisis.find({
            guildId: interaction.guildId,
            status: 'active',
            name: { $regex: interaction.options.getFocused(), $options: 'i' },
        }).limit(25).lean();
        await interaction.respond(crises.map(c => ({ name: c.name, value: c.name })));
    },
};
