extends CanvasLayer
# Global toast/notification feed (M6 microinteractions). Registered as the
# autoload "Toast"; call Toast.show("message", color) from anywhere and a chip
# slides into a stack at the bottom-centre and fades after a few seconds.

const LIFETIME := 3.6

var _stack: VBoxContainer

func _ready() -> void:
	layer = 100
	_stack = VBoxContainer.new()
	_stack.alignment = BoxContainer.ALIGNMENT_END
	_stack.add_theme_constant_override("separation", 6)
	_stack.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM, Control.PRESET_MODE_MINSIZE, 0)
	_stack.offset_bottom = -90
	_stack.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_stack.grow_vertical = Control.GROW_DIRECTION_BEGIN
	add_child(_stack)

func push(text: String, color: Color = Color(0.85, 0.8, 0.6)) -> void:
	if _stack == null:
		return
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.09, 0.06, 0.03, 0.92)
	style.border_color = color
	style.set_border_width_all(1)
	style.set_corner_radius_all(5)
	style.set_content_margin_all(7)
	panel.add_theme_stylebox_override("panel", style)

	var label := Label.new()
	label.text = text
	label.add_theme_color_override("font_color", color)
	label.add_theme_font_size_override("font_size", 15)
	panel.add_child(label)
	_stack.add_child(panel)

	panel.modulate.a = 0.0
	var tw := create_tween()
	tw.tween_property(panel, "modulate:a", 1.0, 0.18)
	tw.tween_interval(LIFETIME)
	tw.tween_property(panel, "modulate:a", 0.0, 0.5)
	tw.tween_callback(panel.queue_free)
