/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, ToastMsg, ToastKind } from '../utils/toast';

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-100',
  info: 'border-[#4A90E2]/40 bg-[#16202e]/90 text-sky-100',
  gold: 'border-[#D4AF37]/50 bg-[#2a2411]/90 text-amber-100',
  warn: 'border-amber-500/40 bg-[#2b2410]/90 text-amber-100',
  danger: 'border-red-500/40 bg-[#2a1512]/90 text-red-100',
};

const DURATION = 3400;

export default function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(() => {
    return toast.subscribe((t) => {
      setItems((prev) => [...prev.slice(-4), t]); // keep last 5
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, DURATION);
    });
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 items-end pointer-events-none w-[320px]">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className={`pointer-events-auto w-full rounded-lg border px-3 py-2.5 shadow-xl backdrop-blur-sm flex items-start gap-2.5 ${KIND_STYLES[t.kind]}`}
          >
            {t.icon && <span className="text-lg leading-none mt-0.5 select-none">{t.icon}</span>}
            <span className="text-[12px] leading-snug font-medium">{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
