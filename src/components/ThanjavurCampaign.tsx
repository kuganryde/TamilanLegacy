/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CampaignState, GuildDemand, Resources, GridCell } from '../types';
import { Award, AlertTriangle, ShieldCheck, Flame, Heart, Users, Compass, HelpCircle, ArrowRight, Zap } from 'lucide-react';
import { audio } from '../utils/audio';

interface ThanjavurCampaignProps {
  campaignState: CampaignState;
  resources: Resources;
  gridCells: GridCell[];
  onSetCampaignState: React.Dispatch<React.SetStateAction<CampaignState>>;
  onSpendResources: (cost: Partial<Resources>) => boolean;
  onEarnResources: (earned: Partial<Resources>) => void;
  rampTechUnlocked: boolean; // Pre-requisite for Phase 2
  poetGuildUnlocked: boolean; // Modifier for Phase 4
}

export default function ThanjavurCampaign({
  campaignState,
  resources,
  gridCells,
  onSetCampaignState,
  onSpendResources,
  onEarnResources,
  rampTechUnlocked,
  poetGuildUnlocked,
}: ThanjavurCampaignProps) {

  const [ropeBreaksCount, setRopeBreaksCount] = useState<number>(0);
  const [activeMessage, setActiveMessage] = useState<string>("Raja Raja Chola: 'Let us build a temple that echoes the glory of our ancestors.'");

  // Local state to manage Phase 2 timer & slider
  const [tensionState, setTensionState] = useState<'stable' | 'high' | 'low'>('stable');

  // Local state for Phase 4 countdown timer
  const [harmonyTimer, setHarmonyTimer] = useState<number>(30); // 30 seconds consecration festival countdown
  const [consecrationCompleted, setConsecrationCompleted] = useState<boolean>(false);

  // Ref to always have current campaignState in timers to avoid stale closure and React render phase state updates
  const campaignStateRef = React.useRef(campaignState);
  useEffect(() => {
    campaignStateRef.current = campaignState;
  }, [campaignState]);

  // Auto-calculate dynamic values from grid for Phase 1
  useEffect(() => {
    if (campaignState.currentPhase === 'foundation') {
      const quarries = gridCells.filter(c => c.type === 'quarry');
      const assignedWorkersToQuarries = quarries.reduce((acc, c) => acc + c.assignedWorkers, 0);
      
      const irrigatedPaddies = gridCells.filter(c => c.type === 'ur' && c.hasWater).length;

      onSetCampaignState(prev => {
        // Gain 5 granite per tick per worker assigned to quarries
        const nextGranite = Math.min(prev.graniteTarget, prev.graniteCollected + (assignedWorkersToQuarries * 2));
        
        return {
          ...prev,
          graniteCollected: nextGranite,
          paddiesWithWater: irrigatedPaddies,
        };
      });
    }
  }, [gridCells, campaignState.currentPhase]);

  // Phase 2 active physics simulation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (campaignState.currentPhase === 'capstone' && rampTechUnlocked && !campaignState.kumbamPlaced) {
      interval = setInterval(() => {
        const current = campaignStateRef.current;
        
        // Tension drifts downwards naturally
        let nextTension = Math.max(0, current.elephantTension - (4 + Math.random() * 4));
        let progress = current.elephantRampProgress;
        let isSnapped = false;

        // If tension is in the Sweet Spot (40 to 80), progress increases!
        if (nextTension >= 40 && nextTension <= 80) {
          progress = Math.min(100, progress + 2.5);
          setTensionState('stable');
        } else if (nextTension > 80) {
          setTensionState('high');
          // Heavy danger of rope snapping if tension stays high too long
          if (Math.random() > 0.6) {
            audio.playDrum(true);
            setRopeBreaksCount(c => c + 1);
            progress = Math.max(0, progress - 15); // slip back
            nextTension = 30; // reset tension
            isSnapped = true;
          }
        } else {
          setTensionState('low');
          // Capstone slips backwards slowly if tension is too low
          progress = Math.max(0, progress - 1.2);
        }

        if (isSnapped) {
          setActiveMessage("⚠️ SNAP! The guide ropes snapped under extreme tension! The capstone slipped backwards.");
        }

        const placed = progress >= 100;
        if (placed) {
          audio.playBell();
          setActiveMessage("🎉 INCREDIBLE! The 80-ton golden capstone (Kumbam) has been placed at the absolute apex!");
        }

        onSetCampaignState(prev => ({
          ...prev,
          elephantTension: nextTension,
          elephantRampProgress: progress,
          kumbamPlaced: placed,
        }));
      }, 800);
    }
    return () => clearInterval(interval);
  }, [campaignState.currentPhase, rampTechUnlocked, campaignState.kumbamPlaced]);

  // Phase 3 Spy / Bandit spawn simulation
  useEffect(() => {
    let spyInterval: NodeJS.Timeout;
    if (campaignState.currentPhase === 'shadows') {
      spyInterval = setInterval(() => {
        const current = campaignStateRef.current;
        // Roll for spy or bandit spawn
        if (current.activeRaids < 3) {
          const isBandit = Math.random() > 0.5;
          audio.playSabotageAlert();
          if (isBandit) {
            setActiveMessage("⚔️ BANDITS ALERT: Chalukya brigands are raiding the southern paddy fields (Ur zones)!");
          } else {
            setActiveMessage("🕵️ SABOTEUR SPOTTED: A suspicious foreign spy is infiltrating the city market (Nagar zones)!");
          }
          onSetCampaignState(prev => ({
            ...prev,
            activeRaids: prev.activeRaids + 1,
          }));
        }
      }, 7000); // spawn raid every 7 seconds
    }
    return () => clearInterval(spyInterval);
  }, [campaignState.currentPhase]);

  // Phase 4 Festival countdown timer
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (campaignState.currentPhase === 'consecration' && !consecrationCompleted) {
      timerInterval = setInterval(() => {
        setHarmonyTimer(prev => {
          if (prev > 0) {
            return prev - 1;
          }
          return 0;
        });

        // Decay harmony slowly over time unless satisfied
        onSetCampaignState(prev => {
          const unsatisfiedCount = prev.guildDemands.filter(d => !d.satisfied).length;
          // Poet guild decreases harmony decay
          const decayRate = poetGuildUnlocked ? 0.8 : 1.5;
          const nextHarmony = Math.max(0, prev.culturalHarmony - (unsatisfiedCount * decayRate));
          return {
            ...prev,
            culturalHarmony: nextHarmony,
          };
        });

      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [campaignState.currentPhase, consecrationCompleted, poetGuildUnlocked]);

  // Listen for harmonyTimer reaching 0 to complete consecration
  useEffect(() => {
    if (campaignState.currentPhase === 'consecration' && harmonyTimer === 0 && !consecrationCompleted) {
      setConsecrationCompleted(true);
      audio.playBell();
      // Award major points
      onEarnResources({ aruvam: 1000, anbu: 500 });
    }
  }, [harmonyTimer, consecrationCompleted, campaignState.currentPhase]);

  const advancePhase = (next: 'capstone' | 'shadows' | 'consecration') => {
    audio.playBell();
    onSetCampaignState(prev => ({
      ...prev,
      currentPhase: next,
      completedPhases: [...prev.completedPhases, prev.currentPhase],
    }));

    if (next === 'capstone') {
      setActiveMessage("Phase 2: The Capstone. Establish the Ramp and pull the 80-ton Kumbam stone to the temple top!");
    } else if (next === 'shadows') {
      setActiveMessage("Phase 3: Shadows in the City. Defend the outer farms and arrest the Chalukya spies!");
    } else if (next === 'consecration') {
      setActiveMessage("Phase 4: Consecration Ceremony. Meet guild requests to elevate Thanjavur's Cultural Harmony!");
    }
  };

  // Elephant mini-game controls
  const handleElephantPull = () => {
    audio.playDrum(false); // Deep mridangam pull sound
    onSetCampaignState(prev => {
      // Increase tension on click
      const nextTension = Math.min(100, prev.elephantTension + 14);
      return {
        ...prev,
        elephantTension: nextTension,
      };
    });
  };

  // Shadow catch controls
  const deploySoldiers = (type: 'arrest' | 'defend') => {
    if (resources.aalavan >= 15) {
      onSpendResources({ aalavan: 15 });
      audio.playDrum(true); // Deep martial beats

      onSetCampaignState(prev => {
        if (prev.activeRaids > 0) {
          const nextRaids = prev.activeRaids - 1;
          if (type === 'arrest') {
            const nextArrests = Math.min(prev.spiesTarget, prev.spiesArrested + 1);
            setActiveMessage(`🛡️ Victory: Chola elite soldiers intercepted the saboteur before they could damage the granary! (+1 Spy Caught)`);
            return {
              ...prev,
              activeRaids: nextRaids,
              spiesArrested: nextArrests,
            };
          } else {
            setActiveMessage(`🌾 Victory: Troops deployed to the paddies. The bandit raiding party has been routed back to the hills!`);
            return {
              ...prev,
              activeRaids: nextRaids,
            };
          }
        }
        return prev;
      });
    } else {
      audio.playDrum(true);
      setActiveMessage("❌ Failed: You do not possess enough Aalavan (Power/Soldiers) to secure patrols!");
    }
  };

  // Satisfy Guild demand
  const handleSatisfyDemand = (demandId: string) => {
    const demand = campaignState.guildDemands.find(d => d.id === demandId);
    if (!demand || demand.satisfied) return;

    const satisfied = onSpendResources(demand.resourceCost);
    if (satisfied) {
      audio.playBell();
      onSetCampaignState(prev => {
        const nextDemands = prev.guildDemands.map(d => 
          d.id === demandId ? { ...d, satisfied: true } : d
        );
        // Boost harmony
        const nextHarmony = Math.min(100, prev.culturalHarmony + 25);
        setActiveMessage(`🤝 Guild Agreement: Satisfied ${demand.guildName} request. "${demand.rewardText}"`);
        return {
          ...prev,
          guildDemands: nextDemands,
          culturalHarmony: nextHarmony,
        };
      });
    } else {
      audio.playDrum(true);
      setActiveMessage("❌ Failed: Insufficient imperial treasury, culture, or military force to meet this guild requirement.");
    }
  };

  return (
    <div id="campaign-mission-container" className="bg-[#241D18] rounded-xl p-6 border-2 border-[#D2691E]/30 shadow-2xl space-y-6">
      
      {/* Campaign Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D2691E]/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-[#D2691E]/10 text-[#D2691E] px-2 py-0.5 rounded border border-[#D2691E]/20 font-mono font-bold uppercase">
              Raja Raja Chola Campaign
            </span>
            <span className="text-stone-500 text-xs">•</span>
            <span className="text-stone-400 text-xs">Mission #4</span>
          </div>
          <h2 className="text-2xl font-serif text-[#F4EFE6] font-bold">
            The Consecration of Thanjavur
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Complete the majestic Brihadeeswarar Temple and establish Chola legacy forever.
          </p>
        </div>

        {/* Phase Map Track */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          {['foundation', 'capstone', 'shadows', 'consecration'].map((p, idx) => {
            const isCompleted = campaignState.completedPhases.includes(p as any);
            const isCurrent = campaignState.currentPhase === p;
            return (
              <React.Fragment key={p}>
                {idx > 0 && <span className="text-stone-600">→</span>}
                <span className={`px-2.5 py-1 rounded text-[10px] uppercase ${
                  isCompleted 
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' 
                    : isCurrent 
                    ? 'bg-[#D2691E] text-black font-extrabold ring-2 ring-[#D2691E]/30' 
                    : 'bg-[#1C1713] text-stone-500 border border-[#D2691E]/10'
                }`}>
                  Phase {idx + 1}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Dynamic Voice Ledger Panel */}
      <div id="emperor-speech-bubble" className="bg-[#1C1713] border-l-4 border-[#D2691E] p-4 rounded-r-lg flex items-start gap-3">
        <div className="text-2xl animate-bounce mt-1">👑</div>
        <div>
          <div className="text-[9px] font-mono uppercase text-[#D2691E] tracking-wider font-bold">Imperial Edict Ledger</div>
          <p className="text-amber-200/90 text-xs font-serif leading-relaxed italic">
            "{activeMessage}"
          </p>
        </div>
      </div>

      {/* RENDER CURRENT PHASE INTERFACES */}

      {/* PHASE 1: THE FOUNDATION */}
      {campaignState.currentPhase === 'foundation' && (
        <div id="campaign-phase-1" className="bg-[#2D241E]/40 p-5 rounded-lg border border-[#D2691E]/20 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-serif font-semibold text-[#F4EFE6]">Phase 1: Foundations of the Temple</h3>
              <p className="text-stone-400 text-xs mt-1">
                Deploy workers to the **Granite Quarry** to harvest stone blocks and use **Eri reservoirs** to irrigate agricultural fields (Ur zones).
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#D2691E] font-mono font-bold bg-[#1C1713] border border-[#D2691E]/30 px-2.5 py-1 rounded">
                Active Goals
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Goal 1: Granite block accumulation */}
            <div className="bg-[#1C1713] p-4 rounded border border-[#D2691E]/20">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-stone-300 font-medium">Granite Blocks Quarrying:</span>
                <span className="text-xs font-mono font-bold text-[#D2691E]">
                  {campaignState.graniteCollected} / {campaignState.graniteTarget}
                </span>
              </div>
              <div className="w-full bg-[#2D241E] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#D2691E] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(campaignState.graniteCollected / campaignState.graniteTarget) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-2 font-mono">
                Tip: Click Granite Quarry cells on Nagara Grid and assign workers.
              </p>
            </div>

            {/* Goal 2: Irrigated Paddies */}
            <div className="bg-[#1C1713] p-4 rounded border border-[#D2691E]/20">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-stone-300 font-medium">Irrigated Ur Zones (Paddies):</span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {campaignState.paddiesWithWater} / {campaignState.paddiesTarget}
                </span>
              </div>
              <div className="w-full bg-[#2D241E] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(campaignState.paddiesWithWater / campaignState.paddiesTarget) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-2 font-mono">
                Tip: Build an Eri Tank adjacent to existing agricultural zones.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="btn-advance-to-capstone"
              disabled={campaignState.graniteCollected < campaignState.graniteTarget || campaignState.paddiesWithWater < campaignState.paddiesTarget}
              onClick={() => advancePhase('capstone')}
              className={`px-5 py-2.5 rounded font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition ${
                campaignState.graniteCollected >= campaignState.graniteTarget && campaignState.paddiesWithWater >= campaignState.paddiesTarget
                  ? 'bg-[#D2691E] hover:bg-[#E37E32] text-black cursor-pointer shadow-lg active:scale-95'
                  : 'bg-[#1C1713] text-stone-500 cursor-not-allowed border border-[#D2691E]/10'
              }`}
            >
              Advance to Phase 2 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: THE CAPSTONE */}
      {campaignState.currentPhase === 'capstone' && (
        <div id="campaign-phase-2" className="bg-[#2D241E]/40 p-5 rounded-lg border border-[#D2691E]/20 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-serif font-semibold text-[#F4EFE6]">Phase 2: Placing the 80-Ton Capstone (Kumbam)</h3>
              <p className="text-stone-400 text-xs mt-1">
                Use your accumulated **Arivu (Knowledge)** to research the **Ramp & Elephant** technology, then coordinate the elephant draft lines.
              </p>
            </div>
          </div>

          {!rampTechUnlocked ? (
            <div className="bg-[#1C1713] p-6 rounded-lg border border-[#D2691E]/20 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-[#D2691E] mx-auto animate-pulse" />
              <h4 className="text-sm font-serif font-bold text-amber-200">Technology Blocked</h4>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                You must research **Ramp & Elephant Technology (வண்டல் பாதை)** in the **Vastu & Architecture branch** of the Palm Leaf tech tree before beginning the haul.
              </p>
            </div>
          ) : campaignState.kumbamPlaced ? (
            <div className="bg-emerald-950/40 p-6 rounded-lg border border-emerald-800/40 text-center space-y-4">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-lg font-serif font-bold text-emerald-200">Success! Capstone Secured</h4>
              <p className="text-xs text-stone-300 max-w-md mx-auto">
                The massive granite monolith has been secured on top of the 216-foot Vimana tower without any casualties. The architecture is complete!
              </p>
              <button
                id="btn-advance-to-shadows"
                onClick={() => advancePhase('shadows')}
                className="px-5 py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs uppercase tracking-wider mx-auto transition active:scale-95 flex items-center gap-1"
              >
                Advance to Phase 3 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-[#1C1713] p-5 rounded border border-[#D2691E]/20 space-y-5">
              
              {/* Haul Progress */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono font-bold mb-1.5 text-stone-300">
                  <span>CAPSTONE HAUL HEIGHT:</span>
                  <span className="text-cyan-400">{Math.round(campaignState.elephantRampProgress)}% (6km Earthen Ramp)</span>
                </div>
                <div className="w-full bg-[#2D241E] h-3.5 rounded-full overflow-hidden border border-[#D2691E]/10">
                  <div 
                    className="bg-cyan-400 h-3.5 rounded-full transition-all duration-300"
                    style={{ width: `${campaignState.elephantRampProgress}%` }}
                  />
                </div>
              </div>

              {/* Sweet Spot Tension Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono text-stone-400">
                  <span>ELEPHANT PULL TENSION:</span>
                  <span className={`font-bold ${
                    tensionState === 'stable' ? 'text-emerald-400' : tensionState === 'high' ? 'text-red-500 animate-pulse' : 'text-yellow-500'
                  }`}>
                    {Math.round(campaignState.elephantTension)} / 100 {tensionState === 'stable' ? '(Sweet Spot: 40-80)' : tensionState === 'high' ? '(TOO DANGEROUS!)' : '(SLIPPING DOWN!)'}
                  </span>
                </div>

                {/* Meter Slider mockup */}
                <div className="relative w-full bg-[#2D241E] h-6 rounded border border-[#D2691E]/20 overflow-hidden flex items-center">
                  {/* Danger Zone Low */}
                  <div className="absolute left-0 w-[40%] h-full bg-yellow-500/10 border-r border-dashed border-yellow-500/30 flex items-center justify-center">
                    <span className="text-[9px] text-yellow-500/60 font-mono">SLIP RISK</span>
                  </div>
                  {/* Sweet Spot */}
                  <div className="absolute left-[40%] w-[40%] h-full bg-emerald-500/20 border-r border-dashed border-emerald-500/30 flex items-center justify-center">
                    <span className="text-[9px] text-emerald-400/80 font-mono font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#D2691E]" /> SWEET SPOT
                    </span>
                  </div>
                  {/* Danger Zone High */}
                  <div className="absolute right-0 w-[20%] h-full bg-red-500/15 flex items-center justify-center">
                    <span className="text-[9px] text-red-500/60 font-mono">SNAP RISK</span>
                  </div>

                  {/* Slider pin representing active tension */}
                  <div 
                    className="absolute w-2 h-full bg-[#D2691E] shadow-md transition-all duration-150"
                    style={{ left: `${campaignState.elephantTension}%` }}
                  />
                </div>
              </div>

              {/* Haul Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2">
                <div className="text-stone-400 text-[11px] leading-relaxed max-w-md font-mono">
                  💡 <strong>Guide:</strong> Tap <strong>PULL ELEPHANTS</strong> periodically. Keep tension inside the <strong>Sweet Spot (40-80%)</strong>. If tension hits &gt;80, ropes can snap! If tension drops below 40, gravity slips the stone back.
                </div>
                <button
                  id="btn-pull-elephants"
                  onClick={handleElephantPull}
                  className="w-full md:w-auto px-6 py-3 rounded-lg bg-[#D2691E] hover:bg-[#E37E32] text-black font-extrabold text-sm uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
                >
                  🐘 Pull Elephants
                </button>
              </div>

              <div className="text-center text-[10px] text-stone-500 font-mono">
                Rope break instances in this campaign: <span className="text-red-400 font-bold">{ropeBreaksCount}</span>
              </div>

            </div>
          )}
        </div>
      )}

      {/* PHASE 3: SHADOWS IN THE CITY */}
      {campaignState.currentPhase === 'shadows' && (
        <div id="campaign-phase-3" className="bg-[#2D241E]/40 p-5 rounded-lg border border-[#D2691E]/20 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-serif font-semibold text-[#F4EFE6]">Phase 3: Shadows in the City</h3>
              <p className="text-stone-400 text-xs mt-1">
                Chalukya saboteurs are attempting to disrupt the upcoming consecration! Deploy **Aalavan (Military Force)** to secure the zones.
              </p>
            </div>
            <div className="bg-[#1C1713] px-3 py-1.5 rounded text-xs border border-[#D2691E]/30 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF6B6B] animate-pulse" />
              <span>Available Aalavan: <strong className="text-red-500 font-mono">{resources.aalavan}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Spy Tracking Progression */}
            <div className="bg-[#1C1713] p-4 rounded border border-[#D2691E]/20 flex flex-col justify-between">
              <div>
                <h4 className="text-xs text-stone-300 font-mono font-bold uppercase mb-2">Counter-Intelligence Progress</h4>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-stone-400">Saboteurs Captured:</span>
                  <span className="text-[#D2691E] font-mono font-bold">{campaignState.spiesArrested} / {campaignState.spiesTarget}</span>
                </div>
                <div className="w-full bg-[#2D241E] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#D2691E] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(campaignState.spiesArrested / campaignState.spiesTarget) * 100}%` }}
                  />
                </div>
              </div>

              {campaignState.spiesArrested >= campaignState.spiesTarget ? (
                <div className="text-emerald-400 text-xs font-mono mt-4 font-bold">
                  🛡️ Security secured! City walls are clear of foreign infiltrators.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <button
                    id="btn-arrest-spy"
                    disabled={campaignState.activeRaids === 0}
                    onClick={() => deploySoldiers('arrest')}
                    className={`w-full py-2 rounded text-xs font-bold uppercase transition ${
                      campaignState.activeRaids > 0
                        ? 'bg-[#D2691E] hover:bg-[#E37E32] text-black cursor-pointer'
                        : 'bg-[#1C1713] text-stone-500 cursor-not-allowed border border-[#D2691E]/10'
                    }`}
                  >
                    Arrest Saboteur (Cost: 15 Aalavan Force)
                  </button>
                  <p className="text-[9px] text-stone-500 text-center font-mono">
                    Can only arrest when active spies/threats are active. Current threats: {campaignState.activeRaids}
                  </p>
                </div>
              )}
            </div>

            {/* Farm Patrols */}
            <div className="bg-[#1C1713] p-4 rounded border border-[#D2691E]/20 flex flex-col justify-between">
              <div>
                <h4 className="text-xs text-stone-300 font-mono font-bold uppercase mb-2">Paddy Fields Border Security</h4>
                <div className="text-xs space-y-1 text-stone-400">
                  <div className="flex justify-between">
                    <span>Active Bandit Threats:</span>
                    <span className={campaignState.activeRaids > 0 ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400'}>
                      {campaignState.activeRaids} reports
                    </span>
                  </div>
                  <div className="text-[10px] leading-relaxed text-stone-500">
                    If active raids persist, agricultural Ur zones yield 50% less Aruvam wealth.
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  id="btn-patrol-fields"
                  disabled={campaignState.activeRaids === 0}
                  onClick={() => deploySoldiers('defend')}
                  className={`w-full py-2 rounded text-xs font-bold uppercase transition ${
                    campaignState.activeRaids > 0
                      ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/40 cursor-pointer'
                      : 'bg-[#1C1713] text-stone-500 cursor-not-allowed border border-[#D2691E]/10'
                  }`}
                >
                  Repel Paddies Raiders (Cost: 15 Aalavan Force)
                </button>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              id="btn-advance-to-consecration"
              disabled={campaignState.spiesArrested < campaignState.spiesTarget}
              onClick={() => advancePhase('consecration')}
              className={`px-5 py-2.5 rounded font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition ${
                campaignState.spiesArrested >= campaignState.spiesTarget
                  ? 'bg-[#D2691E] hover:bg-[#E37E32] text-black cursor-pointer shadow-lg active:scale-95'
                  : 'bg-[#1C1713] text-stone-500 cursor-not-allowed border border-[#D2691E]/10'
              }`}
            >
              Advance to Phase 4 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 4: THE CONSECRATION */}
      {campaignState.currentPhase === 'consecration' && (
        <div id="campaign-phase-4" className="bg-[#2D241E]/40 p-5 rounded-lg border border-[#D2691E]/20 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-serif font-semibold text-[#F4EFE6]">Phase 4: The Kumbhabhishekam Climax</h3>
              <p className="text-stone-400 text-xs mt-1">
                The grand consecration has commenced! Manage the complex social hierarchies by satisfying guild expectations. Keep **Cultural Harmony** high until the final bells toll!
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-stone-400 block mb-1">Ritual Countdown</span>
              <span className="text-lg font-mono font-bold text-[#D2691E] bg-[#1C1713] px-3 py-1 rounded border border-[#D2691E]/30 shadow-md">
                {harmonyTimer}s
              </span>
            </div>
          </div>

          {consecrationCompleted ? (
            <div className="bg-gradient-to-br from-[#2D241E] via-[#1C1713] to-[#120F0D] p-6 rounded-lg border-2 border-[#D2691E] text-center space-y-4 shadow-2xl">
              <Award className="w-16 h-16 text-[#D4AF37] mx-auto animate-bounce" />
              <h4 className="text-2xl font-serif font-bold text-[#D4AF37] uppercase tracking-wide">
                🏆 PERFECT HISTORICAL VICTORY!
              </h4>
              <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                Raja Raja Cholan's dream is realized. The Brihadeeswarar Temple consecration festival concludes with supreme bliss. The Tamil heritage and the Chola Dynasty's glory is secured for the next millennium!
              </p>
              <div className="text-[11px] font-mono text-emerald-400 font-bold">
                Your Cultural Harmony stood strong. The empire rewarded you with +1000 Wealth and +500 Devotion.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Cultural Harmony Meter */}
              <div className="bg-[#1C1713] p-4 rounded border border-[#D2691E]/20 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs text-stone-300 font-mono font-bold uppercase mb-2">Cultural Harmony Meter</h4>
                  <div className="text-3xl font-mono font-bold text-center text-[#FF6B6B] py-3 animate-pulse">
                    {Math.round(campaignState.culturalHarmony)}%
                  </div>
                  <div className="w-full bg-[#2D241E] h-2.5 rounded-full overflow-hidden border border-[#D2691E]/10">
                    <div 
                      className="bg-[#FF6B6B] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${campaignState.culturalHarmony}%` }}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-stone-400 mt-4 leading-normal font-mono">
                  {poetGuildUnlocked 
                    ? "✨ Poet Guild Active: Harmony decay speed reduced by 40%." 
                    : "💡 Tip: Satisfy active guild demands to instantly raise harmony by 25%."}
                </p>
              </div>

              {/* Guild Demands list */}
              <div className="lg:col-span-2 bg-[#1C1713] p-4 rounded border border-[#D2691E]/20 space-y-3">
                <h4 className="text-xs text-stone-300 font-mono font-bold uppercase mb-1">Guild Demands</h4>
                
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                  {campaignState.guildDemands.map(demand => {
                    // Check if player has resources
                    const hasGold = !demand.resourceCost.aruvam || resources.aruvam >= demand.resourceCost.aruvam;
                    const hasAnbu = !demand.resourceCost.anbu || resources.anbu >= demand.resourceCost.anbu;
                    const hasAalavan = !demand.resourceCost.aalavan || resources.aalavan >= demand.resourceCost.aalavan;
                    const canAfford = hasGold && hasAnbu && hasAalavan;

                    return (
                      <div
                        key={demand.id}
                        id={`demand-card-${demand.id}`}
                        className={`p-3 rounded border text-xs flex justify-between items-center gap-4 ${
                          demand.satisfied 
                            ? 'bg-emerald-950/20 border-emerald-800/40 opacity-70' 
                            : 'bg-[#2D241E] border border-[#D2691E]/10 hover:border-[#D2691E]/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-serif font-semibold text-[#F4EFE6] capitalize">{demand.guildName} Guild</span>
                            {demand.satisfied && (
                              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                                Satisfied
                              </span>
                            )}
                          </div>
                          <p className="text-stone-300 text-[11px] leading-tight mb-2">"{demand.demandText}"</p>
                          
                          {/* Cost labels */}
                          {!demand.satisfied && (
                            <div className="flex gap-2.5 text-[10px] font-mono">
                              <span className="text-stone-500 uppercase font-bold">Cost:</span>
                              {demand.resourceCost.aruvam && (
                                <span className={resources.aruvam >= demand.resourceCost.aruvam ? 'text-[#D4AF37] font-bold' : 'text-stone-600'}>
                                  💰 {demand.resourceCost.aruvam} gold
                                </span>
                              )}
                              {demand.resourceCost.anbu && (
                                <span className={resources.anbu >= demand.resourceCost.anbu ? 'text-[#FF6B6B] font-bold' : 'text-stone-600'}>
                                  ❤️ {demand.resourceCost.anbu} culture
                                </span>
                              )}
                              {demand.resourceCost.aalavan && (
                                <span className={resources.aalavan >= demand.resourceCost.aalavan ? 'text-red-500 font-bold' : 'text-stone-600'}>
                                  ⚔️ {demand.resourceCost.aalavan} power
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {!demand.satisfied && (
                          <button
                            id={`btn-meet-${demand.id}`}
                            disabled={!canAfford}
                            onClick={() => handleSatisfyDemand(demand.id)}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition active:scale-95 cursor-pointer ${
                              canAfford 
                                ? 'bg-[#D2691E] hover:bg-[#E37E32] text-black' 
                                : 'bg-[#1C1713] text-stone-600 cursor-not-allowed border border-[#D2691E]/10'
                            }`}
                          >
                            Satisfy
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
