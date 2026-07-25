using Godot;

// Starter root for the Godot rebuild of Tamilan Legacy.
//
// Builds a small isometric board at runtime and drops in the ported .glb
// models to prove the asset pipeline works in Godot. This is a *scaffold* —
// open the project in Godot 4.3 (mono/C#) to import the models and run it,
// then grow it into the full game following README.md.
public partial class GameRoot : Node3D
{
    private const string ModelsDir = "res://assets/models/";

    public override void _Ready()
    {
        SetupEnvironment();
        SetupCamera();
        SetupSun();
        BuildGround(8, 8);
        PlaceShowcase();
    }

    private void SetupEnvironment()
    {
        var env = new Godot.Environment
        {
            BackgroundMode = Godot.Environment.BGMode.Color,
            BackgroundColor = new Color(0.07f, 0.07f, 0.09f),
            AmbientLightSource = Godot.Environment.AmbientSource.Color,
            AmbientLightColor = new Color(0.50f, 0.55f, 0.62f),
            AmbientLightEnergy = 0.6f,
        };
        AddChild(new WorldEnvironment { Environment = env });
    }

    private void SetupCamera()
    {
        // Orthographic isometric camera, echoing the web game's board.
        var cam = new Camera3D
        {
            Projection = Camera3D.ProjectionType.Orthogonal,
            Size = 12f,
        };
        cam.Position = new Vector3(9, 10, 9);
        cam.LookAtFromPosition(cam.Position, Vector3.Zero, Vector3.Up);
        AddChild(cam);
    }

    private void SetupSun()
    {
        var sun = new DirectionalLight3D
        {
            ShadowEnabled = true,
            LightEnergy = 1.2f,
            LightColor = new Color(1f, 0.94f, 0.82f),
        };
        sun.RotationDegrees = new Vector3(-55, -40, 0);
        AddChild(sun);
    }

    private void BuildGround(int cols, int rows)
    {
        var mi = new MeshInstance3D
        {
            Mesh = new PlaneMesh { Size = new Vector2(cols, rows) },
            MaterialOverride = new StandardMaterial3D { AlbedoColor = new Color(0.30f, 0.42f, 0.20f) },
            Position = new Vector3(0, -0.06f, 0),
        };
        AddChild(mi);
    }

    private void PlaceShowcase()
    {
        // (model file, gridX, gridZ, scale) — a representative slice of the library.
        var items = new (string File, int X, int Z, float Scale)[]
        {
            ("gopuram.glb", 0, 0, 0.9f),
            ("market.glb", 2, 0, 0.9f),
            ("warehouse.glb", -2, 0, 0.85f),
            ("shipyard.glb", 0, 2, 0.9f),
            ("barracks.glb", 0, -2, 0.85f),
            ("quarry.glb", 2, 2, 1.0f),
            ("elephant.glb", -2, 2, 0.6f),
            ("palm.glb", 3, -2, 0.6f),
            ("sangam_warrior.glb", -2, -2, 0.35f),
            ("sangam_cavalry.glb", 3, 1, 0.4f),
        };
        foreach (var it in items)
            PlaceModel(it.File, new Vector3(it.X, 0, it.Z), it.Scale);
    }

    private void PlaceModel(string file, Vector3 pos, float scale)
    {
        string path = ModelsDir + file;
        var packed = ResourceLoader.Load<PackedScene>(path);
        if (packed == null)
        {
            GD.PushWarning($"Model not imported yet: {path} (open the Godot editor once so it imports the .glb).");
            return;
        }
        var node = packed.Instantiate<Node3D>();
        node.Position = pos;
        node.Scale = Vector3.One * scale;
        AddChild(node);
    }
}
