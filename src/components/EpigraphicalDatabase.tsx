/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import * as animeModule from 'animejs';

function getAnime(): any {
  let a: any = animeModule;
  while (a && typeof a !== 'function' && a.default) {
    a = a.default;
  }
  return a;
}

const anime: any = (...args: any[]) => {
  const instance = getAnime();
  if (typeof instance === 'function') {
    return instance(...args);
  }
  return null;
};

import { 
  BookOpen, Search, X, Sparkles, ScrollText, Landmark, 
  Compass, Award, ChevronRight, Copy, Check, Info, Shield, Layers
} from 'lucide-react';
import { EPIGRAPHICAL_DATABASE, EpigraphEntry, searchEpigraphs, getEpigraphById } from '../data/epigraphs';
import { audio } from '../utils/audio';

export interface EpigraphicalDatabaseProps {
  isOpen: boolean;
  onClose: () => void;
  initialTermId?: string | null;
}

const CATEGORIES = ['All', 'Administration', 'Architecture', 'Maritime & Navy', 'Society & Guilds', 'Culture & Arts', 'Economy'];

export default function EpigraphicalDatabase({ isOpen, onClose, initialTermId }: EpigraphicalDatabaseProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEntry, setSelectedEntry] = useState<EpigraphEntry>(() => {
    if (initialTermId) {
      const found = getEpigraphById(initialTermId);
      if (found) return found;
    }
    return EPIGRAPHICAL_DATABASE[0];
  });
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);

  // Sync initialTermId if changed from outside
  useEffect(() => {
    if (initialTermId) {
      const found = getEpigraphById(initialTermId);
      if (found) {
        setSelectedEntry(found);
      }
    }
  }, [initialTermId]);

  // Filtered epigraph entries
  const filteredEntries = useMemo(() => {
    return searchEpigraphs(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleSelectEntry = (entry: EpigraphEntry) => {
    audio.playYazh(400);
    setSelectedEntry(entry);
    setCopiedQuote(false);
  };

  const handleCopyQuote = (quoteText: string) => {
    navigator.clipboard.writeText(quoteText);
    setCopiedQuote(true);
    audio.playBell();
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      
      {/* Modal Container */}
      <div 
        id="epigraphical-database-modal"
        className="relative w-full max-w-5xl h-[88vh] bg-[#1C1713] rounded-2xl border-2 border-[#D2691E]/50 shadow-2xl flex flex-col overflow-hidden text-[#F4EFE6]"
      >
        
        {/* Header Bar */}
        <div className="bg-[#2D241E] px-6 py-4 border-b border-[#D2691E]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D2691E]/20 border border-[#D2691E]/50 flex items-center justify-center text-[#D4AF37]">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                <Landmark className="w-3 h-3 text-[#D2691E]" /> Chola Royal Kalvettu Records (கல்வெட்டுத் தரவுத்தளம்)
              </div>
              <h2 className="text-xl font-serif font-bold text-[#F4EFE6]">
                Imperial Epigraphical Database
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playDrum(false);
              onClose();
            }}
            className="p-2 rounded-lg bg-[#1C1713] hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer border border-[#D2691E]/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters & Search Bar */}
        <div className="bg-[#241D18] px-6 py-3 border-b border-[#D2691E]/20 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  audio.playYazh(320);
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#D2691E] text-black font-bold shadow'
                    : 'bg-[#1C1713] text-stone-300 hover:bg-[#3D3028] border border-[#D2691E]/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms, Tamil script, sources..."
              className="w-full bg-[#1C1713] border border-[#D2691E]/30 rounded-md pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

        </div>

        {/* Split Body: Left List Sideboard & Right Detail Panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left Sideboard Term List (4 Cols) */}
          <div className="md:col-span-4 bg-[#181310] border-r border-[#D2691E]/20 overflow-y-auto p-3 space-y-2">
            <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider px-2 pt-1 pb-2 flex justify-between items-center">
              <span>Recorded Inscriptions ({filteredEntries.length})</span>
              <span className="text-[#D4AF37]">Click to Inspect</span>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-stone-500">
                No matching historical inscriptions found.
              </div>
            ) : (
              filteredEntries.map(entry => {
                const isSelected = selectedEntry.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => handleSelectEntry(entry)}
                    className={`w-full text-left p-3 rounded-lg border transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2D241E] border-[#D4AF37] text-white shadow-lg'
                        : 'bg-[#211A15] border-[#D2691E]/20 text-stone-300 hover:bg-[#2A211B] hover:border-[#D2691E]/40'
                    }`}
                  >
                    <div className="text-2xl pt-0.5 select-none">{entry.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-serif font-bold text-sm truncate text-[#F4EFE6]">
                          {entry.term}
                        </span>
                        <span className="text-[10px] font-mono text-[#D4AF37] shrink-0">
                          {entry.tamilTerm}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-stone-400 truncate mt-0.5">
                        {entry.category} • {entry.historicalPeriod.split(' ')[0]}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Detailed Entry Panel (8 Cols) */}
          <div className="md:col-span-8 bg-[#1C1713] overflow-y-auto p-6 space-y-6">
            
            {/* Entry Hero Banner */}
            <div className="stone-slab-card p-5 rounded-xl space-y-3 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 pointer-events-none select-none">
                {selectedEntry.icon}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D2691E]/20 text-[#D4AF37] border border-[#D2691E]/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {selectedEntry.category}
                </span>
                <span className="text-xs font-mono text-stone-400">
                  Era: <strong className="text-stone-200">{selectedEntry.historicalPeriod}</strong>
                </span>
              </div>

              <div>
                <div className="text-2xl font-serif font-bold text-amber-200 flex items-baseline gap-3">
                  <span className="stone-etched-gold">{selectedEntry.term}</span>
                  <span className="text-lg text-[#D4AF37] font-sans font-normal stone-etched-text">
                    ({selectedEntry.tamilTerm} - <em className="text-stone-300 text-sm">{selectedEntry.transliteration}</em>)
                  </span>
                </div>
                <p className="text-xs font-mono text-stone-300 mt-1 leading-relaxed">
                  {selectedEntry.shortSummary}
                </p>
              </div>
            </div>

            {/* Historical Source & Inscription Provenance */}
            <div className="bg-[#241D18] p-4 rounded-lg border border-[#D2691E]/20 space-y-2">
              <span className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-[#D2691E]" /> Epigraphical Source Provenance
              </span>
              <div className="text-xs text-stone-300 font-mono stone-carved-box p-3 rounded">
                📍 {selectedEntry.inscriptionSource}
              </div>
            </div>

            {/* Detailed Historical Lore */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-stone-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" /> Detailed Historical Analysis
              </span>
              <div className="text-sm text-stone-200 font-sans leading-relaxed bg-[#241D18] p-4 rounded-lg border border-[#D2691E]/20 whitespace-pre-line">
                {selectedEntry.detailedLore.trim()}
              </div>
            </div>

            {/* Authentic Stone Inscription Quote */}
            {selectedEntry.originalInscriptionQuote && (
              <div className="stone-slab-card p-5 rounded-lg border-l-4 border-[#D4AF37] space-y-3 shadow-2xl">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#D4AF37] font-bold flex items-center gap-1.5 stone-etched-text">
                    <ScrollText className="w-4 h-4 text-[#D2691E]" /> Authentic Stone Inscription Text (கல்வெட்டு வாசகம்)
                  </span>
                  <button
                    onClick={() => handleCopyQuote(selectedEntry.originalInscriptionQuote!)}
                    className="text-stone-400 hover:text-[#D4AF37] transition flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    {copiedQuote ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedQuote ? 'Copied!' : 'Copy Quote'}
                  </button>
                </div>
                
                {/* Granitic Rock Carved Display Box */}
                <div className="stone-carved-box p-4 rounded-lg relative overflow-hidden">
                  <div className="absolute top-1 right-2 text-[10px] font-mono text-amber-500/30 uppercase tracking-widest select-none">
                    Granite Carved • 1010 CE
                  </div>
                  <div className="text-sm md:text-base text-amber-200 font-serif font-bold stone-etched-gold leading-relaxed tracking-wide">
                    "{selectedEntry.originalInscriptionQuote}"
                  </div>
                </div>
              </div>
            )}

            {/* Gameplay Connection */}
            <div className="bg-[#1D2520] p-4 rounded-lg border border-emerald-800/40 space-y-1.5">
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Chola Empire Game Mechanics
              </span>
              <p className="text-xs text-stone-200 font-mono">
                {selectedEntry.gameImpact}
              </p>
            </div>

            {/* Related Terms Pills */}
            {selectedEntry.relatedTerms && selectedEntry.relatedTerms.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#D2691E]/20">
                <span className="text-xs font-mono text-stone-400 font-bold block">
                  Related Kalvettu Terms:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.relatedTerms.map(relId => {
                    const rel = getEpigraphById(relId);
                    if (!rel) return null;
                    return (
                      <button
                        key={relId}
                        onClick={() => handleSelectEntry(rel)}
                        className="px-3 py-1 rounded bg-[#241D18] hover:bg-[#3D3028] border border-[#D2691E]/30 text-amber-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>{rel.icon}</span>
                        <span>{rel.term}</span>
                        <ChevronRight className="w-3 h-3 text-stone-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#2D241E] px-6 py-2.5 border-t border-[#D2691E]/30 flex justify-between items-center text-[10px] font-mono text-stone-400">
          <span>Saraswathi Mahal Archives • Chola Dynasty Epigraphy Project</span>
          <span className="text-[#D4AF37]">Click any highlighted Tamil term in game to open</span>
        </div>

      </div>

    </div>
  );
}

/**
 * Reusable inline component for rendering clickable terms throughout the app
 */
export function EpigraphTerm({ 
  termId, 
  children, 
  onOpen 
}: { 
  termId: string; 
  children?: React.ReactNode; 
  onOpen: (termId: string) => void;
}) {
  const entry = getEpigraphById(termId);
  const displayText = children || (entry ? entry.term : termId);

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        audio.playYazh(520);
        onOpen(termId);
      }}
      className="inline-flex items-center gap-0.5 text-[#D4AF37] underline decoration-amber-500/50 decoration-dashed hover:decoration-solid hover:text-amber-200 cursor-pointer transition px-1 py-0.5 rounded hover:bg-[#D2691E]/20 font-mono"
      title={`Inspect Epigraph: ${entry?.tamilTerm || displayText}`}
    >
      <ScrollText className="w-3 h-3 text-[#D2691E] inline" />
      <span>{displayText}</span>
    </span>
  );
}
