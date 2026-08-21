import { vi } from 'vitest';
import type { CanvasRenderingContext2DLike } from '../../src/rendering';

export interface SpyContext extends CanvasRenderingContext2DLike {
  fillRect: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  fillStyleHistory: string[];
}

export function createSpyContext(): SpyContext {
  const fillStyleHistory: string[] = [];
  let fillStyle = '';

  const ctx: SpyContext = {
    get fillStyle(): string {
      return fillStyle;
    },
    set fillStyle(value: string) {
      fillStyle = value;
      fillStyleHistory.push(value);
    },
    strokeStyle: '',
    lineWidth: 0,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillStyleHistory,
  };

  return ctx;
}
