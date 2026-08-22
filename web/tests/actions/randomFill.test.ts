import { afterEach, describe, expect, it, vi } from 'vitest';
import { RANDOM_FILL_PROBABILITY, randomFill, regionFromBounds } from '../../src/actions';
import { FiniteGridEngine, InfiniteGridEngine } from '../../src/engine';
import { Camera } from '../../src/rendering';

function sequenceRandom(values: number[]): () => number {
  let index = 0;
  return (): number => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return (): number => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('randomFill', () => {
  it('exposes the documented fixed probability', () => {
    expect(RANDOM_FILL_PROBABILITY).toBe(0.3);
  });

  it('evaluates every cell of a finite grid', () => {
    const engine = new FiniteGridEngine({ width: 3, height: 3 });
    const rolls = [0.1, 0.9, 0.2, 0.5, 0.29, 0.31, 0.0, 0.99, 0.3];
    const random = vi.fn(sequenceRandom(rolls));

    randomFill(engine, undefined, random);

    expect(random).toHaveBeenCalledTimes(9);
    for (let index = 0; index < rolls.length; index += 1) {
      const x = index % 3;
      const y = Math.floor(index / 3);
      expect(engine.isAlive(x, y)).toBe(rolls[index] < RANDOM_FILL_PROBABILITY);
    }
    expect(engine.getLiveCells()).toHaveLength(4);
  });

  it('clears finite cells that lost the roll', () => {
    const engine = new FiniteGridEngine({ width: 2, height: 2 });
    engine.setCell(0, 0, true);
    engine.setCell(1, 1, true);

    randomFill(engine, undefined, () => 0.9);

    expect(engine.hasLiveCells()).toBe(false);
  });

  it('ignores a region passed in finite mode', () => {
    const withRegion = new FiniteGridEngine({ width: 3, height: 2 });
    const withoutRegion = new FiniteGridEngine({ width: 3, height: 2 });
    const rolls = [0.1, 0.9, 0.2, 0.5, 0.1, 0.4];

    randomFill(withRegion, { x: 50, y: 50, width: 1, height: 1 }, sequenceRandom(rolls));
    randomFill(withoutRegion, undefined, sequenceRandom(rolls));

    expect(withRegion.getLiveCells()).toEqual(withoutRegion.getLiveCells());
    expect(withRegion.isAlive(50, 50)).toBe(false);
  });

  it('fills the grid at its current size after a resize', () => {
    const engine = new FiniteGridEngine({ width: 2, height: 2 });
    engine.resize({ width: 4, height: 3 });
    const random = vi.fn(() => 0.1);

    randomFill(engine, undefined, random);

    expect(random).toHaveBeenCalledTimes(12);
    expect(engine.getLiveCells()).toHaveLength(12);
  });

  it('only affects cells inside the region in infinite mode', () => {
    const engine = new InfiniteGridEngine();
    engine.setCell(-1, -1, true);
    engine.setCell(2, 0, true);
    engine.setCell(100, 100, true);
    engine.setCell(0, 0, true);
    engine.setCell(1, 1, true);

    randomFill(engine, { x: 0, y: 0, width: 2, height: 2 }, () => 0.9);

    expect(engine.isAlive(-1, -1)).toBe(true);
    expect(engine.isAlive(2, 0)).toBe(true);
    expect(engine.isAlive(100, 100)).toBe(true);
    expect(engine.isAlive(0, 0)).toBe(false);
    expect(engine.isAlive(1, 1)).toBe(false);
  });

  it('fills negative coordinates inside the region', () => {
    const engine = new InfiniteGridEngine();
    const random = vi.fn(() => 0.1);

    randomFill(engine, { x: -3, y: -2, width: 2, height: 2 }, random);

    expect(random).toHaveBeenCalledTimes(4);
    for (const cell of [
      { x: -3, y: -2 },
      { x: -2, y: -2 },
      { x: -3, y: -1 },
      { x: -2, y: -1 },
    ]) {
      expect(engine.isAlive(cell.x, cell.y)).toBe(true);
    }
  });

  it('throws when the infinite mode region is missing', () => {
    expect(() => randomFill(new InfiniteGridEngine())).toThrow(TypeError);
  });

  it('rejects non positive or non integer region dimensions', () => {
    const engine = new InfiniteGridEngine();

    for (const region of [
      { x: 0, y: 0, width: 0, height: 4 },
      { x: 0, y: 0, width: 4, height: 0 },
      { x: 0, y: 0, width: -2, height: 4 },
      { x: 0, y: 0, width: 2.5, height: 4 },
      { x: 0, y: 0, width: 4, height: Number.NaN },
    ]) {
      expect(() => randomFill(engine, region)).toThrow(RangeError);
    }
    expect(engine.hasLiveCells()).toBe(false);
  });

  it('applies the fixed probability statistically', () => {
    const engine = new FiniteGridEngine({ width: 100, height: 100 });

    randomFill(engine, undefined, seededRandom(42));

    const ratio = engine.getLiveCells().length / 10_000;
    expect(ratio).toBeGreaterThan(0.27);
    expect(ratio).toBeLessThan(0.33);
  });

  it('defaults to Math.random when no source is injected', () => {
    const engine = new FiniteGridEngine({ width: 3, height: 4 });
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

    randomFill(engine);

    expect(spy).toHaveBeenCalledTimes(12);
    expect(engine.getLiveCells()).toHaveLength(12);
  });
});

describe('regionFromBounds', () => {
  it('converts inclusive viewport bounds into a region', () => {
    expect(regionFromBounds({ minX: -25, minY: -13, maxX: 24, maxY: 12 })).toEqual({
      x: -25,
      y: -13,
      width: 50,
      height: 26,
    });
  });

  it('produces a region usable by randomFill', () => {
    const engine = new InfiniteGridEngine();
    const camera = new Camera({ width: 160, height: 160 });
    camera.centerInfiniteViewport(10);

    randomFill(engine, regionFromBounds(camera.getVisibleGridBounds()), () => 0.1);

    expect(engine.getLiveCells()).toHaveLength(100);
    expect(engine.isAlive(-5, -5)).toBe(true);
    expect(engine.isAlive(4, 4)).toBe(true);
    expect(engine.isAlive(5, 5)).toBe(false);
  });
});
