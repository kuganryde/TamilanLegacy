class_name Dashboard
extends CanvasLayer
# Left-side information dashboard (M6). Live counts of your economy and army, a
# read on the enemy, a match timer, and details of the current selection (fed by
# SelectionManager via the "dashboard" group). Refreshes a few times a second.

var _panel: PanelContainer
var _time_l: Label
var _eco_l: Label
var _army_l: Label
var _enemy_l: Label
var _sel_l: Label
var _elapsed := 0.0
var _acc := 0.0
var _sel_text := "Selection: —"

func _ready() -> void:
	add_to_group("dashboard")

	_panel = PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.09, 0.07, 0.04, 0.86)
	style.border_color = Color(0.72, 0.52, 0.24)
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	style.set_content_margin_all(9)
	_panel.add_theme_stylebox_override("panel", style)
	_panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT, Control.PRESET_MODE_MINSIZE, 10)
	_panel.offset_top = 52
	add_child(_panel)

	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 3)
	_panel.add_child(vb)

	_add_title(vb, "TANJAVUR — MATCH")
	_time_l = _add_line(vb, Color(0.9, 0.86, 0.7))
	_eco_l = _add_line(vb, Color(0.7, 0.9, 1.0))
	_army_l = _add_line(vb, Color(0.7, 0.95, 0.75))
	_enemy_l = _add_line(vb, Color(0.98, 0.6, 0.5))
	_add_sep(vb)
	_sel_l = _add_line(vb, Color(0.95, 0.88, 0.6))

	_refresh()

func _process(delta: float) -> void:
	_elapsed += delta
	_acc += delta
	if _acc >= 0.25:
		_acc = 0.0
		_refresh()

func set_selection_info(text: String) -> void:
	_sel_text = text
	if _sel_l != null:
		_sel_l.text = text

func _refresh() -> void:
	var mins := int(_elapsed) / 60
	var secs := int(_elapsed) % 60
	_time_l.text = "Time  %02d:%02d" % [mins, secs]
	var pop := 0
	var cap := 0
	if Econ:
		pop = Econ.pop()
		cap = Econ.pop_cap()
	_eco_l.text = "Villagers %d   ·   Pop %d/%d" % [_count(false, true), pop, cap]
	_army_l.text = "Soldiers %d   ·   Buildings %d" % [_count(false, false), _count_buildings(false)]
	_enemy_l.text = "Enemy: soldiers %d · bases %d" % [_count(true, false), _count_buildings(true)]
	_sel_l.text = _sel_text

func _count(enemy_flag: bool, want_villager: bool) -> int:
	var n := 0
	for node in get_tree().get_nodes_in_group("units"):
		if not (node is Unit) or node.enemy != enemy_flag or node.health <= 0:
			continue
		if (node is Villager) == want_villager:
			n += 1
	return n

func _count_buildings(enemy_flag: bool) -> int:
	var n := 0
	for node in get_tree().get_nodes_in_group("buildings"):
		if node is Building and node.enemy == enemy_flag and node.health > 0:
			n += 1
	return n

func _add_title(vb: VBoxContainer, text: String) -> void:
	var l := Label.new()
	l.text = text
	l.add_theme_color_override("font_color", Color(0.85, 0.7, 0.4))
	l.add_theme_font_size_override("font_size", 14)
	vb.add_child(l)

func _add_line(vb: VBoxContainer, color: Color) -> Label:
	var l := Label.new()
	l.add_theme_color_override("font_color", color)
	l.add_theme_font_size_override("font_size", 13)
	vb.add_child(l)
	return l

func _add_sep(vb: VBoxContainer) -> void:
	vb.add_child(HSeparator.new())
