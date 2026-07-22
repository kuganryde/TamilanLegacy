/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Resources, Army, UnitKind } from '../types';
import { UNIT_META, UNIT_ORDER, armyTotal, armyStrength } from '../data/units';
import { Shield, Swords, AlertTriangle } from 'lucide-react';

interface WarCouncilProps {
  army: Army;
  resources: Resources;
  barracksCount: number;
  onRecruit: (kind: UnitKind) => void;
}

export default function WarCouncil({ army, resources, barracksCount, onRecruit }: WarCouncilProps) {
  const total = armyTotal(army);
  const strength = armyStrength(army);

  return (
    <div id="war-council" className="bg-[#241D18] rounded-xl p-6 border-2 border-[#D2691E]/30 shadow-2xl space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D2691E]/20 pb-4">
        <div>
          <span className="text-xs font-mono text-[#D2691E] uppercase tracking-widest">Era 1 · Sangam Age Muster</span>
          <h2 className="text-2xl font-serif text-[#F4EFE6] font-bold flex items-center gap-2">
            Padai Thalaimai <span className="text-[#D2691E] font-normal text-base">(படைத் தலைமை)</span>
          </h2>
          <p className="text-stone-400 text-xs mt-1">Muster the imperial army from the Padai Veedu barracks. Units defend the city during the Shadows phase.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-[#2D241E] px-4 py-2 rounded-lg border border-[#D2691E]/30 text-center">
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-mono flex items-center gap-1"><Swords className="w-3 h-3 text-[#D2691E]" /> Standing Army</div>
            <div className="text-lg font-bold font-mono text-[#F4EFE6]">{total} <span className="text-xs text-stone-400 font-normal">units</span></div>
          </div>
          <div className="bg-[#2D241E] px-4 py-2 rounded-lg border border-[#D2691E]/30 text-center">
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-mono flex items-center gap-1"><Shield className="w-3 h-3 text-red-500" /> Strength</div>
            <div className="text-lg font-bold font-mono text-red-500">{strength}</div>
          </div>
        </div>
      </div>

      {/* Barracks requirement notice */}
      {barracksCount === 0 && (
        <div className="bg-[#1C1713] border border-amber-700/40 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
          <p className="text-xs text-amber-200/90">
            You have no <strong>Padai Veedu (Barracks)</strong>. Build at least one in the <strong>Nagara City Planner</strong> to begin recruiting Sangam-age troops.
          </p>
        </div>
      )}

      {/* Unit roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {UNIT_ORDER.map(kind => {
          const u = UNIT_META[kind];
          const canAfford = resources.aalavan >= u.cost.aalavan && resources.aruvam >= u.cost.aruvam;
          const enabled = canAfford && barracksCount > 0;
          return (
            <div key={kind} id={`unit-card-${kind}`} className="bg-[#1C1713] border border-[#D2691E]/20 rounded-lg p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-[#2D241E] border border-[#D2691E]/30 flex items-center justify-center text-2xl shrink-0">{u.icon}</div>
                  <div className="min-w-0">
                    <div className="font-serif font-semibold text-[#F4EFE6] flex items-center gap-2">
                      {u.name} <span className="text-[10px] font-mono text-[#D2691E]">{u.tamil}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-snug mt-0.5">{u.desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] text-stone-500 uppercase font-mono">In army</div>
                  <div className="text-xl font-mono font-bold text-[#D4AF37]">{army[kind]}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#D2691E]/10">
                <div className="flex gap-3 text-[11px] font-mono">
                  <span className={resources.aalavan >= u.cost.aalavan ? 'text-red-400 font-bold' : 'text-stone-600'}>⚔️ {u.cost.aalavan}</span>
                  <span className={resources.aruvam >= u.cost.aruvam ? 'text-[#D4AF37] font-bold' : 'text-stone-600'}>💰 {u.cost.aruvam}</span>
                  <span className="text-stone-500">· str {u.strength}</span>
                </div>
                <button
                  id={`btn-recruit-${kind}`}
                  disabled={!enabled}
                  onClick={() => onRecruit(kind)}
                  className={`px-4 py-1.5 rounded text-xs font-extrabold uppercase tracking-wider transition active:scale-95 ${
                    enabled ? 'bg-[#D2691E] hover:bg-[#E37E32] text-black cursor-pointer' : 'bg-[#2D241E] text-stone-600 cursor-not-allowed border border-[#D2691E]/10'
                  }`}
                >
                  Recruit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-stone-500 font-mono text-center">
        🛡️ In the <strong>Shadows in the City</strong> phase, standing units act as defenders — each deployment spends a soldier instead of raw Aalavan.
      </p>
    </div>
  );
}
