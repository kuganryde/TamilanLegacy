using Godot;

// A selectable, commandable RTS unit. M2: routes to its target via a
// NavigationAgent3D (paths around baked obstacles / buildings). If no navmesh
// is available yet it falls back to direct steering, so units always move.
public partial class Unit : Node3D
{
    [Export] public float Speed = 3.5f;
    [Export] public bool Enemy = false;

    private Vector3? _target;
    private MeshInstance3D _ring = null!;
    private NavigationAgent3D _agent = null!;

    public bool Selected
    {
        get => _ring != null && _ring.Visible;
        set { if (_ring != null) _ring.Visible = value; }
    }

    public override void _Ready()
    {
        AddToGroup("units");

        _agent = new NavigationAgent3D
        {
            Radius = 0.3f,
            PathDesiredDistance = 0.25f,
            TargetDesiredDistance = 0.25f,
        };
        AddChild(_agent);

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

    public void MoveTo(Vector3 point)
    {
        _target = point;
        _agent.TargetPosition = point;
    }

    public override void _PhysicsProcess(double delta)
    {
        if (_target is not Vector3 tgt) return;

        // arrived?
        var here = GlobalPosition;
        if (new Vector2(here.X - tgt.X, here.Z - tgt.Z).Length() < 0.08f)
        {
            _target = null;
            return;
        }

        // Prefer the navmesh path; fall back to a straight line if it isn't ready.
        Vector3 aim = _agent.IsNavigationFinished() ? tgt : _agent.GetNextPathPosition();
        var step = aim - here;
        step.Y = 0;
        float len = step.Length();
        if (len < 0.0001f) return;

        var dir = step / len;
        GlobalPosition += dir * Mathf.Min(Speed * (float)delta, len);
        Rotation = new Vector3(0, Mathf.Atan2(dir.X, dir.Z), 0);
    }
}
