import type { SimulationControllerOptions } from '../../src/simulation';

export interface FakeScheduler {
  options: Required<Pick<SimulationControllerOptions, 'scheduleFrame' | 'cancelFrame' | 'now'>>;
  advance(ms: number): void;
  cancelledHandles: number[];
  pendingFrames(): number;
}

export function createFakeScheduler(): FakeScheduler {
  let currentTime = 0;
  let nextHandle = 1;
  const frames = new Map<number, (timestamp: number) => void>();
  const cancelledHandles: number[] = [];

  return {
    options: {
      scheduleFrame: (callback): number => {
        const handle = nextHandle;
        nextHandle += 1;
        frames.set(handle, callback);
        return handle;
      },
      cancelFrame: (handle): void => {
        cancelledHandles.push(handle);
        frames.delete(handle);
      },
      now: (): number => currentTime,
    },
    advance(ms: number): void {
      currentTime += ms;
      const pending = [...frames.entries()];
      frames.clear();
      for (const [, callback] of pending) {
        callback(currentTime);
      }
    },
    cancelledHandles,
    pendingFrames: (): number => frames.size,
  };
}
