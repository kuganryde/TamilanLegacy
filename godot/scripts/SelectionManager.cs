using Godot;
using System.Collections.Generic;
using System.Linq;

// RTS input. Left-click = single select; left-drag = box select (multi);
// right-click on an enemy = attack it; right-click on ground = move there in a
// small formation. Control groups: Ctrl+1..9 assigns the current selection,
// 1..9 recalls it. Collider-free: units are picked in screen space, the move
// target is the camera ray / ground-plane (y=0) intersection.
public partial class SelectionManager : Node
{
    private const float DragThreshold = 8f;   // px before a click becomes a drag
    private const float PickRadius = 42f;      // px around a click to grab a unit

    private readonly List<Unit> _selected = new();
    private readonly Dictionary<int, List<Unit>> _groups = new();
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
                // right-click priority: enemy → attack, resource → gather, else move
                var foe = PickEnemy(cam, mb.Position);
                if (foe != null) { CommandAttack(foe); return; }
                var res = PickResource(cam, mb.Position);
                if (res != null && CommandGather(res)) return;
                CommandMove(cam, mb.Position);
            }
        }
        else if (@event is InputEventMouseMotion mm && _dragging)
        {
            _box.Box = RectFrom(_dragStart, mm.Position);
            _box.Active = _box.Box.Size.Length() > DragThreshold;
            _box.QueueRedraw();
        }
        else if (@event is InputEventKey k && k.Pressed && !k.Echo)
        {
            HandleGroupKey(k);
        }
    }

    // ---- control groups (Ctrl+1..9 assign, 1..9 recall) --------------------
    private void HandleGroupKey(InputEventKey k)
    {
        int n = DigitFrom(k.Keycode);
        if (n < 1 || n > 9) return;

        if (k.CtrlPressed)
        {
            _groups[n] = _selected.Where(GodotObject.IsInstanceValid).ToList();
        }
        else if (_groups.TryGetValue(n, out var members))
        {
            members.RemoveAll(u => !GodotObject.IsInstanceValid(u) || u.Health <= 0);
            ClearSelection();
            foreach (var u in members) { u.Selected = true; _selected.Add(u); }
        }
    }

    private static int DigitFrom(Key key)
    {
        if (key >= Key.Key1 && key <= Key.Key9) return (int)key - (int)Key.Key0;
        if (key >= Key.Kp1 && key <= Key.Kp9) return (int)key - (int)Key.Kp0;
        return -1;
    }

    private void ClearSelection()
    {
        foreach (var u in _selected)
            if (GodotObject.IsInstanceValid(u)) u.Selected = false;
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

    // Screen-pick the enemy unit nearest the cursor (for right-click attack).
    private Unit? PickEnemy(Camera3D cam, Vector2 screen)
    {
        Unit? best = null;
        float bestDist = PickRadius;
        foreach (var node in GetTree().GetNodesInGroup("units"))
        {
            if (node is not Unit u || !u.Enemy || u.Health <= 0) continue;
            var sp = cam.UnprojectPosition(u.GlobalPosition + new Vector3(0, 0.3f, 0));
            float d = sp.DistanceTo(screen);
            if (d < bestDist) { bestDist = d; best = u; }
        }
        return best;
    }

    private void CommandAttack(Unit foe)
    {
        foreach (var u in _selected)
            if (GodotObject.IsInstanceValid(u)) u.AttackTarget(foe);
    }

    // Screen-pick the resource node nearest the cursor (for right-click gather).
    private ResourceNode? PickResource(Camera3D cam, Vector2 screen)
    {
        ResourceNode? best = null;
        float bestDist = PickRadius;
        foreach (var node in GetTree().GetNodesInGroup("resources"))
        {
            if (node is not ResourceNode r || r.Depleted) continue;
            var sp = cam.UnprojectPosition(r.GlobalPosition + new Vector3(0, 0.3f, 0));
            float d = sp.DistanceTo(screen);
            if (d < bestDist) { bestDist = d; best = r; }
        }
        return best;
    }

    // Send selected villagers to gather; returns true if any villager took it.
    private bool CommandGather(ResourceNode res)
    {
        bool any = false;
        foreach (var u in _selected)
        {
            if (u is Villager v && GodotObject.IsInstanceValid(v)) { v.GatherFrom(res); any = true; }
        }
        return any;
    }

    private void CommandMove(Camera3D cam, Vector2 screen)
    {
        var point = GroundPoint(cam, screen);
        if (point is not Vector3 p) return;
        int i = 0;
        foreach (var u in _selected)
        {
            if (!GodotObject.IsInstanceValid(u)) continue;
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
