/**
 * src/collectors/WeatherCollector.js
 * Collecteur météo extrême
 * Scrape les alertes météo majeures via Open-Meteo et NOAA RSS
 */

'use strict';

const RSSParser = require('rss-parser');
const logger = require('../utils/logger');
const { sleep } = require('../utils/rateLimiter');

const WEATHER_FEEDS = [
    {
        name: 'NOAA Hurricane Center',
        url: 'https://www.nhc.noaa.gov/rss_feeds/tropical_storms.xml',
        category: 'natural_disasters',
        lang: 'en',
    },
    {
        name: 'NOAA Alerts',
        url: 'https://alerts.weather.gov/cap/us.php?x=0',
        category: 'natural_disasters',
        lang: 'en',
    },
    {
        name: 'Volcano Discovery',
        url: 'https://www.volcanodiscovery.com/news.rss',
        category: 'natural_disasters',
        lang: 'en',
    },
];

const parser = new RSSParser({ timeout: 8000 });

async function collectWeather() {
    logger.info('[Weather] 🔄 Collecte météo extrême...');
    const articles = [];

    for (const feed of WEATHER_FEEDS) {
        try {
            const result = await parser.parseURL(feed.url);
            for (const item of (result.items || []).slice(0, 5)) {
                // Filtrer uniquement les alertes sérieuses
                const title = item.title || '';
                const isSerious = /hurricane|typhoon|cyclone|eruption|major|extreme|warning|watch/i.test(title);
                if (!isSerious) continue;

                articles.push({
                    title,
                    description: item.contentSnippet || item.summary || '',
                    url: item.link || feed.url,
                    imageUrl: null,
                    sourceName: feed.name,
                    sourceType: 'rss',
                    sourceReliability: 9,
                    sourceLang: feed.lang,
                    category: feed.category,
                    originalDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                });
            }
            logger.debug(`[Weather] ${feed.name}: OK`);
        } catch (error) {
            logger.debug(`[Weather] ${feed.name}: ${error.message}`);
        }
        await sleep(1000);
    }

    logger.info(`[Weather] ✅ ${articles.length} alertes météo collectées`);
    return articles;
}

module.exports = { collectWeather };
