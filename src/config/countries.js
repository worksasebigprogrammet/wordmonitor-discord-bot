/**
 * src/config/countries.js
 * Liste complète des pays surveillés par WorldMonitor
 * Format: code ISO → { name, emoji, continent, keywords[] }
 * Les keywords incluent le nom du pays dans toutes les langues,
 * les villes majeures, les leaders actuels et les termes géopolitiques.
 *
 * IMPORTANT: La détection utilise des word boundaries (\b) pour éviter
 * les faux positifs (ex: "south" ≠ "South Africa", "Peru" ≠ "Peruvian").
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
        keywords: ['United Kingdom', 'Britain', 'British', 'London', 'Londres', 'Royaume-Uni', 'britannique', 'England', 'Scotland', 'Wales', 'Downing Street', 'Sunak', 'Starmer', 'MI6', 'SAS'],
    },
    DE: {
        name: 'Allemagne', emoji: '🇩🇪', continent: 'europe',
        keywords: ['Germany', 'Allemagne', 'Berlin', 'German', 'allemand', 'Bundeswehr', 'Bundestag', 'Scholz', 'München', 'Munich', 'Merz', 'AfD', 'SPD', 'CDU'],
    },
    PL: {
        name: 'Pologne', emoji: '🇵🇱', continent: 'europe',
        keywords: ['Poland', 'Pologne', 'Warsaw', 'Varsovie', 'Polish', 'polonais', 'Tusk', 'Duda', 'Kraków'],
    },
    IT: {
        name: 'Italie', emoji: '🇮🇹', continent: 'europe',
        keywords: ['Italy', 'Italie', 'Rome', 'Italian', 'italien', 'Meloni', 'Milan', 'Naples', 'Sicile'],
    },
    ES: {
        name: 'Espagne', emoji: '🇪🇸', continent: 'europe',
        keywords: ['Spain', 'Espagne', 'Madrid', 'Spanish', 'espagnol', 'Barcelona', 'Barcelone', 'Catalonia', 'Catalogne', 'Sanchez'],
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
        keywords: ['Norway', 'Norvège', 'Oslo', 'Norwegian', 'norvégien'],
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
        keywords: ['Azerbaijan', 'Azerbaïdjan', 'Baku', 'Bakou', 'Azerbaijani', 'azerbaïdjanais', 'Aliyev', 'Haut-Karabakh'],
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
        keywords: ['Turkey', 'Turquie', 'Ankara', 'Istanbul', 'Turkish', 'turc', 'Erdogan', 'Erdoğan', 'AKP', 'Bosphore', 'Izmir'],
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
        keywords: ['Lebanon', 'Liban', 'Beirut', 'Beyrouth', 'Lebanese', 'libanais', 'South Lebanon', 'Tripoli'],
    },
    JO: {
        name: 'Jordanie', emoji: '🇯🇴', continent: 'middle_east',
        keywords: ['Jordan', 'Jordanie', 'Amman', 'Jordanian', 'jordanien', 'Abdullah'],
    },
    AE: {
        name: 'EAU', emoji: '🇦🇪', continent: 'middle_east',
        keywords: ['UAE', 'EAU', 'Dubai', 'Dubaï', 'Abu Dhabi', 'Emirati', 'émirat', 'Abraham Accords', 'Accords Abraham'],
    },
    PS: {
        name: 'Palestine', emoji: '🇵🇸', continent: 'middle_east',
        keywords: ['Palestine', 'Palestinian', 'palestinien', 'West Bank', 'Cisjordanie', 'Hamas', 'Ramallah', 'Fatah', 'UNRWA', 'Rafah', 'Khan Younis'],
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
        keywords: ['Pakistan', 'Islamabad', 'Pakistani', 'pakistanais', 'Karachi', 'Lahore', 'ISI', 'Balochistan', 'Taliban', 'Khan', 'Sharif'],
    },
    AF: {
        name: 'Afghanistan', emoji: '🇦🇫', continent: 'asia',
        keywords: ['Afghanistan', 'Kabul', 'Kaboul', 'Afghan', 'Taliban', 'Talibans', 'Kandahar', 'ISIS-K', 'Daesh Khorasan'],
    },
    MM: {
        name: 'Myanmar', emoji: '🇲🇲', continent: 'asia',
        keywords: ['Myanmar', 'Burma', 'Birmanie', 'Naypyidaw', 'Rangoon', 'Yangon', 'Rohingya', 'junta birmane', 'SAC Myanmar', 'PDF Myanmar', 'Rakhine'],
    },
    PH: {
        name: 'Philippines', emoji: '🇵🇭', continent: 'asia',
        keywords: ['Philippines', 'Manila', 'Manille', 'Filipino', 'philippin', 'Marcos', 'Scarborough', 'Spratly'],
    },
    VN: {
        name: 'Vietnam', emoji: '🇻🇳', continent: 'asia',
        keywords: ['Vietnam', 'Hanoi', 'Hanoï', 'Vietnamese', 'vietnamien', 'Ho Chi Minh City'],
    },
    TH: {
        name: 'Thaïlande', emoji: '🇹🇭', continent: 'asia',
        keywords: ['Thailand', 'Thaïlande', 'Bangkok', 'Thai', 'thaïlandais'],
    },
    ID: {
        name: 'Indonésie', emoji: '🇮🇩', continent: 'asia',
        keywords: ['Indonesia', 'Indonésie', 'Jakarta', 'Indonesian', 'indonésien', 'Prabowo', 'Bali', 'Papua Indonesia'],
    },
    KZ: {
        name: 'Kazakhstan', emoji: '🇰🇿', continent: 'asia',
        keywords: ['Kazakhstan', 'Astana', 'Almaty', 'Kazakh', 'kazakhstanais', 'Tokayev'],
    },
    BD: {
        name: 'Bangladesh', emoji: '🇧🇩', continent: 'asia',
        keywords: ['Bangladesh', 'Dhaka', 'Bangladeshi', 'bangladais', 'Hasina', 'Yunus'],
    },
    // Pays fréquents pour les séismes (Bug 3 fix)
    NZ: {
        name: 'Nouvelle-Zélande', emoji: '🇳🇿', continent: 'asia',
        keywords: ['New Zealand', 'Nouvelle-Zélande', 'Wellington', 'Auckland', 'Christchurch', 'Kiwi', 'New Zealander'],
    },
    PG: {
        name: 'Papouasie-Nouvelle-Guinée', emoji: '🇵🇬', continent: 'asia',
        keywords: ['Papua New Guinea', 'Papouasie-Nouvelle-Guinée', 'Port Moresby', 'PNG', 'Papua New Guinean'],
    },
    VU: {
        name: 'Vanuatu', emoji: '🇻🇺', continent: 'asia',
        keywords: ['Vanuatu', 'Port Vila', 'ni-Vanuatu'],
    },
    TO: {
        name: 'Tonga', emoji: '🇹🇴', continent: 'asia',
        keywords: ['Tonga', "Nuku'alofa", 'Tongan'],
    },
    FJ: {
        name: 'Fidji', emoji: '🇫🇯', continent: 'asia',
        keywords: ['Fiji', 'Fidji', 'Suva', 'Fijian'],
    },
    SB: {
        name: 'Îles Salomon', emoji: '🇸🇧', continent: 'asia',
        keywords: ['Solomon Islands', 'Îles Salomon', 'Honiara', 'Solomon'],
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
        keywords: ['Democratic Republic of Congo', 'DRC', 'RDC', 'Kinshasa', 'Congolese', 'congolais', 'M23', 'Goma', 'Kivu', 'Tshisekedi', 'FARDC', 'FDLR', 'Bukavu'],
    },
    SO: {
        name: 'Somalie', emoji: '🇸🇴', continent: 'africa',
        keywords: ['Somalia', 'Somalie', 'Mogadishu', 'Mogadiscio', 'Somali', 'somalien', 'Al-Shabaab', 'AMISOM', 'ATMIS', 'piracy somalienne'],
    },
    LY: {
        name: 'Libye', emoji: '🇱🇾', continent: 'africa',
        keywords: ['Libya', 'Libye', 'Tripoli libye', 'Libyan', 'libyen', 'Benghazi', 'Haftar', 'GNU', 'LNA', 'Dbeibah'],
    },
    ML: {
        name: 'Mali', emoji: '🇲🇱', continent: 'africa',
        keywords: ['Mali', 'Bamako', 'Malian', 'malien', 'Sahel', 'JNIM', 'Africa Corps Mali', 'GSIM', 'AQIM', 'Goïta', 'Tombouctou'],
    },
    BF: {
        name: 'Burkina Faso', emoji: '🇧🇫', continent: 'africa',
        keywords: ['Burkina Faso', 'Ouagadougou', 'burkinabè', 'Traoré Burkina', 'VDP', 'jihadiste Burkina'],
    },
    NE: {
        name: 'Niger', emoji: '🇳🇪', continent: 'africa',
        keywords: ['Niger', 'Niamey', 'nigérien', 'Sahel Niger', 'CNSP', 'Tiani', 'Bazoum'],
    },
    ZA: {
        name: 'Afrique du Sud', emoji: '🇿🇦', continent: 'africa',
        keywords: ['South Africa', 'Afrique du Sud', 'Pretoria', 'Johannesburg', 'Cape Town', 'Le Cap', 'Ramaphosa', 'ANC', 'BRICS Afrique du Sud'],
    },
    KE: {
        name: 'Kenya', emoji: '🇰🇪', continent: 'africa',
        keywords: ['Kenya', 'Nairobi', 'Kenyan', 'kényan', 'Ruto', 'Mombasa'],
    },
    MZ: {
        name: 'Mozambique', emoji: '🇲🇿', continent: 'africa',
        keywords: ['Mozambique', 'Maputo', 'Mozambican', 'mozambicain', 'Cabo Delgado', 'RENAMO'],
    },
    TD: {
        name: 'Tchad', emoji: '🇹🇩', continent: 'africa',
        keywords: ['Chad', 'Tchad', "N'Djamena", 'Chadian', 'tchadien', 'Déby', 'Sahel Tchad'],
    },
    CF: {
        name: 'Centrafrique', emoji: '🇨🇫', continent: 'africa',
        keywords: ['Central African Republic', 'Centrafrique', 'CAR', 'Bangui', 'Africa Corps CAR', 'Touadéra'],
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
        keywords: ['United States', 'USA', 'États-Unis', 'Washington DC', 'American', 'américain', 'White House', 'Maison Blanche', 'Pentagon', 'Pentagone', 'US Congress', 'Biden', 'Trump', 'New York', 'California', 'CIA', 'NSA', 'State Department', 'Département d\'État'],
    },
    BR: {
        name: 'Brésil', emoji: '🇧🇷', continent: 'americas',
        keywords: ['Brazil', 'Brésil', 'Brasilia', 'Brasília', 'Brazilian', 'brésilien', 'Lula', 'São Paulo', 'Rio de Janeiro', 'Amazonie'],
    },
    MX: {
        name: 'Mexique', emoji: '🇲🇽', continent: 'americas',
        keywords: ['Mexico', 'Mexique', 'Mexico City', 'Mexican', 'mexicain', 'cartel mexicain', 'Sheinbaum', 'Sinaloa', 'CJNG', 'fentanyl Mexique'],
    },
    CA: {
        name: 'Canada', emoji: '🇨🇦', continent: 'americas',
        keywords: ['Canada', 'Ottawa', 'Canadian', 'canadien', 'Trudeau', 'Carney', 'Toronto', 'Vancouver', 'Quebec', 'Québec', 'Arctique canadien'],
    },
    CO: {
        name: 'Colombie', emoji: '🇨🇴', continent: 'americas',
        keywords: ['Colombia', 'Colombie', 'Bogota', 'Bogotá', 'Colombian', 'colombien', 'FARC', 'Petro', 'ELN', 'narcotrafic Colombie'],
    },
    VE: {
        name: 'Venezuela', emoji: '🇻🇪', continent: 'americas',
        keywords: ['Venezuela', 'Caracas', 'Venezuelan', 'vénézuélien', 'Maduro', 'Gonzalez Venezuela', 'Machado', 'Guyana Esequiba'],
    },
    AR: {
        name: 'Argentine', emoji: '🇦🇷', continent: 'americas',
        keywords: ['Argentina', 'Argentine', 'Buenos Aires', 'Argentinian', 'argentin', 'Milei', 'Falklands', 'Malouines'],
    },
    // Bug 3 fix: Chile déjà présent mais keywords mieux délimités
    CL: {
        name: 'Chili', emoji: '🇨🇱', continent: 'americas',
        keywords: ['Chile', 'Chili', 'Santiago du Chili', 'Chilean', 'chilien', 'Boric', 'lithium Chili', 'cuivre Chili'],
    },
    CU: {
        name: 'Cuba', emoji: '🇨🇺', continent: 'americas',
        keywords: ['Cuba', 'Havana', 'La Havane', 'Cuban', 'cubain', 'embargo Cuba', 'Diaz-Canel', 'Guantanamo'],
    },
    HT: {
        name: 'Haïti', emoji: '🇭🇹', continent: 'americas',
        keywords: ['Haiti', 'Haïti', 'Port-au-Prince', 'Haitian', 'haïtien', 'gang haïtien', 'BINUH'],
    },
    EC: {
        name: 'Équateur', emoji: '🇪🇨', continent: 'americas',
        keywords: ['Ecuador', 'Équateur', 'Quito', 'Ecuadorian', 'équatorien', 'Noboa'],
    },
    // Bug 3 fix: Peru avec keywords mieux délimités
    PE: {
        name: 'Pérou', emoji: '🇵🇪', continent: 'americas',
        keywords: ['Peru', 'Pérou', 'Lima Pérou', 'Peruvian', 'péruvien', 'Boluarte', 'Sendero Luminoso'],
    },
    NI: {
        name: 'Nicaragua', emoji: '🇳🇮', continent: 'americas',
        keywords: ['Nicaragua', 'Managua', 'Nicaraguan', 'nicaraguayen', 'Ortega Nicaragua'],
    },
    // Bug 3 fix: pays supplémentaires pour les séismes
    GT: {
        name: 'Guatemala', emoji: '🇬🇹', continent: 'americas',
        keywords: ['Guatemala', 'Guatemala City', 'Guatemalan', 'guatémaltèque'],
    },
    SV: {
        name: 'Salvador', emoji: '🇸🇻', continent: 'americas',
        keywords: ['El Salvador', 'Salvador', 'San Salvador', 'Salvadoran', 'salvadorien', 'Bukele'],
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

// ─── MOTS PARASITES À IGNORER (évitent les faux positifs) ─────────────────
// Ces termes géographiques courants ne doivent PAS déclencher un match de pays
// Ex: "60 km south of" ne doit pas matcher "South Africa"
const FALSE_POSITIVE_PATTERNS = [
    /\b(\d+)\s*km\s+(north|south|east|west)\s+of\b/i,
    /\b(north|south|east|west)\s+of\b/i,
    /\b(northern|southern|eastern|western)\s+(region|part|coast|border|flank|sector)\b/i,
];

/**
 * Vérifie si le texte contient un keyword avec un vrai word boundary
 * @param {string} textLower - Texte en minuscules
 * @param {string} keyword - Mot-clé à chercher
 * @returns {boolean}
 */
function matchesKeyword(textLower, keyword) {
    const kw = keyword.toLowerCase();
    // Utiliser une regex avec word boundaries pour éviter les correspondances partielles
    // On échappe les caractères spéciaux sauf les espaces
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // \b fonctionne sur les lettres ASCII — pour les caractères accentués on utilise
    // une approche basée sur les séparateurs de mots (espace, ponctuation)
    const pattern = new RegExp(
        `(?:^|[\\s,;.!?:"'(\\[{/<>])${escaped}(?:$|[\\s,;.!?:"')\\]}>/<])`,
        'i'
    );
    return pattern.test(textLower) || textLower === kw;
}

/**
 * Détecte le pays mentionné dans un texte via les mots-clés
 * Utilise des word boundaries pour éviter les faux positifs
 * @param {string} text - Texte à analyser (titre + description recommandé)
 * @returns {string|null} Code ISO du pays ou null
 */
function detectCountry(text) {
    if (!text) return null;

    // Vérifier si le texte contient des patterns parasites (ex: "south of the city")
    const hasDirectionalNoise = FALSE_POSITIVE_PATTERNS.some(p => p.test(text));

    const textLower = text.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [code, data] of Object.entries(COUNTRIES)) {
        let score = 0;
        let nameMatchBonus = 0;

        for (const kw of data.keywords) {
            // Pour les mots-clés courts ou directionnels, exiger un match exact
            const kwLower = kw.toLowerCase();

            // Si le texte a du bruit directionnel, ignorer les mots-clés qui
            // sont des mots directionnels seuls (ex: "South Africa" → vérifier précisément)
            if (hasDirectionalNoise && kwLower.length <= 12 && /^(north|south|east|west)/i.test(kwLower)) {
                // Exiger un match strict pour éviter les faux positifs
                if (!matchesKeyword(textLower, kw)) continue;
            } else if (!textLower.includes(kwLower)) {
                continue;
            }

            // Score de base
            score++;

            // Bonus pour les mots-clés longs (plus spécifiques)
            if (kw.length > 8) score++;
            if (kw.length > 15) score++; // Encore plus spécifique

            // Bonus FORT si c'est le nom officiel du pays (1er keyword défini comme nom)
            if (kwLower === data.name.toLowerCase() || kwLower === `${data.name.toLowerCase()}`) {
                nameMatchBonus += 5;
            }
        }

        const finalScore = score + nameMatchBonus;
        if (finalScore > bestScore) {
            bestScore = finalScore;
            bestMatch = code;
        }
    }

    // Seuil minimum : au moins 1 point pour éviter les matches accidentels
    return bestScore >= 1 ? bestMatch : null;
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
        europe: ['european union', 'europe', 'européen', 'nato', 'otan', ' eu ', ' ue '],
        middle_east: ['middle east', 'moyen-orient', 'golfe persique', 'persian gulf', 'levant'],
        asia: ['south-east asia', 'southeast asia', 'asia pacific', 'indo-pacific', 'asie'],
        africa: ['sub-saharan africa', 'saharan africa', 'west africa', 'east africa', 'afrique', 'sahel'],
        americas: ['latin america', 'amérique latine', 'caribbean', 'caraïbes', 'south america', 'amérique du sud'],
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
