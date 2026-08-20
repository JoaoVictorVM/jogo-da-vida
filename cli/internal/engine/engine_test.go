package engine

import (
	"sort"
	"testing"
)

var glider = []Coordinate{
	{X: 1, Y: 0},
	{X: 2, Y: 1},
	{X: 0, Y: 2},
	{X: 1, Y: 2},
	{X: 2, Y: 2},
}

func translate(cells []Coordinate, dx, dy int) []Coordinate {
	moved := make([]Coordinate, len(cells))
	for i, c := range cells {
		moved[i] = Coordinate{X: c.X + dx, Y: c.Y + dy}
	}
	return moved
}

func sortCells(cells []Coordinate) []Coordinate {
	sorted := make([]Coordinate, len(cells))
	copy(sorted, cells)
	sort.Slice(sorted, func(i, j int) bool {
		if sorted[i].Y != sorted[j].Y {
			return sorted[i].Y < sorted[j].Y
		}
		return sorted[i].X < sorted[j].X
	})
	return sorted
}

func assertCells(t *testing.T, e *Engine, want []Coordinate) {
	t.Helper()
	got := sortCells(e.LiveCells())
	expected := sortCells(want)
	if len(got) != len(expected) {
		t.Fatalf("esperava %d células vivas %v, obteve %d %v", len(expected), expected, len(got), got)
	}
	for i := range got {
		if got[i] != expected[i] {
			t.Fatalf("esperava %v, obteve %v", expected, got)
		}
	}
}

func seed(cells []Coordinate) *Engine {
	e := NewEngine()
	e.PlaceCells(cells)
	return e
}

func TestTick_Blinker_Oscillates(t *testing.T) {
	horizontal := []Coordinate{{X: 4, Y: 5}, {X: 5, Y: 5}, {X: 6, Y: 5}}
	vertical := []Coordinate{{X: 5, Y: 4}, {X: 5, Y: 5}, {X: 5, Y: 6}}

	e := seed(horizontal)

	e.Tick()
	assertCells(t, e, vertical)

	e.Tick()
	assertCells(t, e, horizontal)
}

func TestTick_Block_RemainsStable(t *testing.T) {
	block := []Coordinate{{X: 0, Y: 0}, {X: 1, Y: 0}, {X: 0, Y: 1}, {X: 1, Y: 1}}
	e := seed(block)

	for i := 0; i < 5; i++ {
		e.Tick()
		assertCells(t, e, block)
	}
}

func TestTick_Glider_TranslatesCorrectly(t *testing.T) {
	e := seed(glider)

	for i := 0; i < 4; i++ {
		e.Tick()
	}

	assertCells(t, e, translate(glider, 1, 1))
}

func TestTick_Glider_NextGeneration(t *testing.T) {
	e := seed(glider)

	e.Tick()

	assertCells(t, e, []Coordinate{
		{X: 0, Y: 1},
		{X: 2, Y: 1},
		{X: 1, Y: 2},
		{X: 2, Y: 2},
		{X: 1, Y: 3},
	})
}

func TestTick_EmptyGrid_StaysEmpty(t *testing.T) {
	e := NewEngine()

	if e.LiveCount() != 0 {
		t.Fatalf("esperava grid vazio, obteve %d células", e.LiveCount())
	}

	e.Tick()

	if e.LiveCount() != 0 {
		t.Fatalf("esperava grid vazio após tick, obteve %d células", e.LiveCount())
	}
}

func TestTick_IsolatedCell_Dies(t *testing.T) {
	e := seed([]Coordinate{{X: 3, Y: 3}})

	e.Tick()

	if e.IsAlive(3, 3) {
		t.Fatal("célula isolada deveria morrer por subpopulação")
	}
	if e.LiveCount() != 0 {
		t.Fatalf("esperava 0 células vivas, obteve %d", e.LiveCount())
	}
}

func TestTick_CellWithFourNeighbors_Dies(t *testing.T) {
	e := seed([]Coordinate{
		{X: 0, Y: -1},
		{X: -1, Y: 0},
		{X: 0, Y: 0},
		{X: 1, Y: 0},
		{X: 0, Y: 1},
	})

	e.Tick()

	if e.IsAlive(0, 0) {
		t.Fatal("célula com 4 vizinhos deveria morrer por superpopulação")
	}
	for _, c := range []Coordinate{{X: -1, Y: -1}, {X: 1, Y: -1}, {X: -1, Y: 1}, {X: 1, Y: 1}} {
		if !e.IsAlive(c.X, c.Y) {
			t.Fatalf("esperava nascimento em %v", c)
		}
	}
}

func TestTick_DeadCellWithThreeNeighbors_Born(t *testing.T) {
	e := seed([]Coordinate{{X: 0, Y: 0}, {X: 1, Y: 0}, {X: 0, Y: 1}})

	e.Tick()

	if !e.IsAlive(1, 1) {
		t.Fatal("célula morta com exatamente 3 vizinhos deveria nascer")
	}
}

func TestTick_CellWithTwoOrThreeNeighbors_Survives(t *testing.T) {
	tests := []struct {
		name         string
		liveNeighbor int
		alive        bool
		want         bool
	}{
		{"viva com 0 vizinhos", 0, true, false},
		{"viva com 1 vizinho", 1, true, false},
		{"viva com 2 vizinhos", 2, true, true},
		{"viva com 3 vizinhos", 3, true, true},
		{"viva com 4 vizinhos", 4, true, false},
		{"viva com 8 vizinhos", 8, true, false},
		{"morta com 2 vizinhos", 2, false, false},
		{"morta com 3 vizinhos", 3, false, true},
		{"morta com 4 vizinhos", 4, false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := survives(tt.alive, tt.liveNeighbor); got != tt.want {
				t.Fatalf("survives(%v, %d) = %v, esperava %v", tt.alive, tt.liveNeighbor, got, tt.want)
			}
		})
	}
}

func TestToggleCell_FlipsState(t *testing.T) {
	e := NewEngine()

	e.ToggleCell(2, 7)
	if !e.IsAlive(2, 7) {
		t.Fatal("toggle em célula morta deveria torná-la viva")
	}

	e.ToggleCell(2, 7)
	if e.IsAlive(2, 7) {
		t.Fatal("toggle em célula viva deveria torná-la morta")
	}
	if e.LiveCount() != 0 {
		t.Fatalf("esperava 0 células vivas, obteve %d", e.LiveCount())
	}
}

func TestSetCell_ExplicitState(t *testing.T) {
	e := NewEngine()

	e.SetCell(1, 1, true)
	e.SetCell(1, 1, true)
	if !e.IsAlive(1, 1) || e.LiveCount() != 1 {
		t.Fatalf("SetCell(true) deveria ser idempotente, obteve %d células", e.LiveCount())
	}

	e.SetCell(1, 1, false)
	e.SetCell(1, 1, false)
	if e.IsAlive(1, 1) || e.LiveCount() != 0 {
		t.Fatalf("SetCell(false) deveria ser idempotente, obteve %d células", e.LiveCount())
	}
}

func TestPlaceCells_ReplacesFootprintOnly(t *testing.T) {
	e := seed([]Coordinate{{X: 9, Y: 9}})

	e.PlaceCells([]Coordinate{{X: 0, Y: 0}, {X: 1, Y: 0}})

	if !e.IsAlive(9, 9) {
		t.Fatal("PlaceCells não deveria afetar células fora do footprint")
	}
	if !e.IsAlive(0, 0) || !e.IsAlive(1, 0) {
		t.Fatal("PlaceCells deveria marcar como vivas todas as coordenadas informadas")
	}
	if e.LiveCount() != 3 {
		t.Fatalf("esperava 3 células vivas, obteve %d", e.LiveCount())
	}

	e.PlaceCells(nil)
	if e.LiveCount() != 3 {
		t.Fatalf("PlaceCells vazio não deveria alterar o grid, obteve %d", e.LiveCount())
	}
}

func TestLiveCells_ReturnsIndependentSnapshot(t *testing.T) {
	e := seed(glider)

	snapshot := e.LiveCells()
	snapshot[0] = Coordinate{X: 999, Y: 999}

	assertCells(t, e, glider)
}

func TestReset_ClearsAllCells(t *testing.T) {
	e := seed(glider)

	e.Reset()

	if e.LiveCount() != 0 {
		t.Fatalf("esperava grid vazio após Reset, obteve %d", e.LiveCount())
	}
	if len(e.LiveCells()) != 0 {
		t.Fatal("LiveCells deveria estar vazio após Reset")
	}

	e.SetCell(0, 0, true)
	if !e.IsAlive(0, 0) {
		t.Fatal("engine deveria continuar utilizável após Reset")
	}
}

func TestTick_LargeAndNegativeCoordinates(t *testing.T) {
	const far = 1_000_000_000

	e := seed(translate(glider, -far, far))

	for i := 0; i < 4; i++ {
		e.Tick()
	}

	assertCells(t, e, translate(glider, -far+1, far+1))
}

func TestCoordinate_NeighborsExcludeItself(t *testing.T) {
	c := Coordinate{X: 3, Y: -4}

	unique := make(map[Coordinate]struct{})
	for _, n := range c.neighbors() {
		if n == c {
			t.Fatal("vizinhos não devem incluir a própria célula")
		}
		unique[n] = struct{}{}
	}

	if len(unique) != 8 {
		t.Fatalf("esperava 8 vizinhos distintos, obteve %d", len(unique))
	}
}
