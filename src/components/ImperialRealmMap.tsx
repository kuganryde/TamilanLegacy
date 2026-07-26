/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Resources, CampaignState, MonsoonWeather } from '../types';
import { audio } from '../utils/audio';
import AnimeWorldSimulation from './AnimeWorldSimulation';
import { 
  Compass, Anchor, Landmark, Users, 
  BookOpen, Sparkles, AlertTriangle, Clock, MapPin, Eye
} from 'lucide-react';

interface ImperialRealmMapProps {
  resources: Resources;
  onEarnResources: (earned: Partial<Resources>) => void;
  onSpendResources: (cost: Partial<Resources>) => boolean;
  campaignState: CampaignState;
  onSetCampaignState: React.Dispatch<React.SetStateAction<CampaignState>>;
  activeTab: string;
  setActiveTab: (tab: 'campaign' | 'grid' | 'port' | 'tech') => void;
  isKappalUnlocked: boolean;
  isRampUnlocked: boolean;
  monsoonWeather?: MonsoonWeather;
}


interface RealmRegion {
  id: string;
  name: string;
  tamilName: string;
  description: string;
  lore: string;
  points: string;
  targetTab: 'campaign' | 'grid' | 'port' | 'tech';
  statRequired?: string;
  resourceType: keyof Resources;
  baseYield: number;
  centerCoords: { x: number; y: number }; // For tooltip and floaters positioning
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export default function ImperialRealmMap({
  resources,
  onEarnResources,
  onSpendResources,
  campaignState,
  onSetCampaignState,
  activeTab,
  setActiveTab,
  isKappalUnlocked,
  isRampUnlocked,
  monsoonWeather
}: ImperialRealmMapProps) {

  
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [floaters, setFloaters] = useState<FloatingText[]>([]);
  const [floaterId, setFloaterId] = useState(0);
  const [viewMode, setViewMode] = useState<'blueprint' | 'anime' | 'both'>('both');

  // Region configuration matching input_file_0.png coordinates (viewBox 1000 x 562)
  const regions: RealmRegion[] = [
    {
      id: 'temple',
      name: 'Peruvudaiyar Temple (Brihadeeswarar)',
      tamilName: 'பெருவுடையார் கோவில்',
      description: 'The majestic imperial sanctuary. The spiritual heart of Rajaraja Cholan\'s conquest.',
      lore: 'The 216-foot high Vimana tower is built with pure granite blocks fitted without mortar, representing peak Chola architecture.',
      points: '320,400 420,100 580,100 620,420 500,550',
      targetTab: 'campaign',
      resourceType: 'anbu',
      baseYield: 8,
      centerCoords: { x: 480, y: 280 }
    },
    {
      id: 'port',
      name: 'Nagapattinam Trade Port & Docks',
      tamilName: 'நாகப்பட்டினம் துறைமுகம்',
      description: 'The secure naval docks hosting the Kadal Pira fleet. Gateway to South-East Asia and China.',
      lore: 'From this port, Raja Raja\'s navy launched trade expeditions with the Song Dynasty and maritime conquests to Srivijaya.',
      points: '0,330 350,330 350,562 0,562',
      targetTab: 'port',
      resourceType: 'aruvam',
      baseYield: 15,
      centerCoords: { x: 180, y: 440 }
    },
    {
      id: 'fields_left',
      name: 'Cauvery River Paddy Fields (Ur Zone)',
      tamilName: 'காவிரி நெல்வயல்',
      description: 'Fertile agricultural Ur zones. Flooded canals nurture the sacred rice crops.',
      lore: 'The Kaveri delta is known as the "Granary of the South". Efficient Eri reservoirs double the annual crop harvest.',
      points: '0,0 450,0 350,260 0,260',
      targetTab: 'grid',
      resourceType: 'aruvam',
      baseYield: 10,
      centerCoords: { x: 200, y: 130 }
    },
    {
      id: 'garrison',
      name: 'Aalavan Military Garrison & Elephants',
      tamilName: 'ஆனைக்குளம் படைமுகாம்',
      description: 'Royal war elephant squadrons and armored cavalry regiments preparing for campaign.',
      lore: 'The Chola army deployed specialized units of master mahouts, bow-carrying elephant guards, and cavalry.',
      points: '600,0 1000,0 1000,400 600,400',
      targetTab: 'campaign',
      resourceType: 'aalavan',
      baseYield: 6,
      centerCoords: { x: 800, y: 200 }
    },
    {
      id: 'scholars',
      name: 'Olai Chuvadi Scholar Assemblies',
      tamilName: 'புலவர் சங்கம் / ஓலைச்சுவடி',
      description: 'Palm leaf administration scrolls capturing royal decrees and Siddha discoveries.',
      lore: 'Scribes etched copper plates and palm-leaf manuscripts to record temple donations, geometry rules, and poetry.',
      points: '910,20 990,20 990,120 910,120',
      targetTab: 'tech',
      resourceType: 'arivu',
      baseYield: 5,
      centerCoords: { x: 950, y: 70 }
    }
  ];

  // Tick down cooldowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          if (next[key] > 0) {
            next[key] -= 1;
            changed = true;
          } else {
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRegionClick = (region: RealmRegion) => {
    const isCooldowned = cooldowns[region.id] > 0;
    
    // 1. Play thematic sound feedback immediately
    if (region.id === 'temple') {
      audio.playBell();
    } else if (region.id === 'garrison') {
      audio.playDrum(true);
    } else if (region.id === 'port') {
      audio.playYazh(349.23); // F4
    } else if (region.id === 'fields_left') {
      audio.playYazh(293.66); // D4
    } else if (region.id === 'scholars') {
      audio.playYazh(392.00); // G4
    }

    // Determine coordinate for floater (offset a bit for random touch feel)
    const floaterX = region.centerCoords.x + (Math.random() * 40 - 20);
    const floaterY = region.centerCoords.y + (Math.random() * 20 - 10);

    if (isCooldowned) {
      // Just visual buzz, no rewards
      addFloater("⏳ Preparing...", floaterX, floaterY, "#999999");
      return;
    }

    // Calculate Dynamic Yield based on Campaign Progress and Technologies
    let finalYield = region.baseYield;
    let effectText = "";

    if (region.id === 'temple') {
      if (campaignState.kumbamPlaced) {
        finalYield = Math.round(finalYield * 1.5);
        effectText = " (Kumbam Consecrated!)";
      }
    } else if (region.id === 'port') {
      if (isKappalUnlocked) {
        finalYield = Math.round(finalYield * 1.4);
        effectText = " (Kappal Tech!)";
      }
    } else if (region.id === 'garrison') {
      if (isRampUnlocked) {
        finalYield = Math.round(finalYield * 1.3);
        effectText = " (Elephant Ramp Tech!)";
      }
    } else if (region.id === 'fields_left') {
      let multiplier = 1.0;
      if (campaignState.completedPhases.includes('foundation')) {
        multiplier *= 1.5;
        effectText = " (Cauvery Delta Fed!)";
      }
      if (monsoonWeather) {
        multiplier *= monsoonWeather.cropYieldMultiplier;
        effectText += ` (${monsoonWeather.name})`;
      }
      finalYield = Math.round(finalYield * multiplier);
    }


    // Award resource
    onEarnResources({ [region.resourceType]: finalYield });

    // Floating micro interactions
    const icons: Record<string, string> = {
      anbu: '🪷 Devotion',
      aruvam: '🪙 Wealth',
      aalavan: '⚔️ Power',
      arivu: '📜 Knowledge'
    };
    
    const colors: Record<string, string> = {
      anbu: '#FF6B6B',
      aruvam: '#D4AF37',
      aalavan: '#EF4444',
      arivu: '#4A90E2'
    };

    addFloater(`+${finalYield} ${icons[region.resourceType]}${effectText}`, floaterX, floaterY, colors[region.resourceType]);

    // Set 15-second cooldown
    setCooldowns(prev => ({
      ...prev,
      [region.id]: 12
    }));
  };

  const addFloater = (text: string, x: number, y: number, color: string) => {
    setFloaters(prev => [...prev, { id: floaterId, text, x, y, color }]);
    setFloaterId(id => id + 1);
  };

  // Clean up floaters
  useEffect(() => {
    if (floaters.length > 0) {
      const timer = setTimeout(() => {
        setFloaters(prev => prev.slice(1));
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [floaters]);

  return (
    <div id="imperial-realm-interactive-map" className="relative w-full rounded-2xl border-2 border-[#D2691E]/40 overflow-hidden bg-[#1C1713] shadow-2xl">
      
      {/* Title Header */}
      <div className="p-4 bg-gradient-to-r from-[#241D18] to-[#1C1713] border-b border-[#D2691E]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="text-sm font-serif font-bold text-[#F4EFE6] flex items-center gap-1.5">
            🗺️ Imperial Domain Map <span className="text-[#D2691E] text-xs font-mono font-normal">(நாடு வரைபடம்)</span>
          </h3>
          <p className="text-[11px] text-stone-400">
            Hover over elements of the Chola empire diagram to view structural lore, tap to harvest resources, or toggle Anime.js live physics simulation!
          </p>
        </div>

        {/* View Mode Mode Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-[#120F0D] p-1 rounded-lg border border-[#D2691E]/30 text-[10px] font-mono">
          <button
            onClick={() => {
              audio.playBell();
              setViewMode('blueprint');
            }}
            className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
              viewMode === 'blueprint' 
                ? 'bg-[#D2691E] text-white shadow' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            🗺️ Blueprint
          </button>
          <button
            onClick={() => {
              audio.playBell();
              setViewMode('anime');
            }}
            className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
              viewMode === 'anime' 
                ? 'bg-[#D2691E] text-white shadow' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            ✨ Anime.js Physics
          </button>
          <button
            onClick={() => {
              audio.playBell();
              setViewMode('both');
            }}
            className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
              viewMode === 'both' 
                ? 'bg-[#D2691E] text-white shadow' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            🌟 Dual View
          </button>
        </div>
      </div>

      {/* Anime.js Physics World Component if in 'anime' or 'both' mode */}
      {(viewMode === 'anime' || viewMode === 'both') && (
        <div className="p-3 border-b border-[#D2691E]/30">
          <AnimeWorldSimulation
            resources={resources}
            onEarnResources={onEarnResources}
            campaignState={campaignState}
            isKappalUnlocked={isKappalUnlocked}
            isRampUnlocked={isRampUnlocked}
            monsoonWeather={monsoonWeather}
          />

        </div>
      )}

      {/* Main Map Stage Wrapper (Blueprint) if in 'blueprint' or 'both' mode */}
      {(viewMode === 'blueprint' || viewMode === 'both') && (
        <div className="relative aspect-[1000/562] w-full bg-stone-950 overflow-hidden">
        
        {/* Core Isometric Artwork */}
        <img 
          src="/input_file_0.png" 
          alt="Chola Empire Map" 
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none opacity-90 transition duration-700" 
        />

        {/* Dynamic Canvas Filter Gradients overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/20 via-transparent to-transparent pointer-events-none" />

        {/* SVG POLYGONS OVERLAYS (Surgical interaction map) */}
        <svg 
          viewBox="0 0 1000 562" 
          className="absolute inset-0 w-full h-full select-none"
        >
          {regions.map(region => {
            const isHovered = hoveredRegion === region.id;
            const isCooldowned = cooldowns[region.id] > 0;
            const cdSecs = cooldowns[region.id] || 0;
            
            // Determine styling colors
            let strokeColor = "rgba(212, 175, 55, 0.25)";
            let fillColor = "rgba(212, 175, 55, 0.02)";
            if (isHovered) {
              strokeColor = isCooldowned ? "rgba(150, 150, 150, 0.7)" : "#D4AF37";
              fillColor = isCooldowned ? "rgba(150, 150, 150, 0.15)" : "rgba(212, 175, 55, 0.16)";
            } else if (isCooldowned) {
              strokeColor = "rgba(150, 150, 150, 0.15)";
              fillColor = "rgba(150, 150, 150, 0.01)";
            }

            return (
              <g key={region.id}>
                {/* Responsive clickable polygon area */}
                <polygon
                  points={region.points}
                  className="cursor-pointer transition-all duration-300 outline-none"
                  style={{
                    fill: fillColor,
                    stroke: strokeColor,
                    strokeWidth: isHovered ? 3 : 1.5,
                    strokeDasharray: isCooldowned ? "4 4" : undefined
                  }}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => handleRegionClick(region)}
                />
              </g>
            );
          })}
        </svg>

        {/* FLOATING TEXT ANIMATIONS (MICRO-INTERACTIONS) */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <AnimatePresence>
            {floaters.map(f => (
              <motion.div
                key={f.id}
                initial={{ opacity: 1, scale: 0.8, y: `${(f.y / 562) * 100}%`, x: `${(f.x / 1000) * 100}%` }}
                animate={{ opacity: 0, scale: 1.2, y: `${((f.y - 70) / 562) * 100}%` }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute text-xs font-serif font-extrabold px-2 py-1 rounded bg-[#1C1713]/95 border-2 border-stone-800 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                style={{ color: f.color }}
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ON-SCREEN ACTIVE REALM TOOLTIP BANNER */}
        <AnimatePresence>
          {hoveredRegion && (
            (() => {
              const region = regions.find(r => r.id === hoveredRegion);
              if (!region) return null;
              const isCooldowned = cooldowns[region.id] > 0;
              const cdTime = cooldowns[region.id] || 0;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-[#120F0D]/95 border-2 border-[#D2691E]/50 p-4 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2.5 z-20"
                >
                  <div className="flex justify-between items-start border-b border-[#D2691E]/20 pb-1.5">
                    <div>
                      <h4 className="font-serif font-bold text-[#F4EFE6] text-sm leading-tight">
                        {region.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#D2691E]">
                        {region.tamilName}
                      </span>
                    </div>
                    {isCooldowned ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-stone-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-stone-500 animate-spin" /> Cooldown: {cdTime}s
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded animate-pulse">
                        <Sparkles className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>

                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    {region.description}
                  </p>

                  <div className="p-2 rounded bg-[#2D241E]/40 text-[10px] leading-normal text-amber-200/80 italic font-serif">
                    📜 "{region.lore}"
                  </div>

                  {/* Actions row inside tooltip */}
                  <div className="flex justify-between items-center pt-1 border-t border-stone-800/60 text-[10px] font-mono">
                    <span className="text-stone-400">
                      Yield: <strong className="text-[#D4AF37] font-mono">+{region.baseYield} {region.resourceType === 'aruvam' ? 'Gold 🪙' : region.resourceType === 'arivu' ? 'Knowledge 📜' : region.resourceType === 'anbu' ? 'Devotion 🪷' : 'Power ⚔️'}</strong>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        audio.playBell();
                        setActiveTab(region.targetTab);
                      }}
                      className="px-2 py-1 rounded bg-[#D2691E]/10 hover:bg-[#D2691E]/20 border border-[#D2691E]/30 text-[#D2691E] font-bold uppercase transition"
                    >
                      Jump to System ↗
                    </button>
                  </div>
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>

      </div>
      )}

      {/* Footer statistics & mini controls panel */}
      <div className="p-3 bg-[#1C1713] border-t border-[#D2691E]/15 grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-[10px] font-mono text-stone-400">
        <div>
          <span>🏯 Temple Phase: </span>
          <strong className="text-amber-200 font-bold capitalize">{campaignState.currentPhase}</strong>
        </div>
        <div>
          <span>⛵ Trade Fleet: </span>
          <strong className={isKappalUnlocked ? 'text-emerald-400 font-bold' : 'text-stone-500'}>
            {isKappalUnlocked ? 'Kappal Built (Double yield!)' : 'Traditional Dhonis'}
          </strong>
        </div>
        <div>
          <span>🐘 Ramp & Elephant: </span>
          <strong className={isRampUnlocked ? 'text-emerald-400 font-bold' : 'text-stone-500'}>
            {isRampUnlocked ? 'Unlocked (Garrison boost)' : 'Locked'}
          </strong>
        </div>
        <div>
          <span>🏆 Conquest Progress: </span>
          <strong className="text-[#D2691E] font-bold">
            {campaignState.completedPhases.length * 25}%
          </strong>
        </div>
      </div>

    </div>
  );
}
