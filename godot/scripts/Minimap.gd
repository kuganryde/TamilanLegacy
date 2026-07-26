class_name Minimap
extends Control
# Bottom-right minimap (M6). Draws resources, buildings and units as coloured
# blips over a top-down map, marks the camera's focus, and pans the camera when
# clicked. Added under a CanvasLayer by GameRoot.

const WORLD_MIN := -9.0
const WORLD_MAX := 9.0
const SIZE := 184.0

var _acc := 0.0

func _ready() -> void:
	custom_minimum_size = Vector2(SIZE, SIZE)
	set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT, Control.PRESET_MODE_MINSIZE, 12)
	mouse_filter = Control.MOUSE_FILTER_STOP

func _process(delta: float) -> void:
	_acc += delta
	if _acc >= 0.08:
		_acc = 0.0
		queue_redraw()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var w := _to_world(event.position)
		get_tree().call_group("rts_camera", "center_on", w)

func _draw() -> void:
	var s := size
	draw_rect(Rect2(Vector2.ZERO, s), Color(0.08, 0.09, 0.07, 0.92), true)
	draw_rect(Rect2(Vector2.ZERO, s), Color(0.72, 0.52, 0.24), false, 2.0)

	for node in get_tree().get_nodes_in_group("resources"):
		if node is Node3D:
			draw_circle(_to_map(node.global_position), 2.0, Color(0.95, 0.82, 0.3))

	for node in get_tree().get_nodes_in_group("buildings"):
		if node is Node3D and ("enemy" in node):
			var col := Color(0.95, 0.35, 0.3) if node.enemy else Color(0.35, 0.7, 1.0)
			var p := _to_map(node.global_position)
			draw_rect(Rect2(p - Vector2(3, 3), Vector2(6, 6)), col, true)

	for node in get_tree().get_nodes_in_group("units"):
		if node is Node3D and ("enemy" in node):
			var col := Color(0.98, 0.45, 0.4) if node.enemy else Color(0.5, 0.85, 1.0)
			draw_circle(_to_map(node.global_position), 1.6, col)

	# camera focus marker
	var cams := get_tree().get_nodes_in_group("rts_camera")
	if not cams.is_empty() and cams[0] is Node3D:
		var c := _to_map(cams[0].global_position)
		draw_rect(Rect2(c - Vector2(10, 8), Vector2(20, 16)), Color(1, 1, 1, 0.9), false, 1.5)

func _to_map(world_pos: Vector3) -> Vector2:
	var u := (world_pos.x - WORLD_MIN) / (WORLD_MAX - WORLD_MIN)
	var v := (world_pos.z - WORLD_MIN) / (WORLD_MAX - WORLD_MIN)
	return Vector2(clampf(u, 0, 1) * size.x, clampf(v, 0, 1) * size.y)

func _to_world(local: Vector2) -> Vector3:
	var u := local.x / size.x
	var v := local.y / size.y
	return Vector3(WORLD_MIN + u * (WORLD_MAX - WORLD_MIN), 0, WORLD_MIN + v * (WORLD_MAX - WORLD_MIN))
