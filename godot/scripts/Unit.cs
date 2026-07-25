using Godot;

// A selectable, commandable, *fighting* RTS unit.
//  - Movement: NavigationAgent3D path routing with a direct-move fallback (M2).
//  - Combat (M3): HP, auto target-acquisition within AggroRange, attack-move to
//    a commanded target, damage on cooldown, death. Enemy units use the same
//    brain, so opposing groups skirmish on contact.
// Note: attack uses logic + a facing turn; authored idle/march/attack animation
// (AnimationTree on the rig) is a later art pass — see RTS_ROADMAP.md M3.
public partial class Unit : Node3D
{
    [Export] public float Speed = 3.5f;
    [Export] public bool Enemy = false;
    [Export] public float MaxHealth = 50f;
    [Export] public float AttackDamage = 6f;
    [Export] public float AttackRange = 1.1f;
    [Export] public float AttackCooldown = 1.1f;
    [Export] public float AggroRange = 5f;

    public float Health { get; private set; }

    private Vector3? _target;                // move command
    private Unit? _attackTarget;             // attack command / auto-acquired
    private double _cooldown;
    private MeshInstance3D _ring = null!;
    private MeshInstance3D _hpFill = null!;
    private NavigationAgent3D _agent = null!;

    public bool Selected
    {
        get => _ring != null && _ring.Visible;
        set { if (_ring != null) _ring.Visible = value; }
    }

    public override void _Ready()
    {
        AddToGroup("units");
        Health = MaxHealth;

        _agent = new NavigationAgent3D { Radius = 0.3f, PathDesiredDistance = 0.25f, TargetDesiredDistance = 0.25f };
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

        // billboarded health bar
        _hpFill = new MeshInstance3D
        {
            Mesh = new QuadMesh { Size = new Vector2(0.5f, 0.07f) },
            Position = new Vector3(0, 0.66f, 0),
            MaterialOverride = new StandardMaterial3D
            {
                ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
                BillboardMode = BaseMaterial3D.BillboardModeEnum.Enabled,
                AlbedoColor = new Color(0.3f, 0.9f, 0.3f),
            },
        };
        AddChild(_hpFill);
    }

    // ---- commands ----------------------------------------------------------
    public void MoveTo(Vector3 point)
    {
        _target = point;
        _attackTarget = null;
        _agent.TargetPosition = point;
    }

    public void AttackTarget(Unit t)
    {
        _attackTarget = t;
        _target = null;
    }

    public void TakeDamage(float dmg)
    {
        Health = Mathf.Max(0, Health - dmg);
        UpdateHpBar();
        if (Health <= 0) Die();
    }

    private void Die()
    {
        if (IsQueuedForDeletion()) return;
        RemoveFromGroup("units");
        QueueFree();
    }

    // ---- brain -------------------------------------------------------------
    public override void _PhysicsProcess(double delta)
    {
        _cooldown -= delta;

        // 1) attack an assigned/valid target
        if (_attackTarget != null && GodotObject.IsInstanceValid(_attackTarget) && _attackTarget.Health > 0)
        {
            var tp = _attackTarget.GlobalPosition;
            if (FlatDist(GlobalPosition, tp) > AttackRange)
            {
                StepDirect(tp, delta);
            }
            else
            {
                Face(tp);
                if (_cooldown <= 0)
                {
                    _cooldown = AttackCooldown;
                    _attackTarget.TakeDamage(AttackDamage);
                }
            }
            return;
        }
        _attackTarget = null;

        // 2) move command (navmesh)
        if (_target is Vector3 mv)
        {
            var here = GlobalPosition;
            if (FlatDist(here, mv) < 0.08f) { _target = null; return; }
            Vector3 aim = _agent.IsNavigationFinished() ? mv : _agent.GetNextPathPosition();
            StepDirect(aim, delta);
            return;
        }

        // 3) idle → auto-acquire the nearest foe
        AcquireTarget();
    }

    private void AcquireTarget()
    {
        Unit? best = null;
        float bestDist = AggroRange;
        foreach (var node in GetTree().GetNodesInGroup("units"))
        {
            if (node is not Unit u || u == this || u.Enemy == Enemy || u.Health <= 0) continue;
            float d = FlatDist(GlobalPosition, u.GlobalPosition);
            if (d < bestDist) { bestDist = d; best = u; }
        }
        _attackTarget = best;
    }

    // ---- helpers -----------------------------------------------------------
    private void StepDirect(Vector3 worldTarget, double delta)
    {
        var step = worldTarget - GlobalPosition;
        step.Y = 0;
        float len = step.Length();
        if (len < 0.0001f) return;
        var dir = step / len;
        GlobalPosition += dir * Mathf.Min(Speed * (float)delta, len);
        Rotation = new Vector3(0, Mathf.Atan2(dir.X, dir.Z), 0);
    }

    private void Face(Vector3 worldTarget)
    {
        var d = worldTarget - GlobalPosition;
        if (Mathf.IsZeroApprox(d.X) && Mathf.IsZeroApprox(d.Z)) return;
        Rotation = new Vector3(0, Mathf.Atan2(d.X, d.Z), 0);
    }

    private void UpdateHpBar()
    {
        float r = Mathf.Clamp(Health / MaxHealth, 0, 1);
        _hpFill.Scale = new Vector3(r, 1, 1);
        var mat = (StandardMaterial3D)_hpFill.MaterialOverride;
        mat.AlbedoColor = new Color(1f - r, 0.2f + 0.7f * r, 0.2f); // green → red
    }

    private static float FlatDist(Vector3 a, Vector3 b)
        => new Vector2(a.X - b.X, a.Z - b.Z).Length();
}
