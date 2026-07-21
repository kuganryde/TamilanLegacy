/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen, Shield, Anchor, Heart, Check, Sparkles } from 'lucide-react';
import { TechNode } from '../types';
import { audio } from '../utils/audio';

interface PalmLeafTechTreeProps {
  techNodes: TechNode[];
  onUnlockTech: (id: string) => void;
  arivu: number; // Knowledge points to spend
}

export default function PalmLeafTechTree({
  techNodes,
  onUnlockTech,
  arivu,
}: PalmLeafTechTreeProps) {

  const branches = [
    {
      id: 'siddha',
      name: 'Siddha & Medicine',
      tamilName: 'சித்த மருத்துவம்',
      color: 'border-emerald-600/30 text-emerald-800 bg-emerald-50/90',
      icon: Heart,
      desc: 'Boost agricultural yields, reduce fatigue, and support growth.'
    },
    {
      id: 'vastu',
      name: 'Vastu & Architecture',
      tamilName: 'வாஸ்து சாஸ்திரம்',
      color: 'border-amber-600/30 text-amber-800 bg-amber-50/90',
      icon: Shield,
      desc: 'Unlock stone quarries, giant reservoirs, and the grand temple.'
    },
    {
      id: 'kadal',
      name: 'Kadal Pira (Naval)',
      tamilName: 'கடற்படை தந்திரம்',
      color: 'border-cyan-600/30 text-cyan-800 bg-cyan-50/90',
      icon: Anchor,
      desc: 'Unlock Chola ships (Kappal), sea lanes, and global trade routes.'
    },
    {
      id: 'arts',
      name: 'Arts & Literature',
      tamilName: 'கலை மற்றும் இலக்கியம்',
      color: 'border-rose-600/30 text-rose-800 bg-rose-50/90',
      icon: BookOpen,
      desc: 'Train Bharatanatyam troupes, poet guilds, and cultural festivals.'
    }
  ];

  const handleNodeClick = (node: TechNode) => {
    if (node.unlocked) return;
    
    // Check prerequisite
    if (node.unlockedBy) {
      const prereq = techNodes.find(n => n.id === node.unlockedBy);
      if (!prereq || !prereq.unlocked) {
        audio.playDrum(false); // warning thud
        return;
      }
    }

    if (arivu >= node.cost) {
      audio.playYazh(523.25); // high pitch pluck (C5) for success
      onUnlockTech(node.id);
    } else {
      audio.playDrum(true); // low pitch fail thud
    }
  };

  return (
    <div id="palm-leaf-tech-section" className="w-full bg-[#241D18] rounded-xl p-6 border-2 border-[#D2691E]/30 shadow-xl overflow-hidden">
      
      {/* Scroll Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-[#D2691E]/20 pb-4">
        <div>
          <span className="text-xs font-mono text-[#D2691E] uppercase tracking-widest">Knowledge Manuscript</span>
          <h2 className="text-2xl font-serif text-[#F4EFE6] font-bold flex items-center gap-2">
            Olai Chuvadi <span className="text-[#D2691E] font-normal">(ஓலைச்சுவடி)</span>
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Pluck ancient wisdom from the palm leaves to expand the Chola Empire.
          </p>
        </div>
        <div className="mt-3 md:mt-0 flex items-center gap-3 bg-[#2D241E] px-4 py-2 rounded-lg border border-[#D2691E]/30">
          <BookOpen className="w-5 h-5 text-[#4A90E2]" />
          <div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">Available Arivu</div>
            <div className="text-lg font-bold font-mono text-[#4A90E2]">{arivu} <span className="text-xs text-stone-400 font-normal">pts</span></div>
          </div>
        </div>
      </div>

      {/* The Scroll Container representing multiple palm leaves tied with cord */}
      <div className="space-y-6 overflow-x-auto pb-4 custom-scrollbar">
        
        {branches.map(branch => {
          const branchNodes = techNodes.filter(n => n.branch === branch.id);
          const BranchIcon = branch.icon;

          return (
            <div
              key={branch.id}
              id={`leaf-branch-${branch.id}`}
              className="relative rounded-lg p-1 bg-[#2D241E]/40 border border-[#D2691E]/20 shadow-inner flex flex-col md:flex-row items-stretch"
            >
              {/* Wooden Left Cap of the Palm Leaf */}
              <div className="md:w-52 p-4 rounded-t-lg md:rounded-t-none md:rounded-l-lg bg-gradient-to-br from-[#1C1713] via-[#2D241E] to-[#120F0D] text-[#F4EFE6] flex flex-col justify-between border-r border-[#D2691E]/20">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 rounded bg-[#D2691E]/10 text-[#D2691E] border border-[#D2691E]/30">
                      <BranchIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-wide">
                      {branch.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#D2691E] font-mono font-bold">
                    {branch.tamilName}
                  </p>
                </div>
                <p className="text-[10px] text-stone-400 mt-3 md:mt-0 italic leading-normal">
                  {branch.desc}
                </p>
              </div>

              {/* The Palm Leaf segment where nodes are engraved */}
              <div className="flex-1 p-4 bg-gradient-to-r from-[#F5DEB3] via-[#EEDC82]/85 to-[#F5DEB3] text-[#4B3621] rounded-b-lg md:rounded-b-none md:rounded-r-lg flex flex-wrap gap-4 items-center">
                {branchNodes.map(node => {
                  const isPrereqMet = !node.unlockedBy || 
                    (techNodes.find(n => n.id === node.unlockedBy)?.unlocked);
                  
                  return (
                    <button
                      key={node.id}
                      id={`tech-node-${node.id}`}
                      disabled={node.unlocked}
                      onClick={() => handleNodeClick(node)}
                      className={`relative flex flex-col text-left p-3 rounded border text-xs min-w-[140px] max-w-[190px] flex-1 cursor-pointer transition-all duration-300 ${
                        node.unlocked
                          ? 'border-[#8B4513] bg-emerald-100 text-emerald-950 shadow-xs ring-1 ring-emerald-500/20'
                          : isPrereqMet
                          ? arivu >= node.cost
                            ? 'border-[#8B4513]/40 bg-[#EEDC82] hover:bg-[#F4E4A0] hover:border-[#8B4513] hover:-translate-y-0.5 shadow-sm active:translate-y-0 text-[#4B3621]'
                            : 'border-stone-400/40 bg-[#D4C3A3]/75 opacity-80 cursor-not-allowed text-[#4B3621]'
                          : 'border-stone-400/30 bg-[#C8B38E]/50 opacity-50 cursor-not-allowed text-[#4B3621]/60'
                      }`}
                    >
                      {/* Top bar */}
                      <div className="flex justify-between items-start mb-1 gap-1">
                        <span className="font-serif font-bold leading-tight">
                          {node.name}
                        </span>
                        {node.unlocked ? (
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-700 text-white">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <span className="font-mono text-[9px] font-bold bg-[#1C1713]/10 text-[#4B3621] px-1 py-0.5 rounded border border-[#8B4513]/20">
                            {node.cost}
                          </span>
                        )}
                      </div>

                      {/* Tamil script */}
                      <span className="text-[9px] font-mono font-bold text-[#8B4513] mb-1">
                        {node.tamilName}
                      </span>

                      {/* Info / Effect */}
                      <span className="text-[10px] leading-snug text-[#4B3621]/90">
                        {node.unlocked ? (
                          <span className="text-emerald-800 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#D2691E] animate-spin" /> Unlocked
                          </span>
                        ) : (
                          node.effectDescription
                        )}
                      </span>

                      {/* Prerequisite label if locked */}
                      {!node.unlocked && node.unlockedBy && (
                        <span className="text-[8px] mt-1.5 text-[#8B4513]/60 border-t border-dashed border-[#8B4513]/20 pt-1">
                          Prereq: {techNodes.find(n => n.id === node.unlockedBy)?.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
