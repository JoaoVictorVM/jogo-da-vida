import type { GridDimensions } from '../engine';
import {
  DEFAULT_INFINITE_VIEWPORT_CELLS,
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
} from './types';
import type { GridBounds, GridPoint, ScreenPoint, ViewportSize } from './types';

function clampCellSize(cellSize: number): number {
  return Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, cellSize));
}

export class Camera {
  private originX = 0;
  private originY = 0;
  private cellSize = 16;
  private viewportWidth: number;
  private viewportHeight: number;

  constructor(viewport: ViewportSize) {
    this.viewportWidth = viewport.width;
    this.viewportHeight = viewport.height;
  }

  fitToFiniteGrid(dimensions: GridDimensions): void {
    const scale = Math.min(
      this.viewportWidth / dimensions.width,
      this.viewportHeight / dimensions.height,
    );
    this.cellSize = clampCellSize(scale);
    this.centerOn({ x: dimensions.width / 2, y: dimensions.height / 2 });
  }

  centerInfiniteViewport(cellCount: number = DEFAULT_INFINITE_VIEWPORT_CELLS): void {
    const scale = Math.min(this.viewportWidth / cellCount, this.viewportHeight / cellCount);
    this.cellSize = clampCellSize(scale);
    this.centerOn({ x: 0, y: 0 });
  }

  panBy(dxPx: number, dyPx: number): void {
    this.originX -= dxPx / this.cellSize;
    this.originY -= dyPx / this.cellSize;
  }

  zoomAt(screenPoint: ScreenPoint, factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      return;
    }

    const before = this.screenToGrid(screenPoint);
    this.cellSize = clampCellSize(this.cellSize * factor);
    this.originX = before.x - screenPoint.x / this.cellSize;
    this.originY = before.y - screenPoint.y / this.cellSize;
  }

  screenToGrid(point: ScreenPoint): GridPoint {
    return {
      x: this.originX + point.x / this.cellSize,
      y: this.originY + point.y / this.cellSize,
    };
  }

  gridToScreen(point: GridPoint): ScreenPoint {
    return {
      x: (point.x - this.originX) * this.cellSize,
      y: (point.y - this.originY) * this.cellSize,
    };
  }

  getCellSize(): number {
    return this.cellSize;
  }

  getViewportSize(): ViewportSize {
    return { width: this.viewportWidth, height: this.viewportHeight };
  }

  getVisibleGridBounds(): GridBounds {
    const topLeft = this.screenToGrid({ x: 0, y: 0 });
    const bottomRight = this.screenToGrid({ x: this.viewportWidth, y: this.viewportHeight });

    return {
      minX: Math.floor(topLeft.x),
      minY: Math.floor(topLeft.y),
      maxX: Math.ceil(bottomRight.x) - 1,
      maxY: Math.ceil(bottomRight.y) - 1,
    };
  }

  setViewportSize(viewport: ViewportSize): void {
    const center = this.screenToGrid({
      x: this.viewportWidth / 2,
      y: this.viewportHeight / 2,
    });

    this.viewportWidth = viewport.width;
    this.viewportHeight = viewport.height;
    this.centerOn(center);
  }

  private centerOn(gridPoint: GridPoint): void {
    this.originX = gridPoint.x - this.viewportWidth / 2 / this.cellSize;
    this.originY = gridPoint.y - this.viewportHeight / 2 / this.cellSize;
  }
}
