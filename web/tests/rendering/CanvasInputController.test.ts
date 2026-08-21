import { beforeEach, describe, expect, it } from 'vitest';
import { Camera, CanvasInputController } from '../../src/rendering';

interface PointerInit {
  pointerId?: number;
  clientX: number;
  clientY: number;
}

function dispatchPointer(target: HTMLElement, type: string, init: PointerInit): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    pointerId: init.pointerId ?? 1,
    clientX: init.clientX,
    clientY: init.clientY,
  });
  target.dispatchEvent(event);
}

function dispatchTouch(target: HTMLElement, type: string, points: { x: number; y: number }[]): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    touches: points.map((point) => ({ clientX: point.x, clientY: point.y })),
  });
  target.dispatchEvent(event);
}

function dispatchWheel(target: HTMLElement, deltaY: number, clientX: number, clientY: number): void {
  target.dispatchEvent(
    new WheelEvent('wheel', { deltaY, clientX, clientY, bubbles: true, cancelable: true }),
  );
}

describe('CanvasInputController', () => {
  let canvas: HTMLCanvasElement;
  let camera: Camera;
  let controller: CanvasInputController;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    camera = new Camera({ width: 800, height: 800 });
    camera.centerInfiniteViewport();
    controller = new CanvasInputController(canvas, camera);
  });

  it('zooms at the pointer position on wheel', () => {
    const cursor = { x: 200, y: 300 };
    const before = camera.screenToGrid(cursor);
    const cellSizeBefore = camera.getCellSize();

    dispatchWheel(canvas, -240, cursor.x, cursor.y);

    expect(camera.getCellSize()).toBeGreaterThan(cellSizeBefore);
    const after = camera.screenToGrid(cursor);
    expect(after.x).toBeCloseTo(before.x, 6);
    expect(after.y).toBeCloseTo(before.y, 6);

    dispatchWheel(canvas, 240, cursor.x, cursor.y);
    expect(camera.getCellSize()).toBeCloseTo(cellSizeBefore, 6);
  });

  it('pans the camera during a pointer drag', () => {
    const cellSize = camera.getCellSize();
    const before = camera.screenToGrid({ x: 0, y: 0 });

    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    dispatchPointer(canvas, 'pointermove', { clientX: 132, clientY: 84 });
    dispatchPointer(canvas, 'pointerup', { clientX: 132, clientY: 84 });
    dispatchPointer(canvas, 'pointermove', { clientX: 400, clientY: 400 });

    const after = camera.screenToGrid({ x: 0, y: 0 });
    expect(after.x).toBeCloseTo(before.x - 32 / cellSize, 6);
    expect(after.y).toBeCloseTo(before.y + 16 / cellSize, 6);
  });

  it('ignores a second simultaneous pointer during a drag', () => {
    const cellSize = camera.getCellSize();
    const before = camera.screenToGrid({ x: 0, y: 0 });

    dispatchPointer(canvas, 'pointerdown', { pointerId: 1, clientX: 0, clientY: 0 });
    dispatchPointer(canvas, 'pointerdown', { pointerId: 2, clientX: 500, clientY: 500 });
    dispatchPointer(canvas, 'pointermove', { pointerId: 2, clientX: 600, clientY: 600 });
    dispatchPointer(canvas, 'pointermove', { pointerId: 1, clientX: 16, clientY: 0 });

    const after = camera.screenToGrid({ x: 0, y: 0 });
    expect(after.x).toBeCloseTo(before.x - 16 / cellSize, 6);
    expect(after.y).toBeCloseTo(before.y, 6);
  });

  it('suppresses panning while pan is disabled', () => {
    const before = camera.screenToGrid({ x: 0, y: 0 });

    controller.setPanEnabled(false);
    expect(controller.isPanEnabled()).toBe(false);

    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    dispatchPointer(canvas, 'pointermove', { clientX: 300, clientY: 300 });
    dispatchPointer(canvas, 'pointerup', { clientX: 300, clientY: 300 });

    expect(camera.screenToGrid({ x: 0, y: 0 })).toEqual(before);

    controller.setPanEnabled(true);
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    dispatchPointer(canvas, 'pointermove', { clientX: 116, clientY: 100 });
    expect(camera.screenToGrid({ x: 0, y: 0 }).x).not.toBe(before.x);
  });

  it('cancels an active drag when pan is disabled mid gesture', () => {
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    controller.setPanEnabled(false);
    controller.setPanEnabled(true);
    const before = camera.screenToGrid({ x: 0, y: 0 });

    dispatchPointer(canvas, 'pointermove', { clientX: 300, clientY: 300 });

    expect(camera.screenToGrid({ x: 0, y: 0 })).toEqual(before);
  });

  it('zooms with a two finger pinch', () => {
    const cellSizeBefore = camera.getCellSize();

    dispatchTouch(canvas, 'touchstart', [
      { x: 300, y: 400 },
      { x: 500, y: 400 },
    ]);
    dispatchTouch(canvas, 'touchmove', [
      { x: 200, y: 400 },
      { x: 600, y: 400 },
    ]);

    expect(camera.getCellSize()).toBeCloseTo(cellSizeBefore * 2, 6);

    dispatchTouch(canvas, 'touchmove', [
      { x: 300, y: 400 },
      { x: 500, y: 400 },
    ]);
    expect(camera.getCellSize()).toBeCloseTo(cellSizeBefore, 6);
  });

  it('ignores touch gestures that are not two finger pinches', () => {
    const cellSizeBefore = camera.getCellSize();

    dispatchTouch(canvas, 'touchstart', [{ x: 300, y: 400 }]);
    dispatchTouch(canvas, 'touchmove', [{ x: 400, y: 400 }]);
    dispatchTouch(canvas, 'touchend', []);

    expect(camera.getCellSize()).toBe(cellSizeBefore);
  });

  it('stops tracking a pinch after the fingers are lifted', () => {
    dispatchTouch(canvas, 'touchstart', [
      { x: 300, y: 400 },
      { x: 500, y: 400 },
    ]);
    dispatchTouch(canvas, 'touchend', [{ x: 300, y: 400 }]);
    const cellSizeBefore = camera.getCellSize();

    dispatchTouch(canvas, 'touchmove', [
      { x: 200, y: 400 },
      { x: 600, y: 400 },
    ]);

    expect(camera.getCellSize()).toBe(cellSizeBefore);
  });

  it('stops reacting to events after destroy', () => {
    controller.destroy();
    const cellSizeBefore = camera.getCellSize();
    const originBefore = camera.screenToGrid({ x: 0, y: 0 });

    dispatchWheel(canvas, -240, 200, 300);
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    dispatchPointer(canvas, 'pointermove', { clientX: 300, clientY: 300 });
    dispatchTouch(canvas, 'touchstart', [
      { x: 300, y: 400 },
      { x: 500, y: 400 },
    ]);
    dispatchTouch(canvas, 'touchmove', [
      { x: 200, y: 400 },
      { x: 600, y: 400 },
    ]);

    expect(camera.getCellSize()).toBe(cellSizeBefore);
    expect(camera.screenToGrid({ x: 0, y: 0 })).toEqual(originBefore);
  });
});
