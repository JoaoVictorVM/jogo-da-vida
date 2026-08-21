import type { GridEngine } from '../engine';
import {
  DEFAULT_SPEED_GPS,
  MAX_SPEED_GPS,
  MAX_TICKS_PER_FRAME,
  MIN_SPEED_GPS,
} from './types';
import type { SimulationControllerOptions, SpeedChangeListener } from './types';

function assertValidSpeed(gps: number): void {
  if (!Number.isInteger(gps) || gps < MIN_SPEED_GPS || gps > MAX_SPEED_GPS) {
    throw new RangeError(
      `speed must be an integer between ${MIN_SPEED_GPS} and ${MAX_SPEED_GPS}, received ${gps}`,
    );
  }
}

export class SimulationController {
  private readonly engine: GridEngine;
  private readonly scheduleFrame: (callback: (timestamp: number) => void) => number;
  private readonly cancelFrame: (handle: number) => void;
  private readonly now: () => number;
  private readonly speedChangeListeners = new Set<SpeedChangeListener>();

  private speedGps: number;
  private playing = false;
  private frameHandle: number | undefined;
  private lastFrameTimestamp: number | undefined;
  private accumulatedMs = 0;

  constructor(engine: GridEngine, options: SimulationControllerOptions = {}) {
    const initialSpeed = options.initialSpeedGps ?? DEFAULT_SPEED_GPS;
    assertValidSpeed(initialSpeed);

    this.engine = engine;
    this.speedGps = initialSpeed;
    this.scheduleFrame = options.scheduleFrame ?? ((callback) => requestAnimationFrame(callback));
    this.cancelFrame = options.cancelFrame ?? ((handle) => cancelAnimationFrame(handle));
    this.now = options.now ?? ((): number => performance.now());
  }

  play(): void {
    if (this.playing) {
      return;
    }
    this.playing = true;
    this.lastFrameTimestamp = this.now();
    this.accumulatedMs = 0;
    this.frameHandle = this.scheduleFrame(this.handleFrame);
  }

  pause(): void {
    if (!this.playing) {
      return;
    }
    this.playing = false;
    if (this.frameHandle !== undefined) {
      this.cancelFrame(this.frameHandle);
      this.frameHandle = undefined;
    }
    this.lastFrameTimestamp = undefined;
    this.accumulatedMs = 0;
  }

  togglePlayPause(): void {
    if (this.playing) {
      this.pause();
      return;
    }
    this.play();
  }

  step(): void {
    this.pause();
    this.engine.tick();
  }

  reset(): void {
    this.pause();
    this.engine.clear();
  }

  setSpeed(gps: number): void {
    assertValidSpeed(gps);
    if (gps === this.speedGps) {
      return;
    }

    this.speedGps = gps;
    this.accumulatedMs = 0;
    for (const listener of this.speedChangeListeners) {
      listener(gps);
    }
  }

  getSpeed(): number {
    return this.speedGps;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  onSpeedChange(listener: SpeedChangeListener): () => void {
    this.speedChangeListeners.add(listener);
    return () => {
      this.speedChangeListeners.delete(listener);
    };
  }

  destroy(): void {
    this.pause();
    this.speedChangeListeners.clear();
  }

  private readonly handleFrame = (timestamp: number): void => {
    if (!this.playing) {
      return;
    }

    if (this.lastFrameTimestamp === undefined) {
      this.lastFrameTimestamp = timestamp;
    }

    this.accumulatedMs += Math.max(0, timestamp - this.lastFrameTimestamp);
    this.lastFrameTimestamp = timestamp;

    const intervalMs = 1000 / this.speedGps;
    let ticksThisFrame = 0;
    while (this.accumulatedMs >= intervalMs && ticksThisFrame < MAX_TICKS_PER_FRAME) {
      this.engine.tick();
      this.accumulatedMs -= intervalMs;
      ticksThisFrame += 1;
    }

    if (this.accumulatedMs >= intervalMs) {
      this.accumulatedMs = 0;
    }

    if (this.playing) {
      this.frameHandle = this.scheduleFrame(this.handleFrame);
    }
  };
}
