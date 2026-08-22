import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FiniteGridEngine } from '../../src/engine';
import { DrawingController } from '../../src/drawing';
import { Camera, CanvasInputController } from '../../src/rendering';
import { dispatchPointer } from './helpers';

const CELL_SIZE = 10;

let canvas: HTMLCanvasElement;
let camera: Camera;
let engine: FiniteGridEngine;
let inputController: CanvasInputController;

function cellCenter(x: number, y: number): { clientX: number; clientY: number } {
  const point = camera.gridToScreen({ x: x + 0.5, y: y + 0.5 });
  return { clientX: point.x, clientY: point.y };
}

function liveCells(): string[] {
  return engine
    .getLiveCells()
    .map((cell) => `${cell.x},${cell.y}`)
    .sort();
}

function createController(options?: { isDrawingAllowed?: () => boolean }): DrawingController {
  return new DrawingController(canvas, camera, engine, inputController, options);
}

beforeEach(() => {
  document.body.innerHTML = '';
  canvas = document.createElement('canvas');
  document.body.appendChild(canvas);

  engine = new FiniteGridEngine({ width: 40, height: 40 });
  camera = new Camera({ width: 400, height: 400 });
  camera.fitToFiniteGrid({ width: 40, height: 40 });
  inputController = new CanvasInputController(canvas, camera);
});

describe('DrawingController', () => {
  it('uses a ten pixel cell for the test viewport', () => {
    expect(camera.getCellSize()).toBe(CELL_SIZE);
  });

  it('toggles the cell under the pointer on pointer down', () => {
    createController();

    dispatchPointer(canvas, 'pointerdown', cellCenter(3, 4));

    expect(engine.isAlive(3, 4)).toBe(true);
    expect(engine.getLiveCells()).toHaveLength(1);
  });

  it('turns a live cell off on pointer down', () => {
    engine.setCell(3, 4, true);
    createController();

    dispatchPointer(canvas, 'pointerdown', cellCenter(3, 4));

    expect(engine.isAlive(3, 4)).toBe(false);
  });

  it('toggles each cell along the drag path exactly once', () => {
    createController();

    dispatchPointer(canvas, 'pointerdown', cellCenter(0, 0));
    dispatchPointer(canvas, 'pointermove', cellCenter(1, 0));
    dispatchPointer(canvas, 'pointermove', cellCenter(2, 0));
    dispatchPointer(canvas, 'pointermove', cellCenter(1, 0));
    dispatchPointer(canvas, 'pointermove', cellCenter(0, 0));
    dispatchPointer(canvas, 'pointerup', cellCenter(0, 0));

    expect(liveCells()).toEqual(['0,0', '1,0', '2,0']);
  });

  it('does not re-toggle within the same stroke when the pointer stays in one cell', () => {
    createController();

    dispatchPointer(canvas, 'pointerdown', { clientX: 2, clientY: 2 });
    dispatchPointer(canvas, 'pointermove', { clientX: 5, clientY: 5 });
    dispatchPointer(canvas, 'pointermove', { clientX: 8, clientY: 8 });

    expect(liveCells()).toEqual(['0,0']);
  });

  it('interpolates the gap between fast pointer move samples', () => {
    createController();

    dispatchPointer(canvas, 'pointerdown', cellCenter(0, 0));
    dispatchPointer(canvas, 'pointermove', cellCenter(5, 0));
    dispatchPointer(canvas, 'pointermove', cellCenter(5, 3));

    expect(liveCells()).toEqual(
      ['0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '5,1', '5,2', '5,3'].sort(),
    );
  });

  it('interpolates diagonal jumps', () => {
    createController();

    dispatchPointer(canvas, 'pointerdown', cellCenter(0, 0));
    dispatchPointer(canvas, 'pointermove', cellCenter(3, 3));

    expect(liveCells()).toEqual(['0,0', '1,1', '2,2', '3,3']);
  });

  it('starts a new stroke able to toggle the same cells again', () => {
    createController();

    dispatchPointer(canvas, 'pointerdown', cellCenter(2, 2));
    dispatchPointer(canvas, 'pointerup', cellCenter(2, 2));
    expect(engine.isAlive(2, 2)).toBe(true);

    dispatchPointer(canvas, 'pointerdown', cellCenter(2, 2));
    expect(engine.isAlive(2, 2)).toBe(false);
  });

  it('toggles cells identically for touch and mouse drags', () => {
    createController();
    dispatchPointer(canvas, 'pointerdown', { ...cellCenter(1, 1), pointerType: 'mouse' });
    dispatchPointer(canvas, 'pointermove', { ...cellCenter(3, 1), pointerType: 'mouse' });
    dispatchPointer(canvas, 'pointerup', { ...cellCenter(3, 1), pointerType: 'mouse' });
    const fromMouse = liveCells();

    engine.clear();

    dispatchPointer(canvas, 'pointerdown', { ...cellCenter(1, 1), pointerType: 'touch' });
    dispatchPointer(canvas, 'pointermove', { ...cellCenter(3, 1), pointerType: 'touch' });
    dispatchPointer(canvas, 'pointerup', { ...cellCenter(3, 1), pointerType: 'touch' });

    expect(liveCells()).toEqual(fromMouse);
    expect(fromMouse).toEqual(['1,1', '2,1', '3,1']);
  });

  it('ignores a second simultaneous pointer during an active stroke', () => {
    createController();

    dispatchPointer(canvas, 'pointerdown', { ...cellCenter(0, 0), pointerId: 1 });
    dispatchPointer(canvas, 'pointerdown', { ...cellCenter(9, 9), pointerId: 2 });
    dispatchPointer(canvas, 'pointermove', { ...cellCenter(9, 9), pointerId: 2 });
    dispatchPointer(canvas, 'pointerup', { ...cellCenter(9, 9), pointerId: 2 });
    dispatchPointer(canvas, 'pointermove', { ...cellCenter(1, 0), pointerId: 1 });

    expect(liveCells()).toEqual(['0,0', '1,0']);
    expect(createController().isStrokeActive()).toBe(false);
  });

  it('reports whether a stroke is in progress', () => {
    const controller = createController();
    expect(controller.isStrokeActive()).toBe(false);

    dispatchPointer(canvas, 'pointerdown', cellCenter(1, 1));
    expect(controller.isStrokeActive()).toBe(true);

    dispatchPointer(canvas, 'pointerup', cellCenter(1, 1));
    expect(controller.isStrokeActive()).toBe(false);
  });

  it('ends the stroke on pointer cancel', () => {
    const controller = createController();

    dispatchPointer(canvas, 'pointerdown', cellCenter(1, 1));
    dispatchPointer(canvas, 'pointercancel', cellCenter(1, 1));

    expect(controller.isStrokeActive()).toBe(false);
    expect(inputController.isPanEnabled()).toBe(true);
  });
});

describe('DrawingController and panning', () => {
  it('suppresses panning for the duration of the stroke', () => {
    createController();
    const boundsBefore = camera.getVisibleGridBounds();

    dispatchPointer(canvas, 'pointerdown', cellCenter(1, 1));
    expect(inputController.isPanEnabled()).toBe(false);

    dispatchPointer(canvas, 'pointermove', cellCenter(6, 1));
    expect(camera.getVisibleGridBounds()).toEqual(boundsBefore);

    dispatchPointer(canvas, 'pointerup', cellCenter(6, 1));
    expect(inputController.isPanEnabled()).toBe(true);
    expect(camera.getVisibleGridBounds()).toEqual(boundsBefore);
  });

  it('restores panning after the stroke when drawing is disabled again', () => {
    let allowed = true;
    createController({ isDrawingAllowed: () => allowed });

    dispatchPointer(canvas, 'pointerdown', cellCenter(1, 1));
    dispatchPointer(canvas, 'pointerup', cellCenter(1, 1));

    allowed = false;
    const boundsBefore = camera.getVisibleGridBounds();

    dispatchPointer(canvas, 'pointerdown', cellCenter(1, 1));
    dispatchPointer(canvas, 'pointermove', cellCenter(6, 1));

    expect(inputController.isPanEnabled()).toBe(true);
    expect(camera.getVisibleGridBounds()).not.toEqual(boundsBefore);
  });

  it('does nothing and leaves panning enabled while drawing is not allowed', () => {
    createController({ isDrawingAllowed: () => false });
    const boundsBefore = camera.getVisibleGridBounds();

    dispatchPointer(canvas, 'pointerdown', cellCenter(2, 2));
    expect(inputController.isPanEnabled()).toBe(true);

    dispatchPointer(canvas, 'pointermove', cellCenter(7, 2));
    dispatchPointer(canvas, 'pointerup', cellCenter(7, 2));

    expect(engine.hasLiveCells()).toBe(false);
    expect(camera.getVisibleGridBounds()).not.toEqual(boundsBefore);
  });

  it('re-reads the drawing predicate on every stroke', () => {
    let allowed = false;
    const isDrawingAllowed = vi.fn(() => allowed);
    createController({ isDrawingAllowed });

    dispatchPointer(canvas, 'pointerdown', cellCenter(2, 2));
    dispatchPointer(canvas, 'pointerup', cellCenter(2, 2));
    expect(engine.hasLiveCells()).toBe(false);

    allowed = true;
    dispatchPointer(canvas, 'pointerdown', cellCenter(2, 2));
    dispatchPointer(canvas, 'pointerup', cellCenter(2, 2));

    expect(engine.isAlive(2, 2)).toBe(true);
    expect(isDrawingAllowed).toHaveBeenCalledTimes(2);
  });

  it('stops responding and restores panning after destroy', () => {
    const controller = createController();

    dispatchPointer(canvas, 'pointerdown', cellCenter(1, 1));
    controller.destroy();

    expect(controller.isStrokeActive()).toBe(false);
    expect(inputController.isPanEnabled()).toBe(true);

    const cellsBefore = liveCells();
    dispatchPointer(canvas, 'pointerdown', cellCenter(5, 5));
    dispatchPointer(canvas, 'pointermove', cellCenter(6, 5));
    dispatchPointer(canvas, 'pointerup', cellCenter(6, 5));

    expect(liveCells()).toEqual(cellsBefore);
  });
});
