import { describe, expect, it } from 'vitest';
import { FiniteGridEngine } from '../../src/engine';
import { GLIDER, GLIDER_NEXT_GENERATION, seed, sortedCells } from './helpers';

describe('FiniteGridEngine', () => {
  it('applies one glider tick correctly', () => {
    const engine = new FiniteGridEngine({ width: 10, height: 10 });
    seed(engine, GLIDER);
    engine.tick();

    expect(sortedCells(engine.getLiveCells())).toEqual(sortedCells(GLIDER_NEXT_GENERATION));
  });

  it('accepts dimensions from 1x1 to 1000x1000', () => {
    expect(new FiniteGridEngine({ width: 1, height: 1 }).getDimensions()).toEqual({ width: 1, height: 1 });
    expect(new FiniteGridEngine({ width: 1000, height: 1000 }).getDimensions()).toEqual({
      width: 1000,
      height: 1000,
    });
    expect(new FiniteGridEngine({ width: 1, height: 1000 }).getDimensions()).toEqual({ width: 1, height: 1000 });
  });

  it('rejects out of range dimensions', () => {
    expect(() => new FiniteGridEngine({ width: 0, height: 10 })).toThrow(RangeError);
    expect(() => new FiniteGridEngine({ width: 10, height: 0 })).toThrow(RangeError);
    expect(() => new FiniteGridEngine({ width: -5, height: 10 })).toThrow(RangeError);
    expect(() => new FiniteGridEngine({ width: 1001, height: 10 })).toThrow(RangeError);
    expect(() => new FiniteGridEngine({ width: 10, height: 1001 })).toThrow(RangeError);
    expect(() => new FiniteGridEngine({ width: 10.5, height: 10 })).toThrow(RangeError);
    expect(() => new FiniteGridEngine({ width: Number.NaN, height: 10 })).toThrow(RangeError);
  });

  it('resize reallocates the grid and clears all cells', () => {
    const engine = new FiniteGridEngine({ width: 5, height: 5 });
    seed(engine, GLIDER);
    engine.resize({ width: 8, height: 3 });

    expect(engine.getDimensions()).toEqual({ width: 8, height: 3 });
    expect(engine.hasLiveCells()).toBe(false);
    expect(engine.getLiveCells()).toEqual([]);
  });

  it('resize rejects out of range dimensions', () => {
    const engine = new FiniteGridEngine({ width: 5, height: 5 });
    expect(() => engine.resize({ width: 0, height: 5 })).toThrow(RangeError);
    expect(() => engine.resize({ width: 5, height: 1001 })).toThrow(RangeError);
    expect(engine.getDimensions()).toEqual({ width: 5, height: 5 });
  });

  it('boundary neighbors never wrap around', () => {
    const engine = new FiniteGridEngine({ width: 4, height: 4 });
    seed(engine, [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 3 },
      { x: 3, y: 3 },
    ]);
    engine.tick();

    expect(engine.getLiveCells()).toEqual([]);
  });

  it('edge cells only count in-bounds neighbors', () => {
    const engine = new FiniteGridEngine({ width: 3, height: 3 });
    seed(engine, [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ]);
    engine.tick();

    expect(sortedCells(engine.getLiveCells())).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });

  it('setCell out of bounds is a no-op', () => {
    const engine = new FiniteGridEngine({ width: 3, height: 3 });
    engine.setCell(-1, 0, true);
    engine.setCell(0, -1, true);
    engine.setCell(3, 0, true);
    engine.setCell(0, 3, true);
    engine.setCell(1.5, 1, true);

    expect(engine.isAlive(-1, 0)).toBe(false);
    expect(engine.isAlive(3, 0)).toBe(false);
    expect(engine.isAlive(0, 3)).toBe(false);
    expect(engine.isAlive(1.5, 1)).toBe(false);
    expect(engine.getLiveCells()).toHaveLength(0);
  });

  it('setCell toggles a cell on and off', () => {
    const engine = new FiniteGridEngine({ width: 3, height: 3 });
    engine.setCell(1, 1, true);
    expect(engine.isAlive(1, 1)).toBe(true);

    engine.setCell(1, 1, false);
    expect(engine.isAlive(1, 1)).toBe(false);
  });

  it('reports finite mode', () => {
    expect(new FiniteGridEngine({ width: 2, height: 2 }).getMode()).toBe('finite');
  });
});
