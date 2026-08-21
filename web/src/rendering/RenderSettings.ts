export const DEFAULT_BACKGROUND_COLOR = '#000000';
export const DEFAULT_CELL_COLOR = '#ffffff';

export class RenderSettings {
  private backgroundColor = DEFAULT_BACKGROUND_COLOR;
  private cellColor = DEFAULT_CELL_COLOR;
  private gridLinesEnabled = true;

  getBackgroundColor(): string {
    return this.backgroundColor;
  }

  setBackgroundColor(color: string): void {
    this.backgroundColor = color;
  }

  getCellColor(): string {
    return this.cellColor;
  }

  setCellColor(color: string): void {
    this.cellColor = color;
  }

  isGridLinesEnabled(): boolean {
    return this.gridLinesEnabled;
  }

  setGridLinesEnabled(enabled: boolean): void {
    this.gridLinesEnabled = enabled;
  }
}
