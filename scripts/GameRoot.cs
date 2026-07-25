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
        SetupCamera();
        SetupSun();
        BuildGround(9, 9);
        AddChild(new Board());   // data-driven grid from the GameState autoload
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
}
