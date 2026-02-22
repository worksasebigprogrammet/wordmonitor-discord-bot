/**
 * src/discord/commands/briefing.js
 * Commande /briefing - Déclencher manuellement un briefing
 */

'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
} = require('discord.js');

const ServerConfig = require('../../database/models/ServerConfig');
const { publishBriefingForServer } = require('../publisher/BriefingPublisher');
const { checkCooldown } = require('../../utils/cooldown');

const command = new SlashCommandBuilder()
    .setName('briefing')
    .setDescription('📊 Générer un briefing immédiat')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt =>
        opt.setName('periode')
            .setDescription('Période du briefing')
            .setRequired(false)
            .addChoices(
                { name: '1 heure', value: '1h' },
                { name: '3 heures', value: '3h' },
                { name: '5 heures', value: '5h' },
                { name: '12 heures', value: '12h' },
                { name: '24 heures (quotidien)', value: '24h' },
            )
    );

module.exports = {
    data: command,
    async execute(interaction) {
        const { onCooldown, remaining } = checkCooldown('briefing', interaction.user.id, 300);
        if (onCooldown) {
            return interaction.reply({
                content: `⏱️ Cooldown briefing: ${remaining}s (max 1 par 5 min).`,
                ephemeral: true,
            });
        }

        const period = interaction.options.getString('periode') || '24h';
        await interaction.reply({ content: `⏳ Génération du briefing ${period}...`, ephemeral: true });

        const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId });
        if (!serverConfig) {
            return interaction.editReply({ content: '❌ Serveur non configuré. Utilisez `/setup` d\'abord.' });
        }

        await publishBriefingForServer(serverConfig, period);
        await interaction.editReply({ content: `✅ Briefing ${period} publié dans le channel prévu !` });
    },
};
