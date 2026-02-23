/**
 * src/config/sources.js
 * Sources de données WorldMonitor
 * 80+ flux RSS organisés par thème + APIs + Twitter
 *
 * URLs vérifiées et corrigées (Bug 7)
 * URLs mortes remplacées par des alternatives fonctionnelles
 */

'use strict';

// ─── AGENCES DE PRESSE ────────────────────────────────────────────────────────
// Reuters a abandonné feeds.reuters.com → utiliser le flux alternatif officiel
const AGENCY_FEEDS = [
    // Reuters — nouveau domaine depuis 2023
    { name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews', reliability: 10, lang: 'en', category: 'general', active: false }, // mort → remplacé ci-dessous
    { name: 'Reuters via RSSHub', url: 'https://rssnewsrss.com/reuters-world-news/', reliability: 9, lang: 'en', category: 'general', active: false }, // instable
    // Reuters via flux alternatif stable
    { name: 'Reuters Breaking News', url: 'https://www.reuters.com/arc/outboundfeeds/v3/all/?outputType=json', reliability: 10, lang: 'en', category: 'general', active: false }, // format JSON non RSS
    // AP — URL directe officielle
    { name: 'AP Top News', url: 'https://apnews.com/feed/', reliability: 10, lang: 'en', category: 'general', active: true },
    { name: 'AP World News', url: 'https://apnews.com/world-news/rss.xml', reliability: 10, lang: 'en', category: 'general', active: true },
    // AFP via France 24 (AFP alimente France 24)
    { name: 'France 24 EN (AFP)', url: 'https://www.france24.com/en/rss', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'France 24 FR (AFP)', url: 'https://www.france24.com/fr/rss', reliability: 9, lang: 'fr', category: 'general', active: true },
    // RFI — URL correcte 2024
    { name: 'RFI Monde FR', url: 'https://www.rfi.fr/fr/rss-actualites-monde.xml', reliability: 9, lang: 'fr', category: 'general', active: true },
    { name: 'RFI Afrique FR', url: 'https://www.rfi.fr/fr/rss-actualites-afrique.xml', reliability: 9, lang: 'fr', category: 'general', active: true },
    // Al Jazeera — URL stable
    { name: 'Al Jazeera EN', url: 'https://www.aljazeera.com/xml/rss/all.xml', reliability: 8, lang: 'en', category: 'general', active: true },
    // DW
    { name: 'DW World', url: 'https://rss.dw.com/xml/rss-en-world', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'DW Europe', url: 'https://rss.dw.com/xml/rss-en-eu', reliability: 8, lang: 'en', category: 'general', active: true },
];

// ─── MÉDIAS ANGLOPHONES ────────────────────────────────────────────────────────
const US_FEEDS = [
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'BBC Europe', url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'BBC Middle East', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'BBC Africa', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'BBC Asia', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'CNN Africa', url: 'http://rss.cnn.com/rss/edition_africa.rss', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'Washington Post World', url: 'https://feeds.washingtonpost.com/rss/world', reliability: 9, lang: 'en', category: 'general', active: true },
    { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'The Guardian Ukraine', url: 'https://www.theguardian.com/world/ukraine/rss', reliability: 8, lang: 'en', category: 'conflicts', active: true },
    // Politico — URL RSS correcte (Bug 7: politicopicks.xml → politics-news.xml)
    { name: 'Politico', url: 'https://rss.politico.com/politics-news.xml', reliability: 8, lang: 'en', category: 'diplomacy', active: true },
    { name: 'Foreign Policy', url: 'https://foreignpolicy.com/feed/', reliability: 9, lang: 'en', category: 'diplomacy', active: true },
    { name: 'Axios World', url: 'https://api.axios.com/feed/world', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'The Economist', url: 'https://www.economist.com/europe/rss.xml', reliability: 9, lang: 'en', category: 'general', active: true },
];

// ─── MÉDIAS FRANCOPHONES ───────────────────────────────────────────────────────
const FRENCH_FEEDS = [
    { name: 'Le Monde International', url: 'https://www.lemonde.fr/international/rss_full.xml', reliability: 9, lang: 'fr', category: 'general', active: true },
    { name: 'Le Monde à la une', url: 'https://www.lemonde.fr/rss/une.xml', reliability: 9, lang: 'fr', category: 'general', active: true },
    { name: 'Le Figaro Monde', url: 'https://www.lefigaro.fr/rss/figaro_international.xml', reliability: 8, lang: 'fr', category: 'general', active: true },
    { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss/?outputType=xml', reliability: 8, lang: 'fr', category: 'general', active: true },
    { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed/all/rss.xml', reliability: 8, lang: 'fr', category: 'general', active: true },
    // BFMTV — URL corrigée (Bug 7: l'ancien URL 404)
    { name: 'BFMTV International', url: 'https://www.bfmtv.com/rss/info/flux-rss/flux-toutes-les-actualites/', reliability: 7, lang: 'fr', category: 'general', active: true },
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', reliability: 8, lang: 'fr', category: 'general', active: true },
    { name: 'LCI Monde', url: 'https://www.lci.fr/rss/info.xml', reliability: 7, lang: 'fr', category: 'general', active: true },
    { name: 'TV5 Monde', url: 'https://information.tv5monde.com/rss.xml', reliability: 8, lang: 'fr', category: 'general', active: true },
    { name: 'L\'Orient Le Jour', url: 'https://www.lorientlejour.com/rss/news.xml', reliability: 8, lang: 'fr', category: 'general', active: true },
];

// ─── MÉDIAS INTERNATIONAUX ────────────────────────────────────────────────────
const INTERNATIONAL_FEEDS = [
    // RT — biais pro-russe, fiabilité basse mais suivi pour narratifs
    { name: 'RT World', url: 'https://www.rt.com/rss/news/', reliability: 3, lang: 'en', category: 'general', active: true },
    // SCMP — Hong Kong/Asie
    { name: 'SCMP Asia', url: 'https://www.scmp.com/rss/91/feed', reliability: 7, lang: 'en', category: 'general', active: true },
    // Haaretz — derrière paywall, désactivé (Bug 7)
    { name: 'Haaretz', url: 'https://www.haaretz.com/cmlink/1.628765', reliability: 8, lang: 'en', category: 'general', active: false },
    // Times of India — URL corrigée (Bug 7)
    { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', reliability: 7, lang: 'en', category: 'general', active: true },
    { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/rss/world/rssfeed.xml', reliability: 7, lang: 'en', category: 'general', active: true },
    { name: 'The Hindu', url: 'https://www.thehindu.com/international/feeder/default.rss', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'Jerusalem Post', url: 'https://www.jpost.com/rss/rssfееds.aspx', reliability: 7, lang: 'en', category: 'general', active: true },
    { name: 'TOI Israel', url: 'https://www.timesofisrael.com/feed/', reliability: 8, lang: 'en', category: 'general', active: true },
    { name: 'Middle East Eye', url: 'https://www.middleeasteye.net/rss', reliability: 7, lang: 'en', category: 'general', active: true },
    { name: 'MEE Arabic', url: 'https://www.middleeasteye.net/ar/rss', reliability: 7, lang: 'ar', category: 'general', active: false }, // Arabe - désactivé par défaut
];

// ─── SOURCES DÉFENSE & SÉCURITÉ ───────────────────────────────────────────────
const DEFENSE_FEEDS = [
    { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/', reliability: 9, lang: 'en', category: 'conflicts', active: true },
    { name: 'Breaking Defense', url: 'https://breakingdefense.com/feed/', reliability: 8, lang: 'en', category: 'military_movements', active: true },
    { name: 'War on the Rocks', url: 'https://warontherocks.com/feed/', reliability: 8, lang: 'en', category: 'conflicts', active: true },
    { name: 'Modern War Institute', url: 'https://mwi.westpoint.edu/feed/', reliability: 8, lang: 'en', category: 'conflicts', active: true },
    { name: 'SOFREP', url: 'https://sofrep.com/feed/', reliability: 7, lang: 'en', category: 'military_movements', active: true },
    { name: 'The Diplomat', url: 'https://thediplomat.com/feed/', reliability: 8, lang: 'en', category: 'diplomacy', active: true },
    { name: 'War Is Boring', url: 'https://warisboring.com/feed/', reliability: 7, lang: 'en', category: 'military_movements', active: true },
    { name: 'Defense One', url: 'https://www.defenseone.com/rss/all', reliability: 8, lang: 'en', category: 'military_movements', active: true },
    { name: 'Janes (open)', url: 'https://www.janes.com/feeds/news', reliability: 9, lang: 'en', category: 'military_movements', active: false }, // accès limité
    { name: 'ISW Ukraine', url: 'https://www.understandingwar.org/rss.xml', reliability: 9, lang: 'en', category: 'conflicts', active: true },
];

// ─── SOURCES NUCLÉAIRES ───────────────────────────────────────────────────────
const NUCLEAR_FEEDS = [
    { name: 'Arms Control Association', url: 'https://www.armscontrol.org/rss.xml', reliability: 9, lang: 'en', category: 'nuclear', active: true },
    { name: 'Bulletin Atomic Scientists', url: 'https://thebulletin.org/feed/', reliability: 9, lang: 'en', category: 'nuclear', active: true },
    { name: 'IAEA News', url: 'https://www.iaea.org/feeds/topnews', reliability: 10, lang: 'en', category: 'nuclear', active: true },
    { name: 'NTI News', url: 'https://www.nti.org/feed/', reliability: 9, lang: 'en', category: 'nuclear', active: true },
    { name: 'SIPRI', url: 'https://www.sipri.org/rss/news', reliability: 9, lang: 'en', category: 'nuclear', active: true },
];

// ─── CATASTROPHES NATURELLES ──────────────────────────────────────────────────
const DISASTER_FEEDS = [
    { name: 'EMSC Earthquakes', url: 'https://www.emsc-csem.org/service/rss/rss.php', reliability: 10, lang: 'en', category: 'natural_disasters', active: true },
    { name: 'USGS Earthquakes RSS', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.atom', reliability: 10, lang: 'en', category: 'natural_disasters', active: true },
    { name: 'ReliefWeb Headlines', url: 'https://reliefweb.int/headlines/rss.xml', reliability: 9, lang: 'en', category: 'natural_disasters', active: true },
    { name: 'DisasterAlert PDC', url: 'https://www.pdc.org/alertfeed/rss/alerts', reliability: 8, lang: 'en', category: 'natural_disasters', active: true },
    { name: 'NOAA Hurricanes', url: 'https://www.nhc.noaa.gov/index-at.xml', reliability: 10, lang: 'en', category: 'natural_disasters', active: true },
    { name: 'Volcano Discovery', url: 'https://www.volcanodiscovery.com/rss/volcano-activity.xml', reliability: 8, lang: 'en', category: 'natural_disasters', active: true },
    { name: 'GDACS', url: 'https://www.gdacs.org/xml/gdacs.xml', reliability: 9, lang: 'en', category: 'natural_disasters', active: true },
    { name: 'Floodlist', url: 'https://floodlist.com/feed', reliability: 7, lang: 'en', category: 'natural_disasters', active: true },
];

// ─── ÉCONOMIE ─────────────────────────────────────────────────────────────────
const ECONOMY_FEEDS = [
    { name: 'Financial Times', url: 'https://www.ft.com/rss/home', reliability: 9, lang: 'en', category: 'economy', active: true },
    { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', reliability: 10, lang: 'en', category: 'economy', active: false }, // mort, utiliser alternatives
    { name: 'WSJ World', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', reliability: 9, lang: 'en', category: 'economy', active: true },
    { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', reliability: 9, lang: 'en', category: 'economy', active: true },
    { name: 'Les Echos', url: 'https://syndication.lesechos.fr/syndication/rss/les_echos.xml', reliability: 8, lang: 'fr', category: 'economy', active: true },
    { name: 'Le Monde Economie', url: 'https://www.lemonde.fr/economie/rss_full.xml', reliability: 8, lang: 'fr', category: 'economy', active: true },
    { name: 'CNBC World Economy', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', reliability: 8, lang: 'en', category: 'economy', active: true },
];

// ─── MARITIME & TRANSPORT ─────────────────────────────────────────────────────
const MARITIME_FEEDS = [
    { name: 'Lloyd\'s List', url: 'https://lloydslist.maritimeintelligence.informa.com/rss', reliability: 8, lang: 'en', category: 'maritime', active: true },
    { name: 'TradeWinds', url: 'https://www.tradewindsnews.com/rss', reliability: 8, lang: 'en', category: 'maritime', active: true },
    { name: 'Maritime Executive', url: 'https://maritime-executive.com/rss', reliability: 8, lang: 'en', category: 'maritime', active: true },
    { name: 'Hellenic Shipping', url: 'https://www.hellenicshippingnews.com/feed/', reliability: 7, lang: 'en', category: 'maritime', active: true },
    { name: 'UKMTO (Amver)', url: 'https://www.ukmto.org/rss', reliability: 9, lang: 'en', category: 'maritime', active: false }, // RSS variable
];

// ─── OSINT MILITAIRE ──────────────────────────────────────────────────────────
const OSINT_FEEDS = [
    { name: 'Oryx Blog', url: 'https://www.oryxspioenkop.com/feeds/posts/default', reliability: 9, lang: 'en', category: 'military_movements', active: true },
    { name: 'CSIS', url: 'https://www.csis.org/rss.xml', reliability: 9, lang: 'en', category: 'diplomacy', active: true },
    { name: 'Bellingcat', url: 'https://www.bellingcat.com/feed', reliability: 9, lang: 'en', category: 'conflicts', active: true },
    { name: 'Atlantic Council', url: 'https://www.atlanticcouncil.org/feed/', reliability: 8, lang: 'en', category: 'diplomacy', active: true },
    { name: 'CTC Sentinel', url: 'https://ctc.westpoint.edu/feed/', reliability: 9, lang: 'en', category: 'terrorism', active: true },
    { name: 'RAND Corp', url: 'https://www.rand.org/feed/researchers.xml', reliability: 9, lang: 'en', category: 'military_movements', active: true },
    { name: 'NetBlocks', url: 'https://netblocks.org/feed', reliability: 8, lang: 'en', category: 'outages', active: true },
    { name: 'Liveuamap (RSS)', url: 'https://liveuamap.com/rss', reliability: 7, lang: 'en', category: 'conflicts', active: true },
];

// ─── SANTÉ ────────────────────────────────────────────────────────────────────
const HEALTH_FEEDS = [
    { name: 'WHO News', url: 'https://www.who.int/news/item/rss', reliability: 10, lang: 'en', category: 'health', active: true },
    { name: 'CDC Global Health', url: 'https://tools.cdc.gov/api/v2/resources/media/132608.rss', reliability: 9, lang: 'en', category: 'health', active: true },
    { name: 'ProMED Mail', url: 'https://promedmail.org/feed/', reliability: 9, lang: 'en', category: 'health', active: true },
    { name: 'ECDC News', url: 'https://www.ecdc.europa.eu/en/rss.xml', reliability: 9, lang: 'en', category: 'health', active: true },
];

// ─── TECH & IA ────────────────────────────────────────────────────────────────
const TECH_FEEDS = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', reliability: 9, lang: 'en', category: 'tech_general', active: true },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', reliability: 8, lang: 'en', category: 'tech_general', active: true },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss', reliability: 8, lang: 'en', category: 'tech_general', active: true },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', reliability: 9, lang: 'en', category: 'tech_general', active: true },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', reliability: 9, lang: 'en', category: 'tech_ai', active: true },
    { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', reliability: 8, lang: 'en', category: 'tech_general', active: true },
    { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', reliability: 8, lang: 'en', category: 'tech_ai', active: true },
    { name: 'Import AI', url: 'https://jack-clark.net/feed/', reliability: 9, lang: 'en', category: 'tech_ai', active: true },
    { name: 'Tom\'s Hardware', url: 'https://www.tomshardware.com/feeds/all', reliability: 8, lang: 'en', category: 'tech_hardware', active: true },
    { name: 'SemiAnalysis', url: 'https://www.semianalysis.com/feed', reliability: 9, lang: 'en', category: 'tech_hardware', active: true },
    { name: 'Eurogamer', url: 'https://www.eurogamer.net/?format=rss', reliability: 7, lang: 'en', category: 'tech_gaming', active: true },
    { name: 'IGN News', url: 'https://feeds.ign.com/ign/news', reliability: 7, lang: 'en', category: 'tech_gaming', active: true },
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', reliability: 8, lang: 'en', category: 'tech_crypto', active: true },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', reliability: 7, lang: 'en', category: 'tech_crypto', active: true },
];

// ─── CYBERSÉCURITÉ ────────────────────────────────────────────────────────────
const CYBER_FEEDS = [
    { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', reliability: 9, lang: 'en', category: 'tech_cyber', active: true },
    { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', reliability: 9, lang: 'en', category: 'tech_cyber', active: true },
    { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', reliability: 8, lang: 'en', category: 'tech_cyber', active: true },
    { name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', reliability: 8, lang: 'en', category: 'tech_cyber', active: true },
    { name: 'Recorded Future News', url: 'https://therecord.media/feed', reliability: 9, lang: 'en', category: 'tech_cyber', active: true },
    { name: 'Schneier on Security', url: 'https://www.schneier.com/feed/atom/', reliability: 9, lang: 'en', category: 'tech_cyber', active: true },
    { name: 'CERT-FR', url: 'https://www.cert.ssi.gouv.fr/feed/', reliability: 10, lang: 'fr', category: 'tech_cyber', active: true },
];

// ─── GÉOPOLITIQUE SPÉCIALISÉ ──────────────────────────────────────────────────
const GEOPO_FEEDS = [
    { name: 'Eurasia Group', url: 'https://www.eurasiagroup.net/live-post/rss', reliability: 9, lang: 'en', category: 'diplomacy', active: true },
    { name: 'Carnegie Endowment', url: 'https://carnegieendowment.org/rss/', reliability: 9, lang: 'en', category: 'diplomacy', active: true },
    { name: 'ICG Crisis Group', url: 'https://www.crisisgroup.org/rss', reliability: 10, lang: 'en', category: 'conflicts', active: true },
    { name: 'ECFR', url: 'https://ecfr.eu/rss/', reliability: 8, lang: 'en', category: 'diplomacy', active: true },
    { name: 'Inkstick Media', url: 'https://inkstickmedia.com/feed/', reliability: 8, lang: 'en', category: 'military_movements', active: true },
];

// ─── CONCATÉNATION DE TOUS LES FLUX ──────────────────────────────────────────
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
    ...OSINT_FEEDS,
    ...HEALTH_FEEDS,
    ...TECH_FEEDS,
    ...CYBER_FEEDS,
    ...GEOPO_FEEDS,
].filter(f => f.active !== false); // Filtrer immédiatement les sources désactivées


// ─── COMPTES TWITTER/X (via Nitter) ──────────────────────────────────────────
const TWITTER_GROUPS = {
    osint_military: [
        '@OSINTdefender', '@IntelCrab', '@sentdefender', '@TheIntelPost',
        '@WarMonitor3', '@RWApodcast', '@AndrewPerpetua', '@Militarylandnet',
        '@CovertShores', '@NatSecMike',
    ],
    breaking_news: [
        '@Breaking911', '@BreakingNewsNow', '@AlertaSoon',
        '@Reuters', '@AP', '@AFP',
    ],
    ukraine_conflict: [
        '@UkraineWarMap', '@DefenceU', '@UAWeapons',
        '@UkWarReport', '@bayraktar_1love', '@Tendar',
    ],
    middle_east: [
        '@AJEnglish', '@mbarakat', '@HalimahAbujalala',
        '@alarabiya_eng', '@TOIAlerts',
    ],
    maritime: [
        '@fleetmon', '@vesseltracker', '@MarineTraffic',
    ],
    disasters: [
        '@EMSC', '@USGSVolcanoes', '@NHC_Atlantic', '@NWS',
    ],
    analysts: [
        '@IAI_online', '@AmbassadorRice', '@BenediktHalfdanarson',
        '@PhillipsPOBrien', '@RALee85',
    ],
};

const ALL_TWITTER_ACCOUNTS = Object.entries(TWITTER_GROUPS).flatMap(([group, handles]) =>
    handles.map(handle => ({ handle, group }))
);

// ─── APIS ─────────────────────────────────────────────────────────────────────
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
        rateLimit: 14_400_000, // max 100/jour = 864s entre les appels
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
 * Active les APIs optionnelles si les clés d'environnement sont présentes
 */
function initAPIs() {
    if (process.env.NEWSAPI_KEY) { APIS.newsapi.active = true; }
    if (process.env.MEDIASTACK_API) { APIS.mediastack.active = true; }
    if (process.env.CURRENTS_API) { APIS.currentsapi.active = true; }
    return APIS;
}

// Initialiser au chargement
initAPIs();

module.exports = {
    ALL_RSS_FEEDS,
    ALL_TWITTER_ACCOUNTS,
    TWITTER_GROUPS,
    APIS,
    initAPIs,
    // Groupes individuels (pour debugging)
    AGENCY_FEEDS,
    US_FEEDS,
    FRENCH_FEEDS,
    INTERNATIONAL_FEEDS,
    DEFENSE_FEEDS,
    NUCLEAR_FEEDS,
    DISASTER_FEEDS,
    ECONOMY_FEEDS,
    MARITIME_FEEDS,
    OSINT_FEEDS,
    HEALTH_FEEDS,
    TECH_FEEDS,
    CYBER_FEEDS,
    GEOPO_FEEDS,
};
