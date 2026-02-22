/**
 * src/discord/commands/setup.js
 * Commande /setup — Configuration initiale interactive du bot WorldMonitor
 *
 * BUG 1 CORRIGÉ :
 * - Crée une catégorie Discord par continent activé
 * - Crée les channels pays dans chaque catégorie continent
 * - Crée les channels spéciaux par continent (index, carte, troupes, économie)
 * - Crée une catégorie "⚙️ Configuration" séparée
 * - Crée tous les rôles d'alerte (ALERT_ROLES)
 * - Poste un embed d'auto-assignation dans #alert-config
 * - Anti-doublon : détecte une config existante et propose un reset
 * - Sauvegarde TOUS les IDs (channels, webhooks, rôles) dans ServerConfig
 */

'use strict';

const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits,
} = require('discord.js');
const ServerConfig = require('../../database/models/ServerConfig');
const { PRESETS, getPreset, listPresetsForMenu } = require('../../config/presets');
const { COUNTRIES } = require('../../config/countries');
const {
    CHANNEL_STRUCTURE,
    ALERT_ROLES,
    CONTINENT_EMOJIS,
    CONTINENT_NAMES,
} = require('../../config/constants');
const logger = require('../../utils/logger');

// ─── Données de la commande ───────────────────────────────────────────────────
const command = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('⚙️ Configuration initiale de WorldMonitor pour ce serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// ─── Utilitaires ──────────────────────────────────────────────────────────────

/**
 * Slugifie un nom pour en faire un nom de channel Discord valide
 * @param {string} str
 * @returns {string}
 */
function toChannelName(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')   // supprimer les accents
        .replace(/[^a-z0-9\s-]/g, '')      // garder lettres, chiffres, tirets
        .replace(/\s+/g, '-')              // espaces → tirets
        .replace(/-{2,}/g, '-')            // tirets multiples → un seul
        .substring(0, 100);                // limite Discord
}

/**
 * Crée un channel texte dans une catégorie existante
 * @param {Guild} guild
 * @param {string} name - Nom du channel
 * @param {CategoryChannel} category - Catégorie Discord parent
 * @param {string} topic - Description du channel
 * @returns {Promise<TextChannel>}
 */
async function createChannel(guild, name, category, topic = '') {
    return guild.channels.create({
        name: toChannelName(name),
        type: ChannelType.GuildText,
        parent: category.id,
        topic: topic.substring(0, 1024),
        permissionOverwrites: [
            {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages],
            },
        ],
    });
}

/**
 * Crée un webhook dans un channel pour les publications WorldMonitor
 * @param {TextChannel} channel
 * @param {string} name
 * @returns {Promise<string>} URL du webhook
 */
async function createWebhook(channel, name) {
    try {
        const wh = await channel.createWebhook({ name, avatar: null });
        return wh.url;
    } catch {
        return null;
    }
}

/**
 * Supprime les channels et rôles WorldMonitor existants (pour un re-setup propre)
 * @param {Guild} guild
 * @param {ServerConfig} config
 */
async function cleanupExistingSetup(guild, config) {
    const deletionQueue = [];

    // Supprimer tous les channels WorldMonitor sauvegardés en config
    const allChannelIds = [
        ...(config.channels?.newsChannels || []),
        ...(config.channels?.indexChannels || []),
        ...(config.channels?.briefingChannels || []),
        ...(config.channels?.alertChannels || []),
        config.channels?.panelChannelId,
        config.channels?.configChannelId,
        config.channels?.logsChannelId,
        config.channels?.statusChannelId,
        ...(config.channels?.continentChannels?.map(c => c.channelId) || []),
        ...(config.channels?.countryChannels?.map(c => c.channelId) || []),
    ].filter(Boolean);

    for (const id of allChannelIds) {
        const ch = guild.channels.cache.get(id);
        if (ch) deletionQueue.push(ch.delete().catch(() => { }));
    }

    // Supprimer les catégories WorldMonitor
    const wmCategories = guild.channels.cache.filter(
        ch => ch.type === ChannelType.GuildCategory &&
            (ch.name.includes('WorldMonitor') || ch.name.includes('Configuration') ||
                Object.values(CONTINENT_NAMES).some(n => ch.name.includes(n.fr) || ch.name.includes(n.en)))
    );
    for (const cat of wmCategories.values()) {
        deletionQueue.push(cat.delete().catch(() => { }));
    }

    // Supprimer les rôles WorldMonitor
    const roleIds = (config.roles || []).map(r => r.roleId).filter(Boolean);
    for (const id of roleIds) {
        const role = guild.roles.cache.get(id);
        if (role) deletionQueue.push(role.delete().catch(() => { }));
    }

    await Promise.allSettled(deletionQueue);
}

// ─── Handler principal ────────────────────────────────────────────────────────

module.exports = {
    data: command,

    /**
     * Exécution de /setup
     */
    async execute(interaction) {
        // Vérifier si un setup existe déjà
        const existing = await ServerConfig.findOne({ guildId: interaction.guildId });

        if (existing) {
            // Proposer un reset ou annuler
            const embed = new EmbedBuilder()
                .setColor(0xFF8C00)
                .setTitle('⚠️ Configuration existante détectée')
                .setDescription(
                    `Ce serveur est déjà configuré avec le profil **${existing.preset}**.\n\n` +
                    '**Continuer va supprimer TOUTE la configuration actuelle** (channels, rôles, webhooks) ' +
                    'et en créer une nouvelle.\n\nÊtes-vous sûr de vouloir re-configurer le bot ?'
                )
                .setFooter({ text: 'Cette action est irréversible' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('setup_reset_confirm')
                    .setLabel('🔄 Oui, re-configurer')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('setup_cancel')
                    .setLabel('❌ Annuler')
                    .setStyle(ButtonStyle.Secondary),
            );

            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        // Première configuration — afficher le menu de sélection de preset
        await showPresetMenu(interaction);
    },

    /**
     * Gestionnaire des composants (boutons + menus)
     */
    async handleComponent(interaction) {
        const { customId } = interaction;

        if (customId === 'setup_cancel') {
            return interaction.update({
                embeds: [new EmbedBuilder().setColor(0x888888).setDescription('❌ Configuration annulée.')],
                components: [],
            });
        }

        if (customId === 'setup_reset_confirm') {
            // Re-setup: proposer le menu preset
            await interaction.update({ components: [] });
            return showPresetMenu(interaction, true);
        }

        if (customId === 'setup_preset_select') {
            const presetId = interaction.values[0];
            return startSetup(interaction, presetId, false);
        }

        if (customId.startsWith('setup_confirm_')) {
            const presetId = customId.replace('setup_confirm_', '');
            return handleSetupConfirm(interaction, presetId);
        }
    },
};

// ─── Fonctions de flux ────────────────────────────────────────────────────────

/**
 * Affiche le menu de sélection de preset
 */
async function showPresetMenu(interaction, isReset = false) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🌍 WorldMonitor — Configuration')
        .setDescription(
            isReset
                ? '🔄 **Reset en cours** — Choisissez votre nouveau profil :\n'
                : 'Bienvenue ! Choisissez le profil qui correspond à votre serveur :\n'
        )
        .addFields(
            { name: '🟢 Débutant', value: 'Breaking news critiques uniquement. Idéal pour commencer.', inline: false },
            { name: '🟡 Moyen', value: 'Conflits + économie, channels organisés par continent.', inline: false },
            { name: '🟠 Expérimenté', value: 'Tout + top 3 pays/continent. Pour les passionnés.', inline: false },
            { name: '🔴 Expert', value: 'OSINT militaire + 6 pays/continent. Pour analystes.', inline: false },
        );

    const menu = new StringSelectMenuBuilder()
        .setCustomId('setup_preset_select')
        .setPlaceholder('Sélectionnez votre profil...')
        .addOptions(listPresetsForMenu());

    const row = new ActionRowBuilder().addComponents(menu);

    const method = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
    await interaction[method]({ embeds: [embed], components: [row], ephemeral: true });
}

/**
 * Affiche le résumé du preset sélectionné et demande confirmation
 */
async function startSetup(interaction, presetId, isReset) {
    const preset = getPreset(presetId);

    const continentList = preset.continents.length > 0
        ? preset.continents.map(c => `${CONTINENT_EMOJIS[c]} ${CONTINENT_NAMES[c]?.fr || c}`).join(', ')
        : 'Aucun (global uniquement)';

    const countryList = Object.values(preset.defaultCountries || {}).flat().map(code => {
        const c = COUNTRIES[code];
        return c ? `${c.emoji} ${c.name}` : code;
    }).join(', ') || 'Aucun';

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${preset.emoji} Profil sélectionné : ${preset.name.fr}`)
        .setDescription(preset.description.fr)
        .addFields(
            { name: '🌍 Continents', value: continentList, inline: false },
            { name: '🗺️ Pays suivis', value: countryList.substring(0, 1000) || 'Aucun', inline: false },
            { name: '📋 Catégories', value: preset.categories.length + ' catégories activées', inline: true },
            { name: '⏰ Briefing', value: preset.briefingInterval, inline: true },
            { name: '⚡ Niveaux alerte', value: preset.alertLevels.join(', '), inline: true },
        )
        .setFooter({ text: 'La création des channels et des rôles peut prendre 30 à 60 secondes...' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`setup_confirm_${presetId}`)
            .setLabel(`✅ Configurer avec ${preset.name.fr}`)
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('setup_preset_select')
            .setLabel('◀️ Retour')
            .setStyle(ButtonStyle.Secondary),
    );

    await interaction.update({ embeds: [embed], components: [row] });
}

/**
 * Effectue la configuration complète du serveur (le gros du travail)
 * Crée les catégories, channels, rôles, webhooks et sauvegarde en base
 */
async function handleSetupConfirm(interaction, presetId) {
    await interaction.deferUpdate();

    const guild = interaction.guild;
    const preset = getPreset(presetId);

    // ── Afficher la progression ──────────────────────────────────────────────
    const progressEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('⚙️ Configuration en cours...')
        .setDescription('> 🔄 Initialisation...')
        .setFooter({ text: 'Merci de patienter, cela peut prendre jusqu\'à 60 secondes.' });

    await interaction.editReply({ embeds: [progressEmbed], components: [] });

    const update = async (line) => {
        progressEmbed.setDescription(line);
        await interaction.editReply({ embeds: [progressEmbed] }).catch(() => { });
    };

    try {
        // ── Cleanup si re-setup ──────────────────────────────────────────────
        const existing = await ServerConfig.findOne({ guildId: guild.id });
        if (existing) {
            await update('> 🗑️ Suppression de l\'ancienne configuration...');
            await cleanupExistingSetup(guild, existing);
            await ServerConfig.deleteOne({ guildId: guild.id });
        }

        // ── Objets de stockage des IDs créés ────────────────────────────────
        const createdChannels = {};      // { 'breaking-news': TextChannel, ... }
        const createdWebhooks = {};      // { 'breaking-news': 'https://...', ... }
        const createdContinent = {};     // { 'europe': { indexChannel, mapChannel, ... } }
        const createdCountries = [];     // [{ code: 'FR', channelId: '...', ... }]
        const createdRoles = [];         // [{ name: 'Alerte-Critique', roleId: '...', emoji: '...' }]

        // ═══════════════════════════════════════════════════════════════════
        // ÉTAPE 1 : Catégorie principale WorldMonitor + channels globaux
        // ═══════════════════════════════════════════════════════════════════
        await update('> 📁 Création de la catégorie principale WorldMonitor...');

        const mainCategory = await guild.channels.create({
            name: '🌍 WorldMonitor',
            type: ChannelType.GuildCategory,
        });

        // Channels globaux obligatoires
        const globalChannelDefs = [
            { key: 'breaking-news', topic: '🔴 Alertes breaking news mondiales en temps réel' },
            { key: 'index-global', topic: '📊 Index de tension mondiale — Mis à jour toutes les 10 min' },
        ];

        // Channels globaux conditionnels selon preset
        if (preset.briefingEnabled) {
            globalChannelDefs.push({ key: 'daily-briefing', topic: '📋 Résumés périodiques de l\'actualité mondiale' });
        }
        if (preset.mapEnabled) {
            globalChannelDefs.push({ key: 'carte-mondiale', topic: '🗺️ Carte mondiale des tensions' });
        }
        if (preset.militaryTracking) {
            globalChannelDefs.push({ key: 'mouvements-militaires', topic: '🎖️ Mouvements militaires et OSINT' });
        }
        if (preset.economyTracking) {
            globalChannelDefs.push({ key: 'economie-mondiale', topic: '💰 Économie mondiale et sanctions' });
        }
        if (preset.categories.includes('nuclear')) {
            globalChannelDefs.push({ key: 'nucleaire', topic: '⚛️ Actualité nucléaire' });
        }
        if (preset.maritimeTracking) {
            globalChannelDefs.push({ key: 'maritime', topic: '🚢 Sécurité maritime' });
        }
        if (preset.categories.includes('natural_disasters')) {
            globalChannelDefs.push({ key: 'catastrophes-naturelles', topic: '🌊 Catastrophes naturelles' });
        }
        if (preset.categories.includes('outages')) {
            globalChannelDefs.push({ key: 'pannes-blackouts', topic: '📡 Pannes internet et blackouts' });
        }

        for (const def of globalChannelDefs) {
            await update(`> 📌 Création du channel #${def.key}...`);
            const ch = await createChannel(guild, def.key, mainCategory, def.topic);
            createdChannels[def.key] = ch;
            const wh = await createWebhook(ch, `🌍 WorldMonitor`);
            if (wh) createdWebhooks[def.key] = wh;
            await delay(500); // éviter rate limit
        }

        // ═══════════════════════════════════════════════════════════════════
        // ÉTAPE 2 : Catégories par continent
        // ═══════════════════════════════════════════════════════════════════
        for (const continent of (preset.continents || [])) {
            const contName = CONTINENT_NAMES[continent];
            const contEmoji = CONTINENT_EMOJIS[continent] || '🌍';
            const contNameFr = contName?.fr || continent;

            await update(`> 📁 Catégorie ${contEmoji} ${contNameFr}...`);

            const contCategory = await guild.channels.create({
                name: `${contEmoji} ${contNameFr}`,
                type: ChannelType.GuildCategory,
            });

            createdContinent[continent] = { categoryId: contCategory.id };

            // Channel index du continent (toujours)
            const indexCh = await createChannel(
                guild,
                `index-${toChannelName(contNameFr)}`,
                contCategory,
                `📊 Index de tension — ${contNameFr}`
            );
            createdContinent[continent].indexChannelId = indexCh.id;
            await delay(400);

            // Carte du continent (si activé)
            if (preset.continentMaps) {
                const mapCh = await createChannel(
                    guild,
                    `carte-${toChannelName(contNameFr)}`,
                    contCategory,
                    `🗺️ Carte des tensions — ${contNameFr}`
                );
                createdContinent[continent].mapChannelId = mapCh.id;
                await delay(400);
            }

            // Mouvements de troupes du continent (si activé)
            if (preset.continentMilitaryChannels) {
                const slug = toChannelName(contNameFr);
                const milCh = await createChannel(
                    guild,
                    `troupes-${slug.substring(0, 20)}`,
                    contCategory,
                    `🎖️ Mouvements militaires — ${contNameFr}`
                );
                createdContinent[continent].militaryChannelId = milCh.id;
                await delay(400);
            }

            // Économie du continent (si activé)
            if (preset.continentEconomyChannels) {
                const slug = toChannelName(contNameFr);
                const ecoCh = await createChannel(
                    guild,
                    `economie-${slug.substring(0, 20)}`,
                    contCategory,
                    `💰 Économie — ${contNameFr}`
                );
                createdContinent[continent].economyChannelId = ecoCh.id;
                await delay(400);
            }

            // Channels pays pour ce continent
            const continentCountries = preset.defaultCountries?.[continent] || [];
            for (const code of continentCountries) {
                const country = COUNTRIES[code];
                if (!country) continue;

                const countrySlug = toChannelName(country.name);
                await update(`> ${country.emoji} Channel #${countrySlug}...`);

                const ch = await createChannel(
                    guild,
                    countrySlug,
                    contCategory,
                    `${country.emoji} Actualité — ${country.name}`
                );
                const wh = await createWebhook(ch, `${country.emoji} WorldMonitor ${country.name}`);

                createdCountries.push({
                    code,
                    channelId: ch.id,
                    webhookUrl: wh || null,
                    continent,
                });
                await delay(500);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // ÉTAPE 3 : Catégorie Configuration
        // ═══════════════════════════════════════════════════════════════════
        await update('> ⚙️ Création de la catégorie Configuration...');

        const configCategory = await guild.channels.create({
            name: '⚙️ Configuration',
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
            ],
        });

        const configChannelDefs = [
            { key: 'panel', topic: '⚙️ Panel de configuration WorldMonitor (admins uniquement)' },
            { key: 'alert-config', topic: '🔔 Configurer vos alertes — Choisissez vos rôles de notification' },
            { key: 'bot-logs', topic: '📝 Logs d\'activité internes du bot WorldMonitor' },
            { key: 'bot-status', topic: '🤖 Statut et santé du bot WorldMonitor' },
        ];

        for (const def of configChannelDefs) {
            const ch = await createChannel(guild, def.key, configCategory, def.topic);
            createdChannels[def.key] = ch;
            await delay(400);
        }

        // ═══════════════════════════════════════════════════════════════════
        // ÉTAPE 4 : Rôles d'alerte
        // ═══════════════════════════════════════════════════════════════════
        await update('> 🎭 Création des rôles d\'alerte...');

        for (const roleDef of ALERT_ROLES) {
            try {
                const role = await guild.roles.create({
                    name: roleDef.name,
                    color: roleDef.color,
                    hoist: roleDef.hoist,
                    mentionable: roleDef.mentionable,
                    reason: 'WorldMonitor Setup',
                });
                createdRoles.push({
                    name: roleDef.name,
                    roleId: role.id,
                    description: roleDef.description,
                });
                await delay(300);
            } catch (err) {
                logger.warn(`[Setup] Rôle ${roleDef.name} non créé: ${err.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // ÉTAPE 5 : Embed d'auto-assignation des rôles dans #alert-config
        // ═══════════════════════════════════════════════════════════════════
        await update('> 🔔 Publication de l\'embed d\'assignation des rôles...');

        const alertConfigChannel = createdChannels['alert-config'];
        if (alertConfigChannel && createdRoles.length > 0) {
            await publishRoleAssignEmbed(alertConfigChannel, createdRoles, guild);
        }

        // ═══════════════════════════════════════════════════════════════════
        // ÉTAPE 6 : Sauvegarde en base de données
        // ═══════════════════════════════════════════════════════════════════
        await update('> 💾 Sauvegarde de la configuration...');

        const configData = {
            guildId: guild.id,
            preset: presetId,
            language: 'fr',
            monitoredRegions: preset.continents,
            enabledCategories: preset.categories,
            alertLevels: preset.alertLevels,
            briefingInterval: preset.briefingInterval,
            briefingEnabled: preset.briefingEnabled,
            scrapeInterval: preset.scrapeInterval,
            maxNewsPerHour: preset.maxNewsPerHour,

            // Channels globaux
            channels: {
                newsChannelId: createdChannels['breaking-news']?.id,
                indexChannelId: createdChannels['index-global']?.id,
                briefingChannelId: createdChannels['daily-briefing']?.id,
                mapChannelId: createdChannels['carte-mondiale']?.id,
                panelChannelId: createdChannels['panel']?.id,
                configChannelId: createdChannels['alert-config']?.id,
                logsChannelId: createdChannels['bot-logs']?.id,
                statusChannelId: createdChannels['bot-status']?.id,
                militaryChannelId: createdChannels['mouvements-militaires']?.id,
                economyChannelId: createdChannels['economie-mondiale']?.id,
                nuclearChannelId: createdChannels['nucleaire']?.id,
                maritimeChannelId: createdChannels['maritime']?.id,
                disastersChannelId: createdChannels['catastrophes-naturelles']?.id,
                outagesChannelId: createdChannels['pannes-blackouts']?.id,
                // Channels par continent
                continentChannels: Object.entries(createdContinent).map(([key, val]) => ({
                    continent: key,
                    ...val,
                })),
                // Channels par pays — convention de nommage: country-{code_iso_lowercase}
                countryChannels: createdCountries.map(c => ({
                    code: c.code,
                    key: `country-${c.code.toLowerCase()}`,   // BUG 6 FIX: clé standardisée
                    channelId: c.channelId,
                    webhookUrl: c.webhookUrl,
                    continent: c.continent,
                })),
            },

            // Webhooks
            webhooks: {
                breakingNewsUrl: createdWebhooks['breaking-news'] || null,
                indexUrl: createdWebhooks['index-global'] || null,
                briefingUrl: createdWebhooks['daily-briefing'] || null,
            },

            // Rôles
            roles: createdRoles,
        };

        await ServerConfig.create(configData);

        // ── Embed de fin ─────────────────────────────────────────────────────
        const channelCount = Object.keys(createdChannels).length + createdCountries.length +
            Object.values(createdContinent).reduce((acc, c) => acc + Object.keys(c).filter(k => k.includes('Id')).length, 0);

        const successEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle(`✅ WorldMonitor configuré avec le profil ${preset.emoji} ${preset.name.fr}`)
            .setDescription('Le bot est maintenant opérationnel sur ce serveur !')
            .addFields(
                { name: '📁 Channels créés', value: `${channelCount}`, inline: true },
                { name: '🎭 Rôles créés', value: `${createdRoles.length}`, inline: true },
                { name: '🌍 Continents', value: `${preset.continents.length}`, inline: true },
                { name: '🗺️ Pays suivis', value: `${createdCountries.length}`, inline: true },
                { name: '⏰ Briefing', value: preset.briefingInterval, inline: true },
                { name: '⚡ Alertes', value: preset.alertLevels.join(', '), inline: true },
            )
            .addFields({
                name: '📋 Prochaines étapes',
                value: [
                    `• Utilisez \`/panel\` pour voir le tableau de bord`,
                    `• Utilisez \`/monitor add\` pour ajouter des pays`,
                    `• Configurez vos alertes dans <#${createdChannels['alert-config']?.id || 'alert-config'}>`,
                ].join('\n'),
            })
            .setFooter({ text: 'Les données commenceront à arriver dans les prochaines minutes.' })
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed], components: [] });

        logger.info(`[Setup] ✅ Serveur ${guild.name} (${guild.id}) configuré avec preset=${presetId}, ${channelCount} channels, ${createdRoles.length} rôles`);

    } catch (error) {
        logger.error(`[Setup] Erreur: ${error.message}\n${error.stack}`);
        const errEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Erreur lors de la configuration')
            .setDescription(
                `Une erreur est survenue : \`${error.message}\`\n\n` +
                'Vérifiez que le bot a les permissions **Administrateur** sur ce serveur.\n' +
                'Vous pouvez relancer \`/setup\` après avoir accordé les permissions.'
            );
        await interaction.editReply({ embeds: [errEmbed], components: [] }).catch(() => { });
    }
}

/**
 * Publie l'embed d'auto-assignation des rôles dans #alert-config
 */
async function publishRoleAssignEmbed(channel, roles, guild) {
    try {
        // Rendre le channel lisible par tous mais en lecture seule
        await channel.permissionOverwrites.edit(guild.id, {
            ViewChannel: true,
            SendMessages: false,
            ReadMessageHistory: true,
            AddReactions: true,
            UseApplicationCommands: true,
        });

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🔔 Configurez vos alertes WorldMonitor')
            .setDescription(
                'Recevez des **notifications personnalisées** en vous assignant les rôles ci-dessous.\n' +
                'Cliquez sur le bouton correspondant pour activer/désactiver un rôle.\n\n' +
                '> Les rôles d\'alerte vous permettent d\'être **mentionné** lors d\'événements critiques.'
            )
            .addFields(
                roles
                    .filter(r => r.name !== 'WorldMonitor-Admin')
                    .map(r => ({
                        name: r.description || r.name,
                        value: `<@&${r.roleId}>`,
                        inline: true,
                    }))
            )
            .setFooter({ text: 'WorldMonitor — Système d\'alertes | Cliquez sur un rôle pour vous abonner' });

        // Créer des boutons pour les rôles principaux (max 5 par rangée, max 25 total)
        const assignableRoles = roles.filter(r => r.name !== 'WorldMonitor-Admin').slice(0, 20);
        const rows = [];
        const btnsPerRow = 5;

        for (let i = 0; i < assignableRoles.length; i += btnsPerRow) {
            const chunk = assignableRoles.slice(i, i + btnsPerRow);
            const row = new ActionRowBuilder().addComponents(
                chunk.map(r => {
                    const emoji = r.description?.split(' ')[0] || '🔔';
                    const shortName = r.name.replace('Alerte-', '').substring(0, 20);
                    return new ButtonBuilder()
                        .setCustomId(`role_toggle_${r.roleId}`)
                        .setLabel(shortName)
                        .setEmoji(emoji)
                        .setStyle(ButtonStyle.Secondary);
                })
            );
            rows.push(row);
        }

        await channel.send({ embeds: [embed], components: rows });
    } catch (err) {
        logger.warn(`[Setup] Embed assignation rôles non publié: ${err.message}`);
    }
}

/**
 * Petite pause pour éviter les rate limits Discord
 * @param {number} ms
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
