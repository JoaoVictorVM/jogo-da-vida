export const MIN_SPEED_GPS = 1;
export const MAX_SPEED_GPS = 30;
export const DEFAULT_SPEED_GPS = 5;
export const MAX_TICKS_PER_FRAME = 10;

export type SpeedChangeListener = (gps: number) => void;

export interface SimulationControllerOptions {
  initialSpeedGps?: number;
  scheduleFrame?: (callback: (timestamp: number) => void) => number;
  cancelFrame?: (handle: number) => void;
  now?: () => number;
}
