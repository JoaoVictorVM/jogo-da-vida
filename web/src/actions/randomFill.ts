import type { GridEngine } from '../engine';
import type { GridRegion } from './types';

export const RANDOM_FILL_PROBABILITY = 0.3;

function assertValidRegion({ width, height }: GridRegion): void {
  for (const [name, value] of [
    ['width', width],
    ['height', height],
  ] as const) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new RangeError(`region ${name} must be a positive integer, received ${value}`);
    }
  }
}

function resolveTargetArea(engine: GridEngine, region: GridRegion | undefined): GridRegion {
  if (engine.getMode() === 'finite') {
    const dimensions = engine.getDimensions();
    if (dimensions === undefined) {
      throw new TypeError('finite engine did not report its dimensions');
    }
    return { x: 0, y: 0, width: dimensions.width, height: dimensions.height };
  }

  if (region === undefined) {
    throw new TypeError('region is required to random fill an infinite grid');
  }

  assertValidRegion(region);
  return region;
}

export function randomFill(
  engine: GridEngine,
  region?: GridRegion,
  random: () => number = Math.random,
): void {
  const area = resolveTargetArea(engine, region);

  for (let row = 0; row < area.height; row += 1) {
    for (let col = 0; col < area.width; col += 1) {
      engine.setCell(area.x + col, area.y + row, random() < RANDOM_FILL_PROBABILITY);
    }
  }
}

export function regionFromBounds(bounds: {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}): GridRegion {
  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX + 1,
    height: bounds.maxY - bounds.minY + 1,
  };
}
