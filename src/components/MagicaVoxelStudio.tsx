/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Box, RotateCw, ZoomIn, ZoomOut, Download, Upload, 
  Sparkles, Layers, Palette, Eye, Trash2, Copy, Check, 
  Compass, Play, Wand2, Hammer, Shield
} from 'lucide-react';
import { audio } from '../utils/audio';

// MagicaVoxel Color Palette - 16 Core Chola Heritage Voxel Colors
export const CHOLA_VOXEL_PALETTE = [
  { id: 1, name: 'Granite Dark', hex: '#292524' },
  { id: 2, name: 'Granite Medium', hex: '#57534E' },
  { id: 3, name: 'Granite Light', hex: '#A8A29E' },
  { id: 4, name: 'Temple Gold', hex: '#FFD700' },
  { id: 5, name: 'Amber Bronze', hex: '#D97706' },
  { id: 6, name: 'Terracotta Red', hex: '#C2410C' },
  { id: 7, name: 'Chola Red', hex: '#DC2626' },
  { id: 8, name: 'Crimson Rose', hex: '#881337' },
  { id: 9, name: 'Royal Teak', hex: '#78350F' },
  { id: 10, name: 'Paddy Green', hex: '#10B981' },
  { id: 11, name: 'Deep Forest', hex: '#047857' },
  { id: 12, name: 'Ocean Cyan', hex: '#0284C7' },
  { id: 13, name: 'Navy Blue', hex: '#0F172A' },
  { id: 14, name: 'Sky White', hex: '#F4EFE6' },
  { id: 15, name: 'Shadow Black', hex: '#120F0D' },
  { id: 16, name: 'Brass Yellow', hex: '#FBBF24' },
];

export interface VoxelPoint {
  x: number; // 0..15
  y: number; // 0..15
  z: number; // 0..15
  colorIndex: number; // 1..16
}

export interface MagicaVoxelStudioProps {
  onExportToCityGrid?: (voxels: VoxelPoint[]) => void;
}

export default function MagicaVoxelStudio({ onExportToCityGrid }: MagicaVoxelStudioProps) {
  // Grid size 16x16x16
  const GRID_SIZE = 16;

  const [voxels, setVoxels] = useState<VoxelPoint[]>(() => generatePresetVoxelModel('temple'));
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(4); // Default Temple Gold
  const [activeTool, setActiveTool] = useState<'add' | 'erase' | 'select'>('add');
  const [activeLayerZ, setActiveLayerZ] = useState<number>(0);

  // Camera Controls
  const [rotationAngle, setRotationAngle] = useState<number>(45); // Degrees around Y
  const [pitchAngle, setPitchAngle] = useState<number>(30); // Pitch angle
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Generate Procedural MagicaVoxel Preset Models
  function generatePresetVoxelModel(preset: 'temple' | 'ship' | 'elephant' | 'statue'): VoxelPoint[] {
    const points: VoxelPoint[] = [];

    if (preset === 'temple') {
      // Brihadeeswarar Vimana Pyramid (Base 12x12 -> Top 2x2)
      for (let z = 0; z < 12; z++) {
        const size = Math.max(2, 12 - z);
        const start = Math.floor((16 - size) / 2);
        const color = z === 11 ? 4 : z % 2 === 0 ? 5 : 2; // Gold cap, Granite/Amber body

        for (let x = start; x < start + size; x++) {
          for (let y = start; y < start + size; y++) {
            // Hollow inside except walls
            if (x === start || x === start + size - 1 || y === start || y === start + size - 1 || z > 9) {
              points.push({ x, y, z, colorIndex: color });
            }
          }
        }
      }
      // Top Kalasam Spire
      points.push({ x: 7, y: 7, z: 12, colorIndex: 4 });
      points.push({ x: 8, y: 7, z: 12, colorIndex: 4 });
      points.push({ x: 7, y: 8, z: 12, colorIndex: 4 });
      points.push({ x: 8, y: 8, z: 12, colorIndex: 4 });
      points.push({ x: 7, y: 7, z: 13, colorIndex: 16 });
    } else if (preset === 'ship') {
      // Chola Kadal Pira Galleon
      // Hull
      for (let y = 2; y <= 13; y++) {
        const width = y <= 3 || y >= 12 ? 4 : 6;
        const startX = Math.floor((16 - width) / 2);
        for (let x = startX; x < startX + width; x++) {
          points.push({ x, y, z: 1, colorIndex: 9 }); // Teak bottom
          points.push({ x, y, z: 2, colorIndex: 9 }); // Teak sides
        }
      }
      // Mast
      for (let z = 3; z <= 13; z++) {
        points.push({ x: 7, y: 8, z, colorIndex: 14 });
      }
      // Sail
      for (let z = 6; z <= 11; z++) {
        for (let x = 4; x <= 11; x++) {
          points.push({ x, y: 8, z, colorIndex: 7 }); // Red & Gold Sail
        }
      }
    } else if (preset === 'elephant') {
      // War Elephant Body
      for (let x = 5; x <= 10; x++) {
        for (let y = 4; y <= 11; y++) {
          for (let z = 3; z <= 8; z++) {
            points.push({ x, y, z, colorIndex: 2 });
          }
        }
      }
      // Legs
      const legX = [5, 10];
      const legY = [4, 11];
      legX.forEach(lx => {
        legY.forEach(ly => {
          for (let z = 0; z < 3; z++) {
            points.push({ x: lx, y: ly, z, colorIndex: 1 });
          }
        });
      });
      // Head & Tusks
      for (let x = 6; x <= 9; x++) {
        for (let y = 12; y <= 14; y++) {
          for (let z = 6; z <= 9; z++) {
            points.push({ x, y, z, colorIndex: 2 });
          }
        }
      }
      // Tusks
      points.push({ x: 5, y: 14, z: 5, colorIndex: 14 });
      points.push({ x: 10, y: 14, z: 5, colorIndex: 14 });
      // Howdah Seat
      for (let x = 6; x <= 9; x++) {
        for (let y = 6; y <= 9; y++) {
          points.push({ x, y, z: 9, colorIndex: 7 });
          points.push({ x, y, z: 10, colorIndex: 4 });
        }
      }
    } else if (preset === 'statue') {
      // King / Deity Voxel Idol
      for (let z = 0; z <= 2; z++) {
        for (let x = 5; x <= 10; x++) {
          for (let y = 5; y <= 10; y++) {
            points.push({ x, y, z, colorIndex: 5 }); // Bronze Base
          }
        }
      }
      for (let z = 3; z <= 9; z++) {
        points.push({ x: 7, y: 7, z, colorIndex: 5 });
        points.push({ x: 8, y: 7, z, colorIndex: 5 });
        points.push({ x: 7, y: 8, z, colorIndex: 5 });
        points.push({ x: 8, y: 8, z, colorIndex: 5 });
      }
      // Crown
      for (let x = 6; x <= 9; x++) {
        for (let y = 6; y <= 9; y++) {
          points.push({ x, y, z: 10, colorIndex: 4 });
          points.push({ x, y, z: 11, colorIndex: 4 });
        }
      }
      points.push({ x: 7, y: 7, z: 12, colorIndex: 7 });
      points.push({ x: 8, y: 8, z: 12, colorIndex: 7 });
    }

    return points;
  }

  // Handle preset model click
  const handleSelectPreset = (preset: 'temple' | 'ship' | 'elephant' | 'statue') => {
    audio.playBell();
    const newVoxels = generatePresetVoxelModel(preset);
    setVoxels(newVoxels);

    if (containerRef.current) {
      anime({
        targets: containerRef.current,
        scale: [0.8, 1],
        rotateY: [rotationAngle - 45, rotationAngle],
        duration: 600,
        easing: 'easeOutElastic(1, .6)'
      });
    }
  };

  // Add or Erase Voxel on 2D plane / 3D Ray click
  const handleVoxelGridClick = (x: number, y: number) => {
    const existingIndex = voxels.findIndex(v => v.x === x && v.y === y && v.z === activeLayerZ);

    if (activeTool === 'add') {
      audio.playYazh(300 + activeLayerZ * 20);
      if (existingIndex >= 0) {
        // Update color
        setVoxels(prev => {
          const next = [...prev];
          next[existingIndex] = { x, y, z: activeLayerZ, colorIndex: selectedColorIdx };
          return next;
        });
      } else {
        // Insert new voxel
        setVoxels(prev => [...prev, { x, y, z: activeLayerZ, colorIndex: selectedColorIdx }]);
      }
    } else if (activeTool === 'erase') {
      audio.playDrum(false);
      if (existingIndex >= 0) {
        setVoxels(prev => prev.filter((_, idx) => idx !== existingIndex));
      }
    }
  };

  const handleClearAll = () => {
    if (confirm("Clear current MagicaVoxel canvas?")) {
      audio.playDrum(true);
      setVoxels([]);
    }
  };

  // MagicaVoxel JSON Schema Output
  const jsonOutput = useMemo(() => {
    const voxelsSchema = voxels.map(v => ({
      x: v.x,
      y: v.y,
      z: v.z,
      colorIndex: v.colorIndex,
      hex: CHOLA_VOXEL_PALETTE.find(p => p.id === v.colorIndex)?.hex || '#FFFFFF'
    }));

    return JSON.stringify({
      version: "1.0",
      app: "MagicaVoxel-MCP Chola Studio",
      voxelsCount: voxels.length,
      palette: CHOLA_VOXEL_PALETTE,
      voxels: voxelsSchema
    }, null, 2);
  }, [voxels]);

  // Copy MagicaVoxel JSON schema
  const handleCopyCode = () => {
    navigator.clipboard.writeText(jsonOutput);
    setCopiedCode(true);
    audio.playBell();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Download MagicaVoxel JSON / Vox file
  const handleDownloadVox = () => {
    audio.playBell();
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chola_magicavoxel_model_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sort Voxels Back-to-Front for 3D Isometric View
  const sortedIsoVoxels = useMemo(() => {
    const rad = (rotationAngle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return voxels.map(v => {
      // Centered 0,0
      const cx = v.x - GRID_SIZE / 2;
      const cy = v.y - GRID_SIZE / 2;

      // Rotated X & Y
      const rx = cx * cos - cy * sin;
      const ry = cx * sin + cy * cos;

      // Depth metric for sorting back-to-front
      const depth = ry * 10 + v.z * 5 + rx;

      return {
        ...v,
        rx,
        ry,
        depth
      };
    }).sort((a, b) => a.depth - b.depth);
  }, [voxels, rotationAngle]);

  const TILE_W = 28;
  const TILE_H = 14;
  const ORIGIN_X = 260;
  const ORIGIN_Y = 220;

  return (
    <div id="magicavoxel-studio-container" className="bg-[#1C1713] p-6 rounded-xl border-2 border-[#D2691E]/30 shadow-2xl space-y-6">
      
      {/* Title & MCP Server Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D2691E]/20 pb-4">
        <div>
          <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-[#D2691E]" /> MagicaVoxel MCP Server Studio (3D Voxel Engine)
          </span>
          <h2 className="text-xl font-serif font-bold text-[#F4EFE6] flex items-center gap-2">
            Chola Voxel Sculptor <span className="text-xs font-mono text-[#D2691E]">(3D வோக்சல் சிற்பக்கூடம்)</span>
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadVox}
            className="px-3 py-1.5 rounded bg-[#2D241E] hover:bg-[#3D3028] text-[#D4AF37] border border-[#D2691E]/40 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D2691E]" /> Export .VOX JSON
          </button>

          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded bg-[#D2691E] hover:bg-[#B45309] text-black font-bold text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copied MCP JSON!' : 'Copy MCP Prompt'}
          </button>

          {onExportToCityGrid && (
            <button
              onClick={() => {
                audio.playBell();
                onExportToCityGrid(voxels);
              }}
              className="px-3 py-1.5 rounded bg-[#D4AF37] hover:bg-[#FBBF24] text-black font-bold text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            >
              <Hammer className="w-3.5 h-3.5" /> Apply Voxel Skin to City
            </button>
          )}
        </div>
      </div>

      {/* Preset Model Templates */}
      <div className="bg-[#241D18] p-3 rounded-lg border border-[#D2691E]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-mono text-stone-400 font-bold flex items-center gap-1">
          <Wand2 className="w-4 h-4 text-[#D4AF37]" /> AI MagicaVoxel Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSelectPreset('temple')}
            className="px-2.5 py-1 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/30 text-stone-200 font-mono flex items-center gap-1 transition cursor-pointer"
          >
            🛕 Vimana Tower
          </button>
          <button
            onClick={() => handleSelectPreset('ship')}
            className="px-2.5 py-1 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/30 text-stone-200 font-mono flex items-center gap-1 transition cursor-pointer"
          >
            ⛵ Navy Galleon
          </button>
          <button
            onClick={() => handleSelectPreset('elephant')}
            className="px-2.5 py-1 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/30 text-stone-200 font-mono flex items-center gap-1 transition cursor-pointer"
          >
            🐘 War Elephant
          </button>
          <button
            onClick={() => handleSelectPreset('statue')}
            className="px-2.5 py-1 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/30 text-stone-200 font-mono flex items-center gap-1 transition cursor-pointer"
          >
            👑 Bronze Chola Idol
          </button>
        </div>
      </div>

      {/* Main Grid: Left - 3D Isometric Viewport, Right - Palette & Layer Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3D Isometric Viewport */}
        <div className="lg:col-span-2 flex flex-col space-y-3">
          
          {/* Camera Controls Toolbar */}
          <div className="flex flex-wrap justify-between items-center bg-[#241D18] p-2 rounded-lg border border-[#D2691E]/30 text-xs font-mono">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRotationAngle(r => (r + 45) % 360)}
                className="p-1.5 rounded bg-[#1C1713] hover:bg-[#3D3028] text-[#D4AF37] border border-[#D2691E]/30 flex items-center gap-1 cursor-pointer"
                title="Rotate 45°"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#D2691E]" /> {rotationAngle}°
              </button>

              <button
                onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))}
                className="p-1.5 rounded bg-[#1C1713] hover:bg-[#3D3028] text-stone-200 border border-[#D2691E]/30 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.1))}
                className="p-1.5 rounded bg-[#1C1713] hover:bg-[#3D3028] text-stone-200 border border-[#D2691E]/30 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded border cursor-pointer ${showGrid ? 'bg-[#D2691E]/20 border-[#D2691E] text-[#D4AF37]' : 'bg-[#1C1713] border-[#D2691E]/30 text-stone-400'}`}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-stone-400">
              Total Voxels: <strong className="text-[#D4AF37] font-bold">{voxels.length}</strong>
            </div>
          </div>

          {/* 3D SVG Isometric Viewport Canvas */}
          <div className="relative w-full aspect-[4/3] max-h-[460px] bg-[#120F0D] rounded-xl border-2 border-[#D2691E]/40 overflow-hidden shadow-2xl flex items-center justify-center select-none">
            
            {/* Background Ray lighting */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D2691E]/15 via-transparent to-black pointer-events-none" />

            <div ref={containerRef} className="w-full h-full flex items-center justify-center">
              <svg
                viewBox="0 0 520 440"
                className="w-full h-full"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              >
                <defs>
                  <filter id="voxelGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Render Sorted 3D Voxels */}
                {sortedIsoVoxels.map((v, idx) => {
                  const paletteColor = CHOLA_VOXEL_PALETTE.find(p => p.id === v.colorIndex)?.hex || '#FFFFFF';

                  // Isometric coordinates
                  const isoX = ORIGIN_X + v.rx * (TILE_W / 2);
                  const isoY = ORIGIN_Y + v.ry * (TILE_H / 2) - v.z * 12;

                  const w = TILE_W / 2;
                  const h = TILE_H / 2;

                  // 3D Voxel Diamond Top
                  const topPoints = `${isoX},${isoY - h} ${isoX + w},${isoY} ${isoX},${isoY + h} ${isoX - w},${isoY}`;
                  
                  // Extrusions
                  const leftPoints = `${isoX - w},${isoY} ${isoX},${isoY + h} ${isoX},${isoY + h + 10} ${isoX - w},${isoY + 10}`;
                  const rightPoints = `${isoX},${isoY + h} ${isoX + w},${isoY} ${isoX + w},${isoY + 10} ${isoX},${isoY + h + 10}`;

                  return (
                    <g key={`voxel-${v.x}-${v.y}-${v.z}-${idx}`}>
                      {/* Left Face (Shadow) */}
                      <polygon points={leftPoints} fill={paletteColor} opacity="0.75" stroke="#120F0D" strokeWidth="0.4" />
                      {/* Right Face (Mid) */}
                      <polygon points={rightPoints} fill={paletteColor} opacity="0.88" stroke="#120F0D" strokeWidth="0.4" />
                      {/* Top Face (Bright) */}
                      <polygon points={topPoints} fill={paletteColor} stroke="#120F0D" strokeWidth="0.5" />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Canvas Badge */}
            <div className="absolute bottom-3 right-3 bg-black/80 border border-[#D2691E]/40 px-2.5 py-1 rounded text-[10px] font-mono text-[#D4AF37] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#D2691E] animate-spin" /> MagicaVoxel 3D Viewport
            </div>
          </div>
        </div>

        {/* Right - MagicaVoxel Palette & Layer Editor */}
        <div className="space-y-4">
          
          {/* Tool Selector */}
          <div className="bg-[#241D18] p-3 rounded-lg border border-[#D2691E]/30 space-y-2">
            <span className="text-xs font-mono text-stone-300 font-bold uppercase tracking-wider block">
              Voxel Editor Tools
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTool('add')}
                className={`py-1.5 px-2 rounded font-mono text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeTool === 'add' 
                    ? 'bg-[#D2691E] text-black shadow' 
                    : 'bg-[#1C1713] text-stone-300 hover:bg-[#3D3028]'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" /> Place
              </button>

              <button
                onClick={() => setActiveTool('erase')}
                className={`py-1.5 px-2 rounded font-mono text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeTool === 'erase' 
                    ? 'bg-red-600 text-white shadow' 
                    : 'bg-[#1C1713] text-stone-300 hover:bg-[#3D3028]'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Erase
              </button>

              <button
                onClick={handleClearAll}
                className="py-1.5 px-2 rounded bg-[#1C1713] hover:bg-rose-950 text-rose-400 border border-rose-900/40 font-mono text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Active Z-Layer Control */}
          <div className="bg-[#241D18] p-3 rounded-lg border border-[#D2691E]/30 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-stone-300 font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> Active Height Z-Layer:
              </span>
              <strong className="text-[#D4AF37] font-bold">Z = {activeLayerZ}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              value={activeLayerZ}
              onChange={(e) => setActiveLayerZ(parseInt(e.target.value))}
              className="w-full accent-[#D2691E] cursor-pointer"
            />
          </div>

          {/* 2D Slice Layer Paint Grid */}
          <div className="bg-[#241D18] p-3 rounded-lg border border-[#D2691E]/30 space-y-2">
            <span className="text-xs font-mono text-stone-300 font-bold block">
              2D Paint Slice Grid (Z = {activeLayerZ})
            </span>
            <div className="grid grid-cols-16 gap-0.5 aspect-square bg-[#120F0D] p-1 rounded border border-[#D2691E]/20">
              {Array.from({ length: 16 }).map((_, y) => 
                Array.from({ length: 16 }).map((_, x) => {
                  const voxel = voxels.find(v => v.x === x && v.y === y && v.z === activeLayerZ);
                  const colorHex = voxel ? CHOLA_VOXEL_PALETTE.find(p => p.id === voxel.colorIndex)?.hex : 'transparent';

                  return (
                    <button
                      key={`slice-${x}-${y}`}
                      onClick={() => handleVoxelGridClick(x, y)}
                      className="w-full h-full rounded-[1px] border border-stone-800/40 hover:border-amber-400 transition cursor-pointer"
                      style={{ backgroundColor: colorHex || 'rgba(255,255,255,0.03)' }}
                      title={`Voxel (${x}, ${y}, ${activeLayerZ})`}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* MagicaVoxel Palette Selector */}
          <div className="bg-[#241D18] p-3 rounded-lg border border-[#D2691E]/30 space-y-2">
            <span className="text-xs font-mono text-stone-300 font-bold flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-[#D4AF37]" /> Chola Heritage Palette:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {CHOLA_VOXEL_PALETTE.map(color => (
                <button
                  key={color.id}
                  onClick={() => {
                    setSelectedColorIdx(color.id);
                    audio.playYazh(200 + color.id * 15);
                  }}
                  className={`p-1.5 rounded border flex flex-col items-center gap-1 text-[9px] font-mono transition cursor-pointer ${
                    selectedColorIdx === color.id ? 'ring-2 ring-amber-400 border-white scale-105 z-10' : 'border-stone-800'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className={`font-bold drop-shadow ${color.id === 14 ? 'text-black' : 'text-white'}`}>
                    #{color.id}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* JSON Schema Code Output Panel */}
      <div className="bg-[#120F0D] p-4 rounded-lg border border-[#D2691E]/30 space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-[#D4AF37] font-bold flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5 text-[#D2691E]" /> MagicaVoxel MCP Schema Output (LLM Direct Prompting)
          </span>
          <button
            onClick={handleCopyCode}
            className="text-xs text-[#D2691E] hover:underline cursor-pointer"
          >
            {copiedCode ? 'Copied!' : 'Copy Schema'}
          </button>
        </div>
        <pre className="bg-[#1C1713] p-3 rounded text-[10px] font-mono text-stone-300 max-h-32 overflow-y-auto border border-[#D2691E]/20">
          {jsonOutput}
        </pre>
      </div>

    </div>
  );
}
