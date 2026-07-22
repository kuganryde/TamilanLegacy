/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Tiny global toast bus. Any module can `toast.push(...)` to surface a
// micro-interaction / progress message; the <Toaster/> component subscribes
// and renders the animated stack. Avoids prop-drilling a callback everywhere.

export type ToastKind = 'success' | 'info' | 'warn' | 'gold' | 'danger';

export interface ToastMsg {
  id: number;
  msg: string;
  icon?: string;
  kind: ToastKind;
}

type Listener = (t: ToastMsg) => void;

let seq = 0;
const listeners = new Set<Listener>();

export const toast = {
  push(msg: string, opts: { icon?: string; kind?: ToastKind } = {}) {
    const t: ToastMsg = { id: ++seq, msg, icon: opts.icon, kind: opts.kind ?? 'info' };
    listeners.forEach((l) => l(t));
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};
