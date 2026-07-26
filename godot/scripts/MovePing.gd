class_name MovePing
extends Node3D
# A quick expanding ring dropped where the player issues a move order (M6
# microinteraction). Grows and fades over half a second, then frees itself.

func _ready() -> void:
	var ring := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 0.22
	torus.outer_radius = 0.32
	ring.mesh = torus
	ring.position.y = 0.05
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.albedo_color = Color(0.45, 0.9, 1.0, 0.9)
	ring.material_override = mat
	add_child(ring)

	var tw := create_tween().set_parallel(true)
	tw.tween_property(self, "scale", Vector3.ONE * 2.4, 0.5)
	tw.tween_property(mat, "albedo_color", Color(0.45, 0.9, 1.0, 0.0), 0.5)
	tw.chain().tween_callback(queue_free)
