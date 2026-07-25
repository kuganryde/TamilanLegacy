using Godot;

// A gatherer (M4). Inherits Unit's selection / movement / nav scaffolding but
// swaps the combat brain for an economy loop: walk to a ResourceNode, harvest
// until full or the node is exhausted, carry the load to the nearest DropOff,
// bank it into MatchEconomy, and repeat. Villagers don't fight and aren't
// auto-targeted by the enemy's aggro (see Unit.AcquireTarget).
public partial class Villager : Unit
{
    private enum VState { Idle, ToResource, Gathering, Returning }

    private const float Capacity = 10f;      // carry limit
    private const float GatherRate = 6f;     // resource units / second
    private const float GatherReach = 1.0f;  // stand-off distance at a node
    private const float DropReach = 1.3f;    // stand-off distance at a drop-off

    private VState _state = VState.Idle;
    private ResourceNode? _node;
    private ResourceKind _carryKind = ResourceKind.Food;
    private float _carry;

    protected override Node3D? LoadModel()
    {
        // Reuse the warrior rig at a smaller scale as a stand-in villager body;
        // a dedicated civilian model is a later art pass.
        var packed = ResourceLoader.Load<PackedScene>("res://assets/models/sangam_warrior_rig.glb");
        if (packed == null) return null;
        var model = packed.Instantiate<Node3D>();
        model.Scale = Vector3.One * 0.24f;
        return model;
    }

    protected override Color RingColor() => new Color(0.95f, 0.78f, 0.25f); // amber = civilian

    // Villagers are fragile and unarmed.
    public override void _Ready()
    {
        MaxHealth = 25f;
        AttackDamage = 0f;
        AggroRange = 0f;
        base._Ready();
    }

    // Right-click a resource → gather it.
    public void GatherFrom(ResourceNode node)
    {
        _node = node;
        MoveTarget = null;
        _state = _carry > 0 ? VState.Returning : VState.ToResource;
    }

    // A manual move order cancels the gather job.
    public override void MoveTo(Vector3 point)
    {
        _node = null;
        _state = VState.Idle;
        base.MoveTo(point);
    }

    // Villagers ignore attack orders.
    public override void AttackTarget(Unit t) { }

    protected override void Think(double delta)
    {
        // A manual relocation takes precedence over any gather job.
        if (MoveTarget is Vector3 mv)
        {
            if (FlatDist(GlobalPosition, mv) < 0.1f) { MoveTarget = null; return; }
            Vector3 aim = Agent.IsNavigationFinished() ? mv : Agent.GetNextPathPosition();
            StepDirect(aim, delta);
            return;
        }

        switch (_state)
        {
            case VState.Idle:
                if (NodeUsable(_node)) _state = VState.ToResource;
                break;

            case VState.ToResource:
                if (!NodeUsable(_node)) { _node = FindNearestResource(_carryKind); if (_node == null) { _state = VState.Idle; break; } }
                if (FlatDist(GlobalPosition, _node!.GlobalPosition) <= GatherReach) _state = VState.Gathering;
                else StepDirect(_node!.GlobalPosition, delta);
                break;

            case VState.Gathering:
                if (!NodeUsable(_node)) { _state = _carry > 0 ? VState.Returning : VState.Idle; break; }
                Face(_node!.GlobalPosition);
                _carryKind = _node.Kind;
                _carry += _node.Gather(GatherRate * (float)delta);
                if (_carry >= Capacity || !GodotObject.IsInstanceValid(_node) || _node.Depleted)
                    _state = VState.Returning;
                break;

            case VState.Returning:
                var drop = FindNearestDropOff();
                if (drop == null) { _state = VState.Idle; break; }   // nowhere to bank
                if (FlatDist(GlobalPosition, drop.GlobalPosition) <= DropReach)
                {
                    MatchEconomy.Instance?.Deposit(_carryKind, Mathf.RoundToInt(_carry));
                    _carry = 0f;
                    if (NodeUsable(_node)) _state = VState.ToResource;
                    else { _node = FindNearestResource(_carryKind); _state = _node != null ? VState.ToResource : VState.Idle; }
                }
                else StepDirect(drop.GlobalPosition, delta);
                break;
        }
    }

    private static bool NodeUsable(ResourceNode? n)
        => n != null && GodotObject.IsInstanceValid(n) && !n.Depleted;

    private ResourceNode? FindNearestResource(ResourceKind kind)
    {
        ResourceNode? best = null;
        float bestDist = float.MaxValue;
        foreach (var node in GetTree().GetNodesInGroup("resources"))
        {
            if (node is not ResourceNode r || r.Depleted || r.Kind != kind) continue;
            float d = FlatDist(GlobalPosition, r.GlobalPosition);
            if (d < bestDist) { bestDist = d; best = r; }
        }
        return best;
    }

    private Node3D? FindNearestDropOff()
    {
        Node3D? best = null;
        float bestDist = float.MaxValue;
        foreach (var node in GetTree().GetNodesInGroup("dropoff"))
        {
            if (node is not Node3D d) continue;
            float dist = FlatDist(GlobalPosition, d.GlobalPosition);
            if (dist < bestDist) { bestDist = dist; best = d; }
        }
        return best;
    }
}
