/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GridCell, ZoneType, Resources, Livestock, AnimalKind } from '../types';
import { Hammer, Users, Sprout, Anchor, Shield, Warehouse as WarehouseIcon } from 'lucide-react';
import { audio } from '../utils/audio';
import { toast } from '../utils/toast';
import Nagara3D from './Nagara3D';

// Which draft animal a zone employs (kept local to avoid a circular import).
const animalFor = (type: ZoneType): AnimalKind => {
  if (type === 'ur') return 'ox';
  if (type === 'quarry' || type === 'kovil' || type === 'shipyard') return 'elephant';
  return null;
};

interface BuildOption {
  type: ZoneType;
  name: string;
  desc: string;
  cost: number;
  icon: string;
}

const BUILD_OPTIONS: BuildOption[] = [
  { type: 'ur', name: 'Ur — Paddy Field', cost: 50, icon: '🌾', desc: 'Grows Aruvam via paddies; doubles under irrigation. Deploy oxen to plough faster.' },
  { type: 'eri', name: 'Eri — Reservoir', cost: 100, icon: '💧', desc: 'Irrigates all adjacent tiles — essential for high paddy yield.' },
  { type: 'nagar', name: 'Nagar — Marketplace', cost: 120, icon: '🏬', desc: 'Guild shops generating steady Aruvam gold. Upgrade for denser trade.' },
  { type: 'warehouse', name: 'Kalanjiyam — Warehouse', cost: 150, icon: '🏚️', desc: 'Stores & trades surplus goods for passive Aruvam. Staff with workers.' },
  { type: 'barracks', name: 'Padai Veedu — Barracks', cost: 180, icon: '🛡️', desc: 'Trains soldiers, generating Aalavan military power each tick.' },
  { type: 'shipyard', name: 'Kappal Thattu — Shipyard', cost: 200, icon: '⛴️', desc: 'Builds vessels: passive Aruvam and discounts new Kappal at the Port. Elephants haul timber.' },
  { type: 'kovil', name: 'Kovil — Temple', cost: 250, icon: '🛕', desc: 'Generates Anbu devotion + Arivu. Temple elephants amplify the blessing.' },
];

interface NagaraGridProps {
  grid: GridCell[];
  onUpdateCell: (id: string, type: ZoneType) => void;
  onUpgradeCell: (id: string) => void;
  onAssignWorkers: (id: string, count: number) => void;
  onAssignAnimals: (id: string, count: number) => void;
  onBuyElephant: () => void;
  onBuyOx: () => void;
  resources: Resources;
  availableWorkers: number;
  totalWorkers: number;
  availableElephants: number;
  availableOxen: number;
  livestock: Livestock;
}

export default function NagaraGrid({
  grid,
  onUpdateCell,
  onUpgradeCell,
  onAssignWorkers,
  onAssignAnimals,
  onBuyElephant,
  onBuyOx,
  resources,
  availableWorkers,
  totalWorkers,
  availableElephants,
  availableOxen,
  livestock,
}: NagaraGridProps) {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  const selectedCell = grid.find(c => c.id === selectedCellId);

  const getCellLabel = (cell: GridCell) => {
    switch (cell.type) {
      case 'river': return 'Cauvery River';
      case 'quarry': return 'Granite Quarry';
      case 'ur': return `${cell.hasWater ? 'Irrigated' : 'Dry'} Paddy L${cell.level}`;
      case 'nagar': return `Marketplace L${cell.level}`;
      case 'kovil': return `Temple L${cell.level}`;
      case 'eri': return 'Eri Reservoir';
      case 'shipyard': return `Shipyard L${cell.level}`;
      case 'warehouse': return `Warehouse L${cell.level}`;
      case 'barracks': return `Barracks L${cell.level}`;
      case 'empty': return 'Unzoned Land';
      default: return 'Empty';
    }
  };

  const handleCellClick = (cell: GridCell) => {
    audio.playYazh(261.63 + (cell.row * 10) + (cell.col * 15)); // gentle pitch pluck
    setSelectedCellId(cell.id);
  };

  const buildZone = (type: ZoneType) => {
    if (!selectedCellId) return;
    onUpdateCell(selectedCellId, type); // App validates cost + emits toast/sound
  };

  const upgradeZone = () => {
    if (!selectedCell) return;
    onUpgradeCell(selectedCell.id);
  };

  const adjustWorkers = (change: number) => {
    if (!selectedCell) return;
    if (change > 0 && availableWorkers <= 0) {
      audio.playDrum(true);
      toast.push('No idle workers — free some up first.', { icon: '👷', kind: 'warn' });
      return;
    }
    if (change < 0 && selectedCell.assignedWorkers <= 0) return;
    onAssignWorkers(selectedCell.id, change);
  };

  const adjustAnimals = (change: number) => {
    if (!selectedCell) return;
    if (change < 0 && selectedCell.assignedAnimals <= 0) return;
    onAssignAnimals(selectedCell.id, change); // App validates pool + emits toast/sound
  };

  const animalKind = selectedCell ? animalFor(selectedCell.type) : null;
  const animalAvail = animalKind === 'elephant' ? availableElephants : animalKind === 'ox' ? availableOxen : 0;
  const upgradable = selectedCell
    && ['ur', 'nagar', 'kovil', 'warehouse', 'shipyard', 'barracks'].includes(selectedCell.type)
    && selectedCell.level < 3;

  const LEGEND: [string, string][] = [
    ['bg-gradient-to-br from-cyan-400 to-blue-500', 'River'],
    ['bg-gradient-to-br from-emerald-600 to-emerald-400', 'Paddy (Ur)'],
    ['bg-gradient-to-br from-[#D2691E] to-[#D4AF37]', 'Market'],
    ['bg-gradient-to-br from-rose-800 to-red-600', 'Temple'],
    ['bg-gradient-to-br from-sky-400 to-cyan-500', 'Eri Tank'],
    ['bg-[#3D3028]', 'Quarry'],
    ['bg-gradient-to-br from-[#6b4a2b] to-[#c79a54]', 'Warehouse'],
    ['bg-gradient-to-br from-[#523823] to-[#8a6a3f]', 'Shipyard'],
    ['bg-gradient-to-br from-[#6e675e] to-[#9c2b1e]', 'Barracks'],
  ];

  return (
    <div id="nagara-grid-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#241D18] p-6 rounded-xl border-2 border-[#D2691E]/30">

      {/* 3D City Map View */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-serif text-[#F4EFE6] flex items-center gap-2">
              Nagara Blueprint <span className="text-[#D2691E] text-xs font-mono">(நகர வரைபடம்)</span>
            </h3>
            <p className="text-stone-400 text-xs">
              Zone lands to design a balanced imperial ecosystem. Click plots to build or inspect.
            </p>
          </div>

          <div className="flex flex-col gap-1 text-[11px] font-mono">
            <div className="bg-[#2D241E] border border-[#D2691E]/30 px-3 py-1 rounded text-stone-300 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#D2691E]" />
              <span>Workers <strong className="text-[#D4AF37]">{availableWorkers}</strong>/{totalWorkers}</span>
            </div>
            <div className="bg-[#2D241E] border border-[#D2691E]/30 px-3 py-1 rounded text-stone-300 flex items-center gap-2">
              <span>🐘 <strong className="text-[#D4AF37]">{availableElephants}</strong>/{livestock.elephants}</span>
              <span>🐂 <strong className="text-[#D4AF37]">{availableOxen}</strong>/{livestock.oxen}</span>
            </div>
          </div>
        </div>

        {/* The 3D Map Canvas */}
        <div className="relative w-full aspect-square md:aspect-auto md:h-[460px] bg-[#1C1713] rounded-lg p-3 border border-[#D2691E]/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D2691E]/20 via-transparent to-transparent" />
          <div className="absolute inset-3 rounded-lg overflow-hidden">
            <Nagara3D grid={grid} selectedId={selectedCellId} onSelect={handleCellClick} />
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-mono text-stone-400/80 pointer-events-none">
            Drag to rotate · scroll to zoom · click a plot to build
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-[10px] text-stone-400 bg-[#2D241E] p-2.5 rounded border border-[#D2691E]/20">
          {LEGEND.map(([cls, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3.5 h-3.5 rounded border border-black/20 ${cls}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Inspector / Action Panel */}
      <div id="grid-inspector-panel" className="bg-[#2D241E] border border-[#D2691E]/30 rounded-lg p-5 flex flex-col h-full custom-scrollbar overflow-y-auto max-h-[640px]">
        {selectedCell ? (
          <div className="flex-1">
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

            <div className="text-stone-300 text-xs leading-relaxed space-y-3">

              {/* ---- BUILD MENU (empty land) ---- */}
              {selectedCell.type === 'empty' && (
                <div>
                  <p className="text-stone-400 mb-3">Unzoned land. Choose a structure to raise here:</p>
                  <div className="space-y-2">
                    {BUILD_OPTIONS.map(opt => {
                      const afford = resources.aruvam >= opt.cost;
                      return (
                        <button
                          key={opt.type}
                          id={`btn-zone-${opt.type}`}
                          onClick={() => buildZone(opt.type)}
                          className={`w-full p-2.5 rounded border text-left flex justify-between items-center gap-2 transition active:scale-[0.99] ${
                            afford
                              ? 'bg-[#1C1713] hover:bg-[#3D3028] border-[#D2691E]/20 cursor-pointer'
                              : 'bg-[#1C1713]/60 border-[#D2691E]/10 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-lg leading-none mt-0.5">{opt.icon}</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-stone-200">{opt.name}</div>
                              <div className="text-[10px] text-stone-400 leading-snug">{opt.desc}</div>
                            </div>
                          </div>
                          <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                            afford ? 'text-[#D4AF37] bg-[#2D241E] border-[#D2691E]/20' : 'text-stone-500 bg-[#2D241E] border-stone-700'
                          }`}>{opt.cost}g</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ---- ZONE INFO ---- */}
              {selectedCell.type === 'ur' && (
                <ProdRow label="Irrigation" value={selectedCell.hasWater ? 'Active · 200% yield' : 'Dry · 100% yield'} accent={selectedCell.hasWater ? 'text-cyan-400' : 'text-stone-500'}
                  note="Build an Eri tank adjacent, or plough with oxen, to boost the harvest." />
              )}
              {selectedCell.type === 'nagar' && (
                <ProdRow label="Trade output" value={`Level ${selectedCell.level} market`} accent="text-[#D4AF37]"
                  note="Assign merchants (workers) — each raises continuous Aruvam gold." />
              )}
              {selectedCell.type === 'kovil' && (
                <ProdRow label="Devotion" value={`Level ${selectedCell.level} temple`} accent="text-rose-400"
                  note="Priests generate Anbu + Arivu; temple elephants amplify the rite." />
              )}
              {selectedCell.type === 'warehouse' && (
                <ProdRow label="Stored goods" value={`Level ${selectedCell.level} store`} accent="text-[#D4AF37]"
                  note="Keepers trade surplus for passive Aruvam every tick." />
              )}
              {selectedCell.type === 'shipyard' && (
                <ProdRow label="Slipway" value={`Level ${selectedCell.level} yard`} accent="text-sky-400"
                  note="Builds vessels: passive Aruvam and cheaper Kappal at the Trade Port. Elephants haul timber." />
              )}
              {selectedCell.type === 'barracks' && (
                <ProdRow label="Garrison" value={`Level ${selectedCell.level} barracks`} accent="text-red-400"
                  note="Drilling soldiers steadily raise your Aalavan military power." />
              )}
              {selectedCell.type === 'eri' && (
                <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 text-[11px] font-mono text-cyan-400">
                  💦 Irrigating all adjacent agricultural and municipal zones.
                </div>
              )}
              {selectedCell.type === 'quarry' && (
                <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 text-[11px] font-mono text-[#D2691E]">
                  🔨 Assign workers & elephants to excavate granite for the Brihadeeswarar Temple.
                </div>
              )}
              {selectedCell.type === 'river' && (
                <p className="text-cyan-300 italic">The holy Cauvery — a perpetual source of irrigation for adjacent plots.</p>
              )}

              {/* ---- ACTIONS (upgrade / workers / animals) ---- */}
              {selectedCell.type !== 'empty' && selectedCell.type !== 'river' && (
                <div className="mt-4 pt-4 border-t border-[#D2691E]/20 space-y-4">

                  {/* Upgrade / Expand */}
                  {upgradable && (
                    <div className="flex justify-between items-center bg-[#1C1713] p-2 rounded border border-[#D2691E]/20">
                      <div>
                        <div className="text-[10px] text-stone-400 font-sans">
                          {selectedCell.type === 'ur' ? 'Expand field' : 'Upgrade'} to L{selectedCell.level + 1}
                        </div>
                        <div className="text-[#D4AF37] font-mono font-bold text-xs">Cost: {selectedCell.level * 200} Gold</div>
                      </div>
                      <button
                        id="btn-upgrade-cell"
                        onClick={upgradeZone}
                        className="px-3 py-1.5 rounded bg-[#D2691E] hover:bg-[#E37E32] text-black font-extrabold text-xs uppercase flex items-center gap-1 transition cursor-pointer active:scale-95"
                      >
                        {selectedCell.type === 'ur' ? <Sprout className="w-3.5 h-3.5" /> : <Hammer className="w-3.5 h-3.5" />}
                        {selectedCell.type === 'ur' ? 'Expand' : 'Upgrade'}
                      </button>
                    </div>
                  )}

                  {/* Workers */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-stone-300 text-xs">
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#D2691E]" /> Workers</span>
                      <span className="font-mono font-semibold text-[#D2691E]">{selectedCell.assignedWorkers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button id="btn-remove-worker" onClick={() => adjustWorkers(-1)}
                        className="flex-1 py-1.5 rounded bg-[#1C1713] hover:bg-[#2D241E] text-[#FF6B6B] font-bold text-xs border border-[#D2691E]/20 cursor-pointer active:scale-95">− Recall</button>
                      <button id="btn-add-worker" onClick={() => adjustWorkers(1)}
                        className="flex-1 py-1.5 rounded bg-[#D2691E]/20 hover:bg-[#D2691E]/40 text-[#D4AF37] font-bold text-xs border border-[#D2691E]/30 cursor-pointer active:scale-95">+ Deploy</button>
                    </div>
                  </div>

                  {/* Animals (only where the zone uses them) */}
                  {animalKind && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-stone-300 text-xs">
                        <span className="flex items-center gap-1.5">
                          {animalKind === 'elephant' ? '🐘 War Elephants' : '🐂 Plough Oxen'}
                        </span>
                        <span className="font-mono font-semibold text-[#D2691E]">
                          {selectedCell.assignedAnimals} <span className="text-stone-500">({animalAvail} idle)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button id="btn-remove-animal" onClick={() => adjustAnimals(-1)}
                          className="flex-1 py-1.5 rounded bg-[#1C1713] hover:bg-[#2D241E] text-[#FF6B6B] font-bold text-xs border border-[#D2691E]/20 cursor-pointer active:scale-95">− Recall</button>
                        <button id="btn-add-animal" disabled={animalAvail <= 0} onClick={() => adjustAnimals(1)}
                          className={`flex-1 py-1.5 rounded font-bold text-xs border cursor-pointer active:scale-95 ${
                            animalAvail > 0 ? 'bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 border-emerald-700/40' : 'bg-[#1C1713] text-stone-600 border-[#D2691E]/10 cursor-not-allowed'
                          }`}>+ Deploy</button>
                        <button id="btn-buy-animal" onClick={animalKind === 'elephant' ? onBuyElephant : onBuyOx}
                          title={animalKind === 'elephant' ? 'Acquire war elephant (250g + 10 power)' : 'Acquire plough ox (120g)'}
                          className="py-1.5 px-2.5 rounded bg-[#2D241E] hover:bg-[#3D3028] text-[#D4AF37] font-bold text-xs border border-[#D2691E]/30 cursor-pointer active:scale-95">
                          Buy {animalKind === 'elephant' ? '🐘' : '🐂'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-stone-500 flex-1 flex flex-col items-center justify-center">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#D2691E] animate-pulse" />
            <p className="font-serif italic text-sm">Select a plot on the map to inspect it, deploy workers &amp; animals, and raise buildings.</p>
          </div>
        )}

        {/* Reserves footer */}
        <div className="mt-4 p-3 bg-[#1C1713] rounded border border-[#D2691E]/20 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <span className="text-[#D4AF37] flex items-center gap-1 font-bold">💰 {resources.aruvam.toLocaleString()}</span>
          <span className="text-[#4A90E2] flex items-center gap-1 font-bold justify-end">👁️ {resources.arivu.toLocaleString()}</span>
          <span className="text-[#FF6B6B] flex items-center gap-1 font-bold">🪷 {resources.anbu.toLocaleString()}</span>
          <span className="text-red-500 flex items-center gap-1 font-bold justify-end">⚔️ {resources.aalavan.toLocaleString()}</span>
        </div>
      </div>

    </div>
  );
}

// Compact production info row used across zone types.
function ProdRow({ label, value, accent, note }: { label: string; value: string; accent: string; note: string }) {
  return (
    <div className="space-y-2">
      <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 flex justify-between items-center font-mono text-[11px]">
        <span className="text-stone-400">{label}</span>
        <span className={`font-bold ${accent}`}>{value}</span>
      </div>
      <p className="text-[10px] text-stone-500 leading-snug">{note}</p>
    </div>
  );
}
