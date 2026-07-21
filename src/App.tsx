/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Resources, GridCell, TechNode, CampaignState, ZoneType } from './types';
import NagaraGrid from './components/NagaraGrid';
import PortCityMiniGame from './components/PortCityMiniGame';
import PalmLeafTechTree from './components/PalmLeafTechTree';
import ThanjavurCampaign from './components/ThanjavurCampaign';
import CopperPlateModal from './components/CopperPlateModal';
import { audio } from './utils/audio';
import { 
  Coins, BookOpen, Heart, Shield, Users, 
  Volume2, VolumeX, HelpCircle, RefreshCw, 
  Sparkles, Globe, Compass, Landmark 
} from 'lucide-react';

// Starting values
const INITIAL_RESOURCES: Resources = {
  aruvam: 350,   // Wealth
  arivu: 40,     // Knowledge
  anbu: 10,      // Culture
  aalavan: 30,   // Influence
};

const INITIAL_GRID = (): GridCell[] => {
  const cells: GridCell[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      let type: ZoneType = 'empty';
      let hasWater = false;
      
      // Top row is River Cauvery
      if (r === 0) {
        type = 'river';
        hasWater = true;
      }
      
      // Pre-placed Granite quarries
      if ((r === 3 && c === 2) || (r === 5 && c === 5)) {
        type = 'quarry';
      }

      cells.push({
        id: `cell-${r}-${c}`,
        row: r,
        col: c,
        type,
        level: type === 'empty' ? 0 : 1,
        hasWater,
        assignedWorkers: 0,
      });
    }
  }
  return recalculateWater(cells);
};

// Recalculates water channels (River and Eri irrigations)
const recalculateWater = (cells: GridCell[]): GridCell[] => {
  // Clear all water first (except river itself)
  const updated = cells.map(c => ({
    ...c,
    hasWater: c.type === 'river',
  }));

  // Find all water sources
  const waterSources = updated.filter(c => c.type === 'river' || c.type === 'eri');

  waterSources.forEach(source => {
    updated.forEach(target => {
      if (target.type !== 'river' && target.type !== 'eri') {
        const rowDiff = Math.abs(source.row - target.row);
        const colDiff = Math.abs(source.col - target.col);
        // Adjacent within 1 cell diagonally or orthogonally
        if (rowDiff <= 1 && colDiff <= 1) {
          target.hasWater = true;
        }
      }
    });
  });

  return updated;
};

const INITIAL_TECHS: TechNode[] = [
  {
    id: 'siddha1',
    name: 'Herbal Remedies',
    tamilName: 'மூலிகை மருத்துவம்',
    description: 'Ancient Siddha recipes to preserve health and stamina.',
    branch: 'siddha',
    cost: 15,
    unlocked: false,
    effectDescription: 'Grants +3 Total Workers for construction and quarries.',
  },
  {
    id: 'siddha2',
    name: 'Sanctuary Hospitals',
    tamilName: 'ஆதுலர் சாலை',
    description: 'Build robust medical houses to optimize worker performance.',
    branch: 'siddha',
    cost: 35,
    unlocked: false,
    unlockedBy: 'siddha1',
    effectDescription: 'Reduces the cost of zoning fields by 50%.',
  },
  {
    id: 'vastu1',
    name: 'Ramp & Elephant',
    tamilName: 'வண்டல் பாதை',
    description: 'Engineered inclined dirt path pulling heavy megaliths.',
    branch: 'vastu',
    cost: 20,
    unlocked: false,
    effectDescription: 'Unlocks Phase 2 capstone mini-game for Thanjavur.',
  },
  {
    id: 'vastu2',
    name: 'Granite Sledges',
    tamilName: 'கல் வண்டி',
    description: 'Heavy lubrication wood boards to slide stones smoothly.',
    branch: 'vastu',
    cost: 40,
    unlocked: false,
    unlockedBy: 'vastu1',
    effectDescription: 'Increases Granite quarrying speed by 100%.',
  },
  {
    id: 'kadal1',
    name: 'Kappal Shipwrights',
    tamilName: 'கப்பல் கட்டுதல்',
    description: 'Construct solid ocean-going double-hulled wooden vessels.',
    branch: 'kadal',
    cost: 25,
    unlocked: false,
    effectDescription: 'Reduces maritime voyage times by 30%.',
  },
  {
    id: 'kadal2',
    name: 'Naval Compass',
    tamilName: 'திசைகாட்டி கருவி',
    description: 'Utilize magnetic stones and sky charts to chart routes safely.',
    branch: 'kadal',
    cost: 45,
    unlocked: false,
    unlockedBy: 'kadal1',
    effectDescription: 'Reduces monsoon pirate risk by 50% on all trade routes.',
  },
  {
    id: 'arts1',
    name: 'Poet Guilds',
    tamilName: 'புலவர் சங்கம்',
    description: 'Sponsor royal assemblies of Tamil litterateurs and dancers.',
    branch: 'arts',
    cost: 30,
    unlocked: false,
    effectDescription: 'Reduces Cultural Harmony decay rate in Phase 4.',
  },
  {
    id: 'arts2',
    name: 'Koothu Theatres',
    tamilName: 'கூத்தரங்கம்',
    description: 'Deploy dance troops to entertain and boost community loyalty.',
    branch: 'arts',
    cost: 50,
    unlocked: false,
    unlockedBy: 'arts1',
    effectDescription: 'Markets (Nagar) generate +50% higher Aruvam gold.',
  },
];

const INITIAL_CAMPAIGN: CampaignState = {
  currentPhase: 'foundation',
  completedPhases: [],
  graniteCollected: 0,
  graniteTarget: 300,
  paddiesWithWater: 0,
  paddiesTarget: 3,
  elephantRampProgress: 0,
  elephantTension: 50,
  kumbamPlaced: false,
  spiesArrested: 0,
  spiesTarget: 4,
  defendersActive: 0,
  activeRaids: 0,
  culturalHarmony: 75,
  guildDemands: [
    {
      id: 'demand1',
      guildName: 'merchants',
      demandText: 'We require 200 Aruvam gold to distribute silk garments to incoming scholars.',
      resourceCost: { aruvam: 200 },
      rewardText: 'Spices flowing in, stabilizing city markets.',
      satisfied: false,
    },
    {
      id: 'demand2',
      guildName: 'soldiers',
      demandText: 'Deploy a grand guard patrol to guard the sanctuary granaries during the festival.',
      resourceCost: { aalavan: 20 },
      rewardText: 'Guards secured all royal entries, keeping saboteurs away.',
      satisfied: false,
    },
    {
      id: 'demand3',
      guildName: 'priests',
      demandText: 'Contribute 150 Anbu culture points to perform the holy consecration chants.',
      resourceCost: { anbu: 150 },
      rewardText: 'Sacred blessings shower Thanjavur city.',
      satisfied: false,
    },
    {
      id: 'demand4',
      guildName: 'artists',
      demandText: 'Construct temporary stages for Bharatanatyam recital programs near the temple gates.',
      resourceCost: { aruvam: 100, anbu: 50 },
      rewardText: 'Spectacular art forms mesmerize visiting kings.',
      satisfied: false,
    },
  ],
};

export default function App() {
  const [resources, setResources] = useState<Resources>(INITIAL_RESOURCES);
  const [grid, setGrid] = useState<GridCell[]>(INITIAL_GRID());
  const [techs, setTechs] = useState<TechNode[]>(INITIAL_TECHS);
  const [campaign, setCampaign] = useState<CampaignState>(INITIAL_CAMPAIGN);
  const [activeTab, setActiveTab] = useState<'campaign' | 'grid' | 'port' | 'tech'>('campaign');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Read state from LocalStorage on mount
  useEffect(() => {
    const savedResources = localStorage.getItem('chola_resources');
    const savedGrid = localStorage.getItem('chola_grid');
    const savedTechs = localStorage.getItem('chola_techs');
    const savedCampaign = localStorage.getItem('chola_campaign');

    if (savedResources) setResources(JSON.parse(savedResources));
    if (savedGrid) setGrid(JSON.parse(savedGrid));
    if (savedTechs) setTechs(JSON.parse(savedTechs));
    if (savedCampaign) setCampaign(JSON.parse(savedCampaign));
  }, []);

  // Save state on modification
  useEffect(() => {
    localStorage.setItem('chola_resources', JSON.stringify(resources));
    localStorage.setItem('chola_grid', JSON.stringify(grid));
    localStorage.setItem('chola_techs', JSON.stringify(techs));
    localStorage.setItem('chola_campaign', JSON.stringify(campaign));
  }, [resources, grid, techs, campaign]);

  // Determine available and total workers
  const isHerbalRemediesUnlocked = techs.find(t => t.id === 'siddha1')?.unlocked || false;
  const totalWorkers = 12 + (isHerbalRemediesUnlocked ? 3 : 0);
  const assignedWorkers = grid.reduce((acc, cell) => acc + cell.assignedWorkers, 0);
  const availableWorkers = Math.max(0, totalWorkers - assignedWorkers);

  // Active modifiers
  const isSanctuaryHospitalUnlocked = techs.find(t => t.id === 'siddha2')?.unlocked || false;
  const isKappalUnlocked = techs.find(t => t.id === 'kadal1')?.unlocked || false;
  const isCompassUnlocked = techs.find(t => t.id === 'kadal2')?.unlocked || false;
  const isPoetGuildUnlocked = techs.find(t => t.id === 'arts1')?.unlocked || false;
  const isKoothuTheatresUnlocked = techs.find(t => t.id === 'arts2')?.unlocked || false;
  const isRampUnlocked = techs.find(t => t.id === 'vastu1')?.unlocked || false;

  // Primary Game Ticking Loop (runs every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setResources(prev => {
        let aruvamIncome = 0;
        let anbuIncome = 0;
        let arivuIncome = 0;
        let aalavanIncome = 0;

        // Idle workers generate Arivu (Knowledge) by reading manuscripts
        arivuIncome += Math.max(1, Math.round(availableWorkers * 0.8));

        grid.forEach(cell => {
          if (cell.assignedWorkers > 0) {
            if (cell.type === 'ur') {
              // Agricultural Ur Zone
              const yieldMultiplier = cell.hasWater ? 2.0 : 1.0;
              aruvamIncome += Math.round(cell.assignedWorkers * 8 * yieldMultiplier);
            } else if (cell.type === 'nagar') {
              // Market Nagar Zone
              const marketMultiplier = isKoothuTheatresUnlocked ? 1.5 : 1.0;
              aruvamIncome += Math.round(cell.assignedWorkers * 14 * cell.level * marketMultiplier);
              aalavanIncome += Math.round(cell.level * 0.5); // high density generates influence
            } else if (cell.type === 'kovil') {
              // Spiritual Temple Zone
              anbuIncome += Math.round(cell.assignedWorkers * 10 * cell.level);
              arivuIncome += Math.round(cell.level * 2);
            }
          }
        });

        // Penalize incomes if bandit raids are active in Phase 3
        if (campaign.currentPhase === 'shadows' && campaign.activeRaids > 0) {
          aruvamIncome = Math.round(aruvamIncome * 0.5); // 50% crop losses
        }

        return {
          aruvam: prev.aruvam + aruvamIncome,
          arivu: prev.arivu + arivuIncome,
          anbu: prev.anbu + anbuIncome,
          aalavan: Math.min(200, prev.aalavan + aalavanIncome + 1), // slow default gain
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [grid, availableWorkers, isKoothuTheatresUnlocked, campaign.currentPhase, campaign.activeRaids]);

  // Handle cell zoning updates
  const handleUpdateCell = (id: string, type: ZoneType) => {
    let cost = 0;
    if (type === 'ur') cost = isSanctuaryHospitalUnlocked ? 25 : 50;
    if (type === 'nagar') cost = 120;
    if (type === 'kovil') cost = 250;
    if (type === 'eri') cost = 100;

    if (resources.aruvam < cost) return;

    setResources(prev => ({ ...prev, aruvam: prev.aruvam - cost }));
    setGrid(prev => {
      const nextGrid = prev.map(cell => {
        if (cell.id === id) {
          return {
            ...cell,
            type,
            level: 1,
            assignedWorkers: 0, // Reset workers on zone change
          };
        }
        return cell;
      });
      return recalculateWater(nextGrid);
    });
  };

  // Upgrades
  const handleUpgradeCell = (id: string) => {
    setGrid(prev => {
      return prev.map(cell => {
        if (cell.id === id) {
          const cost = cell.level * 200;
          if (resources.aruvam >= cost) {
            setResources(r => ({ ...r, aruvam: r.aruvam - cost }));
            return {
              ...cell,
              level: Math.min(3, cell.level + 1),
            };
          }
        }
        return cell;
      });
    });
  };

  // Assign workers to specific cell
  const handleAssignWorkers = (id: string, change: number) => {
    setGrid(prev => {
      return prev.map(cell => {
        if (cell.id === id) {
          const current = cell.assignedWorkers;
          const nextVal = Math.max(0, current + change);
          return { ...cell, assignedWorkers: nextVal };
        }
        return cell;
      });
    });
  };

  // Spend generic resources validator
  const handleSpendResources = (cost: Partial<Resources>): boolean => {
    let possible = true;
    if (cost.aruvam && resources.aruvam < cost.aruvam) possible = false;
    if (cost.arivu && resources.arivu < cost.arivu) possible = false;
    if (cost.anbu && resources.anbu < cost.anbu) possible = false;
    if (cost.aalavan && resources.aalavan < cost.aalavan) possible = false;

    if (possible) {
      setResources(prev => ({
        aruvam: prev.aruvam - (cost.aruvam || 0),
        arivu: prev.arivu - (cost.arivu || 0),
        anbu: prev.anbu - (cost.anbu || 0),
        aalavan: prev.aalavan - (cost.aalavan || 0),
      }));
      return true;
    }
    return false;
  };

  // Earn rewards from voyages/missions
  const handleEarnResources = (earned: Partial<Resources>) => {
    setResources(prev => ({
      aruvam: prev.aruvam + (earned.aruvam || 0),
      arivu: prev.arivu + (earned.arivu || 0),
      anbu: prev.anbu + (earned.anbu || 0),
      aalavan: prev.aalavan + (earned.aalavan || 0),
    }));
  };

  // Deduct cost of ship building repairs
  const handleTradeLoss = (cost: number) => {
    setResources(prev => ({
      ...prev,
      aruvam: Math.max(0, prev.aruvam - cost),
    }));
  };

  // Unlock tech node
  const handleUnlockTech = (id: string) => {
    setTechs(prev =>
      prev.map(t => {
        if (t.id === id) {
          setResources(r => ({ ...r, aivu: r.arivu - t.cost }));
          return { ...t, unlocked: true };
        }
        return t;
      })
    );
    // Deduct raw arivu cost directly
    const techNode = techs.find(t => t.id === id);
    if (techNode) {
      setResources(prev => ({ ...prev, arivu: Math.max(0, prev.arivu - techNode.cost) }));
    }
  };

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const resetGame = () => {
    if (confirm("Reset the campaign and clear your Nagapattinam empire blueprint?")) {
      audio.playDrum(true);
      setResources(INITIAL_RESOURCES);
      setGrid(INITIAL_GRID());
      setTechs(INITIAL_TECHS);
      setCampaign(INITIAL_CAMPAIGN);
      setActiveTab('campaign');
      localStorage.clear();
    }
  };

  return (
    <div id="tamil-app-wrapper" className="min-h-screen bg-[#120F0D] text-[#F4EFE6] flex flex-col font-sans selection:bg-[#D2691E] selection:text-black">
      
      {/* HEADER BANNER */}
      <header className="relative border-b-2 border-[#D2691E]/30 bg-[#1C1713] py-4 px-6 flex flex-col lg:flex-row justify-between items-center gap-4 z-10">
        
        {/* Ancient Logo Aesthetic */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-serif text-xl font-extrabold shadow-inner select-none">
            🐅
            <div className="absolute inset-0.5 border border-dashed border-[#D4AF37]/20 rounded-sm" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-[#F4EFE6] tracking-wider flex items-center gap-1.5">
              TAMILAN LEGACY <span className="text-[#D2691E] font-normal text-sm font-serif">(சோழ பேரரசு)</span>
            </h1>
            <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase">
              Raja Raja Cholan • Imperial Glory Era
            </p>
          </div>
        </div>

        {/* Dynamic Phase Badge */}
        <div className="bg-[#2D241E] px-4 py-1.5 rounded-full border border-[#D2691E]/50 flex items-center gap-3">
          <span className="text-[#D2691E] animate-pulse">●</span>
          <span className="text-xs tracking-tighter font-mono font-semibold uppercase text-[#F4EFE6]">
            {campaign.currentPhase === 'foundation' && 'Phase 1: Placing foundations'}
            {campaign.currentPhase === 'capstone' && 'Phase 2: Placing the Kumbam Capstone'}
            {campaign.currentPhase === 'shadows' && 'Phase 3: Shadows in the City'}
            {campaign.currentPhase === 'consecration' && 'Phase 4: Consecration Ceremony'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            id="btn-toggle-mute"
            onClick={handleToggleMute}
            className="p-2 rounded bg-[#2D241E] border border-[#D2691E]/20 hover:text-[#D2691E] text-stone-400 transition"
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Guide toggle */}
          <button
            id="btn-toggle-guide"
            onClick={() => setIsHelpOpen(true)}
            className="p-2 rounded bg-[#2D241E] border border-[#D2691E]/20 hover:text-[#D2691E] text-stone-300 transition flex items-center gap-1.5 text-xs font-mono"
          >
            <HelpCircle className="w-4 h-4 text-[#D2691E]" /> Scroll Guide
          </button>

          {/* Reset */}
          <button
            id="btn-reset-game"
            onClick={resetGame}
            className="p-2 rounded bg-[#2D241E] border border-[#D2691E]/20 text-stone-500 hover:text-red-400 transition"
            title="Reset Campaign State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* RESOURCE PILLARS HUD */}
      <section id="resources-hud" className="grid grid-cols-2 md:grid-cols-5 gap-3 p-6 bg-[#1C1713] border-b-2 border-[#D2691E]/30">
        
        {/* Aruvam (Wealth) */}
        <div className="bg-[#2D241E] p-3 rounded-lg border border-[#D2691E]/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#D4AF37] flex items-center justify-center text-black text-lg font-bold shadow-md">🪙</div>
          <div>
            <div className="text-[9px] uppercase font-mono tracking-wider text-stone-400">Aruvam (Wealth)</div>
            <div className="text-base font-mono font-bold text-[#D4AF37]">{resources.aruvam}</div>
          </div>
        </div>

        {/* Arivu (Knowledge) */}
        <div className="bg-[#2D241E] p-3 rounded-lg border border-[#D2691E]/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#4A90E2] flex items-center justify-center text-white text-lg font-bold shadow-md">👁️</div>
          <div>
            <div className="text-[9px] uppercase font-mono tracking-wider text-stone-400">Arivu (Knowledge)</div>
            <div className="text-base font-mono font-bold text-[#4A90E2]">{resources.arivu}</div>
          </div>
        </div>

        {/* Anbu (Culture/Devotion) */}
        <div className="bg-[#2D241E] p-3 rounded-lg border border-[#D2691E]/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#FF6B6B] flex items-center justify-center text-white text-lg font-bold shadow-md">🪷</div>
          <div>
            <div className="text-[9px] uppercase font-mono tracking-wider text-stone-400">Anbu (Devotion)</div>
            <div className="text-base font-mono font-bold text-[#FF6B6B]">{resources.anbu}</div>
          </div>
        </div>

        {/* Aalavan (Power/Soldiers) */}
        <div className="bg-[#2D241E] p-3 rounded-lg border border-[#D2691E]/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#8B0000] flex items-center justify-center text-white text-lg font-bold shadow-md">⚔️</div>
          <div>
            <div className="text-[9px] uppercase font-mono tracking-wider text-stone-400">Aalavan (Power)</div>
            <div className="text-base font-mono font-bold text-red-500">{resources.aalavan}</div>
          </div>
        </div>

        {/* Workers Status */}
        <div className="bg-[#2D241E] p-3 rounded-lg border border-[#D2691E]/30 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-8 h-8 rounded bg-[#D2691E] flex items-center justify-center text-black text-lg font-bold shadow-md">👷</div>
          <div>
            <div className="text-[9px] uppercase font-mono tracking-wider text-stone-400">Workers (Idle/Total)</div>
            <div className="text-sm font-mono font-bold text-stone-200">
              <span className="text-[#D2691E] text-base">{availableWorkers}</span> / {totalWorkers}
            </div>
          </div>
        </div>

      </section>

      {/* CORE NAVIGATION INTERACTIVE TABS */}
      <nav id="game-navigation-tabs" className="flex border-b-2 border-[#D2691E]/30 bg-[#1C1713]/80">
        
        <button
          id="tab-campaign"
          onClick={() => { audio.playYazh(293.66); setActiveTab('campaign'); }}
          className={`flex-1 py-3 text-center text-xs font-mono font-bold uppercase tracking-wider transition ${
            activeTab === 'campaign' 
              ? 'bg-[#2D241E] text-[#D2691E] border-b-2 border-[#D2691E] font-bold' 
              : 'text-stone-400 hover:text-stone-200 hover:bg-[#3D3028]/40'
          }`}
        >
          🏰 Thanjavur Temple Campaign
        </button>

        <button
          id="tab-grid"
          onClick={() => { audio.playYazh(329.63); setActiveTab('grid'); }}
          className={`flex-1 py-3 text-center text-xs font-mono font-bold uppercase tracking-wider transition ${
            activeTab === 'grid' 
              ? 'bg-[#2D241E] text-[#D2691E] border-b-2 border-[#D2691E] font-bold' 
              : 'text-stone-400 hover:text-stone-200 hover:bg-[#3D3028]/40'
          }`}
        >
          🗺️ Nagara City Planner
        </button>

        <button
          id="tab-port"
          onClick={() => { audio.playYazh(349.23); setActiveTab('port'); }}
          className={`flex-1 py-3 text-center text-xs font-mono font-bold uppercase tracking-wider transition ${
            activeTab === 'port' 
              ? 'bg-[#2D241E] text-[#D2691E] border-b-2 border-[#D2691E] font-bold' 
              : 'text-stone-400 hover:text-stone-200 hover:bg-[#3D3028]/40'
          }`}
        >
          ⛵ Nagapattinam Trade Port
        </button>

        <button
          id="tab-tech"
          onClick={() => { audio.playYazh(392.00); setActiveTab('tech'); }}
          className={`flex-1 py-3 text-center text-xs font-mono font-bold uppercase tracking-wider transition ${
            activeTab === 'tech' 
              ? 'bg-[#2D241E] text-[#D2691E] border-b-2 border-[#D2691E] font-bold' 
              : 'text-stone-400 hover:text-stone-200 hover:bg-[#3D3028]/40'
          }`}
        >
          📜 Olai Chuvadi Technologies
        </button>

      </nav>

      {/* CORE DISPLAY STAGE */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'campaign' && (
          <ThanjavurCampaign
            campaignState={campaign}
            resources={resources}
            gridCells={grid}
            onSetCampaignState={setCampaign}
            onSpendResources={handleSpendResources}
            onEarnResources={handleEarnResources}
            rampTechUnlocked={isRampUnlocked}
            poetGuildUnlocked={isPoetGuildUnlocked}
          />
        )}

        {activeTab === 'grid' && (
          <NagaraGrid
            grid={grid}
            onUpdateCell={handleUpdateCell}
            onUpgradeCell={handleUpgradeCell}
            onAssignWorkers={handleAssignWorkers}
            resources={resources}
            availableWorkers={availableWorkers}
            totalWorkers={totalWorkers}
          />
        )}

        {activeTab === 'port' && (
          <PortCityMiniGame
            resources={resources}
            onTradeSuccess={handleEarnResources}
            onTradeLoss={handleTradeLoss}
            kadalPiraUnlocked={isKappalUnlocked}
            compassUnlocked={isCompassUnlocked}
          />
        )}

        {activeTab === 'tech' && (
          <PalmLeafTechTree
            techNodes={techs}
            onUnlockTech={handleUnlockTech}
            arivu={resources.arivu}
          />
        )}
      </main>

      {/* HISTORY BRUSH BRIEF */}
      <footer className="mt-auto border-t-2 border-[#D2691E]/30 bg-[#1C1713] py-4 px-6 text-center text-[11px] text-[#F4EFE6]/60 font-mono flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          © 1010 AD Chola Imperial Court • Developed for Tamilan Legacy.
        </div>
        <div className="flex gap-4">
          <span>👑 <strong className="text-[#D4AF37]">Ruler:</strong> Emperor Rajaraja I</span>
          <span>🌍 <strong className="text-[#D2691E]">Capital:</strong> Thanjavur</span>
          <span>🌊 <strong className="text-[#4A90E2]">Main Port:</strong> Nagapattinam</span>
        </div>
      </footer>

      {/* TUTORIAL SCROLL / COPPER PLATE MODAL */}
      <CopperPlateModal
        isOpen={isHelpOpen}
        onClose={() => { audio.playBell(); setIsHelpOpen(false); }}
        title="Royal Proclamation of the Emperor"
        tamilTitle="இராசராச சோழன் திருமுகம்"
      >
        <div className="space-y-4">
          <p className="italic">
            "To our esteemed Architect, we decree the construction of the Peruvudaiyar Temple (Brihadeeswarar) in our capital, Thanjavur."
          </p>
          
          <h4 className="font-serif font-semibold text-amber-300 border-b border-amber-950 pb-1 mt-4">
            How to Command the Empire:
          </h4>
          
          <ul className="list-disc pl-5 space-y-2 text-stone-300">
            <li>
              <strong>Pillars of Society:</strong> Balance <strong>Aruvam</strong> (Wealth), <strong>Arivu</strong> (Knowledge), <strong>Anbu</strong> (Culture), and <strong>Aalavan</strong> (Military Force).
            </li>
            <li>
              <strong>The Nagara Planner:</strong> Zone agricultural fields near the Cauvery river or build <strong>Eri reservoirs</strong>. Crop yields will double under irrigation!
            </li>
            <li>
              <strong>The Trade Fleets:</strong> Dock ships at <strong>Nagapattinam Port</strong> and dispatch heavy <strong>Kappal</strong> vessels to Sri Lanka, Srivijaya, and China.
            </li>
            <li>
              <strong>Campaign Mission:</strong> Step through the 4 phases to excavate granite, research the Elephant Ramp, catch spies, and host the spectacular Consecration!
            </li>
          </ul>

          <div className="p-3 rounded bg-amber-500/5 border border-amber-500/10 text-[11px] leading-relaxed text-amber-300/80">
            🔔 <strong>Tip:</strong> Keep your sound turned up! Plucks of the Yazh, strikes of temple bells, and the thuds of the mridangam accompany your royal commands.
          </div>
        </div>
      </CopperPlateModal>

    </div>
  );
}
