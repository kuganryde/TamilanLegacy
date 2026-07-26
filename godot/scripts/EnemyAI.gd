class_name EnemyAI
extends Node
# A simple skirmish opponent (M6). It runs an abstract war-economy (income that
# stands in for gathering), trains warriors at its Barracks/Town Centre on a
# budget, and periodically forms the idle war-band into an attack wave aimed at
# the player's Town Centre. It also tasks its starting villagers to gather, so
# the enemy base visibly works.

const WARRIOR_COST := 40.0
const ARMY_CAP := 16
const TRAIN_EVERY := 4.0
const WAVE_EVERY := 26.0

var _resources := 60.0
var _income := 7.0          # abstract "gathering" per second
var _train_t := 4.0
var _wave_t := 22.0
var _wave_num := 0

func _ready() -> void:
	call_deferred("_assign_gatherers")

func _process(delta: float) -> void:
	_resources += _income * delta

	_train_t -= delta
	if _train_t <= 0.0:
		_train_t = TRAIN_EVERY
		_try_train()

	_wave_t -= delta
	if _wave_t <= 0.0:
		_wave_t = WAVE_EVERY
		_launch_wave()

# ---- economy / production --------------------------------------------------
func _try_train() -> void:
	if _resources < WARRIOR_COST or _enemy_unit_count() >= ARMY_CAP:
		return
	var b = _find_enemy_building(Building.Kind.BARRACKS)
	if b == null:
		b = _find_enemy_building(Building.Kind.TOWN_CENTER)
	if b != null and b.queue_train(Building.Train.WARRIOR):
		_resources -= WARRIOR_COST

func _assign_gatherers() -> void:
	for node in get_tree().get_nodes_in_group("units"):
		if node is Villager and node.enemy and node.health > 0:
			var r = _nearest_resource(node)
			if r != null:
				node.gather_from(r)

# ---- attack waves ----------------------------------------------------------
func _launch_wave() -> void:
	var tc = _player_town_center()
	if tc == null:
		return
	var band: Array = []
	for node in get_tree().get_nodes_in_group("units"):
		if node is Unit and node.enemy and node.health > 0 \
				and node.attack_damage > 0 and not (node is Villager):
			band.append(node)
	if band.size() < 3:
		return
	for u in band:
		u.attack_target(tc)
	_wave_num += 1
	if Toast:
		Toast.push("War-band %d marches on your Town Centre!" % _wave_num, Color(0.98, 0.5, 0.4))

# ---- lookups (duck-typed on group nodes) -----------------------------------
func _enemy_unit_count() -> int:
	var n := 0
	for node in get_tree().get_nodes_in_group("units"):
		if node is Unit and node.enemy and node.health > 0:
			n += 1
	return n

func _find_enemy_building(kind: int):
	for node in get_tree().get_nodes_in_group("buildings"):
		if node is Building and node.enemy and node.health > 0 and node.kind == kind:
			return node
	return null

func _player_town_center():
	for node in get_tree().get_nodes_in_group("buildings"):
		if node is Building and not node.enemy and node.health > 0 \
				and node.kind == Building.Kind.TOWN_CENTER:
			return node
	return null

func _nearest_resource(from: Node3D):
	var best = null
	var best_d := INF
	for node in get_tree().get_nodes_in_group("resources"):
		if not (node is Node3D):
			continue
		var d := from.global_position.distance_to(node.global_position)
		if d < best_d:
			best_d = d
			best = node
	return best
