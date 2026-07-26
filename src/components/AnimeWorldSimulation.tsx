/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as animeModule from 'animejs';

function getAnime(): any {
  let a: any = animeModule;
  while (a && typeof a !== 'function' && a.default) {
    a = a.default;
  }
  return a;
}

const anime: any = (...args: any[]) => {
  const instance = getAnime();
  if (typeof instance === 'function') {
    return instance(...args);
  }
  return null;
};

anime.setDashoffset = (el: any) => getAnime()?.setDashoffset?.(el) ?? 0;
anime.stagger = (val: any, options?: any) => getAnime()?.stagger?.(val, options);
anime.random = (min: number, max: number) => getAnime()?.random?.(min, max) ?? min;
import { Resources, CampaignState, MonsoonWeather } from '../types';
import { audio } from '../utils/audio';
import { 
  Crown, Anchor, Sparkles, Shield, Feather, 
  Compass, Zap, Award, Play, Pause, RefreshCw, Volume2, CloudRain, Sun, CloudLightning
} from 'lucide-react';

interface AnimeWorldSimulationProps {
  resources: Resources;
  onEarnResources: (earned: Partial<Resources>) => void;
  campaignState: CampaignState;
  isKappalUnlocked: boolean;
  isRampUnlocked: boolean;
  monsoonWeather?: MonsoonWeather;
}

export default function AnimeWorldSimulation({
  resources,
  onEarnResources,
  campaignState,
  isKappalUnlocked,
  isRampUnlocked,
  monsoonWeather
}: AnimeWorldSimulationProps) {


  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeCharacter, setActiveCharacter] = useState<string>('emperor');
  const [characterActionText, setCharacterActionText] = useState<string>(
    'Rajaraja Cholan inspects the Vimana construction site from the royal pavilion.'
  );

  // 2D Unit Level & Morale System
  const [unitLevels, setUnitLevels] = useState<Record<string, number>>({
    emperor: 1,
    elephant: 1,
    architect: 1,
    admiral: 1,
    farmer: 1
  });

  // 2D Imperial Quests & Objectives
  const [quests, setQuests] = useState([
    { id: 'harvest', title: 'Harvest Kaveri Paddy', desc: 'Click Farmer 3 times', count: 0, target: 3, reward: { aruvam: 100, anbu: 50 }, completed: false },
    { id: 'elephants', title: 'Haul Granite Stones', desc: 'Click War Elephants 3 times', count: 0, target: 3, reward: { aalavan: 80, aruvam: 60 }, completed: false },
    { id: 'fleet', title: 'Dispatch Trade Fleet', desc: 'Click Kadal Pira Fleet 3 times', count: 0, target: 3, reward: { aruvam: 150, arivu: 40 }, completed: false },
    { id: 'edict', title: 'Issue Royal Decrees', desc: 'Click Emperor 3 times', count: 0, target: 3, reward: { anbu: 100, aalavan: 60 }, completed: false }
  ]);

  const [showRadar, setShowRadar] = useState<boolean>(true);

  const [counters, setCounters] = useState({
    gold: resources.aruvam,
    knowledge: resources.arivu,
    devotion: resources.anbu,
    power: resources.aalavan
  });

  // Keep animated numbers smooth with Anime.js when resources change
  useEffect(() => {
    const obj = { ...counters };
    anime({
      targets: obj,
      gold: resources.aruvam,
      knowledge: resources.arivu,
      devotion: resources.anbu,
      power: resources.aalavan,
      round: 1,
      easing: 'easeOutExpo',
      duration: 1000,
      update: () => {
        setCounters({ ...obj });
      }
    });
  }, [resources.aruvam, resources.arivu, resources.anbu, resources.aalavan]);

  // Set up Anime.js world animations when mounted
  useEffect(() => {
    if (!svgRef.current) return;

    // 1. River Water Current Motion
    const waterAnim = anime({
      targets: '#anime-river-water path',
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'linear',
      duration: 4000,
      loop: true
    });

    // 2. Temple Vimana Golden Energy Beam Glow
    const templeGlowAnim = anime({
      targets: '#anime-temple-glow',
      scale: [0.95, 1.15],
      opacity: [0.35, 0.85],
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      duration: 2000
    });

    // 3. Ships Rocking at Nagapattinam Port
    const shipAnim = anime({
      targets: '.anime-ship',
      translateY: [-4, 4],
      rotate: [-3, 3],
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutQuad',
      duration: 3200,
      delay: anime.stagger(400)
    });

    // 4. War Elephants Patrol Walking
    const elephantPatrol = anime({
      targets: '#anime-elephant-unit',
      translateX: [0, 160],
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      duration: 9000
    });

    // 5. Sky Flying Birds Flocks
    const birdsAnim = anime({
      targets: '.anime-bird',
      translateX: [-100, 1100],
      translateY: () => [anime.random(-20, 20), anime.random(-40, 40)],
      easing: 'linear',
      duration: 16000,
      loop: true,
      delay: anime.stagger(3000)
    });

    // 6. Floating Temple Lotus Petals
    const lotusPetals = anime({
      targets: '.anime-lotus-petal',
      translateY: [0, -80],
      translateX: () => [0, anime.random(-30, 30)],
      opacity: [1, 0],
      scale: [1, 0.5],
      easing: 'easeOutQuad',
      duration: 4000,
      loop: true,
      delay: anime.stagger(1200)
    });

    // 7. Emperor Guard Idle Breathing
    const emperorIdle = anime({
      targets: '#anime-emperor-group',
      translateY: [-2, 2],
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      duration: 1800
    });

    return () => {
      waterAnim?.pause?.();
      templeGlowAnim?.pause?.();
      shipAnim?.pause?.();
      elephantPatrol?.pause?.();
      birdsAnim?.pause?.();
      lotusPetals?.pause?.();
      emperorIdle?.pause?.();
    };
  }, []);

  // Monsoon Weather Anime.js Physics & Visual Effect
  useEffect(() => {
    if (!monsoonWeather || !containerRef.current) return;

    // Trigger visual weather particle effect
    const type = monsoonWeather.type;
    const isRain = type === 'southwest_rain' || type === 'northeast_cyclone';

    if (isRain) {
      // Spawn rain lines
      const rainContainer = document.createElement('div');
      rainContainer.className = 'absolute inset-0 pointer-events-none overflow-hidden z-20';
      containerRef.current.appendChild(rainContainer);

      const drops: HTMLDivElement[] = [];
      for (let i = 0; i < 25; i++) {
        const drop = document.createElement('div');
        drop.className = 'absolute w-0.5 h-6 bg-sky-300/60 rounded-full';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.top = `-20px`;
        rainContainer.appendChild(drop);
        drops.push(drop);
      }

      const rainAnim = anime({
        targets: drops,
        translateY: [0, 400],
        translateX: type === 'northeast_cyclone' ? [-20, 60] : [0, 10],
        opacity: [0.8, 0],
        duration: type === 'northeast_cyclone' ? 600 : 900,
        easing: 'linear',
        loop: true,
        delay: anime.stagger(40)
      });

      return () => {
        rainAnim?.pause?.();
        if (rainContainer.parentNode) rainContainer.parentNode.removeChild(rainContainer);
      };
    }
  }, [monsoonWeather]);


  // Trigger Anime.js Particle Explosion Micro-interaction
  const triggerParticleBurst = (clientX: number, clientY: number, color = '#D4AF37') => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Tamil Runes / Micro-Symbols
    const symbols = ['ௐ', '🐉', '🪷', '⚔️', '🪙', '📜', '👑', '🐘'];

    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'absolute pointer-events-none text-xs font-bold font-serif select-none z-30';
      p.innerText = symbols[Math.floor(Math.random() * symbols.length)];
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.color = color;
      containerRef.current.appendChild(p);

      const angle = (i / 12) * Math.PI * 2;
      const distance = 40 + Math.random() * 60;

      anime({
        targets: p,
        translateX: Math.cos(angle) * distance,
        translateY: Math.sin(angle) * distance - 20,
        opacity: [1, 0],
        scale: [1, 1.8],
        rotate: anime.random(-180, 180),
        duration: 900 + Math.random() * 400,
        easing: 'easeOutExpo',
        complete: () => {
          if (p.parentNode) p.parentNode.removeChild(p);
        }
      });
    }
  };

  // 2D Floating Text Yield Indicator (Anime.js)
  const spawnFloatingText = (clientX: number, clientY: number, text: string, color = '#FFD700') => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const el = document.createElement('div');
    el.className = 'absolute pointer-events-none font-bold font-mono text-xs shadow-xl z-40 select-none px-2 py-0.5 rounded-lg bg-stone-900/90 border border-[#D2691E]/60 text-stone-100 flex items-center gap-1';
    el.innerHTML = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    containerRef.current.appendChild(el);

    anime({
      targets: el,
      translateY: [-10, -70],
      translateX: [0, (Math.random() - 0.5) * 40],
      scale: [0.8, 1.3, 1],
      opacity: [1, 1, 0],
      duration: 1300,
      easing: 'easeOutCubic',
      complete: () => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    });
  };

  // Train & Upgrade Unit Level
  const handleTrainUnit = (unitId: string, costAruvam: number) => {
    if (resources.aruvam >= costAruvam) {
      onEarnResources({ aruvam: -costAruvam });
      setUnitLevels(prev => ({ ...prev, [unitId]: (prev[unitId] || 1) + 1 }));
      audio.playBell();
      audio.playDrum(true);

      const levelBadges = document.querySelectorAll(`.unit-level-badge-${unitId}`);
      if (levelBadges.length > 0) {
        anime({
          targets: levelBadges,
          scale: [1, 1.8, 1],
          duration: 600,
          easing: 'easeOutElastic(1, .5)'
        });
      }
    }
  };

  // Update Quest Progress
  const updateQuestProgress = (questId: string) => {
    setQuests(prev => prev.map(q => {
      if (q.id === questId && !q.completed) {
        const nextCount = q.count + 1;
        const isDone = nextCount >= q.target;
        if (isDone) {
          audio.playBell();
          audio.playDrum(true);
          onEarnResources(q.reward);
        }
        return { ...q, count: nextCount, completed: isDone };
      }
      return q;
    }));
  };

  // Character Action Trigger
  const handleCharacterClick = (charId: string, e: React.MouseEvent) => {
    triggerParticleBurst(e.clientX, e.clientY, '#D2691E');
    setActiveCharacter(charId);

    const level = unitLevels[charId] || 1;
    const mult = 1 + (level - 1) * 0.4; // +40% per level

    if (charId === 'emperor') {
      audio.playBell();
      audio.playDrum(true);
      const devYield = Math.round(12 * mult);
      const powYield = Math.round(8 * mult);
      onEarnResources({ anbu: devYield, aalavan: powYield });
      setCharacterActionText(`👑 Rajaraja Cholan issues an Imperial Sasana decree! (+${devYield} Devotion, +${powYield} Power) [Lvl ${level}]`);
      spawnFloatingText(e.clientX, e.clientY, `+${devYield} 🪷 Devotion • +${powYield} ⚔️ Power`, '#FFD700');
      updateQuestProgress('edict');

      // Anime.js Golden Imperial Wave expansion
      anime({
        targets: '#anime-temple-glow',
        scale: [1, 2.5, 1],
        opacity: [0.3, 0.9, 0.3],
        duration: 1200,
        easing: 'easeOutExpo'
      });

    } else if (charId === 'elephant') {
      audio.playDrum(true);
      const powYield = Math.round(15 * mult);
      onEarnResources({ aalavan: powYield });
      setCharacterActionText(`🐘 Royal War Elephant Squadron (Anai Padai) hauls granite blocks! (+${powYield} Power) [Lvl ${level}]`);
      spawnFloatingText(e.clientX, e.clientY, `+${powYield} ⚔️ Power`, '#EF4444');
      updateQuestProgress('elephants');

      anime({
        targets: '#anime-elephant-unit',
        scale: [1, 1.25, 1],
        duration: 600,
        easing: 'easeOutElastic(1, .5)'
      });

    } else if (charId === 'architect') {
      audio.playBell();
      const knwYield = Math.round(15 * mult);
      onEarnResources({ arivu: knwYield });
      setCharacterActionText(`🏛️ Master Architect Kunjara Mallan calculates Vastu stone precision! (+${knwYield} Knowledge) [Lvl ${level}]`);
      spawnFloatingText(e.clientX, e.clientY, `+${knwYield} 📜 Knowledge`, '#4A90E2');

      anime({
        targets: '#anime-architect-group',
        rotate: [-15, 15, 0],
        duration: 800,
        easing: 'easeInOutBack'
      });

    } else if (charId === 'admiral') {
      audio.playYazh(349.23);
      const goldYield = Math.round(25 * mult);
      onEarnResources({ aruvam: goldYield });
      setCharacterActionText(`⛵ Kadal Pira Fleet Admiral returns with overseas maritime tributes! (+${goldYield} Gold) [Lvl ${level}]`);
      spawnFloatingText(e.clientX, e.clientY, `+${goldYield} 🪙 Gold`, '#D4AF37');
      updateQuestProgress('fleet');

      anime({
        targets: '.anime-ship',
        translateX: [0, 80, 0],
        duration: 2000,
        easing: 'easeInOutSine'
      });

    } else if (charId === 'farmer') {
      audio.playYazh(293.66);
      const goldYield = Math.round(18 * mult);
      const devYield = Math.round(5 * mult);
      onEarnResources({ aruvam: goldYield, anbu: devYield });
      setCharacterActionText(`🌾 Kaveri Paddy Farmers harvest golden rice crops from Ur fields! (+${goldYield} Gold, +${devYield} Devotion) [Lvl ${level}]`);
      spawnFloatingText(e.clientX, e.clientY, `+${goldYield} 🪙 Gold • +${devYield} 🪷 Devotion`, '#5C8A32');
      updateQuestProgress('harvest');

      anime({
        targets: '#anime-paddy-crops rect',
        scaleY: [1, 1.4, 1],
        delay: anime.stagger(100),
        duration: 800,
        easing: 'easeOutBack'
      });
    }
  };

  return (
    <div 
      ref={containerRef} 
      id="anime-world-simulation-container"
      className="relative w-full rounded-2xl border-2 border-[#D2691E]/50 overflow-hidden bg-[#1C1713] shadow-2xl select-none"
    >
      {/* Top Banner Header */}
      <div className="p-4 bg-gradient-to-r from-[#241D18] via-[#1C1713] to-[#241D18] border-b border-[#D2691E]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#D2691E]/20 text-[#D2691E] font-mono text-[10px] font-bold uppercase tracking-wider border border-[#D2691E]/40">
              Anime.js Live Physics Engine
            </span>
            <h3 className="text-base font-serif font-bold text-[#F4EFE6] flex items-center gap-1.5">
              Chola World & Character Simulation <span className="text-[#D2691E] text-xs font-mono">(உயிரோட்ட உலகம்)</span>
            </h3>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Tap characters, war elephants, architectural sites, or ships to trigger Anime.js micro-interaction physics & harvest imperial yields!
          </p>
        </div>

        {/* Live Animated Counters Powered by Anime.js */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className="p-1.5 rounded bg-[#2D241E] border border-[#D4AF37]/30 text-[#D4AF37]">
            <span className="text-[10px] block text-stone-400">🪙 Gold</span>
            <strong className="font-bold">{counters.gold}</strong>
          </div>
          <div className="p-1.5 rounded bg-[#2D241E] border border-[#4A90E2]/30 text-[#4A90E2]">
            <span className="text-[10px] block text-stone-400">📜 Knowledge</span>
            <strong className="font-bold">{counters.knowledge}</strong>
          </div>
          <div className="p-1.5 rounded bg-[#2D241E] border border-[#FF6B6B]/30 text-[#FF6B6B]">
            <span className="text-[10px] block text-stone-400">🪷 Devotion</span>
            <strong className="font-bold">{counters.devotion}</strong>
          </div>
          <div className="p-1.5 rounded bg-[#2D241E] border border-[#EF4444]/30 text-[#EF4444]">
            <span className="text-[10px] block text-stone-400">⚔️ Power</span>
            <strong className="font-bold">{counters.power}</strong>
          </div>
        </div>
      </div>

      {/* Main Interactive Animated SVG World Stage (1000 x 520) */}
      <div 
        className="relative aspect-[1000/520] w-full bg-stone-950 cursor-crosshair overflow-hidden"
        onClick={(e) => triggerParticleBurst(e.clientX, e.clientY, '#D4AF37')}
      >
        <svg 
          ref={svgRef}
          viewBox="0 0 1000 520" 
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            {/* Sky & Ground Gradients */}
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2c1a0e" />
              <stop offset="40%" stopColor="#4a2e18" />
              <stop offset="100%" stopColor="#1a120b" />
            </linearGradient>

            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a3b5c" />
              <stop offset="50%" stopColor="#0e2942" />
              <stop offset="100%" stopColor="#1e4d78" />
            </linearGradient>

            <linearGradient id="paddyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2d4a1e" />
              <stop offset="100%" stopColor="#1b3310" />
            </linearGradient>

            <radialGradient id="templeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#d2691e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. SKY & CLOUDS BACKGROUND */}
          <rect width="1000" height="180" fill="url(#skyGrad)" />
          <circle cx="850" cy="50" r="35" fill="#f4efe6" opacity="0.9" />
          <circle cx="850" cy="50" r="50" fill="#ffd700" opacity="0.2" />

          {/* Drifting Anime.js Sky Birds */}
          <g className="anime-bird" opacity="0.8">
            <path d="M 0,0 Q 10,-10 20,0 Q 30,-10 40,0" fill="none" stroke="#f4efe6" strokeWidth="2" />
          </g>
          <g className="anime-bird" opacity="0.7">
            <path d="M 0,20 Q 8,12 16,20 Q 24,12 32,20" fill="none" stroke="#d2691e" strokeWidth="1.5" />
          </g>

          {/* 2. KAULERY RIVER & IRRIGATION CANALS */}
          <rect y="380" width="1000" height="140" fill="url(#waterGrad)" />
          <path d="M 0,220 C 250,180 350,300 500,280 C 650,260 750,380 1000,380 L 1000,520 L 0,520 Z" fill="url(#waterGrad)" opacity="0.85" />

          {/* Animated Water Current Lines */}
          <g id="anime-river-water" stroke="#4a90e2" strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="15 10">
            <path d="M 20,240 C 250,200 350,320 500,300 C 650,280 750,400 980,400" />
            <path d="M 50,270 C 270,230 370,350 520,330 C 670,310 770,430 950,430" />
          </g>

          {/* 3. KAULERI DELTA AGRICULTURAL PADDY FIELDS */}
          <g id="anime-paddy-crops">
            <polygon points="50,180 300,180 260,260 10,260" fill="url(#paddyGrad)" stroke="#3a5a25" strokeWidth="2" />
            {/* Paddy Crop Rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={i} x={70 + i * 24} y="195" width="6" height="45" fill="#5c8a32" rx="3" className="cursor-pointer hover:fill-[#ffd700] transition" />
            ))}
          </g>

          {/* 4. PERUVUDAIYAR TEMPLE (BRIHADEESWARAR) VIMANA TOWER */}
          <g id="anime-temple-group" className="cursor-pointer" onClick={(e) => handleCharacterClick('architect', e)}>
            {/* Base Stone Platform & Mandapam Hall */}
            <rect x="410" y="240" width="180" height="40" fill="#3D3028" stroke="#D2691E" strokeWidth="2" rx="2" />
            {/* Pillared Entrance Cloister */}
            <line x1="430" y1="240" x2="430" y2="280" stroke="#D4AF37" strokeWidth="3" />
            <line x1="460" y1="240" x2="460" y2="280" stroke="#D4AF37" strokeWidth="3" />
            <line x1="490" y1="240" x2="490" y2="280" stroke="#D4AF37" strokeWidth="3" />
            <line x1="510" y1="240" x2="510" y2="280" stroke="#D4AF37" strokeWidth="3" />
            <line x1="540" y1="240" x2="540" y2="280" stroke="#D4AF37" strokeWidth="3" />
            <line x1="570" y1="240" x2="570" y2="280" stroke="#D4AF37" strokeWidth="3" />

            {/* 13-Tier Pyramidal Granite Vimana Tower */}
            <polygon points="500,30 430,240 570,240" fill="#2D221A" stroke="#D2691E" strokeWidth="2" />
            
            {/* Vimana Tier Rib Carvings */}
            <line x1="440" y1="210" x2="560" y2="210" stroke="#D4AF37" strokeWidth="2" />
            <line x1="450" y1="180" x2="550" y2="180" stroke="#D2691E" strokeWidth="2" />
            <line x1="460" y1="150" x2="540" y2="150" stroke="#D4AF37" strokeWidth="2" />
            <line x1="470" y1="120" x2="530" y2="120" stroke="#D2691E" strokeWidth="2" />
            <line x1="480" y1="90" x2="520" y2="90" stroke="#D4AF37" strokeWidth="2" />
            <line x1="490" y1="60" x2="510" y2="60" stroke="#D2691E" strokeWidth="2" />

            {/* 80-Ton Monolithic Golden Capstone (Kumbam) & Stupi */}
            <circle cx="500" cy="25" r="16" fill="#FFD700" stroke="#D2691E" strokeWidth="2" />
            <polygon points="500,5 496,25 504,25" fill="#FFE57F" stroke="#B45309" strokeWidth="1" />
            <circle id="anime-temple-glow" cx="500" cy="25" r="40" fill="url(#templeGlow)" />

            {/* Temple Entrance Doorway with Diya Light */}
            <rect x="488" y="245" width="24" height="35" fill="#120F0D" stroke="#FFD700" strokeWidth="1.5" rx="1" />
            <circle cx="500" cy="260" r="3" fill="#EF4444" className="animate-pulse" />

            {/* Floating Devotion Petals */}
            <circle className="anime-lotus-petal" cx="480" cy="230" r="4" fill="#FF6B6B" />
            <circle className="anime-lotus-petal" cx="520" cy="220" r="5" fill="#FFD700" />
          </g>

          {/* Shockwave Circle */}
          <circle id="anime-[#F4EFE6] Shockwave" cx="500" cy="280" r="10" fill="none" stroke="#FFD700" strokeWidth="3" opacity="0" />

          {/* 5. CHARACTER 1: EMPEROR RAJARAJA CHOLAN (ROYAL COURT) */}
          <g 
            id="anime-emperor-group" 
            className="cursor-pointer"
            onClick={(e) => handleCharacterClick('emperor', e)}
          >
            {/* Royal Pavilion Mandapam Platform */}
            <rect x="315" y="300" width="80" height="45" fill="#241D18" stroke="#D2691E" strokeWidth="2" rx="4" />
            <line x1="325" y1="300" x2="325" y2="345" stroke="#D4AF37" strokeWidth="2" />
            <line x1="385" y1="300" x2="385" y2="345" stroke="#D4AF37" strokeWidth="2" />

            {/* Emperor Lion Throne Seat */}
            <path d="M 340,310 L 370,310 L 372,335 L 338,335 Z" fill="#78350F" stroke="#D4AF37" strokeWidth="1.5" />

            {/* Emperor Body in Red/Gold Silk Robes */}
            <path d="M 345,315 C 345,305 365,305 365,315 L 368,335 L 342,335 Z" fill="#DC2626" stroke="#F59E0B" strokeWidth="1" />
            {/* Gold Shoulder Armlets & Chest Jewel */}
            <circle cx="355" cy="318" r="3" fill="#FFD700" />

            {/* Head & Crown (Makuta) */}
            <circle cx="355" cy="302" r="7" fill="#D2691E" /> {/* Face */}
            <polygon points="355,286 348,298 362,298" fill="#FFD700" stroke="#B45309" strokeWidth="1" /> {/* Gold Crown */}
            <circle cx="355" cy="288" r="2" fill="#EF4444" /> {/* Crown Ruby */}

            {/* Royal Spear / Chola Tiger Crest Flag */}
            <line x1="380" y1="270" x2="380" y2="345" stroke="#FFD700" strokeWidth="2.5" />
            <polygon points="380,270 405,280 380,290" fill="#DC2626" stroke="#FFD700" strokeWidth="1" />
            <circle cx="392" cy="280" r="3" fill="#FFD700" /> {/* Tiger Emblem */}

            <text x="355" y="358" textAnchor="middle" fill="#FFD700" fontSize="10" fontFamily="serif" fontWeight="bold">
              👑 Rajaraja Cholan
            </text>
          </g>

          {/* 6. CHARACTER 2: WAR ELEPHANT SQUADRON (ANAI PADAI) */}
          <g 
            id="anime-elephant-unit" 
            className="cursor-pointer"
            onClick={(e) => handleCharacterClick('elephant', e)}
          >
            {/* Elephant Feet / Shadow */}
            <ellipse cx="680" cy="285" rx="36" ry="10" fill="#120F0D" opacity="0.6" />

            {/* Main Elephant Body */}
            <ellipse cx="680" cy="265" rx="36" ry="24" fill="#57534E" stroke="#292524" strokeWidth="2" />
            
            {/* Elephant Head */}
            <circle cx="715" cy="254" r="18" fill="#57534E" stroke="#292524" strokeWidth="1.5" />
            
            {/* Decorative Gold Head Plate (Pattam) */}
            <path d="M 705,242 C 715,238 725,245 722,254 Z" fill="#FFD700" stroke="#B45309" strokeWidth="1" />

            {/* Curved Tusks */}
            <path d="M 724,260 Q 740,260 738,248" fill="none" stroke="#F4EFE6" strokeWidth="3.5" strokeLinecap="round" />

            {/* Trunk */}
            <path d="M 726,256 Q 742,272 730,285" fill="none" stroke="#57534E" strokeWidth="6" strokeLinecap="round" />

            {/* Ears */}
            <path d="M 700,245 Q 688,255 700,268 Z" fill="#44403C" stroke="#292524" strokeWidth="1" />

            {/* Red & Gold Decorated Howdah Seat */}
            <rect x="662" y="230" width="30" height="18" fill="#DC2626" stroke="#FFD700" strokeWidth="1.5" rx="3" />
            <path d="M 662,230 L 692,230" stroke="#FFD700" strokeWidth="2" />

            {/* Howdah Banner & Spear */}
            <line x1="677" y1="205" x2="677" y2="230" stroke="#FFD700" strokeWidth="2" />
            <polygon points="677,205 692,212 677,219" fill="#DC2626" />

            <text x="680" y="302" textAnchor="middle" fill="#F4EFE6" fontSize="10" fontFamily="serif" fontWeight="bold">
              🐘 Anai Padai (War Elephant)
            </text>
          </g>

          {/* 7. CHARACTER 3: MASTER ARCHITECT KUNJARA MALLAN */}
          <g 
            id="anime-architect-group" 
            className="cursor-pointer"
            onClick={(e) => handleCharacterClick('architect', e)}
          >
            {/* Architect Standing Platform & Blueprints */}
            <rect x="420" y="285" width="45" height="35" fill="#1C1713" stroke="#4A90E2" strokeWidth="1.5" rx="3" />

            {/* Architect Character Figure */}
            <circle cx="435" cy="295" r="5" fill="#D2691E" /> {/* Head */}
            <path d="M 430,302 C 430,300 440,300 440,302 L 442,316 L 428,316 Z" fill="#F4EFE6" stroke="#4A90E2" strokeWidth="0.8" /> {/* Dhoti */}

            {/* Palm Leaf Scroll (Oolai Chuvadi) */}
            <rect x="442" y="298" width="16" height="8" fill="#FDE047" stroke="#78350F" strokeWidth="0.8" rx="1" />
            <line x1="444" y1="302" x2="456" y2="302" stroke="#78350F" strokeWidth="0.8" strokeDasharray="1 1" />

            <text x="442" y="330" textAnchor="middle" fill="#4A90E2" fontSize="9" fontFamily="mono" fontWeight="bold">
              🏛️ Architect Mallan
            </text>
          </g>

          {/* 8. CHARACTER 4: NAGAPATTINAM PORT & KADAL PIRA SHIPS */}
          <g id="anime-port-fleet">
            {/* Port Wooden Pier & Crane */}
            <rect x="60" y="420" width="260" height="22" fill="#451A03" stroke="#D2691E" strokeWidth="1.5" rx="2" />
            <line x1="80" y1="420" x2="80" y2="442" stroke="#78350F" strokeWidth="3" />
            <line x1="160" y1="420" x2="160" y2="442" stroke="#78350F" strokeWidth="3" />
            <line x1="240" y1="420" x2="240" y2="442" stroke="#78350F" strokeWidth="3" />

            {/* Admiral Ship (Flagship) */}
            <g 
              className="anime-ship cursor-pointer" 
              onClick={(e) => handleCharacterClick('admiral', e)}
            >
              {/* Detailed Wooden Ship Hull */}
              <path d="M 90,430 Q 140,465 190,430 L 180,410 L 100,410 Z" fill="#78350F" stroke="#FFD700" strokeWidth="1.5" />
              <path d="M 100,410 L 180,410" stroke="#D4AF37" strokeWidth="2" />

              {/* Carved Dragon/Yali Prow Bow */}
              <circle cx="92" cy="415" r="4" fill="#FFD700" />

              {/* Main Wooden Mast */}
              <line x1="140" y1="365" x2="140" y2="410" stroke="#F4EFE6" strokeWidth="3" />

              {/* Billowing White & Gold Sail with Tiger Emblem */}
              <path d="M 140,370 Q 170,388 140,405 Z" fill="#F4EFE6" stroke="#D2691E" strokeWidth="1" />
              <circle cx="152" cy="388" r="4" fill="#DC2626" />

              {/* Flag Admiral Text */}
              <text x="140" y="472" textAnchor="middle" fill="#38BDF8" fontSize="10" fontFamily="serif" fontWeight="bold">
                ⛵ Kadal Pira Fleet Admiral
              </text>
            </g>

            {/* Merchant Companion Ship */}
            <g 
              className="anime-ship cursor-pointer" 
              onClick={(e) => handleCharacterClick('admiral', e)}
            >
              <path d="M 210,440 Q 245,468 280,440 L 270,425 L 220,425 Z" fill="#451A03" stroke="#D2691E" strokeWidth="1.5" />
              <line x1="245" y1="388" x2="245" y2="425" stroke="#F4EFE6" strokeWidth="2.5" />
              <path d="M 245,392 Q 268,405 245,420 Z" fill="#FFD700" opacity="0.9" />
            </g>
          </g>

          {/* 9. CHARACTER 5: KAVERI PADDY FARMER */}
          <g 
            className="cursor-pointer"
            onClick={(e) => handleCharacterClick('farmer', e)}
          >
            {/* Farmer Avatar Figure with Straw Hat & Harvest Sickle */}
            <circle cx="160" cy="220" r="5" fill="#D2691E" /> {/* Head */}
            <path d="M 155,217 L 165,217 L 160,212 Z" fill="#FDE047" stroke="#78350F" strokeWidth="0.8" /> {/* Straw Hat */}
            <line x1="160" y1="225" x2="160" y2="242" stroke="#F4EFE6" strokeWidth="2" /> {/* Body */}
            
            {/* Harvest Sickle */}
            <path d="M 160,230 Q 172,225 168,236" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />

            <text x="160" y="254" textAnchor="middle" fill="#10B981" fontSize="9" fontFamily="mono" fontWeight="bold">
              🌾 Kaveri Farmer
            </text>
          </g>

        </svg>

        {/* 2D QUEST HUD BOX (TOP LEFT OVERLAY) */}
        <div className="absolute top-3 left-3 bg-[#120F0D]/90 border border-[#D2691E]/50 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-xs z-30">
          <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-1.5 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#D2691E]" /> Imperial Quests
            </span>
            <span className="text-[9px] font-mono text-stone-400">
              {quests.filter(q => q.completed).length}/{quests.length} Done
            </span>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1 text-xs">
            {quests.map(q => (
              <div 
                key={q.id} 
                className={`p-2 rounded-lg border transition ${
                  q.completed 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                    : 'bg-[#1C1713] border-stone-800 text-stone-300'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-serif font-bold">
                  <span>{q.title}</span>
                  <span className="font-mono text-[10px]">{q.count}/{q.target}</span>
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">{q.desc}</div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className={`h-full transition-all duration-500 ${q.completed ? 'bg-emerald-400' : 'bg-[#D2691E]'}`}
                    style={{ width: `${Math.min(100, (q.count / q.target) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2D MINI-MAP RADAR SCREEN (TOP RIGHT OVERLAY) */}
        <div className="absolute top-3 right-3 z-30">
          {showRadar ? (
            <div className="bg-[#120F0D]/95 border-2 border-[#D2691E]/60 rounded-xl p-2 shadow-2xl backdrop-blur-md w-36">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#D4AF37] mb-1.5 border-b border-stone-800 pb-1">
                <span className="flex items-center gap-1 font-bold">
                  <Compass className="w-3 h-3 text-[#D2691E] animate-spin" /> 2D Radar
                </span>
                <button 
                  onClick={() => setShowRadar(false)}
                  className="text-stone-400 hover:text-stone-200 text-[10px] px-1"
                >
                  ✕
                </button>
              </div>
              {/* Mini-map SVG Radar Canvas */}
              <div className="relative aspect-[16/10] w-full bg-stone-950 rounded-lg border border-stone-800 overflow-hidden">
                {/* Grid Scan Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1713_1px,transparent_1px),linear-gradient(to_bottom,#1c1713_1px,transparent_1px)] bg-[size:8px_8px] opacity-40 pointer-events-none" />
                {/* River Band */}
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-sky-900/60" />
                {/* Radar Blips */}
                {/* Vimana Temple */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" title="Vimana Temple" />
                {/* Emperor Court */}
                <div className="absolute top-5 left-8 w-1.5 h-1.5 rounded-full bg-amber-400" title="Emperor Pavilion" />
                {/* War Elephant Patrol */}
                <div className="absolute top-5 right-6 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Anai Padai Patrol" />
                {/* Trade Ships */}
                <div className="absolute bottom-1 left-4 w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" title="Trade Fleet" />
                {/* Paddy Fields */}
                <div className="absolute top-4 left-3 w-1.5 h-1.5 rounded-full bg-emerald-400" title="Kaveri Fields" />
              </div>
              <div className="text-[8px] font-mono text-center text-stone-400 mt-1">
                Thanjavur Tactical View
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRadar(true)}
              className="px-2.5 py-1 rounded-lg bg-[#120F0D]/90 border border-[#D2691E]/60 text-[10px] font-mono text-[#D4AF37] flex items-center gap-1 shadow-lg hover:bg-[#241D18]"
            >
              <Compass className="w-3 h-3 text-[#D2691E]" /> Show 2D Radar
            </button>
          )}
        </div>

        {/* Live Active Action Banner */}
        <div className="absolute bottom-3 left-3 right-3 bg-[#120F0D]/95 border border-[#D2691E]/40 p-3 rounded-xl backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-[#D2691E]/20 text-[#D2691E]">
              <Sparkles className="w-4 h-4 animate-spin" />
            </span>
            <p className="text-xs text-[#F4EFE6] font-serif leading-snug">
              {characterActionText}
            </p>
          </div>
          <div className="text-[10px] font-mono text-stone-400 whitespace-nowrap">
            Active Character: <span className="text-[#D4AF37] font-bold uppercase">{activeCharacter}</span>
          </div>
        </div>
      </div>

      {/* Character Command Panel & 2D Unit Level Up Control */}
      <div className="p-3 bg-[#1C1713] border-t border-[#D2691E]/20 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* Emperor */}
        <div className={`p-2 rounded-lg border transition flex flex-col justify-between gap-1.5 ${
          activeCharacter === 'emperor'
            ? 'bg-[#D2691E]/20 border-[#D2691E]'
            : 'bg-[#241D18] border-stone-800'
        }`}>
          <button
            onClick={(e) => handleCharacterClick('emperor', e)}
            className="flex items-center gap-2 text-left cursor-pointer w-full"
          >
            <Crown className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div>
              <div className="text-xs font-bold font-serif text-[#F4EFE6]">Rajaraja</div>
              <div className="text-[9px] text-stone-400 font-mono">
                Lvl <span className={`font-bold text-[#D4AF37] unit-level-badge-emperor`}>{unitLevels.emperor || 1}</span> Emperor
              </div>
            </div>
          </button>
          <button
            onClick={() => handleTrainUnit('emperor', 50)}
            disabled={resources.aruvam < 50}
            className={`w-full py-1 px-1.5 rounded text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition ${
              resources.aruvam >= 50 
                ? 'bg-[#D4AF37] text-black hover:bg-amber-300 cursor-pointer shadow' 
                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3 h-3" /> Train (50🪙)
          </button>
        </div>

        {/* Elephant */}
        <div className={`p-2 rounded-lg border transition flex flex-col justify-between gap-1.5 ${
          activeCharacter === 'elephant'
            ? 'bg-[#D2691E]/20 border-[#D2691E]'
            : 'bg-[#241D18] border-stone-800'
        }`}>
          <button
            onClick={(e) => handleCharacterClick('elephant', e)}
            className="flex items-center gap-2 text-left cursor-pointer w-full"
          >
            <Shield className="w-4 h-4 text-[#EF4444] shrink-0" />
            <div>
              <div className="text-xs font-bold font-serif text-[#F4EFE6]">Anai Padai</div>
              <div className="text-[9px] text-stone-400 font-mono">
                Lvl <span className={`font-bold text-[#EF4444] unit-level-badge-elephant`}>{unitLevels.elephant || 1}</span> War Elephants
              </div>
            </div>
          </button>
          <button
            onClick={() => handleTrainUnit('elephant', 60)}
            disabled={resources.aruvam < 60}
            className={`w-full py-1 px-1.5 rounded text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition ${
              resources.aruvam >= 60 
                ? 'bg-[#EF4444] text-white hover:bg-red-600 cursor-pointer shadow' 
                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3 h-3" /> Train (60🪙)
          </button>
        </div>

        {/* Architect */}
        <div className={`p-2 rounded-lg border transition flex flex-col justify-between gap-1.5 ${
          activeCharacter === 'architect'
            ? 'bg-[#D2691E]/20 border-[#D2691E]'
            : 'bg-[#241D18] border-stone-800'
        }`}>
          <button
            onClick={(e) => handleCharacterClick('architect', e)}
            className="flex items-center gap-2 text-left cursor-pointer w-full"
          >
            <Feather className="w-4 h-4 text-[#4A90E2] shrink-0" />
            <div>
              <div className="text-xs font-bold font-serif text-[#F4EFE6]">Kunjara Mallan</div>
              <div className="text-[9px] text-stone-400 font-mono">
                Lvl <span className={`font-bold text-[#4A90E2] unit-level-badge-architect`}>{unitLevels.architect || 1}</span> Architect
              </div>
            </div>
          </button>
          <button
            onClick={() => handleTrainUnit('architect', 55)}
            disabled={resources.aruvam < 55}
            className={`w-full py-1 px-1.5 rounded text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition ${
              resources.aruvam >= 55 
                ? 'bg-[#4A90E2] text-white hover:bg-blue-600 cursor-pointer shadow' 
                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3 h-3" /> Train (55🪙)
          </button>
        </div>

        {/* Admiral */}
        <div className={`p-2 rounded-lg border transition flex flex-col justify-between gap-1.5 ${
          activeCharacter === 'admiral'
            ? 'bg-[#D2691E]/20 border-[#D2691E]'
            : 'bg-[#241D18] border-stone-800'
        }`}>
          <button
            onClick={(e) => handleCharacterClick('admiral', e)}
            className="flex items-center gap-2 text-left cursor-pointer w-full"
          >
            <Anchor className="w-4 h-4 text-[#D2691E] shrink-0" />
            <div>
              <div className="text-xs font-bold font-serif text-[#F4EFE6]">Kadal Admiral</div>
              <div className="text-[9px] text-stone-400 font-mono">
                Lvl <span className={`font-bold text-[#D2691E] unit-level-badge-admiral`}>{unitLevels.admiral || 1}</span> Naval Captain
              </div>
            </div>
          </button>
          <button
            onClick={() => handleTrainUnit('admiral', 70)}
            disabled={resources.aruvam < 70}
            className={`w-full py-1 px-1.5 rounded text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition ${
              resources.aruvam >= 70 
                ? 'bg-[#D2691E] text-white hover:bg-amber-700 cursor-pointer shadow' 
                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3 h-3" /> Train (70🪙)
          </button>
        </div>

        {/* Farmer */}
        <div className={`p-2 rounded-lg border transition flex flex-col justify-between gap-1.5 col-span-2 sm:col-span-1 ${
          activeCharacter === 'farmer'
            ? 'bg-[#D2691E]/20 border-[#D2691E]'
            : 'bg-[#241D18] border-stone-800'
        }`}>
          <button
            onClick={(e) => handleCharacterClick('farmer', e)}
            className="flex items-center gap-2 text-left cursor-pointer w-full"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold font-serif text-[#F4EFE6]">Ur Farmers</div>
              <div className="text-[9px] text-stone-400 font-mono">
                Lvl <span className={`font-bold text-emerald-400 unit-level-badge-farmer`}>{unitLevels.farmer || 1}</span> Kaveri Delta
              </div>
            </div>
          </button>
          <button
            onClick={() => handleTrainUnit('farmer', 40)}
            disabled={resources.aruvam < 40}
            className={`w-full py-1 px-1.5 rounded text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition ${
              resources.aruvam >= 40 
                ? 'bg-emerald-500 text-black hover:bg-emerald-400 cursor-pointer shadow' 
                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3 h-3" /> Train (40🪙)
          </button>
        </div>
      </div>
    </div>
  );
}
