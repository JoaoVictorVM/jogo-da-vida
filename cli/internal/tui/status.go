package tui

import (
	"fmt"
	"strings"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/camera"
)

// Line monta a status line da última linha do terminal, cortada ou preenchida até a largura disponível.
func Line(cam *camera.Camera, width int) string {
	position := cam.Position()
	line := fmt.Sprintf(
		"(%d, %d)  zoom %d/%d  setas/wasd mover  o/i zoom  q sair",
		position.X,
		position.Y,
		cam.ZoomLevel(),
		camera.MaxZoomLevel,
	)

	if width <= 0 {
		return ""
	}
	if len([]rune(line)) > width {
		return string([]rune(line)[:width])
	}
	return line + strings.Repeat(" ", width-len([]rune(line)))
}
