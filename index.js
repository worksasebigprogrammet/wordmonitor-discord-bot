/**
 * index.js
 * Point d'entrée principal de WorldMonitor
 * Démarrage du bot Discord, connexion DB, enregistrement commandes, schedulers
 */

'use strict';

require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const logger = require('./src/utils/logger');
const { connectDatabase } = require('./src/database/connection');
const { scheduleCleanup } = require('./src/database/cleanup');
const { runHealthChecks } = require('./src/utils/healthCheck');
const { checkRecovery, recordStartup } = require('./src/utils/recoveryManager');
const commandHandler = require('./src/discord/CommandHandler');
const { registerCommands } = require('./src/discord/registerCommands');
const { runCollectionCycle, startScheduler, setProcessor } = require('./src/collectors/CollectorManager');
const { processArticles, setPublisher } = require('./src/processors/ArticleProcessor');
const { publishNews } = require('./src/discord/publisher/NewsPublisher');
const { startIndexScheduler } = require('./src/discord/publisher/IndexPublisher');
const { startBriefingScheduler } = require('./src/discord/publisher/BriefingPublisher');

// ─── Client Discord ────────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel],
    // Désactiver le cache des messages pour économiser la mémoire
    makeCache: require('discord.js').Options.cacheWithLimits({
        MessageManager: 0,
        ReactionManager: 0,
        GuildMemberManager: { maxSize: 50 },
    }),
});

// ─── Démarrage ────────────────────────────────────────────────────────────────
async function start() {
    logger.info('='.repeat(60));
    logger.info('   🌍 WorldMonitor - Starting up...');
    logger.info('='.repeat(60));

    try {
        // 1. Connexion MongoDB
        logger.info('[Boot] 🔌 Connexion à MongoDB...');
        await connectDatabase();

        // 2. Chargement des commandes
        logger.info('[Boot] 📝 Chargement des commandes...');
        commandHandler.loadCommands();

        // 3. Enregistrement des commandes (si DISCORD_CLIENT_ID présent)
        if (process.env.DISCORD_CLIENT_ID) {
            try {
                await registerCommands();
            } catch (e) {
                logger.warn(`[Boot] Commandes non enregistrées: ${e.message}`);
            }
        }

        // 4. Connexion Discord
        logger.info('[Boot] 🤖 Connexion à Discord...');
        await client.login(process.env.DISCORD_TOKEN);

    } catch (error) {
        logger.error(`[Boot] ❌ Erreur critique au démarrage: ${error.message}`);
        process.exit(1);
    }
}

// ─── Événements Discord ───────────────────────────────────────────────────────

client.once('ready', async () => {
    logger.info(`[Discord] ✅ Connecté en tant que ${client.user.tag}`);
    logger.info(`[Discord] 📡 Serveurs: ${client.guilds.cache.size}`);

    // Présence du bot
    client.user.setPresence({
        activities: [{ name: '🌍 Surveillance mondiale', type: 3 }], // Type 3 = Watching
        status: 'online',
    });

    // Injecter les dépendances (éviter les cycles)
    setProcessor(processArticles);
    setPublisher({ publishNews });

    // Health checks
    await runHealthChecks();

    // Recovery check
    const recovery = await checkRecovery();
    await recordStartup(recovery.needed);

    // Nettoyage automatique
    scheduleCleanup();

    // Schedulers
    startIndexScheduler(client);
    startBriefingScheduler();

    // Démarrer le collecteur principal
    if (recovery.needed) {
        logger.info('[Boot] 🔄 Mode recovery - Collecte immédiate...');
        await runCollectionCycle();
    }
    startScheduler();

    logger.info('='.repeat(60));
    logger.info('   🌍 WorldMonitor est opérationnel !');
    logger.info('='.repeat(60));
});

// Gestion des interactions (commandes + composants)
client.on('interactionCreate', async (interaction) => {
    await commandHandler.handleInteraction(interaction);
});

// Déconnexion / reconnexion
client.on('disconnect', () => {
    logger.warn('[Discord] ⚠️ Déconnecté de Discord');
});

client.on('error', (error) => {
    logger.error(`[Discord] Erreur client: ${error.message}`);
});

// ─── Gestion des erreurs non catchées ────────────────────────────────────────
process.on('uncaughtException', (error) => {
    logger.error(`[Process] ❌ Exception non catchée: ${error.message}\n${error.stack}`);
    // Ne pas quitter - PM2 gère les redémarrages si besoin
});

process.on('unhandledRejection', (reason) => {
    logger.error(`[Process] ❌ Promise rejection non gérée: ${reason}`);
});

process.on('SIGTERM', async () => {
    logger.info('[Process] 📴 Signal SIGTERM reçu - Arrêt propre...');
    client.destroy();
    const { closeDatabase } = require('./src/database/connection');
    await closeDatabase();
    process.exit(0);
});

// Lancement
start();
