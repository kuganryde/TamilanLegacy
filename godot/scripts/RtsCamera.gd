class_name RtsCamera
extends Node3D
# Age-of-Empires-style RTS camera rig, now a true **3D perspective** view (not
# flat orthographic). This Node3D is the pivot (pan + yaw); its Camera3D child
# sits back and up, pitched down, with perspective FOV so the world has real
# depth. WASD/arrows pan (relative to facing), Q/E rotate, wheel zooms (distance).

@export var pan_speed := 10.0
@export var rotate_speed := 1.6
@export var zoom_min := 7.0      # closest camera distance
@export var zoom_max := 30.0     # farthest camera distance

const PITCH_DEG := -52.0         # look-down angle (degrees)
const FOV := 52.0

var _cam: Camera3D
var _dist := 18.0

func _ready() -> void:
	add_to_group("rts_camera")
	_cam = Camera3D.new()
	_cam.projection = Camera3D.PROJECTION_PERSPECTIVE
	_cam.fov = FOV
	_cam.rotation_degrees = Vector3(PITCH_DEG, 0, 0)
	_cam.far = 500.0
	add_child(_cam)
	_apply_zoom()
	_cam.make_current()

func _apply_zoom() -> void:
	# Place the camera back (+z) and up (+y) along the pitch so it frames the
	# pivot point at the given distance.
	var a := deg_to_rad(-PITCH_DEG)
	_cam.position = Vector3(0, sin(a) * _dist, cos(a) * _dist)

func _process(delta: float) -> void:
	var move := Vector3.ZERO
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP): move.z -= 1
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN): move.z += 1
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT): move.x -= 1
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT): move.x += 1
	if move != Vector3.ZERO:
		position += (basis * move).normalized() * pan_speed * delta

	if Input.is_key_pressed(KEY_Q): rotate_y(rotate_speed * delta)
	if Input.is_key_pressed(KEY_E): rotate_y(-rotate_speed * delta)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_set_dist(_dist - 1.6)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_set_dist(_dist + 1.6)

func _set_dist(d: float) -> void:
	_dist = clampf(d, zoom_min, zoom_max)
	_apply_zoom()

# Recenter the rig on a world point (used by the minimap click-to-pan).
func center_on(world_pos: Vector3) -> void:
	position = Vector3(world_pos.x, 0, world_pos.z)
