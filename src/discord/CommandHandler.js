/**
 * src/discord/CommandHandler.js
 * Chargement et gestion de toutes les commandes slash
 * Gère: exécution, autocomplete, composants interactifs
 *
 * V2 AMÉLIORATIONS :
 * - Route les boutons alert_role_* vers alertRoleHandler
 * - Route les boutons news_fav_*, news_translate_*, news_summary_*, news_sources_* vers newsButtonHandler
 * - Route les select menus news_lang_* vers newsButtonHandler
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

// Handlers spécialisés
const { handleAlertRoleButton } = require('./handlers/alertRoleHandler');

// Chargement lazy du newsButtonHandler pour éviter les dépendances circulaires
let _newsButtonHandler = null;
function getNewsButtonHandler() {
    if (!_newsButtonHandler) {
        try {
            _newsButtonHandler = require('./handlers/newsButtonHandler');
        } catch {
            // Module non encore créé — no-op
            _newsButtonHandler = {};
        }
    }
    return _newsButtonHandler;
}

class CommandHandler {
    constructor() {
        this.commands = new Collection();
    }

    /**
     * Charge toutes les commandes depuis le dossier commands/
     */
    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));
                if (!command.data || !command.execute) {
                    logger.warn(`[CommandHandler] ${file} manque data ou execute`);
                    continue;
                }
                this.commands.set(command.data.name, command);
                logger.debug(`[CommandHandler] ✅ Commande chargée: /${command.data.name}`);
            } catch (error) {
                logger.error(`[CommandHandler] Erreur chargement ${file}: ${error.message}`);
            }
        }

        logger.info(`[CommandHandler] ${this.commands.size} commandes chargées`);
    }

    /**
     * Obtient toutes les commandes en format JSON pour l'enregistrement Discord API
     * @returns {Array}
     */
    getCommandsJSON() {
        return Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
    }

    /**
     * Gestionnaire principal d'interaction Discord
     * @param {object} interaction - Interaction Discord.js
     */
    async handleInteraction(interaction) {
        // ─── Commandes Slash ─────────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            const command = this.commands.get(interaction.commandName);
            if (!command) {
                logger.warn(`[CommandHandler] Commande inconnue: /${interaction.commandName}`);
                return interaction.reply({ content: '❌ Commande inconnue.', ephemeral: true });
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                logger.error(`[CommandHandler] Erreur /${interaction.commandName}: ${error.message}`);
                const reply = { content: `❌ Erreur lors de l'exécution de la commande: ${error.message}`, ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply).catch(() => { });
                } else {
                    await interaction.reply(reply).catch(() => { });
                }
            }
            return;
        }

        // ─── Autocomplete ─────────────────────────────────────────────────────
        if (interaction.isAutocomplete()) {
            const command = this.commands.get(interaction.commandName);
            if (command?.autocomplete) {
                try {
                    await command.autocomplete(interaction);
                } catch (error) {
                    logger.debug(`[CommandHandler] Autocomplete erreur: ${error.message}`);
                    await interaction.respond([]).catch(() => { });
                }
            }
            return;
        }

        // ─── Composants interactifs (boutons, menus) ──────────────────────────
        if (interaction.isButton() || interaction.isStringSelectMenu()) {
            const { customId } = interaction;

            // ── Boutons d'auto-assignation de rôles d'alerte ──────────────────
            // Format: alert_role_{roleName}
            // Créés dans setup.js dans publishRoleAssignEmbed()
            if (customId.startsWith('alert_role_')) {
                try {
                    await handleAlertRoleButton(interaction);
                } catch (error) {
                    logger.error(`[CommandHandler] Erreur bouton rôle ${customId}: ${error.message}`);
                    const reply = { content: '❌ Erreur lors de l\'assignation du rôle.', ephemeral: true };
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(reply).catch(() => { });
                    } else {
                        await interaction.reply(reply).catch(() => { });
                    }
                }
                return;
            }

            // ── Boutons interactifs sur les news ───────────────────────────────
            // Format: news_fav_{newsId}, news_translate_{newsId}, news_summary_{newsId}, news_sources_{newsId}
            // Format select: news_lang_{newsId}
            if (customId.startsWith('news_')) {
                try {
                    const nbh = getNewsButtonHandler();
                    if (nbh.handleNewsButton) {
                        await nbh.handleNewsButton(interaction);
                    }
                } catch (error) {
                    logger.error(`[CommandHandler] Erreur bouton news ${customId}: ${error.message}`);
                    const reply = { content: '❌ Erreur lors de l\'interaction.', ephemeral: true };
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(reply).catch(() => { });
                    } else {
                        await interaction.reply(reply).catch(() => { });
                    }
                }
                return;
            }

            // ── Composants liés à une commande slash (par préfixe) ─────────────
            // Convention : le premier segment du customId = nom de la commande
            // Ex: 'setup_confirm_beginner' → commande 'setup'
            //     'panel_toggle_economy' → commande 'panel'
            const commandName = customId.split('_')[0];
            const command = this.commands.get(commandName);
            if (command?.handleComponent) {
                try {
                    await command.handleComponent(interaction);
                } catch (error) {
                    logger.error(`[CommandHandler] Erreur composant ${customId}: ${error.message}`);
                    const reply = { content: '❌ Erreur lors de l\'interaction.', ephemeral: true };
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(reply).catch(() => { });
                    } else {
                        await interaction.reply(reply).catch(() => { });
                    }
                }
            } else {
                logger.debug(`[CommandHandler] Aucun handler pour composant: ${customId}`);
            }
            return;
        }
    }
}

module.exports = new CommandHandler();
