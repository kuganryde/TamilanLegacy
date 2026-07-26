/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MonsoonWeather } from '../types';
import { audio } from '../utils/audio';
import { 
  CloudRain, CloudLightning, Sun, Sparkles, 
  Calendar, RefreshCw, Compass, Droplets, Info, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';

interface MonsoonWeatherBannerProps {
  weather: MonsoonWeather;
  currentDay: number;
  timeUntilNextDay: number;
  onAdvanceDay: () => void;
}

export default function MonsoonWeatherBanner({
  weather,
  currentDay,
  timeUntilNextDay,
  onAdvanceDay
}: MonsoonWeatherBannerProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full bg-[#120F0D] border-b border-[#D2691E]/30 text-stone-200">
      {/* Compact Weather Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        
        {/* Left: Royal Calendar Day & Weather Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#241D18] border border-[#D2691E]/30 text-[#D4AF37] font-bold">
            <Calendar className="w-3.5 h-3.5 text-[#D2691E]" />
            <span>Chola Year 1010 • Day {currentDay}</span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-md border font-serif font-bold ${weather.badgeColor}`}>
            <span className="text-sm">{weather.icon}</span>
            <span>{weather.name}</span>
            <span className="text-[10px] font-mono font-normal opacity-80 font-sans">({weather.tamilName})</span>
          </div>
        </div>

        {/* Center: Live Impact Summary Badges */}
        <div className="hidden lg:flex items-center gap-2 text-[11px]">
          <span className="text-stone-400">Yield Multipliers:</span>
          
          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
            weather.cropYieldMultiplier >= 1.2 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
              : weather.cropYieldMultiplier < 1.0 
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' 
              : 'bg-stone-800 border-stone-700 text-stone-300'
          }`}>
            🌾 Crops: {Math.round(weather.cropYieldMultiplier * 100)}%
          </span>

          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
            weather.maritimeRiskModifier > 0 
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' 
              : weather.maritimeRiskModifier < 0 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
              : 'bg-stone-800 border-stone-700 text-stone-300'
          }`}>
            ⚓ Sea Risk: {weather.maritimeRiskModifier >= 0 ? `+${weather.maritimeRiskModifier}%` : `${weather.maritimeRiskModifier}%`}
          </span>
        </div>

        {/* Right: Next Day Countdown & Manual Advance Day Button */}
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-stone-400 flex items-center gap-1">
            <span>Next Cycle:</span>
            <strong className="text-stone-200 font-mono">{formatSeconds(timeUntilNextDay)}</strong>
          </div>

          <button
            onClick={() => {
              audio.playBell();
              onAdvanceDay();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#D2691E]/20 hover:bg-[#D2691E]/30 border border-[#D2691E]/50 text-[#D4AF37] hover:text-white font-bold transition cursor-pointer text-[10px] uppercase tracking-wider"
            title="Consult Royal Astrologer to advance the day and reveal a new seasonal weather pattern!"
          >
            <RefreshCw className="w-3 h-3 text-[#D2691E] animate-spin-slow" />
            <span>Consult Astrologer ☀️</span>
          </button>

          <button
            onClick={() => {
              audio.playYazh(349.23);
              setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            title="Toggle Monsoon Details"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* Expanded Details Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#1A1512] border-t border-[#D2691E]/20"
          >
            <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Weather Lore */}
              <div className="space-y-1.5 p-3 rounded-lg bg-[#241D18] border border-stone-800">
                <div className="flex items-center gap-2 text-[#D4AF37] font-serif font-bold">
                  <span className="text-base">{weather.icon}</span>
                  <span>{weather.name} ({weather.tamilName})</span>
                </div>
                <p className="text-stone-300 leading-relaxed text-[11px]">
                  {weather.description}
                </p>
              </div>

              {/* Agricultural Impact */}
              <div className="p-3 rounded-lg bg-[#241D18] border border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-stone-200 font-bold border-b border-stone-800 pb-1">
                  <span className="flex items-center gap-1 text-emerald-400">
                    🌾 Cauvery Crop Yield Impact
                  </span>
                  <span className="font-mono text-emerald-300">
                    {Math.round(weather.cropYieldMultiplier * 100)}% Output
                  </span>
                </div>
                <p className="text-stone-400 text-[11px] leading-snug">
                  {weather.cropYieldMultiplier > 1.0 
                    ? "Heavy monsoon rains flood the Cauvery irrigation network, significantly boosting paddy harvest productivity."
                    : weather.cropYieldMultiplier < 1.0
                    ? "Adverse weather shrinks river flow or causes excess flooding. Build Eri reservoirs to protect your crops!"
                    : "Standard climatic conditions. Normal paddy harvests."}
                </p>
              </div>

              {/* Maritime Safety Impact */}
              <div className="p-3 rounded-lg bg-[#241D18] border border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-stone-200 font-bold border-b border-stone-800 pb-1">
                  <span className="flex items-center gap-1 text-sky-400">
                    ⚓ Maritime Safety & Voyage Speed
                  </span>
                  <span className="font-mono text-sky-300">
                    {weather.maritimeRiskModifier >= 0 ? `+${weather.maritimeRiskModifier}% Risk` : `${weather.maritimeRiskModifier}% Risk`}
                  </span>
                </div>
                <p className="text-stone-400 text-[11px] leading-snug">
                  {weather.maritimeRiskModifier > 0
                    ? "Rough monsoon waves and storms increase risk for ships sailing to Srivijaya & China. Unlock Naval Compass to mitigate!"
                    : weather.maritimeRiskModifier < 0
                    ? "Favorable seasonal tailwinds speed up voyages and ensure smooth ocean passage for Kadal Pira trade fleets."
                    : "Calm ocean breeze across the Bay of Bengal."}
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
