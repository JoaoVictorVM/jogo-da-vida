import type { GridEngine } from './GridEngine';
import { NEIGHBOR_OFFSETS } from './neighborUtils';
import type { Coordinate, GridDimensions, GridMode } from './types';

function key(x: number, y: number): string {
  return `${x},${y}`;
}

function parseKey(cellKey: string): Coordinate {
  const separator = cellKey.indexOf(',');
  return {
    x: Number(cellKey.slice(0, separator)),
    y: Number(cellKey.slice(separator + 1)),
  };
}

export class InfiniteGridEngine implements GridEngine {
  private liveCells = new Set<string>();

  tick(): void {
    const neighborCounts = new Map<string, number>();

    for (const cellKey of this.liveCells) {
      const { x, y } = parseKey(cellKey);
      for (const [dx, dy] of NEIGHBOR_OFFSETS) {
        const neighborKey = key(x + dx, y + dy);
        neighborCounts.set(neighborKey, (neighborCounts.get(neighborKey) ?? 0) + 1);
      }
    }

    const next = new Set<string>();
    for (const [cellKey, count] of neighborCounts) {
      const alive = this.liveCells.has(cellKey);
      if (alive ? count === 2 || count === 3 : count === 3) {
        next.add(cellKey);
      }
    }

    this.liveCells = next;
  }

  getLiveCells(): readonly Coordinate[] {
    return Array.from(this.liveCells, parseKey);
  }

  isAlive(x: number, y: number): boolean {
    return this.liveCells.has(key(x, y));
  }

  setCell(x: number, y: number, alive: boolean): void {
    if (alive) {
      this.liveCells.add(key(x, y));
    } else {
      this.liveCells.delete(key(x, y));
    }
  }

  clear(): void {
    this.liveCells.clear();
  }

  hasLiveCells(): boolean {
    return this.liveCells.size > 0;
  }

  getMode(): GridMode {
    return 'infinite';
  }

  getDimensions(): GridDimensions | undefined {
    return undefined;
  }
}
