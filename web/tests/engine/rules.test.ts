import { describe, expect, it } from 'vitest';
import { FiniteGridEngine, InfiniteGridEngine } from '../../src/engine';
import type { GridEngine } from '../../src/engine';
import { GLIDER, GLIDER_NEXT_GENERATION, seed, sortedCells } from './helpers';

const implementations: [string, () => GridEngine][] = [
  ['FiniteGridEngine', (): GridEngine => new FiniteGridEngine({ width: 20, height: 20 })],
  ['InfiniteGridEngine', (): GridEngine => new InfiniteGridEngine()],
];

describe.each(implementations)('B3/S23 rules on %s', (_name, createEngine) => {
  it('advances a glider to the correct next generation', () => {
    const engine = createEngine();
    seed(engine, GLIDER, 5, 5);
    engine.tick();

    expect(sortedCells(engine.getLiveCells())).toEqual(
      sortedCells(GLIDER_NEXT_GENERATION.map(({ x, y }) => ({ x: x + 5, y: y + 5 }))),
    );
  });

  it('keeps a block still life stable', () => {
    const engine = createEngine();
    seed(engine, [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ]);
    engine.tick();
    engine.tick();

    expect(sortedCells(engine.getLiveCells())).toEqual([
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ]);
  });

  it('oscillates a blinker with period two', () => {
    const engine = createEngine();
    seed(engine, [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 7, y: 5 },
    ]);

    engine.tick();
    expect(sortedCells(engine.getLiveCells())).toEqual([
      { x: 6, y: 4 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
    ]);

    engine.tick();
    expect(sortedCells(engine.getLiveCells())).toEqual([
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 7, y: 5 },
    ]);
  });

  it('kills isolated cells', () => {
    const engine = createEngine();
    seed(engine, [{ x: 5, y: 5 }]);
    engine.tick();

    expect(engine.hasLiveCells()).toBe(false);
  });

  it('kills overcrowded cells and births cells with exactly three neighbors', () => {
    const engine = createEngine();
    seed(engine, [
      { x: 5, y: 4 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 5, y: 6 },
    ]);
    engine.tick();

    expect(engine.isAlive(5, 5)).toBe(false);
    expect(engine.isAlive(4, 4)).toBe(true);
    expect(engine.isAlive(6, 4)).toBe(true);
    expect(engine.isAlive(4, 6)).toBe(true);
    expect(engine.isAlive(6, 6)).toBe(true);
  });

  it('leaves an empty grid empty', () => {
    const engine = createEngine();
    engine.tick();

    expect(engine.getLiveCells()).toEqual([]);
  });
});
