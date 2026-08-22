import type { GridEngine } from '../engine';
import type { Camera, CanvasInputController, ScreenPoint } from '../rendering';
import type { DrawingControllerOptions, GridCoordinateKey } from './types';

interface GridCell {
  x: number;
  y: number;
}

function cellKey(x: number, y: number): GridCoordinateKey {
  return `${x},${y}`;
}

export class DrawingController {
  private readonly isDrawingAllowed: () => boolean;
  private readonly toggledCells = new Set<string>();

  private strokeActive = false;
  private activePointerId: number | null = null;
  private lastGridCell: GridCell | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    private readonly engine: GridEngine,
    private readonly inputController: CanvasInputController,
    options: DrawingControllerOptions = {},
  ) {
    this.isDrawingAllowed = options.isDrawingAllowed ?? ((): boolean => true);

    this.canvas.addEventListener('pointerdown', this.handlePointerDown, { capture: true });
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
  }

  isStrokeActive(): boolean {
    return this.strokeActive;
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown, { capture: true });
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);

    if (this.strokeActive) {
      this.endStroke();
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.strokeActive || !this.isDrawingAllowed()) {
      return;
    }

    this.strokeActive = true;
    this.activePointerId = event.pointerId;
    this.toggledCells.clear();
    this.inputController.setPanEnabled(false);

    const cell = this.toGridCell(event);
    this.toggleCell(cell);
    this.lastGridCell = cell;
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.strokeActive || event.pointerId !== this.activePointerId || this.lastGridCell === null) {
      return;
    }

    const cell = this.toGridCell(event);
    for (const stepCell of this.pathBetween(this.lastGridCell, cell)) {
      this.toggleCell(stepCell);
    }
    this.lastGridCell = cell;
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }
    this.endStroke();
  };

  private endStroke(): void {
    this.strokeActive = false;
    this.activePointerId = null;
    this.lastGridCell = null;
    this.toggledCells.clear();
    this.inputController.setPanEnabled(true);
  }

  private toggleCell(cell: GridCell): void {
    const key = cellKey(cell.x, cell.y);
    if (this.toggledCells.has(key)) {
      return;
    }

    this.toggledCells.add(key);
    this.engine.setCell(cell.x, cell.y, !this.engine.isAlive(cell.x, cell.y));
  }

  private toGridCell(event: PointerEvent): GridCell {
    const rect = this.canvas.getBoundingClientRect();
    const screenPoint: ScreenPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const gridPoint = this.camera.screenToGrid(screenPoint);

    return { x: Math.floor(gridPoint.x), y: Math.floor(gridPoint.y) };
  }

  // Percorre a reta entre duas amostras de ponteiro para que arrastos rápidos não pulem células.
  private pathBetween(from: GridCell, to: GridCell): GridCell[] {
    const path: GridCell[] = [];
    const deltaX = Math.abs(to.x - from.x);
    const deltaY = Math.abs(to.y - from.y);
    const stepX = from.x < to.x ? 1 : -1;
    const stepY = from.y < to.y ? 1 : -1;

    let x = from.x;
    let y = from.y;
    let error = deltaX - deltaY;

    while (x !== to.x || y !== to.y) {
      const doubledError = error * 2;
      if (doubledError > -deltaY) {
        error -= deltaY;
        x += stepX;
      }
      if (doubledError < deltaX) {
        error += deltaX;
        y += stepY;
      }
      path.push({ x, y });
    }

    return path;
  }
}
