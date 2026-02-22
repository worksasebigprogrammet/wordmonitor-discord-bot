/**
 * src/discord/commands/news.js
 * Commande /news - Rechercher et afficher des news
 * Sous-commandes: search, latest, country, category
 */

'use strict';

const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const News = require('../../database/models/News');
const ServerConfig = require('../../database/models/ServerConfig');
const { CATEGORIES } = require('../../config/categories');
const { COUNTRIES } = require('../../config/countries');
const { SEVERITY_COLORS, SEVERITY_EMOJIS } = require('../../config/constants');
const { buildNewsEmbed } = require('../embeds/newsEmbed');
const { checkCooldown } = require('../../utils/cooldown');

const command = new SlashCommandBuilder()
    .setName('news')
    .setDescription('📰 Rechercher les dernières actualités')
    .addSubcommand(sub =>
        sub.setName('latest')
            .setDescription('Voir les dernières news')
            .addIntegerOption(opt =>
                opt.setName('nombre').setDescription('Nombre de news à afficher (1-10)').setRequired(false)
            )
    )
    .addSubcommand(sub =>
        sub.setName('search')
            .setDescription('Rechercher des news par mot-clé')
            .addStringOption(opt =>
                opt.setName('query').setDescription('Mot-clé à rechercher').setRequired(true)
            )
    )
    .addSubcommand(sub =>
        sub.setName('country')
            .setDescription('News d\'un pays spécifique')
            .addStringOption(opt =>
                opt.setName('pays')
                    .setDescription('Code ISO du pays (ex: FR, UA)')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    )
    .addSubcommand(sub =>
        sub.setName('category')
            .setDescription('News d\'une catégorie')
            .addStringOption(opt =>
                opt.setName('categorie')
                    .setDescription('Catégorie')
                    .setRequired(true)
                    .addChoices(...Object.entries(CATEGORIES).map(([k, v]) => ({
                        name: `${v.icon} ${v.name.fr}`,
                        value: k,
                    })))
            )
    )
    .addSubcommand(sub =>
        sub.setName('critical')
            .setDescription('Voir les dernières news critiques/hautes')
    );

module.exports = {
    data: command,

    async execute(interaction) {
        const { onCooldown, remaining } = checkCooldown('news', interaction.user.id, 10);
        if (onCooldown) {
            return interaction.reply({
                content: `⏱️ Cooldown: ${remaining}s restantes.`,
                ephemeral: true,
            });
        }

        await interaction.deferReply({ ephemeral: false });

        const sub = interaction.options.getSubcommand();
        const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId }).lean();
        const lang = serverConfig?.language || 'fr';
        let newsItems = [];

        try {
            if (sub === 'latest') {
                const count = Math.min(Math.max(interaction.options.getInteger('nombre') || 5, 1), 10);
                newsItems = await News.find({}).sort({ createdAt: -1 }).limit(count).lean();
            }

            else if (sub === 'search') {
                const query = interaction.options.getString('query');
                newsItems = await News.find({
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { titleFr: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } },
                    ],
                }).sort({ createdAt: -1 }).limit(5).lean();
            }

            else if (sub === 'country') {
                const countryCode = interaction.options.getString('pays').toUpperCase();
                newsItems = await News.find({ country: countryCode }).sort({ createdAt: -1 }).limit(5).lean();
            }

            else if (sub === 'category') {
                const category = interaction.options.getString('categorie');
                newsItems = await News.find({ category }).sort({ createdAt: -1 }).limit(5).lean();
            }

            else if (sub === 'critical') {
                newsItems = await News.find({
                    severity: { $in: ['critical', 'high'] },
                }).sort({ createdAt: -1 }).limit(5).lean();
            }

            if (newsItems.length === 0) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(SEVERITY_COLORS.info)
                        .setTitle('🔍 Aucun résultat')
                        .setDescription('Aucune news trouvée pour cette requête dans les dernières 24h.')],
                });
            }

            // Afficher les news (max 5 embeds par message)
            const embeds = newsItems.slice(0, 5).map(news => buildNewsEmbed(news, lang));
            await interaction.editReply({ embeds });

        } catch (error) {
            await interaction.editReply({ content: `❌ Erreur: ${error.message}` });
        }
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toUpperCase();
        const choices = Object.entries(COUNTRIES)
            .filter(([code, data]) =>
                code.includes(focusedValue) || data.name.toUpperCase().includes(focusedValue)
            )
            .slice(0, 25)
            .map(([code, data]) => ({ name: `${data.emoji} ${data.name} (${code})`, value: code }));
        await interaction.respond(choices);
    },
};
