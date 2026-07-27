# Tamilan Legacy — Godot RTS (GDScript)

An **Age-of-Empires-style RTS** rebuild of Tamilan Legacy in **Godot 4.3
(GDScript, standard build)**, reusing the Blender asset library from the web
version. Written in GDScript specifically so it can **export to the web** —
Godot's C#/.NET target cannot export to HTML5, GDScript can.

> ⚠️ **Authored headlessly.** These scripts were written without a Godot editor
> to run them, so treat the first editor open / first CI run as the real test.
> Expect small fixes. The CI pipeline (`.github/workflows/godot-web.yml`) is the
> live compile-and-export check.

## Prerequisites
- **Godot 4.3 — standard build** (NOT the .NET/mono build; this is GDScript)

## Open & run locally
```bash
# open this folder's project.godot in Godot 4.3, or:
godot --path godot            # run the game headlessly-launched editor
```
On first open Godot imports every `assets/models/*.glb`. Press **F5 / Play** —
`scenes/Main.tscn` runs `scripts/GameRoot.gd`.

## Controls
- **Pan** WASD / arrows   **Rotate** Q / E   **Zoom** wheel
- **Select** left-click   **Box-select** left-drag
- **Move** right-click ground   **Attack** right-click an enemy
- **Gather** select villagers (amber rings), right-click a resource node
- **Control groups** Ctrl+1–9 assign, 1–9 recall

## Playing on the web
Every push to `main` that touches `godot/` triggers `.github/workflows/godot-web.yml`,
which exports an HTML5 build and deploys it to **GitHub Pages**. One-time setup:
enable Pages with **Settings → Pages → Build and deployment → Source: GitHub
Actions**. The game then lives at `https://<user>.github.io/<repo>/`.

The export is **single-threaded** (`variant/thread_support=false`) so it runs on
GitHub Pages without cross-origin-isolation headers. If the page ever errors on
`SharedArrayBuffer`, that toggle (or a COOP/COEP service worker) is the fix.

## What's here
```
project.godot                 # Godot 4.3, GDScript, GL Compatibility renderer (WebGL2)
export_presets.cfg            # "Web" HTML5 export preset
scenes/Main.tscn              # root Node3D → GameRoot.gd
scripts/
  GameEnums.gd                # ZoneType / AnimalKind / ResourceKind enums
  GameState.gd  (autoload)    # city grid + ComputeIncome + 3s tick (+ inner data classes)
  MatchEconomy.gd (autoload)  # RTS resource ledger (Food/Wood/Stone/Gold) + population
  GameRoot.gd                 # world setup: env, sun, navmesh, board, camera, spawns, HUD
  Board.gd                    # renders the GameState grid (tiles + building .glb)
  RtsCamera.gd                # orthographic pan / rotate / zoom rig
  Unit.gd                     # base actor: select ring, HP bar, nav, combat brain
  Villager.gd                 # extends Unit; gather state machine (M4)
  ResourceNode.gd / DropOff.gd# gatherable nodes + drop-off building
  SelectionManager.gd         # click/drag select, right-click move/attack/gather, groups
  SelectionBox.gd             # drag-rectangle overlay
  ResourceHud.gd              # top resource/pop bar
assets/models/*.glb           # 16 models ported verbatim from the web game
```

Milestones **M0–M4** are implemented (board & economy, RTS control loop, navmesh
pathfinding + box-select, combat + control groups, villager gathering). See
`RTS_ROADMAP.md`.

## Why the asset reuse is a big deal
Godot imports **glTF (.glb) natively**, so the entire model library transfers
directly with materials intact — no re-modelling.

## Note
The other **playable** version of Tamilan Legacy is the web city-builder at the
repo root (React + Three.js), deployed separately to Vercel. This Godot project
is the RTS line of development.
