/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GridCell, ZoneType, Resources } from '../types';
import { Hammer, Users, RefreshCw, Droplet, Coins, Flame, Award, Heart } from 'lucide-react';
import { audio } from '../utils/audio';

interface NagaraGridProps {
  grid: GridCell[];
  onUpdateCell: (id: string, type: ZoneType) => void;
  onUpgradeCell: (id: string) => void;
  onAssignWorkers: (id: string, count: number) => void;
  resources: Resources;
  availableWorkers: number;
  totalWorkers: number;
}

export default function NagaraGrid({
  grid,
  onUpdateCell,
  onUpgradeCell,
  onAssignWorkers,
  resources,
  availableWorkers,
  totalWorkers,
}: NagaraGridProps) {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  const selectedCell = grid.find(c => c.id === selectedCellId);

  // Helper colors for the low-poly/voxel themed grid
  const getZoneStyles = (cell: GridCell) => {
    switch (cell.type) {
      case 'river':
        return 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white animate-pulse border-blue-600/50';
      case 'quarry':
        return 'bg-gradient-to-br from-[#3D3028] to-[#1C1713] text-stone-200 border-[#D2691E]/20';
      case 'ur':
        return cell.hasWater 
          ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white border-emerald-700' 
          : 'bg-gradient-to-br from-[#D2691E] to-amber-500 text-black border-[#D2691E]/50';
      case 'nagar':
        return 'bg-gradient-to-br from-[#D2691E] to-[#D4AF37] text-black border-[#D4AF37]/50';
      case 'kovil':
        return 'bg-gradient-to-br from-rose-800 to-red-600 text-amber-100 border-rose-900';
      case 'eri':
        return 'bg-gradient-to-br from-sky-400 to-cyan-500 text-white border-sky-600 animate-pulse';
      case 'empty':
      default:
        return 'bg-gradient-to-br from-[#1C1713] to-[#2D241E] text-stone-600 border-[#D2691E]/10 hover:from-[#2D241E] hover:to-[#3D3028]';
    }
  };

  const getCellLabel = (cell: GridCell) => {
    switch (cell.type) {
      case 'river': return 'River';
      case 'quarry': return 'Quarry';
      case 'ur': return cell.hasWater ? 'Irrigated Ur' : 'Dry Ur';
      case 'nagar': return `Nagar L${cell.level}`;
      case 'kovil': return `Kovil L${cell.level}`;
      case 'eri': return 'Eri Tank';
      case 'empty': return 'Unzoned';
      default: return 'Empty';
    }
  };

  const handleCellClick = (cell: GridCell) => {
    audio.playYazh(261.63 + (cell.row * 10) + (cell.col * 15)); // gentle pitch pluck
    setSelectedCellId(cell.id);
  };

  const buildZone = (type: ZoneType) => {
    if (!selectedCellId) return;
    
    // Cost validation
    let cost = 0;
    if (type === 'ur') cost = 50;
    if (type === 'nagar') cost = 120;
    if (type === 'kovil') cost = 250;
    if (type === 'eri') cost = 100;

    if (resources.aruvam >= cost) {
      audio.playBell(); // Bell sound for major building
      onUpdateCell(selectedCellId, type);
    } else {
      audio.playDrum(true); // Buzz warning
    }
  };

  const upgradeZone = () => {
    if (!selectedCell) return;
    const cost = selectedCell.level * 200;
    if (resources.aruvam >= cost) {
      audio.playBell();
      onUpgradeCell(selectedCell.id);
    } else {
      audio.playDrum(true);
    }
  };

  const adjustWorkers = (change: number) => {
    if (!selectedCell) return;
    const current = selectedCell.assignedWorkers;
    const target = current + change;

    if (target < 0) return;
    if (change > 0 && availableWorkers <= 0) {
      audio.playDrum(true); // Not enough workers
      return;
    }

    audio.playDrum(false); // Subtle mridangam tap
    onAssignWorkers(selectedCell.id, change);
  };

  return (
    <div id="nagara-grid-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#241D18] p-6 rounded-xl border-2 border-[#D2691E]/30">
      
      {/* 2.5D City Map View */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-serif text-[#F4EFE6] flex items-center gap-2">
              Nagara Blueprint <span className="text-[#D2691E] text-xs font-mono">(நகர வரைபடம்)</span>
            </h3>
            <p className="text-stone-400 text-xs">
              Zone lands to design a balanced imperial ecosystem. Click cells to build or inspect.
            </p>
          </div>
          
          <div className="text-xs bg-[#2D241E] border border-[#D2691E]/30 px-3 py-1.5 rounded-lg text-stone-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D2691E]" />
            <span>Idle Workers: <strong className="text-[#D4AF37]">{availableWorkers}</strong> / {totalWorkers}</span>
          </div>
        </div>

        {/* The Map Canvas Grid (8x8 layout) */}
        <div className="relative w-full aspect-square md:aspect-auto md:h-[460px] bg-[#1C1713] rounded-lg p-3 border border-[#D2691E]/20 flex items-center justify-center overflow-hidden">
          {/* Subtle Grid Sun-ray / Dust effects */}
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D2691E]/20 via-transparent to-transparent" />
          
          {/* Render 8x8 Isometric/Styled Grid */}
          <div className="grid grid-cols-8 grid-rows-8 gap-1.5 w-full h-full max-w-[440px] max-h-[440px]">
            {grid.map((cell) => {
              const isSelected = cell.id === selectedCellId;
              const hasWorkers = cell.assignedWorkers > 0;
              
              return (
                <button
                  key={cell.id}
                  id={`grid-cell-${cell.row}-${cell.col}`}
                  onClick={() => handleCellClick(cell)}
                  className={`relative rounded flex flex-col justify-between p-1 select-none text-[8px] font-mono font-bold transition-all duration-200 border-2 active:scale-95 ${getZoneStyles(cell)} ${
                    isSelected 
                      ? 'ring-4 ring-[#D2691E] border-[#D2691E] z-10 scale-102 shadow-lg shadow-[#D2691E]/20' 
                      : 'border-transparent'
                  }`}
                >
                  {/* Top indicators */}
                  <div className="flex justify-between items-center w-full">
                    <span className="opacity-75 text-[7px]">
                      {cell.row},{cell.col}
                    </span>
                    {cell.hasWater && cell.type !== 'river' && (
                      <Droplet className="w-2.5 h-2.5 text-cyan-300 animate-bounce" />
                    )}
                  </div>

                  {/* Voxel Representative Drawing (using absolute elements/mini-bars to convey 3D depth) */}
                  <div className="my-auto flex flex-col items-center justify-center">
                    {cell.type === 'ur' && (
                      <div className="w-4 h-2 bg-emerald-800/40 rounded-full flex items-center justify-center">
                        🌾
                      </div>
                    )}
                    {cell.type === 'nagar' && (
                      <div className="w-5 h-4 bg-orange-600/40 rounded flex flex-col justify-end items-center border border-orange-500/30">
                        <span className="text-[6px] text-white">🏪</span>
                      </div>
                    )}
                    {cell.type === 'kovil' && (
                      <div className="w-5 h-5 bg-rose-900/60 rounded-t-lg flex items-center justify-center border-t-2 border-amber-400">
                        🕉️
                      </div>
                    )}
                    {cell.type === 'eri' && (
                      <div className="w-5 h-3 bg-sky-300/60 rounded border border-cyan-400">
                        🌊
                      </div>
                    )}
                    {cell.type === 'river' && (
                      <div className="w-full h-1 bg-cyan-300/80 rounded" />
                    )}
                    {cell.type === 'quarry' && (
                      <div className="text-[12px]">⛰️</div>
                    )}
                  </div>

                  {/* Bottom indicators: workers and status */}
                  <div className="w-full flex justify-between items-end text-[7px]">
                    <span className="truncate max-w-[40px] tracking-tighter opacity-90">
                      {getCellLabel(cell).split(' ')[0]}
                    </span>
                    {hasWorkers && (
                      <span className="flex items-center gap-[1px] bg-black/40 px-[3px] py-[1px] rounded text-[#D4AF37]">
                        👷{cell.assignedWorkers}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-6 gap-2 mt-3 text-[10px] text-stone-400 bg-[#2D241E] p-2 rounded border border-[#D2691E]/20">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-cyan-400 to-blue-500 border border-blue-600/30" /><span>River</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-emerald-600 to-emerald-400 border border-emerald-700" /><span>Paddy (Ur)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-[#D2691E] to-[#D4AF37] border border-[#D4AF37]/50" /><span>Market (Nagar)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-rose-800 to-red-600 border border-rose-900" /><span>Temple (Kovil)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-sky-400 to-cyan-500 border border-sky-600" /><span>Eri Tank</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-[#3D3028] border border-[#D2691E]/20" /><span>Quarry</span></div>
        </div>
      </div>

      {/* Inspector / Action Panel */}
      <div id="grid-inspector-panel" className="bg-[#2D241E] border border-[#D2691E]/30 rounded-lg p-5 flex flex-col justify-between h-full">
        {selectedCell ? (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#D2691E] uppercase tracking-widest">
                  Row {selectedCell.row}, Col {selectedCell.col}
                </span>
                <h4 className="text-base font-serif font-semibold text-[#F4EFE6]">
                  {getCellLabel(selectedCell)}
                </h4>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                selectedCell.hasWater && selectedCell.type !== 'river'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/40' 
                  : 'bg-[#1C1713] text-stone-400 border border-stone-800'
              }`}>
                {selectedCell.hasWater ? 'Irrigated' : 'Dry'}
              </span>
            </div>

            <div className="w-full h-[1px] bg-[#D2691E]/20 mb-4" />

            {/* Zone Descriptions / Details */}
            <div className="text-stone-300 text-xs leading-relaxed space-y-3 mb-6">
              {selectedCell.type === 'empty' && (
                <div>
                  <p className="text-stone-400">This land is currently unzoned. To deploy a structure, choose from the building plans below:</p>
                  
                  {/* Blueprint Options */}
                  <div className="space-y-2 mt-4">
                    <button
                      id="btn-zone-ur"
                      onClick={() => buildZone('ur')}
                      className="w-full p-2.5 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/20 text-left flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-semibold text-stone-200">Ur Zone (Agriculture)</div>
                        <div className="text-[10px] text-stone-400">Generates Aruvam (Wealth) via paddies. Yield doubles if irrigated.</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#2D241E] px-1.5 py-0.5 rounded border border-[#D2691E]/20">50 Gold</span>
                    </button>

                    <button
                      id="btn-zone-nagar"
                      onClick={() => buildZone('nagar')}
                      className="w-full p-2.5 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/20 text-left flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-semibold text-stone-200">Nagar Zone (Marketplace)</div>
                        <div className="text-[10px] text-stone-400">Houses guilds, trading shops. Generates heavy Aruvam continuously.</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#2D241E] px-1.5 py-0.5 rounded border border-[#D2691E]/20">120 Gold</span>
                    </button>

                    <button
                      id="btn-zone-kovil"
                      onClick={() => buildZone('kovil')}
                      className="w-full p-2.5 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/20 text-left flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-semibold text-stone-200">Kovil Zone (Spiritual Centre)</div>
                        <div className="text-[10px] text-stone-400">Generates Anbu (Culture) and serves as educational temple hub.</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#2D241E] px-1.5 py-0.5 rounded border border-[#D2691E]/20">250 Gold</span>
                    </button>

                    <button
                      id="btn-zone-eri"
                      onClick={() => buildZone('eri')}
                      className="w-full p-2.5 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/20 text-left flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-semibold text-stone-200">Eri Tank (Reservoir)</div>
                        <div className="text-[10px] text-stone-400">Irrigates all adjacent tiles. Essential for maximizing agricultural yield.</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#2D241E] px-1.5 py-0.5 rounded border border-[#D2691E]/20">100 Gold</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedCell.type === 'ur' && (
                <div className="space-y-3">
                  <p className="text-stone-300">
                    Traditional agricultural land cultivating rich paddy rice (*Nel*).
                  </p>
                  <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-stone-400">
                      <span>Irrigation Boost:</span>
                      <span className={selectedCell.hasWater ? 'text-cyan-400 animate-pulse font-bold' : 'text-stone-500'}>
                        {selectedCell.hasWater ? 'Active (200% Yield)' : 'Inactive (100% Yield)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Aruvam Production:</span>
                      <span className="text-[#D4AF37] font-bold">+{selectedCell.hasWater ? 10 : 5} gold / min</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedCell.type === 'nagar' && (
                <div className="space-y-3">
                  <p className="text-stone-300">
                    Busy market lanes housing master artisans, metalworkers, and active guilds.
                  </p>
                  <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-stone-400">
                      <span>Building Level:</span>
                      <span className="text-[#D2691E] font-bold">Level {selectedCell.level}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Aruvam Production:</span>
                      <span className="text-[#D4AF37] font-bold">+{15 * selectedCell.level} gold / min</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedCell.type === 'kovil' && (
                <div className="space-y-3">
                  <p className="text-stone-300">
                    Spiritual, scholarly center managing scriptures, fine arts, and community grains.
                  </p>
                  <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-stone-400">
                      <span>Building Level:</span>
                      <span className="text-[#D2691E] font-bold">Level {selectedCell.level}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Anbu Production:</span>
                      <span className="text-rose-400 font-bold">+{10 * selectedCell.level} culture / min</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedCell.type === 'eri' && (
                <div className="space-y-3">
                  <p className="text-stone-300">
                    Deep water reservoir feeding life-giving irrigation channels to adjacent farms.
                  </p>
                  <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 text-[11px] font-mono text-cyan-400">
                    💦 Actively irrigating all adjacent agricultural and municipal zones!
                  </div>
                </div>
              )}

              {selectedCell.type === 'river' && (
                <p className="text-cyan-300 italic">
                  The holy Cauvery river flowing naturally. Floods if not maintained, but grants abundant immediate irrigation.
                </p>
              )}

              {selectedCell.type === 'quarry' && (
                <div className="space-y-3">
                  <p className="text-stone-300">
                    Massive granite quarry providing the base blocks for temple towers.
                  </p>
                  <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 text-[11px] font-mono text-[#D2691E]">
                    🔨 Assign workers here to excavate granite blocks for Brihadeeswarar Temple.
                  </div>
                </div>
              )}

              {/* Worker Allocation & Upgrades */}
              {selectedCell.type !== 'empty' && selectedCell.type !== 'river' && (
                <div className="mt-4 pt-4 border-t border-[#D2691E]/20 space-y-4">
                  {/* Upgrade Zone action */}
                  {(selectedCell.type === 'nagar' || selectedCell.type === 'kovil') && selectedCell.level < 3 && (
                    <div className="flex justify-between items-center bg-[#1C1713] p-2 rounded border border-[#D2691E]/20">
                      <div>
                        <div className="text-[10px] text-stone-400 font-sans">Upgrade to L{selectedCell.level + 1}</div>
                        <div className="text-[#D4AF37] font-mono font-bold text-xs">Cost: {selectedCell.level * 200} Gold</div>
                      </div>
                      <button
                        id="btn-upgrade-cell"
                        onClick={upgradeZone}
                        className="px-3 py-1.5 rounded bg-[#D2691E] hover:bg-[#E37E32] text-black font-extrabold text-xs uppercase flex items-center gap-1 transition cursor-pointer active:scale-95"
                      >
                        <Hammer className="w-3.5 h-3.5" /> Upgrade
                      </button>
                    </div>
                  )}

                  {/* Worker Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-stone-300 text-xs">
                      <span>Assigned Workers</span>
                      <span className="font-mono font-semibold text-[#D2691E]">{selectedCell.assignedWorkers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-remove-worker"
                        onClick={() => adjustWorkers(-1)}
                        className="flex-1 py-1.5 px-3 rounded bg-[#1C1713] hover:bg-[#2D241E] text-[#FF6B6B] font-bold text-xs text-center border border-[#D2691E]/20 cursor-pointer active:scale-95"
                      >
                        - Remove
                      </button>
                      <button
                        id="btn-add-worker"
                        onClick={() => adjustWorkers(1)}
                        className="flex-1 py-1.5 px-3 rounded bg-[#D2691E]/20 hover:bg-[#D2691E]/40 text-[#D4AF37] font-bold text-xs text-center border border-[#D2691E]/30 cursor-pointer active:scale-95"
                      >
                        + Deploy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="text-center py-12 text-stone-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#D2691E] animate-pulse" />
            <p className="font-serif italic text-sm">Select a cell on the map to inspect resources, assign workers, and build structures.</p>
          </div>
        )}

        {/* Dynamic Resource HUD info inside inspector */}
        {selectedCell && (
          <div className="mt-4 p-3 bg-[#1C1713] rounded border border-[#D2691E]/20 flex items-center justify-between text-[11px] font-mono">
            <span className="text-stone-400">Empire Reserves:</span>
            <span className="text-[#D4AF37] flex items-center gap-1 font-bold">
              💰 {resources.aruvam.toLocaleString()} gold
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
