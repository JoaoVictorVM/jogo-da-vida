package camera

import (
	"testing"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/engine"
)

func TestNewCamera_DefaultsToOriginAndMiddleZoom(t *testing.T) {
	cam := NewCamera()

	if got := cam.Position(); got != (engine.Coordinate{X: 0, Y: 0}) {
		t.Fatalf("esperava câmera na origem, obteve %v", got)
	}
	if got := cam.ZoomLevel(); got != DefaultZoomLevel {
		t.Fatalf("esperava zoom %d, obteve %d", DefaultZoomLevel, got)
	}
}

func TestCamera_Move_ShiftsPositionByGivenDelta(t *testing.T) {
	tests := []struct {
		name   string
		deltas [][2]int
		want   engine.Coordinate
	}{
		{"um passo positivo", [][2]int{{3, -2}}, engine.Coordinate{X: 3, Y: -2}},
		{"passos acumulados", [][2]int{{3, -2}, {-5, 7}}, engine.Coordinate{X: -2, Y: 5}},
		{"passo nulo", [][2]int{{0, 0}}, engine.Coordinate{X: 0, Y: 0}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cam := NewCamera()
			for _, delta := range tt.deltas {
				cam.Move(delta[0], delta[1])
			}
			if got := cam.Position(); got != tt.want {
				t.Fatalf("esperava %v, obteve %v", tt.want, got)
			}
		})
	}
}

func TestCamera_ZoomIn_IncrementsAndClampsAtMax(t *testing.T) {
	cam := NewCamera()

	cam.ZoomIn()
	if got := cam.ZoomLevel(); got != DefaultZoomLevel+1 {
		t.Fatalf("esperava zoom %d, obteve %d", DefaultZoomLevel+1, got)
	}

	for i := 0; i < 6; i++ {
		cam.ZoomIn()
	}
	if got := cam.ZoomLevel(); got != MaxZoomLevel {
		t.Fatalf("esperava zoom travado em %d, obteve %d", MaxZoomLevel, got)
	}
}

func TestCamera_ZoomOut_DecrementsAndClampsAtMin(t *testing.T) {
	cam := NewCamera()

	cam.ZoomOut()
	if got := cam.ZoomLevel(); got != DefaultZoomLevel-1 {
		t.Fatalf("esperava zoom %d, obteve %d", DefaultZoomLevel-1, got)
	}

	for i := 0; i < 6; i++ {
		cam.ZoomOut()
	}
	if got := cam.ZoomLevel(); got != MinZoomLevel {
		t.Fatalf("esperava zoom travado em %d, obteve %d", MinZoomLevel, got)
	}
}

func TestCamera_MoveStep_ScalesWithZoomLevel(t *testing.T) {
	want := [MaxZoomLevel + 1]int{4, 2, 1, 1, 1}

	for level, expected := range want {
		cam := NewCamera()
		for cam.ZoomLevel() > level {
			cam.ZoomOut()
		}
		for cam.ZoomLevel() < level {
			cam.ZoomIn()
		}

		if got := cam.MoveStep(); got != expected {
			t.Fatalf("zoom %d: esperava passo %d, obteve %d", level, expected, got)
		}
	}
}

func TestRenderSize_ReservesTheStatusLine(t *testing.T) {
	cols, rows := RenderSize(80, 24)
	if cols != 80 || rows != 23 {
		t.Fatalf("esperava 80x23, obteve %dx%d", cols, rows)
	}

	cols, rows = RenderSize(-5, 0)
	if cols != 0 || rows != 0 {
		t.Fatalf("esperava dimensões não negativas, obteve %dx%d", cols, rows)
	}
}

func zoomedCamera(level int) *Camera {
	cam := NewCamera()
	for cam.ZoomLevel() > level {
		cam.ZoomOut()
	}
	for cam.ZoomLevel() < level {
		cam.ZoomIn()
	}
	return cam
}

func viewportSpan(cam *Camera, termWidth, termHeight int) (int, int) {
	topLeft, bottomRight := cam.Viewport(termWidth, termHeight)
	return bottomRight.X - topLeft.X, bottomRight.Y - topLeft.Y
}

func TestCamera_Viewport_DefaultZoom_MatchesTerminalDimensions(t *testing.T) {
	cam := NewCamera()

	cols, rows := viewportSpan(cam, 80, 24)
	if cols != 80 || rows != 23 {
		t.Fatalf("esperava viewport 80x23, obteve %dx%d", cols, rows)
	}

	topLeft, bottomRight := cam.Viewport(80, 24)
	if topLeft.X != -40 || topLeft.Y != -11 {
		t.Fatalf("esperava topo esquerdo (-40, -11), obteve %v", topLeft)
	}
	if bottomRight.X != 40 || bottomRight.Y != 12 {
		t.Fatalf("esperava canto inferior direito (40, 12), obteve %v", bottomRight)
	}
}

func TestCamera_Viewport_ZoomedOut_ExpandsRangeByAggregation(t *testing.T) {
	baseCols, baseRows := viewportSpan(zoomedCamera(DefaultZoomLevel), 80, 24)

	cols, rows := viewportSpan(zoomedCamera(1), 80, 24)
	if cols != baseCols*2 || rows != baseRows*2 {
		t.Fatalf("zoom 1: esperava %dx%d, obteve %dx%d", baseCols*2, baseRows*2, cols, rows)
	}

	cols, rows = viewportSpan(zoomedCamera(0), 80, 24)
	if cols != baseCols*4 || rows != baseRows*4 {
		t.Fatalf("zoom 0: esperava %dx%d, obteve %dx%d", baseCols*4, baseRows*4, cols, rows)
	}
}

func TestCamera_Viewport_ZoomedIn_ShrinksHorizontalRange(t *testing.T) {
	baseCols, baseRows := viewportSpan(zoomedCamera(DefaultZoomLevel), 80, 24)

	cols, rows := viewportSpan(zoomedCamera(3), 80, 24)
	if cols != baseCols/2 || rows != baseRows {
		t.Fatalf("zoom 3: esperava %dx%d, obteve %dx%d", baseCols/2, baseRows, cols, rows)
	}

	cols, rows = viewportSpan(zoomedCamera(4), 80, 24)
	if cols != baseCols/4 || rows != baseRows {
		t.Fatalf("zoom 4: esperava %dx%d, obteve %dx%d", baseCols/4, baseRows, cols, rows)
	}
}

func TestCamera_Viewport_FollowsCameraPosition(t *testing.T) {
	cam := NewCamera()
	cam.Move(10, -20)

	topLeft, bottomRight := cam.Viewport(80, 24)

	if topLeft.X != -30 || topLeft.Y != -31 {
		t.Fatalf("esperava topo esquerdo (-30, -31), obteve %v", topLeft)
	}
	if bottomRight.X != 50 || bottomRight.Y != -8 {
		t.Fatalf("esperava canto inferior direito (50, -8), obteve %v", bottomRight)
	}
}
