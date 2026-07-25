using Godot;

// Renders the GameState grid as a 3D isometric board: one tile per cell plus
// the matching .glb building model. Rebuilds whenever GameState fires Changed.
// (Full rebuild each time — fine for an 8x8 board; optimise later.)
public partial class Board : Node3D
{
    private const string ModelsDir = "res://assets/models/";
    private GameState _state = null!;

    public override void _Ready()
    {
        _state = GameState.Instance;
        _state.Changed += Rebuild;
        Rebuild();
    }

    public override void _ExitTree()
    {
        if (_state != null) _state.Changed -= Rebuild;
    }

    private static float WorldX(int col) => col - (GameState.Grid - 1) / 2f;
    private static float WorldZ(int row) => row - (GameState.Grid - 1) / 2f;

    private void Rebuild()
    {
        foreach (Node child in GetChildren()) child.QueueFree();

        foreach (var cell in _state.Cells)
        {
            var origin = new Vector3(WorldX(cell.Col), 0, WorldZ(cell.Row));

            // tile
            var tile = new MeshInstance3D
            {
                Mesh = new BoxMesh { Size = new Vector3(0.96f, 0.12f, 0.96f) },
                MaterialOverride = new StandardMaterial3D { AlbedoColor = TileColor(cell) },
                Position = origin + new Vector3(0, -0.06f, 0),
            };
            AddChild(tile);

            // building model
            string? model = ModelFor(cell.Type);
            if (model != null)
            {
                var packed = ResourceLoader.Load<PackedScene>(ModelsDir + model);
                if (packed != null)
                {
                    var node = packed.Instantiate<Node3D>();
                    node.Position = origin;
                    int lvl = cell.Level < 1 ? 1 : cell.Level;
                    node.Scale = Vector3.One * (0.86f + (lvl - 1) * 0.15f);
                    AddChild(node);
                }
            }
        }
    }

    private static string? ModelFor(ZoneType t) => t switch
    {
        ZoneType.Kovil => "gopuram.glb",
        ZoneType.Nagar => "market.glb",
        ZoneType.Quarry => "quarry.glb",
        ZoneType.Shipyard => "shipyard.glb",
        ZoneType.Warehouse => "warehouse.glb",
        ZoneType.Barracks => "barracks.glb",
        _ => null,
    };

    private static Color TileColor(GridCell c) => c.Type switch
    {
        ZoneType.River => new Color(0.18f, 0.47f, 0.63f),
        ZoneType.Ur => c.HasWater ? new Color(0.31f, 0.49f, 0.16f) : new Color(0.55f, 0.50f, 0.20f),
        ZoneType.Quarry => new Color(0.43f, 0.40f, 0.37f),
        ZoneType.Nagar or ZoneType.Kovil or ZoneType.Eri
            or ZoneType.Shipyard or ZoneType.Warehouse or ZoneType.Barracks => new Color(0.61f, 0.52f, 0.32f),
        _ => (c.Row + c.Col) % 2 == 0 ? new Color(0.48f, 0.64f, 0.29f) : new Color(0.44f, 0.60f, 0.25f),
    };
}
