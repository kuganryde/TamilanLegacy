using Godot;

// Starter root for the Godot rebuild of Tamilan Legacy.
//
// Builds a small isometric board at runtime and drops in the ported .glb
// models to prove the asset pipeline works in Godot. This is a *scaffold* —
// open the project in Godot 4.3 (mono/C#) to import the models and run it,
// then grow it into the full game following README.md.
public partial class GameRoot : Node3D
{
    public override void _Ready()
    {
        SetupEnvironment();
        SetupSun();
        BuildGround(16, 16);
        AddChild(new RtsCamera());        // AoE-style pan/zoom/rotate camera
        AddChild(new Board());            // data-driven city grid (GameState autoload)
        AddChild(new SelectionManager()); // click to select, right-click to move
        SpawnUnits();
    }

    private void SpawnUnits()
    {
        for (int i = 0; i < 5; i++)
        {
            var u = new Unit { Position = new Vector3(-3.5f + i * 0.9f, 0, 4.5f) };
            AddChild(u);
        }
        for (int i = 0; i < 4; i++)
        {
            var e = new Unit { Enemy = true, Position = new Vector3(1.5f + i * 0.9f, 0, -4.5f) };
            AddChild(e);
        }
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
}
