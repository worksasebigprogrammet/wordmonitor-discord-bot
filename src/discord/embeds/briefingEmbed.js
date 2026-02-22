/**
 * src/discord/embeds/briefingEmbed.js
 * Embed de briefing périodique (résumé toutes les 3h/5h/12h/24h)
 * Résumé structuré avec les principaux événements, statistiques, tendances
 */

'use strict';

const { EmbedBuilder } = require('discord.js');
const moment = require('moment');
const { SEVERITY_COLORS, SEVERITY_EMOJIS, CATEGORY_EMOJIS, DISCORD_LIMITS } = require('../../config/constants');
const { CATEGORIES } = require('../../config/categories');
const { COUNTRIES } = require('../../config/countries');
const { truncate } = require('./newsEmbed');

const BRIEFING_HEADER = {
    fr: {
        '3h': '📊 Briefing des 3 Dernières Heures',
        '5h': '📊 Briefing des 5 Dernières Heures',
        '12h': '📊 Briefing du Demi-Jour',
        '24h': '📊 Briefing Quotidien',
        '1h': '📊 Briefing Horaire',
    },
    en: {
        '3h': '📊 3-Hour Briefing',
        '5h': '📊 5-Hour Briefing',
        '12h': '📊 Half-Day Briefing',
        '24h': '📊 Daily Briefing',
        '1h': '📊 Hourly Briefing',
    },
};

/**
 * Construit l'embed de briefing périodique
 * @param {object} data - { topNews, stats, hotZones, period, indexData }
 * @param {string} lang - Langue ('fr'|'en')
 * @returns {EmbedBuilder[]} Tableau d'embeds (peut en prendre plusieurs si trop long)
 */
function buildBriefingEmbed(data, lang = 'fr') {
    const isFr = lang === 'fr';
    const { topNews = [], stats = {}, hotZones = [], period = '24h', indexData = null } = data;

    const title = BRIEFING_HEADER[lang]?.[period] || '📊 Briefing WorldMonitor';
    const now = new Date();
    const periodStart = moment().subtract(parseInt(period), 'hours').format('HH:mm');
    const periodEnd = moment(now).format('HH:mm DD/MM');

    // Couleur selon la gravité la plus élevée
    const maxSeverity = topNews.length > 0 ? topNews[0].severity : 'low';
    const color = SEVERITY_COLORS[maxSeverity] || SEVERITY_COLORS.info;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setTimestamp(now);

    // ─── Résumé global ────────────────────────────────────────────────────────
    const globalScore = indexData?.global;
    const totalNews = stats.total || 0;
    const criticals = stats.critical || 0;

    let desc = '';
    if (globalScore !== undefined) {
        desc += `**Index de tension:** ${globalScore.toFixed(1)}/10\n`;
    }
    desc += `**Événements traités:** ${totalNews} | **Critiques:** ${criticals} 🔴\n`;
    desc += `**Période:** ${periodStart} → ${periodEnd}\n`;

    embed.setDescription(truncate(desc, DISCORD_LIMITS.EMBED_DESC_MAX));

    const fields = [];

    // ─── Top événements ───────────────────────────────────────────────────────
    if (topNews.length > 0) {
        const topLines = topNews
            .slice(0, 6)
            .map(news => {
                const sevEmoji = SEVERITY_EMOJIS[news.severity] || '🔵';
                const catEmoji = CATEGORIES[news.category]?.icon || '📰';
                const countryEmoji = news.country ? (COUNTRIES[news.country]?.emoji || '') : '';
                const title = isFr ? (news.titleFr || news.title) : news.title;
                const shortTitle = truncate(title, 80);
                return `${sevEmoji}${catEmoji}${countryEmoji} [${shortTitle}](${news.url})`;
            })
            .join('\n');

        fields.push({
            name: isFr ? '🔝 Principaux Événements' : '🔝 Top Events',
            value: truncate(topLines, DISCORD_LIMITS.EMBED_FIELD_VALUE_MAX),
            inline: false,
        });
    }

    // ─── Zones les plus actives ───────────────────────────────────────────────
    if (hotZones.length > 0) {
        const zonesText = hotZones
            .slice(0, 3)
            .map(z => {
                const countryData = COUNTRIES[z.country];
                return `${countryData?.emoji || '🌐'} **${countryData?.name || z.country}** — ${z.count || 0} événements`;
            })
            .join('\n');

        fields.push({
            name: isFr ? '🔥 Zones les Plus Actives' : '🔥 Most Active Zones',
            value: truncate(zonesText, DISCORD_LIMITS.EMBED_FIELD_VALUE_MAX),
            inline: true,
        });
    }

    // ─── Stats par catégorie ──────────────────────────────────────────────────
    if (stats.byCategory && Object.keys(stats.byCategory).length > 0) {
        const catLines = Object.entries(stats.byCategory)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cat, count]) => {
                const catData = CATEGORIES[cat];
                const emoji = catData?.icon || '📰';
                const name = isFr ? (catData?.name?.fr || cat) : (catData?.name?.en || cat);
                return `${emoji} ${name}: **${count}**`;
            })
            .join('\n');

        if (catLines) {
            fields.push({
                name: isFr ? '📊 Par Thématique' : '📊 By Category',
                value: truncate(catLines, DISCORD_LIMITS.EMBED_FIELD_VALUE_MAX),
                inline: true,
            });
        }
    }

    embed.addFields(fields);
    embed.setFooter({
        text: `WorldMonitor • Prochain briefing dans ${period}`,
    });

    return [embed];
}

module.exports = { buildBriefingEmbed };
