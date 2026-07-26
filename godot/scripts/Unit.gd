class_name Unit
extends Node3D
# A selectable, commandable RTS actor. Owns the shared scaffolding — selection
# ring, health + health bar, NavigationAgent3D routing, steering helpers — and a
# default *combat* brain (M3). Villager (M4) extends it and overrides _think()
# with a gather brain instead of fighting.
#
# GDScript has no virtual/override keywords: subclasses override by redefining
# the same method name; _physics_process dispatches to the subclass _think().

@export var speed := 3.5
@export var enemy := false
@export var max_health := 50.0
@export var attack_damage := 6.0
@export var attack_range := 1.1
@export var attack_cooldown := 1.1
@export var aggro_range := 5.0

var health := 0.0

var _move_target       # Vector3 or null
var _attack_target = null        # Unit or Building (duck-typed: health, take_damage)
var _cooldown := 0.0
var _agent: NavigationAgent3D
var _ring: MeshInstance3D
var _hp_fill: MeshInstance3D

var selected: bool:
	get:
		return _ring != null and _ring.visible
	set(value):
		if _ring != null:
			_ring.visible = value

func _ready() -> void:
	add_to_group("units")
	if not enemy:
		add_to_group("pop")   # counts against player population
	health = max_health

	_agent = NavigationAgent3D.new()
	_agent.radius = 0.3
	_agent.path_desired_distance = 0.25
	_agent.target_desired_distance = 0.25
	add_child(_agent)

	var model := _load_model()
	if model != null:
		add_child(model)

	_ring = MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 0.34
	torus.outer_radius = 0.42
	_ring.mesh = torus
	_ring.position = Vector3(0, 0.06, 0)
	_ring.visible = false
	var ring_mat := StandardMaterial3D.new()
	ring_mat.albedo_color = _ring_color()
	ring_mat.emission_enabled = true
	ring_mat.emission = _ring_color() * 0.5
	_ring.material_override = ring_mat
	add_child(_ring)

	# billboarded health bar
	_hp_fill = MeshInstance3D.new()
	var quad := QuadMesh.new()
	quad.size = Vector2(0.5, 0.07)
	_hp_fill.mesh = quad
	_hp_fill.position = Vector3(0, 0.66, 0)
	var hp_mat := StandardMaterial3D.new()
	hp_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	hp_mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	hp_mat.albedo_color = Color(0.3, 0.9, 0.3)
	_hp_fill.material_override = hp_mat
	add_child(_hp_fill)

# Overridable so subclasses (Villager) can pick a different model/scale.
func _load_model() -> Node3D:
	var path := "res://assets/models/sangam_spearman_rig.glb" if enemy \
		else "res://assets/models/sangam_warrior_rig.glb"
	var packed := ResourceLoader.load(path) as PackedScene
	if packed == null:
		return null
	var model := packed.instantiate() as Node3D
	model.scale = Vector3.ONE * 0.3
	return model

func _ring_color() -> Color:
	return Color(0.95, 0.25, 0.2) if enemy else Color(0.25, 0.8, 1.0)

# ---- commands --------------------------------------------------------------
func move_to(point: Vector3) -> void:
	_move_target = point
	_attack_target = null
	_agent.target_position = point

func attack_target(t) -> void:
	_attack_target = t
	_move_target = null

func take_damage(dmg: float) -> void:
	health = max(0.0, health - dmg)
	_update_hp_bar()
	if health <= 0.0:
		_die()

func _die() -> void:
	if is_queued_for_deletion():
		return
	remove_from_group("units")
	remove_from_group("pop")
	if Econ:
		Econ.notify_changed()
	queue_free()

# ---- brain -----------------------------------------------------------------
func _physics_process(delta: float) -> void:
	_cooldown -= delta
	_think(delta)

# Default brain = combat. Villager replaces this with gathering.
func _think(delta: float) -> void:
	# 1) attack an assigned/valid target
	if _attack_target != null and is_instance_valid(_attack_target) and _attack_target.health > 0:
		var tp: Vector3 = _attack_target.global_position
		if _flat_dist(global_position, tp) > attack_range:
			_step_direct(tp, delta)
		else:
			_face(tp)
			if _cooldown <= 0.0:
				_cooldown = attack_cooldown
				_attack_target.take_damage(attack_damage)
		return
	_attack_target = null

	# 2) move command (navmesh)
	if _move_target != null:
		var mv: Vector3 = _move_target
		if _flat_dist(global_position, mv) < 0.08:
			_move_target = null
			return
		var aim: Vector3 = mv if _agent.is_navigation_finished() else _agent.get_next_path_position()
		_step_direct(aim, delta)
		return

	# 3) idle -> auto-acquire the nearest foe
	_acquire_target()

func _acquire_target() -> void:
	var best: Unit = null
	var best_dist := aggro_range
	for node in get_tree().get_nodes_in_group("units"):
		var u := node as Unit
		if u == null or u == self or u.enemy == enemy or u.health <= 0:
			continue
		if u is Villager:            # don't chase harmless gatherers by default
			continue
		var d := _flat_dist(global_position, u.global_position)
		if d < best_dist:
			best_dist = d
			best = u
	if best != null:
		_attack_target = best
		return
	# Enemy fighters with nothing to fight march on the nearest player building,
	# so the player can actually be defeated (basic aggression pending full AI).
	_attack_target = _nearest_enemy_building() if (enemy and attack_damage > 0) else null

func _nearest_enemy_building():
	# Duck-typed (no static Building reference) to avoid a Unit<->Building cyclic
	# class dependency. Nodes in "buildings" expose enemy/health/global_position.
	var best = null
	var best_dist := INF
	for node in get_tree().get_nodes_in_group("buildings"):
		if not (node is Node3D) or node.enemy == enemy or node.health <= 0:
			continue
		var d := _flat_dist(global_position, node.global_position)
		if d < best_dist:
			best_dist = d
			best = node
	return best

# ---- helpers ---------------------------------------------------------------
# Steer straight at a world target this frame and face travel. Returns the
# remaining flat distance *before* the step (so callers can detect arrival).
func _step_direct(world_target: Vector3, delta: float) -> float:
	var step := world_target - global_position
	step.y = 0
	var length := step.length()
	if length < 0.0001:
		return 0.0
	var dir := step / length
	global_position += dir * min(speed * delta, length)
	rotation = Vector3(0, atan2(dir.x, dir.z), 0)
	return length

func _face(world_target: Vector3) -> void:
	var d := world_target - global_position
	if is_zero_approx(d.x) and is_zero_approx(d.z):
		return
	rotation = Vector3(0, atan2(d.x, d.z), 0)

func _update_hp_bar() -> void:
	var r := clampf(health / max_health, 0.0, 1.0)
	_hp_fill.scale = Vector3(r, 1, 1)
	var mat := _hp_fill.material_override as StandardMaterial3D
	mat.albedo_color = Color(1.0 - r, 0.2 + 0.7 * r, 0.2)  # green -> red

static func _flat_dist(a: Vector3, b: Vector3) -> float:
	return Vector2(a.x - b.x, a.z - b.z).length()
