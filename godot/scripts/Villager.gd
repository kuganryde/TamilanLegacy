class_name Villager
extends Unit
# A gatherer (M4). Inherits Unit's selection / movement / nav scaffolding but
# swaps the combat brain for an economy loop: walk to a ResourceNode, harvest
# until full or the node is exhausted, carry the load to the nearest DropOff,
# bank it into the economy, and repeat. Villagers don't fight and aren't
# auto-targeted by enemy aggro (see Unit._acquire_target).

enum VState { IDLE, TO_RESOURCE, GATHERING, RETURNING }

const CAPACITY := 10.0      # carry limit
const GATHER_RATE := 6.0    # resource units / second
const GATHER_REACH := 1.0   # stand-off distance at a node
const DROP_REACH := 1.3     # stand-off distance at a drop-off

var _state: int = VState.IDLE
var _node: ResourceNode = null
var _carry_kind: int = GameEnums.ResourceKind.FOOD
var _carry := 0.0

func _load_model() -> Node3D:
	# Reuse the warrior rig at a smaller scale as a stand-in villager body;
	# a dedicated civilian model is a later art pass.
	var packed := ResourceLoader.load("res://assets/models/sangam_warrior_rig.glb") as PackedScene
	if packed == null:
		return null
	var model := packed.instantiate() as Node3D
	model.scale = Vector3.ONE * 0.24
	return model

func _ring_color() -> Color:
	return Color(0.95, 0.78, 0.25)  # amber = civilian

# Villagers are fragile and unarmed.
func _ready() -> void:
	max_health = 25.0
	attack_damage = 0.0
	aggro_range = 0.0
	super._ready()

# Right-click a resource -> gather it.
func gather_from(node: ResourceNode) -> void:
	_node = node
	_move_target = null
	_state = VState.RETURNING if _carry > 0.0 else VState.TO_RESOURCE

# A manual move order cancels the gather job.
func move_to(point: Vector3) -> void:
	_node = null
	_state = VState.IDLE
	super.move_to(point)

# Villagers ignore attack orders.
func attack_target(_t) -> void:
	pass

func _think(delta: float) -> void:
	# A manual relocation takes precedence over any gather job.
	if _move_target != null:
		var mv: Vector3 = _move_target
		if _flat_dist(global_position, mv) < 0.1:
			_move_target = null
			return
		var aim: Vector3 = mv if _agent.is_navigation_finished() else _agent.get_next_path_position()
		_step_direct(aim, delta)
		return

	match _state:
		VState.IDLE:
			if _node_usable(_node):
				_state = VState.TO_RESOURCE

		VState.TO_RESOURCE:
			if not _node_usable(_node):
				_node = _find_nearest_resource(_carry_kind)
				if _node == null:
					_state = VState.IDLE
					return
			if _flat_dist(global_position, _node.global_position) <= GATHER_REACH:
				_state = VState.GATHERING
			else:
				_step_direct(_node.global_position, delta)

		VState.GATHERING:
			if not _node_usable(_node):
				_state = VState.RETURNING if _carry > 0.0 else VState.IDLE
				return
			_face(_node.global_position)
			_carry_kind = _node.kind
			_carry += _node.gather(GATHER_RATE * delta)
			if _carry >= CAPACITY or not is_instance_valid(_node) or _node.depleted():
				_state = VState.RETURNING

		VState.RETURNING:
			var drop := _find_nearest_dropoff()
			if drop == null:
				_state = VState.IDLE
				return
			if _flat_dist(global_position, drop.global_position) <= DROP_REACH:
				if Econ:
					Econ.deposit(_carry_kind, roundi(_carry))
				_carry = 0.0
				if _node_usable(_node):
					_state = VState.TO_RESOURCE
				else:
					_node = _find_nearest_resource(_carry_kind)
					_state = VState.TO_RESOURCE if _node != null else VState.IDLE
			else:
				_step_direct(drop.global_position, delta)

func _node_usable(n: ResourceNode) -> bool:
	return n != null and is_instance_valid(n) and not n.depleted()

func _find_nearest_resource(kind: int) -> ResourceNode:
	var best: ResourceNode = null
	var best_dist := INF
	for node in get_tree().get_nodes_in_group("resources"):
		var r := node as ResourceNode
		if r == null or r.depleted() or r.kind != kind:
			continue
		var d := _flat_dist(global_position, r.global_position)
		if d < best_dist:
			best_dist = d
			best = r
	return best

func _find_nearest_dropoff() -> Node3D:
	var best: Node3D = null
	var best_dist := INF
	for node in get_tree().get_nodes_in_group("dropoff"):
		var d3 := node as Node3D
		if d3 == null:
			continue
		if ("enemy" in d3) and d3.enemy:
			continue                              # only bank at friendly drop-offs
		var dist := _flat_dist(global_position, d3.global_position)
		if dist < best_dist:
			best_dist = dist
			best = d3
	return best
