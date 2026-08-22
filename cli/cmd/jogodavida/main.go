package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/camera"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/controls"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/engine"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/tui"
)

func main() {
	eng := engine.NewEngine()
	model := tui.NewModel(eng, camera.NewCamera(), controls.NewControls(eng))

	if _, err := tea.NewProgram(model, tea.WithAltScreen()).Run(); err != nil {
		fmt.Fprintln(os.Stderr, "erro ao executar o jogo da vida:", err)
		os.Exit(1)
	}
}
