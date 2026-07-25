using Godot;
using System.Collections.Generic;

// RTS input: left-click selects the nearest player unit; right-click commands
// the selection to move to the clicked ground point (spread into a formation).
// Milestone 1 uses collider-free screen-space picking + a ray/ground-plane
// intersection, so no physics setup is required. Box-select + combat come next
// (RTS_ROADMAP.md).
public partial class SelectionManager : Node
{
    private readonly List<Unit> _selected = new();

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is not InputEventMouseButton mb || !mb.Pressed) return;
        var cam = GetViewport().GetCamera3D();
        if (cam == null) return;

        if (mb.ButtonIndex == MouseButton.Left) SelectAt(cam, mb.Position);
        else if (mb.ButtonIndex == MouseButton.Right) CommandMove(cam, mb.Position);
    }

    private void SelectAt(Camera3D cam, Vector2 screen)
    {
        Unit? best = null;
        float bestDist = 42f; // pixel pick radius
        foreach (var node in GetTree().GetNodesInGroup("units"))
        {
            if (node is not Unit u || u.Enemy) continue;
            var sp = cam.UnprojectPosition(u.GlobalPosition + new Vector3(0, 0.3f, 0));
            float d = sp.DistanceTo(screen);
            if (d < bestDist) { bestDist = d; best = u; }
        }

        foreach (var u in _selected) u.Selected = false;
        _selected.Clear();
        if (best != null) { best.Selected = true; _selected.Add(best); }
    }

    private void CommandMove(Camera3D cam, Vector2 screen)
    {
        var point = GroundPoint(cam, screen);
        if (point is not Vector3 p) return;

        int i = 0;
        foreach (var u in _selected)
        {
            var offset = new Vector3((i % 3) * 0.7f, 0, (i / 3) * 0.7f);
            u.MoveTo(p + offset);
            i++;
        }
    }

    // Intersect the camera ray with the ground plane (y = 0).
    private static Vector3? GroundPoint(Camera3D cam, Vector2 screen)
    {
        var origin = cam.ProjectRayOrigin(screen);
        var dir = cam.ProjectRayNormal(screen);
        if (Mathf.IsZeroApprox(dir.Y)) return null;
        float t = -origin.Y / dir.Y;
        if (t < 0) return null;
        return origin + dir * t;
    }
}
