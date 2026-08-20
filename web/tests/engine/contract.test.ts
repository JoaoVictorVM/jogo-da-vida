import { describe, expect, it } from 'vitest';
import * as engineModule from '../../src/engine';
import { FiniteGridEngine, InfiniteGridEngine, MAX_GRID_SIZE, MIN_GRID_SIZE } from '../../src/engine';
import type { GridEngine } from '../../src/engine';
import { GLIDER, seed, sortedCells } from './helpers';

const implementations: [string, () => GridEngine][] = [
  ['FiniteGridEngine', (): GridEngine => new FiniteGridEngine({ width: 20, height: 20 })],
  ['InfiniteGridEngine', (): GridEngine => new InfiniteGridEngine()],
];

describe('engine public entry point', () => {
  it('exports the documented runtime symbols', () => {
    expect(Object.keys(engineModule).sort()).toEqual(
      [
        'FiniteGridEngine',
        'InfiniteGridEngine',
        'MAX_GRID_SIZE',
        'MIN_GRID_SIZE',
        'NEIGHBOR_OFFSETS',
        'countLiveNeighbors',
        'survives',
      ].sort(),
    );
  });

  it('exposes the documented grid size limits', () => {
    expect(MIN_GRID_SIZE).toBe(1);
    expect(MAX_GRID_SIZE).toBe(1000);
  });
});

describe.each(implementations)('GridEngine contract on %s', (_name, createEngine) => {
  it('implements every method of the interface', () => {
    const engine = createEngine();
    for (const method of [
      'tick',
      'getLiveCells',
      'isAlive',
      'setCell',
      'clear',
      'hasLiveCells',
      'getMode',
      'getDimensions',
    ] as const) {
      expect(typeof engine[method]).toBe('function');
    }
  });

  it('hasLiveCells reflects state before and after clear', () => {
    const engine = createEngine();
    expect(engine.hasLiveCells()).toBe(false);

    engine.setCell(2, 3, true);
    expect(engine.hasLiveCells()).toBe(true);

    engine.setCell(2, 3, false);
    expect(engine.hasLiveCells()).toBe(false);

    seed(engine, GLIDER);
    expect(engine.hasLiveCells()).toBe(true);

    engine.clear();
    expect(engine.hasLiveCells()).toBe(false);
    expect(engine.getLiveCells()).toEqual([]);
  });

  it('clear keeps mode and dimensions', () => {
    const engine = createEngine();
    const mode = engine.getMode();
    const dimensions = engine.getDimensions();

    seed(engine, GLIDER);
    engine.clear();

    expect(engine.getMode()).toBe(mode);
    expect(engine.getDimensions()).toEqual(dimensions);
  });

  it('behaves identically across implementations for equivalent scenarios', () => {
    const engine = createEngine();
    seed(engine, GLIDER, 5, 5);
    engine.tick();

    expect(sortedCells(engine.getLiveCells())).toEqual([
      { x: 5, y: 6 },
      { x: 7, y: 6 },
      { x: 6, y: 7 },
      { x: 7, y: 7 },
      { x: 6, y: 8 },
    ]);
    expect(engine.isAlive(5, 6)).toBe(true);
    expect(engine.isAlive(6, 5)).toBe(false);
  });
});
