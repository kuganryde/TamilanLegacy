/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Army, UnitKind } from '../types';

export interface UnitMeta {
  name: string;
  tamil: string;
  icon: string;
  model: string;        // /models/*.glb
  desc: string;
  cost: { aalavan: number; aruvam: number };
  strength: number;     // contribution to city military strength
}

export const UNIT_META: Record<UnitKind, UnitMeta> = {
  warrior: {
    name: 'Warrior', tamil: 'Val Kondor', icon: '⚔️', model: '/models/sangam_warrior.glb',
    desc: 'Curved Val & round bronze shield — the backbone of the Chola line.',
    cost: { aalavan: 12, aruvam: 40 }, strength: 3,
  },
  spearman: {
    name: 'Spearman', tamil: 'Vel Kondor', icon: '🔱', model: '/models/sangam_spearman.glb',
    desc: 'Long Vel spear; holds formation and blunts a charge.',
    cost: { aalavan: 8, aruvam: 30 }, strength: 2,
  },
  archer: {
    name: 'Archer', tamil: 'Vil Kondor', icon: '🏹', model: '/models/sangam_archer.glb',
    desc: 'Bow & back quiver; softens the foe before they close.',
    cost: { aalavan: 10, aruvam: 35 }, strength: 2,
  },
  cavalry: {
    name: 'Cavalry', tamil: 'Kudirai Padai', icon: '🐎', model: '/models/sangam_cavalry.glb',
    desc: 'Lance-armed horsemen; shatter raiders in the open field.',
    cost: { aalavan: 25, aruvam: 90 }, strength: 6,
  },
};

export const UNIT_ORDER: UnitKind[] = ['warrior', 'spearman', 'archer', 'cavalry'];

export const INITIAL_ARMY: Army = { warrior: 0, spearman: 0, archer: 0, cavalry: 0 };

export const armyTotal = (a: Army): number => a.warrior + a.spearman + a.archer + a.cavalry;
export const armyStrength = (a: Army): number =>
  UNIT_ORDER.reduce((s, k) => s + a[k] * UNIT_META[k].strength, 0);
