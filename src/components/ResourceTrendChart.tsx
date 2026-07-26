/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ReferenceLine, AreaChart, Area 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BookOpen, Layers, X, Sparkles, Activity, Calendar } from 'lucide-react';
import { audio } from '../utils/audio';

export interface TrendDataPoint {
  dayLabel: string;      // e.g. "Day 1", "Day 2", ... "Day 10"
  dayNumber: number;
  aruvam: number;        // Total Aruvam (Wealth)
  arivu: number;         // Total Arivu (Knowledge)
  aruvamNet: number;     // Net income/loss on that day
  arivuNet: number;      // Net income/loss on that day
  weatherName?: string;
}

export interface ResourceTrendChartProps {
  trendData: TrendDataPoint[];
  currentDay: number;
  currentAruvam: number;
  currentArivu: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResourceTrendChart({
  trendData,
  currentDay,
  currentAruvam,
  currentArivu,
  isOpen,
  onClose
}: ResourceTrendChartProps) {
  const [metricMode, setMetricMode] = useState<'total' | 'delta'>('total');

  if (!isOpen) return null;

  // Calculate 10-day growth summary stats
  const firstPoint = trendData[0] || { aruvam: 0, arivu: 0 };
  const lastPoint = trendData[trendData.length - 1] || { aruvam: currentAruvam, arivu: currentArivu };

  const aruvamGrowth = lastPoint.aruvam - firstPoint.aruvam;
  const arivuGrowth = lastPoint.arivu - firstPoint.arivu;

  const aruvamPct = firstPoint.aruvam > 0 ? Math.round((aruvamGrowth / firstPoint.aruvam) * 100) : 100;
  const arivuPct = firstPoint.arivu > 0 ? Math.round((arivuGrowth / firstPoint.arivu) * 100) : 100;

  // Find peak harvest day
  const peakDay = [...trendData].sort((a, b) => (b.aruvamNet + b.arivuNet) - (a.aruvamNet + a.arivuNet))[0];

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as TrendDataPoint;
      return (
        <div className="bg-[#1C1713] border-2 border-[#D2691E]/60 p-3.5 rounded-lg shadow-2xl text-xs font-mono space-y-2 max-w-xs">
          <div className="flex items-center justify-between border-b border-[#D2691E]/30 pb-1.5 font-bold text-[#D4AF37]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#D2691E]" /> {label}
            </span>
            {dataPoint.weatherName && (
              <span className="text-[10px] text-stone-400 font-normal">
                {dataPoint.weatherName}
              </span>
            )}
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[#FFD700]">
              <span className="flex items-center gap-1 font-bold">
                🪙 Aruvam (Wealth):
              </span>
              <span className="font-bold">
                {metricMode === 'total' ? dataPoint.aruvam : `${dataPoint.aruvamNet >= 0 ? '+' : ''}${dataPoint.aruvamNet}`}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#38BDF8]">
              <span className="flex items-center gap-1 font-bold">
                👁️ Arivu (Knowledge):
              </span>
              <span className="font-bold">
                {metricMode === 'total' ? dataPoint.arivu : `${dataPoint.arivuNet >= 0 ? '+' : ''}${dataPoint.arivuNet}`}
              </span>
            </div>
          </div>

          <div className="text-[9px] text-stone-400 border-t border-stone-800 pt-1 flex justify-between">
            <span>Net Change/Day:</span>
            <span className="text-emerald-400 font-bold">
              +{dataPoint.aruvamNet + dataPoint.arivuNet} Total Points
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      
      <div 
        id="resource-trend-modal"
        className="relative w-full max-w-4xl bg-[#1C1713] rounded-2xl border-2 border-[#D2691E]/50 shadow-2xl p-6 space-y-5 text-[#F4EFE6] overflow-hidden"
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#D2691E]/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D2691E]/20 border border-[#D2691E]/50 flex items-center justify-center text-[#D4AF37]">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#D2691E]" /> Imperial Treasury & Knowledge Analytics
              </div>
              <h2 className="text-xl font-serif font-bold text-[#F4EFE6] flex items-center gap-2">
                10-Day Economic Trend Monitor <span className="text-xs font-mono text-[#D2691E]">(பொருளாதார வளர்ச்சி)</span>
              </h2>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              audio.playDrum(false);
              onClose();
            }}
            className="p-2 rounded-lg bg-[#2D241E] hover:bg-stone-800 text-stone-400 hover:text-white transition border border-[#D2691E]/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 10-Day KPI Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Aruvam Growth Card */}
          <div className="bg-[#2D241E] p-3.5 rounded-lg border border-[#D2691E]/30 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                🪙 Aruvam (Wealth) Trend
              </span>
              <div className="text-lg font-mono font-bold text-[#FFD700] flex items-baseline gap-2">
                <span>{currentAruvam}</span>
                <span className={`text-xs ${aruvamGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'} flex items-center`}>
                  {aruvamGrowth >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                  {aruvamGrowth >= 0 ? `+${aruvamGrowth}` : aruvamGrowth} ({aruvamPct}%)
                </span>
              </div>
            </div>
            <div className="text-2xl select-none">🪙</div>
          </div>

          {/* Arivu Growth Card */}
          <div className="bg-[#2D241E] p-3.5 rounded-lg border border-[#D2691E]/30 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                👁️ Arivu (Knowledge) Trend
              </span>
              <div className="text-lg font-mono font-bold text-[#38BDF8] flex items-baseline gap-2">
                <span>{currentArivu}</span>
                <span className={`text-xs ${arivuGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'} flex items-center`}>
                  {arivuGrowth >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                  {arivuGrowth >= 0 ? `+${arivuGrowth}` : arivuGrowth} ({arivuPct}%)
                </span>
              </div>
            </div>
            <div className="text-2xl select-none">👁️</div>
          </div>

          {/* Peak Harvest Day Card */}
          <div className="bg-[#2D241E] p-3.5 rounded-lg border border-[#D2691E]/30 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                🌾 Peak Harvest Day
              </span>
              <div className="text-lg font-mono font-bold text-amber-200">
                {peakDay ? peakDay.dayLabel : `Day ${currentDay}`}
              </div>
              <div className="text-[10px] font-mono text-emerald-400">
                +{peakDay ? peakDay.aruvamNet + peakDay.arivuNet : 0} Combined Points
              </div>
            </div>
            <div className="text-2xl select-none">🏛️</div>
          </div>

        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex justify-between items-center bg-[#241D18] p-2 rounded-lg border border-[#D2691E]/20 text-xs font-mono">
          <span className="text-stone-300 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> Chart Mode:
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audio.playYazh(350);
                setMetricMode('total');
              }}
              className={`px-3 py-1 rounded font-mono font-bold transition cursor-pointer ${
                metricMode === 'total'
                  ? 'bg-[#D2691E] text-black shadow'
                  : 'bg-[#1C1713] text-stone-400 hover:bg-[#3D3028]'
              }`}
            >
              Cumulative Balance
            </button>

            <button
              onClick={() => {
                audio.playYazh(450);
                setMetricMode('delta');
              }}
              className={`px-3 py-1 rounded font-mono font-bold transition cursor-pointer ${
                metricMode === 'delta'
                  ? 'bg-[#D2691E] text-black shadow'
                  : 'bg-[#1C1713] text-stone-400 hover:bg-[#3D3028]'
              }`}
            >
              Daily Income / Loss
            </button>
          </div>
        </div>

        {/* Recharts Chart Viewport Container */}
        <div className="bg-[#120F0D] p-4 rounded-xl border border-[#D2691E]/40 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D241E" opacity={0.6} />
              <XAxis 
                dataKey="dayLabel" 
                stroke="#A8A29E" 
                tick={{ fill: '#A8A29E', fontSize: 11, fontFamily: 'monospace' }} 
              />
              <YAxis 
                stroke="#A8A29E" 
                tick={{ fill: '#A8A29E', fontSize: 11, fontFamily: 'monospace' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} 
              />

              {metricMode === 'delta' && (
                <ReferenceLine y={0} stroke="#78350F" strokeDasharray="3 3" />
              )}

              {/* Aruvam Line */}
              <Line 
                type="monotone" 
                dataKey={metricMode === 'total' ? 'aruvam' : 'aruvamNet'} 
                name="🪙 Aruvam (Wealth)" 
                stroke="#FFD700" 
                strokeWidth={3} 
                dot={{ fill: '#FFD700', r: 4 }} 
                activeDot={{ r: 7, stroke: '#FFFFFF', strokeWidth: 2 }} 
              />

              {/* Arivu Line */}
              <Line 
                type="monotone" 
                dataKey={metricMode === 'total' ? 'arivu' : 'arivuNet'} 
                name="👁️ Arivu (Knowledge)" 
                stroke="#38BDF8" 
                strokeWidth={3} 
                dot={{ fill: '#38BDF8', r: 4 }} 
                activeDot={{ r: 7, stroke: '#FFFFFF', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Note */}
        <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 pt-1 border-t border-[#D2691E]/20">
          <span>Tracked across Cauvery Paddy Fields, Trade Guilds, and Saraswathi Mahal Archives</span>
          <span className="text-[#D4AF37]">Records updated automatically each 60s Day Cycle</span>
        </div>

      </div>

    </div>
  );
}
