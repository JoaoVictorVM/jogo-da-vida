package tui

import (
	"time"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/camera"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/controls"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/engine"
)

const (
	DefaultTerminalWidth  = 80
	DefaultTerminalHeight = 24
)

// TickMsg carrega a época em que o timer foi agendado, para que timers antigos sejam descartados
// quando a velocidade muda ou a simulação é pausada.
type TickMsg struct {
	Epoch int
}

type Model struct {
	engine   *engine.Engine
	camera   *camera.Camera
	controls *controls.Controls
	width    int
	height   int
	epoch    int
}

func NewModel(eng *engine.Engine, cam *camera.Camera, ctrl *controls.Controls) Model {
	return Model{
		engine:   eng,
		camera:   cam,
		controls: ctrl,
		width:    DefaultTerminalWidth,
		height:   DefaultTerminalHeight,
	}
}

func (m Model) Camera() *camera.Camera {
	return m.camera
}

func (m Model) Engine() *engine.Engine {
	return m.engine
}

func (m Model) Controls() *controls.Controls {
	return m.controls
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
	case TickMsg:
		return m.handleTick(msg)
	case tea.KeyMsg:
		return m.handleKey(msg)
	}
	return m, nil
}

func (m Model) handleTick(msg TickMsg) (tea.Model, tea.Cmd) {
	if msg.Epoch != m.epoch || !m.controls.IsPlaying() {
		return m, nil
	}

	m.controls.Tick()
	return m, m.scheduleTick()
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
	case " ":
		m.controls.TogglePlay()
		return m.restartTimer()
	case "n":
		m.controls.Step()
	case "+", "=":
		m.controls.IncreaseSpeed()
		return m.restartTimer()
	case "-", "_":
		m.controls.DecreaseSpeed()
		return m.restartTimer()
	case "r":
		m.controls.Reset()
		return m.restartTimer()
	case "q", "ctrl+c":
		return m, tea.Quit
	}

	return m, nil
}

// restartTimer invalida o timer em curso e reagenda quando a simulação continua tocando, para que
// mudanças de velocidade valham imediatamente sem acumular timers concorrentes.
func (m Model) restartTimer() (tea.Model, tea.Cmd) {
	m.epoch++
	if !m.controls.IsPlaying() {
		return m, nil
	}
	return m, m.scheduleTick()
}

func (m Model) scheduleTick() tea.Cmd {
	epoch := m.epoch
	return tea.Tick(m.controls.TickInterval(), func(time.Time) tea.Msg {
		return TickMsg{Epoch: epoch}
	})
}

func (m Model) View() string {
	grid := Viewport(m.engine, m.camera, m.width, m.height)
	status := Line(m.camera, m.controls, m.width)

	if grid == "" {
		return status
	}
	return grid + "\n" + status
}
