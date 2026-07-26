/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MonsoonWeather, MonsoonWeatherType } from '../types';

export const MONSOON_WEATHER_LIST: Record<MonsoonWeatherType, MonsoonWeather> = {
  clear: {
    type: 'clear',
    name: 'Clear Skies & Mild Breeze',
    tamilName: 'இனிய தென்றல்',
    description: 'Gentle winds across the Kaveri basin. Standard paddy irrigation and calm seas for trade routes.',
    icon: '☀️',
    cropYieldMultiplier: 1.0,
    maritimeRiskModifier: 0,
    maritimeDurationMultiplier: 1.0,
    bgGradient: 'from-[#241D18] to-[#1C1713]',
    badgeColor: 'text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10'
  },
  southwest_rain: {
    type: 'southwest_rain',
    name: 'South-West Monsoon Rains',
    tamilName: 'தென்மேற்கு பருவமழை',
    description: 'Heavy rainfall floods Kaveri canals! Crop yields surge (+50%), but rough waves increase trade route risk (+20%).',
    icon: '🌧️',
    cropYieldMultiplier: 1.5,
    maritimeRiskModifier: 20,
    maritimeDurationMultiplier: 1.15,
    bgGradient: 'from-[#1e3a5f] to-[#14263e]',
    badgeColor: 'text-sky-400 border-sky-400/40 bg-sky-950/40'
  },
  northeast_cyclone: {
    type: 'northeast_cyclone',
    name: 'North-East Cyclone & Squalls',
    tamilName: 'வடகிழக்கு சூறாவளி',
    description: 'Fierce gale storms strike the coast! Sea risk rises steeply (+35%), crops suffer floods (-25% yield) unless Eri reservoirs protect fields.',
    icon: '⛈️',
    cropYieldMultiplier: 0.75,
    maritimeRiskModifier: 35,
    maritimeDurationMultiplier: 1.30,
    bgGradient: 'from-[#3a1c22] to-[#1c1216]',
    badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-950/40'
  },
  golden_rain: {
    type: 'golden_rain',
    name: 'Golden Divine Monsoon',
    tamilName: 'பொன்மழை (தெய்வீகம்)',
    description: 'Sacred blessing showers the realm! Favorable tailwinds accelerate voyages (-15% time) and crops boom (+40% yield)!',
    icon: '🌈',
    cropYieldMultiplier: 1.4,
    maritimeRiskModifier: -15,
    maritimeDurationMultiplier: 0.85,
    bgGradient: 'from-[#3d3112] to-[#1c1713]',
    badgeColor: 'text-amber-300 border-amber-400/40 bg-amber-950/40'
  },
  summer_drought: {
    type: 'summer_drought',
    name: 'Scorching Summer Heatwave',
    tamilName: 'கோடை வெப்பம்',
    description: 'High heat evaporates shallow waters. Paddy fields yield -30% less unless fed by Eri water channels, but calm seas reduce sailing risk (-10%).',
    icon: '🌤️',
    cropYieldMultiplier: 0.7,
    maritimeRiskModifier: -10,
    maritimeDurationMultiplier: 1.0,
    bgGradient: 'from-[#422213] to-[#1c120c]',
    badgeColor: 'text-orange-400 border-orange-400/40 bg-orange-950/40'
  }
};

export function getRandomMonsoonWeather(currentType?: MonsoonWeatherType): MonsoonWeather {
  const keys = Object.keys(MONSOON_WEATHER_LIST) as MonsoonWeatherType[];
  // Avoid repeating exact same weather twice in a row if possible
  const available = currentType ? keys.filter(k => k !== currentType) : keys;
  const chosenKey = available[Math.floor(Math.random() * available.length)];
  return MONSOON_WEATHER_LIST[chosenKey];
}
