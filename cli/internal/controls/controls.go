package controls

import (
	"time"

	"github.com/JoaoVictorVM/jogo-da-vida/cli/internal/engine"
)

const (
	MinSpeedGPS     = 1
	MaxSpeedGPS     = 30
	DefaultSpeedGPS = 5
)

// Controls guarda o estado de play/pause e a velocidade da simulação, acionando o engine a cada geração.
type Controls struct {
	engine   *engine.Engine
	playing  bool
	speedGPS int
}

func NewControls(e *engine.Engine) *Controls {
	return &Controls{engine: e, speedGPS: DefaultSpeedGPS}
}

func (c *Controls) TogglePlay() {
	c.playing = !c.playing
}

func (c *Controls) Play() {
	c.playing = true
}

func (c *Controls) Pause() {
	c.playing = false
}

func (c *Controls) IsPlaying() bool {
	return c.playing
}

func (c *Controls) Step() {
	c.engine.Tick()
}

// Tick avança uma geração apenas enquanto a simulação está tocando; é o gancho do timer da TUI.
func (c *Controls) Tick() {
	if !c.playing {
		return
	}
	c.engine.Tick()
}

func (c *Controls) IncreaseSpeed() {
	if c.speedGPS < MaxSpeedGPS {
		c.speedGPS++
	}
}

func (c *Controls) DecreaseSpeed() {
	if c.speedGPS > MinSpeedGPS {
		c.speedGPS--
	}
}

func (c *Controls) SpeedGPS() int {
	return c.speedGPS
}

func (c *Controls) TickInterval() time.Duration {
	return time.Second / time.Duration(c.speedGPS)
}

func (c *Controls) Reset() {
	c.engine.Reset()
	c.playing = false
}
