package tui

import (
	"strings"
	"testing"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/camera"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/controls"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/engine"
)

func zoomedCamera(level int) *camera.Camera {
	cam := camera.NewCamera()
	for cam.ZoomLevel() > level {
		cam.ZoomOut()
	}
	for cam.ZoomLevel() < level {
		cam.ZoomIn()
	}
	return cam
}

func frameRows(frame string) []string {
	if frame == "" {
		return nil
	}
	return strings.Split(frame, "\n")
}

func TestRenderViewport_RendersLiveCellsWithinBounds(t *testing.T) {
	eng := engine.NewEngine()
	eng.SetCell(0, 0, true)
	eng.SetCell(1000, 1000, true)
	cam := camera.NewCamera()

	rows := frameRows(Viewport(eng, cam, 80, 24))

	if len(rows) != 23 {
		t.Fatalf("esperava 23 linhas renderizadas, obteve %d", len(rows))
	}

	topLeft, _ := cam.Viewport(80, 24)
	aliveRow := []rune(rows[-topLeft.Y])
	if string(aliveRow[-topLeft.X]) != AliveGlyph {
		t.Fatalf("esperava célula viva na posição da origem, obteve %q", string(aliveRow[-topLeft.X]))
	}

	if got := strings.Count(Viewport(eng, cam, 80, 24), AliveGlyph); got != 1 {
		t.Fatalf("esperava apenas a célula dentro do viewport renderizada, obteve %d", got)
	}
}

func TestRenderViewport_ZoomedOut_UsesOrAggregation(t *testing.T) {
	cam := zoomedCamera(0)
	topLeft, _ := cam.Viewport(80, 24)
	block := engine.Coordinate{X: topLeft.X + 8, Y: topLeft.Y + 8}

	eng := engine.NewEngine()
	eng.SetCell(block.X+2, block.Y+3, true)

	if got := strings.Count(Viewport(eng, cam, 80, 24), AliveGlyph); got != 1 {
		t.Fatalf("esperava um único glifo vivo agregando o bloco, obteve %d", got)
	}

	for _, offset := range [][2]int{{0, 0}, {1, 1}, {3, 3}} {
		eng.SetCell(block.X+offset[0], block.Y+offset[1], true)
	}

	frame := Viewport(eng, cam, 80, 24)
	if got := strings.Count(frame, AliveGlyph); got != 1 {
		t.Fatalf("esperava o mesmo bloco agregado, obteve %d glifos vivos", got)
	}

	rows := frameRows(frame)
	if got := string([]rune(rows[2])[2]); got != AliveGlyph {
		t.Fatalf("esperava o bloco vivo na terceira linha e coluna, obteve %q", got)
	}
}

func TestRenderViewport_ZoomedIn_WidensGlyphColumns(t *testing.T) {
	eng := engine.NewEngine()
	eng.SetCell(0, 0, true)
	cam := zoomedCamera(4)

	rows := frameRows(Viewport(eng, cam, 80, 24))
	topLeft, _ := cam.Viewport(80, 24)
	row := []rune(rows[-topLeft.Y])

	start := (-topLeft.X) * cam.GlyphWidth()
	segment := string(row[start : start+cam.GlyphWidth()])

	if segment != strings.Repeat(AliveGlyph, 4) {
		t.Fatalf("esperava a célula ocupando 4 colunas, obteve %q", segment)
	}
	if got := len(row); got != 80 {
		t.Fatalf("esperava linha com 80 colunas, obteve %d", got)
	}
}

func TestRenderViewport_EmptyEngine_RendersAllDeadGlyphs(t *testing.T) {
	frame := Viewport(engine.NewEngine(), camera.NewCamera(), 80, 24)

	if strings.Contains(frame, AliveGlyph) {
		t.Fatal("esperava viewport sem células vivas")
	}
	for _, row := range frameRows(frame) {
		if row != strings.Repeat(DeadGlyph, 80) {
			t.Fatalf("esperava linha somente com glifos mortos, obteve %q", row)
		}
	}
}

func TestRenderViewport_DegenerateTerminalSize_RendersNothing(t *testing.T) {
	eng := engine.NewEngine()
	eng.SetCell(0, 0, true)

	if got := Viewport(eng, camera.NewCamera(), 0, 24); got != "" {
		t.Fatalf("esperava frame vazio sem largura, obteve %q", got)
	}
	if got := Viewport(eng, camera.NewCamera(), 80, 1); got != "" {
		t.Fatalf("esperava frame vazio sem altura útil, obteve %q", got)
	}
}

func TestStatusLine_ShowsCurrentCoordinatesAndZoomLevel(t *testing.T) {
	cam := camera.NewCamera()
	cam.Move(12, -7)
	cam.ZoomIn()
	ctrl := controls.NewControls(engine.NewEngine())

	line := Line(cam, ctrl, 120)

	if !strings.Contains(line, "(12, -7)") {
		t.Fatalf("esperava as coordenadas na status line, obteve %q", line)
	}
	if !strings.Contains(line, "zoom 3/4") {
		t.Fatalf("esperava o nível de zoom na status line, obteve %q", line)
	}
	if got := len([]rune(line)); got != 120 {
		t.Fatalf("esperava status line com 120 colunas, obteve %d", got)
	}
}

func TestStatusLine_ShowsPlayStateAndSpeed(t *testing.T) {
	cam := camera.NewCamera()
	ctrl := controls.NewControls(engine.NewEngine())

	if line := Line(cam, ctrl, 120); !strings.Contains(line, "pausado 5 ger/s") {
		t.Fatalf("esperava estado pausado e velocidade na status line, obteve %q", line)
	}

	ctrl.Play()
	ctrl.IncreaseSpeed()

	if line := Line(cam, ctrl, 120); !strings.Contains(line, "tocando 6 ger/s") {
		t.Fatalf("esperava estado tocando e nova velocidade, obteve %q", line)
	}
}

func TestStatusLine_TruncatesAndHandlesEmptyWidth(t *testing.T) {
	cam := camera.NewCamera()
	ctrl := controls.NewControls(engine.NewEngine())

	if got := len([]rune(Line(cam, ctrl, 10))); got != 10 {
		t.Fatalf("esperava status line truncada em 10 colunas, obteve %d", got)
	}
	if got := Line(cam, ctrl, 0); got != "" {
		t.Fatalf("esperava status line vazia, obteve %q", got)
	}
}
