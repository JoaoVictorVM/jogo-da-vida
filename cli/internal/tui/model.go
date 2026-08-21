package tui

import (
	tea "github.com/charmbracelet/bubbletea"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/camera"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/engine"
)

const (
	DefaultTerminalWidth  = 80
	DefaultTerminalHeight = 24
)

type Model struct {
	engine *engine.Engine
	camera *camera.Camera
	width  int
	height int
}

func NewModel(eng *engine.Engine, cam *camera.Camera) Model {
	return Model{
		engine: eng,
		camera: cam,
		width:  DefaultTerminalWidth,
		height: DefaultTerminalHeight,
	}
}

func (m Model) Camera() *camera.Camera {
	return m.camera
}

func (m Model) Engine() *engine.Engine {
	return m.engine
}

func (m Model) Init() tea.Cmd {
	return nil
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil
	case tea.KeyMsg:
		return m.handleKey(msg)
	}
	return m, nil
}

func (m Model) handleKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	step := m.camera.MoveStep()

	switch msg.String() {
	case "up", "w":
		m.camera.Move(0, -step)
	case "down", "s":
		m.camera.Move(0, step)
	case "left", "a":
		m.camera.Move(-step, 0)
	case "right", "d":
		m.camera.Move(step, 0)
	case "o":
		m.camera.ZoomIn()
	case "i":
		m.camera.ZoomOut()
	case "q", "ctrl+c":
		return m, tea.Quit
	}

	return m, nil
}

func (m Model) View() string {
	grid := Viewport(m.engine, m.camera, m.width, m.height)
	status := Line(m.camera, m.width)

	if grid == "" {
		return status
	}
	return grid + "\n" + status
}
