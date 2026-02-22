/**
 * src/discord/commands/monitor.js
 * Commande /monitor - Gérer les pays et catégories surveillées
 * Sous-commandes: add, remove, list
 */

'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    AutocompleteInteraction,
} = require('discord.js');

const ServerConfig = require('../../database/models/ServerConfig');
const { COUNTRIES, COUNTRIES_BY_CONTINENT, CONTINENTS } = require('../../config/countries');
const { CATEGORIES } = require('../../config/categories');
const { SEVERITY_COLORS } = require('../../config/constants');
const { checkCooldown } = require('../../utils/cooldown');

const command = new SlashCommandBuilder()
    .setName('monitor')
    .setDescription('🌍 Gérer les pays et thématiques surveillées')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
        sub.setName('add')
            .setDescription('Ajouter un pays ou une thématique')
            .addStringOption(opt =>
                opt.setName('pays')
                    .setDescription('Code ISO du pays (ex: FR, UA, US)')
                    .setRequired(false)
                    .setAutocomplete(true))
            .addStringOption(opt =>
                opt.setName('categorie')
                    .setDescription('Catégorie à surveiller')
                    .setRequired(false)
                    .addChoices(...Object.entries(CATEGORIES).map(([k, v]) => ({
                        name: `${v.icon} ${v.name.fr}`,
                        value: k,
                    }))))
    )
    .addSubcommand(sub =>
        sub.setName('remove')
            .setDescription('Retirer un pays ou une thématique')
            .addStringOption(opt =>
                opt.setName('pays')
                    .setDescription('Code ISO du pays à retirer')
                    .setRequired(false)
                    .setAutocomplete(true))
            .addStringOption(opt =>
                opt.setName('categorie')
                    .setDescription('Catégorie à désactiver')
                    .setRequired(false)
                    .addChoices(...Object.entries(CATEGORIES).map(([k, v]) => ({
                        name: `${v.icon} ${v.name.fr}`,
                        value: k,
                    }))))
    )
    .addSubcommand(sub =>
        sub.setName('list')
            .setDescription('Voir les pays et catégories surveillées')
    );

module.exports = {
    data: command,

    async execute(interaction) {
        // Cooldown
        const { onCooldown, remaining } = checkCooldown('monitor', interaction.user.id, 5);
        if (onCooldown) {
            return interaction.reply({
                content: `⏱️ Commande en cooldown. Réessayez dans ${remaining}s.`,
                ephemeral: true,
            });
        }

        const sub = interaction.options.getSubcommand();
        const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId });

        if (!serverConfig?.setupComplete) {
            return interaction.reply({
                content: '❌ WorldMonitor n\'est pas configuré sur ce serveur. Utilisez `/setup` d\'abord.',
                ephemeral: true,
            });
        }

        if (sub === 'add') {
            const pays = interaction.options.getString('pays');
            const categorie = interaction.options.getString('categorie');
            const changes = [];

            if (pays) {
                const countryCode = pays.toUpperCase();
                if (!COUNTRIES[countryCode]) {
                    return interaction.reply({ content: `❌ Pays inconnu: ${pays}`, ephemeral: true });
                }
                if (!serverConfig.monitoredCountries.includes(countryCode)) {
                    serverConfig.monitoredCountries.push(countryCode);
                    changes.push(`✅ Pays ajouté: ${COUNTRIES[countryCode].emoji} ${COUNTRIES[countryCode].name}`);
                } else {
                    changes.push(`⚠️ ${COUNTRIES[countryCode].name} est déjà surveillé`);
                }
            }

            if (categorie) {
                if (!serverConfig.enabledCategories.includes(categorie)) {
                    serverConfig.enabledCategories.push(categorie);
                    const catData = CATEGORIES[categorie];
                    changes.push(`✅ Catégorie ajoutée: ${catData?.icon} ${catData?.name?.fr}`);
                } else {
                    changes.push(`⚠️ Catégorie déjà activée`);
                }
            }

            if (changes.length === 0) {
                return interaction.reply({ content: '❌ Spécifiez un pays et/ou une catégorie.', ephemeral: true });
            }

            await serverConfig.save();
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(SEVERITY_COLORS.low)
                    .setTitle('✅ Surveillance mise à jour')
                    .setDescription(changes.join('\n'))],
                ephemeral: true,
            });
        }

        if (sub === 'remove') {
            const pays = interaction.options.getString('pays');
            const categorie = interaction.options.getString('categorie');
            const changes = [];

            if (pays) {
                const countryCode = pays.toUpperCase();
                const idx = serverConfig.monitoredCountries.indexOf(countryCode);
                if (idx !== -1) {
                    serverConfig.monitoredCountries.splice(idx, 1);
                    changes.push(`✅ Pays retiré: ${COUNTRIES[countryCode]?.emoji} ${COUNTRIES[countryCode]?.name}`);
                } else {
                    changes.push(`⚠️ ${COUNTRIES[countryCode]?.name || pays} n'était pas surveillé`);
                }
            }

            if (categorie) {
                const idx = serverConfig.enabledCategories.indexOf(categorie);
                if (idx !== -1) {
                    serverConfig.enabledCategories.splice(idx, 1);
                    const catData = CATEGORIES[categorie];
                    changes.push(`✅ Catégorie retirée: ${catData?.icon} ${catData?.name?.fr}`);
                }
            }

            if (changes.length === 0) {
                return interaction.reply({ content: '❌ Spécifiez un pays et/ou une catégorie.', ephemeral: true });
            }

            await serverConfig.save();
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(SEVERITY_COLORS.medium)
                    .setTitle('✅ Surveillance mise à jour')
                    .setDescription(changes.join('\n'))],
                ephemeral: true,
            });
        }

        if (sub === 'list') {
            const monitoredList = serverConfig.monitoredCountries
                .map(code => `${COUNTRIES[code]?.emoji || ''} **${COUNTRIES[code]?.name || code}**`)
                .join(', ') || '*Aucun pays spécifique*';

            const categoriesList = serverConfig.enabledCategories
                .map(cat => `${CATEGORIES[cat]?.icon || ''} ${CATEGORIES[cat]?.name?.fr || cat}`)
                .join(' | ') || '*Aucune*';

            const embed = new EmbedBuilder()
                .setColor(SEVERITY_COLORS.info)
                .setTitle('📋 Surveillance active')
                .addFields(
                    { name: '🌍 Pays surveillés', value: monitoredList, inline: false },
                    { name: '📌 Catégories actives', value: categoriesList, inline: false },
                    {
                        name: '⚡ Niveaux d\'alerte',
                        value: serverConfig.alertLevels.join(' + '),
                        inline: true,
                    },
                    {
                        name: '🌐 Continents',
                        value: serverConfig.enabledContinents.join(', ') || '*Tous*',
                        inline: true,
                    }
                );

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toUpperCase();
        const choices = Object.entries(COUNTRIES)
            .filter(([code, data]) =>
                code.includes(focusedValue) ||
                data.name.toUpperCase().includes(focusedValue)
            )
            .slice(0, DISCORD_LIMITS?.AUTOCOMPLETE_MAX || 25)
            .map(([code, data]) => ({
                name: `${data.emoji} ${data.name} (${code})`,
                value: code,
            }));

        await interaction.respond(choices);
    },
};
