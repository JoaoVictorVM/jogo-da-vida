package tui

import (
	"strings"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/camera"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/engine"
)

const (
	AliveGlyph = "█"
	DeadGlyph  = " "
)

// Viewport monta os glifos das células visíveis, agregando ou alargando conforme o zoom.
func Viewport(eng *engine.Engine, cam *camera.Camera, termWidth, termHeight int) string {
	cols, rows := camera.RenderSize(termWidth, termHeight)
	if cols == 0 || rows == 0 {
		return ""
	}

	topLeft, _ := cam.Viewport(termWidth, termHeight)
	aggregation := cam.Aggregation()
	glyphWidth := cam.GlyphWidth()
	glyphCols := cols / glyphWidth

	var frame strings.Builder
	for row := 0; row < rows; row++ {
		if row > 0 {
			frame.WriteString("\n")
		}
		for col := 0; col < glyphCols; col++ {
			glyph := DeadGlyph
			if blockHasLiveCell(eng, topLeft, col, row, aggregation) {
				glyph = AliveGlyph
			}
			frame.WriteString(strings.Repeat(glyph, glyphWidth))
		}
	}

	return frame.String()
}

func blockHasLiveCell(eng *engine.Engine, topLeft engine.Coordinate, col, row, aggregation int) bool {
	originX := topLeft.X + col*aggregation
	originY := topLeft.Y + row*aggregation

	for dy := 0; dy < aggregation; dy++ {
		for dx := 0; dx < aggregation; dx++ {
			if eng.IsAlive(originX+dx, originY+dy) {
				return true
			}
		}
	}
	return false
}
