package tui

import (
	"fmt"
	"strings"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/camera"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/controls"
)

// Line monta a status line da última linha do terminal, cortada ou preenchida até a largura disponível.
func Line(cam *camera.Camera, ctrl *controls.Controls, width int) string {
	position := cam.Position()
	state := "pausado"
	if ctrl.IsPlaying() {
		state = "tocando"
	}

	line := fmt.Sprintf(
		"(%d, %d)  zoom %d/%d  %s %d ger/s  espaco play  n passo  +/- vel  r limpar  q sair",
		position.X,
		position.Y,
		cam.ZoomLevel(),
		camera.MaxZoomLevel,
		state,
		ctrl.SpeedGPS(),
	)

	if width <= 0 {
		return ""
	}
	if len([]rune(line)) > width {
		return string([]rune(line)[:width])
	}
	return line + strings.Repeat(" ", width-len([]rune(line)))
}
