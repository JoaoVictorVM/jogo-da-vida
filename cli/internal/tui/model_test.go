package tui

import (
	"strings"
	"testing"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/camera"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/controls"
	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/engine"
)

func keyMsg(key string) tea.KeyMsg {
	if len(key) == 1 {
		return tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune(key)}
	}

	switch key {
	case "up":
		return tea.KeyMsg{Type: tea.KeyUp}
	case "down":
		return tea.KeyMsg{Type: tea.KeyDown}
	case "left":
		return tea.KeyMsg{Type: tea.KeyLeft}
	case "right":
		return tea.KeyMsg{Type: tea.KeyRight}
	}
	return tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune(key)}
}

func newTestModel() Model {
	eng := engine.NewEngine()
	return NewModel(eng, camera.NewCamera(), controls.NewControls(eng))
}

func send(m Model, msg tea.Msg) (Model, tea.Cmd) {
	updated, cmd := m.Update(msg)
	return updated.(Model), cmd
}

func TestInit_ReturnsNoCommand(t *testing.T) {
	if cmd := newTestModel().Init(); cmd != nil {
		t.Fatal("esperava Init sem comando")
	}
}

func TestUpdate_ArrowKeysAndWASD_MoveCameraOneStep(t *testing.T) {
	tests := []struct {
		key  string
		want engine.Coordinate
	}{
		{"up", engine.Coordinate{X: 0, Y: -1}},
		{"down", engine.Coordinate{X: 0, Y: 1}},
		{"left", engine.Coordinate{X: -1, Y: 0}},
		{"right", engine.Coordinate{X: 1, Y: 0}},
		{"w", engine.Coordinate{X: 0, Y: -1}},
		{"s", engine.Coordinate{X: 0, Y: 1}},
		{"a", engine.Coordinate{X: -1, Y: 0}},
		{"d", engine.Coordinate{X: 1, Y: 0}},
	}

	for _, tt := range tests {
		t.Run(tt.key, func(t *testing.T) {
			m := newTestModel()

			m, _ = send(m, keyMsg(tt.key))

			if got := m.Camera().Position(); got != tt.want {
				t.Fatalf("tecla %q: esperava %v, obteve %v", tt.key, tt.want, got)
			}
		})
	}
}

func TestUpdate_MoveStepFollowsZoomLevel(t *testing.T) {
	m := newTestModel()

	m, _ = send(m, keyMsg("i"))
	m, _ = send(m, keyMsg("i"))
	m, _ = send(m, keyMsg("right"))

	if got := m.Camera().Position(); got != (engine.Coordinate{X: 4, Y: 0}) {
		t.Fatalf("esperava passo de 4 células no zoom mínimo, obteve %v", got)
	}
}

func TestUpdate_OKey_ZoomsIn(t *testing.T) {
	m := newTestModel()

	m, _ = send(m, keyMsg("o"))

	if got := m.Camera().ZoomLevel(); got != camera.DefaultZoomLevel+1 {
		t.Fatalf("esperava zoom %d, obteve %d", camera.DefaultZoomLevel+1, got)
	}
}

func TestUpdate_IKey_ZoomsOut(t *testing.T) {
	m := newTestModel()

	m, _ = send(m, keyMsg("i"))

	if got := m.Camera().ZoomLevel(); got != camera.DefaultZoomLevel-1 {
		t.Fatalf("esperava zoom %d, obteve %d", camera.DefaultZoomLevel-1, got)
	}
}

func TestUpdate_WindowSizeMsg_UpdatesStoredTerminalSize(t *testing.T) {
	m := newTestModel()

	m, _ = send(m, tea.WindowSizeMsg{Width: 40, Height: 10})

	rows := strings.Split(m.View(), "\n")
	if len(rows) != 10 {
		t.Fatalf("esperava 10 linhas (9 do grid + status), obteve %d", len(rows))
	}
	if got := len([]rune(rows[0])); got != 40 {
		t.Fatalf("esperava linhas com 40 colunas, obteve %d", got)
	}
}

func TestUpdate_UnrecognizedKey_NoStateChange(t *testing.T) {
	m := newTestModel()
	positionBefore := m.Camera().Position()
	zoomBefore := m.Camera().ZoomLevel()

	m, _ = send(m, keyMsg("z"))
	m, _ = send(m, tea.MouseMsg{})

	if m.Camera().Position() != positionBefore || m.Camera().ZoomLevel() != zoomBefore {
		t.Fatal("esperava estado inalterado para entrada sem binding")
	}
}

func TestUpdate_QuitKeys_ReturnQuitCommand(t *testing.T) {
	for _, key := range []string{"q", "ctrl+c"} {
		m := newTestModel()
		msg := keyMsg(key)
		if key == "ctrl+c" {
			msg = tea.KeyMsg{Type: tea.KeyCtrlC}
		}

		if _, cmd := send(m, msg); cmd == nil {
			t.Fatalf("tecla %q: esperava comando de saída", key)
		}
	}
}

func TestView_ReflectsEngineStateChangeOnNextFrame(t *testing.T) {
	eng := engine.NewEngine()
	m := NewModel(eng, camera.NewCamera(), controls.NewControls(eng))

	before := m.View()
	if strings.Contains(before, AliveGlyph) {
		t.Fatal("esperava primeiro frame sem células vivas")
	}

	eng.SetCell(0, 0, true)
	after := m.View()

	if before == after {
		t.Fatal("esperava que o frame refletisse a mudança no engine")
	}
	if got := strings.Count(after, AliveGlyph); got != 1 {
		t.Fatalf("esperava uma célula viva renderizada, obteve %d", got)
	}
}

func TestView_AlwaysEndsWithTheStatusLine(t *testing.T) {
	m := newTestModel()

	rows := strings.Split(m.View(), "\n")
	status := rows[len(rows)-1]

	if !strings.Contains(status, "zoom") || !strings.Contains(status, "(0, 0)") {
		t.Fatalf("esperava status line ao final do frame, obteve %q", status)
	}

	m, _ = send(m, tea.WindowSizeMsg{Width: 80, Height: 1})
	if got := m.View(); !strings.Contains(got, "zoom") {
		t.Fatalf("esperava status line mesmo sem área de grid, obteve %q", got)
	}
}

func TestModel_ExposesInjectedEngine(t *testing.T) {
	eng := engine.NewEngine()
	m := NewModel(eng, camera.NewCamera(), controls.NewControls(eng))

	m.Engine().SetCell(1, 1, true)

	if !eng.IsAlive(1, 1) {
		t.Fatal("esperava que o modelo expusesse o engine injetado")
	}
}

func TestUpdate_SpaceKey_TogglesPlaybackAndSchedulesTicks(t *testing.T) {
	m := newTestModel()

	m, cmd := send(m, keyMsg(" "))
	if !m.Controls().IsPlaying() {
		t.Fatal("esperava simulação tocando após a tecla de espaço")
	}
	if cmd == nil {
		t.Fatal("esperava o agendamento do próximo tick")
	}

	m, cmd = send(m, keyMsg(" "))
	if m.Controls().IsPlaying() {
		t.Fatal("esperava simulação pausada após a segunda tecla de espaço")
	}
	if cmd != nil {
		t.Fatal("esperava nenhum tick agendado com a simulação pausada")
	}
}

func TestUpdate_TickMsg_AdvancesOnlyWhilePlayingAndOnCurrentEpoch(t *testing.T) {
	eng := engine.NewEngine()
	eng.PlaceCells([]engine.Coordinate{{X: 4, Y: 5}, {X: 5, Y: 5}, {X: 6, Y: 5}})
	m := NewModel(eng, camera.NewCamera(), controls.NewControls(eng))

	m, _ = send(m, TickMsg{Epoch: 0})
	if !eng.IsAlive(4, 5) {
		t.Fatal("esperava grid intacto com a simulação pausada")
	}

	m, _ = send(m, keyMsg(" "))
	m, _ = send(m, TickMsg{Epoch: 99})
	if !eng.IsAlive(4, 5) {
		t.Fatal("esperava que um tick de época antiga fosse descartado")
	}

	m, cmd := send(m, TickMsg{Epoch: 1})
	if !eng.IsAlive(5, 4) || !eng.IsAlive(5, 6) {
		t.Fatal("esperava uma geração aplicada pelo tick da época corrente")
	}
	if cmd == nil {
		t.Fatal("esperava o reagendamento do próximo tick")
	}
}

func TestUpdate_StepKey_AdvancesOneGenerationRegardlessOfPlayState(t *testing.T) {
	for _, playing := range []bool{false, true} {
		eng := engine.NewEngine()
		eng.PlaceCells([]engine.Coordinate{{X: 4, Y: 5}, {X: 5, Y: 5}, {X: 6, Y: 5}})
		m := NewModel(eng, camera.NewCamera(), controls.NewControls(eng))
		if playing {
			m, _ = send(m, keyMsg(" "))
		}

		m, _ = send(m, keyMsg("n"))

		if !eng.IsAlive(5, 4) || !eng.IsAlive(5, 5) || !eng.IsAlive(5, 6) {
			t.Fatalf("tocando=%v: esperava exatamente uma geração aplicada", playing)
		}
		if eng.LiveCount() != 3 {
			t.Fatalf("tocando=%v: esperava 3 células vivas, obteve %d", playing, eng.LiveCount())
		}
		if m.Controls().IsPlaying() != playing {
			t.Fatalf("tocando=%v: esperava o estado de playback preservado", playing)
		}
	}
}

func TestUpdate_SpeedKeys_AdjustSpeedWithinRange(t *testing.T) {
	m := newTestModel()

	m, _ = send(m, keyMsg("+"))
	if got := m.Controls().SpeedGPS(); got != controls.DefaultSpeedGPS+1 {
		t.Fatalf("esperava velocidade %d, obteve %d", controls.DefaultSpeedGPS+1, got)
	}

	m, _ = send(m, keyMsg("-"))
	m, _ = send(m, keyMsg("_"))
	if got := m.Controls().SpeedGPS(); got != controls.DefaultSpeedGPS-1 {
		t.Fatalf("esperava velocidade %d, obteve %d", controls.DefaultSpeedGPS-1, got)
	}

	for i := 0; i < 40; i++ {
		m, _ = send(m, keyMsg("="))
	}
	if got := m.Controls().SpeedGPS(); got != controls.MaxSpeedGPS {
		t.Fatalf("esperava velocidade máxima %d, obteve %d", controls.MaxSpeedGPS, got)
	}

	for i := 0; i < 40; i++ {
		m, _ = send(m, keyMsg("-"))
	}
	if got := m.Controls().SpeedGPS(); got != controls.MinSpeedGPS {
		t.Fatalf("esperava velocidade mínima %d, obteve %d", controls.MinSpeedGPS, got)
	}
}

func TestUpdate_SpeedChangeWhilePlaying_ReschedulesWithoutPausing(t *testing.T) {
	m := newTestModel()
	m, _ = send(m, keyMsg(" "))

	m, cmd := send(m, keyMsg("+"))

	if !m.Controls().IsPlaying() {
		t.Fatal("esperava simulação ainda tocando após mudar a velocidade")
	}
	if cmd == nil {
		t.Fatal("esperava reagendamento imediato com o novo intervalo")
	}

	eng := m.Engine()
	eng.SetCell(0, 0, true)
	m, _ = send(m, TickMsg{Epoch: 1})
	if eng.LiveCount() != 1 {
		t.Fatal("esperava que o tick da época anterior fosse descartado")
	}
}

func TestUpdate_ResetKey_ClearsGridAndPauses(t *testing.T) {
	eng := engine.NewEngine()
	eng.PlaceCells([]engine.Coordinate{{X: 4, Y: 5}, {X: 5, Y: 5}, {X: 6, Y: 5}})
	m := NewModel(eng, camera.NewCamera(), controls.NewControls(eng))
	m, _ = send(m, keyMsg(" "))

	m, cmd := send(m, keyMsg("r"))

	if eng.LiveCount() != 0 {
		t.Fatalf("esperava grid vazio, obteve %d células vivas", eng.LiveCount())
	}
	if m.Controls().IsPlaying() {
		t.Fatal("esperava simulação pausada após o reset")
	}
	if cmd != nil {
		t.Fatal("esperava nenhum tick agendado após o reset")
	}
}

func TestModel_ExposesInjectedControls(t *testing.T) {
	eng := engine.NewEngine()
	ctrl := controls.NewControls(eng)
	m := NewModel(eng, camera.NewCamera(), ctrl)

	m.Controls().Play()

	if !ctrl.IsPlaying() {
		t.Fatal("esperava que o modelo expusesse os controles injetados")
	}
}
