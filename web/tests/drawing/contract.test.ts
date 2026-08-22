import { describe, expect, it } from 'vitest';
import * as drawingModule from '../../src/drawing';
import { DrawingController } from '../../src/drawing';
import { FiniteGridEngine } from '../../src/engine';
import { Camera, CanvasInputController } from '../../src/rendering';

describe('drawing public entry point', () => {
  it('exports the documented runtime symbols', () => {
    expect(Object.keys(drawingModule)).toEqual(['DrawingController']);
  });

  it('exposes the documented instance surface', () => {
    const canvas = document.createElement('canvas');
    const camera = new Camera({ width: 400, height: 400 });
    const engine = new FiniteGridEngine({ width: 10, height: 10 });
    const controller = new DrawingController(
      canvas,
      camera,
      engine,
      new CanvasInputController(canvas, camera),
    );

    expect(typeof controller.isStrokeActive).toBe('function');
    expect(typeof controller.destroy).toBe('function');

    controller.destroy();
  });
});
