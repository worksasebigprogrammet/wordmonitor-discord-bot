/**
 * src/discord/embeds/newsEmbed.js
 * Génère l'embed Discord pour un article de news
 * Format : couleur selon gravité, emoji pays, source, lien
 */

'use strict';

const { EmbedBuilder } = require('discord.js');
const moment = require('moment');
const {
    SEVERITY_COLORS,
    SEVERITY_EMOJIS,
    SEVERITY_LABELS,
    CATEGORY_EMOJIS,
    DISCORD_LIMITS,
} = require('../../config/constants');
const { COUNTRIES } = require('../../config/countries');
const { CATEGORIES } = require('../../config/categories');

/**
 * Tronque un texte à la longueur maximale
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

/**
 * Génère un embed Discord pour un article
 * @param {object} news - Document News MongoDB
 * @param {string} lang - Langue ('fr'|'en')
 * @returns {EmbedBuilder}
 */
function buildNewsEmbed(news, lang = 'fr') {
    const isFr = lang === 'fr';
    const title = isFr ? (news.titleFr || news.title) : news.title;
    const description = isFr ? (news.descriptionFr || news.description) : news.description;
    const summary = news.summary || description;

    // ─── Ligne d'en-tête ─────────────────────────────────────────────────────
    const categoryData = CATEGORIES[news.category] || {};
    const categoryEmoji = categoryData.icon || CATEGORY_EMOJIS[news.category] || '📰';
    const categoryName = isFr
        ? (categoryData.name?.fr || news.category)
        : (categoryData.name?.en || news.category);

    const severityEmoji = SEVERITY_EMOJIS[news.severity] || '🔵';
    const severityLabel = SEVERITY_LABELS[news.severity] || news.severity;

    // ─── Localisation ─────────────────────────────────────────────────────────
    const countryData = news.country ? COUNTRIES[news.country] : null;
    const countryEmoji = countryData?.emoji || '';
    const countryName = countryData?.name || '';

    // ─── Construction de l'embed ──────────────────────────────────────────────
    const embed = new EmbedBuilder()
        .setColor(SEVERITY_COLORS[news.severity] || SEVERITY_COLORS.info)
        .setTitle(truncate(`${severityEmoji} ${title}`, DISCORD_LIMITS.EMBED_TITLE_MAX))
        .setURL(news.url)
        .setTimestamp(news.originalDate || news.createdAt);

    // Description = résumé ou extrait
    const descText = truncate(summary || description || '', DISCORD_LIMITS.EMBED_DESC_MAX);
    if (descText) embed.setDescription(descText);

    // ─── Champs d'information ─────────────────────────────────────────────────
    const fields = [];

    // Catégorie + gravité
    fields.push({
        name: isFr ? '📌 Catégorie' : '📌 Category',
        value: `${categoryEmoji} ${categoryName}`,
        inline: true,
    });
    fields.push({
        name: isFr ? '⚡ Gravité' : '⚡ Severity',
        value: `${severityEmoji} ${severityLabel}`,
        inline: true,
    });

    // Localisation (si disponible)
    if (countryName) {
        fields.push({
            name: isFr ? '📍 Lieu' : '📍 Location',
            value: `${countryEmoji} ${countryName}`,
            inline: true,
        });
    }

    // Source + fiabilité
    const reliabilityBar = '▓'.repeat(news.sourceReliability || 7) + '░'.repeat(10 - (news.sourceReliability || 7));
    fields.push({
        name: isFr ? '📡 Source' : '📡 Source',
        value: `${news.sourceName}\n\`${reliabilityBar}\` ${news.sourceReliability || 7}/10`,
        inline: true,
    });

    // Sources multiples
    if (news.reportCount > 1) {
        fields.push({
            name: isFr ? '🔄 Relayé par' : '🔄 Reported by',
            value: `${news.reportCount} sources`,
            inline: true,
        });
    }

    embed.addFields(fields);

    // Image (si disponible)
    if (news.imageUrl) {
        embed.setImage(news.imageUrl);
    }

    // Footer
    const timeAgo = moment(news.originalDate || news.createdAt).fromNow();
    embed.setFooter({
        text: `WorldMonitor • ${timeAgo}`,
        iconURL: 'https://i.imgur.com/worldmonitor-icon.png', // Remplacer par l'icône réelle
    });

    return embed;
}

/**
 * Génère un embed simplifié (pour les channels secondaires, index, etc.)
 * @param {object} news
 * @param {string} lang
 * @returns {EmbedBuilder}
 */
function buildCompactNewsEmbed(news, lang = 'fr') {
    const isFr = lang === 'fr';
    const title = isFr ? (news.titleFr || news.title) : news.title;

    const categoryData = CATEGORIES[news.category] || {};
    const categoryEmoji = categoryData.icon || '📰';
    const severityEmoji = SEVERITY_EMOJIS[news.severity] || '🔵';
    const countryEmoji = news.country ? (COUNTRIES[news.country]?.emoji || '') : '';

    return new EmbedBuilder()
        .setColor(SEVERITY_COLORS[news.severity] || SEVERITY_COLORS.info)
        .setTitle(truncate(`${severityEmoji} ${categoryEmoji} ${countryEmoji} ${title}`, DISCORD_LIMITS.EMBED_TITLE_MAX))
        .setURL(news.url)
        .setFooter({ text: `${news.sourceName} • ${moment(news.originalDate).fromNow()}` })
        .setTimestamp(news.originalDate);
}

module.exports = { buildNewsEmbed, buildCompactNewsEmbed, truncate };
