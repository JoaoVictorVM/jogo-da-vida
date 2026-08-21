import { beforeEach, describe, expect, it } from 'vitest';
import { FiniteGridEngine } from '../../src/engine';
import { SimulationController, SimulationControlsView } from '../../src/simulation';
import { createFakeScheduler } from './fakeScheduler';

let container: HTMLElement;
let engine: FiniteGridEngine;
let controller: SimulationController;
let view: SimulationControlsView;

function query<T extends HTMLElement>(selector: string): T {
  const element = container.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`elemento ${selector} não encontrado`);
  }
  return element;
}

beforeEach(() => {
  document.body.innerHTML = '';
  container = document.createElement('div');
  document.body.appendChild(container);
  engine = new FiniteGridEngine({ width: 10, height: 10 });
  controller = new SimulationController(engine, createFakeScheduler().options);
  view = new SimulationControlsView(container, controller);
});

describe('SimulationControlsView', () => {
  it('renders the controls reflecting the initial state', () => {
    const slider = query<HTMLInputElement>('.simulation-controls__speed');

    expect(query('.simulation-controls__play-pause').textContent).toBe('▶');
    expect(query('.simulation-controls__play-pause').getAttribute('aria-label')).toBe('Play');
    expect(query('.simulation-controls__step')).toBeTruthy();
    expect(query('.simulation-controls__reset')).toBeTruthy();
    expect(slider.min).toBe('1');
    expect(slider.max).toBe('30');
    expect(slider.value).toBe(String(controller.getSpeed()));
    expect(query('.simulation-controls__speed-value').textContent).toBe('5 ger/s');
  });

  it('toggles the controller and the button icon on play pause clicks', () => {
    const button = query<HTMLButtonElement>('.simulation-controls__play-pause');

    button.click();
    expect(controller.isPlaying()).toBe(true);
    expect(button.textContent).toBe('⏸');
    expect(button.getAttribute('aria-label')).toBe('Pause');

    button.click();
    expect(controller.isPlaying()).toBe(false);
    expect(button.textContent).toBe('▶');
    expect(button.getAttribute('aria-label')).toBe('Play');
  });

  it('advances one generation when the step button is clicked', () => {
    for (const [x, y] of [
      [4, 5],
      [5, 5],
      [6, 5],
    ]) {
      engine.setCell(x, y, true);
    }

    query<HTMLButtonElement>('.simulation-controls__step').click();

    expect(engine.getLiveCells().map((cell) => `${cell.x},${cell.y}`).sort()).toEqual([
      '5,4',
      '5,5',
      '5,6',
    ]);
  });

  it('shows the paused icon when stepping while playing', () => {
    const button = query<HTMLButtonElement>('.simulation-controls__play-pause');
    button.click();
    expect(controller.isPlaying()).toBe(true);

    query<HTMLButtonElement>('.simulation-controls__step').click();

    expect(controller.isPlaying()).toBe(false);
    expect(button.textContent).toBe('▶');
  });

  it('updates the controller speed from the slider', () => {
    const slider = query<HTMLInputElement>('.simulation-controls__speed');

    slider.value = '22';
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    expect(controller.getSpeed()).toBe(22);
    expect(query('.simulation-controls__speed-value').textContent).toBe('22 ger/s');
  });

  it('keeps the slider in sync when the speed changes outside the view', () => {
    controller.setSpeed(17);

    expect(query<HTMLInputElement>('.simulation-controls__speed').value).toBe('17');
    expect(query('.simulation-controls__speed-value').textContent).toBe('17 ger/s');
  });

  it('clears the grid when the reset button is clicked', () => {
    engine.setCell(3, 3, true);
    const button = query<HTMLButtonElement>('.simulation-controls__play-pause');
    button.click();

    query<HTMLButtonElement>('.simulation-controls__reset').click();

    expect(engine.hasLiveCells()).toBe(false);
    expect(engine.getDimensions()).toEqual({ width: 10, height: 10 });
    expect(controller.isPlaying()).toBe(false);
    expect(button.textContent).toBe('▶');
  });

  it('removes the dom and unsubscribes on destroy', () => {
    view.destroy();

    expect(container.querySelector('.simulation-controls')).toBeNull();
    expect(() => controller.setSpeed(9)).not.toThrow();
    expect(controller.getSpeed()).toBe(9);
  });
});
