/**
 * src/discord/CommandHandler.js
 * Chargement et gestion de toutes les commandes slash
 * Gère: exécution, autocomplete, composants interactifs
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

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

            // Déterminer quelle commande gère ce composant (par préfixe)
            const commandName = customId.split('_')[0]; // ex: 'setup_confirm' → 'setup'

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
            }
            return;
        }
    }
}

module.exports = new CommandHandler();
