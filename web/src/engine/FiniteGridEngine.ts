import type { GridEngine } from './GridEngine';
import { countLiveNeighbors, survives } from './neighborUtils';
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from './types';
import type { Coordinate, GridDimensions, GridMode } from './types';

function assertValidDimensions({ width, height }: GridDimensions): void {
  for (const [name, value] of [
    ['width', width],
    ['height', height],
  ] as const) {
    if (!Number.isInteger(value) || value < MIN_GRID_SIZE || value > MAX_GRID_SIZE) {
      throw new RangeError(
        `${name} must be an integer between ${MIN_GRID_SIZE} and ${MAX_GRID_SIZE}, received ${value}`,
      );
    }
  }
}

export class FiniteGridEngine implements GridEngine {
  private width: number;
  private height: number;
  private cells: Uint8Array;

  constructor(dimensions: GridDimensions) {
    assertValidDimensions(dimensions);
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.cells = new Uint8Array(this.width * this.height);
  }

  resize(dimensions: GridDimensions): void {
    assertValidDimensions(dimensions);
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.cells = new Uint8Array(this.width * this.height);
  }

  tick(): void {
    const next = new Uint8Array(this.cells.length);
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const alive = this.cells[y * this.width + x] === 1;
        const liveNeighbors = countLiveNeighbors(x, y, this.isAliveBound);
        next[y * this.width + x] = survives(alive, liveNeighbors) ? 1 : 0;
      }
    }
    this.cells = next;
  }

  getLiveCells(): readonly Coordinate[] {
    const live: Coordinate[] = [];
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.cells[y * this.width + x] === 1) {
          live.push({ x, y });
        }
      }
    }
    return live;
  }

  isAlive(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) {
      return false;
    }
    return this.cells[y * this.width + x] === 1;
  }

  setCell(x: number, y: number, alive: boolean): void {
    if (!this.isInBounds(x, y)) {
      return;
    }
    this.cells[y * this.width + x] = alive ? 1 : 0;
  }

  clear(): void {
    this.cells.fill(0);
  }

  hasLiveCells(): boolean {
    return this.cells.some((cell) => cell === 1);
  }

  getMode(): GridMode {
    return 'finite';
  }

  getDimensions(): GridDimensions {
    return { width: this.width, height: this.height };
  }

  private isInBounds(x: number, y: number): boolean {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private readonly isAliveBound = (x: number, y: number): boolean => this.isAlive(x, y);
}
