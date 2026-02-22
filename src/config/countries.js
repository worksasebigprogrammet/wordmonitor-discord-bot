/**
 * src/config/countries.js
 * Liste complète des pays surveillés par WorldMonitor
 * Format: code ISO → { name, emoji, continent, keywords[] }
 * Les keywords incluent le nom du pays dans toutes les langues,
 * les villes majeures, les leaders actuels et les termes géopolitiques.
 */

'use strict';

const COUNTRIES = {
    // ────────────────────────────────────────────────────────────────────────
    // EUROPE
    // ────────────────────────────────────────────────────────────────────────
    FR: {
        name: 'France', emoji: '🇫🇷', continent: 'europe',
        keywords: ['France', 'Paris', 'Macron', 'Elysée', 'français', 'française', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Assemblée nationale', 'Sénat', 'DGSI', 'GIGN'],
    },
    UA: {
        name: 'Ukraine', emoji: '🇺🇦', continent: 'europe',
        keywords: ['Ukraine', 'Kyiv', 'Kiev', 'Zelensky', 'Zelenskyy', 'ukrainien', 'Ukrainian', 'Kharkiv', 'Odessa', 'Odesa', 'Donbas', 'Donbass', 'Crimea', 'Crimée', 'Zaporizhzhia', 'Bakhmut', 'Avdiivka', 'Kherson', 'Mariupol', 'Dnipro'],
    },
    RU: {
        name: 'Russie', emoji: '🇷🇺', continent: 'europe',
        keywords: ['Russia', 'Russie', 'Moscow', 'Moscou', 'Putin', 'Poutine', 'Kremlin', 'Russian', 'russe', 'Saint Petersburg', 'Duma', 'Shoigu', 'Lavrov', 'Wagner', 'FSB', 'GRU', 'Medvedev', 'LDPR', 'United Russia'],
    },
    GB: {
        name: 'Royaume-Uni', emoji: '🇬🇧', continent: 'europe',
        keywords: ['United Kingdom', 'UK', 'Britain', 'British', 'London', 'Londres', 'Royaume-Uni', 'britannique', 'England', 'Scotland', 'Wales', 'Downing Street', 'Parliament', 'Sunak', 'Starmer', 'MI6', 'SAS'],
    },
    DE: {
        name: 'Allemagne', emoji: '🇩🇪', continent: 'europe',
        keywords: ['Germany', 'Allemagne', 'Berlin', 'German', 'allemand', 'Bundeswehr', 'Bundestag', 'Scholz', 'München', 'Munich', 'Frankfurt', 'Merz', 'AfD', 'SPD', 'CDU'],
    },
    PL: {
        name: 'Pologne', emoji: '🇵🇱', continent: 'europe',
        keywords: ['Poland', 'Pologne', 'Warsaw', 'Varsovie', 'Polish', 'polonais', 'Tusk', 'Duda', 'Kraków', 'NATO flank'],
    },
    IT: {
        name: 'Italie', emoji: '🇮🇹', continent: 'europe',
        keywords: ['Italy', 'Italie', 'Rome', 'Italian', 'italien', 'Meloni', 'Milan', 'Naples', 'Sicile', 'mafia'],
    },
    ES: {
        name: 'Espagne', emoji: '🇪🇸', continent: 'europe',
        keywords: ['Spain', 'Espagne', 'Madrid', 'Spanish', 'espagnol', 'Barcelona', 'Barcelone', 'Catalonia', 'Catalogne', 'Sanchez', 'ETA'],
    },
    RO: {
        name: 'Roumanie', emoji: '🇷🇴', continent: 'europe',
        keywords: ['Romania', 'Roumanie', 'Bucharest', 'Bucarest', 'Romanian', 'roumain'],
    },
    SE: {
        name: 'Suède', emoji: '🇸🇪', continent: 'europe',
        keywords: ['Sweden', 'Suède', 'Stockholm', 'Swedish', 'suédois', 'SAAB', 'Gripen'],
    },
    FI: {
        name: 'Finlande', emoji: '🇫🇮', continent: 'europe',
        keywords: ['Finland', 'Finlande', 'Helsinki', 'Finnish', 'finlandais', 'Orpo'],
    },
    NO: {
        name: 'Norvège', emoji: '🇳🇴', continent: 'europe',
        keywords: ['Norway', 'Norvège', 'Oslo', 'Norwegian', 'norvégien', 'Storting'],
    },
    GR: {
        name: 'Grèce', emoji: '🇬🇷', continent: 'europe',
        keywords: ['Greece', 'Grèce', 'Athens', 'Athènes', 'Greek', 'grec', 'Mitsotakis', 'Thessaloniki'],
    },
    RS: {
        name: 'Serbie', emoji: '🇷🇸', continent: 'europe',
        keywords: ['Serbia', 'Serbie', 'Belgrade', 'Serbian', 'serbe', 'Kosovo', 'Vucic', 'Vučić'],
    },
    BY: {
        name: 'Biélorussie', emoji: '🇧🇾', continent: 'europe',
        keywords: ['Belarus', 'Biélorussie', 'Minsk', 'Lukashenko', 'Loukachenko', 'biélorusse'],
    },
    MD: {
        name: 'Moldavie', emoji: '🇲🇩', continent: 'europe',
        keywords: ['Moldova', 'Moldavie', 'Chisinau', 'Chișinău', 'Transnistria', 'Transnistrie', 'Sandu'],
    },
    GE: {
        name: 'Géorgie', emoji: '🇬🇪', continent: 'europe',
        keywords: ['Georgia', 'Géorgie', 'Tbilisi', 'Tbilissi', 'Georgian', 'géorgien', 'South Ossetia', 'Ossétie du Sud', 'Abkhazia', 'Abkhazie'],
    },
    SK: {
        name: 'Slovaquie', emoji: '🇸🇰', continent: 'europe',
        keywords: ['Slovakia', 'Slovaquie', 'Bratislava', 'Slovak', 'slovaque', 'Fico'],
    },
    HU: {
        name: 'Hongrie', emoji: '🇭🇺', continent: 'europe',
        keywords: ['Hungary', 'Hongrie', 'Budapest', 'Hungarian', 'hongrois', 'Orbán', 'Orban', 'Fidesz'],
    },
    AM: {
        name: 'Arménie', emoji: '🇦🇲', continent: 'europe',
        keywords: ['Armenia', 'Arménie', 'Yerevan', 'Erevan', 'Armenian', 'arménien', 'Karabakh', 'Pashinyan'],
    },
    AZ: {
        name: 'Azerbaïdjan', emoji: '🇦🇿', continent: 'europe',
        keywords: ['Azerbaijan', 'Azerbaïdjan', 'Baku', 'Bakou', 'Azerbaijani', 'azerbaïdjanais', 'Aliyev', 'Karabakh', 'Haut-Karabakh'],
    },

    // ────────────────────────────────────────────────────────────────────────
    // MOYEN-ORIENT
    // ────────────────────────────────────────────────────────────────────────
    IL: {
        name: 'Israël', emoji: '🇮🇱', continent: 'middle_east',
        keywords: ['Israel', 'Israël', 'Tel Aviv', 'Jerusalem', 'Jérusalem', 'Israeli', 'israélien', 'Netanyahu', 'Netanyahou', 'IDF', 'Tsahal', 'Gaza', 'West Bank', 'Cisjordanie', 'Hamas', 'Hezbollah', 'Iron Dome', 'Dôme de fer', 'Haifa', 'Nablus'],
    },
    IR: {
        name: 'Iran', emoji: '🇮🇷', continent: 'middle_east',
        keywords: ['Iran', 'Tehran', 'Téhéran', 'Iranian', 'iranien', 'Khamenei', 'IRGC', 'Gardiens de la révolution', 'Persian Gulf', 'golfe Persique', 'Raisi', 'Pezeshkian', 'uranium', 'enrichissement'],
    },
    SA: {
        name: 'Arabie Saoudite', emoji: '🇸🇦', continent: 'middle_east',
        keywords: ['Saudi Arabia', 'Arabie Saoudite', 'Riyadh', 'Riyad', 'Saudi', 'saoudien', 'MBS', 'Mohammed bin Salman', 'Aramco', 'OPEP', 'OPEC', 'Jeddah'],
    },
    TR: {
        name: 'Turquie', emoji: '🇹🇷', continent: 'middle_east',
        keywords: ['Turkey', 'Turquie', 'Ankara', 'Istanbul', 'Turkish', 'turc', 'Erdogan', 'Erdoğan', 'AKP', 'Bosphore', 'Izmir', 'Kurdistan PKK'],
    },
    SY: {
        name: 'Syrie', emoji: '🇸🇾', continent: 'middle_east',
        keywords: ['Syria', 'Syrie', 'Damascus', 'Damas', 'Syrian', 'syrien', 'Assad', 'Aleppo', 'Alep', 'Idlib', 'SDF', 'HTS', 'Al-Sharaa'],
    },
    IQ: {
        name: 'Irak', emoji: '🇮🇶', continent: 'middle_east',
        keywords: ['Iraq', 'Irak', 'Baghdad', 'Bagdad', 'Iraqi', 'irakien', 'Kurdistan', 'Mosul', 'Mossoul', 'Erbil', 'PMF', 'Kataib Hezbollah'],
    },
    YE: {
        name: 'Yémen', emoji: '🇾🇪', continent: 'middle_east',
        keywords: ['Yemen', 'Yémen', 'Sanaa', 'Houthi', 'Yemeni', 'yéménite', 'Aden', 'Red Sea', 'mer Rouge', 'Ansarallah'],
    },
    LB: {
        name: 'Liban', emoji: '🇱🇧', continent: 'middle_east',
        keywords: ['Lebanon', 'Liban', 'Beirut', 'Beyrouth', 'Lebanese', 'libanais', 'Hezbollah', 'South Lebanon', 'Tripoli'],
    },
    JO: {
        name: 'Jordanie', emoji: '🇯🇴', continent: 'middle_east',
        keywords: ['Jordan', 'Jordanie', 'Amman', 'Jordanian', 'jordanien', 'Abdullah', 'Wadi Rum'],
    },
    AE: {
        name: 'EAU', emoji: '🇦🇪', continent: 'middle_east',
        keywords: ['UAE', 'EAU', 'Dubai', 'Dubaï', 'Abu Dhabi', 'Emirati', 'émirat', 'Abraham Accords', 'Accords Abraham'],
    },
    PS: {
        name: 'Palestine', emoji: '🇵🇸', continent: 'middle_east',
        keywords: ['Palestine', 'Palestinian', 'palestinien', 'Gaza', 'West Bank', 'Cisjordanie', 'Hamas', 'Ramallah', 'Fatah', 'UNRWA', 'Rafah', 'Khan Younis'],
    },
    QA: {
        name: 'Qatar', emoji: '🇶🇦', continent: 'middle_east',
        keywords: ['Qatar', 'Doha', 'Qatari', 'qatarien', 'Al Jazeera', 'Al Udeid'],
    },
    KW: {
        name: 'Koweït', emoji: '🇰🇼', continent: 'middle_east',
        keywords: ['Kuwait', 'Koweït', 'Kuwait City', 'Kuwaiti', 'koweïtien'],
    },

    // ────────────────────────────────────────────────────────────────────────
    // ASIE
    // ────────────────────────────────────────────────────────────────────────
    CN: {
        name: 'Chine', emoji: '🇨🇳', continent: 'asia',
        keywords: ['China', 'Chine', 'Beijing', 'Pékin', 'Chinese', 'chinois', 'Xi Jinping', 'PLA', 'CCP', 'PCC', 'Shanghai', 'Hong Kong', 'Xinjiang', 'Tibet', 'Uyghur', 'Ouïghour', 'Shenzhen', 'Guangzhou', 'PLA Navy'],
    },
    TW: {
        name: 'Taïwan', emoji: '🇹🇼', continent: 'asia',
        keywords: ['Taiwan', 'Taïwan', 'Taipei', 'Taiwanese', 'taïwanais', 'Taiwan Strait', 'détroit de Taïwan', 'ROC', 'Lai Ching-te', 'TSMC'],
    },
    KP: {
        name: 'Corée du Nord', emoji: '🇰🇵', continent: 'asia',
        keywords: ['North Korea', 'Corée du Nord', 'Pyongyang', 'Kim Jong Un', 'DPRK', 'ICBM', 'nord-coréen', 'Hwasong', 'test balistique', 'nuclear test', 'essai nucléaire'],
    },
    KR: {
        name: 'Corée du Sud', emoji: '🇰🇷', continent: 'asia',
        keywords: ['South Korea', 'Corée du Sud', 'Seoul', 'Séoul', 'Korean', 'coréen', 'Yoon', 'THAAD', 'Busan'],
    },
    JP: {
        name: 'Japon', emoji: '🇯🇵', continent: 'asia',
        keywords: ['Japan', 'Japon', 'Tokyo', 'Japanese', 'japonais', 'Okinawa', 'Kishida', 'Ishiba', 'JSDF', 'Futenma', 'Senkaku', 'Osaka'],
    },
    IN: {
        name: 'Inde', emoji: '🇮🇳', continent: 'asia',
        keywords: ['India', 'Inde', 'New Delhi', 'Indian', 'indien', 'Modi', 'Mumbai', 'Kashmir', 'Cachemire', 'Bangalore', 'BJP', 'LAC', 'Ladakh'],
    },
    PK: {
        name: 'Pakistan', emoji: '🇵🇰', continent: 'asia',
        keywords: ['Pakistan', 'Islamabad', 'Pakistani', 'pakistanais', 'Karachi', 'Lahore', 'ISI', 'army', 'Balochistan', 'Taliban', 'Khan', 'Sharif'],
    },
    AF: {
        name: 'Afghanistan', emoji: '🇦🇫', continent: 'asia',
        keywords: ['Afghanistan', 'Kabul', 'Kaboul', 'Afghan', 'Taliban', 'Talibans', 'Kandahar', 'ISIS-K', 'Daesh Khorasan'],
    },
    MM: {
        name: 'Myanmar', emoji: '🇲🇲', continent: 'asia',
        keywords: ['Myanmar', 'Burma', 'Birmanie', 'Naypyidaw', 'Rangoon', 'Yangon', 'Rohingya', 'junta', 'SAC', 'PDF', 'Rakhine'],
    },
    PH: {
        name: 'Philippines', emoji: '🇵🇭', continent: 'asia',
        keywords: ['Philippines', 'Manila', 'Manille', 'Filipino', 'philippin', 'Marcos', 'South China Sea', 'mer de Chine méridionale', 'Scarborough', 'Spratly'],
    },
    VN: {
        name: 'Vietnam', emoji: '🇻🇳', continent: 'asia',
        keywords: ['Vietnam', 'Hanoi', 'Hanoï', 'Vietnamese', 'vietnamien', 'Ho Chi Minh', 'South China Sea'],
    },
    TH: {
        name: 'Thaïlande', emoji: '🇹🇭', continent: 'asia',
        keywords: ['Thailand', 'Thaïlande', 'Bangkok', 'Thai', 'thaïlandais', 'coup', 'junta'],
    },
    ID: {
        name: 'Indonésie', emoji: '🇮🇩', continent: 'asia',
        keywords: ['Indonesia', 'Indonésie', 'Jakarta', 'Indonesian', 'indonésien', 'Prabowo', 'Bali', 'Papua'],
    },
    KZ: {
        name: 'Kazakhstan', emoji: '🇰🇿', continent: 'asia',
        keywords: ['Kazakhstan', 'Astana', 'Almaty', 'Kazakh', 'kazakhstanais', 'Tokayev', 'OCS', 'SCO'],
    },
    BD: {
        name: 'Bangladesh', emoji: '🇧🇩', continent: 'asia',
        keywords: ['Bangladesh', 'Dhaka', 'Bangladeshi', 'bangladais', 'Hasina', 'Yunus'],
    },

    // ────────────────────────────────────────────────────────────────────────
    // AFRIQUE
    // ────────────────────────────────────────────────────────────────────────
    EG: {
        name: 'Égypte', emoji: '🇪🇬', continent: 'africa',
        keywords: ['Egypt', 'Égypte', 'Cairo', 'Le Caire', 'Egyptian', 'égyptien', 'Sinai', 'Sinaï', 'Suez', 'Sisi', 'Rafah crossing', 'passage de Rafah'],
    },
    SD: {
        name: 'Soudan', emoji: '🇸🇩', continent: 'africa',
        keywords: ['Sudan', 'Soudan', 'Khartoum', 'Sudanese', 'soudanais', 'RSF', 'Darfur', 'Darfour', 'SAF', 'Burhan', 'Hemedti', 'Port Sudan'],
    },
    ET: {
        name: 'Éthiopie', emoji: '🇪🇹', continent: 'africa',
        keywords: ['Ethiopia', 'Éthiopie', 'Addis Ababa', 'Addis-Abeba', 'Ethiopian', 'éthiopien', 'Tigray', 'Tigrayan', 'Abiy', 'TPLF', 'Amhara'],
    },
    NG: {
        name: 'Nigeria', emoji: '🇳🇬', continent: 'africa',
        keywords: ['Nigeria', 'Nigéria', 'Lagos', 'Abuja', 'Nigerian', 'nigérian', 'Boko Haram', 'ISWAP', 'Tinubu', 'Biafra'],
    },
    CD: {
        name: 'RD Congo', emoji: '🇨🇩', continent: 'africa',
        keywords: ['Congo', 'DRC', 'RDC', 'Kinshasa', 'Congolese', 'congolais', 'M23', 'Goma', 'Kivu', 'Tshisekedi', 'FARDC', 'FDLR', 'Rwanda', 'Bukavu'],
    },
    SO: {
        name: 'Somalie', emoji: '🇸🇴', continent: 'africa',
        keywords: ['Somalia', 'Somalie', 'Mogadishu', 'Mogadiscio', 'Somali', 'somalien', 'Al-Shabaab', 'AMISOM', 'ATMIS', 'piracy', 'piraterie'],
    },
    LY: {
        name: 'Libye', emoji: '🇱🇾', continent: 'africa',
        keywords: ['Libya', 'Libye', 'Tripoli', 'Libyan', 'libyen', 'Benghazi', 'Haftar', 'GNU', 'LNA', 'Dbeibah'],
    },
    ML: {
        name: 'Mali', emoji: '🇲🇱', continent: 'africa',
        keywords: ['Mali', 'Bamako', 'Malian', 'malien', 'Sahel', 'JNIM', 'Wagner', 'Africa Corps', 'GSIM', 'AQIM', 'Goïta', 'jihadiste', 'Tombouctou'],
    },
    BF: {
        name: 'Burkina Faso', emoji: '🇧🇫', continent: 'africa',
        keywords: ['Burkina Faso', 'Ouagadougou', 'burkinabè', 'Sahel', 'Traoré', 'Vandré', 'VDP', 'jihadiste'],
    },
    NE: {
        name: 'Niger', emoji: '🇳🇪', continent: 'africa',
        keywords: ['Niger', 'Niamey', 'nigérien', 'Sahel', 'coup', 'CNSP', 'Tiani', 'Bazoum', 'uranium'],
    },
    ZA: {
        name: 'Afrique du Sud', emoji: '🇿🇦', continent: 'africa',
        keywords: ['South Africa', 'Afrique du Sud', 'Pretoria', 'Johannesburg', 'Cape Town', 'Le Cap', 'Ramaphosa', 'ANC', 'BRICS'],
    },
    KE: {
        name: 'Kenya', emoji: '🇰🇪', continent: 'africa',
        keywords: ['Kenya', 'Nairobi', 'Kenyan', 'kényan', 'Ruto', 'Al-Shabaab', 'Mombasa'],
    },
    MZ: {
        name: 'Mozambique', emoji: '🇲🇿', continent: 'africa',
        keywords: ['Mozambique', 'Maputo', 'Mozambican', 'mozambicain', 'Cabo Delgado', 'IS Mozambique', 'RENAMO'],
    },
    TD: {
        name: 'Tchad', emoji: '🇹🇩', continent: 'africa',
        keywords: ['Chad', 'Tchad', "N'Djamena", 'Chadian', 'tchadien', 'Déby', 'Sahel', 'Boko Haram'],
    },
    CF: {
        name: 'Centrafrique', emoji: '🇨🇫', continent: 'africa',
        keywords: ['Central African Republic', 'Centrafrique', 'CAR', 'Bangui', 'Wagner', 'Africa Corps', 'Touadéra'],
    },
    ZW: {
        name: 'Zimbabwe', emoji: '🇿🇼', continent: 'africa',
        keywords: ['Zimbabwe', 'Harare', 'Zimbabwean', 'zimbabwéen', 'Mnangagwa', 'ZANU-PF'],
    },

    // ────────────────────────────────────────────────────────────────────────
    // AMÉRIQUES
    // ────────────────────────────────────────────────────────────────────────
    US: {
        name: 'États-Unis', emoji: '🇺🇸', continent: 'americas',
        keywords: ['United States', 'USA', 'États-Unis', 'Washington', 'American', 'américain', 'White House', 'Maison Blanche', 'Pentagon', 'Pentagone', 'Congress', 'Congrès', 'Biden', 'Trump', 'New York', 'California', 'Senate', 'Sénat', 'CIA', 'NSA', 'State Department', 'Département d\'État'],
    },
    BR: {
        name: 'Brésil', emoji: '🇧🇷', continent: 'americas',
        keywords: ['Brazil', 'Brésil', 'Brasilia', 'Brazilian', 'brésilien', 'Lula', 'São Paulo', 'Rio', 'Amazon', 'Amazonie', 'favela'],
    },
    MX: {
        name: 'Mexique', emoji: '🇲🇽', continent: 'americas',
        keywords: ['Mexico', 'Mexique', 'Mexico City', 'Mexican', 'mexicain', 'cartel', 'Sheinbaum', 'Sinaloa', 'CJNG', 'narco', 'fentanyl'],
    },
    CA: {
        name: 'Canada', emoji: '🇨🇦', continent: 'americas',
        keywords: ['Canada', 'Ottawa', 'Canadian', 'canadien', 'Trudeau', 'Carney', 'Toronto', 'Vancouver', 'Quebec', 'Québec', 'Arctic', 'Arctique'],
    },
    CO: {
        name: 'Colombie', emoji: '🇨🇴', continent: 'americas',
        keywords: ['Colombia', 'Colombie', 'Bogota', 'Colombian', 'colombien', 'FARC', 'Petro', 'cartel', 'ELN', 'narcotrafic'],
    },
    VE: {
        name: 'Venezuela', emoji: '🇻🇪', continent: 'americas',
        keywords: ['Venezuela', 'Caracas', 'Venezuelan', 'vénézuélien', 'Maduro', 'Gonzalez', 'Machado', 'Guyana Esequiba', 'pétrole'],
    },
    AR: {
        name: 'Argentine', emoji: '🇦🇷', continent: 'americas',
        keywords: ['Argentina', 'Argentine', 'Buenos Aires', 'Argentinian', 'argentin', 'Milei', 'Falklands', 'Malouines', 'peso'],
    },
    CL: {
        name: 'Chili', emoji: '🇨🇱', continent: 'americas',
        keywords: ['Chile', 'Chili', 'Santiago', 'Chilean', 'chilien', 'Boric', 'lithium', 'cuivre'],
    },
    CU: {
        name: 'Cuba', emoji: '🇨🇺', continent: 'americas',
        keywords: ['Cuba', 'Havana', 'La Havane', 'Cuban', 'cubain', 'embargo', 'Diaz-Canel', 'Guantanamo'],
    },
    HT: {
        name: 'Haïti', emoji: '🇭🇹', continent: 'americas',
        keywords: ['Haiti', 'Haïti', 'Port-au-Prince', 'Haitian', 'haïtien', 'gang', 'MSS', 'BINUH', 'Kenya mission'],
    },
    EC: {
        name: 'Équateur', emoji: '🇪🇨', continent: 'americas',
        keywords: ['Ecuador', 'Équateur', 'Quito', 'Ecuadorian', 'équatorien', 'Noboa', 'gang', 'narco'],
    },
    PE: {
        name: 'Pérou', emoji: '🇵🇪', continent: 'americas',
        keywords: ['Peru', 'Pérou', 'Lima', 'Peruvian', 'péruvien', 'Boluarte', 'Sendero Luminoso'],
    },
    NI: {
        name: 'Nicaragua', emoji: '🇳🇮', continent: 'americas',
        keywords: ['Nicaragua', 'Managua', 'Nicaraguan', 'nicaraguayen', 'Ortega', 'dictature'],
    },
};

// ─── LISTE DES CONTINENTS ──────────────────────────────────────────────────
const CONTINENTS = ['europe', 'middle_east', 'asia', 'africa', 'americas'];

// ─── PAYS PAR CONTINENT (pour navigation rapide) ───────────────────────────
const COUNTRIES_BY_CONTINENT = {};
for (const [code, data] of Object.entries(COUNTRIES)) {
    if (!COUNTRIES_BY_CONTINENT[data.continent]) {
        COUNTRIES_BY_CONTINENT[data.continent] = [];
    }
    COUNTRIES_BY_CONTINENT[data.continent].push(code);
}

/**
 * Détecte le pays mentionné dans un texte via les mots-clés
 * @param {string} text - Texte à analyser
 * @returns {string|null} Code ISO du pays ou null
 */
function detectCountry(text) {
    if (!text) return null;
    const textLower = text.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [code, data] of Object.entries(COUNTRIES)) {
        let score = 0;
        for (const kw of data.keywords) {
            if (textLower.includes(kw.toLowerCase())) {
                score++;
                // Les mots-clés courts ont moins de poids
                if (kw.length > 6) score++;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = code;
        }
    }

    return bestScore > 0 ? bestMatch : null;
}

/**
 * Détecte le continent mentionné dans un texte
 * @param {string} text - Texte à analyser
 * @returns {string|null} Continent ou null
 */
function detectContinent(text) {
    if (!text) return null;
    const countryCode = detectCountry(text);
    if (countryCode && COUNTRIES[countryCode]) {
        return COUNTRIES[countryCode].continent;
    }
    // Détection directe du continent
    const textLower = text.toLowerCase();
    const continentKeywords = {
        europe: ['europe', 'european', 'européen', 'nato', 'otan', 'eu ', ' ue '],
        middle_east: ['middle east', 'moyen-orient', 'golfe', 'gulf', 'levant'],
        asia: ['asia', 'asie', 'pacific', 'pacifique', 'indo-pacific'],
        africa: ['africa', 'afrique', 'sahel', 'subsaharan'],
        americas: ['americas', 'amérique', 'latin america', 'amérique latine', 'caribbean', 'caraïbes'],
    };
    for (const [continent, keywords] of Object.entries(continentKeywords)) {
        if (keywords.some(kw => textLower.includes(kw))) {
            return continent;
        }
    }
    return null;
}

module.exports = {
    COUNTRIES,
    CONTINENTS,
    COUNTRIES_BY_CONTINENT,
    detectCountry,
    detectContinent,
};
