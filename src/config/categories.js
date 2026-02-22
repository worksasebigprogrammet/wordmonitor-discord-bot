/**
 * src/config/categories.js
 * Catégories de news du bot WorldMonitor
 * Chaque catégorie a : nom multilingue, icône, couleur, mots-clés pondérés (FR/EN/AR)
 * Utilisé pour la classification automatique des articles
 */

'use strict';

const CATEGORIES = {
    // ──────────────────────────────────────────────────────────────────────
    // ⚔️ CONFLITS ARMÉS
    // ──────────────────────────────────────────────────────────────────────
    conflicts: {
        name: { en: 'Armed Conflicts', fr: 'Conflits Armés' },
        icon: '⚔️',
        color: '#FF0000',
        colorInt: 0xFF0000,
        channelName: 'conflits-armes',
        priority: 1,
        keywords: {
            en: [
                'war', 'battle', 'airstrike', 'air strike', 'bombing', 'offensive', 'troops',
                'military operation', 'combat', 'shelling', 'missile strike', 'artillery',
                'invasion', 'frontline', 'front line', 'casualties', 'killed in action',
                'wounded', 'ceasefire', 'cease-fire', 'escalation', 'clashes', 'siege',
                'ambush', 'insurgency', 'guerrilla', 'counteroffensive', 'occupation',
                'liberated', 'captured', 'ground offensive', 'drone attack', 'IED',
                'rocket attack', 'mortar', 'warplane', 'fighter jet', 'tank',
            ],
            fr: [
                'guerre', 'bataille', 'frappe aérienne', 'bombardement', 'offensive',
                'troupes', 'opération militaire', 'combat', 'obus', 'missile', 'artillerie',
                'invasion', 'front', 'victimes', 'morts', 'blessés', 'cessez-le-feu',
                'escalade', 'affrontements', 'siège', 'embuscade', 'insurrection',
                'contre-offensive', 'occupation', 'libéré', 'capturé', 'offensive terrestre',
                'attaque de drone', 'roquette', 'char', 'avion de guerre',
            ],
        },
    },

    // ──────────────────────────────────────────────────────────────────────
    // 🎖️ MOUVEMENTS MILITAIRES
    // ──────────────────────────────────────────────────────────────────────
    military_movements: {
        name: { en: 'Military Movements', fr: 'Mouvements Militaires' },
        icon: '🎖️',
        color: '#8B0000',
        colorInt: 0x8B0000,
        channelName: 'mouvements-militaires',
        priority: 2,
        keywords: {
            en: [
                'troop deployment', 'military buildup', 'naval fleet', 'aircraft carrier',
                'military convoy', 'troop movement', 'mobilization', 'military exercise',
                'drills', 'deployment', 'reinforcements', 'military base', 'garrison',
                'battalion', 'brigade', 'regiment', 'special forces', 'OSINT',
                'satellite imagery', 'surveillance', 'reconnaissance', 'warship',
                'submarine', 'destroyer', 'frigate', 'amphibious', 'paratrooper',
                'airborne', 'military buildup', 'force posture', 'alert level',
            ],
            fr: [
                'déploiement de troupes', 'renforcement militaire', 'flotte navale',
                'porte-avions', 'convoi militaire', 'mouvement de troupes', 'mobilisation',
                'exercice militaire', 'manœuvres', 'déploiement', 'renforts', 'base militaire',
                'garnison', 'bataillon', 'brigade', 'régiment', 'forces spéciales',
                'imagerie satellite', 'surveillance', 'reconnaissance', 'navire de guerre',
                'sous-marin', 'destroyer', 'frégate', 'amphibie', 'parachutiste',
            ],
        },
    },

    // ──────────────────────────────────────────────────────────────────────
    // ⚛️ NUCLÉAIRE
    // ──────────────────────────────────────────────────────────────────────
    nuclear: {
        name: { en: 'Nuclear', fr: 'Nucléaire' },
        icon: '⚛️',
        color: '#FFD700',
        colorInt: 0xFFD700,
        channelName: 'nucleaire',
        priority: 1,
        keywords: {
            en: [
                'nuclear', 'atomic', 'uranium', 'plutonium', 'ICBM', 'nuclear warhead',
                'nuclear test', 'radiation', 'nuclear reactor', 'enrichment',
                'nonproliferation', 'non-proliferation', 'nuclear deal', 'IAEA',
                'nuclear deterrent', 'nuclear submarine', 'thermonuclear', 'fallout',
                'Doomsday Clock', 'dirty bomb', 'radiological', 'nuclear arsenal',
                'Hiroshima', 'Nagasaki', 'NPT', 'nuclear strike', 'hydrogen bomb',
                'fissile material', 'centrifuge', 'Natanz', 'Bushehr',
            ],
            fr: [
                'nucléaire', 'atomique', 'uranium', 'plutonium', 'ICBM', 'ogive nucléaire',
                'essai nucléaire', 'radiation', 'réacteur nucléaire', 'enrichissement',
                'non-prolifération', 'accord nucléaire', 'AIEA', 'dissuasion nucléaire',
                'sous-marin nucléaire', 'thermonucléaire', 'retombées radioactives',
                'bombe sale', 'radiologique', 'arsenal nucléaire', 'TNP',
            ],
        },
    },

    // ──────────────────────────────────────────────────────────────────────
    // 💰 ÉCONOMIE & SANCTIONS
    // ──────────────────────────────────────────────────────────────────────
    economy: {
        name: { en: 'Economy & Sanctions', fr: 'Économie & Sanctions' },
        icon: '💰',
        color: '#00CED1',
        colorInt: 0x00CED1,
        channelName: 'economie-mondiale',
        priority: 3,
        keywords: {
            en: [
                'sanctions', 'embargo', 'trade war', 'tariff', 'economic crisis', 'inflation',
                'recession', 'GDP', 'central bank', 'interest rate', 'stock market crash',
                'default', 'bailout', 'currency', 'SWIFT', 'OFAC', 'treasury',
                'economic collapse', 'debt crisis', 'supply chain', 'oil price', 'gas price',
                'commodity', 'IMF', 'World Bank', 'WTO', 'G7', 'G20', 'BRICS',
                'hyperinflation', 'devaluation', 'bank run', 'bankruptcy',
            ],
            fr: [
                'sanctions', 'embargo', 'guerre commerciale', 'tarif douanier', 'crise économique',
                'inflation', 'récession', 'PIB', 'banque centrale', 'taux d\'intérêt',
                'krach boursier', 'défaut de paiement', 'renflouement', 'devise',
                'effondrement économique', 'crise de la dette', 'chaîne d\'approvisionnement',
                'prix du pétrole', 'prix du gaz', 'FMI', 'Banque mondiale', 'OMC',
                'hyperinflation', 'dévaluation', 'ruée bancaire', 'faillite',
            ],
        },
    },

    // ──────────────────────────────────────────────────────────────────────
    // 🚢 MARITIME & VOIES NAVIGABLES
    // ──────────────────────────────────────────────────────────────────────
    maritime: {
        name: { en: 'Maritime & Waterways', fr: 'Maritime & Voies Navigables' },
        icon: '🚢',
        color: '#1E90FF',
        colorInt: 0x1E90FF,
        channelName: 'maritime',
        priority: 2,
        keywords: {
            en: [
                'strait', 'Hormuz', 'Bab el-Mandeb', 'Red Sea', 'Suez Canal', 'Panama Canal',
                'Malacca', 'South China Sea', 'Taiwan Strait', 'Black Sea', 'naval blockade',
                'ship seized', 'tanker', 'cargo ship', 'maritime security', 'piracy',
                'Houthi', 'shipping route', 'vessel', 'port', 'naval mine', 'sea mine',
                'warship', 'coast guard', 'maritime patrol', 'Freedom of Navigation',
                'FONOP', 'sea lane', 'chokepoint', 'merchant vessel',
            ],
            fr: [
                'détroit', 'Ormuz', 'Bab el-Mandeb', 'mer Rouge', 'canal de Suez',
                'canal de Panama', 'Malacca', 'mer de Chine', 'détroit de Taïwan',
                'mer Noire', 'blocus naval', 'navire saisi', 'pétrolier', 'cargo',
                'sécurité maritime', 'piraterie', 'Houthi', 'route maritime', 'navire',
                'port', 'mine navale', 'garde-côtes', 'liberté de navigation',
            ],
        },
    },

    // ──────────────────────────────────────────────────────────────────────
    // 🌊 CATASTROPHES NATURELLES
    // ──────────────────────────────────────────────────────────────────────
    natural_disasters: {
        name: { en: 'Natural Disasters', fr: 'Catastrophes Naturelles' },
        icon: '🌊',
        color: '#FF8C00',
        colorInt: 0xFF8C00,
        channelName: 'catastrophes-naturelles',
        priority: 2,
        keywords: {
            en: [
                'earthquake', 'tsunami', 'hurricane', 'typhoon', 'cyclone', 'tornado',
                'flood', 'wildfire', 'volcano', 'eruption', 'landslide', 'drought',
                'heatwave', 'blizzard', 'storm', 'magnitude', 'epicenter', 'evacuation',
                'natural disaster', 'climate emergency', 'aftershock', 'seismic',
                'USGS', 'NOAA', 'flash flood', 'storm surge', 'Category 5', 'Category 4',
                'emergency declaration', 'state of emergency', 'disaster zone',
            ],
            fr: [
                'séisme', 'tremblement de terre', 'tsunami', 'ouragan', 'typhon', 'cyclone',
                'tornade', 'inondation', 'feu de forêt', 'incendie', 'volcan', 'éruption',
                'glissement de terrain', 'sécheresse', 'canicule', 'tempête', 'magnitude',
                'épicentre', 'évacuation', 'catastrophe naturelle', 'réplique sismique',
                'crue éclair', 'onde de tempête', 'état d\'urgence', 'zone sinistrée',
            ],
        },
    },

    // ──────────────────────────────────────────────────────────────────────
    // 🔴 TERRORISME & SÉCURITÉ
    // ──────────────────────────────────────────────────────────────────────
    terrorism: {
        name: { en: 'Terrorism & Security', fr: 'Terrorisme & Sécurité' },
        icon: '🔴',
        color: '#DC143C',
        colorInt: 0xDC143C,
        channelName: 'terrorisme-securite',
        priority: 1,
        keywords: {
            en: [
                'terrorist attack', 'terrorism', 'ISIS', 'ISIL', 'Al-Qaeda', 'Al-Shabaab',
                'bomb threat', 'hostage', 'mass shooting', 'extremist', 'radicalization',
                'counterterrorism', 'threat level', 'security alert', 'active shooter',
                'lone wolf', 'suicide bomber', 'IED', 'car bomb', 'stabbing',
                'knife attack', 'Daesh', 'jihadist', 'militant', 'JNIM', 'Boko Haram',
                'Taliban', 'Hezbollah attack', 'Hamas attack', 'plot foiled',
            ],
            fr: [
                'attentat', 'terrorisme', 'Daesh', 'Al-Qaïda', 'alerte à la bombe', 'otage',
                'fusillade', 'extrémiste', 'radicalisation', 'antiterrorisme', 'niveau d\'alerte',
                'alerte sécurité', 'Vigipirate', 'kamikaze', 'engin explosif', 'voiture piégée',
                'attaque au couteau', 'djihadiste', 'militant', 'attentat déjoué',
            ],
        },
    },

    // ──────────────────────────────────────────────────────────────────────
    // 📡 PANNES & BLACKOUTS
    // ──────────────────────────────────────────────────────────────────────
    outages: {
        name: { en: 'Outages & Blackouts', fr: 'Pannes & Blackouts' },
        icon: '📡',
        color: '#4B0082',
        colorInt: 0x4B0082,
        channelName: 'pannes-blackouts',
        priority: 3,
        keywords: {
            en: [
                'internet shutdown', 'blackout', 'power outage', 'communication cut',
                'internet censorship', 'network down', 'social media blocked', 'VPN ban',
                'infrastructure attack', 'cyber attack', 'cyberattack', 'grid failure',
                'service disruption', 'NetBlocks', 'OONI', 'internet cut', 'web blocked',
                'power grid', 'electricity outage', 'telecom disruption', 'cable cut',
                'undersea cable', 'satellite jamming',
            ],
            fr: [
                'coupure internet', 'blackout', 'panne de courant', 'coupure de communication',
                'censure internet', 'réseau en panne', 'réseaux sociaux bloqués',
                'VPN interdit', 'attaque infrastructure', 'cyberattaque', 'panne réseau',
                'réseau électrique', 'coupure télécoms', 'câble sous-marin', 'brouillage satellite',
            ],
        },
    },

    // ──────────────────────────────────────────────────────────────────────
    // 🏥 SANTÉ & ÉPIDÉMIES
    // ──────────────────────────────────────────────────────────────────────
    health: {
        name: { en: 'Health & Epidemics', fr: 'Santé & Épidémies' },
        icon: '🏥',
        color: '#32CD32',
        colorInt: 0x32CD32,
        channelName: 'sante-epidemies',
        priority: 2,
        keywords: {
            en: [
                'pandemic', 'epidemic', 'outbreak', 'virus', 'WHO', 'quarantine',
                'vaccination', 'disease', 'health emergency', 'bird flu', 'Ebola',
                'cholera', 'plague', 'SARS', 'COVID', 'mpox', 'monkeypox', 'pathogen',
                'Public Health Emergency', 'PHEIC', 'containment', 'contact tracing',
                'fatality rate', 'mortality', 'case count', 'variant', 'mutation',
                'antiviral', 'biosafety', 'bioterrorism', 'H5N1', 'H1N1',
            ],
            fr: [
                'pandémie', 'épidémie', 'foyer épidémique', 'virus', 'OMS', 'quarantaine',
                'vaccination', 'maladie', 'urgence sanitaire', 'grippe aviaire', 'Ebola',
                'choléra', 'peste', 'variole du singe', 'pathogène', 'urgence sanitaire publique',
                'confinement', 'traçage des contacts', 'taux de mortalité', 'variant', 'mutation',
                'antiviral', 'biosécurité', 'bioterrorisme',
            ],
        },
    },

    // ──────────────────────────────────────────────────────────────────────
    // 🤝 DIPLOMATIE
    // ──────────────────────────────────────────────────────────────────────
    diplomacy: {
        name: { en: 'Diplomacy', fr: 'Diplomatie' },
        icon: '🤝',
        color: '#9370DB',
        colorInt: 0x9370DB,
        channelName: 'diplomatie',
        priority: 3,
        keywords: {
            en: [
                'summit', 'treaty', 'diplomacy', 'ambassador', 'UN General Assembly',
                'Security Council', 'NATO', 'EU summit', 'bilateral talks', 'peace deal',
                'negotiations', 'alliance', 'G7', 'G20', 'BRICS', 'diplomatic crisis',
                'expulsion diplomat', 'recalled ambassador', 'diplomatic relations',
                'foreign minister', 'secretary of state', 'state visit', 'memorandum',
                'communiqué', 'joint statement', 'multilateral', 'UN resolution', 'veto',
            ],
            fr: [
                'sommet', 'traité', 'diplomatie', 'ambassadeur', 'Assemblée générale ONU',
                'Conseil de sécurité', 'OTAN', 'sommet UE', 'pourparlers', 'accord de paix',
                'négociations', 'alliance', 'crise diplomatique', 'expulsion diplomate',
                'rappel d\'ambassadeur', 'relations diplomatiques', 'ministre des affaires étrangères',
                'visite officielle', 'résolution ONU', 'veto', 'multilatéral',
            ],
        },
    },
};

/**
 * Classifie un texte dans une catégorie via les mots-clés
 * @param {string} text - Texte à analyser (titre + description)
 * @param {string} lang - Langue du texte ('en'|'fr')
 * @returns {{ category: string, confidence: number }} Catégorie et confiance (0-1)
 */
function classifyCategory(text, lang = 'en') {
    if (!text) return { category: 'diplomacy', confidence: 0 };
    const textLower = text.toLowerCase();
    let bestCategory = 'diplomacy';
    let bestScore = 0;

    for (const [catKey, catData] of Object.entries(CATEGORIES)) {
        const keywords = catData.keywords[lang] || catData.keywords.en;
        let score = 0;
        for (const kw of keywords) {
            if (textLower.includes(kw.toLowerCase())) {
                score++;
                // Priorité supérieure pour les catégories haute importance
                if (catData.priority === 1) score += 0.5;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestCategory = catKey;
        }
    }

    const confidence = Math.min(bestScore / 3, 1); // Normalisation grossière
    return { category: bestCategory, confidence };
}

module.exports = { CATEGORIES, classifyCategory };
