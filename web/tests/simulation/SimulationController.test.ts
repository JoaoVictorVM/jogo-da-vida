import { describe, expect, it, vi } from 'vitest';
import { FiniteGridEngine, InfiniteGridEngine } from '../../src/engine';
import type { GridEngine } from '../../src/engine';
import { DEFAULT_SPEED_GPS, MAX_SPEED_GPS, MIN_SPEED_GPS, SimulationController } from '../../src/simulation';
import { createFakeScheduler } from './fakeScheduler';

function setup(engine: GridEngine = new InfiniteGridEngine()): {
  controller: SimulationController;
  scheduler: ReturnType<typeof createFakeScheduler>;
  engine: GridEngine;
  tick: ReturnType<typeof vi.spyOn>;
} {
  const scheduler = createFakeScheduler();
  const tick = vi.spyOn(engine, 'tick');
  const controller = new SimulationController(engine, scheduler.options);

  return { controller, scheduler, engine, tick };
}

describe('SimulationController', () => {
  it('starts paused at the default speed', () => {
    const { controller } = setup();

    expect(controller.isPlaying()).toBe(false);
    expect(controller.getSpeed()).toBe(DEFAULT_SPEED_GPS);
    expect(DEFAULT_SPEED_GPS).toBe(5);
  });

  it('accepts an initial speed and rejects an invalid one', () => {
    const scheduler = createFakeScheduler();

    expect(new SimulationController(new InfiniteGridEngine(), {
      ...scheduler.options,
      initialSpeedGps: 12,
    }).getSpeed()).toBe(12);

    expect(
      () => new SimulationController(new InfiniteGridEngine(), { initialSpeedGps: 99 }),
    ).toThrow(RangeError);
  });

  it('ticks at the configured interval while playing', () => {
    const { controller, scheduler, tick } = setup();

    controller.play();
    expect(controller.isPlaying()).toBe(true);

    scheduler.advance(200);
    expect(tick).toHaveBeenCalledTimes(1);

    scheduler.advance(100);
    expect(tick).toHaveBeenCalledTimes(1);

    scheduler.advance(100);
    expect(tick).toHaveBeenCalledTimes(2);

    scheduler.advance(600);
    expect(tick).toHaveBeenCalledTimes(5);
  });

  it('is a no-op when play is called twice', () => {
    const { controller, scheduler, tick } = setup();

    controller.play();
    controller.play();
    scheduler.advance(200);

    expect(tick).toHaveBeenCalledTimes(1);
    expect(scheduler.pendingFrames()).toBe(1);
  });

  it('stops ticking and cancels the scheduled frame on pause', () => {
    const { controller, scheduler, tick } = setup();

    controller.play();
    scheduler.advance(200);
    controller.pause();

    expect(controller.isPlaying()).toBe(false);
    expect(scheduler.cancelledHandles).toHaveLength(1);
    expect(scheduler.pendingFrames()).toBe(0);

    scheduler.advance(1000);
    expect(tick).toHaveBeenCalledTimes(1);

    controller.pause();
    expect(scheduler.cancelledHandles).toHaveLength(1);
  });

  it('flips state on each toggle', () => {
    const { controller } = setup();

    controller.togglePlayPause();
    expect(controller.isPlaying()).toBe(true);

    controller.togglePlayPause();
    expect(controller.isPlaying()).toBe(false);
  });

  it('advances exactly one generation on step while paused', () => {
    const { controller, tick } = setup();

    controller.step();

    expect(tick).toHaveBeenCalledTimes(1);
    expect(controller.isPlaying()).toBe(false);
  });

  it('pauses first and then advances one generation on step while playing', () => {
    const { controller, scheduler, tick } = setup();

    controller.play();
    scheduler.advance(200);
    expect(tick).toHaveBeenCalledTimes(1);

    controller.step();

    expect(controller.isPlaying()).toBe(false);
    expect(tick).toHaveBeenCalledTimes(2);

    scheduler.advance(1000);
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('applies a speed change immediately without restarting the loop', () => {
    const { controller, scheduler, tick } = setup();

    controller.setSpeed(1);
    controller.play();

    scheduler.advance(100);
    expect(tick).not.toHaveBeenCalled();

    controller.setSpeed(30);
    scheduler.advance(34);

    expect(tick).toHaveBeenCalledTimes(1);
    expect(controller.isPlaying()).toBe(true);
    expect(scheduler.cancelledHandles).toHaveLength(0);
  });

  it('rejects out of range or non integer speeds', () => {
    const { controller } = setup();

    for (const invalid of [0, 31, -5, 2.5, Number.NaN]) {
      expect(() => controller.setSpeed(invalid)).toThrow(RangeError);
    }
    expect(controller.getSpeed()).toBe(DEFAULT_SPEED_GPS);
    expect(MIN_SPEED_GPS).toBe(1);
    expect(MAX_SPEED_GPS).toBe(30);
  });

  it('notifies subscribers only when the speed actually changes', () => {
    const { controller } = setup();
    const listener = vi.fn();

    const unsubscribe = controller.onSpeedChange(listener);

    controller.setSpeed(DEFAULT_SPEED_GPS);
    expect(listener).not.toHaveBeenCalled();

    controller.setSpeed(10);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(10);

    unsubscribe();
    controller.setSpeed(20);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('clears live cells and pauses on reset, keeping mode and dimensions', () => {
    const engine = new FiniteGridEngine({ width: 12, height: 8 });
    const { controller, scheduler } = setup(engine);
    engine.setCell(1, 1, true);
    engine.setCell(2, 2, true);

    controller.play();
    scheduler.advance(200);
    controller.reset();

    expect(engine.getLiveCells()).toEqual([]);
    expect(controller.isPlaying()).toBe(false);
    expect(engine.getMode()).toBe('finite');
    expect(engine.getDimensions()).toEqual({ width: 12, height: 8 });
  });

  it('caps the catch up ticks after a long stall', () => {
    const { controller, scheduler, tick } = setup();

    controller.setSpeed(30);
    controller.play();
    scheduler.advance(60_000);

    expect(tick).toHaveBeenCalledTimes(10);

    tick.mockClear();
    scheduler.advance(34);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('ignores frames that arrive after destroy and drops subscribers', () => {
    const { controller, scheduler, tick } = setup();
    const listener = vi.fn();
    controller.onSpeedChange(listener);

    controller.play();
    controller.destroy();
    scheduler.advance(1000);

    expect(tick).not.toHaveBeenCalled();
    expect(controller.isPlaying()).toBe(false);

    controller.setSpeed(20);
    expect(listener).not.toHaveBeenCalled();
  });

  it('drives a real engine through play and step', () => {
    const engine = new FiniteGridEngine({ width: 10, height: 10 });
    for (const [x, y] of [
      [4, 5],
      [5, 5],
      [6, 5],
    ]) {
      engine.setCell(x, y, true);
    }
    const scheduler = createFakeScheduler();
    const controller = new SimulationController(engine, scheduler.options);

    controller.play();
    scheduler.advance(200);

    expect(engine.getLiveCells().map((cell) => `${cell.x},${cell.y}`).sort()).toEqual([
      '5,4',
      '5,5',
      '5,6',
    ]);

    controller.step();

    expect(engine.getLiveCells().map((cell) => `${cell.x},${cell.y}`).sort()).toEqual([
      '4,5',
      '5,5',
      '6,5',
    ]);
  });

  it('falls back to the browser scheduler when none is injected', () => {
    const engine = new InfiniteGridEngine();
    const tick = vi.spyOn(engine, 'tick');
    const controller = new SimulationController(engine, { initialSpeedGps: 30 });

    controller.play();
    expect(controller.isPlaying()).toBe(true);

    controller.pause();
    expect(tick).not.toHaveBeenCalled();
  });
});
