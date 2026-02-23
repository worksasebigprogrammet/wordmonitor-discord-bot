/**
 * src/discord/commands/favoris.js
 * Commande /favoris — Affiche les articles sauvegardés par l'utilisateur
 */

'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const UserFavorite = require('../../database/models/UserFavorite');
const { SEVERITY_COLORS, SEVERITY_EMOJIS } = require('../../config/constants');
const { CATEGORIES } = require('../../config/categories');
const logger = require('../../utils/logger');

const ITEMS_PER_PAGE = 5;

const data = new SlashCommandBuilder()
    .setName('favoris')
    .setDescription('📚 Affiche vos articles sauvegardés')
    .addIntegerOption(opt =>
        opt.setName('page')
            .setDescription('Numéro de page')
            .setMinValue(1)
    )
    .addBooleanOption(opt =>
        opt.setName('effacer')
            .setDescription('Effacer tous vos favoris ?')
    );

async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const clearAll = interaction.options.getBoolean('effacer');

    if (clearAll) {
        const count = await UserFavorite.countDocuments({ userId: interaction.user.id });
        await UserFavorite.deleteMany({ userId: interaction.user.id });
        return interaction.editReply({
            content: `🗑️ **${count}** favori(s) supprimé(s).`,
        });
    }

    const page = Math.max(1, interaction.options.getInteger('page') || 1);
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const [favorites, total] = await Promise.all([
        UserFavorite.find({ userId: interaction.user.id })
            .sort({ savedAt: -1 })
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .lean(),
        UserFavorite.countDocuments({ userId: interaction.user.id }),
    ]);

    if (total === 0) {
        return interaction.editReply({
            content: '⭐ Vous n\'avez aucun article en favori.\n*Cliquez sur le bouton ⭐ sous une news pour en sauvegarder une !*',
        });
    }

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`⭐ Vos favoris — Page ${page}/${totalPages}`)
        .setDescription(`**${total}** article(s) sauvegardé(s)`)
        .setFooter({ text: `WorldMonitor • Page ${page}/${totalPages} • Utilisez /favoris page:N pour naviguer` });

    for (const fav of favorites) {
        const snap = fav.newsSnapshot || {};
        const title = (snap.titleFr || snap.title || 'Sans titre').substring(0, 80);
        const severity = snap.severity || 'info';
        const catData = CATEGORIES[snap.category];
        const catIcon = catData?.icon || '📰';
        const savedDate = new Date(fav.savedAt).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        });

        embed.addFields({
            name: `${SEVERITY_EMOJIS[severity] || '⚪'} ${catIcon} ${title}`,
            value: [
                snap.summary ? `> ${snap.summary.substring(0, 150)}...` : '',
                `📡 **Source :** ${snap.sourceName || '?'} | 📅 ${savedDate}`,
                snap.url ? `🔗 [Lire l'article](${snap.url})` : '',
            ].filter(Boolean).join('\n'),
            inline: false,
        });
    }

    const rows = [];
    if (totalPages > 1) {
        const navRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`favoris_prev_${page}`)
                .setEmoji('◀️')
                .setLabel('Précédent')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page <= 1),
            new ButtonBuilder()
                .setCustomId(`favoris_next_${page}`)
                .setEmoji('▶️')
                .setLabel('Suivant')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page >= totalPages),
        );
        rows.push(navRow);
    }

    return interaction.editReply({ embeds: [embed], components: rows });
}

module.exports = { data, execute };
