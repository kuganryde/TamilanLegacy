class_name SelectionManager
extends Node
# RTS input. Left-click selects a unit or a friendly building; left-drag box-
# selects units. Right-click: enemy unit/building = attack, resource = gather
# (villagers), empty ground = move in formation. Ctrl+1..9 assign control groups,
# 1..9 recall. A selected building or villager shows the CommandCard (train /
# build); building placement runs a ghost that follows the cursor (M5).

const DRAG_THRESHOLD := 8.0
const PICK_RADIUS := 42.0

var _selected: Array[Unit] = []
var _selected_building: Building = null
var _groups := {}
var _box: SelectionBox
var _command_card: CommandCard
var _dragging := false
var _drag_start := Vector2.ZERO

var _placing := -1              # Building.Kind while placing, else -1
var _ghost: Node3D = null

func _ready() -> void:
	var layer := CanvasLayer.new()
	_box = SelectionBox.new()
	layer.add_child(_box)
	add_child(layer)

	_command_card = CommandCard.new()
	_command_card.setup(self)
	add_child(_command_card)

func _unhandled_input(event: InputEvent) -> void:
	var cam := get_viewport().get_camera_3d()
	if cam == null:
		return

	if _placing >= 0:
		_placement_input(event, cam)
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
			var foe := _pick_enemy(cam, event.position)
			if foe != null:
				_command_attack(foe)
				return
			var eb := _pick_building(cam, event.position, true)
			if eb != null:
				_command_attack(eb)
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

# ---- placement -------------------------------------------------------------
func begin_placement(kind: int) -> void:
	_cancel_placement()
	_placing = kind
	_ghost = _make_ghost()
	get_tree().current_scene.add_child(_ghost)

func _placement_input(event: InputEvent, cam: Camera3D) -> void:
	if event is InputEventMouseMotion:
		var p = _ground_point(cam, event.position)
		if p != null and _ghost != null:
			_ghost.position = p
	elif event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			var p = _ground_point(cam, event.position)
			if p != null:
				_try_place(p)
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			_cancel_placement()
	elif event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		_cancel_placement()

func _try_place(pos: Vector3) -> void:
	var cost: Dictionary = Building.build_cost(_placing)
	if Econ != null and Econ.try_spend(cost.get("food", 0), cost.get("wood", 0), cost.get("stone", 0), cost.get("gold", 0)):
		var b := Building.new()
		b.kind = _placing
		b.enemy = false
		b.position = pos
		get_tree().current_scene.add_child(b)
	_cancel_placement()

func _cancel_placement() -> void:
	if _ghost != null:
		_ghost.queue_free()
		_ghost = null
	_placing = -1

func _make_ghost() -> Node3D:
	var n := Node3D.new()
	var mi := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(1.3, 1.0, 1.3)
	mi.mesh = box
	mi.position = Vector3(0, 0.5, 0)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.3, 0.9, 0.45, 0.4)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mi.material_override = mat
	n.add_child(mi)
	return n

# ---- control groups --------------------------------------------------------
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
		_selected_building = null
		for u in members:
			if is_instance_valid(u) and u.health > 0:
				u.selected = true
				_selected.append(u)
		_refresh_command_card()

func _digit_from(key: int) -> int:
	if key >= KEY_1 and key <= KEY_9:
		return key - KEY_0
	if key >= KEY_KP_1 and key <= KEY_KP_9:
		return key - KEY_KP_0
	return -1

# ---- selection -------------------------------------------------------------
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
		_selected_building = null
		best.selected = true
		_selected.append(best)
	else:
		_selected_building = _pick_building(cam, screen, false)
	_refresh_command_card()

func _box_select(cam: Camera3D, a: Vector2, b: Vector2) -> void:
	var rect := _rect_from(a, b)
	_clear_selection()
	_selected_building = null
	for node in get_tree().get_nodes_in_group("units"):
		var u := node as Unit
		if u == null or u.enemy:
			continue
		var sp := cam.unproject_position(u.global_position + Vector3(0, 0.3, 0))
		if rect.has_point(sp):
			u.selected = true
			_selected.append(u)
	_refresh_command_card()

func _refresh_command_card() -> void:
	if _selected_building != null and is_instance_valid(_selected_building):
		_command_card.show_for_building(_selected_building)
	elif _has_villager_selected():
		_command_card.show_for_villager()
	else:
		_command_card.hide_card()

func _has_villager_selected() -> bool:
	for u in _selected:
		if u is Villager and is_instance_valid(u):
			return true
	return false

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

func _pick_building(cam: Camera3D, screen: Vector2, want_enemy: bool) -> Building:
	var best: Building = null
	var best_dist := PICK_RADIUS
	for node in get_tree().get_nodes_in_group("buildings"):
		var b := node as Building
		if b == null or b.enemy != want_enemy or b.health <= 0:
			continue
		var sp := cam.unproject_position(b.global_position + Vector3(0, 0.6, 0))
		var d := sp.distance_to(screen)
		if d < best_dist:
			best_dist = d
			best = b
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

# ---- commands --------------------------------------------------------------
func _command_attack(target) -> void:
	for u in _selected:
		if is_instance_valid(u):
			u.attack_target(target)

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

func _ground_point(cam: Camera3D, screen: Vector2):
	var origin := cam.project_ray_origin(screen)
	var dir := cam.project_ray_normal(screen)
	if is_zero_approx(dir.y):
		return null
	var t := -origin.y / dir.y
	if t < 0:
		return null
	return origin + dir * t
