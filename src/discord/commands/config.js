/**
 * src/discord/commands/config.js
 * Commande /config - Configurer les options avancées du bot
 */

'use strict';

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require('discord.js');

const ServerConfig = require('../../database/models/ServerConfig');
const { SEVERITY_COLORS } = require('../../config/constants');

const command = new SlashCommandBuilder()
    .setName('config')
    .setDescription('⚙️ Configurer les options avancées de WorldMonitor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
        sub.setName('langue')
            .setDescription('Changer la langue du bot')
            .addStringOption(opt =>
                opt.setName('lang')
                    .setDescription('Langue')
                    .setRequired(true)
                    .addChoices(
                        { name: '🇫🇷 Français', value: 'fr' },
                        { name: '🇬🇧 English', value: 'en' },
                    ))
    )
    .addSubcommand(sub =>
        sub.setName('alertes')
            .setDescription('Configurer les niveaux d\'alerte')
            .addBooleanOption(opt => opt.setName('critical').setDescription('🔴 Critiques').setRequired(false))
            .addBooleanOption(opt => opt.setName('high').setDescription('🟠 Hautes').setRequired(false))
            .addBooleanOption(opt => opt.setName('medium').setDescription('🟡 Moyennes').setRequired(false))
            .addBooleanOption(opt => opt.setName('low').setDescription('🟢 Basses').setRequired(false))
    )
    .addSubcommand(sub =>
        sub.setName('briefing')
            .setDescription('Configurer le briefing automatique')
            .addBooleanOption(opt => opt.setName('actif').setDescription('Activer/désactiver').setRequired(false))
            .addStringOption(opt =>
                opt.setName('intervalle')
                    .setDescription('Intervalle de publication')
                    .setRequired(false)
                    .addChoices(
                        { name: '1 heure', value: '1h' },
                        { name: '3 heures', value: '3h' },
                        { name: '5 heures', value: '5h' },
                        { name: '12 heures', value: '12h' },
                        { name: '24 heures', value: '24h' },
                    ))
    )
    .addSubcommand(sub =>
        sub.setName('voir')
            .setDescription('Voir la configuration actuelle')
    );

module.exports = {
    data: command,

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId });

        if (!serverConfig) {
            return interaction.reply({ content: '❌ Serveur non configuré. Utilisez `/setup`', ephemeral: true });
        }

        if (sub === 'langue') {
            const lang = interaction.options.getString('lang');
            serverConfig.language = lang;
            await serverConfig.save();
            return interaction.reply({
                content: `✅ Langue changée vers **${lang === 'fr' ? 'Français 🇫🇷' : 'English 🇬🇧'}**`,
                ephemeral: true,
            });
        }

        if (sub === 'alertes') {
            const levels = ['critical', 'high', 'medium', 'low'];
            const newLevels = [];
            let changed = false;

            for (const level of levels) {
                const val = interaction.options.getBoolean(level);
                if (val !== null) {
                    changed = true;
                    if (val) newLevels.push(level);
                } else if (serverConfig.alertLevels.includes(level)) {
                    newLevels.push(level);
                }
            }

            if (!changed) {
                return interaction.reply({ content: '❌ Spécifiez au moins un niveau à modifier.', ephemeral: true });
            }

            if (newLevels.length === 0) {
                return interaction.reply({ content: '❌ Vous devez garder au moins un niveau d\'alerte actif.', ephemeral: true });
            }

            serverConfig.alertLevels = newLevels;
            await serverConfig.save();
            return interaction.reply({
                content: `✅ Niveaux d'alerte mis à jour: **${newLevels.join(' + ')}**`,
                ephemeral: true,
            });
        }

        if (sub === 'briefing') {
            const actif = interaction.options.getBoolean('actif');
            const intervalle = interaction.options.getString('intervalle');

            if (actif !== null) serverConfig.briefingEnabled = actif;
            if (intervalle) serverConfig.briefingInterval = intervalle;

            await serverConfig.save();
            return interaction.reply({
                content: `✅ Briefing: ${serverConfig.briefingEnabled ? 'Activé' : 'Désactivé'} | Intervalle: ${serverConfig.briefingInterval}`,
                ephemeral: true,
            });
        }

        if (sub === 'voir') {
            const embed = new EmbedBuilder()
                .setColor(SEVERITY_COLORS.info)
                .setTitle('⚙️ Configuration WorldMonitor')
                .addFields(
                    { name: 'Preset', value: serverConfig.preset, inline: true },
                    { name: 'Langue', value: serverConfig.language, inline: true },
                    { name: 'Alertes', value: serverConfig.alertLevels.join(' + '), inline: true },
                    { name: 'Briefing', value: `${serverConfig.briefingEnabled ? '✅' : '❌'} toutes les ${serverConfig.briefingInterval}`, inline: true },
                    { name: 'Carte', value: serverConfig.mapEnabled ? '✅' : '❌', inline: true },
                    { name: 'Crise', value: serverConfig.crisisSystem ? '✅' : '❌', inline: true },
                    { name: 'Catégories', value: serverConfig.enabledCategories.join(', ') || '*aucune*', inline: false },
                    { name: 'Pays', value: serverConfig.monitoredCountries.join(', ') || '*aucun*', inline: false },
                );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
