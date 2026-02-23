/**
 * src/discord/handlers/newsButtonHandler.js
 * Handler des boutons interactifs sous chaque news embed
 *
 * Boutons gérés :
 * - news_fav_{newsId}        → Toggle favori dans UserFavorite
 * - news_translate_{newsId}  → Select menu de langues
 * - news_summary_{newsId}    → Résumé étendu (7-8 phrases)
 * - news_sources_{newsId}    → Liste des sources avec fiabilité
 * - news_lang_{newsId}_{code} → Traduction effective après sélection langue
 *
 * Toutes les réponses sont ÉPHÉMÈRES (visibles seulement par le cliqueur)
 */

'use strict';

const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require('discord.js');
const logger = require('../../utils/logger');
const News = require('../../database/models/News');
const UserFavorite = require('../../database/models/UserFavorite');
const { CATEGORIES } = require('../../config/categories');
const { COUNTRIES } = require('../../config/countries');
const { SEVERITY_COLORS, SEVERITY_EMOJIS } = require('../../config/constants');

// ─── Utilitaires ──────────────────────────────────────────────────────────────

/**
 * Extrait le newsId depuis un customId de bouton news
 * Format: news_{action}_{newsId}  ou  news_lang_{newsId}_{langCode}
 * @param {string} customId
 * @param {string} action
 * @returns {string|null}
 */
function extractNewsId(customId, action) {
    // news_fav_6789abc → '6789abc'
    // news_lang_6789abc_fr → '6789abc'
    const prefix = `news_${action}_`;
    if (customId.startsWith(prefix)) {
        const rest = customId.slice(prefix.length);
        // Pour news_lang_{id}_{code}, on prend juste l'id (avant le dernier _)
        if (action === 'lang') {
            const parts = rest.split('_');
            // last part = lang code, rest = newsId
            return parts.slice(0, -1).join('_');
        }
        return rest;
    }
    return null;
}

/**
 * Charge une news depuis la BDD, avec gestion d'erreur propre
 * @param {string} newsId
 * @returns {object|null}
 */
async function fetchNews(newsId) {
    try {
        return await News.findById(newsId).lean();
    } catch {
        return null;
    }
}

// ─── Handlers par action ──────────────────────────────────────────────────────

/**
 * Handler pour ⭐ Favori — toggle dans UserFavorite
 */
async function handleFavorite(interaction, newsId) {
    const news = await fetchNews(newsId);
    if (!news) {
        return interaction.reply({
            content: '❌ Cet article n\'est plus disponible.',
            ephemeral: true,
        });
    }

    try {
        const existing = await UserFavorite.findOne({
            userId: interaction.user.id,
            newsId: news._id,
        });

        if (existing) {
            await UserFavorite.deleteOne({ _id: existing._id });
            return interaction.reply({
                content: `⭐ Retiré des favoris — **${(news.titleFr || news.title)?.substring(0, 60)}**`,
                ephemeral: true,
            });
        } else {
            await UserFavorite.create({
                userId: interaction.user.id,
                guildId: interaction.guildId,
                newsId: news._id,
                newsSnapshot: {
                    title: news.title,
                    titleFr: news.titleFr,
                    url: news.url,
                    category: news.category,
                    severity: news.severity,
                    country: news.country,
                    sourceName: news.sourceName,
                    summary: news.summary,
                },
            });
            return interaction.reply({
                content: `⭐ Ajouté aux favoris ! Utilisez \`/favoris\` pour les retrouver.\n> **${(news.titleFr || news.title)?.substring(0, 80)}**`,
                ephemeral: true,
            });
        }
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate key — race condition, déjà en favori
            await UserFavorite.deleteOne({ userId: interaction.user.id, newsId: news._id });
            return interaction.reply({ content: '⭐ Retiré des favoris.', ephemeral: true });
        }
        throw err;
    }
}

/**
 * Handler pour 🌐 Traduire — affiche un select menu de langues
 */
async function handleTranslate(interaction, newsId) {
    const news = await fetchNews(newsId);
    if (!news) {
        return interaction.reply({ content: '❌ Article introuvable.', ephemeral: true });
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`news_lang_${newsId}_select`)
        .setPlaceholder('Choisissez une langue...')
        .addOptions([
            { label: '🇫🇷 Français', value: `news_lang_${newsId}_fr`, emoji: '🇫🇷' },
            { label: '🇬🇧 English', value: `news_lang_${newsId}_en`, emoji: '🇬🇧' },
            { label: '🇪🇸 Español', value: `news_lang_${newsId}_es`, emoji: '🇪🇸' },
            { label: '🇩🇪 Deutsch', value: `news_lang_${newsId}_de`, emoji: '🇩🇪' },
            { label: '🇸🇦 العربية', value: `news_lang_${newsId}_ar`, emoji: '🇸🇦' },
        ]);

    return interaction.reply({
        content: `🌐 **Traduction** — *${(news.titleFr || news.title)?.substring(0, 80)}*\nSélectionnez la langue de destination :`,
        components: [new ActionRowBuilder().addComponents(selectMenu)],
        ephemeral: true,
    });
}

/**
 * Handler pour la sélection de langue (select menu)
 */
async function handleLanguageSelect(interaction) {
    // La valeur sélectionnée ressemble à 'news_lang_{newsId}_{code}'
    const value = interaction.values[0];
    const parts = value.split('_');
    const langCode = parts[parts.length - 1];
    // newsId = tout ce qui est entre 'news_lang_' et '_{langCode}'
    const newsId = parts.slice(2, -1).join('_');

    const news = await fetchNews(newsId);
    if (!news) {
        return interaction.update({ content: '❌ Article introuvable.', components: [] });
    }

    const langLabels = { fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch', ar: 'العربية' };

    // Pour FR et EN, on a déjà la version native dans la BDD
    let title = news.title;
    let description = news.summary || news.description || '';

    if (langCode === 'fr') {
        title = news.titleFr || news.title;
        description = news.descriptionFr || news.summary || news.description || '';
    } else if (langCode === 'en') {
        title = news.title;
        description = news.summary || news.description || '';
    } else {
        // Autres langues : traduction simplifiée via message informatif
        // (Une vraie intégration DeepL nécessiterait DEEPL_API_KEY)
        const apiKey = process.env.DEEPL_API_KEY;
        if (apiKey) {
            try {
                const targetLang = langCode.toUpperCase();
                const fetch = (await import('node-fetch')).default;

                const resp = await fetch('https://api-free.deepl.com/v2/translate', {
                    method: 'POST',
                    headers: { 'Authorization': `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: [news.title, news.description || news.summary || ''],
                        target_lang: targetLang,
                    }),
                });

                if (resp.ok) {
                    const data = await resp.json();
                    title = data.translations?.[0]?.text || title;
                    description = data.translations?.[1]?.text || description;
                }
            } catch (e) {
                logger.warn(`[NewsButtonHandler] Erreur DeepL: ${e.message}`);
            }
        } else {
            description = `*Traduction vers ${langLabels[langCode] || langCode} non disponible sans clé API DeepL.*\n\n${description.substring(0, 400)}`;
        }
    }

    const embed = new EmbedBuilder()
        .setColor(SEVERITY_COLORS[news.severity] || 0x0099FF)
        .setTitle(`${SEVERITY_EMOJIS[news.severity] || '🌐'} ${title.substring(0, 256)}`)
        .setDescription(description.substring(0, 1800) || '*Aucun contenu disponible.*')
        .setURL(news.url)
        .setFooter({ text: `Traduction ${langLabels[langCode] || langCode} • WorldMonitor` });

    return interaction.update({
        content: `🌐 **Traduction en ${langLabels[langCode] || langCode}** :`,
        embeds: [embed],
        components: [],
    });
}

/**
 * Handler pour 📋 Résumé+ — résumé étendu
 */
async function handleExtendedSummary(interaction, newsId) {
    const news = await fetchNews(newsId);
    if (!news) {
        return interaction.reply({ content: '❌ Article introuvable.', ephemeral: true });
    }

    const catData = CATEGORIES[news.category] || {};
    const countryData = news.country ? COUNTRIES[news.country] : null;
    const isFr = true; // Toujours en FR pour le résumé étendu

    const title = news.titleFr || news.title || 'Sans titre';
    let fullContent = news.descriptionFr || news.description || news.summary || '';

    // Construire un résumé étendu structuré
    const lines = [];

    if (countryData) {
        lines.push(`📍 **Lieu :** ${countryData.emoji} ${countryData.name}`);
    }
    if (news.originalDate) {
        const d = new Date(news.originalDate);
        lines.push(`📅 **Date :** ${d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
    }
    if (news.sourceName) {
        const rel = news.sourceReliability || 7;
        const bar = '▓'.repeat(rel) + '░'.repeat(10 - rel);
        lines.push(`📡 **Source :** ${news.sourceName} \`${bar}\` ${rel}/10`);
    }
    if (news.reportCount > 1) {
        lines.push(`🔄 **Relayé par :** ${news.reportCount} sources`);
    }

    lines.push('');
    lines.push('**📋 Résumé détaillé :**');
    lines.push(fullContent.substring(0, 1200) || '*Aucun contenu disponible pour cet article.*');

    const embed = new EmbedBuilder()
        .setColor(SEVERITY_COLORS[news.severity] || 0x0099FF)
        .setTitle(`${SEVERITY_EMOJIS[news.severity] || '📋'} ${title.substring(0, 256)}`)
        .setDescription(lines.join('\n').substring(0, 4000))
        .setURL(news.url)
        .setFooter({ text: `${catData.icon || ''} ${catData.name?.fr || news.category || ''} • WorldMonitor` })
        .setTimestamp(news.originalDate || news.createdAt);

    return interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

/**
 * Handler pour 🔗 Source — liste des sources
 */
async function handleSources(interaction, newsId) {
    const news = await fetchNews(newsId);
    if (!news) {
        return interaction.reply({ content: '❌ Article introuvable.', ephemeral: true });
    }

    const sources = news.sources || [];
    const mainSource = news.sourceName || 'Source principale';
    const mainRel = news.sourceReliability || 7;
    const mainBar = '▓'.repeat(mainRel) + '░'.repeat(10 - mainRel);

    const lines = [
        `**🔗 Sources pour cet article :**\n`,
        `**Source principale :** ${mainSource}`,
        `\`${mainBar}\` Fiabilité : ${mainRel}/10`,
        news.url ? `[📄 Lire l'article complet](${news.url})` : '',
    ];

    if (sources.length > 0) {
        lines.push('\n**Sources supplémentaires :**');
        for (const src of sources.slice(0, 8)) {
            const rel = src.reliability || 7;
            const bar = '▓'.repeat(rel) + '░'.repeat(10 - rel);
            lines.push(`• **${src.name || 'Inconnue'}** \`${bar}\` ${rel}/10${src.url ? ` [↗](${src.url})` : ''}`);
        }
    }

    if (news.reportCount > 1) {
        lines.push(`\n*Cet événement a été rapporté par **${news.reportCount}** sources différentes.*`);
    }

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🔗 Sources de l\'article')
        .setDescription(lines.filter(Boolean).join('\n').substring(0, 4000))
        .setFooter({ text: 'WorldMonitor • Transparence des sources' });

    return interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── Dispatcher principal ─────────────────────────────────────────────────────

/**
 * Gère toutes les interactions bouton/select menu pour les news
 * @param {ButtonInteraction|StringSelectMenuInteraction} interaction
 */
async function handleNewsButton(interaction) {
    const { customId } = interaction;

    try {
        // ── Select menu de langue ──────────────────────────────────────────
        if (interaction.isStringSelectMenu() && customId.startsWith('news_lang_')) {
            await handleLanguageSelect(interaction);
            return;
        }

        if (!interaction.isButton()) return;

        // ── Boutons news_*_{newsId} ────────────────────────────────────────
        if (customId.startsWith('news_fav_')) {
            const newsId = extractNewsId(customId, 'fav');
            if (newsId) await handleFavorite(interaction, newsId);

        } else if (customId.startsWith('news_translate_')) {
            const newsId = extractNewsId(customId, 'translate');
            if (newsId) await handleTranslate(interaction, newsId);

        } else if (customId.startsWith('news_summary_')) {
            const newsId = extractNewsId(customId, 'summary');
            if (newsId) await handleExtendedSummary(interaction, newsId);

        } else if (customId.startsWith('news_sources_')) {
            const newsId = extractNewsId(customId, 'sources');
            if (newsId) await handleSources(interaction, newsId);
        }

    } catch (error) {
        logger.error(`[NewsButtonHandler] Erreur ${customId}: ${error.message}`);
        const reply = { content: `❌ Erreur : ${error.message}`, ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply).catch(() => { });
        } else {
            await interaction.reply(reply).catch(() => { });
        }
    }
}

module.exports = { handleNewsButton };
