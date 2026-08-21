import type { SimulationController } from './SimulationController';
import { MAX_SPEED_GPS, MIN_SPEED_GPS } from './types';

const PLAY_ICON = '▶';
const PAUSE_ICON = '⏸';

function createButton(className: string, label: string, text: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  button.title = label;
  button.textContent = text;
  return button;
}

export class SimulationControlsView {
  private readonly root: HTMLDivElement;
  private readonly playPauseButton: HTMLButtonElement;
  private readonly stepButton: HTMLButtonElement;
  private readonly speedSlider: HTMLInputElement;
  private readonly speedValueLabel: HTMLSpanElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly unsubscribeSpeedChange: () => void;

  constructor(
    private readonly container: HTMLElement,
    private readonly controller: SimulationController,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'simulation-controls';

    this.playPauseButton = createButton('simulation-controls__play-pause', 'Play', PLAY_ICON);
    this.stepButton = createButton('simulation-controls__step', 'Avançar uma geração', '⏭');
    this.resetButton = createButton('simulation-controls__reset', 'Limpar o grid', '⟲');

    this.speedSlider = document.createElement('input');
    this.speedSlider.type = 'range';
    this.speedSlider.className = 'simulation-controls__speed';
    this.speedSlider.min = String(MIN_SPEED_GPS);
    this.speedSlider.max = String(MAX_SPEED_GPS);
    this.speedSlider.step = '1';
    this.speedSlider.setAttribute('aria-label', 'Gerações por segundo');

    this.speedValueLabel = document.createElement('span');
    this.speedValueLabel.className = 'simulation-controls__speed-value';

    this.root.append(
      this.playPauseButton,
      this.stepButton,
      this.speedSlider,
      this.speedValueLabel,
      this.resetButton,
    );
    this.container.appendChild(this.root);

    this.playPauseButton.addEventListener('click', this.handlePlayPauseClick);
    this.stepButton.addEventListener('click', this.handleStepClick);
    this.resetButton.addEventListener('click', this.handleResetClick);
    this.speedSlider.addEventListener('input', this.handleSpeedInput);
    this.unsubscribeSpeedChange = this.controller.onSpeedChange(this.handleSpeedChange);

    this.syncSpeed(this.controller.getSpeed());
    this.syncPlayPause();
  }

  destroy(): void {
    this.playPauseButton.removeEventListener('click', this.handlePlayPauseClick);
    this.stepButton.removeEventListener('click', this.handleStepClick);
    this.resetButton.removeEventListener('click', this.handleResetClick);
    this.speedSlider.removeEventListener('input', this.handleSpeedInput);
    this.unsubscribeSpeedChange();
    this.root.remove();
  }

  private readonly handlePlayPauseClick = (): void => {
    this.controller.togglePlayPause();
    this.syncPlayPause();
  };

  private readonly handleStepClick = (): void => {
    this.controller.step();
    this.syncPlayPause();
  };

  private readonly handleResetClick = (): void => {
    this.controller.reset();
    this.syncPlayPause();
  };

  private readonly handleSpeedInput = (): void => {
    this.controller.setSpeed(Number(this.speedSlider.value));
    this.syncSpeed(this.controller.getSpeed());
  };

  private readonly handleSpeedChange = (gps: number): void => {
    this.syncSpeed(gps);
  };

  private syncPlayPause(): void {
    const playing = this.controller.isPlaying();
    const label = playing ? 'Pause' : 'Play';

    this.playPauseButton.textContent = playing ? PAUSE_ICON : PLAY_ICON;
    this.playPauseButton.setAttribute('aria-label', label);
    this.playPauseButton.setAttribute('aria-pressed', String(playing));
    this.playPauseButton.title = label;
  }

  private syncSpeed(gps: number): void {
    this.speedSlider.value = String(gps);
    this.speedValueLabel.textContent = `${gps} ger/s`;
  }
}
