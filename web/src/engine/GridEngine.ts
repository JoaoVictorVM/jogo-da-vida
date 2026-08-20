import type { Coordinate, GridDimensions, GridMode } from './types';

export interface GridEngine {
  tick(): void;
  getLiveCells(): readonly Coordinate[];
  isAlive(x: number, y: number): boolean;
  setCell(x: number, y: number, alive: boolean): void;
  clear(): void;
  hasLiveCells(): boolean;
  getMode(): GridMode;
  getDimensions(): GridDimensions | undefined;
}
