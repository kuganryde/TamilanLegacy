/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EpigraphEntry {
  id: string;
  term: string;
  tamilTerm: string;
  transliteration: string;
  category: 'Administration' | 'Architecture' | 'Maritime & Navy' | 'Society & Guilds' | 'Culture & Arts' | 'Economy';
  inscriptionSource: string; // e.g. "Thanjavur Peruvudaiyar Temple Inscription, 1010 CE"
  historicalPeriod: string;  // e.g. "Rajaraja Chola I (985–1014 CE)"
  shortSummary: string;
  detailedLore: string;
  gameImpact: string;
  originalInscriptionQuote?: string; // e.g. "Kanthaloor Salai Kalamarutharuliyya..."
  relatedTerms?: string[];
  icon: string;
}

export const EPIGRAPHICAL_DATABASE: EpigraphEntry[] = [
  {
    id: 'meikirthi',
    term: 'Meikirthi',
    tamilTerm: 'மெய்க்கீர்த்தி',
    transliteration: 'Meikkīrtti',
    category: 'Administration',
    inscriptionSource: 'Thanjavur South Wall & Tiruvalangadu Copper Plates (1010 CE)',
    historicalPeriod: 'Rajaraja Chola I & Rajendra Chola I',
    shortSummary: 'Official verse prologues carved into stone temple walls recording the exact historical deeds, conquests, and tax decrees of the reigning Chola monarch.',
    detailedLore: `
      Rajaraja Chola I pioneered the practice of beginning royal inscriptions with an authentic poetic historical prologue called *Meikirthi* ("True Praise"). Prior to Rajaraja, Indian rulers listed genealogy without dates or detailed events. Rajaraja standardized royal scribes to log battle outcomes, conquest timelines, naval victories at Kanthaloor Salai, Sri Lanka (Eelam), and Malaya.
      
      These inscriptions were etched onto temple granite walls so they could never be forged or erased, serving as legal public archives for tax rates, land grants (*Brahmadeyam*), and town administration (*Nagara*).
    `,
    gameImpact: 'Increases Cultural Devotion (Anbu) generation and unlocks higher tier Olai Chuvadi technologies.',
    originalInscriptionQuote: 'திருமகள் போல பெருநிலச் செல்வியும் தனுக்குரிமை பூண்டமை மனக்கொளகாந்த்ளூர்ச் சாலை களமறுத்தருளி...',
    relatedTerms: ['rajaraja', 'olai_chuvadi', 'kalvettu'],
    icon: '📜'
  },
  {
    id: 'kudavolai',
    term: 'Kudavolai System',
    tamilTerm: 'குடவோலை',
    transliteration: 'Kuṭavōlai',
    category: 'Administration',
    inscriptionSource: 'Uttiramerur Vaikunda Perumal Temple Inscription (920 CE)',
    historicalPeriod: 'Parantaka Chola I',
    shortSummary: 'The democratic secret-ballot electoral system where village council members were chosen by drawing written palm leaf slips from a pot.',
    detailedLore: `
      The Uttiramerur wall inscriptions contain the world's most precise ancient constitution for village self-governance (*Sabha*). The village was divided into 30 wards (*Kudumbu*). Eligible candidates had to own land, pay taxes, be aged 35–70, possess Vedic knowledge, and demonstrate honesty. 
      
      On election day, names were written on palm leaves, placed inside a sealed pot (*Kudam*), and drawn by a young innocent child. Strict disqualification rules applied: anyone who committed theft, failed to submit audited financial accounts, or committed crimes was banned along with their relatives.
    `,
    gameImpact: 'Reduces corruption, lowers Sabotage risk, and boosts Ur (Paddy) productivity.',
    originalInscriptionQuote: '30 குடும்பிலும் குடும்பால் ஒரு ஒருத்தனாக குடவோலைக்கு பெயர் எழுதி குடத்தில் இட்டு...',
    relatedTerms: ['ur', 'nagar', 'olai_chuvadi'],
    icon: '🏺'
  },
  {
    id: 'brihadeeswarar',
    term: 'Peruvudaiyar Kovil (Brihadeeswarar)',
    tamilTerm: 'பெருவுடையார் கோவில்',
    transliteration: 'Peruvuṭaiyār Kōvil',
    category: 'Architecture',
    inscriptionSource: 'Thanjavur Temple Granite Inscriptions (1010 CE)',
    historicalPeriod: 'Rajaraja Chola I (Completed 1010 CE)',
    shortSummary: 'The world\'s first all-granite Vimana temple tower standing at 216 feet, crowned with an 80-ton single stone capstone (Kumbam).',
    detailedLore: `
      Built by chief royal architect Kunjara Mallan Raja Raja Perunthachan under Rajaraja Chola I, the temple vimana was completed in just 5 years using over 130,000 tons of granite—sourced from stone quarries miles away. 
      
      An inclined earth ramp spanning 4 miles (6.4 km) was constructed to drag the monolithic 80-ton golden *Kumbam* capstone to the summit using hundreds of war elephants and pulleys. The temple walls record every donated bronze idol, gold ornament, and the exact names of 400 temple dancers, musicians, and goldsmiths.
    `,
    gameImpact: 'Unlocks the final Consecration Campaign Phase and generates maximum Anbu (Devotion) and Aruvam (Wealth).',
    originalInscriptionQuote: 'நாம் குடுத்தவும் நம் అక్కனும் நம் பெண்டுகளும் குடுத்தவும் கல்லிலே வெட்டிக்கொள்க...',
    relatedTerms: ['kumbam', 'gopuram', 'architect_mallan'],
    icon: '🛕'
  },
  {
    id: 'kadal_pira',
    term: 'Kadal Pira (Chola Imperial Navy)',
    tamilTerm: 'கடற்படை',
    transliteration: 'Kaṭaṟpaṭai',
    category: 'Maritime & Navy',
    inscriptionSource: 'Tiruvalangadu & Tanjore Wall Plates (1025 CE)',
    historicalPeriod: 'Rajendra Chola I',
    shortSummary: 'The feared blue-water Chola armada that projected naval supremacy across the Bay of Bengal, Srivijaya (Indonesia/Malaysia), and Maldives.',
    detailedLore: `
      Under Rajendra Chola I, the Chola Navy (*Kadal Pira*) became the dominant maritime force in the Indian Ocean. The Cholas constructed multi-masted war vessels equipped with flame-throwers, archers, and ramming bows at Nagapattinam port.
      
      In 1025 CE, Rajendra launched an unprecedented trans-oceanic expedition across 3,000 km of open sea to defeat the Srivijayan empire, securing maritime trade routes through the Malacca Straits to China. The Bay of Bengal came to be known historically as "The Chola Lake".
    `,
    gameImpact: 'Protects trade routes from pirate raids and increases Aruvam (Wealth) yields from Srivijaya and China routes.',
    originalInscriptionQuote: 'அலைகடல் நடுவுள் பலகலம் செலுத்தி சங்கிராம விஜயோத்துங்க வர்மனை சிறைபிடித்து...',
    relatedTerms: ['admiral', 'manigramam', 'ainnurruvar'],
    icon: '⛵'
  },
  {
    id: 'ainnurruvar',
    term: 'Ainnurruvar Trade Guild (500 Swamis of Ayyavole)',
    tamilTerm: 'ஐந்நூற்றுவர்',
    transliteration: 'Ainnūṟṟuvar',
    category: 'Society & Guilds',
    inscriptionSource: 'Sumatran Inscription & Nagapattinam Copper Plates',
    historicalPeriod: '10th–12th Century CE',
    shortSummary: 'The premier merchant corporation that controlled international trade in spices, silk, horses, and gems across Asia.',
    detailedLore: `
      The *Ainnurruvar* (The Five Hundred) were a powerful autonomous merchant guild with their own mercenary army (*Erivira*) to protect caravans and ships. They issued their own coins, built port infrastructure, and operated trade posts in Sumatra, Thailand, Sri Lanka, and Canton (China).
      
      Together with the *Manigramam* and *Anjuvannam* guilds, they collected trade tariffs, sponsored temple building, and guaranteed economic stability across the empire.
    `,
    gameImpact: 'Accelerates Port City cargo processing and increases Aruvam trade bonuses.',
    relatedTerms: ['manigramam', 'aruvam', 'kadal_pira'],
    icon: '🏺'
  },
  {
    id: 'eri_irrigation',
    term: 'Eri System (Cascade Tank Irrigation)',
    tamilTerm: 'ஏரி பாசனம்',
    transliteration: 'Ēri Pācaṉam',
    category: 'Economy',
    inscriptionSource: 'Grand Anicut (Kallanai) & Gangaikonda Cholapuram Lake Epigraphs',
    historicalPeriod: 'Karikala Chola & Rajendra Chola I',
    shortSummary: 'Advanced civil engineering network of interconnected reservoirs, sluice gates (*Kalingula*), and canals harnessing monsoon floods.',
    detailedLore: `
      The Cholas engineered a sustainable water management network that turned the Kaveri river delta into South India\'s granary (*Punal Nadu*). Large man-made earthen tanks (*Eri*) were built at staggered elevations. Excess water from one tank flowed into the next down the cascade, preventing flooding and storing monsoon rains for dry months.
      
      Specialized village committees (*Eri-variyam*) oversaw desilting, embankment repairs, and water distribution ratios recorded on stone inscriptions.
    `,
    gameImpact: 'Increases Ur Paddy field crop yields by 50% and protects crops during Monsoon Cyclones.',
    originalInscriptionQuote: 'ஏரிவாரியப் பெருமக்கள் மேற்பார்வையில் ஏரி தூம்பு அடைத்து மதகு சீரமைத்து...',
    relatedTerms: ['ur', 'monsoon'],
    icon: '🌊'
  },
  {
    id: 'anai_padai',
    term: 'Anai Padai (Royal Elephant Corps)',
    tamilTerm: 'யானைப்படை',
    transliteration: 'Yāṉaippaṭai',
    category: 'Maritime & Navy',
    inscriptionSource: 'Thanjavur Temple Armory Inscriptions',
    historicalPeriod: 'Rajaraja Chola I',
    shortSummary: 'Heavy war elephant regiments used as battering rams for temple construction ramps and frontline siege battle formations.',
    detailedLore: `
      The Chola army (*Moondrukai Mahasenai*) featured thousands of trained armored war elephants (*Anai Padai*). Elephants were equipped with iron tusks and wooden howdah towers carrying archers and spear-throwers.
      
      During the construction of the 216-ft Brihadeeswarar Vimana, royal elephants hauled 80-ton granite blocks up a 4-mile earthen ramp, demonstrating dual military and architectural engineering mastery.
    `,
    gameImpact: 'Speeds up Capstone ramp construction in Campaign mode and boosts Aalavan military power.',
    relatedTerms: ['aalavan', 'brihadeeswarar'],
    icon: '🐘'
  },
  {
    id: 'olai_chuvadi',
    term: 'Olai Chuvadi (Palm Leaf Manuscripts)',
    tamilTerm: 'ஓலைச்சுவடி',
    transliteration: 'Ōlaiccuvaṭi',
    category: 'Culture & Arts',
    inscriptionSource: 'Saraswathi Mahal Library Epigraphs',
    historicalPeriod: 'Chola Royal Archives',
    shortSummary: 'Specially treated Palmyra palm leaves etched with iron styluses (*Ezhuthani*) holding ancient astronomical, medical, architectural, and literary knowledge.',
    detailedLore: `
      Before paper, Chola scribes recorded administrative land registers, Siddha medical recipes, Vastu Shastra architectural blue prints, and Sangam literature on seasoned palm leaves.
      
      Leaves were boiled in turmeric water, dried, trimmed, and incised with an iron stylus before lampblack charcoal was rubbed into the grooves to make Tamil script readable.
    `,
    gameImpact: 'Primary vehicle for unlocking Siddha, Vastu, Kadal, and Arts technologies in the Palm Leaf Tech Tree.',
    relatedTerms: ['arivu', 'meikirthi'],
    icon: '📜'
  },
  {
    id: 'kudavolai_governance',
    term: 'Nagaram & Ur Assembly',
    tamilTerm: 'நகரமும் ஊரும்',
    transliteration: 'Nakaramum Ūrum',
    category: 'Administration',
    inscriptionSource: 'South Indian Inscriptions Vol II',
    historicalPeriod: '10th Century CE',
    shortSummary: 'Dual administrative divisions separating agrarian peasant villages (Ur) from commercial guild merchant hubs (Nagar).',
    detailedLore: `
      Chola regional administration was divided into *Ur* (agricultural peasant settlements governed by local landholders) and *Nagaram* (market towns governed by merchant assemblies).
      
      Each Nagaram managed market taxation, weights and measures, artisan shops, and gold exchange, operating under royal charters granted directly by Chola kings.
    `,
    gameImpact: 'Optimizes gold and food production in the Nagara Grid Planner.',
    relatedTerms: ['kudavolai', 'ainnurruvar'],
    icon: '🏛️'
  }
];

export function getEpigraphById(id: string): EpigraphEntry | undefined {
  return EPIGRAPHICAL_DATABASE.find(e => e.id.toLowerCase() === id.toLowerCase());
}

export function searchEpigraphs(query: string, categoryFilter?: string): EpigraphEntry[] {
  const q = query.toLowerCase().trim();
  return EPIGRAPHICAL_DATABASE.filter(entry => {
    const matchesCategory = !categoryFilter || categoryFilter === 'All' || entry.category === categoryFilter;
    if (!matchesCategory) return false;

    if (!q) return true;

    return (
      entry.term.toLowerCase().includes(q) ||
      entry.tamilTerm.toLowerCase().includes(q) ||
      entry.transliteration.toLowerCase().includes(q) ||
      entry.shortSummary.toLowerCase().includes(q) ||
      entry.detailedLore.toLowerCase().includes(q) ||
      entry.inscriptionSource.toLowerCase().includes(q)
    );
  });
}
