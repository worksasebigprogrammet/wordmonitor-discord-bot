/**
 * ecosystem.config.js
 * Configuration PM2 pour WorldMonitor Bot
 * Gère le redémarrage automatique, les logs, et le monitoring
 */

module.exports = {
  apps: [
    {
      name: 'worldmonitor',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      // Redémarrage planifié toutes les 24h pour éviter les fuites mémoire
      cron_restart: '0 4 * * *',
    },
  ],
};
