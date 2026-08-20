package engine

// Engine mantém o estado do autômato celular sobre um grid infinito e esparso.
type Engine struct {
	cells grid
}

func NewEngine() *Engine {
	return &Engine{cells: newGrid()}
}

func (e *Engine) ToggleCell(x, y int) {
	c := Coordinate{X: x, Y: y}
	if e.cells.contains(c) {
		e.cells.remove(c)
		return
	}
	e.cells.add(c)
}

func (e *Engine) SetCell(x, y int, alive bool) {
	c := Coordinate{X: x, Y: y}
	if alive {
		e.cells.add(c)
		return
	}
	e.cells.remove(c)
}

func (e *Engine) PlaceCells(cells []Coordinate) {
	for _, c := range cells {
		e.cells.add(c)
	}
}

func (e *Engine) IsAlive(x, y int) bool {
	return e.cells.contains(Coordinate{X: x, Y: y})
}

func (e *Engine) LiveCells() []Coordinate {
	return e.cells.snapshot()
}

func (e *Engine) LiveCount() int {
	return e.cells.count()
}

func (e *Engine) Tick() {
	e.cells = nextGeneration(e.cells)
}

func (e *Engine) Reset() {
	e.cells = newGrid()
}
