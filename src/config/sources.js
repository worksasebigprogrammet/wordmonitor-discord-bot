/**
 * src/config/sources.js — Correction: export ALL_RSS_FEEDS et ALL_TWITTER_ACCOUNTS
 * Ce fichier re-exporte les sources pour les collecteurs
 */

'use strict';

const AGENCY_FEEDS = [
    { name: 'Reuters World', url: 'https://feeds.reuters.com/Reuters/worldNews', reliability: 10, lang: 'en', category: 'general', active: true },
    { name: 'Reuters Breaking', url: 'https://feeds.reuters.com/reuters/topNews', reliability: 10, lang: 'en', category: 'general', active: true },
    { name: 'AP News', url: 'https://rsshub.app/apnews/topics/ap-top-news', reliability: 10, lang: 'en', category: 'general', active: true },
    { name: 'AFP World', url: 'https://www.afp.com/en/rss/afp-world', reliability: 10, lang: 'en', category: 'general', active: true },
    { name: 'France 24 EN', url: 'https://www.france24.com/en/rss', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'France 24 FR', url: 'https://www.france24.com/fr/rss', reliability: 9, lang: 'fr', category: 'general', active: true },
    { name: 'RFI Monde', url: 'https://www.rfi.fr/fr/rss-actualites.xml', reliability: 9, lang: 'fr', category: 'general', active: true },
    { name: 'Al Jazeera EN', url: 'https://www.aljazeera.com/xml/rss/all.xml', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'DW World', url: 'https://rss.dw.com/xml/rss-en-world', reliability: 8, lang: 'en', category: 'general', active: true },
];

const US_FEEDS = [
    { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'BBC Europe', url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'BBC Middle East', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'NYT Politics', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', reliability: 9, lang: 'en', category: 'diplomacy', active: true },
    { name: 'Washington Post World', url: 'https://feeds.washingtonpost.com/rss/world', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'Politico', url: 'https://www.politico.com/rss/politicopicks.xml', reliability: 8, lang: 'en', category: 'diplomacy', active: true },
    { name: 'Foreign Policy', url: 'https://foreignpolicy.com/feed/', reliability: 9, lang: 'en', category: 'diplomacy', active: true },
];

const FRENCH_FEEDS = [
    { name: 'Le Monde International', url: 'https://www.lemonde.fr/international/rss_full.xml', reliability: 9, lang: 'fr', category: 'general', active: true },
    { name: 'Le Monde à la une', url: 'https://www.lemonde.fr/rss/une.xml', reliability: 9, lang: 'fr', category: 'general', active: true },
    { name: 'Le Figaro Monde', url: 'https://www.lefigaro.fr/rss/figaro_international.xml', reliability: 8, lang: 'fr', category: 'general', active: true },
    { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss/?outputType=xml', reliability: 8, lang: 'fr', category: 'general', active: true },
    { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed/all/rss.xml', reliability: 8, lang: 'fr', category: 'general', active: true },
    { name: 'BFMTV Monde', url: 'https://www.bfmtv.com/rss/news-feed/', reliability: 7, lang: 'fr', category: 'general', active: true },
    { name: 'Mediapart', url: 'https://www.mediapart.fr/articles/feed', reliability: 8, lang: 'fr', category: 'general', active: false }, // Peut nécessiter abonnement
];

const INTERNATIONAL_FEEDS = [
    { name: 'RT World', url: 'https://www.rt.com/rss/news/', reliability: 4, lang: 'en', category: 'general', active: true }, // Biais pro-russe
    { name: 'SCMP', url: 'https://www.scmp.com/rss/91/feed', reliability: 7, lang: 'en', category: 'general', active: true },
    { name: 'Haaretz', url: 'https://www.haaretz.com/cmlink/1.628765', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'Jerusalem Post', url: 'https://www.jpost.com/Rss/RssFeedsHeadlines.aspx', reliability: 7, lang: 'en', category: 'general', active: true },
    { name: 'Times of India Global', url: 'https://timesofindia.indiatimes.com/rss/world.cms', reliability: 7, lang: 'en', category: 'general', active: true },
    { name: 'Hindustan Times World', url: 'https://www.hindustantimes.com/rss/world/rssfeed.xml', reliability: 7, lang: 'en', category: 'general', active: true },
];

const DEFENSE_FEEDS = [
    { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/', reliability: 9, lang: 'en', category: 'conflicts', active: true },
    { name: 'Jane\'s 360', url: 'https://www.janes.com/newsfeeds/news_rss.aspx', reliability: 9, lang: 'en', category: 'military_movements', active: true },
    { name: 'War on the Rocks', url: 'https://warontherocks.com/feed/', reliability: 8, lang: 'en', category: 'conflicts', active: true },
    { name: 'Breaking Defense', url: 'https://breakingdefense.com/feed/', reliability: 8, lang: 'en', category: 'military_movements', active: true },
    { name: 'SOFREP', url: 'https://sofrep.com/feed/', reliability: 7, lang: 'en', category: 'military_movements', active: true },
    { name: 'The Diplomat', url: 'https://thediplomat.com/feed/', reliability: 8, lang: 'en', category: 'diplomacy', active: true },
    { name: 'Modern War Institute', url: 'https://mwi.westpoint.edu/feed/', reliability: 8, lang: 'en', category: 'conflicts', active: true },
];

const NUCLEAR_FEEDS = [
    { name: 'Arms Control Association', url: 'https://www.armscontrol.org/rss.xml', reliability: 9, lang: 'en', category: 'nuclear', active: true },
    { name: 'Bulletin Atomic Scientists', url: 'https://thebulletin.org/feed/', reliability: 9, lang: 'en', category: 'nuclear', active: true },
    { name: 'IAEA News', url: 'https://www.iaea.org/feeds/topnews', reliability: 10, lang: 'en', category: 'nuclear', active: true },
    { name: 'NTI News', url: 'https://www.nti.org/feed/', reliability: 9, lang: 'en', category: 'nuclear', active: true },
];

const DISASTER_FEEDS = [
    { name: 'EMSC Earthquakes', url: 'https://www.emsc.eu/service/rss/rss-latest.xml', reliability: 10, lang: 'en', category: 'natural_disasters', active: true },
    { name: 'FEMA News', url: 'https://www.fema.gov/newsreleases.rss', reliability: 8, lang: 'en', category: 'natural_disasters', active: true },
    { name: 'UN OCHA ReliefWeb', url: 'https://reliefweb.int/headlines/rss.xml', reliability: 9, lang: 'en', category: 'natural_disasters', active: true },
    { name: 'DisasterAlert', url: 'https://www.pdc.org/alertfeed/rss/alerts', reliability: 8, lang: 'en', category: 'natural_disasters', active: true },
];

const ECONOMY_FEEDS = [
    { name: 'Financial Times World', url: 'https://www.ft.com/rss/home', reliability: 9, lang: 'en', category: 'economy', active: true },
    { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', reliability: 9, lang: 'en', category: 'economy', active: true },
    { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', reliability: 10, lang: 'en', category: 'economy', active: true },
    { name: 'WSJ World', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', reliability: 9, lang: 'en', category: 'economy', active: true },
    { name: 'Les Echos International', url: 'https://syndication.lesechos.fr/syndication/rss/world.xml', reliability: 8, lang: 'fr', category: 'economy', active: true },
];

const MARITIME_FEEDS = [
    { name: 'Lloyd\'s List', url: 'https://www.lloydslist.com/rss.xml', reliability: 8, lang: 'en', category: 'maritime', active: true },
    { name: 'TradeWinds', url: 'https://www.tradewindsnews.com/rss', reliability: 8, lang: 'en', category: 'maritime', active: true },
    { name: 'BIMCO', url: 'https://www.bimco.org/news/rss', reliability: 8, lang: 'en', category: 'maritime', active: true },
];

// ─── Concaténation de tous les flux ──────────────────────────────────────────
const ALL_RSS_FEEDS = [
    ...AGENCY_FEEDS,
    ...US_FEEDS,
    ...FRENCH_FEEDS,
    ...INTERNATIONAL_FEEDS,
    ...DEFENSE_FEEDS,
    ...NUCLEAR_FEEDS,
    ...DISASTER_FEEDS,
    ...ECONOMY_FEEDS,
    ...MARITIME_FEEDS,
];

// ─── Comptes Twitter/X ────────────────────────────────────────────────────────
const TWITTER_GROUPS = {
    osint_military: [
        '@OSINTdefender', '@IntelCrab', '@sentdefender', '@TheIntelPost',
        '@WarMonitor3', '@RWApodcast', '@AndrewPerpetua', '@Militarylandnet',
        '@CovertShores', '@NatSecMike', '@DafMadrid',
    ],
    breaking_news: [
        '@Breaking911', '@BreakingNewsNow', '@AlertaSoon', '@WorldAlerts',
        '@Reuters', '@AP', '@AFP',
    ],
    ukraine_conflict: [
        '@UkraineWarMap', '@DefenceU', '@GeneralSVR', '@UAWeapons',
        '@UkWarReport', '@bayraktar_1love', '@Tendar',
    ],
    middle_east: [
        '@spectatorindex', '@AJEnglish', '@mbarakat', '@HalimahAbujalala',
        '@alarabiya_eng',
    ],
    maritime: [
        '@fleetmon', '@vesseltracker', '@MarineTraffic',
    ],
    disasters: [
        '@EMSC', '@USGSVolcanoes', '@NHC_Atlantic', '@NWS',
    ],
    analysts: [
        '@elionourdine', '@christopherapo', '@MacaesMalburg', '@RichardHannay',
        '@AmbassadorRice', '@KimberlyMartin',
    ],
};

// ─── Format plat pour les collecteurs ────────────────────────────────────────
const ALL_TWITTER_ACCOUNTS = Object.entries(TWITTER_GROUPS).flatMap(([group, handles]) =>
    handles.map(handle => ({ handle, group }))
);

// ─── APIs ─────────────────────────────────────────────────────────────────────
const APIS = {
    gdelt: {
        name: 'GDELT',
        baseUrl: 'https://api.gdeltproject.org/api/v2/',
        rateLimit: 1000,
        reliability: 8,
        requiresKey: false,
        active: true,
    },
    usgs: {
        name: 'USGS Earthquakes',
        baseUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/',
        rateLimit: 6000,
        reliability: 10,
        requiresKey: false,
        active: true,
    },
    reliefweb: {
        name: 'ReliefWeb',
        baseUrl: 'https://api.reliefweb.int/v1/',
        rateLimit: 2000,
        reliability: 10,
        requiresKey: false,
        active: true,
    },
    netblocks: {
        name: 'NetBlocks',
        baseUrl: 'https://netblocks.org/',
        rateLimit: 5000,
        reliability: 8,
        requiresKey: false,
        active: true,
    },
    newsapi: {
        name: 'NewsAPI',
        baseUrl: 'https://newsapi.org/v2/',
        rateLimit: 14_400_000,
        reliability: 8,
        requiresKey: true,
        active: false,
    },
    mediastack: {
        name: 'Mediastack',
        baseUrl: 'http://api.mediastack.com/v1/',
        rateLimit: 3_000_000,
        reliability: 7,
        requiresKey: true,
        active: false,
    },
    currentsapi: {
        name: 'CurrentsAPI',
        baseUrl: 'https://api.currentsapi.services/v1/',
        rateLimit: 144_000,
        reliability: 7,
        requiresKey: true,
        active: false,
    },
};

/**
 * Active les APIs optionnelles si les clés sont présentes
 */
function initAPIs() {
    if (process.env.NEWSAPI_KEY) { APIS.newsapi.active = true; }
    if (process.env.MEDIASTACK_API) { APIS.mediastack.active = true; }
    if (process.env.CURRENTS_API) { APIS.currentsapi.active = true; }
    return APIS;
}

// Initialiser immédiatement au chargement
initAPIs();

module.exports = {
    ALL_RSS_FEEDS,
    ALL_TWITTER_ACCOUNTS,
    TWITTER_GROUPS,
    APIS,
    initAPIs,
    // Groupes individuels
    AGENCY_FEEDS,
    US_FEEDS,
    FRENCH_FEEDS,
    INTERNATIONAL_FEEDS,
    DEFENSE_FEEDS,
    NUCLEAR_FEEDS,
    DISASTER_FEEDS,
    ECONOMY_FEEDS,
    MARITIME_FEEDS,
};
