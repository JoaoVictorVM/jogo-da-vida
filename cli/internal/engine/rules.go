package engine

func nextGeneration(current grid) grid {
	neighborCounts := make(map[Coordinate]int, current.count()*8)
	for cell := range current {
		for _, neighbor := range cell.neighbors() {
			neighborCounts[neighbor]++
		}
	}

	next := make(grid, current.count())
	for cell, count := range neighborCounts {
		if survives(current.contains(cell), count) {
			next.add(cell)
		}
	}
	return next
}

func survives(alive bool, liveNeighbors int) bool {
	if alive {
		return liveNeighbors == 2 || liveNeighbors == 3
	}
	return liveNeighbors == 3
}
