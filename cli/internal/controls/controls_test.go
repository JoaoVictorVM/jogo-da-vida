package controls

import (
	"testing"
	"time"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/engine"
)

var blinker = []engine.Coordinate{{X: 4, Y: 5}, {X: 5, Y: 5}, {X: 6, Y: 5}}

func seeded() (*Controls, *engine.Engine) {
	eng := engine.NewEngine()
	eng.PlaceCells(blinker)
	return NewControls(eng), eng
}

func assertBlinkerRotated(t *testing.T, eng *engine.Engine) {
	t.Helper()
	for _, cell := range []engine.Coordinate{{X: 5, Y: 4}, {X: 5, Y: 5}, {X: 5, Y: 6}} {
		if !eng.IsAlive(cell.X, cell.Y) {
			t.Fatalf("esperava célula viva em %v após uma geração", cell)
		}
	}
	if got := eng.LiveCount(); got != 3 {
		t.Fatalf("esperava 3 células vivas, obteve %d", got)
	}
}

func assertBlinkerUnchanged(t *testing.T, eng *engine.Engine) {
	t.Helper()
	for _, cell := range blinker {
		if !eng.IsAlive(cell.X, cell.Y) {
			t.Fatalf("esperava o blinker intacto, faltou %v", cell)
		}
	}
}

func TestNewControls_DefaultsToPausedAtFiveGPS(t *testing.T) {
	c := NewControls(engine.NewEngine())

	if c.IsPlaying() {
		t.Fatal("esperava simulação pausada ao construir")
	}
	if got := c.SpeedGPS(); got != DefaultSpeedGPS {
		t.Fatalf("esperava velocidade %d, obteve %d", DefaultSpeedGPS, got)
	}
	if DefaultSpeedGPS != 5 {
		t.Fatalf("esperava default de 5 gerações por segundo, obteve %d", DefaultSpeedGPS)
	}
}

func TestTogglePlay_FlipsState(t *testing.T) {
	c := NewControls(engine.NewEngine())

	want := []bool{true, false, true}
	for i, expected := range want {
		c.TogglePlay()
		if got := c.IsPlaying(); got != expected {
			t.Fatalf("chamada %d: esperava %v, obteve %v", i+1, expected, got)
		}
	}
}

func TestPlayPause_AreIdempotent(t *testing.T) {
	c := NewControls(engine.NewEngine())

	c.Play()
	c.Play()
	if !c.IsPlaying() {
		t.Fatal("esperava simulação tocando após dois Play")
	}

	c.Pause()
	c.Pause()
	if c.IsPlaying() {
		t.Fatal("esperava simulação pausada após dois Pause")
	}
}

func TestStep_AdvancesOneGenerationWhilePaused(t *testing.T) {
	c, eng := seeded()

	c.Step()

	assertBlinkerRotated(t, eng)
	if c.IsPlaying() {
		t.Fatal("esperava que Step não iniciasse a simulação")
	}
}

func TestStep_AdvancesOneGenerationWhilePlaying(t *testing.T) {
	c, eng := seeded()
	c.Play()

	c.Step()

	assertBlinkerRotated(t, eng)
	if !c.IsPlaying() {
		t.Fatal("esperava que Step não pausasse a simulação")
	}
}

func TestTick_AdvancesOnlyWhenPlaying(t *testing.T) {
	c, eng := seeded()

	c.Tick()
	assertBlinkerUnchanged(t, eng)

	c.Play()
	c.Tick()
	assertBlinkerRotated(t, eng)
}

func TestIncreaseSpeed_ClampsAtThirty(t *testing.T) {
	c := NewControls(engine.NewEngine())

	c.IncreaseSpeed()
	if got := c.SpeedGPS(); got != DefaultSpeedGPS+1 {
		t.Fatalf("esperava velocidade %d, obteve %d", DefaultSpeedGPS+1, got)
	}

	for i := 0; i < 40; i++ {
		c.IncreaseSpeed()
	}
	if got := c.SpeedGPS(); got != MaxSpeedGPS {
		t.Fatalf("esperava velocidade travada em %d, obteve %d", MaxSpeedGPS, got)
	}
}

func TestDecreaseSpeed_ClampsAtOne(t *testing.T) {
	c := NewControls(engine.NewEngine())

	c.DecreaseSpeed()
	if got := c.SpeedGPS(); got != DefaultSpeedGPS-1 {
		t.Fatalf("esperava velocidade %d, obteve %d", DefaultSpeedGPS-1, got)
	}

	for i := 0; i < 10; i++ {
		c.DecreaseSpeed()
	}
	if got := c.SpeedGPS(); got != MinSpeedGPS {
		t.Fatalf("esperava velocidade travada em %d, obteve %d", MinSpeedGPS, got)
	}
}

func TestSpeedChange_AppliesWhilePlaying(t *testing.T) {
	c := NewControls(engine.NewEngine())
	c.Play()

	c.IncreaseSpeed()

	if !c.IsPlaying() {
		t.Fatal("esperava que a mudança de velocidade não pausasse a simulação")
	}
	if got := c.TickInterval(); got != time.Second/6 {
		t.Fatalf("esperava intervalo %v, obteve %v", time.Second/6, got)
	}

	c.DecreaseSpeed()
	c.DecreaseSpeed()
	if got := c.SpeedGPS(); got != DefaultSpeedGPS-1 {
		t.Fatalf("esperava velocidade %d, obteve %d", DefaultSpeedGPS-1, got)
	}
	if !c.IsPlaying() {
		t.Fatal("esperava simulação ainda tocando")
	}
}

func TestTickInterval_MatchesSpeed(t *testing.T) {
	tests := []struct {
		name  string
		speed int
		want  time.Duration
	}{
		{"velocidade padrão", DefaultSpeedGPS, 200 * time.Millisecond},
		{"velocidade mínima", MinSpeedGPS, time.Second},
		{"velocidade máxima", MaxSpeedGPS, time.Second / 30},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := NewControls(engine.NewEngine())
			for c.SpeedGPS() > tt.speed {
				c.DecreaseSpeed()
			}
			for c.SpeedGPS() < tt.speed {
				c.IncreaseSpeed()
			}

			if got := c.TickInterval(); got != tt.want {
				t.Fatalf("esperava intervalo %v, obteve %v", tt.want, got)
			}
		})
	}
}

func TestReset_ClearsEngineAndPauses(t *testing.T) {
	c, eng := seeded()
	c.Play()

	c.Reset()

	if got := eng.LiveCount(); got != 0 {
		t.Fatalf("esperava grid vazio, obteve %d células vivas", got)
	}
	if c.IsPlaying() {
		t.Fatal("esperava simulação pausada após Reset")
	}
	if got := c.SpeedGPS(); got != DefaultSpeedGPS {
		t.Fatalf("esperava velocidade preservada em %d, obteve %d", DefaultSpeedGPS, got)
	}
}
