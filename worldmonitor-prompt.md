# 🌍 WORLDMONITOR BOT - PROMPT COMPLET POUR ANTIGRAVITY

## CONTEXTE DU PROJET

Tu es un développeur expert en Node.js et Discord.js. Tu dois créer **WorldMonitor**, un bot Discord complet qui surveille l'actualité mondiale en temps réel, agrège des dizaines de sources gratuites (RSS, scraping, APIs ouvertes), traduit en français, classe automatiquement par pays/catégorie, calcule des index de tension, génère des cartes visuelles, et poste le tout dans des channels Discord organisés par continent/pays. Le bot doit être **entièrement fonctionnel**, **fiable**, **simple à déployer** et **entièrement configurable** via des commandes Discord.

---

## STACK TECHNIQUE

- **Runtime** : Node.js (dernière version LTS)
- **Framework Discord** : discord.js v14+
- **Base de données** : MongoDB Atlas (Free Tier 512 Mo) via mongoose
- **Traduction** : DeepL Free API (fallback → LibreTranslate → Google Translate gratuit)
- **Carte mondiale** : node-canvas + carte SVG dark mode
- **Scraping** : cheerio + axios (+ puppeteer si nécessaire)
- **RSS** : rss-parser
- **Process manager** : PM2 (auto-restart)
- **Scheduling** : node-cron
- **Dédoublonnage** : string-similarity (distance de Levenshtein)

### Hébergement cible
- Hébergeur Discord Bot Pro+ (2.99€/mois)
- Intel 3.40GHz, 6 Go RAM, 25 Go SSD, 10 Gbps
- 1 base de données incluse (MySQL probable, on utilise MongoDB Atlas externe)
- Node.js & Python disponibles

---

## ARCHITECTURE DU PROJET

```
worldmonitor/
├── index.js                          # Point d'entrée principal
├── package.json
├── .env.example                      # Template des variables d'environnement
├── ecosystem.config.js               # Config PM2
├── README.md                         # Guide d'installation complet
├── CONTEXT.md                        # Contexte technique pour futures mises à jour
│
├── src/
│   ├── bot.js                        # Client Discord + chargement events/commands
│   ├── config/
│   │   ├── constants.js              # Constantes globales (couleurs, intervalles, limites)
│   │   ├── countries.js              # Liste complète des pays avec emoji drapeaux, continent, mots-clés multilingues
│   │   ├── categories.js             # Catégories de news avec mots-clés, icônes, couleurs
│   │   ├── sources.js                # Configuration de toutes les sources (RSS URLs, comptes Twitter, APIs)
│   │   └── presets.js                # Configurations prédéfinies (Débutant/Moyen/Expérimenté/Expert)
│   │
│   ├── commands/                     # Slash commands Discord
│   │   ├── setup.js                  # /setup - Configuration initiale avec presets
│   │   ├── panel.js                  # /panel - Panel interactif de configuration
│   │   ├── permission.js             # /permission - Gestion des rôles et permissions
│   │   ├── language.js               # /language - Changer la langue du bot
│   │   ├── monitor.js                # /monitor add/remove - Ajouter/retirer pays/continents
│   │   ├── search.js                 # /search - Recherche dans l'historique
│   │   ├── filter.js                 # /filter - Filtrer les news par catégorie
│   │   ├── crisis.js                 # /crisis create/close - Suivi de crise
│   │   ├── stats.js                  # /stats - Statistiques
│   │   ├── status.js                 # /status - État de santé du bot
│   │   ├── export.js                 # /export - Export CSV/JSON
│   │   ├── test.js                   # /test - Tester le bot
│   │   └── rapport.js                # /rapport - Rapport d'activité configurable
│   │
│   ├── events/                       # Event handlers Discord
│   │   ├── ready.js                  # Bot prêt + health check APIs + déploiement auto des commandes
│   │   ├── interactionCreate.js      # Handler commandes + boutons + menus
│   │   └── guildCreate.js            # Quand le bot rejoint un nouveau serveur
│   │
│   ├── collectors/                   # Modules de collecte de données
│   │   ├── CollectorManager.js       # Gestionnaire principal (file d'attente, scheduling)
│   │   ├── RSSCollector.js           # Collecteur RSS (priorité 1)
│   │   ├── GoogleNewsCollector.js    # Collecteur Google News scraping (priorité 2)
│   │   ├── GDELTCollector.js         # Collecteur GDELT API (priorité 3)
│   │   ├── TwitterCollector.js       # Collecteur Twitter/X scraping (priorité 4)
│   │   ├── USGSCollector.js          # Collecteur séismes USGS
│   │   ├── WeatherCollector.js       # Collecteur météo extrême
│   │   ├── NewsAPICollector.js       # Collecteur NewsAPI.org (optionnel)
│   │   ├── MediastackCollector.js    # Collecteur Mediastack (optionnel)
│   │   ├── CurrentsAPICollector.js   # Collecteur CurrentsAPI (optionnel)
│   │   ├── ReliefWebCollector.js     # Collecteur ReliefWeb (catastrophes humanitaires)
│   │   ├── NetBlocksCollector.js     # Collecteur pannes internet
│   │   └── LiveuamapCollector.js     # Collecteur Liveuamap (conflits)
│   │
│   ├── processors/                   # Traitement des données
│   │   ├── Deduplicator.js           # Dédoublonnage intelligent (similarité textuelle)
│   │   ├── Categorizer.js            # Classification auto par pays/catégorie (keyword matching multilingue)
│   │   ├── Translator.js             # Traduction (DeepL → LibreTranslate → Google fallback)
│   │   ├── SeverityScorer.js         # Calcul du niveau de gravité (🔴🟠🟡🟢)
│   │   ├── IndexCalculator.js        # Calcul des index de tension (global + régional + catégorie)
│   │   ├── HotZoneDetector.js        # Détection de zones chaudes (surveillance renforcée auto)
│   │   └── Summarizer.js             # Résumé des articles (4-5 phrases)
│   │
│   ├── publishers/                   # Publication vers Discord
│   │   ├── PublisherManager.js       # Gestionnaire de publication (queue avec priorité + rate limiting)
│   │   ├── NewsPublisher.js          # Publication des news (embeds riches)
│   │   ├── IndexPublisher.js         # Publication/mise à jour des index (auto-edit toutes les 10 min)
│   │   ├── MapPublisher.js           # Publication des cartes (toutes les heures)
│   │   ├── BriefingPublisher.js      # Publication des récaps (configurable 1h/3h/5h/12h/24h)
│   │   ├── AlertPublisher.js         # Publication des alertes avec pings de rôles
│   │   ├── StatusPublisher.js        # Rapport horaire du bot
│   │   ├── RapportPublisher.js       # Rapport d'activité configurable
│   │   └── WebhookManager.js         # Gestion des webhooks Discord (un par catégorie, avatar custom)
│   │
│   ├── generators/                   # Génération de contenu visuel
│   │   ├── MapGenerator.js           # Génération carte mondiale + continents (node-canvas)
│   │   ├── EmbedBuilder.js           # Construction des embeds Discord riches
│   │   └── StatsGenerator.js         # Génération de graphiques stats
│   │
│   ├── database/                     # Modèles et accès base de données
│   │   ├── connection.js             # Connexion MongoDB
│   │   ├── models/
│   │   │   ├── News.js               # Modèle news (TTL 24h auto-suppression)
│   │   │   ├── ServerConfig.js       # Configuration par serveur Discord
│   │   │   ├── Index.js              # Historique des index de tension
│   │   │   ├── Crisis.js             # Suivi de crises actives
│   │   │   ├── Source.js             # Sources configurées (avec fiabilité)
│   │   │   └── BotStats.js           # Statistiques du bot
│   │   └── cleanup.js                # Nettoyage auto des données > 24h
│   │
│   ├── setup/                        # Logique de configuration serveur
│   │   ├── ServerSetup.js            # Création auto de toute la structure (catégories, channels, rôles, webhooks)
│   │   ├── PresetManager.js          # Application des presets
│   │   ├── ChannelBuilder.js         # Création des channels par continent/pays
│   │   ├── RoleBuilder.js            # Création des rôles d'alerte
│   │   └── WebhookBuilder.js         # Création des webhooks par catégorie
│   │
│   └── utils/
│       ├── logger.js                 # Logger avec niveaux (info, warn, error)
│       ├── rateLimiter.js            # Rate limiter pour Discord API
│       ├── cooldown.js               # Cooldown commandes (10s utilisateurs normaux)
│       ├── healthCheck.js            # Vérification santé APIs au démarrage
│       ├── recoveryManager.js        # Rattrapage des news manquées après crash
│       └── queue.js                  # File d'attente avec priorité
```

---

## SOURCES DE DONNÉES COMPLÈTES

### 📰 RSS FEEDS (Priorité 1 - le plus stable et gratuit)

Le bot DOIT intégrer TOUS ces flux RSS au minimum. Chaque source a un score de fiabilité.

#### Agences de presse (fiabilité: 10/10)
```javascript
const AGENCY_FEEDS = [
  { name: 'Reuters World', url: 'https://feeds.reuters.com/Reuters/worldNews', reliability: 10, lang: 'en' },
  { name: 'Reuters Politics', url: 'https://feeds.reuters.com/Reuters/PoliticsNews', reliability: 10, lang: 'en' },
  { name: 'Reuters Business', url: 'https://feeds.reuters.com/Reuters/businessNews', reliability: 10, lang: 'en' },
  { name: 'AP News Top', url: 'https://rsshub.app/apnews/topics/apf-topnews', reliability: 10, lang: 'en' },
  { name: 'AP World', url: 'https://rsshub.app/apnews/topics/apf-WorldNews', reliability: 10, lang: 'en' },
  { name: 'AFP Français', url: 'https://www.france24.com/fr/rss', reliability: 10, lang: 'fr' },
];
```

#### Médias US (fiabilité: 8-9/10)
```javascript
const US_FEEDS = [
  { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss', reliability: 8, lang: 'en' },
  { name: 'CNN Breaking', url: 'http://rss.cnn.com/rss/cnn_latest.rss', reliability: 8, lang: 'en' },
  { name: 'Fox News World', url: 'https://moxie.foxnews.com/google-publisher/world.xml', reliability: 7, lang: 'en' },
  { name: 'Fox News Politics', url: 'https://moxie.foxnews.com/google-publisher/politics.xml', reliability: 7, lang: 'en' },
  { name: 'NBC News World', url: 'https://feeds.nbcnews.com/nbcnews/public/world', reliability: 8, lang: 'en' },
  { name: 'CBS News World', url: 'https://www.cbsnews.com/latest/rss/world', reliability: 8, lang: 'en' },
  { name: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', reliability: 9, lang: 'en' },
  { name: 'NYT Politics', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', reliability: 9, lang: 'en' },
  { name: 'Washington Post World', url: 'https://feeds.washingtonpost.com/rss/world', reliability: 9, lang: 'en' },
  { name: 'Axios', url: 'https://api.axios.com/feed/', reliability: 8, lang: 'en' },
  { name: 'Politico', url: 'https://rss.politico.com/politics-news.xml', reliability: 8, lang: 'en' },
  { name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml', reliability: 8, lang: 'en' },
  { name: 'PBS NewsHour', url: 'https://www.pbs.org/newshour/feeds/rss/world', reliability: 8, lang: 'en' },
  { name: 'The Hill', url: 'https://thehill.com/feed/', reliability: 7, lang: 'en' },
  { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/politics/news.rss', reliability: 9, lang: 'en' },
  { name: 'Wall Street Journal', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', reliability: 9, lang: 'en' },
];
```

#### Médias UK (fiabilité: 8-9/10)
```javascript
const UK_FEEDS = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', reliability: 9, lang: 'en' },
  { name: 'BBC Europe', url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', reliability: 9, lang: 'en' },
  { name: 'BBC Middle East', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', reliability: 9, lang: 'en' },
  { name: 'BBC Asia', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', reliability: 9, lang: 'en' },
  { name: 'BBC Africa', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', reliability: 9, lang: 'en' },
  { name: 'BBC Americas', url: 'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml', reliability: 9, lang: 'en' },
  { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', reliability: 9, lang: 'en' },
  { name: 'The Guardian Europe', url: 'https://www.theguardian.com/world/europe-news/rss', reliability: 9, lang: 'en' },
  { name: 'Sky News World', url: 'https://feeds.skynews.com/feeds/rss/world.xml', reliability: 8, lang: 'en' },
  { name: 'The Telegraph World', url: 'https://www.telegraph.co.uk/news/world/rss.xml', reliability: 8, lang: 'en' },
  { name: 'The Independent World', url: 'https://www.independent.co.uk/news/world/rss', reliability: 8, lang: 'en' },
  { name: 'Financial Times', url: 'https://www.ft.com/world?format=rss', reliability: 9, lang: 'en' },
];
```

#### Médias France (fiabilité: 8-9/10)
```javascript
const FR_FEEDS = [
  { name: 'France24 FR', url: 'https://www.france24.com/fr/rss', reliability: 9, lang: 'fr' },
  { name: 'France24 EN', url: 'https://www.france24.com/en/rss', reliability: 9, lang: 'en' },
  { name: 'France24 Moyen-Orient', url: 'https://www.france24.com/fr/moyen-orient/rss', reliability: 9, lang: 'fr' },
  { name: 'France24 Afrique', url: 'https://www.france24.com/fr/afrique/rss', reliability: 9, lang: 'fr' },
  { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', reliability: 9, lang: 'fr' },
  { name: 'Le Monde International', url: 'https://www.lemonde.fr/international/rss_full.xml', reliability: 9, lang: 'fr' },
  { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_international.xml', reliability: 8, lang: 'fr' },
  { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', reliability: 7, lang: 'fr' },
  { name: 'RFI', url: 'https://www.rfi.fr/fr/rss', reliability: 9, lang: 'fr' },
  { name: 'RFI Afrique', url: 'https://www.rfi.fr/fr/afrique/rss', reliability: 9, lang: 'fr' },
  { name: 'Libération Monde', url: 'https://www.liberation.fr/rss/monde/', reliability: 8, lang: 'fr' },
  { name: 'LCI', url: 'https://www.lci.fr/rss.xml', reliability: 7, lang: 'fr' },
  { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed/all/rss.xml', reliability: 8, lang: 'fr' },
];
```

#### Médias Internationaux (fiabilité: 7-9/10)
```javascript
const INTL_FEEDS = [
  { name: 'Al Jazeera EN', url: 'https://www.aljazeera.com/xml/rss/all.xml', reliability: 8, lang: 'en' },
  { name: 'Al Jazeera Middle East', url: 'https://www.aljazeera.com/xml/rss/all.xml', reliability: 8, lang: 'en' },
  { name: 'DW World', url: 'https://rss.dw.com/rdf/rss-en-world', reliability: 8, lang: 'en' },
  { name: 'DW Europe', url: 'https://rss.dw.com/rdf/rss-en-eu', reliability: 8, lang: 'en' },
  { name: 'DW Asia', url: 'https://rss.dw.com/rdf/rss-en-asia', reliability: 8, lang: 'en' },
  { name: 'DW Africa', url: 'https://rss.dw.com/rdf/rss-en-africa', reliability: 8, lang: 'en' },
  { name: 'NHK World', url: 'https://www3.nhk.or.jp/rss/news/cat6.xml', reliability: 8, lang: 'en' },
  { name: 'TASS', url: 'https://tass.com/rss/v2.xml', reliability: 6, lang: 'en' },
  { name: 'Xinhua', url: 'http://www.news.cn/english/rss/worldrss.xml', reliability: 6, lang: 'en' },
  { name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/', reliability: 8, lang: 'en' },
  { name: 'Iran International', url: 'https://www.iranintl.com/en/feed', reliability: 7, lang: 'en' },
  { name: 'Al Arabiya EN', url: 'https://english.alarabiya.net/tools/rss', reliability: 7, lang: 'en' },
  { name: 'South China Morning Post', url: 'https://www.scmp.com/rss/91/feed', reliability: 8, lang: 'en' },
  { name: 'Japan Times', url: 'https://www.japantimes.co.jp/feed/', reliability: 8, lang: 'en' },
  { name: 'Haaretz', url: 'https://www.haaretz.com/cmlink/1.628765', reliability: 8, lang: 'en' },
  { name: 'Kyiv Independent', url: 'https://kyivindependent.com/feed/', reliability: 8, lang: 'en' },
  { name: 'Moscow Times', url: 'https://www.themoscowtimes.com/rss/news', reliability: 7, lang: 'en' },
  { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss', reliability: 8, lang: 'en' },
  { name: 'The Hindu', url: 'https://www.thehindu.com/news/international/feeder/default.rss', reliability: 7, lang: 'en' },
  { name: 'Dawn Pakistan', url: 'https://www.dawn.com/feed', reliability: 7, lang: 'en' },
  { name: 'Daily Sabah Turkey', url: 'https://www.dailysabah.com/rssFeed/world', reliability: 7, lang: 'en' },
  { name: 'Anadolu Agency', url: 'https://www.aa.com.tr/en/rss/default?cat=world', reliability: 7, lang: 'en' },
  { name: 'Yonhap Korea', url: 'https://en.yna.co.kr/RSS/news.xml', reliability: 8, lang: 'en' },
  { name: 'Straits Times Asia', url: 'https://www.straitstimes.com/news/asia/rss.xml', reliability: 8, lang: 'en' },
  { name: 'Africa News', url: 'https://www.africanews.com/feed/', reliability: 7, lang: 'en' },
  { name: 'Latin America Reports', url: 'https://latinamericareports.com/feed/', reliability: 6, lang: 'en' },
];
```

#### Médias Défense & Sécurité (fiabilité: 8-9/10)
```javascript
const DEFENSE_FEEDS = [
  { name: 'Defense One', url: 'https://www.defenseone.com/rss/all/', reliability: 8, lang: 'en' },
  { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml', reliability: 8, lang: 'en' },
  { name: 'Janes', url: 'https://www.janes.com/feeds/news', reliability: 9, lang: 'en' },
  { name: 'War on the Rocks', url: 'https://warontherocks.com/feed/', reliability: 8, lang: 'en' },
  { name: 'The War Zone', url: 'https://www.thedrive.com/the-war-zone/rss', reliability: 8, lang: 'en' },
  { name: 'Military Times', url: 'https://www.militarytimes.com/arc/outboundfeeds/rss/?outputType=xml', reliability: 8, lang: 'en' },
  { name: 'Stars and Stripes', url: 'https://www.stripes.com/rss', reliability: 8, lang: 'en' },
  { name: 'Breaking Defense', url: 'https://breakingdefense.com/feed/', reliability: 8, lang: 'en' },
  { name: 'RUSI', url: 'https://www.rusi.org/rss.xml', reliability: 9, lang: 'en' },
  { name: 'Arms Control Association', url: 'https://www.armscontrol.org/rss.xml', reliability: 9, lang: 'en' },
  { name: 'Bulletin Atomic Scientists', url: 'https://thebulletin.org/feed/', reliability: 9, lang: 'en' },
  { name: 'IISS', url: 'https://www.iiss.org/en/rss/', reliability: 9, lang: 'en' },
  { name: 'Zone Militaire FR', url: 'https://www.opex360.com/feed/', reliability: 8, lang: 'fr' },
  { name: 'Meta-Defense FR', url: 'https://meta-defense.fr/feed/', reliability: 7, lang: 'fr' },
  { name: 'Bellingcat', url: 'https://www.bellingcat.com/feed/', reliability: 9, lang: 'en' },
  { name: 'The Intercept', url: 'https://theintercept.com/feed/?lang=en', reliability: 8, lang: 'en' },
];
```

#### Nucléaire & Énergie (fiabilité: 9/10)
```javascript
const NUCLEAR_FEEDS = [
  { name: 'IAEA News', url: 'https://www.iaea.org/feeds/news', reliability: 10, lang: 'en' },
  { name: 'NTI Global Security', url: 'https://www.nti.org/rss/all/', reliability: 9, lang: 'en' },
  { name: 'Federation American Scientists', url: 'https://fas.org/feed/', reliability: 9, lang: 'en' },
  { name: 'Bulletin Atomic Scientists', url: 'https://thebulletin.org/feed/', reliability: 9, lang: 'en' },
];
```

#### Catastrophes & Humanitaire (fiabilité: 9-10/10)
```javascript
const DISASTER_FEEDS = [
  { name: 'ReliefWeb Updates', url: 'https://reliefweb.int/updates/rss.xml', reliability: 10, lang: 'en' },
  { name: 'ReliefWeb Disasters', url: 'https://reliefweb.int/disasters/rss.xml', reliability: 10, lang: 'en' },
  { name: 'GDACS Alerts', url: 'https://www.gdacs.org/xml/rss.xml', reliability: 10, lang: 'en' },
  { name: 'OCHA', url: 'https://www.unocha.org/rss.xml', reliability: 10, lang: 'en' },
  { name: 'UNDRR', url: 'https://www.undrr.org/rss.xml', reliability: 9, lang: 'en' },
  { name: 'WHO Disease Outbreaks', url: 'https://www.who.int/feeds/entity/don/en/rss.xml', reliability: 10, lang: 'en' },
  { name: 'UNHCR', url: 'https://www.unhcr.org/rss/news.xml', reliability: 10, lang: 'en' },
];
```

#### Économie & Sanctions (fiabilité: 8-9/10)
```javascript
const ECONOMY_FEEDS = [
  { name: 'IMF News', url: 'https://www.imf.org/en/News/rss', reliability: 10, lang: 'en' },
  { name: 'World Bank', url: 'https://www.worldbank.org/en/news/rss.xml', reliability: 10, lang: 'en' },
  { name: 'ECB News', url: 'https://www.ecb.europa.eu/rss/press.html', reliability: 10, lang: 'en' },
  { name: 'OFAC Sanctions', url: 'https://ofac.treasury.gov/rss.xml', reliability: 10, lang: 'en' },
  { name: 'EU Sanctions', url: 'https://www.sanctionsmap.eu/rss', reliability: 10, lang: 'en' },
  { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/', reliability: 8, lang: 'en' },
  { name: 'CNBC World', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362', reliability: 8, lang: 'en' },
  { name: 'Les Echos', url: 'https://www.lesechos.fr/rss/rss_monde.xml', reliability: 8, lang: 'fr' },
];
```

### 🐦 COMPTES TWITTER/X (Priorité 4 - scraping)

Le bot doit scraper ces comptes. Si le scraping est bloqué, le bot continue sans Twitter et utilise les autres sources.

```javascript
const TWITTER_ACCOUNTS = {
  // OSINT & Militaire (fiabilité: 7-8/10)
  osint_military: [
    '@OSINTdefender', '@IntelCrab', '@sentdefender', '@TheIntelPost',
    '@ELINTNews', '@RALee85', '@WarMonitor3', '@UAWeapons',
    '@GeoConfirmed', '@JulianRoepcke', '@Nfrno', '@Prsjumpa',
    '@Faytuks', '@MT_Anderson', '@OAlexanderDK', '@Osinttechnical',
    '@Militarylandnet', '@UAControlMap', '@DefMon3', '@oryaborov',
    '@JominiW', '@LostWeapons', '@Blue_Sauron', '@IntelSchizo',
    '@ChrisO_wiki', '@front_ukraine', '@GirkinGirkin', '@WarInUkraine04',
    '@Liveuamap', '@NOELreports', '@WarWeatherman', '@Tendar',
    '@KevinRothrock', '@TWMCLtd', '@AuroraIntel', '@air_intel',
  ],

  // Breaking News & Alertes (fiabilité: 6-8/10)
  breaking_news: [
    '@AlertesInfos', '@BNONews', '@Breaking911', '@Flash_info_fr',
    '@Loopsiders', '@ConflitsActu', '@AlerteInfoFR', '@InfosFrancaises',
    '@urgikicat', '@LeHuffPost', '@20Minutes', '@ABORSJANSEN',
    '@spectabornes', '@disclosetv', '@ABORSJANSEN2', '@NewsBreaking',
    '@CNNBreaking', '@BBCBreaking', '@ReutersWorld', '@AFP',
    '@AJEnglish', '@France24_fr', '@RTLFrance', '@SkyNewsBreak',
  ],

  // Nucléaire & Spécialisé (fiabilité: 8-9/10)
  nuclear_specialist: [
    '@nukestrat', '@ArmsControlWonk', '@INuclearAffairs',
    '@HansFKristensen', '@CherylRofer', '@TomZ_9',
    '@AtomicAnalyst', '@JWMurdoch', '@ABMBulletin',
  ],

  // Maritime & Transport (fiabilité: 7-8/10)
  maritime_transport: [
    '@TankerTrackers', '@MarineTraffic', '@ItaMilRadar',
    '@AircraftSpots', '@maborshov', '@TheSenkaku',
    '@IndoPacificNews', '@govaborshov',
  ],

  // Analystes géopolitiques (fiabilité: 7-9/10)
  geopolitical_analysts: [
    '@KofmanMichael', '@DmitriAlperov', '@RobPsych',
    '@Faiaborbot', '@HoansSolo', '@IAPonomarenko',
    '@TrentTelenko', '@PhillipsPOBrien', '@KamilKazani',
    '@EliotHiggins', '@Malbrunot', '@Agnes_Callamard',
    '@BBCMonitoring', '@InstForStudyWar', '@CrisisGroup',
  ],

  // Moyen-Orient spécifique (fiabilité: 7-8/10)
  middle_east: [
    '@IntelDoge', '@sentdefender', '@idabornes',
    '@JasonMBrodsky', '@ArmedConflicts', '@AlMonitor',
    '@MiddleEastEye', '@MEMRIReports', '@Khabornyat',
    '@ABORSJANSEN', '@calibabornes',
  ],

  // Afrique spécifique (fiabilité: 6-7/10)
  africa: [
    '@AfricaDefense', '@africaintel', '@jeabornes',
    '@Maborjet', '@AgoraVoxAfrique', '@RFIAfrique',
  ],

  // Asie-Pacifique spécifique (fiabilité: 7-8/10)
  asia_pacific: [
    '@IndoPac_Info', '@AsiaTimes', '@NikkeiAsia',
    '@BenarNews', '@SCMPNews', '@globaltimesnews',
    '@PDChina', '@TaiwanNews886',
  ],
};
```

### 🌐 APIs GRATUITES (Priorités 2-3)

```javascript
const APIS = {
  // GDELT (Priorité 3) - Gratuit, pas de clé
  gdelt: {
    baseUrl: 'https://api.gdeltproject.org/api/v2/',
    endpoints: {
      doc: 'doc/doc?query={query}&mode=artlist&maxrecords=50&format=json',
      geo: 'geo/geo?query={query}&format=geojson',
      timeline: 'doc/doc?query={query}&mode=timelinevolraw&format=json',
    },
    rateLimit: '1 req/sec',
    reliability: 8,
  },

  // USGS Earthquakes - Gratuit, pas de clé
  usgs: {
    baseUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/',
    endpoints: {
      significant: 'summary/significant_hour.geojson',
      m45: 'summary/4.5_day.geojson',
      all: 'summary/all_day.geojson',
    },
    reliability: 10,
  },

  // Google News Scraping (Priorité 2) - Gratuit
  googleNews: {
    baseUrl: 'https://news.google.com/rss/search?q={query}&hl={lang}&gl={country}&ceid={ceid}',
    // Scraping par pays et par sujet
    reliability: 7,
  },

  // NewsAPI.org (Optionnel) - Free tier: 100 req/jour
  newsapi: {
    baseUrl: 'https://newsapi.org/v2/',
    endpoints: {
      topHeadlines: 'top-headlines?country={country}&category={category}',
      everything: 'everything?q={query}&sortBy=publishedAt',
    },
    rateLimit: '100 req/day free',
    reliability: 8,
    envKey: 'NEWSAPI_KEY',
  },

  // Mediastack (Optionnel) - Free tier: 500 req/mois
  mediastack: {
    baseUrl: 'http://api.mediastack.com/v1/news',
    rateLimit: '500 req/month free',
    reliability: 7,
    envKey: 'MEDIASTACK_API',
  },

  // CurrentsAPI (Optionnel) - Gratuit: 600 req/jour
  currentsapi: {
    baseUrl: 'https://api.currentsapi.services/v1/',
    rateLimit: '600 req/day free',
    reliability: 7,
    envKey: 'CURRENTS_API',
  },

  // NetBlocks (Pannes internet) - Scraping
  netblocks: {
    url: 'https://netblocks.org/feed',
    reliability: 8,
  },

  // ACLED (Conflits) - Free API avec inscription
  acled: {
    baseUrl: 'https://api.acleddata.com/acled/read',
    reliability: 9,
  },
};
```

---

## CATÉGORISATION AUTOMATIQUE PAR MOTS-CLÉS

Le système de classification doit être **multilingue** (FR + EN + AR) et basé sur des mots-clés pondérés.

```javascript
const CATEGORIES = {
  conflicts: {
    name: { en: 'Armed Conflicts', fr: 'Conflits Armés' },
    icon: '⚔️',
    color: '#FF0000', // Rouge
    keywords: {
      en: ['war', 'battle', 'airstrike', 'bombing', 'offensive', 'troops', 'military operation', 'combat', 'shelling', 'missile strike', 'artillery', 'invasion', 'frontline', 'casualties', 'killed in action', 'wounded', 'ceasefire', 'escalation', 'clashes', 'siege', 'ambush', 'insurgency', 'guerrilla'],
      fr: ['guerre', 'bataille', 'frappe aérienne', 'bombardement', 'offensive', 'troupes', 'opération militaire', 'combat', 'obus', 'missile', 'artillerie', 'invasion', 'front', 'victimes', 'blessés', 'cessez-le-feu', 'escalade', 'affrontements', 'siège', 'embuscade', 'insurrection'],
    },
  },

  military_movements: {
    name: { en: 'Military Movements', fr: 'Mouvements Militaires' },
    icon: '🎖️',
    color: '#8B0000', // Rouge foncé
    keywords: {
      en: ['troop deployment', 'military buildup', 'naval fleet', 'aircraft carrier', 'military convoy', 'troop movement', 'mobilization', 'military exercise', 'drills', 'deployment', 'reinforcements', 'military base', 'garrison', 'battalion', 'brigade', 'regiment', 'special forces', 'OSINT', 'satellite imagery', 'surveillance', 'reconnaissance'],
      fr: ['déploiement de troupes', 'renforcement militaire', 'flotte navale', 'porte-avions', 'convoi militaire', 'mouvement de troupes', 'mobilisation', 'exercice militaire', 'manœuvres', 'déploiement', 'renforts', 'base militaire', 'garnison', 'bataillon', 'brigade', 'régiment', 'forces spéciales', 'imagerie satellite', 'reconnaissance'],
    },
  },

  nuclear: {
    name: { en: 'Nuclear', fr: 'Nucléaire' },
    icon: '⚛️',
    color: '#FFD700', // Or
    keywords: {
      en: ['nuclear', 'atomic', 'uranium', 'plutonium', 'ICBM', 'nuclear warhead', 'nuclear test', 'radiation', 'nuclear reactor', 'enrichment', 'nonproliferation', 'nuclear deal', 'IAEA', 'nuclear deterrent', 'nuclear submarine', 'thermonuclear', 'fallout', 'Doomsday Clock'],
      fr: ['nucléaire', 'atomique', 'uranium', 'plutonium', 'ICBM', 'ogive nucléaire', 'essai nucléaire', 'radiation', 'réacteur nucléaire', 'enrichissement', 'non-prolifération', 'accord nucléaire', 'AIEA', 'dissuasion nucléaire', 'sous-marin nucléaire'],
    },
  },

  economy: {
    name: { en: 'Economy & Sanctions', fr: 'Économie & Sanctions' },
    icon: '💰',
    color: '#00CED1', // Turquoise
    keywords: {
      en: ['sanctions', 'embargo', 'trade war', 'tariff', 'economic crisis', 'inflation', 'recession', 'GDP', 'central bank', 'interest rate', 'stock market crash', 'default', 'bailout', 'currency', 'SWIFT', 'OFAC', 'treasury', 'economic collapse', 'debt crisis', 'supply chain'],
      fr: ['sanctions', 'embargo', 'guerre commerciale', 'tarif douanier', 'crise économique', 'inflation', 'récession', 'PIB', 'banque centrale', 'taux d\'intérêt', 'krach boursier', 'défaut de paiement', 'renflouement', 'devise', 'effondrement économique', 'crise de la dette', 'chaîne d\'approvisionnement'],
    },
  },

  maritime: {
    name: { en: 'Maritime & Waterways', fr: 'Maritime & Voies Navigables' },
    icon: '🚢',
    color: '#1E90FF', // Bleu
    keywords: {
      en: ['strait', 'Hormuz', 'Bab el-Mandeb', 'Red Sea', 'Suez Canal', 'Panama Canal', 'Malacca', 'South China Sea', 'Taiwan Strait', 'Black Sea', 'naval blockade', 'ship seized', 'tanker', 'cargo ship', 'maritime security', 'piracy', 'Houthi', 'shipping route', 'vessel', 'port'],
      fr: ['détroit', 'Ormuz', 'Bab el-Mandeb', 'mer Rouge', 'canal de Suez', 'canal de Panama', 'Malacca', 'mer de Chine', 'détroit de Taïwan', 'mer Noire', 'blocus naval', 'navire saisi', 'pétrolier', 'cargo', 'sécurité maritime', 'piraterie', 'Houthi', 'route maritime', 'navire', 'port'],
    },
  },

  natural_disasters: {
    name: { en: 'Natural Disasters', fr: 'Catastrophes Naturelles' },
    icon: '🌊',
    color: '#FF8C00', // Orange
    keywords: {
      en: ['earthquake', 'tsunami', 'hurricane', 'typhoon', 'cyclone', 'tornado', 'flood', 'wildfire', 'volcano', 'eruption', 'landslide', 'drought', 'heatwave', 'blizzard', 'storm', 'magnitude', 'epicenter', 'evacuation', 'natural disaster', 'climate emergency'],
      fr: ['séisme', 'tremblement de terre', 'tsunami', 'ouragan', 'typhon', 'cyclone', 'tornade', 'inondation', 'feu de forêt', 'incendie', 'volcan', 'éruption', 'glissement de terrain', 'sécheresse', 'canicule', 'tempête', 'magnitude', 'épicentre', 'évacuation', 'catastrophe naturelle'],
    },
  },

  terrorism: {
    name: { en: 'Terrorism & Security', fr: 'Terrorisme & Sécurité' },
    icon: '🔴',
    color: '#DC143C', // Cramoisi
    keywords: {
      en: ['terrorist attack', 'terrorism', 'ISIS', 'Al-Qaeda', 'bomb threat', 'hostage', 'mass shooting', 'extremist', 'radicalization', 'counterterrorism', 'threat level', 'security alert', 'Vigipirate', 'active shooter', 'lone wolf', 'suicide bomber', 'IED'],
      fr: ['attentat', 'terrorisme', 'Daesh', 'Al-Qaïda', 'alerte à la bombe', 'otage', 'fusillade', 'extrémiste', 'radicalisation', 'antiterrorisme', 'niveau d\'alerte', 'alerte sécurité', 'Vigipirate', 'kamikaze', 'engin explosif'],
    },
  },

  outages: {
    name: { en: 'Outages & Blackouts', fr: 'Pannes & Blackouts' },
    icon: '📡',
    color: '#4B0082', // Indigo
    keywords: {
      en: ['internet shutdown', 'blackout', 'power outage', 'communication cut', 'internet censorship', 'network down', 'social media blocked', 'VPN ban', 'infrastructure attack', 'cyber attack', 'grid failure', 'service disruption'],
      fr: ['coupure internet', 'blackout', 'panne de courant', 'coupure de communication', 'censure internet', 'réseau en panne', 'réseaux sociaux bloqués', 'VPN interdit', 'attaque infrastructure', 'cyberattaque', 'panne réseau'],
    },
  },

  health: {
    name: { en: 'Health & Epidemics', fr: 'Santé & Épidémies' },
    icon: '🏥',
    color: '#32CD32', // Vert lime
    keywords: {
      en: ['pandemic', 'epidemic', 'outbreak', 'virus', 'WHO', 'quarantine', 'vaccination', 'disease', 'health emergency', 'bird flu', 'Ebola', 'cholera', 'plague', 'SARS', 'COVID', 'monkey pox', 'pathogen'],
      fr: ['pandémie', 'épidémie', 'foyer épidémique', 'virus', 'OMS', 'quarantaine', 'vaccination', 'maladie', 'urgence sanitaire', 'grippe aviaire', 'Ebola', 'choléra', 'peste', 'variole du singe', 'pathogène'],
    },
  },

  diplomacy: {
    name: { en: 'Diplomacy', fr: 'Diplomatie' },
    icon: '🤝',
    color: '#9370DB', // Violet moyen
    keywords: {
      en: ['summit', 'treaty', 'diplomacy', 'ambassador', 'UN General Assembly', 'Security Council', 'NATO', 'EU summit', 'bilateral talks', 'peace deal', 'negotiations', 'alliance', 'G7', 'G20', 'BRICS', 'diplomatic crisis', 'expulsion diplomat'],
      fr: ['sommet', 'traité', 'diplomatie', 'ambassadeur', 'Assemblée générale ONU', 'Conseil de sécurité', 'OTAN', 'sommet UE', 'pourparlers', 'accord de paix', 'négociations', 'alliance', 'crise diplomatique', 'expulsion diplomate'],
    },
  },
};
```

### 🌍 CLASSIFICATION PAR PAYS (Mots-clés multilingues)

```javascript
const COUNTRIES = {
  // Format: code ISO -> { name, emoji, continent, keywords[] }
  // Les keywords incluent le nom du pays dans toutes les langues + villes majeures + leaders + termes géopolitiques

  // EUROPE
  FR: { name: 'France', emoji: '🇫🇷', continent: 'europe', keywords: ['France', 'Paris', 'Macron', 'Elysée', 'français', 'française', 'Lyon', 'Marseille', 'Assemblée nationale'] },
  UA: { name: 'Ukraine', emoji: '🇺🇦', continent: 'europe', keywords: ['Ukraine', 'Kyiv', 'Kiev', 'Zelensky', 'Zelenskyy', 'ukrainien', 'Ukrainian', 'Kharkiv', 'Odessa', 'Donbas', 'Donbass', 'Crimea', 'Crimée', 'Zaporizhzhia', 'Bakhmut', 'Avdiivka'] },
  RU: { name: 'Russie', emoji: '🇷🇺', continent: 'europe', keywords: ['Russia', 'Russie', 'Moscow', 'Moscou', 'Putin', 'Poutine', 'Kremlin', 'Russian', 'russe', 'Saint Petersburg', 'Duma', 'Shoigu', 'Lavrov', 'Wagner'] },
  GB: { name: 'Royaume-Uni', emoji: '🇬🇧', continent: 'europe', keywords: ['United Kingdom', 'UK', 'Britain', 'British', 'London', 'Londres', 'Royaume-Uni', 'britannique', 'England', 'Scotland', 'Wales', 'Downing Street', 'Parliament'] },
  DE: { name: 'Allemagne', emoji: '🇩🇪', continent: 'europe', keywords: ['Germany', 'Allemagne', 'Berlin', 'German', 'allemand', 'Bundeswehr', 'Bundestag', 'Scholz', 'München', 'Frankfurt'] },
  PL: { name: 'Pologne', emoji: '🇵🇱', continent: 'europe', keywords: ['Poland', 'Pologne', 'Warsaw', 'Varsovie', 'Polish', 'polonais'] },
  IT: { name: 'Italie', emoji: '🇮🇹', continent: 'europe', keywords: ['Italy', 'Italie', 'Rome', 'Italian', 'italien', 'Meloni', 'Milan'] },
  ES: { name: 'Espagne', emoji: '🇪🇸', continent: 'europe', keywords: ['Spain', 'Espagne', 'Madrid', 'Spanish', 'espagnol', 'Barcelona', 'Barcelone'] },
  RO: { name: 'Roumanie', emoji: '🇷🇴', continent: 'europe', keywords: ['Romania', 'Roumanie', 'Bucharest', 'Bucarest', 'Romanian'] },
  SE: { name: 'Suède', emoji: '🇸🇪', continent: 'europe', keywords: ['Sweden', 'Suède', 'Stockholm', 'Swedish', 'suédois'] },
  FI: { name: 'Finlande', emoji: '🇫🇮', continent: 'europe', keywords: ['Finland', 'Finlande', 'Helsinki', 'Finnish'] },
  NO: { name: 'Norvège', emoji: '🇳🇴', continent: 'europe', keywords: ['Norway', 'Norvège', 'Oslo', 'Norwegian'] },
  GR: { name: 'Grèce', emoji: '🇬🇷', continent: 'europe', keywords: ['Greece', 'Grèce', 'Athens', 'Athènes', 'Greek'] },
  RS: { name: 'Serbie', emoji: '🇷🇸', continent: 'europe', keywords: ['Serbia', 'Serbie', 'Belgrade', 'Serbian', 'Kosovo'] },
  BY: { name: 'Biélorussie', emoji: '🇧🇾', continent: 'europe', keywords: ['Belarus', 'Biélorussie', 'Minsk', 'Lukashenko', 'Loukachenko'] },
  MD: { name: 'Moldavie', emoji: '🇲🇩', continent: 'europe', keywords: ['Moldova', 'Moldavie', 'Chisinau', 'Transnistria', 'Transnistrie'] },
  GE: { name: 'Géorgie', emoji: '🇬🇪', continent: 'europe', keywords: ['Georgia', 'Géorgie', 'Tbilisi', 'Tbilissi', 'Georgian', 'South Ossetia', 'Abkhazia'] },

  // MOYEN-ORIENT
  IL: { name: 'Israël', emoji: '🇮🇱', continent: 'middle_east', keywords: ['Israel', 'Israël', 'Tel Aviv', 'Jerusalem', 'Jérusalem', 'Israeli', 'israélien', 'Netanyahu', 'Netanyahou', 'IDF', 'Tsahal', 'Gaza', 'West Bank', 'Cisjordanie', 'Hamas', 'Hezbollah'] },
  IR: { name: 'Iran', emoji: '🇮🇷', continent: 'middle_east', keywords: ['Iran', 'Tehran', 'Téhéran', 'Iranian', 'iranien', 'Khamenei', 'IRGC', 'Gardiens de la révolution', 'Persian Gulf', 'golfe Persique', 'Raisi'] },
  SA: { name: 'Arabie Saoudite', emoji: '🇸🇦', continent: 'middle_east', keywords: ['Saudi Arabia', 'Arabie Saoudite', 'Riyadh', 'Riyad', 'Saudi', 'saoudien', 'MBS', 'Mohammed bin Salman'] },
  TR: { name: 'Turquie', emoji: '🇹🇷', continent: 'middle_east', keywords: ['Turkey', 'Turquie', 'Ankara', 'Istanbul', 'Turkish', 'turc', 'Erdogan'] },
  SY: { name: 'Syrie', emoji: '🇸🇾', continent: 'middle_east', keywords: ['Syria', 'Syrie', 'Damascus', 'Damas', 'Syrian', 'syrien', 'Assad', 'Aleppo', 'Alep', 'Idlib'] },
  IQ: { name: 'Irak', emoji: '🇮🇶', continent: 'middle_east', keywords: ['Iraq', 'Irak', 'Baghdad', 'Bagdad', 'Iraqi', 'irakien', 'Kurdistan', 'Mosul', 'Mossoul'] },
  YE: { name: 'Yémen', emoji: '🇾🇪', continent: 'middle_east', keywords: ['Yemen', 'Yémen', 'Sanaa', 'Houthi', 'Yemeni', 'yéménite', 'Aden'] },
  LB: { name: 'Liban', emoji: '🇱🇧', continent: 'middle_east', keywords: ['Lebanon', 'Liban', 'Beirut', 'Beyrouth', 'Lebanese', 'libanais', 'Hezbollah'] },
  JO: { name: 'Jordanie', emoji: '🇯🇴', continent: 'middle_east', keywords: ['Jordan', 'Jordanie', 'Amman', 'Jordanian'] },
  AE: { name: 'EAU', emoji: '🇦🇪', continent: 'middle_east', keywords: ['UAE', 'EAU', 'Dubai', 'Dubaï', 'Abu Dhabi', 'Emirati', 'émirat'] },
  PS: { name: 'Palestine', emoji: '🇵🇸', continent: 'middle_east', keywords: ['Palestine', 'Palestinian', 'palestinien', 'Gaza', 'West Bank', 'Cisjordanie', 'Hamas', 'Ramallah'] },

  // ASIE
  CN: { name: 'Chine', emoji: '🇨🇳', continent: 'asia', keywords: ['China', 'Chine', 'Beijing', 'Pékin', 'Chinese', 'chinois', 'Xi Jinping', 'PLA', 'CCP', 'PCC', 'Shanghai', 'Hong Kong', 'Xinjiang', 'Tibet', 'Uyghur', 'Ouïghour'] },
  TW: { name: 'Taïwan', emoji: '🇹🇼', continent: 'asia', keywords: ['Taiwan', 'Taïwan', 'Taipei', 'Taiwanese', 'taïwanais', 'Taiwan Strait', 'détroit de Taïwan'] },
  KP: { name: 'Corée du Nord', emoji: '🇰🇵', continent: 'asia', keywords: ['North Korea', 'Corée du Nord', 'Pyongyang', 'Kim Jong Un', 'DPRK', 'ICBM', 'nord-coréen'] },
  KR: { name: 'Corée du Sud', emoji: '🇰🇷', continent: 'asia', keywords: ['South Korea', 'Corée du Sud', 'Seoul', 'Séoul', 'Korean', 'coréen'] },
  JP: { name: 'Japon', emoji: '🇯🇵', continent: 'asia', keywords: ['Japan', 'Japon', 'Tokyo', 'Japanese', 'japonais', 'Okinawa'] },
  IN: { name: 'Inde', emoji: '🇮🇳', continent: 'asia', keywords: ['India', 'Inde', 'New Delhi', 'Indian', 'indien', 'Modi', 'Mumbai', 'Kashmir', 'Cachemire'] },
  PK: { name: 'Pakistan', emoji: '🇵🇰', continent: 'asia', keywords: ['Pakistan', 'Islamabad', 'Pakistani', 'pakistanais', 'Karachi', 'Lahore'] },
  AF: { name: 'Afghanistan', emoji: '🇦🇫', continent: 'asia', keywords: ['Afghanistan', 'Kabul', 'Kaboul', 'Afghan', 'Taliban', 'Talibans'] },
  MM: { name: 'Myanmar', emoji: '🇲🇲', continent: 'asia', keywords: ['Myanmar', 'Burma', 'Birmanie', 'Naypyidaw', 'Rangoon', 'Rohingya', 'junta'] },
  PH: { name: 'Philippines', emoji: '🇵🇭', continent: 'asia', keywords: ['Philippines', 'Manila', 'Manille', 'Filipino', 'philippin', 'Marcos', 'Duterte'] },
  VN: { name: 'Vietnam', emoji: '🇻🇳', continent: 'asia', keywords: ['Vietnam', 'Hanoi', 'Hanoï', 'Vietnamese', 'vietnamien', 'Ho Chi Minh'] },
  TH: { name: 'Thaïlande', emoji: '🇹🇭', continent: 'asia', keywords: ['Thailand', 'Thaïlande', 'Bangkok', 'Thai', 'thaïlandais'] },

  // AFRIQUE
  EG: { name: 'Égypte', emoji: '🇪🇬', continent: 'africa', keywords: ['Egypt', 'Égypte', 'Cairo', 'Le Caire', 'Egyptian', 'égyptien', 'Sinai', 'Sinaï', 'Suez'] },
  SD: { name: 'Soudan', emoji: '🇸🇩', continent: 'africa', keywords: ['Sudan', 'Soudan', 'Khartoum', 'Sudanese', 'soudanais', 'RSF', 'Darfur', 'Darfour'] },
  ET: { name: 'Éthiopie', emoji: '🇪🇹', continent: 'africa', keywords: ['Ethiopia', 'Éthiopie', 'Addis Ababa', 'Ethiopian', 'éthiopien', 'Tigray'] },
  NG: { name: 'Nigeria', emoji: '🇳🇬', continent: 'africa', keywords: ['Nigeria', 'Nigéria', 'Lagos', 'Abuja', 'Nigerian', 'nigérian', 'Boko Haram'] },
  CD: { name: 'RD Congo', emoji: '🇨🇩', continent: 'africa', keywords: ['Congo', 'DRC', 'RDC', 'Kinshasa', 'Congolese', 'congolais', 'M23', 'Goma', 'Kivu'] },
  SO: { name: 'Somalie', emoji: '🇸🇴', continent: 'africa', keywords: ['Somalia', 'Somalie', 'Mogadishu', 'Mogadiscio', 'Somali', 'somalien', 'Al-Shabaab'] },
  LY: { name: 'Libye', emoji: '🇱🇾', continent: 'africa', keywords: ['Libya', 'Libye', 'Tripoli', 'Libyan', 'libyen', 'Benghazi', 'Haftar'] },
  ML: { name: 'Mali', emoji: '🇲🇱', continent: 'africa', keywords: ['Mali', 'Bamako', 'Malian', 'malien', 'Sahel', 'JNIM', 'Wagner'] },
  BF: { name: 'Burkina Faso', emoji: '🇧🇫', continent: 'africa', keywords: ['Burkina Faso', 'Ouagadougou', 'burkinabè', 'Sahel'] },
  NE: { name: 'Niger', emoji: '🇳🇪', continent: 'africa', keywords: ['Niger', 'Niamey', 'nigérien', 'Sahel', 'coup'] },
  ZA: { name: 'Afrique du Sud', emoji: '🇿🇦', continent: 'africa', keywords: ['South Africa', 'Afrique du Sud', 'Pretoria', 'Johannesburg', 'Cape Town'] },
  KE: { name: 'Kenya', emoji: '🇰🇪', continent: 'africa', keywords: ['Kenya', 'Nairobi', 'Kenyan', 'kényan'] },
  MZ: { name: 'Mozambique', emoji: '🇲🇿', continent: 'africa', keywords: ['Mozambique', 'Maputo', 'Mozambican', 'mozambicain', 'Cabo Delgado'] },

  // AMÉRIQUES
  US: { name: 'États-Unis', emoji: '🇺🇸', continent: 'americas', keywords: ['United States', 'USA', 'États-Unis', 'Washington', 'American', 'américain', 'White House', 'Maison Blanche', 'Pentagon', 'Pentagone', 'Congress', 'Congrès', 'Biden', 'Trump', 'New York', 'California'] },
  BR: { name: 'Brésil', emoji: '🇧🇷', continent: 'americas', keywords: ['Brazil', 'Brésil', 'Brasilia', 'Brazilian', 'brésilien', 'Lula', 'São Paulo', 'Rio'] },
  MX: { name: 'Mexique', emoji: '🇲🇽', continent: 'americas', keywords: ['Mexico', 'Mexique', 'Mexico City', 'Mexican', 'mexicain', 'cartel'] },
  CA: { name: 'Canada', emoji: '🇨🇦', continent: 'americas', keywords: ['Canada', 'Ottawa', 'Canadian', 'canadien', 'Trudeau', 'Toronto', 'Vancouver'] },
  CO: { name: 'Colombie', emoji: '🇨🇴', continent: 'americas', keywords: ['Colombia', 'Colombie', 'Bogota', 'Colombian', 'colombien', 'FARC'] },
  VE: { name: 'Venezuela', emoji: '🇻🇪', continent: 'americas', keywords: ['Venezuela', 'Caracas', 'Venezuelan', 'vénézuélien', 'Maduro'] },
  AR: { name: 'Argentine', emoji: '🇦🇷', continent: 'americas', keywords: ['Argentina', 'Argentine', 'Buenos Aires', 'Argentine', 'argentin', 'Milei'] },
  CL: { name: 'Chili', emoji: '🇨🇱', continent: 'americas', keywords: ['Chile', 'Chili', 'Santiago', 'Chilean', 'chilien'] },
  CU: { name: 'Cuba', emoji: '🇨🇺', continent: 'americas', keywords: ['Cuba', 'Havana', 'La Havane', 'Cuban', 'cubain'] },
  HT: { name: 'Haïti', emoji: '🇭🇹', continent: 'americas', keywords: ['Haiti', 'Haïti', 'Port-au-Prince', 'Haitian', 'haïtien'] },
};
```

---

## PRESETS DE CONFIGURATION

```javascript
const PRESETS = {
  beginner: {
    name: { en: 'Beginner', fr: 'Débutant' },
    description: { fr: 'Breaking news mondial uniquement, alertes critiques seulement' },
    channels: ['breaking-news', 'index-global'],
    categories: ['conflicts', 'nuclear', 'natural_disasters', 'terrorism'],
    continents: [], // Pas de découpage par continent
    countriesPerContinent: 0,
    briefingInterval: '24h',
    alertLevels: ['critical'], // Seulement 🔴
    mapEnabled: false,
    militaryTracking: false,
    economyTracking: false,
    maritimeTracking: false,
    crisisSystem: false,
  },

  intermediate: {
    name: { en: 'Intermediate', fr: 'Moyen' },
    description: { fr: 'Breaking + conflits majeurs + économie, channels par continent' },
    channels: ['breaking-news', 'index-global', 'daily-briefing'],
    categories: ['conflicts', 'nuclear', 'natural_disasters', 'terrorism', 'economy', 'diplomacy'],
    continents: ['europe', 'middle_east', 'asia', 'africa', 'americas'],
    countriesPerContinent: 0, // Juste index par continent, pas de pays individuels
    briefingInterval: '12h',
    alertLevels: ['critical', 'high'],
    mapEnabled: true,
    militaryTracking: false,
    economyTracking: true,
    maritimeTracking: false,
    crisisSystem: false,
  },

  experienced: {
    name: { en: 'Experienced', fr: 'Expérimenté' },
    description: { fr: 'Tout sauf OSINT détaillé, channels par pays majeurs' },
    channels: ['breaking-news', 'index-global', 'daily-briefing', 'carte-mondiale'],
    categories: ['conflicts', 'nuclear', 'natural_disasters', 'terrorism', 'economy', 'diplomacy', 'maritime', 'outages', 'health'],
    continents: ['europe', 'middle_east', 'asia', 'africa', 'americas'],
    countriesPerContinent: 3, // Top 3 pays par continent
    briefingInterval: '5h',
    alertLevels: ['critical', 'high', 'medium'],
    mapEnabled: true,
    militaryTracking: true,
    economyTracking: true,
    maritimeTracking: true,
    crisisSystem: true,
  },

  expert: {
    name: { en: 'Expert', fr: 'Expert' },
    description: { fr: 'Tout activé, OSINT militaire, 5-6 pays par continent, raw intelligence' },
    channels: ['breaking-news', 'index-global', 'daily-briefing', 'carte-mondiale', 'mouvements-militaires', 'economie-mondiale', 'nucleaire', 'maritime', 'catastrophes-naturelles', 'pannes-blackouts'],
    categories: Object.keys(CATEGORIES), // TOUTES les catégories
    continents: ['europe', 'middle_east', 'asia', 'africa', 'americas'],
    countriesPerContinent: 6, // 6 pays par continent
    defaultCountries: {
      europe: ['FR', 'UA', 'RU', 'GB', 'DE', 'PL'],
      middle_east: ['IL', 'IR', 'SA', 'TR', 'SY', 'YE'],
      asia: ['CN', 'TW', 'KP', 'KR', 'JP', 'IN'],
      africa: ['EG', 'SD', 'NG', 'CD', 'ML', 'ET'],
      americas: ['US', 'BR', 'MX', 'CA', 'VE', 'CO'],
    },
    briefingInterval: '3h',
    alertLevels: ['critical', 'high', 'medium', 'low'],
    mapEnabled: true,
    militaryTracking: true,
    economyTracking: true,
    maritimeTracking: true,
    crisisSystem: true,
    continentMaps: true,
    continentMilitaryChannels: true,
    continentEconomyChannels: true,
  },
};
```

---

## FORMAT DES EMBEDS DISCORD

### Embed de News standard
```
┌─────────────────────────────────────────┐
│ 🔴 ALERTE CRITIQUE                      │  ← Couleur barre latérale selon gravité
│                                         │
│ [IMAGE DE COUVERTURE DE L'ARTICLE]      │  ← Image si disponible
│                                         │
│ 📰 Titre de l'article traduit en FR     │
│                                         │
│ Résumé de l'article en 4-5 phrases en   │
│ français. Le résumé doit être clair et  │
│ informatif, donnant les points clés de  │
│ l'article original.                      │
│                                         │
│ 📌 Pays: 🇺🇦 Ukraine                    │
│ 📂 Catégorie: ⚔️ Conflits Armés         │
│ 📊 Fiabilité source: ★★★★★★★★★☆ 9/10  │
│ 📰 Rapporté par 3 sources               │
│                                         │
│ 🔗 Source: Reuters                       │
│ 📅 22/02/2026 14:35 UTC                 │
│ 🔗 Lien original                         │
└─────────────────────────────────────────┘
```

### Couleurs d'embed selon gravité
```javascript
const SEVERITY_COLORS = {
  critical: '#FF0000',  // 🔴 Rouge - Guerre, nucléaire, attentat majeur
  high: '#FF8C00',      // 🟠 Orange - Conflit actif, sanctions majeures
  medium: '#FFD700',    // 🟡 Jaune - Tensions, exercices militaires
  low: '#00FF00',       // 🟢 Vert - Diplomatie, économie standard
};
```

### Embed d'Index (auto-update toutes les 10 min)
```
┌─────────────────────────────────────────┐
│ 🌍 INDEX DE TENSION MONDIALE            │
│ Dernière mise à jour: 14:30 UTC         │
│                                         │
│ ████████░░ 7.2/10 TENSION MONDIALE      │
│                                         │
│ 🇪🇺 Europe         ██████░░░░ 5.8/10   │
│ 🌍 Moyen-Orient    █████████░ 8.9/10   │
│ 🌏 Asie            ███████░░░ 6.5/10   │
│ 🌍 Afrique         ███████░░░ 6.2/10   │
│ 🌎 Amériques       ████░░░░░░ 3.4/10   │
│                                         │
│ 🔥 Zones chaudes:                        │
│ 🇺🇦 Ukraine (9.1) 🇮🇱 Israël (8.7)    │
│ 🇸🇩 Soudan (7.8)  🇹🇼 Taïwan (6.9)   │
│                                         │
│ ⚔️ Conflits     ████████░░ 7.8/10      │
│ ⚛️ Nucléaire    ██████░░░░ 5.5/10      │
│ 💰 Économie     █████░░░░░ 4.2/10      │
│ 🚢 Maritime     ███████░░░ 6.8/10      │
│ 🌊 Catastrophes ████░░░░░░ 3.1/10      │
└─────────────────────────────────────────┘
```

---

## CARTE MONDIALE (node-canvas)

La carte doit être générée avec ces spécifications :
- **Style** : Dark mode (fond #1a1a2e, terres #16213e, bordures #0f3460)
- **Points colorés** par pays selon tension (vert → jaune → orange → rouge)
- **Icônes** par type d'événement (💣⚔️⚛️🌊🚢📡)
- **Flèches** pour mouvements de troupes connus
- **Légende** en bas avec les catégories
- **Titre** avec date/heure
- **Résolution** : 1920x1080 minimum
- Générer aussi des cartes zoomées par continent (configurables)

---

## COMMANDES DÉTAILLÉES

### /setup
```
Description: Configure WorldMonitor sur ce serveur
Options:
  - preset: (required) Choix: Débutant | Moyen | Expérimenté | Expert
  - language: (optional) Langue par défaut: fr | en (défaut: fr)

Comportement:
1. Affiche un embed de prévisualisation du preset choisi
2. Bouton "Confirmer" / "Personnaliser" / "Annuler"
3. Si "Confirmer": crée automatiquement TOUTE la structure:
   - Catégories Discord (dossiers)
   - Channels par continent/pays selon preset
   - Rôles d'alerte (@Alerte-Europe, @Alerte-Critique, etc.)
   - Webhooks par catégorie (avec avatars custom)
   - Channel #alert-config avec embed de sélection de rôles
   - Channel #panel avec embed de configuration
   - Channel #bot-logs
   - Channel #bot-status
   - Enregistre la config en base de données
   - Démarre immédiatement la collecte
4. Si "Personnaliser": ouvre le /panel
5. Les commandes slash sont déployées automatiquement au démarrage du bot
```

### /panel
```
Description: Panel de configuration interactif
Affiche un embed avec des boutons et menus déroulants:

[Menu 1: Continents] - Activer/désactiver des continents
[Menu 2: Pays] - Ajouter/retirer des pays par continent
[Menu 3: Catégories] - Activer/désactiver des catégories
[Menu 4: Sources] - Gérer les sources (RSS, Twitter, APIs)
[Menu 5: Alertes] - Configurer les niveaux d'alerte
[Menu 6: Intervalles] - Modifier les intervalles (scraping, briefing, carte, index)
[Menu 7: Comptes Twitter] - Ajouter/retirer des comptes Twitter
[Bouton: Sauvegarder]
[Bouton: Reset]
```

### /permission
```
Description: Gérer les permissions du bot
Options:
  - action: add | remove | list
  - role: @role Discord
  - permission: setup | panel | crisis | monitor | all

Comportement:
- Par défaut seuls les admins Discord peuvent utiliser /setup et /panel
- Permet de donner accès à des rôles spécifiques
```

### /language
```
Description: Changer la langue du bot
Options:
  - lang: fr | en
Affecte: interface des commandes + traduction des news
```

### /monitor
```
Description: Ajouter/retirer des pays ou continents
Options:
  - action: add | remove
  - target: nom du pays ou continent
Crée/supprime automatiquement les channels correspondants
```

### /search
```
Description: Rechercher dans l'historique des news
Options:
  - query: termes de recherche
  - period: 1h | 6h | 12h | 24h (défaut: 24h)
  - country: (optional) filtrer par pays
  - category: (optional) filtrer par catégorie
Retourne les résultats dans un embed paginé
```

### /filter
```
Description: Filtrer les news par catégorie
Options:
  - category: conflicts | nuclear | economy | maritime | etc.
Crée un channel temporaire (auto-supprimé après 1h) avec les news filtrées
```

### /crisis
```
Description: Suivi de crise
Options:
  - action: create | close | list
  - name: nom de la crise (ex: "Iran-Israel")
  - keywords: (optional) mots-clés pour l'agrégation auto
Crée une nouvelle catégorie Discord avec un channel dédié qui agrège automatiquement toutes les news liées
```

### /stats
```
Description: Statistiques du bot
Affiche: nombre de news (heure/jour/semaine), top pays, top catégories, tendances, graphiques
```

### /status
```
Description: État de santé du bot
Affiche: sources actives/inactives, dernière mise à jour, uptime, RAM/CPU, quotas APIs restants
```

### /export
```
Description: Exporter les données
Options:
  - format: csv | json
  - period: 1h | 6h | 12h | 24h
  - country: (optional)
  - category: (optional)
Génère un fichier et l'envoie en pièce jointe
```

### /test
```
Description: Tester le bot
Lance immédiatement un cycle de collecte et poste les résultats
Utile pour vérifier que tout fonctionne après le /setup
```

### /rapport
```
Description: Rapport d'activité
Options:
  - period: 1h | 3h | 6h | 12h | 24h
  - auto: true | false (activer/désactiver le rapport automatique)
  - interval: (si auto=true) 1h | 3h | 6h | 12h | 24h
Génère un rapport détaillé: nombre de news scrapées, sources utilisées, erreurs, pays couverts, catégories, temps de réponse moyen
```

---

## FICHIER .env.example

```env
# ===== OBLIGATOIRE =====
DISCORD_TOKEN=your_discord_bot_token
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/worldmonitor

# ===== RECOMMANDÉ =====
DEEPL_API_KEY=your_deepl_free_api_key

# ===== OPTIONNEL (améliore la couverture) =====
NEWSAPI_KEY=your_newsapi_key
MEDIASTACK_API=your_mediastack_key
CURRENTS_API=your_currentsapi_key

# ===== CONFIG BOT =====
BOT_PREFIX=!
DEFAULT_LANGUAGE=fr
SCRAPE_INTERVAL=300000
INDEX_UPDATE_INTERVAL=600000
MAP_GENERATION_INTERVAL=3600000
NEWS_TTL_HOURS=24
```

---

## COMPORTEMENTS CRITIQUES

### Démarrage du bot
1. Connexion MongoDB
2. Health check de toutes les APIs configurées (affiche le status dans la console)
3. Déploiement automatique des slash commands sur tous les serveurs
4. Chargement des configurations serveur depuis la base de données
5. Vérification des news manquées (recovery après crash)
6. Démarrage des collecteurs en file d'attente
7. Message dans #bot-logs: "✅ WorldMonitor démarré - X sources actives"

### Cycle de collecte (toutes les 5 minutes)
1. File d'attente : RSS → Google News → GDELT → Twitter → APIs optionnelles
2. Une source à la fois pour économiser la RAM
3. Pour chaque article trouvé:
   a. Vérifier le dédoublonnage (similarité > 0.7 = doublon)
   b. Si doublon: mettre à jour le compteur "Rapporté par X sources"
   c. Si nouveau: classifier (pays + catégorie + gravité)
   d. Traduire en français si nécessaire
   e. Résumer en 4-5 phrases
   f. Ajouter en base de données
   g. Publier dans le(s) bon(s) channel(s) via webhook
4. Mettre à jour les index si nécessaire

### Rate limiting Discord
- Maximum 30 messages/minute
- Queue avec priorité: 🔴 critique > 🟠 haute > 🟡 moyenne > 🟢 basse
- Si trop de news simultanées: regrouper en un seul embed multi-news

### Nettoyage automatique
- TTL MongoDB: suppression auto des news après 24h
- Vérification toutes les heures

### Zones chaudes
- Si un pays a plus de 10 événements en 1h → marquer comme "zone chaude"
- Augmenter la fréquence de check pour ce pays (toutes les 2 min au lieu de 5)
- Notifier dans #breaking-news

---

## INSTRUCTIONS FINALES

1. Le code DOIT être **entièrement fonctionnel** et prêt à être déployé avec `npm install && node index.js`
2. Toutes les commandes slash doivent se déployer **automatiquement** au démarrage
3. Le /setup doit créer **automatiquement** TOUTE la structure Discord (catégories, channels, rôles, webhooks)
4. Le code doit être **propre, bien commenté, modulaire** et facile à maintenir
5. Chaque fichier doit avoir un **header commenté** expliquant son rôle
6. Le README.md doit contenir des **instructions pas à pas** pour l'installation
7. Le CONTEXT.md doit contenir le **contexte technique complet** pour les futures mises à jour
8. Le bot doit **ne jamais poster la même info deux fois** (dédoublonnage strict)
9. Le bot doit **continuer à fonctionner** même si une source tombe (fallback automatique)
10. Les webhooks doivent avoir des **noms et avatars différents** par catégorie
11. Le bot doit être **multi-serveur** compatible
12. Tout doit être **configurable** via les commandes Discord, sans toucher au code
13. Le rapport horaire dans #bot-status doit montrer: sources scrapées, news trouvées, erreurs, uptime, RAM
14. Les slash commands doivent avoir des **autocomplete** quand c'est pertinent (noms de pays, catégories)
15. Utilise des **collectors Discord.js** pour les interactions boutons/menus avec timeout
16. Crée le code **complet** de chaque fichier, pas de placeholder ni de "TODO"
