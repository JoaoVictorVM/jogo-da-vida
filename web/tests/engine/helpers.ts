import type { Coordinate, GridEngine } from '../../src/engine';

export const GLIDER: Coordinate[] = [
  { x: 1, y: 0 },
  { x: 2, y: 1 },
  { x: 0, y: 2 },
  { x: 1, y: 2 },
  { x: 2, y: 2 },
];

export const GLIDER_NEXT_GENERATION: Coordinate[] = [
  { x: 0, y: 1 },
  { x: 2, y: 1 },
  { x: 1, y: 2 },
  { x: 2, y: 2 },
  { x: 1, y: 3 },
];

export function seed(engine: GridEngine, cells: Coordinate[], offsetX = 0, offsetY = 0): void {
  for (const { x, y } of cells) {
    engine.setCell(x + offsetX, y + offsetY, true);
  }
}

export function sortedCells(cells: readonly Coordinate[]): Coordinate[] {
  return [...cells].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
}

export function translate(cells: Coordinate[], offsetX: number, offsetY: number): Coordinate[] {
  return cells.map(({ x, y }) => ({ x: x + offsetX, y: y + offsetY }));
}
