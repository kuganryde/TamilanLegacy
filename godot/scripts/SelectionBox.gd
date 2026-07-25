class_name SelectionBox
extends Control
# Full-screen overlay that draws the drag-select rectangle. Input-transparent so
# it never eats clicks; SelectionManager drives box/active + queue_redraw().

var active := false
var box := Rect2()

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_preset(Control.PRESET_FULL_RECT)

func _draw() -> void:
	if not active:
		return
	draw_rect(box, Color(0.3, 0.8, 1.0, 0.15), true)
	draw_rect(box, Color(0.45, 0.9, 1.0, 0.9), false, 1.5)
