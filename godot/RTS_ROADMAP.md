# Tamilan Legacy → Age-of-Empires-style RTS (Godot) — Roadmap

Goal: a **battle-driven real-time strategy** game (gather → build → train → fight)
in the Chola setting, matching the *feel* of Age of Empires. This is a large,
multi-milestone build; this file is the plan and the running status.

> Reality check: AoE is a decade of studio work. We are building a **solid,
> extensible foundation** and growing it milestone by milestone — not cloning
> AoE in one pass. The project is **GDScript** (Godot 4.3 standard build), chosen
> so it can **export to the web** — Godot's C#/.NET target can't export HTML5.
> Everything is authored headlessly; the CI web-export (`.github/workflows/
> godot-web.yml`, deploying to GitHub Pages) is the live compile check.

## Gameplay milestones

- [x] **M0 — Core state & board.** `GameState` autoload (grid, resources,
      `ComputeIncome`, 3 s tick); `Board` renders tiles + `.glb` buildings.
- [x] **M1 — RTS control loop.** `RtsCamera` (WASD/arrows pan, Q/E rotate, wheel
      zoom); `Unit` (selectable, commandable, faces travel); `SelectionManager`
      (left-click select, right-click move-to-ground).
- [x] **M2 — Movement & formations.** `NavigationRegion3D` (navmesh baked
      from ground + carved buildings) + `NavigationAgent3D` path routing with a
      direct-move fallback; **drag box-select** with a screen overlay; formation
      move offsets; **control groups** (Ctrl+1–9 assign, 1–9 recall). TODO
      (polish, deferred): RVO unit-unit avoidance, re-bake when buildings change.
- [x] **M3 — Combat.** HP + billboarded health bars; auto target-acquisition
      within `AggroRange`; **right-click an enemy to attack**; attack-move,
      damage on cooldown, death; opposing groups skirmish on contact (shared
      brain). TODO (art pass): swap the facing-only attack for an `AnimationTree`
      state machine (idle ↔ march ↔ attack ↔ die) on the rigged models;
      ranged (archer) + cavalry charge.
- [x] **M4 — Economy & gathering.** `Villager` (inherits `Unit`, gather brain:
      walk → harvest → carry → bank → repeat); `ResourceNode` (Food/Wood/Stone/
      Gold, depletes and frees itself); `DropOff` (banks into `MatchEconomy`);
      `MatchEconomy` autoload (resource ledger + live population); `ResourceHud`
      top bar. **Right-click a node with villagers selected to task them.**
      *← you are here.* TODO (next passes): population cap raised by houses,
      buildable farms, villager build/repair, a carry indicator.
- [ ] **M5 — Buildings & production.** Place buildings (ghost + validity),
      construction over time, Barracks/Archery-Range/Stable **train** units with
      a queue; Town Center; tech/upgrades (reuse the Olai Chuvadi tree).
- [ ] **M6 — Opponent AI.** Simple skirmish AI: expand, gather, army up, attack
      waves. Fog of war + minimap.
- [ ] **M7 — Ages.** Sangam → Pallava → Imperial Chola age-up gating buildings,
      units and upgrades (ties in the era characters you commissioned).
- [ ] **M8 — Meta.** Win/lose, match setup, save/load, audio, polish.

## Graphics roadmap ("match AoE")

Honest: the current models are **stylized low-poly** (great, cohesive, but not
AoE-IV fidelity). Path to a AAA-*feeling* look without a studio:

1. **Terrain** — `GridMap` of 3D tiles or a heightmap terrain with texture
   splatting (grass/dirt/stone/sand), not a flat plane. Cliffs, coastline.
2. **Lighting & post** — `WorldEnvironment` with SSAO, soft shadows, SDFGI or
   baked GI, subtle bloom + ACES tonemap, sky/time-of-day. This alone lifts the
   look dramatically.
3. **Unit animation** — replace procedural motion with authored clips via
   `AnimationTree` state machines (idle/walk/run/attack/death), foot-planting.
4. **Water & foliage** — animated water shader (the Cauvery, the sea), wind on
   palms/crops, `MultiMeshInstance3D` for dense forests/crops at zero cost.
5. **VFX** — `GPUParticles3D` for dust, arrows, fire, monsoon rain, festival
   fireworks; decals for build sites and blood/scorch.
6. **Higher-detail models** — iteratively improve the Blender models (more
   geometry, PBR materials, normal maps) or bring in AI asset generators
   (Ludo.ai / Summer Engine `generate_3d`) and asset packs for hero units and
   landmark buildings.
7. **UI** — a themed `Control` HUD (command card, minimap, resource bar,
   selection portraits) in the Chola copper-plate style.

## Architecture (Godot scene/node layout)

```
Main (GameRoot : Node3D)
├── WorldEnvironment
├── DirectionalLight3D (sun, shadows)
├── Ground (MeshInstance3D)            → M2: NavigationRegion3D
├── RtsCamera (Node3D) → Camera3D
├── Board (Node3D)                     → city tiles + building .glb
├── SelectionManager (Node)           → input → selection & commands
└── Units…  (Unit : Node3D)           → M2: CharacterBody3D + NavigationAgent3D
```

`GameState` (autoload) stays the single source of truth for resources/grid; a
future `MatchState` holds teams, populations, and per-player fog.

## Controls
- **Pan:** WASD / arrow keys   **Rotate:** Q / E   **Zoom:** mouse wheel
- **Select:** left-click a unit   **Box-select:** left-drag a rectangle
- **Move:** right-click the ground (selection moves in formation)
- **Attack:** right-click an enemy unit (whole selection engages)
- **Gather:** select villagers (amber rings), right-click a resource node
- **Control groups:** Ctrl+1–9 assign the selection, 1–9 recall it
