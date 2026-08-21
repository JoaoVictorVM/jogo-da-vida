import { describe, expect, it } from 'vitest';
import { Camera, MAX_CELL_SIZE, MIN_CELL_SIZE } from '../../src/rendering';

describe('Camera', () => {
  it('round trips between screen and grid coordinates at several zoom levels', () => {
    const camera = new Camera({ width: 800, height: 600 });

    for (const factor of [1, 0.25, 4]) {
      camera.zoomAt({ x: 400, y: 300 }, factor);

      const screenPoint = { x: 123.5, y: 45.25 };
      const roundTripped = camera.gridToScreen(camera.screenToGrid(screenPoint));

      expect(roundTripped.x).toBeCloseTo(screenPoint.x, 6);
      expect(roundTripped.y).toBeCloseTo(screenPoint.y, 6);
    }
  });

  it('keeps the cell under the cursor fixed while zooming', () => {
    const camera = new Camera({ width: 800, height: 600 });
    const cursor = { x: 210, y: 140 };

    for (const factor of [1.2, 1.2, 0.5, 0.5]) {
      const before = camera.screenToGrid(cursor);
      camera.zoomAt(cursor, factor);
      const after = camera.screenToGrid(cursor);

      expect(after.x).toBeCloseTo(before.x, 6);
      expect(after.y).toBeCloseTo(before.y, 6);
    }
  });

  it('clamps zoom to the documented range', () => {
    const camera = new Camera({ width: 800, height: 600 });

    for (let i = 0; i < 50; i += 1) {
      camera.zoomAt({ x: 0, y: 0 }, 2);
    }
    expect(camera.getCellSize()).toBe(MAX_CELL_SIZE);

    for (let i = 0; i < 50; i += 1) {
      camera.zoomAt({ x: 0, y: 0 }, 0.5);
    }
    expect(camera.getCellSize()).toBe(MIN_CELL_SIZE);
  });

  it('ignores non positive or non finite zoom factors', () => {
    const camera = new Camera({ width: 800, height: 600 });
    const before = camera.getCellSize();

    camera.zoomAt({ x: 10, y: 10 }, 0);
    camera.zoomAt({ x: 10, y: 10 }, -2);
    camera.zoomAt({ x: 10, y: 10 }, Number.NaN);

    expect(camera.getCellSize()).toBe(before);
  });

  it('fits an entire finite grid into the viewport', () => {
    const camera = new Camera({ width: 800, height: 600 });
    camera.fitToFiniteGrid({ width: 100, height: 50 });

    const bounds = camera.getVisibleGridBounds();

    expect(camera.getCellSize()).toBe(8);
    expect(bounds.minX).toBeLessThanOrEqual(0);
    expect(bounds.maxX).toBeGreaterThanOrEqual(99);
    expect(bounds.minY).toBeLessThanOrEqual(0);
    expect(bounds.maxY).toBeGreaterThanOrEqual(49);
  });

  it('clamps the fitted cell size to the documented range', () => {
    const tiny = new Camera({ width: 800, height: 600 });
    tiny.fitToFiniteGrid({ width: 1, height: 1 });
    expect(tiny.getCellSize()).toBe(MAX_CELL_SIZE);

    const huge = new Camera({ width: 800, height: 600 });
    huge.fitToFiniteGrid({ width: 1000, height: 1000 });
    expect(huge.getCellSize()).toBe(MIN_CELL_SIZE);
  });

  it('centers a 50 by 50 viewport on the origin in infinite mode', () => {
    const camera = new Camera({ width: 800, height: 800 });
    camera.centerInfiniteViewport();

    const bounds = camera.getVisibleGridBounds();

    expect(camera.getCellSize()).toBe(16);
    expect(bounds.maxX - bounds.minX + 1).toBe(50);
    expect(bounds.maxY - bounds.minY + 1).toBe(50);
    expect(bounds.minX).toBe(-25);
    expect(bounds.minY).toBe(-25);
  });

  it('accepts a custom cell count for the infinite viewport', () => {
    const camera = new Camera({ width: 800, height: 800 });
    camera.centerInfiniteViewport(100);

    expect(camera.getCellSize()).toBe(8);
    expect(camera.screenToGrid({ x: 400, y: 400 })).toEqual({ x: 0, y: 0 });
  });

  it('pans the origin by the screen delta converted to grid units', () => {
    const camera = new Camera({ width: 800, height: 600 });
    camera.centerInfiniteViewport(50);
    const cellSize = camera.getCellSize();
    const before = camera.screenToGrid({ x: 0, y: 0 });

    camera.panBy(32, -16);

    const after = camera.screenToGrid({ x: 0, y: 0 });
    expect(after.x).toBeCloseTo(before.x - 32 / cellSize, 6);
    expect(after.y).toBeCloseTo(before.y + 16 / cellSize, 6);
  });

  it('keeps the centered grid point fixed when the viewport is resized', () => {
    const camera = new Camera({ width: 800, height: 600 });
    camera.centerInfiniteViewport();
    const centerBefore = camera.screenToGrid({ x: 400, y: 300 });

    camera.setViewportSize({ width: 1200, height: 400 });

    const centerAfter = camera.screenToGrid({ x: 600, y: 200 });
    expect(centerAfter.x).toBeCloseTo(centerBefore.x, 6);
    expect(centerAfter.y).toBeCloseTo(centerBefore.y, 6);
    expect(camera.getViewportSize()).toEqual({ width: 1200, height: 400 });
  });

  it('maps grid coordinates back to screen pixels', () => {
    const camera = new Camera({ width: 800, height: 800 });
    camera.centerInfiniteViewport();

    expect(camera.gridToScreen({ x: 0, y: 0 })).toEqual({ x: 400, y: 400 });
    expect(camera.gridToScreen({ x: 1, y: 2 })).toEqual({ x: 416, y: 432 });
  });
});
