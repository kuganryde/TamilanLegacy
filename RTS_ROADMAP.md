# Tamilan Legacy → Age-of-Empires-style RTS (Godot) — Roadmap

Goal: a **battle-driven real-time strategy** game (gather → build → train → fight)
in the Chola setting, matching the *feel* of Age of Empires. This is a large,
multi-milestone build; this file is the plan and the running status.

> Reality check: AoE is a decade of studio work. We are building a **solid,
> extensible foundation** and growing it milestone by milestone — not cloning
> AoE in one pass. Everything is authored headlessly and **must be verified in
> the Godot 4.3 (mono) editor** — expect first-open fixes.

## Gameplay milestones

- [x] **M0 — Core state & board.** `GameState` autoload (grid, resources,
      `ComputeIncome`, 3 s tick); `Board` renders tiles + `.glb` buildings.
- [x] **M1 — RTS control loop.** `RtsCamera` (WASD/arrows pan, Q/E rotate, wheel
      zoom); `Unit` (selectable, commandable, faces travel); `SelectionManager`
      (left-click select, right-click move-to-ground). *← you are here*
- [~] **M2 — Movement & formations.** DONE: `NavigationRegion3D` (navmesh baked
      from ground + carved buildings) + `NavigationAgent3D` path routing with a
      direct-move fallback; **drag box-select** with a screen overlay; formation
      move offsets. TODO: RVO unit-unit avoidance, re-bake when buildings change,
      control groups (1–9).
- [ ] **M3 — Combat.** HP, attack range/rate, target acquisition, auto-attack,
      death, a state machine (`Idle/Move/Attack/Die`) via `AnimationTree`
      (idle ↔ march ↔ attack blends on the rigged models). Melee first
      (warrior/spearman), then ranged (archer), then cavalry charge.
- [ ] **M4 — Economy & gathering.** Villager unit; resource nodes (quarry =
      stone, farm = food, forest = wood, port = trade); drop-off buildings;
      resource HUD wired to gather, not just idle ticks. Population cap via houses.
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
