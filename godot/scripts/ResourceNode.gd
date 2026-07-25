class_name ResourceNode
extends Node3D
# A gatherable resource node (a stone quarry, a grove of trees, a berry patch,
# a gold vein). Villagers walk up, gather() a bit each tick until it depletes,
# then it frees itself. In group "resources" so villagers/commands can find it.

const MODELS_DIR := "res://assets/models/"

@export var kind: int = GameEnums.ResourceKind.STONE
@export var amount := 200.0

func depleted() -> bool:
	return amount <= 0.0

func _ready() -> void:
	add_to_group("resources")
	_build_visual()

# Take up to `want`; return what was actually available (0 when empty).
func gather(want: float) -> float:
	if amount <= 0.0:
		return 0.0
	var got: float = min(want, amount)
	amount -= got
	if amount <= 0.0:
		remove_from_group("resources")
		queue_free()
	return got

func _build_visual() -> void:
	# Reuse existing .glb where the semantics match; procedural otherwise.
	match kind:
		GameEnums.ResourceKind.STONE:
			_add_model_or("quarry.glb", Color(0.55, 0.53, 0.5), 0.9)
		GameEnums.ResourceKind.WOOD:
			_add_model_or("palm.glb", Color(0.2, 0.45, 0.18), 1.0)
		GameEnums.ResourceKind.FOOD:
			_add_berry_bush()
		GameEnums.ResourceKind.GOLD:
			_add_ore_cluster(Color(0.85, 0.68, 0.2), true)

func _add_model_or(glb: String, fallback: Color, model_scale: float) -> void:
	var packed := ResourceLoader.load(MODELS_DIR + glb) as PackedScene
	if packed != null:
		var node := packed.instantiate() as Node3D
		node.scale = Vector3.ONE * model_scale
		add_child(node)
	else:
		_add_ore_cluster(fallback, false)

func _add_berry_bush() -> void:
	var bush := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 0.34
	sphere.height = 0.6
	bush.mesh = sphere
	bush.position = Vector3(0, 0.28, 0)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.18, 0.42, 0.16)
	bush.material_override = mat
	add_child(bush)

	var rng := RandomNumberGenerator.new()
	rng.seed = get_instance_id()
	for i in range(6):
		var berry := MeshInstance3D.new()
		var bs := SphereMesh.new()
		bs.radius = 0.06
		bs.height = 0.12
		berry.mesh = bs
		berry.position = Vector3(rng.randf_range(-0.28, 0.28), rng.randf_range(0.2, 0.5), rng.randf_range(-0.28, 0.28))
		var bm := StandardMaterial3D.new()
		bm.albedo_color = Color(0.8, 0.12, 0.2)
		berry.material_override = bm
		add_child(berry)

func _add_ore_cluster(color: Color, emissive: bool) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = get_instance_id()
	for i in range(5):
		var s := rng.randf_range(0.16, 0.3)
		var rock := MeshInstance3D.new()
		var box := BoxMesh.new()
		box.size = Vector3(s, s, s)
		rock.mesh = box
		rock.position = Vector3(rng.randf_range(-0.3, 0.3), s * 0.5, rng.randf_range(-0.3, 0.3))
		rock.rotation_degrees = Vector3(0, rng.randf_range(0, 360), 0)
		var mat := StandardMaterial3D.new()
		mat.albedo_color = color
		mat.emission_enabled = emissive
		mat.emission = color * 0.4 if emissive else Color(0, 0, 0)
		rock.material_override = mat
		add_child(rock)
