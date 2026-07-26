class_name GameOverOverlay
extends CanvasLayer
# Shows VICTORY / DEFEAT and pauses the match when a Town Centre falls (M5).

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS   # keep working while the tree is paused
	if Econ:
		Econ.match_ended.connect(_on_match_ended)

func _on_match_ended(player_won: bool) -> void:
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.55)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(dim)

	var label := Label.new()
	label.text = "VICTORY" if player_won else "DEFEAT"
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.set_anchors_preset(Control.PRESET_FULL_RECT)
	label.add_theme_font_size_override("font_size", 72)
	label.add_theme_color_override("font_color",
		Color(0.98, 0.85, 0.4) if player_won else Color(0.95, 0.4, 0.35))
	add_child(label)

	get_tree().paused = true
