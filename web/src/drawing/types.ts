export interface DrawingControllerOptions {
  isDrawingAllowed?: () => boolean;
}

export type GridCoordinateKey = `${number},${number}`;
