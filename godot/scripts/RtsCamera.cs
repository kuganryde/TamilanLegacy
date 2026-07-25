using Godot;

// Age-of-Empires-style RTS camera rig. This Node3D is the pivot (pan + yaw);
// its Camera3D child looks down at a fixed tilt. WASD/arrows pan (relative to
// facing), Q/E rotate, mouse wheel zooms.
public partial class RtsCamera : Node3D
{
    [Export] public float PanSpeed = 9f;
    [Export] public float RotateSpeed = 1.6f;
    [Export] public float ZoomMin = 5f;
    [Export] public float ZoomMax = 22f;

    private Camera3D _cam = null!;
    private float _size = 12f;

    public override void _Ready()
    {
        _cam = new Camera3D
        {
            Projection = Camera3D.ProjectionType.Orthogonal,
            Size = _size,
        };
        _cam.Position = new Vector3(0, 14, 12);
        _cam.RotationDegrees = new Vector3(-48, 0, 0);
        AddChild(_cam);
        _cam.MakeCurrent();
    }

    public override void _Process(double delta)
    {
        float dt = (float)delta;

        var move = Vector3.Zero;
        if (Input.IsKeyPressed(Key.W) || Input.IsKeyPressed(Key.Up)) move.Z -= 1;
        if (Input.IsKeyPressed(Key.S) || Input.IsKeyPressed(Key.Down)) move.Z += 1;
        if (Input.IsKeyPressed(Key.A) || Input.IsKeyPressed(Key.Left)) move.X -= 1;
        if (Input.IsKeyPressed(Key.D) || Input.IsKeyPressed(Key.Right)) move.X += 1;
        if (move != Vector3.Zero)
            Position += (Basis * move).Normalized() * PanSpeed * dt; // pan relative to yaw

        if (Input.IsKeyPressed(Key.Q)) RotateY(RotateSpeed * dt);
        if (Input.IsKeyPressed(Key.E)) RotateY(-RotateSpeed * dt);
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventMouseButton mb && mb.Pressed)
        {
            if (mb.ButtonIndex == MouseButton.WheelUp) SetZoom(_size - 1.2f);
            else if (mb.ButtonIndex == MouseButton.WheelDown) SetZoom(_size + 1.2f);
        }
    }

    private void SetZoom(float s)
    {
        _size = Mathf.Clamp(s, ZoomMin, ZoomMax);
        _cam.Size = _size;
    }
}
