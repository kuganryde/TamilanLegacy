extends Node
# Autoload singleton holding the city-builder state and the economy tick.
# Registered in project.godot [autoload] as "GameState". Ported from the web
# game's App.tsx (and the earlier C# port).

const GRID := 8
const TICK_SECONDS := 3.0

# ---- inner data classes ----------------------------------------------------
class Pillars:
	var aruvam := 0   # Wealth
	var arivu := 0    # Knowledge
	var anbu := 0     # Devotion
	var aalavan := 0  # Power
	func _init(a := 0, k := 0, d := 0, p := 0) -> void:
		aruvam = a; arivu = k; anbu = d; aalavan = p

class GridCell:
	var row := 0
	var col := 0
	var type: int = GameEnums.ZoneType.EMPTY
	var level := 0
	var has_water := false
	var workers := 0
	var animals := 0

class Livestock:
	var elephants := 2
	var oxen := 3

class Army:
	var warrior := 0
	var spearman := 0
	var archer := 0
	var cavalry := 0
	func total() -> int:
		return warrior + spearman + archer + cavalry

# ---- state -----------------------------------------------------------------
var res := Pillars.new(350, 40, 10, 30)
var cells: Array[GridCell] = []
var stock := Livestock.new()
var army := Army.new()

signal changed

var _acc := 0.0

func _ready() -> void:
	_init_grid()

func _process(delta: float) -> void:
	_acc += delta
	if _acc >= TICK_SECONDS:
		_acc -= TICK_SECONDS
		var inc := compute_income()
		res.aruvam += inc.aruvam
		res.arivu += inc.arivu
		res.anbu += inc.anbu
		res.aalavan = min(300, res.aalavan + inc.aalavan)
		changed.emit()

# ---- workforce -------------------------------------------------------------
func total_workers() -> int:
	return 12

func assigned_workers() -> int:
	var n := 0
	for c in cells:
		n += c.workers
	return n

func available_workers() -> int:
	return max(0, total_workers() - assigned_workers())

# ---- static-ish helpers ----------------------------------------------------
static func animal_for(t: int) -> int:
	match t:
		GameEnums.ZoneType.UR:
			return GameEnums.AnimalKind.OX
		GameEnums.ZoneType.QUARRY, GameEnums.ZoneType.KOVIL, GameEnums.ZoneType.SHIPYARD:
			return GameEnums.AnimalKind.ELEPHANT
		_:
			return GameEnums.AnimalKind.NONE

static func zone_cost(t: int) -> int:
	match t:
		GameEnums.ZoneType.UR: return 50
		GameEnums.ZoneType.NAGAR: return 120
		GameEnums.ZoneType.KOVIL: return 250
		GameEnums.ZoneType.ERI: return 100
		GameEnums.ZoneType.SHIPYARD: return 200
		GameEnums.ZoneType.WAREHOUSE: return 150
		GameEnums.ZoneType.BARRACKS: return 180
		_: return 0

# ---- economy (mirrors the web computeIncome) -------------------------------
func compute_income() -> Pillars:
	var inc := Pillars.new()
	inc.arivu += max(1, int(round(available_workers() * 0.8)))  # idle scholars
	for cell in cells:
		var w := cell.workers
		var a := cell.animals
		var lvl := max(1, cell.level)
		match cell.type:
			GameEnums.ZoneType.UR:
				var water_mult := 2 if cell.has_water else 1
				inc.aruvam += int(round(w * 8 * water_mult * lvl * (1.0 + a * 0.35)))
			GameEnums.ZoneType.NAGAR:
				inc.aruvam += w * 14 * lvl
				inc.aalavan += int(round(lvl * 0.5))
			GameEnums.ZoneType.KOVIL:
				inc.anbu += int(round(w * 10 * lvl * (1.0 + a * 0.3)))
				inc.arivu += lvl * 2
			GameEnums.ZoneType.WAREHOUSE:
				inc.aruvam += 6 * lvl + w * 3
				inc.arivu += 1
			GameEnums.ZoneType.SHIPYARD:
				inc.aruvam += int(round((5 * lvl + w * 4) * (1.0 + a * 0.25)))
				inc.arivu += lvl
			GameEnums.ZoneType.BARRACKS:
				inc.aalavan += 3 * lvl + w * 2
	inc.aalavan += 1
	return inc

# ---- actions ---------------------------------------------------------------
func cell_at(row: int, col: int) -> GridCell:
	for c in cells:
		if c.row == row and c.col == col:
			return c
	return null

func build_zone(cell: GridCell, type: int) -> void:
	var cost := zone_cost(type)
	if res.aruvam < cost:
		return
	res.aruvam -= cost
	cell.type = type
	cell.level = 1
	cell.workers = 0
	cell.animals = 0
	_recalculate_water()
	changed.emit()

func assign_workers(cell: GridCell, change: int) -> void:
	if change > 0 and available_workers() <= 0:
		return
	cell.workers = max(0, cell.workers + change)
	changed.emit()

# ---- setup -----------------------------------------------------------------
func _init_grid() -> void:
	cells.clear()
	for r in range(GRID):
		for c in range(GRID):
			var cell := GridCell.new()
			cell.row = r
			cell.col = c
			if r == 0:
				cell.type = GameEnums.ZoneType.RIVER
				cell.has_water = true
				cell.level = 1
			if (r == 3 and c == 2) or (r == 5 and c == 5):
				cell.type = GameEnums.ZoneType.QUARRY
				cell.level = 1
			cells.append(cell)
	# A little starter city so the board isn't empty and income flows.
	_seed(2, 3, GameEnums.ZoneType.KOVIL, 1, 2)
	_seed(2, 5, GameEnums.ZoneType.NAGAR, 1, 2)
	_seed(4, 4, GameEnums.ZoneType.ERI, 1)
	_seed(5, 3, GameEnums.ZoneType.UR, 1, 2, 1)
	_seed(5, 4, GameEnums.ZoneType.BARRACKS, 1, 1)
	var q := cell_at(3, 2)
	if q: q.workers = 2  # quarry crew
	_recalculate_water()

func _seed(r: int, c: int, type: int, level: int, workers := 0, animals := 0) -> void:
	var cell := cell_at(r, c)
	if cell == null:
		return
	cell.type = type
	cell.level = level
	cell.workers = workers
	cell.animals = animals

func _recalculate_water() -> void:
	for c in cells:
		c.has_water = c.type == GameEnums.ZoneType.RIVER
	for src in cells:
		if src.type != GameEnums.ZoneType.RIVER and src.type != GameEnums.ZoneType.ERI:
			continue
		for t in cells:
			if t.type == GameEnums.ZoneType.RIVER or t.type == GameEnums.ZoneType.ERI:
				continue
			if abs(src.row - t.row) <= 1 and abs(src.col - t.col) <= 1:
				t.has_water = true
