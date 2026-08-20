package engine

// Coordinate identifica uma célula no grid infinito; X cresce para a direita e Y para baixo.
type Coordinate struct {
	X int
	Y int
}

func (c Coordinate) neighbors() [8]Coordinate {
	return [8]Coordinate{
		{c.X - 1, c.Y - 1},
		{c.X, c.Y - 1},
		{c.X + 1, c.Y - 1},
		{c.X - 1, c.Y},
		{c.X + 1, c.Y},
		{c.X - 1, c.Y + 1},
		{c.X, c.Y + 1},
		{c.X + 1, c.Y + 1},
	}
}
