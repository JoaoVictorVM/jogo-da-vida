export interface Coordinate {
  x: number;
  y: number;
}

export type GridMode = 'finite' | 'infinite';

export interface GridDimensions {
  width: number;
  height: number;
}

export type LiveCell = Coordinate;

export const MIN_GRID_SIZE = 1;
export const MAX_GRID_SIZE = 1000;
