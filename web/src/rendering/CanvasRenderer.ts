import type { GridEngine } from '../engine';
import type { Camera } from './Camera';
import type { RenderSettings } from './RenderSettings';
import { GRID_LINES_MIN_CELL_SIZE, GRID_LINE_COLOR } from './types';
import type { CanvasRenderingContext2DLike } from './types';

// Meio pixel de deslocamento alinha a linha de 1px ao centro do pixel, evitando o borrão do antialiasing.
const LINE_ALIGNMENT_OFFSET = 0.5;

export class CanvasRenderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2DLike,
    private readonly settings: RenderSettings,
  ) {}

  render(camera: Camera, engine: GridEngine): void {
    const { width, height } = camera.getViewportSize();
    const cellSize = camera.getCellSize();
    const bounds = camera.getVisibleGridBounds();

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = this.settings.getBackgroundColor();
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = this.settings.getCellColor();
    for (const cell of engine.getLiveCells()) {
      if (cell.x < bounds.minX || cell.x > bounds.maxX || cell.y < bounds.minY || cell.y > bounds.maxY) {
        continue;
      }
      const screenPoint = camera.gridToScreen(cell);
      this.ctx.fillRect(screenPoint.x, screenPoint.y, cellSize, cellSize);
    }

    if (this.settings.isGridLinesEnabled() && cellSize >= GRID_LINES_MIN_CELL_SIZE) {
      this.drawGridLines(camera);
    }
  }

  private drawGridLines(camera: Camera): void {
    const { width, height } = camera.getViewportSize();
    const bounds = camera.getVisibleGridBounds();

    this.ctx.strokeStyle = GRID_LINE_COLOR;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    for (let x = bounds.minX; x <= bounds.maxX + 1; x += 1) {
      const screenX = Math.round(camera.gridToScreen({ x, y: 0 }).x) + LINE_ALIGNMENT_OFFSET;
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, height);
    }

    for (let y = bounds.minY; y <= bounds.maxY + 1; y += 1) {
      const screenY = Math.round(camera.gridToScreen({ x: 0, y }).y) + LINE_ALIGNMENT_OFFSET;
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(width, screenY);
    }

    this.ctx.stroke();
  }
}
