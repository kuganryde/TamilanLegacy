class_name Board
extends Node3D
# Renders the GameState grid as a 3D isometric board: one tile per cell plus the
# matching .glb building model. Rebuilds whenever GameState emits `changed`.
# Full rebuild each time — fine for an 8x8 board; optimise later.

const MODELS_DIR := "res://assets/models/"

func _ready() -> void:
	GameState.changed.connect(_rebuild)
	_rebuild()

func _exit_tree() -> void:
	if GameState.changed.is_connected(_rebuild):
		GameState.changed.disconnect(_rebuild)

static func _world_x(col: int) -> float:
	return col - (GameState.GRID - 1) / 2.0

static func _world_z(row: int) -> float:
	return row - (GameState.GRID - 1) / 2.0

func _rebuild() -> void:
	for child in get_children():
		child.queue_free()

	for cell in GameState.cells:
		var origin := Vector3(_world_x(cell.col), 0, _world_z(cell.row))

		# tile
		var tile := MeshInstance3D.new()
		var box := BoxMesh.new()
		box.size = Vector3(0.96, 0.12, 0.96)
		tile.mesh = box
		var mat := StandardMaterial3D.new()
		mat.albedo_color = _tile_color(cell)
		tile.material_override = mat
		tile.position = origin + Vector3(0, -0.06, 0)
		add_child(tile)

		# building model
		var model := _model_for(cell.type)
		if model != "":
			var packed := ResourceLoader.load(MODELS_DIR + model) as PackedScene
			if packed != null:
				var node := packed.instantiate() as Node3D
				node.position = origin
				var lvl := 1 if cell.level < 1 else cell.level
				node.scale = Vector3.ONE * (0.86 + (lvl - 1) * 0.15)
				add_child(node)

static func _model_for(t: int) -> String:
	match t:
		GameEnums.ZoneType.KOVIL: return "gopuram.glb"
		GameEnums.ZoneType.NAGAR: return "market.glb"
		GameEnums.ZoneType.QUARRY: return "quarry.glb"
		GameEnums.ZoneType.SHIPYARD: return "shipyard.glb"
		GameEnums.ZoneType.WAREHOUSE: return "warehouse.glb"
		GameEnums.ZoneType.BARRACKS: return "barracks.glb"
		_: return ""

static func _tile_color(c) -> Color:
	match c.type:
		GameEnums.ZoneType.RIVER:
			return Color(0.18, 0.47, 0.63)
		GameEnums.ZoneType.UR:
			return Color(0.31, 0.49, 0.16) if c.has_water else Color(0.55, 0.50, 0.20)
		GameEnums.ZoneType.QUARRY:
			return Color(0.43, 0.40, 0.37)
		GameEnums.ZoneType.NAGAR, GameEnums.ZoneType.KOVIL, GameEnums.ZoneType.ERI, \
		GameEnums.ZoneType.SHIPYARD, GameEnums.ZoneType.WAREHOUSE, GameEnums.ZoneType.BARRACKS:
			return Color(0.61, 0.52, 0.32)
		_:
			return Color(0.48, 0.64, 0.29) if (c.row + c.col) % 2 == 0 else Color(0.44, 0.60, 0.25)
