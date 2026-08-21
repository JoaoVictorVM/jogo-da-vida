import { describe, expect, it } from 'vitest';
import { FiniteGridEngine, InfiniteGridEngine } from '../../src/engine';
import { Camera, CanvasRenderer, RenderSettings } from '../../src/rendering';
import { createSpyContext } from './helpers';

function setup(): {
  camera: Camera;
  settings: RenderSettings;
  ctx: ReturnType<typeof createSpyContext>;
  renderer: CanvasRenderer;
} {
  const camera = new Camera({ width: 800, height: 800 });
  camera.centerInfiniteViewport();
  const settings = new RenderSettings();
  const ctx = createSpyContext();
  const renderer = new CanvasRenderer(ctx, settings);

  return { camera, settings, ctx, renderer };
}

describe('CanvasRenderer', () => {
  it('fills the background before drawing the live cells', () => {
    const { camera, ctx, renderer } = setup();
    const engine = new InfiniteGridEngine();
    engine.setCell(0, 0, true);
    engine.setCell(2, -3, true);

    renderer.render(camera, engine);

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 800);
    expect(ctx.fillRect).toHaveBeenNthCalledWith(1, 0, 0, 800, 800);
    expect(ctx.fillStyleHistory[0]).toBe('#000000');
    expect(ctx.fillStyleHistory[1]).toBe('#ffffff');

    const cellSize = camera.getCellSize();
    for (const cell of [
      { x: 0, y: 0 },
      { x: 2, y: -3 },
    ]) {
      const point = camera.gridToScreen(cell);
      expect(ctx.fillRect).toHaveBeenCalledWith(point.x, point.y, cellSize, cellSize);
    }
    expect(ctx.fillRect).toHaveBeenCalledTimes(3);
  });

  it('uses the configured colors', () => {
    const { camera, settings, ctx, renderer } = setup();
    settings.setBackgroundColor('#101010');
    settings.setCellColor('#ff0000');
    const engine = new InfiniteGridEngine();
    engine.setCell(0, 0, true);

    renderer.render(camera, engine);

    expect(ctx.fillStyleHistory).toEqual(['#101010', '#ff0000']);
  });

  it('culls cells outside the visible viewport', () => {
    const { camera, ctx, renderer } = setup();
    const engine = new InfiniteGridEngine();
    engine.setCell(0, 0, true);
    engine.setCell(500, 500, true);
    engine.setCell(-500, -500, true);
    engine.setCell(0, 900, true);

    renderer.render(camera, engine);

    expect(ctx.fillRect).toHaveBeenCalledTimes(2);
    const origin = camera.gridToScreen({ x: 0, y: 0 });
    expect(ctx.fillRect).toHaveBeenNthCalledWith(2, origin.x, origin.y, camera.getCellSize(), camera.getCellSize());
  });

  it('renders only the background when no cell is alive', () => {
    const { camera, ctx, renderer } = setup();

    renderer.render(camera, new InfiniteGridEngine());

    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
  });

  it('draws grid lines when enabled and cells are at least 4px', () => {
    const { camera, ctx, renderer } = setup();

    renderer.render(camera, new InfiniteGridEngine());

    expect(camera.getCellSize()).toBeGreaterThanOrEqual(4);
    expect(ctx.beginPath).toHaveBeenCalledTimes(1);
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.lineWidth).toBe(1);
  });

  it('hides grid lines when cells are smaller than 4px', () => {
    const { camera, ctx, renderer } = setup();
    camera.centerInfiniteViewport(400);

    renderer.render(camera, new InfiniteGridEngine());

    expect(camera.getCellSize()).toBeLessThan(4);
    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(ctx.moveTo).not.toHaveBeenCalled();
  });

  it('hides grid lines when the toggle is off regardless of zoom', () => {
    const { camera, settings, ctx, renderer } = setup();
    settings.setGridLinesEnabled(false);

    renderer.render(camera, new InfiniteGridEngine());

    expect(camera.getCellSize()).toBeGreaterThanOrEqual(4);
    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(ctx.moveTo).not.toHaveBeenCalled();
  });

  it('reflects an engine tick on the next render', () => {
    const { camera, ctx, renderer } = setup();
    const engine = new FiniteGridEngine({ width: 20, height: 20 });
    camera.fitToFiniteGrid({ width: 20, height: 20 });
    for (const cell of [
      { x: 1, y: 0 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]) {
      engine.setCell(cell.x, cell.y, true);
    }

    engine.tick();
    renderer.render(camera, engine);

    const cellSize = camera.getCellSize();
    const drawnCells = ctx.fillRect.mock.calls.slice(1);
    expect(drawnCells).toHaveLength(5);
    for (const cell of [
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 3 },
    ]) {
      const point = camera.gridToScreen(cell);
      expect(ctx.fillRect).toHaveBeenCalledWith(point.x, point.y, cellSize, cellSize);
    }
  });
});
