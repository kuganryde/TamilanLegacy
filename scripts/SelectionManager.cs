using Godot;
using System.Collections.Generic;

// RTS input. Left-click = single select; left-drag = box select (multi);
// right-click = move the selection to the ground point in a small formation.
// Collider-free: units are picked in screen space, the move target is the
// camera ray / ground-plane (y=0) intersection.
public partial class SelectionManager : Node
{
    private const float DragThreshold = 8f;   // px before a click becomes a drag
    private const float PickRadius = 42f;      // px around a click to grab a unit

    private readonly List<Unit> _selected = new();
    private SelectionBox _box = null!;
    private bool _dragging;
    private Vector2 _dragStart;

    public override void _Ready()
    {
        var layer = new CanvasLayer();
        _box = new SelectionBox();
        layer.AddChild(_box);
        AddChild(layer);
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        var cam = GetViewport().GetCamera3D();
        if (cam == null) return;

        if (@event is InputEventMouseButton mb)
        {
            if (mb.ButtonIndex == MouseButton.Left)
            {
                if (mb.Pressed) { _dragging = true; _dragStart = mb.Position; }
                else if (_dragging)
                {
                    _dragging = false;
                    if (_dragStart.DistanceTo(mb.Position) > DragThreshold)
                        BoxSelect(cam, _dragStart, mb.Position);
                    else
                        SingleSelect(cam, mb.Position);
                    _box.Active = false;
                    _box.QueueRedraw();
                }
            }
            else if (mb.ButtonIndex == MouseButton.Right && mb.Pressed)
            {
                CommandMove(cam, mb.Position);
            }
        }
        else if (@event is InputEventMouseMotion mm && _dragging)
        {
            _box.Box = RectFrom(_dragStart, mm.Position);
            _box.Active = _box.Box.Size.Length() > DragThreshold;
            _box.QueueRedraw();
        }
    }

    private void ClearSelection()
    {
        foreach (var u in _selected) u.Selected = false;
        _selected.Clear();
    }

    private void SingleSelect(Camera3D cam, Vector2 screen)
    {
        Unit? best = null;
        float bestDist = PickRadius;
        foreach (var node in GetTree().GetNodesInGroup("units"))
        {
            if (node is not Unit u || u.Enemy) continue;
            var sp = cam.UnprojectPosition(u.GlobalPosition + new Vector3(0, 0.3f, 0));
            float d = sp.DistanceTo(screen);
            if (d < bestDist) { bestDist = d; best = u; }
        }
        ClearSelection();
        if (best != null) { best.Selected = true; _selected.Add(best); }
    }

    private void BoxSelect(Camera3D cam, Vector2 a, Vector2 b)
    {
        var rect = RectFrom(a, b);
        ClearSelection();
        foreach (var node in GetTree().GetNodesInGroup("units"))
        {
            if (node is not Unit u || u.Enemy) continue;
            var sp = cam.UnprojectPosition(u.GlobalPosition + new Vector3(0, 0.3f, 0));
            if (rect.HasPoint(sp)) { u.Selected = true; _selected.Add(u); }
        }
    }

    private void CommandMove(Camera3D cam, Vector2 screen)
    {
        var point = GroundPoint(cam, screen);
        if (point is not Vector3 p) return;
        int i = 0;
        foreach (var u in _selected)
        {
            var offset = new Vector3((i % 4) * 0.7f - 1.0f, 0, (i / 4) * 0.7f);
            u.MoveTo(p + offset);
            i++;
        }
    }

    private static Rect2 RectFrom(Vector2 a, Vector2 b)
    {
        var pos = new Vector2(Mathf.Min(a.X, b.X), Mathf.Min(a.Y, b.Y));
        return new Rect2(pos, (b - a).Abs());
    }

    // Intersect the camera ray with the ground plane (y = 0).
    private static Vector3? GroundPoint(Camera3D cam, Vector2 screen)
    {
        var origin = cam.ProjectRayOrigin(screen);
        var dir = cam.ProjectRayNormal(screen);
        if (Mathf.IsZeroApprox(dir.Y)) return null;
        float t = -origin.Y / dir.Y;
        return t < 0 ? null : origin + dir * t;
    }
}
