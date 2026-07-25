using Godot;
using System;

// RTS match economy: the Age-of-Empires-style resource ledger (Food/Wood/Stone/
// Gold) plus population. Villagers deposit gathered resources here; the HUD
// reads it. Separate from GameState (the ported city-builder Four-Pillars
// economy) so the two systems don't entangle.
//
// Registered in project.godot [autoload] as "Match"; access via
// MatchEconomy.Instance.
public partial class MatchEconomy : Node
{
    public static MatchEconomy Instance { get; private set; } = null!;

    public int Food { get; private set; } = 120;
    public int Wood { get; private set; } = 80;
    public int Stone { get; private set; } = 60;
    public int Gold { get; private set; } = 40;

    // Population is the live count of player-owned units (group "pop");
    // PopCap grows as houses/town-centers are built (M5). Fixed for now.
    public int PopCap { get; set; } = 15;
    public int Pop => IsInsideTree() ? GetTree().GetNodesInGroup("pop").Count : 0;

    // Fired when resources change (or on an explicit poke) so the HUD refreshes.
    public event Action? Changed;

    public override void _Ready() => Instance = this;

    public int Amount(ResourceKind kind) => kind switch
    {
        ResourceKind.Food => Food,
        ResourceKind.Wood => Wood,
        ResourceKind.Stone => Stone,
        ResourceKind.Gold => Gold,
        _ => 0,
    };

    public void Deposit(ResourceKind kind, int amount)
    {
        if (amount <= 0) return;
        switch (kind)
        {
            case ResourceKind.Food: Food += amount; break;
            case ResourceKind.Wood: Wood += amount; break;
            case ResourceKind.Stone: Stone += amount; break;
            case ResourceKind.Gold: Gold += amount; break;
        }
        Changed?.Invoke();
    }

    // Spend resources if affordable; returns false (and spends nothing) if not.
    // Used by training/building in later milestones.
    public bool TrySpend(int food = 0, int wood = 0, int stone = 0, int gold = 0)
    {
        if (Food < food || Wood < wood || Stone < stone || Gold < gold) return false;
        Food -= food; Wood -= wood; Stone -= stone; Gold -= gold;
        Changed?.Invoke();
        return true;
    }

    public bool HasPopRoom => Pop < PopCap;

    // Poke the HUD when something outside the ledger changes (pop, cap).
    public void NotifyChanged() => Changed?.Invoke();
}
