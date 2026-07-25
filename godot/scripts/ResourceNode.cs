using Godot;

// A gatherable resource node (a stone quarry, a grove of trees, a berry patch,
// a gold vein). Villagers walk up, Gather() a bit each tick until it depletes,
// then it frees itself. In group "resources" so villagers/commands can find it.
public partial class ResourceNode : Node3D
{
    private const string ModelsDir = "res://assets/models/";

    [Export] public ResourceKind Kind = ResourceKind.Stone;
    [Export] public float Amount = 200f;

    public bool Depleted => Amount <= 0f;

    public override void _Ready()
    {
        AddToGroup("resources");
        BuildVisual();
    }

    // Take up to `want`; return what was actually available (0 when empty).
    public float Gather(float want)
    {
        if (Amount <= 0f) return 0f;
        float got = Mathf.Min(want, Amount);
        Amount -= got;
        if (Amount <= 0f) { RemoveFromGroup("resources"); QueueFree(); }
        return got;
    }

    private void BuildVisual()
    {
        // Reuse existing .glb where the semantics match; procedural otherwise.
        switch (Kind)
        {
            case ResourceKind.Stone:
                AddModelOr("quarry.glb", new Color(0.55f, 0.53f, 0.5f), 0.9f);
                break;
            case ResourceKind.Wood:
                AddModelOr("palm.glb", new Color(0.2f, 0.45f, 0.18f), 1.0f);
                break;
            case ResourceKind.Food:
                AddBerryBush();
                break;
            case ResourceKind.Gold:
                AddOreCluster(new Color(0.85f, 0.68f, 0.2f), emissive: true);
                break;
        }
    }

    private void AddModelOr(string glb, Color fallback, float scale)
    {
        var packed = ResourceLoader.Load<PackedScene>(ModelsDir + glb);
        if (packed != null)
        {
            var node = packed.Instantiate<Node3D>();
            node.Scale = Vector3.One * scale;
            AddChild(node);
        }
        else
        {
            AddOreCluster(fallback, emissive: false);
        }
    }

    private void AddBerryBush()
    {
        var bush = new MeshInstance3D
        {
            Mesh = new SphereMesh { Radius = 0.34f, Height = 0.6f },
            Position = new Vector3(0, 0.28f, 0),
            MaterialOverride = new StandardMaterial3D { AlbedoColor = new Color(0.18f, 0.42f, 0.16f) },
        };
        AddChild(bush);
        var rng = new RandomNumberGenerator();
        rng.Seed = (ulong)GetInstanceId();
        for (int i = 0; i < 6; i++)
        {
            var berry = new MeshInstance3D
            {
                Mesh = new SphereMesh { Radius = 0.06f, Height = 0.12f },
                Position = new Vector3(rng.RandfRange(-0.28f, 0.28f), rng.RandfRange(0.2f, 0.5f), rng.RandfRange(-0.28f, 0.28f)),
                MaterialOverride = new StandardMaterial3D { AlbedoColor = new Color(0.8f, 0.12f, 0.2f) },
            };
            AddChild(berry);
        }
    }

    private void AddOreCluster(Color color, bool emissive)
    {
        var rng = new RandomNumberGenerator();
        rng.Seed = (ulong)GetInstanceId();
        for (int i = 0; i < 5; i++)
        {
            float s = rng.RandfRange(0.16f, 0.3f);
            var rock = new MeshInstance3D
            {
                Mesh = new BoxMesh { Size = new Vector3(s, s, s) },
                Position = new Vector3(rng.RandfRange(-0.3f, 0.3f), s * 0.5f, rng.RandfRange(-0.3f, 0.3f)),
                RotationDegrees = new Vector3(0, rng.RandfRange(0, 360), 0),
                MaterialOverride = new StandardMaterial3D
                {
                    AlbedoColor = color,
                    EmissionEnabled = emissive,
                    Emission = emissive ? color * 0.4f : new Color(0, 0, 0),
                },
            };
            AddChild(rock);
        }
    }
}
