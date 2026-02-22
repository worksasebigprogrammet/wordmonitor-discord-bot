/**
 * src/utils/logger.js
 * Logger avec niveaux (info, warn, error, debug)
 * Utilise Winston avec rotation des fichiers de logs
 */

'use strict';

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Format commun avec timestamp et couleurs
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        return stack ? `${base}\n${stack}` : base;
    })
);

// Format colorisé pour la console
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp }) => {
        return `[${timestamp}] ${level} ${message}`;
    })
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Console
        new winston.transports.Console({
            format: consoleFormat,
        }),

        // Fichier rotatif - tous niveaux
        new DailyRotateFile({
            filename: path.join(logsDir, 'worldmonitor-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '10m',
            maxFiles: '7d',
            level: 'info',
        }),

        // Fichier erreurs uniquement
        new DailyRotateFile({
            filename: path.join(logsDir, 'errors-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '5m',
            maxFiles: '14d',
            level: 'error',
        }),
    ],
});

// Ne pas logger les stacktraces en production
if (process.env.NODE_ENV === 'production') {
    logger.exceptions.handle(
        new DailyRotateFile({
            filename: path.join(logsDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '30d',
        })
    );
}

module.exports = logger;
