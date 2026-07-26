/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Resources {
  aruvam: number;     // Wealth / Gold
  arivu: number;      // Knowledge / Research
  anbu: number;       // Devotion / Culture
  aalavan: number;    // Power / Military Influence
}

export type ZoneType = 'empty' | 'ur' | 'nagar' | 'kovil' | 'eri' | 'river' | 'quarry';

export interface GridCell {
  id: string;
  row: number;
  col: number;
  type: ZoneType;
  level: number;       // For building upgrades
  hasWater: boolean;   // Eri irrigation link
  assignedWorkers: number;
}

export interface TradeRoute {
  id: string;
  name: string;
  destination: string;
  cargoType: string;
  duration: number; // in seconds
  risk: number;      // 0 to 100 percentage
  aruvamYield: number;
  anbuYield: number;
  arivuYield: number;
}

export interface TradingShip {
  id: string;
  name: string;
  status: 'idle' | 'sailing' | 'returning';
  routeId: string | null;
  timeLeft: number; // in seconds
}

export interface TechNode {
  id: string;
  name: string;
  tamilName: string;
  description: string;
  branch: 'siddha' | 'vastu' | 'kadal' | 'arts';
  cost: number; // Cost in Arivu
  unlocked: boolean;
  unlockedBy?: string; // Prerequisite tech id
  effectDescription: string;
}

export type CampaignPhaseId = 'foundation' | 'capstone' | 'shadows' | 'consecration';

export interface GuildDemand {
  id: string;
  guildName: string; // 'merchants' | 'soldiers' | 'priests' | 'artists'
  demandText: string;
  resourceCost: Partial<Resources>;
  rewardText: string;
  satisfied: boolean;
}

export interface CampaignState {
  currentPhase: CampaignPhaseId;
  completedPhases: CampaignPhaseId[];
  
  // Phase 1: Foundation
  graniteCollected: number;
  graniteTarget: number;
  paddiesWithWater: number;
  paddiesTarget: number;

  // Phase 2: Capstone
  elephantRampProgress: number; // 0 to 100
  elephantTension: number;      // 0 to 100 (keep between 30 and 80)
  kumbamPlaced: boolean;

  // Phase 3: Shadows
  spiesArrested: number;
  spiesTarget: number;
  defendersActive: number;
  activeRaids: number; // simple active counter

  // Phase 4: Consecration
  culturalHarmony: number; // 0 to 100
  guildDemands: GuildDemand[];
}

export type MonsoonWeatherType = 
  | 'clear' 
  | 'southwest_rain' 
  | 'northeast_cyclone' 
  | 'golden_rain' 
  | 'summer_drought';

export interface MonsoonWeather {
  type: MonsoonWeatherType;
  name: string;
  tamilName: string;
  description: string;
  icon: string;
  cropYieldMultiplier: number;     // e.g. 1.5 (+50%), 0.7 (-30%)
  maritimeRiskModifier: number;    // e.g. +20 (+20% risk), -10 (-10% risk)
  maritimeDurationMultiplier: number; // e.g. 1.2 (+20% time), 0.85 (-15% time)
  bgGradient: string;
  badgeColor: string;
}

