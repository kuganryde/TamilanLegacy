class_name DropOff
extends Node3D
# A resource drop-off point (town centre / granary / warehouse). Villagers
# return here to bank what they've gathered. In group "dropoff" so the nearest
# one can be found. Renders with the warehouse .glb.

const MODELS_DIR := "res://assets/models/"

@export var model := "warehouse.glb"

func _ready() -> void:
	add_to_group("dropoff")
	var packed := ResourceLoader.load(MODELS_DIR + model) as PackedScene
	if packed != null:
		var node := packed.instantiate() as Node3D
		node.scale = Vector3.ONE
		add_child(node)
	else:
		var box := MeshInstance3D.new()
		var mesh := BoxMesh.new()
		mesh.size = Vector3(1.1, 0.8, 1.1)
		box.mesh = mesh
		box.position = Vector3(0, 0.4, 0)
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color(0.6, 0.5, 0.3)
		box.material_override = mat
		add_child(box)
