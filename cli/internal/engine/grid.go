package engine

type grid map[Coordinate]struct{}

func newGrid() grid {
	return make(grid)
}

func (g grid) add(c Coordinate) {
	g[c] = struct{}{}
}

func (g grid) remove(c Coordinate) {
	delete(g, c)
}

func (g grid) contains(c Coordinate) bool {
	_, ok := g[c]
	return ok
}

func (g grid) count() int {
	return len(g)
}

func (g grid) snapshot() []Coordinate {
	cells := make([]Coordinate, 0, len(g))
	for c := range g {
		cells = append(cells, c)
	}
	return cells
}
