using Godot;

// Top-of-screen resource bar (Food / Wood / Stone / Gold / Pop), AoE-style.
// Reads MatchEconomy and refreshes whenever it fires Changed. Copper-plate
// palette to match the Chola theme; a fuller command-card HUD comes in M5.
public partial class ResourceHud : CanvasLayer
{
    private MatchEconomy _eco = null!;
    private Label _food = null!;
    private Label _wood = null!;
    private Label _stone = null!;
    private Label _gold = null!;
    private Label _pop = null!;

    public override void _Ready()
    {
        _eco = MatchEconomy.Instance;

        var panel = new PanelContainer();
        panel.SetAnchorsPreset(Control.LayoutPreset.TopWide);
        panel.OffsetBottom = 42;
        var style = new StyleBoxFlat
        {
            BgColor = new Color(0.10f, 0.07f, 0.04f, 0.88f),
            BorderColor = new Color(0.72f, 0.52f, 0.24f),
            BorderWidthBottom = 2,
        };
        style.SetContentMarginAll(6);
        panel.AddThemeStyleboxOverride("panel", style);
        AddChild(panel);

        var row = new HBoxContainer { Alignment = BoxContainer.AlignmentMode.Center };
        row.AddThemeConstantOverride("separation", 26);
        panel.AddChild(row);

        _food = Chip(row, new Color(0.95f, 0.85f, 0.55f));
        _wood = Chip(row, new Color(0.80f, 0.60f, 0.38f));
        _stone = Chip(row, new Color(0.82f, 0.82f, 0.84f));
        _gold = Chip(row, new Color(0.98f, 0.82f, 0.30f));
        _pop = Chip(row, new Color(0.75f, 0.88f, 0.98f));

        if (_eco != null) _eco.Changed += Refresh;
        Refresh();
    }

    public override void _ExitTree()
    {
        if (_eco != null) _eco.Changed -= Refresh;
    }

    private static Label Chip(HBoxContainer row, Color color)
    {
        var label = new Label { VerticalAlignment = VerticalAlignment.Center };
        label.AddThemeColorOverride("font_color", color);
        label.AddThemeFontSizeOverride("font_size", 18);
        row.AddChild(label);
        return label;
    }

    private void Refresh()
    {
        if (_eco == null) return;
        _food.Text = $"Food  {_eco.Food}";
        _wood.Text = $"Wood  {_eco.Wood}";
        _stone.Text = $"Stone  {_eco.Stone}";
        _gold.Text = $"Gold  {_eco.Gold}";
        _pop.Text = $"Pop  {_eco.Pop}/{_eco.PopCap}";
    }
}
