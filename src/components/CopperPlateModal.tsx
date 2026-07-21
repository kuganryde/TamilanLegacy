/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CopperPlateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tamilTitle?: string;
  children: React.ReactNode;
}

export default function CopperPlateModal({
  isOpen,
  onClose,
  title,
  tamilTitle,
  children,
}: CopperPlateModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="sasana-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          {/* Backdrop dismiss */}
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div
            id="sasana-plate"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xl overflow-hidden rounded-xl border-2 border-[#D2691E]/50 bg-[#241D18] p-1 shadow-2xl"
          >
            {/* Ancient Copper Plate Etching Effect (Double Borders) */}
            <div className="rounded-lg border-2 border-dashed border-[#D2691E]/30 p-6 md:p-8">
              
              {/* Header Decorative Corner Ornaments */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#D2691E]/30" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#D2691E]/30" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#D2691E]/30" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#D2691E]/30" />

              {/* Close Button */}
              <button
                id="sasana-close-btn"
                onClick={onClose}
                className="absolute top-4 right-4 text-[#D2691E]/80 hover:text-[#E37E32] p-1 rounded-full hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Royal Seal Emblem */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#D2691E]/10 border border-[#D2691E]/30 text-[#D2691E]">
                  <Award className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              {/* Titles */}
              <div className="text-center mb-6">
                {tamilTitle && (
                  <p className="text-xs font-mono uppercase tracking-widest text-[#D2691E] mb-1">
                    {tamilTitle}
                  </p>
                )}
                <h3 className="text-xl font-serif font-semibold text-[#F4EFE6] tracking-wide">
                  {title}
                </h3>
                <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#D2691E]/40 to-transparent mx-auto mt-2" />
              </div>

              {/* Content Panel */}
              <div className="text-stone-300 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {children}
              </div>

              {/* Bottom Actions */}
              <div className="mt-8 flex justify-end">
                <button
                  id="sasana-confirm-btn"
                  onClick={onClose}
                  className="px-5 py-2 rounded border border-[#D2691E]/40 bg-[#D2691E]/10 hover:bg-[#D2691E]/20 text-[#D2691E] text-xs font-bold tracking-wider uppercase transition active:scale-95 cursor-pointer"
                >
                  Accept Proclamation
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
