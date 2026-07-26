/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as animeModule from 'animejs';
import { X, Sparkles, BookOpen, Crown, CloudRain, Award } from 'lucide-react';

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

export interface ToastItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  type?: 'tech' | 'campaign' | 'monsoon' | 'achievement';
  duration?: number; // ms
}

interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export default function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  return (
    <div 
      id="toast-notification-container" 
      className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-2"
    >
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

interface ToastCardProps {
  key?: string;
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isClosingRef = useRef<boolean>(false);

  // Slide-in from right animation on mount
  useEffect(() => {
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        translateX: [320, 0],
        opacity: [0, 1],
        scale: [0.92, 1],
        duration: 550,
        easing: 'easeOutBack',
      });
    }

    // Auto dismiss timer
    const autoDismissTimer = setTimeout(() => {
      handleClose();
    }, toast.duration || 4500);

    return () => clearTimeout(autoDismissTimer);
  }, []);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        translateX: [0, 340],
        opacity: [1, 0],
        scale: [1, 0.85],
        duration: 400,
        easing: 'easeInQuad',
        complete: () => {
          onDismiss(toast.id);
        }
      });
    } else {
      onDismiss(toast.id);
    }
  };

  // Type styling
  const getTypeStyles = () => {
    switch (toast.type) {
      case 'tech':
        return {
          border: 'border-[#4A90E2]/50',
          bg: 'bg-[#1a2332]',
          badge: 'bg-[#4A90E2]/20 text-[#4A90E2] border-[#4A90E2]/30',
          glow: 'shadow-[0_0_15px_rgba(74,144,226,0.25)]',
          defaultIcon: '📜'
        };
      case 'campaign':
        return {
          border: 'border-[#D4AF37]/60',
          bg: 'bg-[#282019]',
          badge: 'bg-[#D4AF37]/20 text-[#FFD700] border-[#D4AF37]/40',
          glow: 'shadow-[0_0_20px_rgba(212,175,55,0.3)]',
          defaultIcon: '🏛️'
        };
      case 'monsoon':
        return {
          border: 'border-sky-500/50',
          bg: 'bg-[#121c2b]',
          badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
          glow: 'shadow-[0_0_15px_rgba(56,189,248,0.2)]',
          defaultIcon: '🌧️'
        };
      case 'achievement':
      default:
        return {
          border: 'border-[#D2691E]/50',
          bg: 'bg-[#1C1713]',
          badge: 'bg-[#D2691E]/20 text-[#D2691E] border-[#D2691E]/30',
          glow: 'shadow-[0_0_15px_rgba(210,105,30,0.25)]',
          defaultIcon: '✨'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      ref={cardRef}
      className={`pointer-events-auto relative p-4 rounded-xl border ${styles.border} ${styles.bg} ${styles.glow} backdrop-blur-md text-[#F4EFE6] shadow-2xl transition-all duration-200 overflow-hidden group`}
    >
      {/* Decorative Gold Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#D4AF37]" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#D4AF37]" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#D4AF37]" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#D4AF37]" />

      <div className="flex items-start gap-3">
        {/* Toast Icon Frame */}
        <div className="w-10 h-10 rounded-lg bg-[#241D18] border border-[#D2691E]/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
          {toast.icon || styles.defaultIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border font-bold ${styles.badge}`}>
              {toast.type || 'imperial update'}
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Chola Empire</span>
          </div>

          <h4 className="font-serif font-bold text-sm text-[#F4EFE6] truncate leading-snug">
            {toast.title}
          </h4>

          <p className="text-xs text-stone-300 leading-tight mt-1 line-clamp-2">
            {toast.description}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="text-stone-400 hover:text-stone-100 p-1 rounded-md hover:bg-stone-800/60 transition cursor-pointer shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress timer bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800">
        <div 
          className="h-full bg-[#D4AF37] animate-shrink-width"
          style={{ animationDuration: `${toast.duration || 4500}ms` }}
        />
      </div>
    </div>
  );
}
