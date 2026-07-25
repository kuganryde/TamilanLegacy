using Godot;

// A resource drop-off point (town centre / granary / warehouse). Villagers
// return here to bank what they've gathered. In group "dropoff" so the nearest
// one can be found. Renders with the warehouse .glb.
public partial class DropOff : Node3D
{
    private const string ModelsDir = "res://assets/models/";
    [Export] public string Model = "warehouse.glb";

    public override void _Ready()
    {
        AddToGroup("dropoff");
        var packed = ResourceLoader.Load<PackedScene>(ModelsDir + Model);
        if (packed != null)
        {
            var node = packed.Instantiate<Node3D>();
            node.Scale = Vector3.One * 1.0f;
            AddChild(node);
        }
        else
        {
            AddChild(new MeshInstance3D
            {
                Mesh = new BoxMesh { Size = new Vector3(1.1f, 0.8f, 1.1f) },
                Position = new Vector3(0, 0.4f, 0),
                MaterialOverride = new StandardMaterial3D { AlbedoColor = new Color(0.6f, 0.5f, 0.3f) },
            });
        }
    }
}
