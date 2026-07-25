// Core data model for Tamilan Legacy — ported from the web game's types.ts.
using System.Collections.Generic;

public enum ZoneType { Empty, River, Quarry, Ur, Nagar, Kovil, Eri, Shipyard, Warehouse, Barracks }
public enum AnimalKind { None, Elephant, Ox }

// RTS economy resources (Age-of-Empires style), distinct from the city-builder
// Four Pillars. Gathered by villagers from ResourceNodes, banked at DropOffs.
public enum ResourceKind { Food, Wood, Stone, Gold }

// The Four Pillars.
public class Pillars
{
    public int Aruvam;   // Wealth
    public int Arivu;    // Knowledge
    public int Anbu;     // Devotion
    public int Aalavan;  // Power

    public Pillars() { }
    public Pillars(int aruvam, int arivu, int anbu, int aalavan)
    {
        Aruvam = aruvam; Arivu = arivu; Anbu = anbu; Aalavan = aalavan;
    }
}

public class GridCell
{
    public int Row;
    public int Col;
    public ZoneType Type = ZoneType.Empty;
    public int Level;
    public bool HasWater;
    public int Workers;
    public int Animals;
}

public class Livestock
{
    public int Elephants = 2;
    public int Oxen = 3;
}

public class Army
{
    public int Warrior;
    public int Spearman;
    public int Archer;
    public int Cavalry;
    public int Total => Warrior + Spearman + Archer + Cavalry;
}
