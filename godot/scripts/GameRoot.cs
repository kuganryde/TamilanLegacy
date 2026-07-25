using Godot;

// Starter root for the Godot rebuild of Tamilan Legacy.
//
// Builds a small isometric board at runtime and drops in the ported .glb
// models to prove the asset pipeline works in Godot. This is a *scaffold* —
// open the project in Godot 4.3 (mono/C#) to import the models and run it,
// then grow it into the full game following README.md.
public partial class GameRoot : Node3D
{
    private NavigationRegion3D _nav = null!;

    public override void _Ready()
    {
        SetupEnvironment();
        SetupSun();

        // Navigation region: ground + buildings are bake sources so units path
        // around the city. Units live outside it (they're agents, not geometry).
        _nav = new NavigationRegion3D
        {
            NavigationMesh = new NavigationMesh
            {
                CellSize = 0.15f,
                CellHeight = 0.15f,
                AgentRadius = 0.35f,
                AgentHeight = 1.2f,
                AgentMaxSlope = 45f,
            },
        };
        AddChild(_nav);

        BuildGround(16, 16);              // added under _nav
        _nav.AddChild(new Board());       // city tiles + building .glb (carved as obstacles)

        AddChild(new RtsCamera());        // AoE-style pan / rotate / zoom
        AddChild(new SelectionManager()); // click / drag-box select, right-click move / gather
        SpawnUnits();
        SpawnEconomy();                   // villagers, resource nodes, drop-off (M4)
        AddChild(new ResourceHud());      // top resource/pop bar (M4)

        // Bake once the geometry exists. If the bake is empty, units fall back
        // to direct movement — so the game is playable either way.
        CallDeferred(nameof(BakeNav));
    }

    private void BakeNav() => _nav.BakeNavigationMesh();

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

    // M4: a small working economy on the open ground south of the city — a
    // drop-off, resource nodes, and villagers ready to be tasked (right-click a
    // node with villagers selected).
    private void SpawnEconomy()
    {
        AddChild(new DropOff { Position = new Vector3(-1.5f, 0, 5.0f) });

        SpawnResource(ResourceKind.Stone, 220, new Vector3(2.6f, 0, 5.4f));
        SpawnResource(ResourceKind.Stone, 220, new Vector3(3.3f, 0, 6.1f));
        SpawnResource(ResourceKind.Wood, 260, new Vector3(-4.2f, 0, 5.6f));
        SpawnResource(ResourceKind.Wood, 260, new Vector3(-4.6f, 0, 6.4f));
        SpawnResource(ResourceKind.Wood, 260, new Vector3(-3.6f, 0, 6.7f));
        SpawnResource(ResourceKind.Food, 180, new Vector3(0.2f, 0, 6.6f));
        SpawnResource(ResourceKind.Food, 180, new Vector3(0.9f, 0, 7.0f));
        SpawnResource(ResourceKind.Gold, 150, new Vector3(4.6f, 0, 5.2f));

        for (int i = 0; i < 4; i++)
        {
            var v = new Villager { Position = new Vector3(-2.6f + i * 0.7f, 0, 4.0f) };
            AddChild(v);
        }
    }

    private void SpawnResource(ResourceKind kind, float amount, Vector3 pos)
        => AddChild(new ResourceNode { Kind = kind, Amount = amount, Position = pos });

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
        _nav.AddChild(mi);   // bake source for the navmesh floor
    }
}
