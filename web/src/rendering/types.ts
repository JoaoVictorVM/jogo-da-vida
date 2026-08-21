export interface ViewportSize {
  width: number;
  height: number;
}

export interface GridPoint {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface GridBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type CanvasStyle = string | CanvasGradient | CanvasPattern;

export interface CanvasRenderingContext2DLike {
  fillStyle: CanvasStyle;
  strokeStyle: CanvasStyle;
  lineWidth: number;
  fillRect(x: number, y: number, width: number, height: number): void;
  clearRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
}

export const MIN_CELL_SIZE = 2;
export const MAX_CELL_SIZE = 64;
export const GRID_LINES_MIN_CELL_SIZE = 4;
export const GRID_LINE_COLOR = '#333333';
export const DEFAULT_INFINITE_VIEWPORT_CELLS = 50;
