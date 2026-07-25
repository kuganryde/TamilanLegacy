using Godot;

// Full-screen overlay that draws the drag-select rectangle. Input-transparent
// so it never eats clicks; the SelectionManager drives Box/Active + QueueRedraw.
public partial class SelectionBox : Control
{
    public bool Active;
    public Rect2 Box;

    public override void _Ready()
    {
        MouseFilter = MouseFilterEnum.Ignore;
        SetAnchorsPreset(LayoutPreset.FullRect);
    }

    public override void _Draw()
    {
        if (!Active) return;
        DrawRect(Box, new Color(0.3f, 0.8f, 1f, 0.15f), filled: true);
        DrawRect(Box, new Color(0.45f, 0.9f, 1f, 0.9f), filled: false, width: 1.5f);
    }
}
