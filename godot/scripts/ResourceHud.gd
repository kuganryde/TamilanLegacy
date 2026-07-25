class_name ResourceHud
extends CanvasLayer
# Top-of-screen resource bar (Food / Wood / Stone / Gold / Pop), AoE-style. Reads
# the Econ autoload and refreshes whenever it emits `changed`. Copper-plate
# palette to match the Chola theme; a fuller command-card HUD comes in M5.

var _food: Label
var _wood: Label
var _stone: Label
var _gold: Label
var _pop: Label

func _ready() -> void:
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_TOP_WIDE)
	panel.offset_bottom = 42
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.10, 0.07, 0.04, 0.88)
	style.border_color = Color(0.72, 0.52, 0.24)
	style.border_width_bottom = 2
	style.set_content_margin_all(6)
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)

	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 26)
	panel.add_child(row)

	_food = _chip(row, Color(0.95, 0.85, 0.55))
	_wood = _chip(row, Color(0.80, 0.60, 0.38))
	_stone = _chip(row, Color(0.82, 0.82, 0.84))
	_gold = _chip(row, Color(0.98, 0.82, 0.30))
	_pop = _chip(row, Color(0.75, 0.88, 0.98))

	Econ.changed.connect(_refresh)
	_refresh()

func _exit_tree() -> void:
	if Econ and Econ.changed.is_connected(_refresh):
		Econ.changed.disconnect(_refresh)

func _chip(row: HBoxContainer, color: Color) -> Label:
	var label := Label.new()
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_color_override("font_color", color)
	label.add_theme_font_size_override("font_size", 18)
	row.add_child(label)
	return label

func _refresh() -> void:
	_food.text = "Food  %d" % Econ.food
	_wood.text = "Wood  %d" % Econ.wood
	_stone.text = "Stone  %d" % Econ.stone
	_gold.text = "Gold  %d" % Econ.gold
	_pop.text = "Pop  %d/%d" % [Econ.pop(), Econ.pop_cap]
