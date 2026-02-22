/**
 * src/discord/commands/help.js
 * Commande /help - Liste des commandes disponibles
 */

'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { SEVERITY_COLORS } = require('../../config/constants');

const command = new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 Aide et liste des commandes WorldMonitor');

module.exports = {
    data: command,
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📖 WorldMonitor — Aide')
            .setDescription('Bot de surveillance de l\'actualité mondiale en temps réel.')
            .addFields(
                {
                    name: '🔧 Configuration (Admin)',
                    value: [
                        '`/setup` — Assistant de configuration initiale',
                        '`/panel` — Panneau de contrôle',
                        '`/config` — Options avancées',
                        '`/crisis create/close/list` — Gérer les crises',
                        '`/sources add/remove/list` — Sources RSS custom',
                    ].join('\n'),
                },
                {
                    name: '🌍 Surveillance (Modérateurs)',
                    value: [
                        '`/monitor add/remove/list` — Pays & catégories',
                        '`/briefing [periode]` — Briefing immédiat',
                    ].join('\n'),
                },
                {
                    name: '📰 Actualités (Tous)',
                    value: [
                        '`/news latest [n]` — Dernières news',
                        '`/news search <query>` — Recherche par mot-clé',
                        '`/news country <code>` — News d\'un pays',
                        '`/news category <cat>` — News par catégorie',
                        '`/news critical` — Alertes critiques/hautes',
                        '`/index` — Index de tension mondial',
                        '`/status` — Statut du bot',
                    ].join('\n'),
                },
                {
                    name: '📊 Niveaux de gravité',
                    value: [
                        '🔴 **Critique** — Guerre, nucléaire, attentat majeur',
                        '🟠 **Haute** — Conflit actif, sanctions, séisme M7+',
                        '🟡 **Moyenne** — Tensions, exercices militaires',
                        '🟢 **Basse** — Diplomatie, économie standard',
                    ].join('\n'),
                }
            )
            .setFooter({ text: 'WorldMonitor v1.0.0 | Surveillance 24/7' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
