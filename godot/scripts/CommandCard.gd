class_name CommandCard
extends CanvasLayer
# Bottom-left command panel (M5). When a friendly building is selected it shows
# its train buttons; when villagers are selected it shows build buttons. Train
# actions go straight to the building; build actions ask the SelectionManager to
# enter placement mode.

var _sm                       # SelectionManager
var _panel: PanelContainer
var _row: HBoxContainer
var _building: Building = null

func setup(sm) -> void:
	_sm = sm

func _ready() -> void:
	_panel = PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.10, 0.07, 0.04, 0.9)
	style.border_color = Color(0.72, 0.52, 0.24)
	style.set_border_width_all(2)
	style.set_content_margin_all(8)
	_panel.add_theme_stylebox_override("panel", style)

	_row = HBoxContainer.new()
	_row.add_theme_constant_override("separation", 8)
	_panel.add_child(_row)
	add_child(_panel)

	_panel.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT, Control.PRESET_MODE_MINSIZE, 12)
	_panel.visible = false

func hide_card() -> void:
	_building = null
	_panel.visible = false

func show_for_building(b: Building) -> void:
	_building = b
	_clear()
	_add_label(Building.build_label(b.kind) + ":")
	for t in b.trainables():
		var cost: Dictionary = Building.train_cost(t)
		var btn := Button.new()
		btn.text = "Train %s  (%s)" % [Building.train_label(t), _cost_str(cost)]
		btn.pressed.connect(_on_train_pressed.bind(int(t)))
		_row.add_child(btn)
	_panel.visible = true

func _on_train_pressed(t: int) -> void:
	if is_instance_valid(_building):
		_building.queue_train(t)

func show_for_villager() -> void:
	_building = null
	_clear()
	_add_label("Build:")
	_add_build_button(Building.Kind.HOUSE)
	_add_build_button(Building.Kind.BARRACKS)
	_panel.visible = true

func _add_build_button(kind: int) -> void:
	var cost: Dictionary = Building.build_cost(kind)
	var btn := Button.new()
	btn.text = "%s  (%s)" % [Building.build_label(kind), _cost_str(cost)]
	btn.pressed.connect(_on_build_pressed.bind(kind))
	_row.add_child(btn)

func _on_build_pressed(kind: int) -> void:
	if _sm != null:
		_sm.begin_placement(kind)

func _add_label(text: String) -> void:
	var l := Label.new()
	l.text = text
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	l.add_theme_color_override("font_color", Color(0.9, 0.8, 0.55))
	_row.add_child(l)

func _clear() -> void:
	for c in _row.get_children():
		c.queue_free()

func _cost_str(cost: Dictionary) -> String:
	var parts: Array[String] = []
	for key in ["food", "wood", "stone", "gold"]:
		if cost.get(key, 0) > 0:
			parts.append("%d %s" % [cost[key], key])
	return ", ".join(parts)
