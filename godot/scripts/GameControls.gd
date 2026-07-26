class_name GameControls
extends CanvasLayer
# Player-facing controls bar (top-centre) for the three highest-impact levers:
#   • Pause / Resume (also Spacebar)
#   • Game speed  — scales Engine.time_scale (0.5× … 3×), retiming the whole sim
#   • Enemy difficulty — retunes EnemyAI income / wave cadence / army cap live
# Tiny hooks, huge effect on how the match plays. Runs while paused.

const SPEEDS := [0.5, 1.0, 2.0, 3.0]
const SPEED_LABELS := ["0.5x", "1x", "2x", "3x"]
const DIFFS := ["Chill", "Balanced", "Ruthless"]

var _pause_btn: Button
var _paused := false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS   # stay interactive while paused
	layer = 60

	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.09, 0.07, 0.04, 0.88)
	style.border_color = Color(0.72, 0.52, 0.24)
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	style.set_content_margin_all(6)
	panel.add_theme_stylebox_override("panel", style)
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP, Control.PRESET_MODE_MINSIZE, 8)
	panel.offset_top += 44
	panel.offset_bottom += 44
	add_child(panel)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)
	panel.add_child(row)

	_pause_btn = _btn(row, "Pause")
	_pause_btn.pressed.connect(_toggle_pause)

	_sep(row); _label(row, "Speed")
	for i in range(SPEEDS.size()):
		_btn(row, SPEED_LABELS[i]).pressed.connect(_set_speed.bind(SPEEDS[i]))

	_sep(row); _label(row, "Enemy")
	for i in range(DIFFS.size()):
		_btn(row, DIFFS[i]).pressed.connect(_set_diff.bind(i))

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_SPACE:
		_toggle_pause()

func _toggle_pause() -> void:
	_paused = not _paused
	get_tree().paused = _paused
	_pause_btn.text = "Resume" if _paused else "Pause"
	if Toast:
		Toast.push("Paused" if _paused else "Resumed", Color(0.8, 0.86, 1.0))

func _set_speed(s: float) -> void:
	Engine.time_scale = s
	if Toast:
		Toast.push("Game speed %sx" % s, Color(0.7, 0.95, 0.8))

func _set_diff(level: int) -> void:
	get_tree().call_group("enemy_ai", "set_difficulty", level)
	if Toast:
		Toast.push("Enemy set to %s" % DIFFS[level], Color(0.98, 0.7, 0.5))

# ---- ui helpers ------------------------------------------------------------
func _btn(row: HBoxContainer, text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_size_override("font_size", 13)
	row.add_child(b)
	return b

func _label(row: HBoxContainer, text: String) -> void:
	var l := Label.new()
	l.text = text
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	l.add_theme_color_override("font_color", Color(0.85, 0.72, 0.45))
	l.add_theme_font_size_override("font_size", 12)
	row.add_child(l)

func _sep(row: HBoxContainer) -> void:
	var s := VSeparator.new()
	row.add_child(s)
