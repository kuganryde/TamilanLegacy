class_name GameEnums
extends RefCounted

# Shared enums for the GDScript RTS. GDScript has no global enums without a
# class_name holder, so they live here and are referenced as
# GameEnums.ResourceKind.STONE, etc.

enum ZoneType { EMPTY, RIVER, QUARRY, UR, NAGAR, KOVIL, ERI, SHIPYARD, WAREHOUSE, BARRACKS }
enum AnimalKind { NONE, ELEPHANT, OX }

# RTS economy resources (Age-of-Empires style), distinct from the city-builder
# Four Pillars. Gathered by villagers from resource nodes, banked at drop-offs.
enum ResourceKind { FOOD, WOOD, STONE, GOLD }
