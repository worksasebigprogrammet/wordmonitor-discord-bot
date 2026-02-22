/**
 * src/discord/embeds/indexEmbed.js
 * Embed de l'index de tension mondial (mis à jour toutes les 10 min)
 * Affiche: index global, continents, catégories, zones chaudes
 */

'use strict';

const { EmbedBuilder } = require('discord.js');
const moment = require('moment');
const { DISCORD_LIMITS, SEVERITY_COLORS, CONTINENT_EMOJIS, CATEGORY_EMOJIS } = require('../../config/constants');
const { CATEGORIES } = require('../../config/categories');
const { truncate } = require('./newsEmbed');

/**
 * Convertit un index (0-10) en barre de progression colorée
 * @param {number} score - Score entre 0 et 10
 * @returns {string}
 */
function indexToBar(score) {
    const bars = 10;
    const filled = Math.round(score);
    if (filled >= 8) return '🔴'.repeat(filled) + '⬛'.repeat(bars - filled);
    if (filled >= 5) return '🟠'.repeat(filled) + '⬛'.repeat(bars - filled);
    if (filled >= 3) return '🟡'.repeat(filled) + '⬛'.repeat(bars - filled);
    return '🟢'.repeat(Math.max(filled, 1)) + '⬛'.repeat(bars - Math.max(filled, 1));
}

/**
 * Convertit un index en label textuel
 * @param {number} score
 * @returns {string}
 */
function indexToLabel(score) {
    if (score >= 8) return 'CRITIQUE 🔴';
    if (score >= 6) return 'ÉLEVÉ 🟠';
    if (score >= 4) return 'MODÉRÉ 🟡';
    if (score >= 2) return 'FAIBLE 🟢';
    return 'STABLE 🔵';
}

const CONTINENT_NAMES = {
    europe: 'Europe',
    middle_east: 'Moyen-Orient',
    asia: 'Asie',
    africa: 'Afrique',
    americas: 'Amériques',
};

/**
 * Construit l'embed de l'index de tension mondial
 * @param {object} indexData - Dernières données d'index
 * @param {object} options - Options (lang, showCategories)
 * @returns {EmbedBuilder}
 */
function buildIndexEmbed(indexData, options = {}) {
    const { lang = 'fr', showCategories = true } = options;

    if (!indexData) {
        return new EmbedBuilder()
            .setColor(SEVERITY_COLORS.info)
            .setTitle('🌍 Index de Tension Mondial')
            .setDescription('*Aucune donnée disponible - premier calcul en cours...*');
    }

    const globalScore = indexData.global || 0;
    const globalLabel = indexToLabel(globalScore);
    const globalBar = indexToBar(globalScore);
    const globalColor = globalScore >= 7 ? SEVERITY_COLORS.critical
        : globalScore >= 5 ? SEVERITY_COLORS.high
            : globalScore >= 3 ? SEVERITY_COLORS.medium
                : SEVERITY_COLORS.low;

    const embed = new EmbedBuilder()
        .setColor(globalColor)
        .setTitle('🌍 Index de Tension Mondial — WorldMonitor')
        .setTimestamp(indexData.timestamp || new Date());

    // ─── Index global ─────────────────────────────────────────────────────────
    const globalDesc = [
        `## ${globalBar}`,
        `**Score global: ${globalScore.toFixed(1)}/10** — ${globalLabel}`,
        '',
    ].join('\n');
    embed.setDescription(truncate(globalDesc, DISCORD_LIMITS.EMBED_DESC_MAX));

    const fields = [];

    // ─── Index par continent ───────────────────────────────────────────────────
    const continentLines = Object.entries(indexData.continents || {})
        .sort((a, b) => b[1] - a[1])
        .map(([cont, score]) => {
            const emoji = CONTINENT_EMOJIS[cont] || '🌐';
            const name = CONTINENT_NAMES[cont] || cont;
            const bar = indexToBar(score);
            return `${emoji} **${name}** ${score.toFixed(1)}/10\n${bar}`;
        });

    if (continentLines.length > 0) {
        // Diviser en 2 colonnes si plus de 3 continents
        const half = Math.ceil(continentLines.length / 2);
        fields.push({
            name: '🗺️ Par Région',
            value: truncate(continentLines.slice(0, half).join('\n\n'), DISCORD_LIMITS.EMBED_FIELD_VALUE_MAX),
            inline: true,
        });
        if (continentLines.length > 1) {
            fields.push({
                name: '\u200b', // Feldname vide pour l'alignement
                value: truncate(continentLines.slice(half).join('\n\n'), DISCORD_LIMITS.EMBED_FIELD_VALUE_MAX),
                inline: true,
            });
        }
    }

    // ─── Zones chaudes ────────────────────────────────────────────────────────
    if (indexData.hotZones && indexData.hotZones.length > 0) {
        const hotZonesText = indexData.hotZones
            .slice(0, 5)
            .map((z, i) => `${i === 0 ? '🔥' : '⚡'} **${z.country}** — Score ${z.score.toFixed(1)}/10`)
            .join('\n');

        fields.push({
            name: '🔥 Zones les Plus Actives',
            value: truncate(hotZonesText, DISCORD_LIMITS.EMBED_FIELD_VALUE_MAX),
            inline: false,
        });
    }

    // ─── Catégories (si demandé) ───────────────────────────────────────────────
    if (showCategories && indexData.categories) {
        const catLines = Object.entries(indexData.categories)
            .filter(([, score]) => score > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([cat, score]) => {
                const catData = CATEGORIES[cat];
                const emoji = catData?.icon || CATEGORY_EMOJIS[cat] || '📰';
                const name = catData?.name?.fr || cat;
                return `${emoji} ${name}: **${score.toFixed(1)}**`;
            });

        if (catLines.length > 0) {
            const half = Math.ceil(catLines.length / 2);
            fields.push({
                name: '📊 Par Thématique',
                value: truncate(catLines.slice(0, half).join('\n'), DISCORD_LIMITS.EMBED_FIELD_VALUE_MAX),
                inline: true,
            });
            if (catLines.length > 1) {
                fields.push({
                    name: '\u200b',
                    value: truncate(catLines.slice(half).join('\n'), DISCORD_LIMITS.EMBED_FIELD_VALUE_MAX),
                    inline: true,
                });
            }
        }
    }

    embed.addFields(fields);
    embed.setFooter({
        text: `Mis à jour il y a ${moment(indexData.timestamp).fromNow(true)} • Prochaine mise à jour dans 10 min`,
    });

    return embed;
}

module.exports = { buildIndexEmbed, indexToBar, indexToLabel };
