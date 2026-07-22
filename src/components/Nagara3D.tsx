/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GridCell } from '../types';

// ---------------------------------------------------------------------------
// Real-time 3D isometric view of the Nagara (city) grid. Renders the app's
// 8x8 GridCell[] as modelled Chola terrain + buildings with sun/shadows and an
// orbit/zoom camera. Purely presentational: it reads grid state and reports
// tile clicks back up; all economy/zoning logic stays in App/NagaraGrid.
// ---------------------------------------------------------------------------

const GRID = 8;
const worldX = (col: number) => col - (GRID - 1) / 2;
const worldZ = (row: number) => row - (GRID - 1) / 2;

const COL = {
  grass: 0x7ba449, grassAlt: 0x6f9a40,
  wetPaddy: 0x4f7d2a, dryPaddy: 0xc2a63c,
  earth: 0x9c8552, stone: 0x8a8272, rock: 0x6e675e,
  water: 0x2f77a0,
  wall: 0xefe0c0, roof: 0xa8432f, terracotta: 0xb5533a, terracottaDark: 0x8f3d2a,
  gold: 0xd4af37, goldBright: 0xf1d06a, worker: 0xd2691e, granite: 0x8b8178, thatch: 0xc79a54,
};

const mat = (color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.94, metalness: 0.02, ...extra });

function box(w: number, h: number, d: number, color: number, y: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.y = y + h / 2;
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function gopuram(scale: number): THREE.Group {
  const g = new THREE.Group();
  const tiers: [number, number][] = [[0.8, 0.32], [0.66, 0.28], [0.52, 0.24], [0.4, 0.2], [0.3, 0.16]];
  let y = 0;
  for (let i = 0; i < tiers.length; i++) {
    const [w, h] = tiers[i];
    g.add(box(w * scale, h * scale, w * scale, i === 0 ? COL.terracotta : COL.roof, y));
    y += h * scale;
  }
  g.add(box(0.28 * scale, 0.09 * scale, 0.15 * scale, COL.terracottaDark, y));
  y += 0.09 * scale;
  for (const dx of [-0.08, 0, 0.08]) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.045 * scale, 0.16 * scale, 8),
      mat(COL.goldBright, { emissive: COL.gold, emissiveIntensity: 0.35 }));
    f.position.set(dx * scale, y + 0.08 * scale, 0);
    f.castShadow = true;
    g.add(f);
  }
  return g;
}

function workerMarkers(n: number): THREE.Group {
  const g = new THREE.Group();
  const shown = Math.min(n, 5);
  for (let i = 0; i < shown; i++) {
    const a = (i / Math.max(1, shown)) * Math.PI * 2;
    const wk = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 6), mat(COL.worker));
    body.position.y = 0.08; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), mat(0xe8c9a0));
    head.position.y = 0.19; head.castShadow = true;
    wk.add(body); wk.add(head);
    wk.position.set(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34);
    g.add(wk);
  }
  return g;
}

// Build the on-tile structure for a cell (empty for river/empty land).
function buildStructure(cell: GridCell): THREE.Group {
  const g = new THREE.Group();
  const lvl = Math.max(1, cell.level);
  switch (cell.type) {
    case 'ur': {
      const c = cell.hasWater ? COL.wetPaddy : COL.dryPaddy;
      for (let i = -1; i <= 1; i++) { const f = box(0.8, 0.06, 0.16, c, 0.01); f.position.z = i * 0.26; g.add(f); }
      break;
    }
    case 'nagar': {
      const h = 0.28 + (lvl - 1) * 0.18;
      g.add(box(0.6, h, 0.6, COL.wall, 0));
      g.add(box(0.72, 0.06, 0.72, COL.roof, h));
      const awning = box(0.72, 0.02, 0.24, COL.gold, h - 0.04); awning.position.z = 0.34; g.add(awning);
      if (lvl >= 3) { g.add(box(0.4, 0.22, 0.4, COL.wall, h + 0.06)); g.add(box(0.5, 0.05, 0.5, COL.roof, h + 0.28)); }
      break;
    }
    case 'kovil':
      g.add(gopuram(0.85 + (lvl - 1) * 0.22));
      break;
    case 'eri': {
      g.add(box(0.9, 0.12, 0.9, COL.stone, 0));
      const w = box(0.68, 0.05, 0.68, COL.water, 0.09);
      (w.material as THREE.MeshStandardMaterial).roughness = 0.25;
      (w.material as THREE.MeshStandardMaterial).metalness = 0.15;
      g.add(w);
      break;
    }
    case 'quarry': {
      for (const [dx, dz, s] of [[-0.2, -0.15, 0.26], [0.18, 0.1, 0.32], [0.05, -0.22, 0.2]] as const) {
        const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat(COL.granite));
        rock.position.set(dx, s * 0.55, dz); rock.rotation.set(dx, dz, s); rock.castShadow = true; rock.receiveShadow = true;
        g.add(rock);
      }
      break;
    }
    default: break; // empty, river
  }
  if (cell.assignedWorkers > 0 && cell.type !== 'river' && cell.type !== 'empty') {
    g.add(workerMarkers(cell.assignedWorkers));
  }
  return g;
}

function tileColor(cell: GridCell): number {
  switch (cell.type) {
    case 'river': return COL.water;
    case 'ur': return cell.hasWater ? 0x5b7d34 : 0x93863f;
    case 'quarry': return COL.rock;
    case 'nagar':
    case 'kovil':
    case 'eri': return COL.earth;
    default: return (cell.row + cell.col) % 2 === 0 ? COL.grass : COL.grassAlt;
  }
}

const sig = (c: GridCell) => `${c.type}|${c.level}|${c.hasWater ? 1 : 0}|${c.assignedWorkers}`;

interface Props {
  grid: GridCell[];
  selectedId: string | null;
  onSelect: (cell: GridCell) => void;
}

export default function Nagara3D({ grid, selectedId, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef(grid);
  const selRef = useRef(selectedId);
  const onSelRef = useRef(onSelect);
  gridRef.current = grid; selRef.current = selectedId; onSelRef.current = onSelect;

  useEffect(() => {
    const wrap = wrapRef.current!;
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;cursor:pointer;touch-action:none';
    wrap.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
    camera.position.set(9, 10, 9);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minPolarAngle = 0.5;
    controls.maxPolarAngle = 1.15;
    controls.minZoom = 0.6;
    controls.maxZoom = 2.6;

    scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x4a5330, 0.75));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.25);
    sun.position.set(6, 10, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -7; sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7;
    sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    const base = new THREE.Mesh(new THREE.BoxGeometry(GRID + 1, 0.2, GRID + 1), mat(0x40361f));
    base.position.y = -0.16; base.receiveShadow = true; scene.add(base);

    // Per-cell records.
    interface Rec { tile: THREE.Mesh; group: THREE.Group; sig: string; water: boolean }
    const recs = new Map<string, Rec>();
    const tileMeshes: THREE.Mesh[] = [];

    const disposeGroup = (g: THREE.Object3D) => {
      g.traverse((o) => {
        if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); }
      });
    };

    const buildCell = (cell: GridCell) => {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.12, 0.96), mat(tileColor(cell),
        cell.type === 'river' ? { roughness: 0.2, metalness: 0.15 } : {}));
      tile.position.set(worldX(cell.col), -0.06, worldZ(cell.row));
      tile.receiveShadow = true;
      tile.userData.cellId = cell.id;
      scene.add(tile);
      tileMeshes.push(tile);

      const group = buildStructure(cell);
      group.position.set(worldX(cell.col), 0, worldZ(cell.row));
      scene.add(group);

      recs.set(cell.id, { tile, group, sig: sig(cell), water: cell.type === 'river' });
    };

    const reconcile = (g: GridCell[]) => {
      for (const cell of g) {
        const rec = recs.get(cell.id);
        if (!rec) { buildCell(cell); continue; }
        if (rec.sig === sig(cell)) continue;
        // rebuild this cell
        scene.remove(rec.tile); rec.tile.geometry.dispose(); (rec.tile.material as THREE.Material).dispose();
        const ti = tileMeshes.indexOf(rec.tile); if (ti >= 0) tileMeshes.splice(ti, 1);
        scene.remove(rec.group); disposeGroup(rec.group);
        recs.delete(cell.id);
        buildCell(cell);
      }
    };
    reconcile(grid);

    // Selection ring + hover ring.
    const ringGeo = new THREE.TorusGeometry(0.62, 0.05, 8, 24);
    const selRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xd2691e, transparent: true, opacity: 0.9 }));
    selRing.rotation.x = -Math.PI / 2; selRing.visible = false; scene.add(selRing);
    const hoverTile = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, 1.0),
      new THREE.MeshBasicMaterial({ color: 0xf1d06a, transparent: true, opacity: 0.18 }));
    hoverTile.visible = false; scene.add(hoverTile);

    // Interaction.
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hoverId: string | null = null;
    let down: { x: number; y: number } | null = null;

    const pick = (cx: number, cy: number): string | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((cx - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((cy - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(tileMeshes, false)[0];
      return hit ? (hit.object.userData.cellId as string) : null;
    };
    const onMove = (e: PointerEvent) => { hoverId = pick(e.clientX, e.clientY); };
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) {
        const id = pick(e.clientX, e.clientY);
        if (id) { const cell = gridRef.current.find((c) => c.id === id); if (cell) onSelRef.current(cell); }
      }
      down = null;
    };
    const onLeave = () => { hoverId = null; };
    const el = renderer.domElement;
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onLeave);

    const resize = () => {
      const w = wrap.clientWidth || 640;
      const h = wrap.clientHeight || 460;
      renderer.setSize(w, h, false);
      const viewSize = 9.2;
      const aspect = w / h;
      camera.left = -viewSize * aspect / 2; camera.right = viewSize * aspect / 2;
      camera.top = viewSize / 2; camera.bottom = -viewSize / 2;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    let raf = 0;
    const clock = new THREE.Clock();
    let lastGrid = grid;
    const posOf = (id: string | null) => {
      if (!id) return null;
      const c = gridRef.current.find((x) => x.id === id);
      return c ? new THREE.Vector3(worldX(c.col), 0, worldZ(c.row)) : null;
    };

    const tick = () => {
      const t = clock.getElapsedTime();
      if (gridRef.current !== lastGrid) { reconcile(gridRef.current); lastGrid = gridRef.current; }

      // water shimmer on river + eri tiles
      for (const rec of recs.values()) {
        if (!rec.water) continue;
        const m = rec.tile.material as THREE.MeshStandardMaterial;
        const s = 0.5 + 0.5 * Math.sin(t * 1.5 + rec.tile.position.x * 0.7 + rec.tile.position.z);
        m.emissive.setRGB(0.02, 0.08 + 0.05 * s, 0.13 + 0.05 * s);
      }

      // selection ring
      const selPos = posOf(selRef.current);
      if (selPos) { selRing.visible = true; selRing.position.set(selPos.x, 0.06, selPos.z);
        (selRing.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.4 * Math.sin(t * 5); }
      else selRing.visible = false;

      // hover tile
      const hovPos = posOf(hoverId);
      if (hovPos && hoverId !== selRef.current) { hoverTile.visible = true; hoverTile.position.set(hovPos.x, 0.02, hovPos.z); }
      else hoverTile.visible = false;

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onLeave);
      controls.dispose();
      for (const rec of recs.values()) { disposeGroup(rec.tile); disposeGroup(rec.group); }
      ringGeo.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={wrapRef} className="w-full h-full" />;
}
