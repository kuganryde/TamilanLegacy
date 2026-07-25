# Tamilan Legacy — Godot rebuild (scaffold)

A starting point for rebuilding **Tamilan Legacy** in **Godot 4.3 (mono / C#)**,
reusing the Blender asset library from the web version.

> ⚠️ **Untested scaffold.** This was generated in a headless environment with
> no Godot/.NET installed, so **nothing here has been compiled or run**. Open it
> in the Godot editor to import the models, build the C# assembly, and verify.
> Expect to fix small issues on first open — that's normal for a blind scaffold.

## Prerequisites
- **Godot 4.3+ — .NET/mono edition** (the C# build; GDScript-only won't compile C#)
- **.NET 8 SDK**

## Open & run
```bash
# from this folder
godot-cli build .        # optional: dotnet build so the C# assembly exists
godot-cli open .         # or just open project.godot in the Godot editor
```
On first open Godot imports every `assets/models/*.glb` (generates `.import`
files) and builds the C# project. Press **F5 / Play** — `scenes/Main.tscn` runs
`scripts/GameRoot.cs`, which sets up an orthographic isometric camera + sun and
drops a showcase of the models onto a ground plane.

## What's here
```
project.godot                 # Godot 4.3, C#, main scene = scenes/Main.tscn
tamilanlegacy-godot.csproj    # Godot.NET.Sdk 4.3.0, net8.0
scenes/Main.tscn              # root Node3D + GameRoot.cs
scripts/GameRoot.cs           # builds the board + instantiates models at runtime
assets/models/*.glb           # 16 models ported verbatim from the web game
```

## Why the asset reuse is a big deal
Godot imports **glTF (.glb) natively**, so the entire model library — gopuram,
market, warehouse, shipyard, barracks, quarry, elephant, ox, palm, and the
Sangam warrior / archer / spearman / cavalry / scholar (plus the rigged
warrior/spearman) — transfers **directly**, with materials intact. No
re-modelling. That's the biggest head start a port could ask for.

## Porting roadmap (web → Godot)

| Web (React + Three.js) | Godot (C#) approach |
|---|---|
| `Nagara3D.tsx` board + orbit/zoom | `GameRoot` Node3D + `Camera3D` (orthogonal) + `Camera3D` orbit script; raycast via `PhysicsRayQueryParameters3D` or `Camera3D.ProjectRayOrigin` |
| Procedural build/animals/animation | Reuse `.glb`; drive limbs via `AnimationPlayer` or the same procedural quaternion approach on named bones/nodes |
| Grid `GridCell[]` + `computeIncome()` | `GameState` autoload (singleton) holding the grid + a `_Process(delta)` income tick |
| React state / `localStorage` | Godot `Resource` save files (`ResourceSaver` / JSON) or an autoload with `user://` save |
| HUD (resource pillars, rates) | `CanvasLayer` + `Control` UI (`Label`, `TextureRect`, `ProgressBar`) |
| Toasts | A `Control` toast stack + `Tween` in/out |
| Tabs (Campaign/Grid/Port/Tech/Army) | `TabContainer` or scene-swapped `Control` panels |
| War Council recruiting / army | `GameState.Army` + a recruiting UI scene |
| Sound engine (bell/yazh/drum) | `AudioStreamPlayer` + generated/`.wav` assets |

## Optional: AI-assisted editing (Godot-MCP / Summer Engine)
Both connect an AI agent to the running Godot editor. Pick **one** (they
overlap) so you don't run a duplicated toolchain:
```bash
godot-cli install-plugin .            # adds the godot_mcp addon + NuGet deps
godot-cli login                        # OAuth device-flow sign-in
godot-cli setup-mcp claude-code .      # writes the Claude Code MCP config
godot-cli open .
```

## Note
The canonical, **playable** version of Tamilan Legacy is still the web game at
`github.com/kuganryde/TamilanLegacy` (React + Three.js). This Godot project is a
parallel exploration — keep the web version as the source of truth until the
port reaches parity.
