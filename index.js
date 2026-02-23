/**
 * index.js
 * Point d'entrée principal de WorldMonitor
 * Démarrage du bot Discord, connexion DB, enregistrement commandes, schedulers
 *
 * V2 FIX :
 * - registerCommands() appelé dans client.once('ready') avec le client → client.application.id disponible
 * - Import CollectorManager via { start, stop, getStats, getHotZones } uniquement
 * - setProcessor / runCollectionCycle supprimés (gérés en interne par CollectorManager)
 */

'use strict';

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Options } = require('discord.js');
const logger = require('./src/utils/logger');
const { connectDatabase } = require('./src/database/connection');
const { scheduleCleanup } = require('./src/database/cleanup');
const { runHealthChecks } = require('./src/utils/healthCheck');
const { checkRecovery, recordStartup } = require('./src/utils/recoveryManager');
const commandHandler = require('./src/discord/CommandHandler');
const { registerCommands } = require('./src/discord/registerCommands');
// CollectorManager V2 : exporte { start, stop, getStats, getHotZones }
const { start: startCollector, stop: stopCollector } = require('./src/collectors/CollectorManager');
const { setPublisher } = require('./src/processors/ArticleProcessor');
const { publishNews, setClient } = require('./src/discord/publisher/NewsPublisher');
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
    // Limiter le cache pour économiser la mémoire (Pterodactyl)
    makeCache: Options.cacheWithLimits({
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
        // 1. Connexion MongoDB Atlas
        logger.info('[Boot] 🔌 Connexion à MongoDB...');
        await connectDatabase();

        // 2. Chargement des commandes en mémoire
        logger.info('[Boot] 📝 Chargement des commandes...');
        commandHandler.loadCommands();

        // 3. Connexion Discord (les commandes seront enregistrées dans ready)
        logger.info('[Boot] 🤖 Connexion à Discord...');
        await client.login(process.env.DISCORD_TOKEN);

    } catch (error) {
        logger.error(`[Boot] ❌ Erreur critique au démarrage: ${error.message}`);
        process.exit(1);
    }
}

// ─── Événement ready ─────────────────────────────────────────────────────────
client.once('ready', async () => {
    logger.info(`[Discord] ✅ Connecté en tant que ${client.user.tag}`);
    logger.info(`[Discord] 📡 Serveurs: ${client.guilds.cache.size}`);
    logger.info(`[Discord] 🆔 Application ID: ${client.application?.id}`);

    // Présence du bot
    client.user.setPresence({
        activities: [{ name: '🌍 Surveillance mondiale', type: 3 }], // Watching
        status: 'online',
    });

    // ── 1. Enregistrement automatique des commandes slash ─────────────────
    // Nécessite que le client soit connecté pour avoir client.application.id
    logger.info('[Boot] 📝 Enregistrement des commandes slash...');
    try {
        await registerCommands(client);
    } catch (e) {
        logger.warn(`[Boot] ⚠️ Commandes non enregistrées: ${e.message}`);
    }

    // ── 2. Injection des dépendances ──────────────────────────────────────
    // Publisher Discord pour que ArticleProcessor publie les news
    setPublisher({ publishNews });
    // Client Discord pour publication directe dans les channels (sans webhook)
    setClient(client);

    // ── 3. Health checks & Recovery ──────────────────────────────────────
    await runHealthChecks().catch(err =>
        logger.warn(`[Boot] Health check: ${err.message}`)
    );

    const recovery = await checkRecovery().catch(() => ({ needed: false }));
    await recordStartup(recovery.needed).catch(() => { });

    // ── 4. Nettoyage automatique de la base ───────────────────────────────
    scheduleCleanup();

    // ── 5. Schedulers (index, briefing) ───────────────────────────────────
    startIndexScheduler(client);

    try {
        startBriefingScheduler();
    } catch (e) {
        logger.warn(`[Boot] BriefingScheduler: ${e.message}`);
    }

    // ── 6. Démarrage de la collecte en flux continu ───────────────────────
    startCollector();

    logger.info('='.repeat(60));
    logger.info('   🌍 WorldMonitor est opérationnel !');
    logger.info('='.repeat(60));
});

// ─── Gestion des interactions ─────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
    await commandHandler.handleInteraction(interaction);
});

// ─── Événements de connexion ──────────────────────────────────────────────────
client.on('disconnect', () => {
    logger.warn('[Discord] ⚠️ Déconnecté de Discord');
});

client.on('error', (error) => {
    logger.error(`[Discord] Erreur client: ${error.message}`);
});

// ─── Gestion des erreurs non catchées ────────────────────────────────────────
process.on('uncaughtException', (error) => {
    logger.error(`[Process] ❌ Exception non catchée: ${error.message}\n${error.stack}`);
});

process.on('unhandledRejection', (reason) => {
    logger.error(`[Process] ❌ Promise rejection non gérée: ${reason}`);
});

process.on('SIGTERM', async () => {
    logger.info('[Process] 📴 Signal SIGTERM - Arrêt propre...');
    stopCollector();
    client.destroy();
    try {
        const { closeDatabase } = require('./src/database/connection');
        await closeDatabase();
    } catch { }
    process.exit(0);
});

// Lancement
start();
