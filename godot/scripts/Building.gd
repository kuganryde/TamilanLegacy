class_name Building
extends Node3D
# A team-owned, destructible structure (M5). Town Centres and Barracks train
# units by spending resources; Houses raise the player population cap; the Town
# Centre is also a resource drop-off. Buildings have HP and a health bar and can
# be attacked by units — destroying a Town Centre ends the match.

enum Kind { TOWN_CENTER, BARRACKS, HOUSE }
enum Train { VILLAGER, WARRIOR }

const MODELS_DIR := "res://assets/models/"

@export var enemy := false
@export var kind: int = Kind.HOUSE
@export var max_health := 600.0

var health := 0.0
var _hp_fill: MeshInstance3D
var _ring: MeshInstance3D
var _queue: Array[int] = []      # queued Train kinds
var _train_left := 0.0           # seconds remaining on the current item
var _train_total := 0.0

func _ready() -> void:
	add_to_group("buildings")
	add_to_group("targets")
	if kind == Kind.TOWN_CENTER:
		add_to_group("dropoff")
	if kind == Kind.HOUSE and not enemy:
		add_to_group("house")       # raises the player pop cap
	max_health = default_health(kind)
	health = max_health

	var model := _load_model()
	if model != null:
		add_child(model)
	if kind == Kind.TOWN_CENTER:
		_add_compound()

	_ring = _make_ring()
	add_child(_ring)

	_hp_fill = _make_hp_bar()
	add_child(_hp_fill)
	_update_hp_bar()

# ---- what this building can train ------------------------------------------
func trainables() -> Array:
	match kind:
		Kind.TOWN_CENTER: return [Train.VILLAGER]
		Kind.BARRACKS: return [Train.WARRIOR]
		_: return []

static func train_label(t: int) -> String:
	return "Villager" if t == Train.VILLAGER else "Warrior"

static func train_cost(t: int) -> Dictionary:
	# food / wood / stone / gold
	return {"food": 50} if t == Train.VILLAGER else {"food": 40, "wood": 20}

static func train_seconds(t: int) -> float:
	return 6.0 if t == Train.VILLAGER else 8.0

# ---- placement (villager-built structures) ---------------------------------
static func default_health(k: int) -> float:
	match k:
		Kind.TOWN_CENTER: return 900.0
		Kind.BARRACKS: return 500.0
		_: return 350.0

static func build_label(k: int) -> String:
	match k:
		Kind.BARRACKS: return "Barracks"
		Kind.HOUSE: return "House"
		_: return "Town Centre"

static func build_cost(k: int) -> Dictionary:
	match k:
		Kind.HOUSE: return {"wood": 30}
		Kind.BARRACKS: return {"wood": 60, "stone": 20}
		_: return {}

# Queue a unit if affordable and under the pop cap. Returns false otherwise.
func queue_train(t: int) -> bool:
	if not trainables().has(t):
		return false
	# The player pays resources and respects the pop cap; the enemy AI trains on
	# its own budget (handled in EnemyAI), so enemy buildings skip these checks.
	if not enemy:
		if Econ == null or not Econ.has_pop_room():
			return false
		var c: Dictionary = train_cost(t)
		if not Econ.try_spend(c.get("food", 0), c.get("wood", 0), c.get("stone", 0), c.get("gold", 0)):
			return false
	_queue.append(t)
	if _train_left <= 0.0:
		_start_next()
	return true

func _start_next() -> void:
	if _queue.is_empty():
		_train_left = 0.0
		return
	_train_total = train_seconds(_queue[0])
	_train_left = _train_total

func _process(delta: float) -> void:
	if _train_left > 0.0:
		_train_left -= delta
		if _train_left <= 0.0:
			var t: int = _queue.pop_front()
			_spawn_trained(t)
			_start_next()

func training_progress() -> float:
	return 0.0 if _train_total <= 0.0 else clampf(1.0 - _train_left / _train_total, 0.0, 1.0)

func queue_size() -> int:
	return _queue.size()

func _spawn_trained(t: int) -> void:
	var unit: Unit
	if t == Train.VILLAGER:
		unit = Villager.new()
	else:
		unit = Unit.new()
	unit.enemy = enemy
	# Rally just in front of the building, toward the owner's side of the map.
	var forward := 1.6 if not enemy else -1.6
	unit.position = global_position + Vector3(randf_range(-0.5, 0.5), 0, forward)
	get_parent().add_child(unit)
	if not enemy and Toast:
		Toast.push("%s ready" % train_label(t), Color(0.6, 0.9, 1.0))

# ---- damage / death --------------------------------------------------------
func take_damage(dmg: float) -> void:
	health = max(0.0, health - dmg)
	_update_hp_bar()
	if health <= 0.0:
		_die()

func _die() -> void:
	if is_queued_for_deletion():
		return
	remove_from_group("buildings")
	remove_from_group("targets")
	remove_from_group("dropoff")
	remove_from_group("house")
	if kind == Kind.TOWN_CENTER and Econ:
		Econ.report_town_center_destroyed(enemy)
	if Econ:
		Econ.notify_changed()   # pop cap may have dropped (house lost)
	queue_free()

# ---- visuals ---------------------------------------------------------------
func _load_model() -> Node3D:
	var glb := "gopuram.glb"
	var s := 1.15
	match kind:
		Kind.TOWN_CENTER: glb = "gopuram.glb"; s = 1.25
		Kind.BARRACKS: glb = "barracks.glb"; s = 1.1
		Kind.HOUSE: glb = "market.glb"; s = 0.9
	var packed := ResourceLoader.load(MODELS_DIR + glb) as PackedScene
	if packed == null:
		return null
	var node := packed.instantiate() as Node3D
	node.scale = Vector3.ONE * s
	return node

# A brick prakara (compound wall) around the temple with a front gateway gap —
# the walled-temple silhouette from the concept art.
func _add_compound() -> void:
	var half := 2.3
	var h := 0.85
	var t := 0.26
	var brick := Color(0.62, 0.3, 0.2)
	add_child(_wall(Vector3(half * 2 + t, h, t), Vector3(0, h * 0.5, -half), brick))   # back
	add_child(_wall(Vector3(t, h, half * 2), Vector3(-half, h * 0.5, 0), brick))       # west
	add_child(_wall(Vector3(t, h, half * 2), Vector3(half, h * 0.5, 0), brick))        # east
	add_child(_wall(Vector3(1.7, h, t), Vector3(-1.45, h * 0.5, half), brick))         # front-left
	add_child(_wall(Vector3(1.7, h, t), Vector3(1.45, h * 0.5, half), brick))          # front-right
	# gate pillars flanking the entrance
	add_child(_wall(Vector3(0.34, h + 0.35, 0.34), Vector3(-0.75, (h + 0.35) * 0.5, half), Color(0.68, 0.34, 0.22)))
	add_child(_wall(Vector3(0.34, h + 0.35, 0.34), Vector3(0.75, (h + 0.35) * 0.5, half), Color(0.68, 0.34, 0.22)))

func _wall(size: Vector3, pos: Vector3, color: Color) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = size
	mi.mesh = box
	mi.position = pos
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.85
	mi.material_override = mat
	return mi

func _make_ring() -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 0.7
	torus.outer_radius = 0.82
	mi.mesh = torus
	mi.position = Vector3(0, 0.04, 0)
	var mat := StandardMaterial3D.new()
	var col := Color(0.95, 0.35, 0.28) if enemy else Color(0.3, 0.7, 1.0)
	mat.albedo_color = col
	mat.emission_enabled = true
	mat.emission = col * 0.4
	mi.material_override = mat
	return mi

func _make_hp_bar() -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var quad := QuadMesh.new()
	quad.size = Vector2(1.1, 0.1)
	mi.mesh = quad
	mi.position = Vector3(0, 1.5, 0)
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	mat.albedo_color = Color(0.3, 0.9, 0.3)
	mi.material_override = mat
	return mi

func _update_hp_bar() -> void:
	var r := clampf(health / max_health, 0.0, 1.0)
	_hp_fill.scale = Vector3(r, 1, 1)
	var mat := _hp_fill.material_override as StandardMaterial3D
	mat.albedo_color = Color(1.0 - r, 0.2 + 0.7 * r, 0.2)
