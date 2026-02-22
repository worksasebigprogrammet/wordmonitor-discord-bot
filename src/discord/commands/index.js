/**
 * src/discord/commands/index.js
 * Commande /index - Affiche l'index de tension mondial
 */

'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLatestIndex } = require('../../processors/IndexCalculator');
const { buildIndexEmbed } = require('../embeds/indexEmbed');
const ServerConfig = require('../../database/models/ServerConfig');
const { checkCooldown } = require('../../utils/cooldown');

const command = new SlashCommandBuilder()
    .setName('index')
    .setDescription('📈 Afficher l\'index de tension mondial actuel');

module.exports = {
    data: command,
    async execute(interaction) {
        const { onCooldown, remaining } = checkCooldown('index', interaction.user.id, 30);
        if (onCooldown) {
            return interaction.reply({ content: `⏱️ Cooldown: ${remaining}s`, ephemeral: true });
        }

        await interaction.deferReply();
        const [serverConfig, indexData] = await Promise.all([
            ServerConfig.findOne({ guildId: interaction.guildId }).lean(),
            getLatestIndex(),
        ]);

        const lang = serverConfig?.language || 'fr';
        const embed = buildIndexEmbed(indexData, { lang, showCategories: true });
        await interaction.editReply({ embeds: [embed] });
    },
};
