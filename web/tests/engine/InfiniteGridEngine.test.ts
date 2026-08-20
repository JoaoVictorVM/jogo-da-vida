import { describe, expect, it } from 'vitest';
import { InfiniteGridEngine } from '../../src/engine';
import { GLIDER, GLIDER_NEXT_GENERATION, seed, sortedCells, translate } from './helpers';

describe('InfiniteGridEngine', () => {
  it('applies one glider tick correctly', () => {
    const engine = new InfiniteGridEngine();
    seed(engine, GLIDER);
    engine.tick();

    expect(sortedCells(engine.getLiveCells())).toEqual(sortedCells(GLIDER_NEXT_GENERATION));
  });

  it('supports arbitrarily large positive and negative coordinates', () => {
    const engine = new InfiniteGridEngine();
    const far = Math.floor(Number.MAX_SAFE_INTEGER / 2) + 1000;
    seed(engine, GLIDER, far, -far);

    expect(engine.isAlive(far + 1, -far)).toBe(true);
    expect(engine.getLiveCells()).toHaveLength(5);

    engine.tick();

    expect(sortedCells(engine.getLiveCells())).toEqual(
      sortedCells(translate(GLIDER_NEXT_GENERATION, far, -far)),
    );
  });

  it('grows without a fixed boundary', () => {
    const engine = new InfiniteGridEngine();
    seed(engine, GLIDER);
    for (let i = 0; i < 4; i += 1) {
      engine.tick();
    }

    expect(sortedCells(engine.getLiveCells())).toEqual(sortedCells(translate(GLIDER, 1, 1)));
  });

  it('a dead cell with exactly three neighbors is born', () => {
    const engine = new InfiniteGridEngine();
    seed(engine, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);
    engine.tick();

    expect(engine.isAlive(1, 1)).toBe(true);
  });

  it('a live cell with two or three neighbors survives', () => {
    const engine = new InfiniteGridEngine();
    seed(engine, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
    engine.tick();

    expect(sortedCells(engine.getLiveCells())).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });

  it('a live cell with fewer than two neighbors dies', () => {
    const engine = new InfiniteGridEngine();
    seed(engine, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
    engine.tick();

    expect(engine.getLiveCells()).toEqual([]);
  });

  it('a live cell with more than three neighbors dies', () => {
    const engine = new InfiniteGridEngine();
    seed(engine, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]);
    engine.tick();

    expect(engine.isAlive(0, 0)).toBe(false);
  });

  it('ticking an empty grid keeps it empty', () => {
    const engine = new InfiniteGridEngine();
    engine.tick();

    expect(engine.getLiveCells()).toEqual([]);
    expect(engine.hasLiveCells()).toBe(false);
  });

  it('reports infinite mode and no dimensions', () => {
    const engine = new InfiniteGridEngine();
    expect(engine.getMode()).toBe('infinite');
    expect(engine.getDimensions()).toBeUndefined();
  });
});
