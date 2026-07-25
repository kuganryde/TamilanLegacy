using Godot;
using System;
using System.Collections.Generic;

// Autoload singleton holding the whole game state and the economy tick.
// Registered in project.godot [autoload] as "GameState". Access via
// GameState.Instance. Ported from the web game's App.tsx.
public partial class GameState : Node
{
    public static GameState Instance { get; private set; } = null!;

    public const int Grid = 8;

    public Pillars Res = new(350, 40, 10, 30);
    public List<GridCell> Cells = new();
    public Livestock Stock = new();
    public Army Army = new();

    // Fired whenever the grid/economy changes so views (Board, HUD) refresh.
    public event Action? Changed;

    private double _acc;
    private const double TickSeconds = 3.0;

    public override void _Ready()
    {
        Instance = this;
        InitGrid();
    }

    public override void _Process(double delta)
    {
        _acc += delta;
        if (_acc >= TickSeconds)
        {
            _acc -= TickSeconds;
            var inc = ComputeIncome();
            Res.Aruvam += inc.Aruvam;
            Res.Arivu += inc.Arivu;
            Res.Anbu += inc.Anbu;
            Res.Aalavan = Math.Min(300, Res.Aalavan + inc.Aalavan);
            Changed?.Invoke();
        }
    }

    // ---- workforce ---------------------------------------------------------
    public int TotalWorkers => 12;
    public int AssignedWorkers
    {
        get { int n = 0; foreach (var c in Cells) n += c.Workers; return n; }
    }
    public int AvailableWorkers => Math.Max(0, TotalWorkers - AssignedWorkers);

    // ---- static helpers ----------------------------------------------------
    public static AnimalKind AnimalFor(ZoneType t) => t switch
    {
        ZoneType.Ur => AnimalKind.Ox,
        ZoneType.Quarry or ZoneType.Kovil or ZoneType.Shipyard => AnimalKind.Elephant,
        _ => AnimalKind.None,
    };

    public static int ZoneCost(ZoneType t) => t switch
    {
        ZoneType.Ur => 50,
        ZoneType.Nagar => 120,
        ZoneType.Kovil => 250,
        ZoneType.Eri => 100,
        ZoneType.Shipyard => 200,
        ZoneType.Warehouse => 150,
        ZoneType.Barracks => 180,
        _ => 0,
    };

    // ---- economy (mirrors the web computeIncome) ---------------------------
    public Pillars ComputeIncome()
    {
        var inc = new Pillars();
        inc.Arivu += Math.Max(1, (int)Math.Round(AvailableWorkers * 0.8)); // idle scholars
        foreach (var cell in Cells)
        {
            int w = cell.Workers;
            int a = cell.Animals;
            int lvl = Math.Max(1, cell.Level);
            switch (cell.Type)
            {
                case ZoneType.Ur:
                    inc.Aruvam += (int)Math.Round(w * 8 * (cell.HasWater ? 2 : 1) * lvl * (1 + a * 0.35));
                    break;
                case ZoneType.Nagar:
                    inc.Aruvam += w * 14 * lvl;
                    inc.Aalavan += (int)Math.Round(lvl * 0.5);
                    break;
                case ZoneType.Kovil:
                    inc.Anbu += (int)Math.Round(w * 10 * lvl * (1 + a * 0.3));
                    inc.Arivu += lvl * 2;
                    break;
                case ZoneType.Warehouse:
                    inc.Aruvam += 6 * lvl + w * 3;
                    inc.Arivu += 1;
                    break;
                case ZoneType.Shipyard:
                    inc.Aruvam += (int)Math.Round((5 * lvl + w * 4) * (1 + a * 0.25));
                    inc.Arivu += lvl;
                    break;
                case ZoneType.Barracks:
                    inc.Aalavan += 3 * lvl + w * 2;
                    break;
            }
        }
        inc.Aalavan += 1;
        return inc;
    }

    // ---- actions -----------------------------------------------------------
    public GridCell? CellAt(int row, int col) => Cells.Find(c => c.Row == row && c.Col == col);

    public void BuildZone(GridCell cell, ZoneType type)
    {
        int cost = ZoneCost(type);
        if (Res.Aruvam < cost) return;
        Res.Aruvam -= cost;
        cell.Type = type;
        cell.Level = 1;
        cell.Workers = 0;
        cell.Animals = 0;
        RecalculateWater();
        Changed?.Invoke();
    }

    public void AssignWorkers(GridCell cell, int change)
    {
        if (change > 0 && AvailableWorkers <= 0) return;
        cell.Workers = Math.Max(0, cell.Workers + change);
        Changed?.Invoke();
    }

    // ---- setup -------------------------------------------------------------
    private void InitGrid()
    {
        Cells.Clear();
        for (int r = 0; r < Grid; r++)
        for (int c = 0; c < Grid; c++)
        {
            var cell = new GridCell { Row = r, Col = c };
            if (r == 0) { cell.Type = ZoneType.River; cell.HasWater = true; cell.Level = 1; }
            if ((r == 3 && c == 2) || (r == 5 && c == 5)) { cell.Type = ZoneType.Quarry; cell.Level = 1; }
            Cells.Add(cell);
        }
        // A little starter city so the board isn't empty and income flows.
        Seed(2, 3, ZoneType.Kovil, 1, workers: 2);
        Seed(2, 5, ZoneType.Nagar, 1, workers: 2);
        Seed(4, 4, ZoneType.Eri, 1);
        Seed(5, 3, ZoneType.Ur, 1, workers: 2, animals: 1);
        Seed(5, 4, ZoneType.Barracks, 1, workers: 1);
        CellAt(3, 2)!.Workers = 2; // quarry crew
        RecalculateWater();
    }

    private void Seed(int r, int c, ZoneType type, int level, int workers = 0, int animals = 0)
    {
        var cell = CellAt(r, c);
        if (cell == null) return;
        cell.Type = type; cell.Level = level; cell.Workers = workers; cell.Animals = animals;
    }

    private void RecalculateWater()
    {
        foreach (var c in Cells) c.HasWater = c.Type == ZoneType.River;
        var sources = Cells.FindAll(c => c.Type == ZoneType.River || c.Type == ZoneType.Eri);
        foreach (var src in sources)
            foreach (var t in Cells)
                if (t.Type != ZoneType.River && t.Type != ZoneType.Eri &&
                    Math.Abs(src.Row - t.Row) <= 1 && Math.Abs(src.Col - t.Col) <= 1)
                    t.HasWater = true;
    }
}
