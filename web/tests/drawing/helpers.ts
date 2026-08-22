export interface PointerInit {
  pointerId?: number;
  pointerType?: string;
  clientX: number;
  clientY: number;
}

export function dispatchPointer(target: HTMLElement, type: string, init: PointerInit): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    pointerId: init.pointerId ?? 1,
    pointerType: init.pointerType ?? 'mouse',
    clientX: init.clientX,
    clientY: init.clientY,
  });
  target.dispatchEvent(event);
}
