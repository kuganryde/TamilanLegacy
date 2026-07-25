extends Node3D
# Root of the Godot RTS. Builds the board, camera, selection, units, and the M4
# economy at runtime, and bakes a navmesh so units path around the city.

var _nav: NavigationRegion3D

func _ready() -> void:
	_setup_environment()
	_setup_sun()

	# Navigation region: ground + buildings are bake sources so units path
	# around the city. Units live outside it (they're agents, not geometry).
	_nav = NavigationRegion3D.new()
	var nm := NavigationMesh.new()
	nm.cell_size = 0.15
	nm.cell_height = 0.15
	nm.agent_radius = 0.35
	nm.agent_height = 1.2
	nm.agent_max_slope = 45.0
	_nav.navigation_mesh = nm
	add_child(_nav)

	_build_ground(16, 16)             # added under _nav
	_nav.add_child(Board.new())       # city tiles + building .glb

	add_child(RtsCamera.new())        # AoE-style pan / rotate / zoom
	add_child(SelectionManager.new()) # click / drag-box select, right-click move / gather
	_spawn_units()
	_spawn_economy()                  # villagers, resource nodes, drop-off (M4)
	add_child(ResourceHud.new())      # top resource/pop bar (M4)

	# Bake once the geometry exists. If the bake is empty, units fall back to
	# direct movement — so the game is playable either way.
	call_deferred("_bake_nav")

func _bake_nav() -> void:
	_nav.bake_navigation_mesh()

func _spawn_units() -> void:
	for i in range(5):
		var u := Unit.new()
		u.position = Vector3(-3.5 + i * 0.9, 0, 4.5)
		add_child(u)
	for i in range(4):
		var e := Unit.new()
		e.enemy = true
		e.position = Vector3(1.5 + i * 0.9, 0, -4.5)
		add_child(e)

# M4: a small working economy on the open ground south of the city — a drop-off,
# resource nodes, and villagers ready to be tasked (right-click a node with
# villagers selected).
func _spawn_economy() -> void:
	var drop := DropOff.new()
	drop.position = Vector3(-1.5, 0, 5.0)
	add_child(drop)

	_spawn_resource(GameEnums.ResourceKind.STONE, 220, Vector3(2.6, 0, 5.4))
	_spawn_resource(GameEnums.ResourceKind.STONE, 220, Vector3(3.3, 0, 6.1))
	_spawn_resource(GameEnums.ResourceKind.WOOD, 260, Vector3(-4.2, 0, 5.6))
	_spawn_resource(GameEnums.ResourceKind.WOOD, 260, Vector3(-4.6, 0, 6.4))
	_spawn_resource(GameEnums.ResourceKind.WOOD, 260, Vector3(-3.6, 0, 6.7))
	_spawn_resource(GameEnums.ResourceKind.FOOD, 180, Vector3(0.2, 0, 6.6))
	_spawn_resource(GameEnums.ResourceKind.FOOD, 180, Vector3(0.9, 0, 7.0))
	_spawn_resource(GameEnums.ResourceKind.GOLD, 150, Vector3(4.6, 0, 5.2))

	for i in range(4):
		var v := Villager.new()
		v.position = Vector3(-2.6 + i * 0.7, 0, 4.0)
		add_child(v)

func _spawn_resource(kind: int, amount: float, pos: Vector3) -> void:
	var rn := ResourceNode.new()
	rn.kind = kind
	rn.amount = amount
	rn.position = pos
	add_child(rn)

func _setup_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.07, 0.07, 0.09)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.50, 0.55, 0.62)
	env.ambient_light_energy = 0.6
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

func _setup_sun() -> void:
	var sun := DirectionalLight3D.new()
	sun.shadow_enabled = true
	sun.light_energy = 1.2
	sun.light_color = Color(1.0, 0.94, 0.82)
	sun.rotation_degrees = Vector3(-55, -40, 0)
	add_child(sun)

func _build_ground(cols: int, rows: int) -> void:
	var mi := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(cols, rows)
	mi.mesh = plane
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.30, 0.42, 0.20)
	mi.material_override = mat
	mi.position = Vector3(0, -0.06, 0)
	_nav.add_child(mi)   # bake source for the navmesh floor
