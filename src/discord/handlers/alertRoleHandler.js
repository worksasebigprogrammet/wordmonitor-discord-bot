/**
 * src/discord/handlers/alertRoleHandler.js
 * Handler des boutons d'auto-assignation de rôles dans #alert-config
 *
 * CustomId format : alert_role_{roleName}
 * Exemple : alert_role_critique, alert_role_europe, alert_role_moyen-orient
 *
 * Logique :
 * 1. Parse le nom du rôle depuis le customId
 * 2. Cherche le roleId dans ServerConfig.roles (Map name → id)
 * 3. Toggle le rôle sur le membre (ajoute ou retire)
 * 4. Réponse éphémère
 */

'use strict';

const { PermissionFlagsBits } = require('discord.js');
const ServerConfig = require('../../database/models/ServerConfig');
const logger = require('../../utils/logger');

/**
 * Convertit un slug de customId en nom de rôle Discord
 * Ex: "critique" → "Alerte-Critique", "moyen-orient" → "Alerte-Moyen-Orient"
 * @param {string} slug
 * @returns {string}
 */
function slugToRoleName(slug) {
    // Capitalize each word separated by hyphens
    return 'Alerte-' + slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('-');
}

/**
 * Gère un clic sur un bouton alert_role_*
 * @param {ButtonInteraction} interaction
 */
async function handleAlertRoleButton(interaction) {
    // Extraire le slug du rôle depuis le customId
    // Format : alert_role_{slug} → ex: alert_role_critique, alert_role_moyen-orient
    const rawSlug = interaction.customId.replace('alert_role_', '');

    try {
        // Charger la config du serveur
        const serverConfig = await ServerConfig.findOne({ guildId: interaction.guildId });
        if (!serverConfig) {
            return interaction.reply({
                content: '❌ Ce serveur n\'est pas configuré. Veuillez utiliser `/setup` d\'abord.',
                ephemeral: true,
            });
        }

        // Chercher l'ID du rôle dans la Map roles
        // La Map contient des entrées comme "Alerte-Critique" → "123456789"
        let roleId = null;
        let roleName = null;

        if (serverConfig.roles && serverConfig.roles instanceof Map) {
            // Essai 1 : slug direct → nom Alerte-{Slug}
            const candidateName = slugToRoleName(rawSlug);

            if (serverConfig.roles.has(candidateName)) {
                roleId = serverConfig.roles.get(candidateName);
                roleName = candidateName;
            } else {
                // Essai 2 : recherche insensible à la casse / partielle
                for (const [name, id] of serverConfig.roles.entries()) {
                    const nameLower = name.toLowerCase().replace('alerte-', '').replace('-', '');
                    const slugLower = rawSlug.toLowerCase().replace('-', '');
                    if (nameLower === slugLower || name.toLowerCase().includes(rawSlug.toLowerCase())) {
                        roleId = id;
                        roleName = name;
                        break;
                    }
                }
            }
        }

        if (!roleId) {
            logger.warn(`[AlertRoleHandler] Rôle introuvable pour slug "${rawSlug}" dans guild ${interaction.guildId}`);
            return interaction.reply({
                content: `❌ Le rôle correspondant n'a pas été trouvé. Essayez de relancer \`/setup\`.`,
                ephemeral: true,
            });
        }

        // Vérifier que le bot peut gérer les rôles
        const botMember = interaction.guild.members.me;
        if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: '❌ Je n\'ai pas la permission de gérer les rôles sur ce serveur.',
                ephemeral: true,
            });
        }

        // Vérifier que le rôle existe toujours
        const role = interaction.guild.roles.cache.get(roleId)
            || await interaction.guild.roles.fetch(roleId).catch(() => null);

        if (!role) {
            return interaction.reply({
                content: `❌ Le rôle **${roleName}** n'existe plus. Relancez \`/setup\` pour le recréer.`,
                ephemeral: true,
            });
        }

        // Vérifier que le rôle est dans la hiérarchie du bot
        if (role.position >= botMember.roles.highest.position) {
            return interaction.reply({
                content: `❌ Je ne peux pas attribuer le rôle **${roleName}** car il est plus haut que mon rôle dans la hiérarchie.`,
                ephemeral: true,
            });
        }

        const member = interaction.member;
        const hasRole = member.roles.cache.has(roleId);

        if (hasRole) {
            // Retirer le rôle
            await member.roles.remove(roleId, 'WorldMonitor auto-désassignation');
            logger.debug(`[AlertRoleHandler] Rôle "${roleName}" retiré à ${member.user.tag} dans ${interaction.guildId}`);
            return interaction.reply({
                content: `✅ Rôle **@${roleName}** retiré — vous ne recevrez plus ces alertes.`,
                ephemeral: true,
            });
        } else {
            // Ajouter le rôle
            await member.roles.add(roleId, 'WorldMonitor auto-assignation');
            logger.debug(`[AlertRoleHandler] Rôle "${roleName}" ajouté à ${member.user.tag} dans ${interaction.guildId}`);
            return interaction.reply({
                content: `✅ Rôle **@${roleName}** ajouté — vous recevrez désormais ces alertes !`,
                ephemeral: true,
            });
        }
    } catch (error) {
        logger.error(`[AlertRoleHandler] Erreur pour "${rawSlug}" dans ${interaction.guildId}: ${error.message}`);
        const reply = { content: `❌ Erreur lors de l'assignation du rôle: ${error.message}`, ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply).catch(() => { });
        } else {
            await interaction.reply(reply).catch(() => { });
        }
    }
}

module.exports = { handleAlertRoleButton };
