class_name Scenery
extends Node3D
# Decorative environment that dresses the RTS map into a living Chola settlement:
# a coastal sea + ships at a dock (west), paddy fields + an Eri tank (east), and
# scattered palms and parade elephants. Purely visual — nothing here joins a
# gameplay group ("units"/"buildings"/"resources"/"dropoff"), so it never
# interferes with selection, combat, gathering, or the navmesh.

const MODELS_DIR := "res://assets/models/"

func _ready() -> void:
	_add_sea()
	_add_dock()
	for z in [-2.4, -0.4, 1.6, 3.6]:
		_add_ship(Vector3(-6.2, 0, z))

	var golden := false
	for x in [5.7, 7.2]:
		for z in [-2.6, -0.6, 1.4]:
			_add_field(Vector3(x, 0, z), golden)
			golden = not golden
	_add_eri(Vector3(6.4, 0, 4.4))

	for p in [Vector3(-6.2, 0, 6.4), Vector3(6.8, 0, -4.6), Vector3(-6.6, 0, -5.6),
			Vector3(7.2, 0, 6.6), Vector3(-5.6, 0, 2.2)]:
		_add_model("palm.glb", p, randf_range(0.8, 1.15), randf_range(0, TAU))

	_add_model("elephant_hi.glb", Vector3(-2.4, 0, 7.2), 0.7, PI)
	_add_model("elephant_hi.glb", Vector3(3.4, 0, 6.9), 0.7, PI * 0.85)

# ---- water & ships ---------------------------------------------------------
func _add_sea() -> void:
	var sea := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(3.2, 0.2, 16.0)
	sea.mesh = box
	sea.position = Vector3(-7.1, -0.13, 0)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.16, 0.42, 0.62, 0.78)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.metallic = 0.25
	mat.roughness = 0.12
	sea.material_override = mat
	add_child(sea)

func _add_dock() -> void:
	var dock := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(1.4, 0.12, 6.0)
	dock.mesh = box
	dock.position = Vector3(-5.5, 0.02, 0.5)
	dock.material_override = _flat(Color(0.42, 0.29, 0.17), 0.85)
	add_child(dock)

func _add_ship(pos: Vector3) -> void:
	var ship := Node3D.new()
	ship.position = pos
	ship.rotation.y = PI * 0.5    # bow toward land (east)

	var hull := MeshInstance3D.new()
	var hull_mesh := BoxMesh.new()
	hull_mesh.size = Vector3(1.8, 0.45, 0.6)
	hull.mesh = hull_mesh
	hull.position.y = 0.28
	hull.material_override = _flat(Color(0.4, 0.25, 0.15), 0.8)
	ship.add_child(hull)

	var mast := MeshInstance3D.new()
	var mast_mesh := CylinderMesh.new()
	mast_mesh.height = 1.6
	mast_mesh.top_radius = 0.04
	mast_mesh.bottom_radius = 0.04
	mast.mesh = mast_mesh
	mast.position = Vector3(0, 1.1, 0)
	mast.material_override = _flat(Color(0.3, 0.2, 0.1), 0.8)
	ship.add_child(mast)

	var sail := MeshInstance3D.new()
	var sail_mesh := BoxMesh.new()
	sail_mesh.size = Vector3(0.05, 1.0, 0.9)
	sail.mesh = sail_mesh
	sail.position = Vector3(0.02, 1.15, 0)
	sail.material_override = _flat(Color(0.9, 0.85, 0.74), 0.6)
	ship.add_child(sail)

	var flag := MeshInstance3D.new()
	var flag_mesh := BoxMesh.new()
	flag_mesh.size = Vector3(0.02, 0.22, 0.34)
	flag.mesh = flag_mesh
	flag.position = Vector3(0, 1.95, 0.12)
	flag.material_override = _flat(Color(0.85, 0.2, 0.18), 0.7)
	ship.add_child(flag)

	add_child(ship)

# ---- fields ----------------------------------------------------------------
func _add_field(pos: Vector3, golden: bool) -> void:
	var field := Node3D.new()
	field.position = pos

	var soil := MeshInstance3D.new()
	var soil_mesh := BoxMesh.new()
	soil_mesh.size = Vector3(1.5, 0.12, 1.5)
	soil.mesh = soil_mesh
	soil.position.y = 0.06
	var base := Color(0.72, 0.62, 0.3) if golden else Color(0.2, 0.5, 0.2)
	soil.material_override = _flat(base, 0.9)
	field.add_child(soil)

	var crop := Color(0.86, 0.74, 0.34) if golden else Color(0.32, 0.66, 0.3)
	for i in range(5):
		var row := MeshInstance3D.new()
		var row_mesh := BoxMesh.new()
		row_mesh.size = Vector3(1.3, 0.18, 0.12)
		row.mesh = row_mesh
		row.position = Vector3(0, 0.18, -0.55 + i * 0.28)
		row.material_override = _flat(crop, 0.85)
		field.add_child(row)

	add_child(field)

# ---- Eri (irrigation tank) -------------------------------------------------
func _add_eri(pos: Vector3) -> void:
	var eri := Node3D.new()
	eri.position = pos
	var w := 2.2
	var d := 1.7
	var wall_h := 0.5
	var t := 0.28

	var water := MeshInstance3D.new()
	var water_mesh := BoxMesh.new()
	water_mesh.size = Vector3(w - t, 0.3, d - t)
	water.mesh = water_mesh
	water.position.y = 0.18
	var wmat := _flat(Color(0.24, 0.55, 0.8, 0.85), 0.85)
	wmat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	water.material_override = wmat
	eri.add_child(water)

	var stone := Color(0.5, 0.5, 0.54)
	eri.add_child(_slab(Vector3(w, wall_h, t), Vector3(0, wall_h * 0.5, -d * 0.5), stone))
	eri.add_child(_slab(Vector3(w, wall_h, t), Vector3(0, wall_h * 0.5, d * 0.5), stone))
	eri.add_child(_slab(Vector3(t, wall_h, d), Vector3(w * 0.5, wall_h * 0.5, 0), stone))
	eri.add_child(_slab(Vector3(t, wall_h, d), Vector3(-w * 0.5, wall_h * 0.5, 0), stone))
	for i in range(3):
		eri.add_child(_slab(Vector3(w * 0.6, 0.14, 0.3),
			Vector3(0, 0.07 + i * 0.14, -d * 0.5 - 0.2 - i * 0.32), stone))
	add_child(eri)

# ---- helpers ---------------------------------------------------------------
func _add_model(glb: String, pos: Vector3, s: float, yaw: float) -> void:
	var packed := ResourceLoader.load(MODELS_DIR + glb) as PackedScene
	if packed == null:
		return
	var node := packed.instantiate() as Node3D
	node.position = pos
	node.scale = Vector3.ONE * s
	node.rotation.y = yaw
	add_child(node)

func _slab(size: Vector3, pos: Vector3, color: Color) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = size
	mi.mesh = box
	mi.position = pos
	mi.material_override = _flat(color, 0.9)
	return mi

func _flat(color: Color, rough: float) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = rough
	return mat
