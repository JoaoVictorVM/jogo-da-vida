import { describe, expect, it } from 'vitest';
import * as renderingModule from '../../src/rendering';
import {
  Camera,
  CanvasInputController,
  CanvasRenderer,
  GRID_LINES_MIN_CELL_SIZE,
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
  RenderSettings,
} from '../../src/rendering';
import { createSpyContext } from './helpers';

describe('rendering public entry point', () => {
  it('exports the documented runtime symbols', () => {
    expect(Object.keys(renderingModule).sort()).toEqual(
      [
        'Camera',
        'CanvasInputController',
        'CanvasRenderer',
        'DEFAULT_BACKGROUND_COLOR',
        'DEFAULT_CELL_COLOR',
        'DEFAULT_INFINITE_VIEWPORT_CELLS',
        'GRID_LINES_MIN_CELL_SIZE',
        'GRID_LINE_COLOR',
        'MAX_CELL_SIZE',
        'MIN_CELL_SIZE',
        'RenderSettings',
      ].sort(),
    );
  });

  it('exposes the documented zoom and grid line limits', () => {
    expect(MIN_CELL_SIZE).toBe(2);
    expect(MAX_CELL_SIZE).toBe(64);
    expect(GRID_LINES_MIN_CELL_SIZE).toBe(4);
  });

  it('exposes the viewport transform methods consumed by later features', () => {
    const camera = new Camera({ width: 800, height: 600 });
    for (const method of [
      'fitToFiniteGrid',
      'centerInfiniteViewport',
      'panBy',
      'zoomAt',
      'screenToGrid',
      'gridToScreen',
      'getCellSize',
      'getViewportSize',
      'getVisibleGridBounds',
      'setViewportSize',
    ] as const) {
      expect(typeof camera[method]).toBe('function');
    }
  });

  it('exposes the settings accessors consumed by later features', () => {
    const settings = new RenderSettings();
    for (const method of [
      'getBackgroundColor',
      'setBackgroundColor',
      'getCellColor',
      'setCellColor',
      'isGridLinesEnabled',
      'setGridLinesEnabled',
    ] as const) {
      expect(typeof settings[method]).toBe('function');
    }
  });

  it('exposes the renderer and input controller surface', () => {
    const canvas = document.createElement('canvas');
    const camera = new Camera({ width: 800, height: 600 });
    const controller = new CanvasInputController(canvas, camera);
    const renderer = new CanvasRenderer(createSpyContext(), new RenderSettings());

    expect(typeof renderer.render).toBe('function');
    expect(typeof controller.setPanEnabled).toBe('function');
    expect(typeof controller.destroy).toBe('function');

    controller.destroy();
  });
});
