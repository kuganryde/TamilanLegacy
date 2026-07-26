/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TradeRoute, TradingShip, Resources, MonsoonWeather } from '../types';
import { Anchor, Compass, ShieldAlert, Sparkles, AlertTriangle, ArrowRight, Play, CloudRain, Wind } from 'lucide-react';
import { audio } from '../utils/audio';

interface PortCityMiniGameProps {
  resources: Resources;
  onTradeSuccess: (earned: Partial<Resources>) => void;
  onTradeLoss: (cost: number) => void;
  kadalPiraUnlocked: boolean; // Reduces voyage time
  compassUnlocked: boolean;    // Reduces pirate risk
  monsoonWeather?: MonsoonWeather;
}

export default function PortCityMiniGame({
  resources,
  onTradeSuccess,
  onTradeLoss,
  kadalPiraUnlocked,
  compassUnlocked,
  monsoonWeather,
}: PortCityMiniGameProps) {

  const [ships, setShips] = useState<TradingShip[]>([
    { id: 'ship1', name: 'Chola Kappal Vayu', status: 'idle', routeId: null, timeLeft: 0 },
    { id: 'ship2', name: 'Chola Kappal Agni', status: 'idle', routeId: null, timeLeft: 0 },
    { id: 'ship3', name: 'Chola Kappal Varuna', status: 'idle', routeId: null, timeLeft: 0 },
  ]);

  const [logs, setLogs] = useState<string[]>([
    "⚓ Harbourmaster: Fleet is ready at Nagapattinam Port. Assign ships to lucrative sea routes.",
  ]);

  // Historical Trade Routes
  const initialRoutes: TradeRoute[] = [
    {
      id: 'srilanka',
      name: 'Eela Mandalam (Sri Lanka)',
      destination: 'Pearl Coast & Jaffna',
      cargoType: 'Nacre Pearls & Gemstones',
      duration: 15,
      risk: 15,
      aruvamYield: 80,
      anbuYield: 15,
      arivuYield: 5,
    },
    {
      id: 'srivijaya',
      name: 'Srivijaya (Sumatra/Malacca)',
      destination: 'Kadaram Archipelago',
      cargoType: 'Cinnamon & Rare Spices',
      duration: 30,
      risk: 30,
      aruvamYield: 180,
      anbuYield: 40,
      arivuYield: 25,
    },
    {
      id: 'china',
      name: 'Song Empire (Guangzhou)',
      destination: 'Southern Sea Ports',
      cargoType: 'Imperial Silk & Porcelain',
      duration: 55,
      risk: 50,
      aruvamYield: 400,
      anbuYield: 80,
      arivuYield: 70,
    },
  ];

  const [routes, setRoutes] = useState<TradeRoute[]>(initialRoutes);

  // Apply technology & monsoon weather multipliers
  useEffect(() => {
    const updated = initialRoutes.map(route => {
      let duration = route.duration;
      let risk = route.risk;
      
      // Technology modifiers
      if (kadalPiraUnlocked) {
        duration = Math.max(5, Math.round(duration * 0.7)); // 30% faster
      }
      if (compassUnlocked) {
        risk = Math.max(5, Math.round(risk * 0.5)); // 50% less risky
      }

      // Monsoon Weather modifiers
      if (monsoonWeather) {
        risk = Math.max(5, Math.min(95, risk + monsoonWeather.maritimeRiskModifier));
        duration = Math.max(5, Math.round(duration * monsoonWeather.maritimeDurationMultiplier));
      }

      return { ...route, duration, risk };
    });
    setRoutes(updated);
  }, [kadalPiraUnlocked, compassUnlocked, monsoonWeather]);


  // Game ticks for active ship journeys
  useEffect(() => {
    const timer = setInterval(() => {
      setShips(prevShips =>
        prevShips.map(ship => {
          if (ship.status === 'sailing' && ship.timeLeft > 0) {
            return { ...ship, timeLeft: ship.timeLeft - 1 };
          }
          return ship;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Detect ship arrivals (when a sailing ship has 0 time left)
  useEffect(() => {
    const completedShips = ships.filter(s => s.status === 'sailing' && s.timeLeft === 0);
    if (completedShips.length > 0) {
      completedShips.forEach(ship => {
        handleShipReturn(ship);
      });
      
      setShips(prev =>
        prev.map(s => {
          const completed = completedShips.find(cs => cs.id === s.id);
          if (completed) {
            return { ...s, status: 'idle', routeId: null };
          }
          return s;
        })
      );
    }
  }, [ships, routes]);

  const handleShipReturn = (ship: TradingShip) => {
    const route = routes.find(r => r.id === ship.routeId);
    if (!route) return;

    // Roll dice for risk (monsoons or pirates)
    const roll = Math.random() * 100;
    const isCrisis = roll < route.risk;

    if (isCrisis) {
      const isPirates = Math.random() > 0.5;
      if (isPirates) {
        // Pirates attacked
        const cost = Math.round(route.aruvamYield * 0.5);
        audio.playDrum(true); // Disaster strike
        onTradeLoss(cost);
        setLogs(prev => [
          `🚨 Warning: ${ship.name} was raided by Malayan pirates! 50% of cargo lost. Paid ${cost} gold for ransom/repairs.`,
          ...prev,
        ]);
        
        // Recover partial reward
        onTradeSuccess({
          aruvam: Math.round(route.aruvamYield * 0.5),
          anbu: Math.round(route.anbuYield * 0.3),
          arivu: Math.round(route.arivuYield * 0.8),
        });
      } else {
        // Monsoon storm damage
        const repairCost = 50;
        audio.playDrum(true);
        onTradeLoss(repairCost);
        setLogs(prev => [
          `⛈️ Monsoon Alert: ${ship.name} ran into heavy seasonal squalls. Safely navigated back, but paid ${repairCost} gold for hull repairs.`,
          ...prev,
        ]);
        
        // Recover full cargo rewards
        onTradeSuccess({
          aruvam: route.aruvamYield,
          anbu: route.anbuYield,
          arivu: route.arivuYield,
        });
      }
    } else {
      // Perfect voyage
      audio.playBell(); // Bell ring
      onTradeSuccess({
        aruvam: route.aruvamYield,
        anbu: route.anbuYield,
        arivu: route.arivuYield,
      });
      setLogs(prev => [
        `✨ Success: ${ship.name} returned safely from ${route.name}! Earned +${route.aruvamYield} Wealth, +${route.anbuYield} Devotion, +${route.arivuYield} Knowledge.`,
        ...prev,
      ]);
    }
  };

  const launchShip = (shipId: string, routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;

    audio.playYazh(349.23); // Medium high pluck (F4)
    setShips(prevShips =>
      prevShips.map(s => {
        if (s.id === shipId) {
          return {
            ...s,
            status: 'sailing',
            routeId: routeId,
            timeLeft: route.duration,
          };
        }
        return s;
      })
    );

    setLogs(prev => [
      `⛵ Departure: ${ships.find(s => s.id === shipId)?.name} has set sail for ${route.name} carrying regional trade exports.`,
      ...prev,
    ]);
  };

  const buyKappal = () => {
    if (resources.aruvam >= 300) {
      audio.playBell();
      onTradeLoss(300); // Spend wealth
      const newId = `ship${ships.length + 1}`;
      setShips(prev => [
        ...prev,
        {
          id: newId,
          name: `Chola Kappal Samudra L${ships.length + 1}`,
          status: 'idle',
          routeId: null,
          timeLeft: 0,
        },
      ]);
      setLogs(prev => [
        `⚓ Shipwright: Commissioned a new heavy imperial trading Kappal! Fleet size increased.`,
        ...prev,
      ]);
    } else {
      audio.playDrum(true);
    }
  };

  return (
    <div id="maritime-trade-game" className="bg-[#241D18] p-6 rounded-xl border-2 border-[#D2691E]/30 shadow-2xl">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <span className="text-xs font-mono text-[#D2691E] uppercase tracking-widest">Imperial Navy & Trade</span>
          <h2 className="text-xl font-serif font-bold text-[#F4EFE6] flex items-center gap-2">
            Kadal Pira Fleet <span className="text-[#D2691E] text-xs font-mono">(கடல் வணிகம்)</span>
          </h2>
          <p className="text-stone-400 text-xs">
            Leverage ship navigation to unlock international trade nodes with Srivijaya and the Song Empire.
          </p>
        </div>
        <button
          id="btn-commission-kappal"
          onClick={buyKappal}
          className="mt-3 md:mt-0 px-4 py-2 rounded bg-[#D2691E]/10 hover:bg-[#D2691E]/20 border border-[#D2691E]/30 text-[#D2691E] text-xs font-bold font-sans flex items-center gap-2 transition cursor-pointer"
        >
          <Anchor className="w-4 h-4 animate-pulse" /> Commission Kappal (300 Gold)
        </button>
      </div>

      {/* 2D INTERACTIVE MARITIME TRADE MAP (800 x 220 SVG) */}
      <div className="relative aspect-[800/220] w-full bg-stone-950 rounded-xl border-2 border-[#D2691E]/40 overflow-hidden mb-6 shadow-inner select-none">
        <svg viewBox="0 0 800 220" className="w-full h-full">
          <defs>
            <linearGradient id="oceanMapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B1A28" />
              <stop offset="50%" stopColor="#0E2436" />
              <stop offset="100%" stopColor="#07121C" />
            </linearGradient>
            <radialGradient id="portGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Deep Ocean Water Canvas */}
          <rect width="800" height="220" fill="url(#oceanMapGrad)" />

          {/* Grid Latitude / Longitude lines */}
          <g stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4">
            <line x1="0" y1="55" x2="800" y2="55" />
            <line x1="0" y1="110" x2="800" y2="110" />
            <line x1="0" y1="165" x2="800" y2="165" />
            <line x1="200" y1="0" x2="200" y2="220" />
            <line x1="400" y1="0" x2="400" y2="220" />
            <line x1="600" y1="0" x2="600" y2="220" />
          </g>

          {/* Landmass Outlines (South Asia, Sri Lanka, Malacca, China) */}
          {/* India Peninsula */}
          <path d="M 60,0 L 140,80 L 120,130 L 100,100 L 70,40 L 0,30 Z" fill="#2d221a" stroke="#d2691e" strokeWidth="1" opacity="0.8" />
          {/* Sri Lanka */}
          <path d="M 145,150 C 160,150 165,175 150,185 C 135,185 130,165 145,150 Z" fill="#2d221a" stroke="#d2691e" strokeWidth="1" opacity="0.8" />
          {/* Malay Peninsula & Sumatra */}
          <path d="M 450,100 L 490,140 L 520,210 L 470,220 L 420,150 Z" fill="#2d221a" stroke="#d2691e" strokeWidth="1" opacity="0.8" />
          {/* China Coast */}
          <path d="M 640,0 L 780,40 L 800,110 L 720,80 L 620,20 Z" fill="#2d221a" stroke="#d2691e" strokeWidth="1" opacity="0.8" />

          {/* Dotted Sea Trade Routes */}
          {/* 1. Nagapattinam -> Sri Lanka */}
          <path d="M 120,110 Q 130,130 145,160" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          {/* 2. Nagapattinam -> Srivijaya */}
          <path d="M 120,110 Q 280,110 470,160" fill="none" stroke="#4A90E2" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />
          {/* 3. Nagapattinam -> Song Empire */}
          <path d="M 120,110 Q 400,30 700,50" fill="none" stroke="#FF6B6B" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.6" />

          {/* Port Nodes */}
          {/* Nagapattinam Home Port */}
          <g>
            <circle cx="120" cy="110" r="12" fill="url(#portGlow)" />
            <circle cx="120" cy="110" r="5" fill="#D4AF37" stroke="#000" strokeWidth="1.5" className="animate-pulse" />
            <text x="120" y="94" textAnchor="middle" fill="#D4AF37" fontSize="10" fontFamily="serif" fontWeight="bold">
              ⚓ Nagapattinam
            </text>
          </g>

          {/* Destination Nodes */}
          {/* Sri Lanka */}
          <g className="cursor-pointer">
            <circle cx="145" cy="160" r="4" fill="#FF6B6B" stroke="#000" strokeWidth="1" />
            <text x="145" y="176" textAnchor="middle" fill="#F4EFE6" fontSize="9" fontFamily="mono">
              Eela Mandalam
            </text>
          </g>

          {/* Srivijaya */}
          <g className="cursor-pointer">
            <circle cx="470" cy="160" r="4" fill="#4A90E2" stroke="#000" strokeWidth="1" />
            <text x="470" y="176" textAnchor="middle" fill="#F4EFE6" fontSize="9" fontFamily="mono">
              Srivijaya (Kadaram)
            </text>
          </g>

          {/* Song Empire */}
          <g className="cursor-pointer">
            <circle cx="700" cy="50" r="4" fill="#E53E3E" stroke="#000" strokeWidth="1" />
            <text x="700" y="38" textAnchor="middle" fill="#F4EFE6" fontSize="9" fontFamily="mono">
              Song Empire (Guangzhou)
            </text>
          </g>

          {/* Active 2D Animated Sailing Ships */}
          {ships.map(ship => {
            if (ship.status !== 'sailing' || !ship.routeId) return null;
            const route = routes.find(r => r.id === ship.routeId);
            if (!route) return null;

            // Compute current position along 2D coordinates
            const progress = (route.duration - ship.timeLeft) / route.duration;
            let startX = 120, startY = 110;
            let endX = 145, endY = 160;

            if (ship.routeId === 'srivijaya') {
              endX = 470; endY = 160;
            } else if (ship.routeId === 'china') {
              endX = 700; endY = 50;
            }

            const currentX = startX + (endX - startX) * progress;
            const currentY = startY + (endY - startY) * progress;

            return (
              <g key={`ship-sprite-${ship.id}`} transform={`translate(${currentX}, ${currentY})`}>
                <circle r="10" fill="#D4AF37" opacity="0.3" className="animate-ping" />
                {/* Ship Hull */}
                <path d="M -10,2 Q 0,8 10,2 L 8,-3 L -8,-3 Z" fill="#78350F" stroke="#FFD700" strokeWidth="1" />
                {/* Wooden Mast & Billowing Sail */}
                <line x1="0" y1="-3" x2="0" y2="-12" stroke="#F4EFE6" strokeWidth="1.5" />
                <path d="M 0,-11 Q 7,-7 0,-3 Z" fill="#F4EFE6" stroke="#D2691E" strokeWidth="0.5" />
                {/* Chola Tiger Crest Spot */}
                <circle cx="3" cy="-7" r="1" fill="#DC2626" />
                <text y="-15" textAnchor="middle" fill="#FFD700" fontSize="8" fontFamily="serif" fontWeight="bold">
                  ⛵ {ship.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Compass Overlay Badge */}
        <div className="absolute top-2.5 right-3 bg-black/70 border border-[#D2691E]/40 px-2 py-1 rounded-md text-[9px] font-mono text-[#D4AF37] flex items-center gap-1.5">
          <Compass className="w-3 h-3 text-[#D2691E] animate-spin" /> Bay of Bengal Sea Chart
        </div>
      </div>

      {/* Grid: Left - Trade Routes, Right - Ship Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trade Routes Selection */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-mono text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Compass className="w-4 h-4 text-[#4A90E2]" /> Active Charted Sea Lanes
          </h3>
          
          {routes.map(route => {
            const idleShip = ships.find(s => s.status === 'idle');
            
            return (
              <div
                key={route.id}
                id={`trade-route-row-${route.id}`}
                className="p-4 rounded-lg bg-[#1C1713] border border-[#D2691E]/20 hover:border-[#D2691E]/40 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-semibold text-[#F4EFE6]">{route.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">({route.destination})</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2 text-[11px] text-stone-400 font-mono">
                    <div>Cargo: <span className="text-[#D4AF37] font-semibold">{route.cargoType}</span></div>
                    <div>Voyage: <span className="text-[#4A90E2] font-semibold">{route.duration}s</span></div>
                    <div className="flex items-center gap-1">
                      Risk: 
                      <span className={`font-bold ${route.risk > 35 ? 'text-[#FF6B6B]' : 'text-emerald-400'}`}>
                        {route.risk}%
                      </span>
                    </div>
                  </div>

                  {/* Rewards preview */}
                  <div className="mt-2.5 flex gap-3 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                    <span>Yields:</span>
                    <span className="text-[#D4AF37]">💰 +{route.aruvamYield}</span>
                    <span className="text-[#FF6B6B]">❤️ +{route.anbuYield}</span>
                    <span className="text-[#4A90E2]">👁️ +{route.arivuYield}</span>
                  </div>
                </div>

                <div>
                  {idleShip ? (
                    <button
                      id={`btn-launch-${route.id}`}
                      onClick={() => launchShip(idleShip.id, route.id)}
                      className="px-4 py-2 rounded bg-[#D2691E] hover:bg-[#E37E32] text-black text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Dispatch {idleShip.name.split(' ')[2]}
                    </button>
                  ) : (
                    <span className="text-[10px] text-stone-500 font-mono italic">
                      All Kappal sailing...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Kappal Fleet & Active Voyages */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Anchor className="w-4 h-4 text-[#D2691E]" /> Chola Harbour Fleet
          </h3>

          <div className="space-y-2.5">
            {ships.map(ship => {
              const activeRoute = routes.find(r => r.id === ship.routeId);
              const progressPct = activeRoute 
                ? ((activeRoute.duration - ship.timeLeft) / activeRoute.duration) * 100 
                : 0;

              return (
                <div
                  key={ship.id}
                  id={`ship-card-${ship.id}`}
                  className={`p-3 rounded border text-xs ${
                    ship.status === 'sailing'
                      ? 'border-[#4A90E2]/30 bg-[#4A90E2]/5'
                      : 'border-[#D2691E]/10 bg-[#1C1713]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-stone-200">{ship.name}</span>
                    <span className={`text-[10px] font-bold font-mono uppercase ${
                      ship.status === 'sailing' ? 'text-[#4A90E2] animate-pulse' : 'text-stone-500'
                    }`}>
                      {ship.status}
                    </span>
                  </div>

                  {ship.status === 'sailing' && activeRoute ? (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span className="truncate max-w-[120px]">Route: {activeRoute.name}</span>
                        <span className="font-mono">{ship.timeLeft}s left</span>
                      </div>
                      <div className="w-full bg-[#2D241E] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-[#4A90E2] h-1.5 rounded-full transition-all duration-1000" 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-stone-500 italic mt-1">
                      Awaiting captain orders at Nagapattinam dock.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Port Event Logs Panel */}
      <div id="port-logs-panel" className="mt-6 border-t border-[#D2691E]/20 pt-4">
        <h4 className="text-[11px] font-mono text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-[#4A90E2]" /> Maritime Port Operations Ledger
        </h4>
        <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 max-h-28 overflow-y-auto pr-2 custom-scrollbar space-y-1.5 text-[11px] font-mono leading-relaxed">
          {logs.map((log, index) => (
            <div key={index} className="text-stone-300">
              {log}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
