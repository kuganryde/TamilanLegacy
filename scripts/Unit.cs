using Godot;

// A selectable, commandable RTS unit. Milestone 1 uses direct steering toward
// a target (no obstacle avoidance yet — NavigationAgent3D pathfinding is
// Milestone 2, see RTS_ROADMAP.md). Uses the rigged Sangam models.
public partial class Unit : Node3D
{
    [Export] public float Speed = 3.5f;
    [Export] public bool Enemy = false;

    private Vector3? _target;
    private MeshInstance3D _ring = null!;

    public bool Selected
    {
        get => _ring != null && _ring.Visible;
        set { if (_ring != null) _ring.Visible = value; }
    }

    public override void _Ready()
    {
        AddToGroup("units");

        string modelPath = Enemy
            ? "res://assets/models/sangam_spearman_rig.glb"
            : "res://assets/models/sangam_warrior_rig.glb";
        var packed = ResourceLoader.Load<PackedScene>(modelPath);
        if (packed != null)
        {
            var model = packed.Instantiate<Node3D>();
            model.Scale = Vector3.One * 0.3f;
            AddChild(model);
        }

        // ground selection ring (blue = player, red = enemy)
        _ring = new MeshInstance3D
        {
            Mesh = new TorusMesh { InnerRadius = 0.34f, OuterRadius = 0.42f },
            Position = new Vector3(0, 0.06f, 0),
            Visible = false,
            MaterialOverride = new StandardMaterial3D
            {
                AlbedoColor = Enemy ? new Color(0.95f, 0.25f, 0.2f) : new Color(0.25f, 0.8f, 1f),
                EmissionEnabled = true,
                Emission = Enemy ? new Color(0.5f, 0.1f, 0.08f) : new Color(0.1f, 0.4f, 0.55f),
            },
        };
        AddChild(_ring);
    }

    public void MoveTo(Vector3 point) => _target = point;

    public override void _Process(double delta)
    {
        if (_target is not Vector3 t) return;

        var flat = new Vector3(t.X, Position.Y, t.Z);
        var to = flat - Position;
        float dist = to.Length();
        if (dist < 0.05f) { _target = null; return; }

        var dir = to / dist;
        Position += dir * Mathf.Min(Speed * (float)delta, dist);
        Rotation = new Vector3(0, Mathf.Atan2(dir.X, dir.Z), 0); // face travel direction
    }
}
