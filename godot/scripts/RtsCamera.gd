class_name RtsCamera
extends Node3D
# Age-of-Empires-style RTS camera rig. This Node3D is the pivot (pan + yaw); its
# Camera3D child looks down at a fixed tilt. WASD/arrows pan (relative to
# facing), Q/E rotate, mouse wheel zooms.

@export var pan_speed := 9.0
@export var rotate_speed := 1.6
@export var zoom_min := 5.0
@export var zoom_max := 22.0

var _cam: Camera3D
var _size := 12.0

func _ready() -> void:
	_cam = Camera3D.new()
	_cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	_cam.size = _size
	_cam.position = Vector3(0, 14, 12)
	_cam.rotation_degrees = Vector3(-48, 0, 0)
	add_child(_cam)
	_cam.make_current()

func _process(delta: float) -> void:
	var move := Vector3.ZERO
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP): move.z -= 1
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN): move.z += 1
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT): move.x -= 1
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT): move.x += 1
	if move != Vector3.ZERO:
		position += (basis * move).normalized() * pan_speed * delta  # pan relative to yaw

	if Input.is_key_pressed(KEY_Q): rotate_y(rotate_speed * delta)
	if Input.is_key_pressed(KEY_E): rotate_y(-rotate_speed * delta)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_set_zoom(_size - 1.2)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_set_zoom(_size + 1.2)

func _set_zoom(s: float) -> void:
	_size = clampf(s, zoom_min, zoom_max)
	_cam.size = _size
