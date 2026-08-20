import { describe, expect, it } from 'vitest';
import { NEIGHBOR_OFFSETS, countLiveNeighbors, survives } from '../../src/engine';

describe('neighborUtils', () => {
  it('countLiveNeighbors counts all eight directions', () => {
    expect(NEIGHBOR_OFFSETS).toHaveLength(8);
    expect(NEIGHBOR_OFFSETS.some(([dx, dy]) => dx === 0 && dy === 0)).toBe(false);
    expect(new Set(NEIGHBOR_OFFSETS.map(([dx, dy]) => `${dx},${dy}`)).size).toBe(8);

    const live = new Set(NEIGHBOR_OFFSETS.map(([dx, dy]) => `${5 + dx},${5 + dy}`));
    const isAlive = (x: number, y: number): boolean => live.has(`${x},${y}`);

    expect(countLiveNeighbors(5, 5, isAlive)).toBe(8);
  });

  it('countLiveNeighbors ignores the center cell', () => {
    const isAlive = (x: number, y: number): boolean => x === 5 && y === 5;
    expect(countLiveNeighbors(5, 5, isAlive)).toBe(0);
  });

  it('countLiveNeighbors counts only the live neighbors present', () => {
    const live = new Set(['4,4', '6,6', '5,4']);
    const isAlive = (x: number, y: number): boolean => live.has(`${x},${y}`);
    expect(countLiveNeighbors(5, 5, isAlive)).toBe(3);
  });

  it('survives applies B3/S23', () => {
    expect(survives(true, 0)).toBe(false);
    expect(survives(true, 1)).toBe(false);
    expect(survives(true, 2)).toBe(true);
    expect(survives(true, 3)).toBe(true);
    expect(survives(true, 4)).toBe(false);
    expect(survives(false, 2)).toBe(false);
    expect(survives(false, 3)).toBe(true);
    expect(survives(false, 4)).toBe(false);
  });
});
