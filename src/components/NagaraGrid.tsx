/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
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
import { GridCell, ZoneType, Resources } from '../types';
import { Hammer, Users, RefreshCw, Droplet, RotateCw, ZoomIn, ZoomOut, Layers, Eye, Award, Sparkles, Compass } from 'lucide-react';
import { audio } from '../utils/audio';

interface NagaraGridProps {
  grid: GridCell[];
  onUpdateCell: (id: string, type: ZoneType) => void;
  onUpgradeCell: (id: string) => void;
  onAssignWorkers: (id: string, count: number) => void;
  resources: Resources;
  availableWorkers: number;
  totalWorkers: number;
}

export default function NagaraGrid({
  grid,
  onUpdateCell,
  onUpgradeCell,
  onAssignWorkers,
  resources,
  availableWorkers,
  totalWorkers,
}: NagaraGridProps) {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  
  // 3D Isometric Camera Controls
  const [rotationAngle, setRotationAngle] = useState<number>(0); // 0, 1, 2, 3 -> 0deg, 90deg, 180deg, 270deg
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 0.7x to 1.4x
  const [showGridCoords, setShowGridCoords] = useState<boolean>(true);
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedCell = grid.find(c => c.id === selectedCellId);

  // Rotate Camera handler
  const handleRotateCamera = () => {
    audio.playYazh(349.23);
    setRotationAngle(prev => (prev + 1) % 4);

    if (containerRef.current) {
      anime({
        targets: containerRef.current,
        rotateZ: [(rotationAngle * 90) % 360, ((rotationAngle + 1) * 90)],
        scale: [zoomLevel * 0.95, zoomLevel],
        duration: 500,
        easing: 'easeOutBack'
      });
    }
  };

  const handleZoom = (delta: number) => {
    audio.playDrum(false);
    setZoomLevel(prev => Math.min(1.4, Math.max(0.7, prev + delta)));
  };

  // Helper colors and 3D heights for Isometric Rendering
  const get3DTileConfig = (cell: GridCell) => {
    switch (cell.type) {
      case 'river':
        return {
          height: 0,
          topColor: '#0284C7',
          leftColor: '#0369A1',
          rightColor: '#075985',
          strokeColor: '#38BDF8',
          label: 'River'
        };
      case 'quarry':
        return {
          height: 14,
          topColor: '#44403C',
          leftColor: '#292524',
          rightColor: '#1C1917',
          strokeColor: '#A8A29E',
          label: 'Quarry'
        };
      case 'ur':
        return {
          height: 10,
          topColor: cell.hasWater ? '#059669' : '#D97706',
          leftColor: cell.hasWater ? '#047857' : '#B45309',
          rightColor: cell.hasWater ? '#065F46' : '#92400E',
          strokeColor: cell.hasWater ? '#34D399' : '#FBBF24',
          label: cell.hasWater ? 'Irrigated Ur' : 'Dry Ur'
        };
      case 'nagar':
        return {
          height: 18 * cell.level,
          topColor: '#D97706',
          leftColor: '#B45309',
          rightColor: '#92400E',
          strokeColor: '#FBBF24',
          label: `Nagar L${cell.level}`
        };
      case 'kovil':
        return {
          height: 26 * cell.level,
          topColor: '#9F1239',
          leftColor: '#881337',
          rightColor: '#4C0519',
          strokeColor: '#F43F5E',
          label: `Kovil L${cell.level}`
        };
      case 'eri':
        return {
          height: -4, // Sunken reservoir basin
          topColor: '#0891B2',
          leftColor: '#0E7490',
          rightColor: '#155E75',
          strokeColor: '#22D3EE',
          label: 'Eri Tank'
        };
      case 'empty':
      default:
        return {
          height: 4,
          topColor: '#27201C',
          leftColor: '#1C1713',
          rightColor: '#120F0D',
          strokeColor: '#44342A',
          label: 'Unzoned'
        };
    }
  };

  const handleCellClick = (cell: GridCell) => {
    audio.playYazh(261.63 + (cell.row * 10) + (cell.col * 15));
    setSelectedCellId(cell.id);

    const el = document.getElementById(`iso-tile-${cell.id}`);
    if (el) {
      anime({
        targets: el,
        translateY: ['-6px', '0px'],
        duration: 350,
        easing: 'easeOutBounce'
      });
    }
  };

  const buildZone = (type: ZoneType) => {
    if (!selectedCellId) return;
    
    let cost = 0;
    if (type === 'ur') cost = 50;
    if (type === 'nagar') cost = 120;
    if (type === 'kovil') cost = 250;
    if (type === 'eri') cost = 100;

    if (resources.aruvam >= cost) {
      audio.playBell();
      onUpdateCell(selectedCellId, type);

      const cell = grid.find(c => c.id === selectedCellId);
      if (cell) {
        const el = document.getElementById(`iso-tile-${cell.id}`);
        if (el) {
          anime({
            targets: el,
            scale: [0.7, 1.1, 1],
            translateY: ['-30px', '0px'],
            duration: 700,
            easing: 'easeOutElastic(1, .5)'
          });
        }
      }
    } else {
      audio.playDrum(true);
    }
  };

  const upgradeZone = () => {
    if (!selectedCell) return;
    const cost = selectedCell.level * 200;
    if (resources.aruvam >= cost) {
      audio.playBell();
      onUpgradeCell(selectedCell.id);

      const el = document.getElementById(`iso-tile-${selectedCell.id}`);
      if (el) {
        anime({
          targets: el,
          translateY: ['-20px', '0px'],
          duration: 650,
          easing: 'easeOutExpo'
        });
      }
    } else {
      audio.playDrum(true);
    }
  };

  const adjustWorkers = (change: number) => {
    if (!selectedCell) return;
    const current = selectedCell.assignedWorkers;
    const target = current + change;

    if (target < 0) return;
    if (change > 0 && availableWorkers <= 0) {
      audio.playDrum(true);
      return;
    }

    audio.playDrum(false);
    onAssignWorkers(selectedCell.id, change);
  };

  // Compute rotated coordinates & sort tiles back-to-front for proper 3D depth overlap
  const sortedIsoTiles = useMemo(() => {
    // Map each cell to its transformed isometric (rotRow, rotCol)
    const transformed = grid.map(cell => {
      let r = cell.row;
      let c = cell.col;

      if (rotationAngle === 1) {
        r = cell.col;
        c = 7 - cell.row;
      } else if (rotationAngle === 2) {
        r = 7 - cell.row;
        c = 7 - cell.col;
      } else if (rotationAngle === 3) {
        r = 7 - cell.col;
        c = cell.row;
      }

      return {
        cell,
        rotRow: r,
        rotCol: c,
        depth: r + c // Higher depth renders later (in front)
      };
    });

    // Sort by depth ascending so back tiles draw first
    return transformed.sort((a, b) => a.depth - b.depth);
  }, [grid, rotationAngle]);

  // Isometric Constants
  const TILE_W = 64;
  const TILE_H = 32;
  const ORIGIN_X = 300;
  const ORIGIN_Y = 120;

  return (
    <div id="nagara-grid-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#241D18] p-6 rounded-xl border-2 border-[#D2691E]/30 shadow-2xl">
      
      {/* 3D Isometric Viewport */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
          <div>
            <h3 className="text-lg font-serif text-[#F4EFE6] flex items-center gap-2">
              Isometric 3D Imperial City <span className="text-[#D2691E] text-xs font-mono">(முப்பரிமாண நகரம்)</span>
            </h3>
            <p className="text-stone-400 text-xs">
              Interactive 3D Voxel View. Rotate camera, zone lands, and assign Chola guild labor.
            </p>
          </div>

          {/* 3D Camera Controls Toolbar */}
          <div className="flex items-center gap-1.5 bg-[#1C1713] p-1.5 rounded-lg border border-[#D2691E]/30 shadow">
            <button
              onClick={handleRotateCamera}
              className="p-1.5 rounded bg-[#2D241E] hover:bg-[#3D3028] text-[#D4AF37] border border-[#D2691E]/30 flex items-center gap-1 text-xs font-mono font-bold transition cursor-pointer"
              title="Rotate Camera 90°"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#D2691E]" />
              <span>{rotationAngle * 90}°</span>
            </button>

            <button
              onClick={() => handleZoom(0.1)}
              className="p-1.5 rounded bg-[#2D241E] hover:bg-[#3D3028] text-stone-200 border border-[#D2691E]/30 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 rounded bg-[#2D241E] hover:bg-[#3D3028] text-stone-200 border border-[#D2691E]/30 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowGridCoords(!showGridCoords)}
              className={`p-1.5 rounded border text-xs transition cursor-pointer ${
                showGridCoords 
                  ? 'bg-[#D2691E]/20 border-[#D2691E] text-[#D4AF37]' 
                  : 'bg-[#2D241E] border-[#D2691E]/30 text-stone-400'
              }`}
              title="Toggle Coordinates"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3D SVG Isometric Canvas (600 x 480) */}
        <div className="relative w-full aspect-[4/3] max-h-[500px] bg-[#120F0D] rounded-xl border-2 border-[#D2691E]/40 overflow-hidden shadow-2xl flex items-center justify-center select-none">
          {/* Radial Warm Lighting Atmosphere */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D2691E]/15 via-transparent to-black pointer-events-none" />

          {/* Isometric SVG Canvas */}
          <div ref={containerRef} className="w-full h-full transition-transform duration-300">
            <svg
              viewBox="0 0 600 480"
              className="w-full h-full"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <defs>
                {/* Gold Glow Filter */}
                <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                {/* Soft Ground Shadow Filter */}
                <filter id="groundShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.5" />
                </filter>

                {/* Top Face Realistic Sunlight Gradients */}
                <linearGradient id="topGraniteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#57534E" />
                  <stop offset="50%" stopColor="#44403C" />
                  <stop offset="100%" stopColor="#292524" />
                </linearGradient>

                <linearGradient id="topGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="40%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                <linearGradient id="topPaddyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="60%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>

                <linearGradient id="topAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>

                {/* Side Face Ambient Shadows */}
                <linearGradient id="sideLeftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
                </linearGradient>

                {/* Water Shimmer Pattern */}
                <linearGradient id="isoWaterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="40%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#0369A1" />
                </linearGradient>
              </defs>

              {/* Render sorted Isometric 3D Tiles */}
              {sortedIsoTiles.map(({ cell, rotRow, rotCol }) => {
                const isSelected = cell.id === selectedCellId;
                const isHovered = cell.id === hoveredCellId;
                const config = get3DTileConfig(cell);

                // Calculate Isometric Center Point
                const isoX = (rotCol - rotRow) * (TILE_W / 2) + ORIGIN_X;
                const isoY = (rotCol + rotRow) * (TILE_H / 2) + ORIGIN_Y;

                const h = config.height;

                // Diamond Points for Tile Top Face
                const topX = isoX;
                const topY = isoY - h;

                const rightX = isoX + TILE_W / 2;
                const rightY = isoY + TILE_H / 2 - h;

                const bottomX = isoX;
                const bottomY = isoY + TILE_H - h;

                const leftX = isoX - TILE_W / 2;
                const leftY = isoY + TILE_H / 2 - h;

                // Points for Extrusions
                const baseBottomY = isoY + TILE_H;
                const baseLeftY = isoY + TILE_H / 2;
                const baseRightY = isoY + TILE_H / 2;

                const topPolygonPoints = `${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`;
                const leftPolygonPoints = `${leftX},${leftY} ${bottomX},${bottomY} ${bottomX},${baseBottomY} ${leftX},${baseLeftY}`;
                const rightPolygonPoints = `${bottomX},${bottomY} ${rightX},${rightY} ${rightX},${baseRightY} ${bottomX},${baseBottomY}`;

                return (
                  <g
                    key={`iso-group-${cell.id}`}
                    id={`iso-tile-${cell.id}`}
                    onClick={() => handleCellClick(cell)}
                    onMouseEnter={() => setHoveredCellId(cell.id)}
                    onMouseLeave={() => setHoveredCellId(null)}
                    className="cursor-pointer transition-transform duration-200"
                  >
                    {/* Ground Cast Ambient Shadow Polygon */}
                    {h > 0 && (
                      <polygon
                        points={`${isoX - TILE_W / 2 + 4},${isoY + TILE_H / 2 + 2} ${isoX + 4},${isoY + TILE_H + 2} ${isoX + TILE_W / 2 + 8},${isoY + TILE_H / 2 + 4} ${isoX + 8},${isoY + 4}`}
                        fill="rgba(0, 0, 0, 0.45)"
                        filter="url(#groundShadow)"
                      />
                    )}

                    {/* Left Extruded Face (Shadow Face with Depth Gradient) */}
                    {h > 0 && (
                      <>
                        <polygon
                          points={leftPolygonPoints}
                          fill={config.leftColor}
                          stroke="#1C1713"
                          strokeWidth="0.5"
                        />
                        <polygon
                          points={leftPolygonPoints}
                          fill="url(#sideLeftGrad)"
                          opacity="0.6"
                        />
                      </>
                    )}

                    {/* Right Extruded Face (Mid Tone Face) */}
                    {h > 0 && (
                      <polygon
                        points={rightPolygonPoints}
                        fill={config.rightColor}
                        stroke="#1C1713"
                        strokeWidth="0.5"
                      />
                    )}

                    {/* Tile Top Diamond Face with Specular Bevel Highlights */}
                    <polygon
                      points={topPolygonPoints}
                      fill={isHovered ? '#D2691E' : cell.type === 'ur' && cell.hasWater ? 'url(#topPaddyGrad)' : cell.type === 'quarry' ? 'url(#topGraniteGrad)' : cell.type === 'nagar' ? 'url(#topAmberGrad)' : cell.type === 'kovil' ? 'url(#topGoldGrad)' : config.topColor}
                      stroke={isSelected ? '#FFD700' : config.strokeColor}
                      strokeWidth={isSelected ? '2.5' : '0.8'}
                      filter={isSelected ? 'url(#goldGlow)' : undefined}
                      opacity={isSelected ? 1 : 0.95}
                    />

                    {/* Top Specular Edge Highlight Line (Lit Top-Left Edge) */}
                    <polyline
                      points={`${leftX},${leftY} ${topX},${topY} ${rightX},${rightY}`}
                      fill="none"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="0.7"
                    />

                    {/* 3D Building Sprites / Structures on Top Face */}
                    <g transform={`translate(${topX}, ${topY + TILE_H / 2})`}>
                      
                      {/* Temple Kovil - Detailed Multi-tiered Dravidian Gopuram Tower */}
                      {cell.type === 'kovil' && (
                        <g className="transition-transform duration-300">
                          {/* Base Stone Mandapam */}
                          <polygon points="-12,-2 0,4 12,-2 0,-8" fill="#B45309" stroke="#78350F" strokeWidth="0.8" />
                          
                          {/* Tower Tier 1 (Base Level) */}
                          <polygon points="-10,-8 0,-3 10,-8 0,-13" fill="#D97706" stroke="#92400E" strokeWidth="0.8" />
                          <rect x="-8" y="-12" width="16" height="5" fill="#B45309" stroke="#78350F" strokeWidth="0.5" rx="0.5" />
                          <circle cx="0" cy="-9.5" r="1" fill="#FBBF24" />

                          {/* Tower Tier 2 (Middle Tier) */}
                          <polygon points="-7,-15 0,-11 7,-15 0,-19" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />
                          <rect x="-5" y="-18" width="10" height="4" fill="#D97706" stroke="#92400E" strokeWidth="0.5" />

                          {/* Tower Tier 3 (Upper Vimana Cap) */}
                          <polygon points="-4,-21 0,-18 4,-21 0,-24" fill="#FCD34D" stroke="#D97706" strokeWidth="0.8" />

                          {/* Gold Kumbam Kalasam Capstone Spire */}
                          <circle cx="0" cy="-26" r="2.5" fill="#FFD700" stroke="#92400E" strokeWidth="0.6" />
                          <polygon points="0,-29 -1,-26 1,-26" fill="#FFE57F" />
                          <circle cx="0" cy="-26" r="4" fill="#FFD700" opacity="0.3" className="animate-ping" />

                          {/* Entrance Diya Lamp Fire Particles */}
                          <circle cx="-6" cy="1" r="1.2" fill="#EF4444" className="animate-pulse" />
                          <circle cx="6" cy="1" r="1.2" fill="#EF4444" className="animate-pulse" />
                        </g>
                      )}

                      {/* Market Nagar - Detailed Guild Stalls with Terracotta Roof & Goods */}
                      {cell.type === 'nagar' && (
                        <g>
                          {/* Market Wooden Platform */}
                          <polygon points="-11,-2 0,3 11,-2 0,-7" fill="#78350F" stroke="#451A03" strokeWidth="0.8" />
                          
                          {/* Pillars */}
                          <line x1="-8" y1="-4" x2="-8" y2="-10" stroke="#451A03" strokeWidth="1.2" />
                          <line x1="8" y1="-4" x2="8" y2="-10" stroke="#451A03" strokeWidth="1.2" />
                          <line x1="0" y1="-1" x2="0" y2="-7" stroke="#451A03" strokeWidth="1.2" />

                          {/* Terracotta Tile Awning Roof */}
                          <polygon points="-12,-10 0,-5 12,-10 0,-15" fill="#C2410C" stroke="#7C2D12" strokeWidth="0.8" />
                          <polygon points="-10,-12 0,-7 10,-12 0,-17" fill="#EA580C" stroke="#7C2D12" strokeWidth="0.8" />

                          {/* Market Baskets & Gold Spice Trays */}
                          <circle cx="-4" cy="-3" r="2" fill="#F59E0B" stroke="#78350F" strokeWidth="0.5" />
                          <circle cx="4" cy="-3" r="2" fill="#10B981" stroke="#064E3B" strokeWidth="0.5" />
                          <circle cx="0" cy="-1" r="1.5" fill="#E11D48" />

                          {/* Guild Banner */}
                          <polygon points="8,-10 11,-8 8,-6" fill="#FBBF24" />
                        </g>
                      )}

                      {/* Paddy Ur - Terraced Paddy Fields & Coconut Palms */}
                      {cell.type === 'ur' && (
                        <g>
                          {/* Terraced Paddy Fields */}
                          <polygon points="-10,-2 0,3 10,-2 0,-7" fill="#059669" stroke="#047857" strokeWidth="0.8" />
                          <polygon points="-7,-4 0,0 7,-4 0,-8" fill="#10B981" stroke="#059669" strokeWidth="0.6" />

                          {/* Rice Paddy Stalk Rows */}
                          <path d="M -5,-3 L -5,-6 M -2,-2 L -2,-5 M 2,-2 L 2,-5 M 5,-3 L 5,-6" stroke="#FBBF24" strokeWidth="1" strokeLinecap="round" />

                          {/* Coconut Tree Palm Vector */}
                          <path d="M 6,-2 Q 8,-8 6,-14" fill="none" stroke="#78350F" strokeWidth="1.2" />
                          <circle cx="5" cy="-14" r="2.5" fill="#047857" />
                          <circle cx="7" cy="-14" r="2.5" fill="#10B981" />
                          <circle cx="6" cy="-16" r="2.5" fill="#34D399" />
                        </g>
                      )}

                      {/* Quarry - Layered Granite Blocks & Chisel Scaffold */}
                      {cell.type === 'quarry' && (
                        <g>
                          {/* Granite Block 1 */}
                          <polygon points="-9,-2 -2,1 -2,-5 -9,-8" fill="#57534E" stroke="#292524" strokeWidth="0.8" />
                          <polygon points="-2,1 5,-2 5,-8 -2,-5" fill="#78716C" stroke="#292524" strokeWidth="0.8" />
                          <polygon points="-9,-8 -2,-5 5,-8 -2,-11" fill="#A8A29E" stroke="#292524" strokeWidth="0.8" />

                          {/* Stacked Top Block */}
                          <polygon points="-4,-8 1,-5 1,-9 -4,-12" fill="#78716C" stroke="#1C1917" strokeWidth="0.6" />
                          <polygon points="1,-5 6,-8 6,-12 1,-9" fill="#A8A29E" stroke="#1C1917" strokeWidth="0.6" />
                          <polygon points="-4,-12 1,-9 6,-12 1,-15" fill="#D6D3D1" stroke="#1C1917" strokeWidth="0.6" />

                          {/* Wooden Scaffolding Poles */}
                          <line x1="-8" y1="0" x2="-8" y2="-14" stroke="#B45309" strokeWidth="0.8" />
                          <line x1="7" y1="-2" x2="7" y2="-14" stroke="#B45309" strokeWidth="0.8" />
                          <line x1="-8" y1="-10" x2="7" y2="-10" stroke="#B45309" strokeWidth="0.8" />
                        </g>
                      )}

                      {/* Eri Reservoir - Step Ghat & Water Basin */}
                      {cell.type === 'eri' && (
                        <g>
                          {/* Outer Stone Basin Step */}
                          <polygon points="-12,-2 0,4 12,-2 0,-8" fill="#475569" stroke="#1E293B" strokeWidth="0.8" />
                          {/* Inner Sunken Water Surface */}
                          <polygon points="-9,-2 0,2 9,-2 0,-6" fill="#0284C7" stroke="#38BDF8" strokeWidth="0.8" className="animate-pulse" />
                          {/* Lotus Pads */}
                          <circle cx="-3" cy="-2" r="1.5" fill="#10B981" />
                          <circle cx="-3" cy="-2" r="0.8" fill="#F43F5E" />
                          <circle cx="3" cy="-1" r="1.5" fill="#10B981" />
                        </g>
                      )}

                      {/* River Channel - Water Flow Lines & Stone Bridge */}
                      {cell.type === 'river' && (
                        <g>
                          <path d="M -14,-3 C -5,2 5,-4 14,-1" fill="none" stroke="#38BDF8" strokeWidth="3" opacity="0.8" />
                          <path d="M -14,-3 C -5,2 5,-4 14,-1" fill="none" stroke="#E0F2FE" strokeWidth="1" strokeDasharray="3 3" className="animate-pulse" />
                          
                          {/* Wooden Footbridge */}
                          <polygon points="-4,-4 4,-1 4,1 -4,-2" fill="#78350F" stroke="#451A03" strokeWidth="0.8" />
                        </g>
                      )}

                      {/* Worker Vector Avatar & Guild Badge */}
                      {cell.assignedWorkers > 0 && (
                        <g transform="translate(12, -14)">
                          {/* Worker Circle Shadow & Base */}
                          <circle cx="0" cy="0" r="7" fill="#1C1713" stroke="#D4AF37" strokeWidth="1.2" />
                          
                          {/* Realistic Artisan Avatar Figure */}
                          <circle cx="0" cy="-2" r="2.2" fill="#D2691E" /> {/* Head */}
                          <path d="M -3,4 C -3,1 3,1 3,4 Z" fill="#D4AF37" /> {/* Dhoti Body */}
                          <circle cx="0" cy="-3.5" r="1.5" fill="#F59E0B" /> {/* Turban */}

                          {/* Badge Count */}
                          <rect x="2" y="-8" width="8" height="7" rx="2" fill="#D2691E" stroke="#000" strokeWidth="0.5" />
                          <text x="6" y="-3" textAnchor="middle" fontSize="6" fill="#FFF" fontFamily="monospace" fontWeight="bold">
                            {cell.assignedWorkers}
                          </text>
                        </g>
                      )}

                      {/* Coordinate Tag */}
                      {showGridCoords && (
                        <text
                          y="10"
                          textAnchor="middle"
                          fontSize="7"
                          fontFamily="monospace"
                          fill={isSelected ? '#FFD700' : '#A8A29E'}
                          opacity={0.8}
                        >
                          {cell.row},{cell.col}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Hover / Selected Cell HUD Overlay */}
          <div className="absolute bottom-3 left-3 bg-[#120F0D]/90 border border-[#D2691E]/50 px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-3 text-xs font-mono text-[#F4EFE6]">
            <Compass className="w-4 h-4 text-[#D4AF37] animate-spin" />
            <div>
              <span className="text-stone-400 text-[10px] uppercase">Selected 3D Tile:</span>{' '}
              <strong className="text-[#D4AF37]">
                {selectedCell ? `${configCellLabel(selectedCell)} (${selectedCell.row}, ${selectedCell.col})` : 'Click any Isometric Block'}
              </strong>
            </div>
          </div>
        </div>

        {/* 3D Legend */}
        <div className="grid grid-cols-6 gap-2 mt-3 text-[10px] text-stone-400 bg-[#2D241E] p-2 rounded border border-[#D2691E]/20">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-[#0284C7] border border-blue-400" /><span>River</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-[#059669] border border-emerald-400" /><span>Paddy (Ur)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-[#D97706] border border-amber-400" /><span>Market (Nagar)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-[#9F1239] border border-rose-400" /><span>Temple (Kovil)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-[#0891B2] border border-cyan-400" /><span>Eri Tank</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-[#44403C] border border-stone-400" /><span>Quarry</span></div>
        </div>
      </div>

      {/* Inspector / Action Panel */}
      <div id="grid-inspector-panel" className="bg-[#2D241E] border border-[#D2691E]/30 rounded-lg p-5 flex flex-col justify-between h-full">
        {selectedCell ? (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#D2691E] uppercase tracking-widest">
                  Row {selectedCell.row}, Col {selectedCell.col}
                </span>
                <h4 className="text-base font-serif font-semibold text-[#F4EFE6]">
                  {configCellLabel(selectedCell)}
                </h4>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                selectedCell.hasWater && selectedCell.type !== 'river'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/40' 
                  : 'bg-[#1C1713] text-stone-400 border border-stone-800'
              }`}>
                {selectedCell.hasWater ? 'Irrigated' : 'Dry'}
              </span>
            </div>

            <div className="w-full h-[1px] bg-[#D2691E]/20 mb-4" />

            {/* Zone Options / Upgrades */}
            <div className="text-stone-300 text-xs leading-relaxed space-y-3 mb-6">
              {selectedCell.type === 'empty' && (
                <div>
                  <p className="text-stone-400">Construct an imperial 3D structure on this tile:</p>
                  
                  <div className="space-y-2 mt-4">
                    <button
                      id="btn-zone-ur"
                      onClick={() => buildZone('ur')}
                      className="w-full p-2.5 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/20 text-left flex justify-between items-center transition cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-stone-200">Ur Zone (Agriculture)</div>
                        <div className="text-[10px] text-stone-400">Yields Aruvam (Wealth). Irrigated paddies double output.</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#2D241E] px-1.5 py-0.5 rounded border border-[#D2691E]/20">50 Gold</span>
                    </button>

                    <button
                      id="btn-zone-nagar"
                      onClick={() => buildZone('nagar')}
                      className="w-full p-2.5 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/20 text-left flex justify-between items-center transition cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-stone-200">Nagar Zone (Marketplace)</div>
                        <div className="text-[10px] text-stone-400">3D Guild stalls generate continuous gold.</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#2D241E] px-1.5 py-0.5 rounded border border-[#D2691E]/20">120 Gold</span>
                    </button>

                    <button
                      id="btn-zone-kovil"
                      onClick={() => buildZone('kovil')}
                      className="w-full p-2.5 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/20 text-left flex justify-between items-center transition cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-stone-200">Kovil Zone (Temple Gopuram)</div>
                        <div className="text-[10px] text-stone-400">Generates Anbu (Culture). Elevates in 3D level.</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#2D241E] px-1.5 py-0.5 rounded border border-[#D2691E]/20">250 Gold</span>
                    </button>

                    <button
                      id="btn-zone-eri"
                      onClick={() => buildZone('eri')}
                      className="w-full p-2.5 rounded bg-[#1C1713] hover:bg-[#3D3028] border border-[#D2691E]/20 text-left flex justify-between items-center transition cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-stone-200">Eri Tank (3D Basin)</div>
                        <div className="text-[10px] text-stone-400">Irrigates all adjacent paddy tiles.</div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#2D241E] px-1.5 py-0.5 rounded border border-[#D2691E]/20">100 Gold</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedCell.type === 'ur' && (
                <div className="space-y-3">
                  <p className="text-stone-300">
                    Traditional agricultural land cultivating rich paddy rice (*Nel*).
                  </p>
                  <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-stone-400">
                      <span>Irrigation Boost:</span>
                      <span className={selectedCell.hasWater ? 'text-cyan-400 animate-pulse font-bold' : 'text-stone-500'}>
                        {selectedCell.hasWater ? 'Active (200% Yield)' : 'Inactive (100% Yield)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Aruvam Production:</span>
                      <span className="text-[#D4AF37] font-bold">+{selectedCell.hasWater ? 10 : 5} gold / min</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedCell.type === 'nagar' && (
                <div className="space-y-3">
                  <p className="text-stone-300">
                    Busy market lanes housing master artisans and active guilds.
                  </p>
                  <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-stone-400">
                      <span>3D Building Level:</span>
                      <span className="text-[#D2691E] font-bold">Level {selectedCell.level}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Aruvam Production:</span>
                      <span className="text-[#D4AF37] font-bold">+{15 * selectedCell.level} gold / min</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedCell.type === 'kovil' && (
                <div className="space-y-3">
                  <p className="text-stone-300">
                    Spiritual, scholarly center managing scriptures and fine arts.
                  </p>
                  <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-stone-400">
                      <span>3D Gopuram Height:</span>
                      <span className="text-[#D2691E] font-bold">Level {selectedCell.level}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Anbu Production:</span>
                      <span className="text-rose-400 font-bold">+{10 * selectedCell.level} culture / min</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedCell.type === 'eri' && (
                <div className="space-y-3">
                  <p className="text-stone-300">
                    Deep water reservoir feeding life-giving irrigation channels.
                  </p>
                  <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 text-[11px] font-mono text-cyan-400">
                    💦 Actively irrigating all adjacent agricultural zones!
                  </div>
                </div>
              )}

              {selectedCell.type === 'river' && (
                <p className="text-cyan-300 italic">
                  The holy Cauvery river flowing naturally. Grants abundant immediate irrigation.
                </p>
              )}

              {selectedCell.type === 'quarry' && (
                <div className="space-y-3">
                  <p className="text-stone-300">
                    Massive granite quarry providing base blocks for temple towers.
                  </p>
                  <div className="bg-[#1C1713] p-3 rounded border border-[#D2691E]/20 text-[11px] font-mono text-[#D2691E]">
                    🔨 Assign workers here to excavate granite blocks for Brihadeeswarar Temple.
                  </div>
                </div>
              )}

              {/* Worker Allocation & Upgrades */}
              {selectedCell.type !== 'empty' && selectedCell.type !== 'river' && (
                <div className="mt-4 pt-4 border-t border-[#D2691E]/20 space-y-4">
                  {(selectedCell.type === 'nagar' || selectedCell.type === 'kovil') && selectedCell.level < 3 && (
                    <div className="flex justify-between items-center bg-[#1C1713] p-2 rounded border border-[#D2691E]/20">
                      <div>
                        <div className="text-[10px] text-stone-400 font-sans">Upgrade 3D Structure</div>
                        <div className="text-[#D4AF37] font-mono font-bold text-xs">Cost: {selectedCell.level * 200} Gold</div>
                      </div>
                      <button
                        id="btn-upgrade-cell"
                        onClick={upgradeZone}
                        className="px-3 py-1.5 rounded bg-[#D2691E] hover:bg-[#E37E32] text-black font-extrabold text-xs uppercase flex items-center gap-1 transition cursor-pointer active:scale-95"
                      >
                        <Hammer className="w-3.5 h-3.5" /> Upgrade
                      </button>
                    </div>
                  )}

                  {/* Worker Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-stone-300 text-xs">
                      <span>Assigned Guild Workers</span>
                      <span className="font-mono font-semibold text-[#D2691E]">{selectedCell.assignedWorkers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-remove-worker"
                        onClick={() => adjustWorkers(-1)}
                        className="flex-1 py-1.5 px-3 rounded bg-[#1C1713] hover:bg-[#2D241E] text-[#FF6B6B] font-bold text-xs text-center border border-[#D2691E]/20 cursor-pointer active:scale-95"
                      >
                        - Remove
                      </button>
                      <button
                        id="btn-add-worker"
                        onClick={() => adjustWorkers(1)}
                        className="flex-1 py-1.5 px-3 rounded bg-[#D2691E]/20 hover:bg-[#D2691E]/40 text-[#D4AF37] font-bold text-xs text-center border border-[#D2691E]/30 cursor-pointer active:scale-95"
                      >
                        + Deploy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="text-center py-12 text-stone-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#D2691E] animate-pulse" />
            <p className="font-serif italic text-sm">Click any 3D tile on the isometric canvas to inspect and manage.</p>
          </div>
        )}

        {selectedCell && (
          <div className="mt-4 p-3 bg-[#1C1713] rounded border border-[#D2691E]/20 flex items-center justify-between text-[11px] font-mono">
            <span className="text-stone-400">Empire Reserves:</span>
            <span className="text-[#D4AF37] flex items-center gap-1 font-bold">
              💰 {resources.aruvam.toLocaleString()} gold
            </span>
          </div>
        )}
      </div>

    </div>
  );
}

function configCellLabel(cell: GridCell): string {
  switch (cell.type) {
    case 'river': return 'Holy Cauvery River';
    case 'quarry': return 'Granite Quarry Block';
    case 'ur': return cell.hasWater ? 'Irrigated Paddy (Ur)' : 'Dry Field (Ur)';
    case 'nagar': return `Market Guild L${cell.level} (Nagar)`;
    case 'kovil': return `Temple Gopuram L${cell.level} (Kovil)`;
    case 'eri': return 'Eri Water Basin';
    case 'empty': return 'Unzoned Land';
    default: return 'Empty';
  }
}

