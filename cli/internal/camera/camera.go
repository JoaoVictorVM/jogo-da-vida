package camera

import "github.com/JoaoVictorVM/jogo-da-vida/cli/internal/engine"

const (
	MinZoomLevel     = 0
	MaxZoomLevel     = 4
	DefaultZoomLevel = 2
)

type zoomSettings struct {
	aggregation int
	glyphWidth  int
	moveStep    int
}

var zoomTable = [MaxZoomLevel + 1]zoomSettings{
	{aggregation: 4, glyphWidth: 1, moveStep: 4},
	{aggregation: 2, glyphWidth: 1, moveStep: 2},
	{aggregation: 1, glyphWidth: 1, moveStep: 1},
	{aggregation: 1, glyphWidth: 2, moveStep: 1},
	{aggregation: 1, glyphWidth: 4, moveStep: 1},
}

// Camera guarda o centro visível do grid infinito e o nível de zoom corrente.
type Camera struct {
	center engine.Coordinate
	zoom   int
}

func NewCamera() *Camera {
	return &Camera{zoom: DefaultZoomLevel}
}

func (c *Camera) Position() engine.Coordinate {
	return c.center
}

func (c *Camera) ZoomLevel() int {
	return c.zoom
}

func (c *Camera) Move(dx, dy int) {
	c.center.X += dx
	c.center.Y += dy
}

func (c *Camera) ZoomIn() {
	if c.zoom < MaxZoomLevel {
		c.zoom++
	}
}

func (c *Camera) ZoomOut() {
	if c.zoom > MinZoomLevel {
		c.zoom--
	}
}

// MoveStep informa quantas células do grid um passo de teclado percorre no zoom atual.
func (c *Camera) MoveStep() int {
	return zoomTable[c.zoom].moveStep
}

// Aggregation informa quantas células do grid, por eixo, são condensadas em um glifo.
func (c *Camera) Aggregation() int {
	return zoomTable[c.zoom].aggregation
}

// GlyphWidth informa quantas colunas do terminal uma célula do grid ocupa.
func (c *Camera) GlyphWidth() int {
	return zoomTable[c.zoom].glyphWidth
}

// RenderSize converte as dimensões do terminal em quantidade de glifos, já descontando a status line.
func RenderSize(termWidth, termHeight int) (cols, rows int) {
	cols = termWidth
	if cols < 0 {
		cols = 0
	}
	rows = termHeight - 1
	if rows < 0 {
		rows = 0
	}
	return cols, rows
}

func (c *Camera) Viewport(termWidth, termHeight int) (topLeft, bottomRight engine.Coordinate) {
	settings := zoomTable[c.zoom]
	cols, rows := RenderSize(termWidth, termHeight)

	visibleCols := (cols / settings.glyphWidth) * settings.aggregation
	visibleRows := rows * settings.aggregation

	topLeft = engine.Coordinate{
		X: c.center.X - visibleCols/2,
		Y: c.center.Y - visibleRows/2,
	}
	bottomRight = engine.Coordinate{
		X: topLeft.X + visibleCols,
		Y: topLeft.Y + visibleRows,
	}
	return topLeft, bottomRight
}
