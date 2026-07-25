class_name SelectionManager
extends Node
# RTS input. Left-click = single select; left-drag = box select (multi);
# right-click on an enemy = attack, on a resource = gather (villagers), on empty
# ground = move in a small formation. Control groups: Ctrl+1..9 assign the
# current selection, 1..9 recall it. Collider-free: units/nodes are picked in
# screen space; the move target is the camera ray / ground-plane (y=0) hit.

const DRAG_THRESHOLD := 8.0   # px before a click becomes a drag
const PICK_RADIUS := 42.0     # px around a click to grab a unit/node

var _selected: Array[Unit] = []
var _groups := {}             # int -> Array[Unit]
var _box: SelectionBox
var _dragging := false
var _drag_start := Vector2.ZERO

func _ready() -> void:
	var layer := CanvasLayer.new()
	_box = SelectionBox.new()
	layer.add_child(_box)
	add_child(layer)

func _unhandled_input(event: InputEvent) -> void:
	var cam := get_viewport().get_camera_3d()
	if cam == null:
		return

	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				_dragging = true
				_drag_start = event.position
			elif _dragging:
				_dragging = false
				if _drag_start.distance_to(event.position) > DRAG_THRESHOLD:
					_box_select(cam, _drag_start, event.position)
				else:
					_single_select(cam, event.position)
				_box.active = false
				_box.queue_redraw()
		elif event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
			# priority: enemy -> attack, resource -> gather, else move
			var foe := _pick_enemy(cam, event.position)
			if foe != null:
				_command_attack(foe)
				return
			var res := _pick_resource(cam, event.position)
			if res != null and _command_gather(res):
				return
			_command_move(cam, event.position)
	elif event is InputEventMouseMotion and _dragging:
		_box.box = _rect_from(_drag_start, event.position)
		_box.active = _box.box.size.length() > DRAG_THRESHOLD
		_box.queue_redraw()
	elif event is InputEventKey and event.pressed and not event.echo:
		_handle_group_key(event)

# ---- control groups (Ctrl+1..9 assign, 1..9 recall) ------------------------
func _handle_group_key(k: InputEventKey) -> void:
	var n := _digit_from(k.keycode)
	if n < 1 or n > 9:
		return
	if k.ctrl_pressed:
		var members: Array[Unit] = []
		for u in _selected:
			if is_instance_valid(u):
				members.append(u)
		_groups[n] = members
	elif _groups.has(n):
		var members: Array = _groups[n]
		_clear_selection()
		for u in members:
			if is_instance_valid(u) and u.health > 0:
				u.selected = true
				_selected.append(u)

func _digit_from(key: int) -> int:
	if key >= KEY_1 and key <= KEY_9:
		return key - KEY_0
	if key >= KEY_KP_1 and key <= KEY_KP_9:
		return key - KEY_KP_0
	return -1

func _clear_selection() -> void:
	for u in _selected:
		if is_instance_valid(u):
			u.selected = false
	_selected.clear()

func _single_select(cam: Camera3D, screen: Vector2) -> void:
	var best: Unit = null
	var best_dist := PICK_RADIUS
	for node in get_tree().get_nodes_in_group("units"):
		var u := node as Unit
		if u == null or u.enemy:
			continue
		var sp := cam.unproject_position(u.global_position + Vector3(0, 0.3, 0))
		var d := sp.distance_to(screen)
		if d < best_dist:
			best_dist = d
			best = u
	_clear_selection()
	if best != null:
		best.selected = true
		_selected.append(best)

func _box_select(cam: Camera3D, a: Vector2, b: Vector2) -> void:
	var rect := _rect_from(a, b)
	_clear_selection()
	for node in get_tree().get_nodes_in_group("units"):
		var u := node as Unit
		if u == null or u.enemy:
			continue
		var sp := cam.unproject_position(u.global_position + Vector3(0, 0.3, 0))
		if rect.has_point(sp):
			u.selected = true
			_selected.append(u)

func _pick_enemy(cam: Camera3D, screen: Vector2) -> Unit:
	var best: Unit = null
	var best_dist := PICK_RADIUS
	for node in get_tree().get_nodes_in_group("units"):
		var u := node as Unit
		if u == null or not u.enemy or u.health <= 0:
			continue
		var sp := cam.unproject_position(u.global_position + Vector3(0, 0.3, 0))
		var d := sp.distance_to(screen)
		if d < best_dist:
			best_dist = d
			best = u
	return best

func _pick_resource(cam: Camera3D, screen: Vector2) -> ResourceNode:
	var best: ResourceNode = null
	var best_dist := PICK_RADIUS
	for node in get_tree().get_nodes_in_group("resources"):
		var r := node as ResourceNode
		if r == null or r.depleted():
			continue
		var sp := cam.unproject_position(r.global_position + Vector3(0, 0.3, 0))
		var d := sp.distance_to(screen)
		if d < best_dist:
			best_dist = d
			best = r
	return best

func _command_attack(foe: Unit) -> void:
	for u in _selected:
		if is_instance_valid(u):
			u.attack_target(foe)

# Send selected villagers to gather; returns true if any villager took it.
func _command_gather(res: ResourceNode) -> bool:
	var any := false
	for u in _selected:
		if u is Villager and is_instance_valid(u):
			u.gather_from(res)
			any = true
	return any

func _command_move(cam: Camera3D, screen: Vector2) -> void:
	var point := _ground_point(cam, screen)
	if point == null:
		return
	var p: Vector3 = point
	var i := 0
	for u in _selected:
		if not is_instance_valid(u):
			continue
		var offset := Vector3((i % 4) * 0.7 - 1.0, 0, (i / 4) * 0.7)
		u.move_to(p + offset)
		i += 1

func _rect_from(a: Vector2, b: Vector2) -> Rect2:
	var pos := Vector2(min(a.x, b.x), min(a.y, b.y))
	return Rect2(pos, (b - a).abs())

# Intersect the camera ray with the ground plane (y = 0). Returns Vector3 or null.
func _ground_point(cam: Camera3D, screen: Vector2):
	var origin := cam.project_ray_origin(screen)
	var dir := cam.project_ray_normal(screen)
	if is_zero_approx(dir.y):
		return null
	var t := -origin.y / dir.y
	if t < 0:
		return null
	return origin + dir * t
