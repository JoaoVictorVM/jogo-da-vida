import type { Camera } from './Camera';
import type { ScreenPoint } from './types';

const WHEEL_ZOOM_INTENSITY = 0.0015;

export class CanvasInputController {
  private panEnabled = true;
  private activePointerId: number | null = null;
  private lastPointerPosition: ScreenPoint | null = null;
  private activePinchDistance: number | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
  ) {
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  setPanEnabled(enabled: boolean): void {
    this.panEnabled = enabled;
    if (!enabled) {
      this.activePointerId = null;
      this.lastPointerPosition = null;
    }
  }

  isPanEnabled(): boolean {
    return this.panEnabled;
  }

  destroy(): void {
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.camera.zoomAt(this.toCanvasPoint(event.clientX, event.clientY), Math.exp(-event.deltaY * WHEEL_ZOOM_INTENSITY));
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.panEnabled || this.activePointerId !== null) {
      return;
    }
    this.activePointerId = event.pointerId;
    this.lastPointerPosition = { x: event.clientX, y: event.clientY };
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.panEnabled || event.pointerId !== this.activePointerId || this.lastPointerPosition === null) {
      return;
    }

    this.camera.panBy(
      event.clientX - this.lastPointerPosition.x,
      event.clientY - this.lastPointerPosition.y,
    );
    this.lastPointerPosition = { x: event.clientX, y: event.clientY };
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }
    this.activePointerId = null;
    this.lastPointerPosition = null;
  };

  private readonly handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length !== 2) {
      return;
    }
    event.preventDefault();
    this.activePinchDistance = this.touchDistance(event);
  };

  private readonly handleTouchMove = (event: TouchEvent): void => {
    if (event.touches.length !== 2 || this.activePinchDistance === null) {
      return;
    }
    event.preventDefault();

    const distance = this.touchDistance(event);
    if (distance === 0 || this.activePinchDistance === 0) {
      return;
    }

    this.camera.zoomAt(this.touchMidpoint(event), distance / this.activePinchDistance);
    this.activePinchDistance = distance;
  };

  private readonly handleTouchEnd = (event: TouchEvent): void => {
    if (event.touches.length < 2) {
      this.activePinchDistance = null;
    }
  };

  private touchDistance(event: TouchEvent): number {
    const [first, second] = [event.touches[0], event.touches[1]];
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  }

  private touchMidpoint(event: TouchEvent): ScreenPoint {
    const [first, second] = [event.touches[0], event.touches[1]];
    return this.toCanvasPoint(
      (first.clientX + second.clientX) / 2,
      (first.clientY + second.clientY) / 2,
    );
  }

  private toCanvasPoint(clientX: number, clientY: number): ScreenPoint {
    const rect = this.canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
}
