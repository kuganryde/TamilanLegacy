extends Node
# RTS match economy: the Age-of-Empires-style resource ledger (Food/Wood/Stone/
# Gold) plus population. Villagers deposit gathered resources here; the HUD
# reads it. Separate from GameState (the ported city-builder Four-Pillars
# economy). Registered in project.godot [autoload] as "Match".

var food := 120
var wood := 80
var stone := 60
var gold := 40

# Population is the live count of player-owned units (group "pop"); pop_cap
# grows as houses/town-centres are built (M5). Fixed for now.
var pop_cap := 15

signal changed

func pop() -> int:
	return get_tree().get_nodes_in_group("pop").size() if is_inside_tree() else 0

func amount(kind: int) -> int:
	match kind:
		GameEnums.ResourceKind.FOOD: return food
		GameEnums.ResourceKind.WOOD: return wood
		GameEnums.ResourceKind.STONE: return stone
		GameEnums.ResourceKind.GOLD: return gold
		_: return 0

func deposit(kind: int, quantity: int) -> void:
	if quantity <= 0:
		return
	match kind:
		GameEnums.ResourceKind.FOOD: food += quantity
		GameEnums.ResourceKind.WOOD: wood += quantity
		GameEnums.ResourceKind.STONE: stone += quantity
		GameEnums.ResourceKind.GOLD: gold += quantity
	changed.emit()

# Spend resources if affordable; returns false (spends nothing) if not.
# Used by training/building in later milestones.
func try_spend(f := 0, w := 0, s := 0, g := 0) -> bool:
	if food < f or wood < w or stone < s or gold < g:
		return false
	food -= f; wood -= w; stone -= s; gold -= g
	changed.emit()
	return true

func has_pop_room() -> bool:
	return pop() < pop_cap

# Poke the HUD when something outside the ledger changes (pop, cap).
func notify_changed() -> void:
	changed.emit()
