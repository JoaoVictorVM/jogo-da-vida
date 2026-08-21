import { describe, expect, it } from 'vitest';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_CELL_COLOR, RenderSettings } from '../../src/rendering';

describe('RenderSettings', () => {
  it('defaults to a black background, white cells and visible grid lines', () => {
    const settings = new RenderSettings();

    expect(settings.getBackgroundColor()).toBe('#000000');
    expect(settings.getCellColor()).toBe('#ffffff');
    expect(settings.isGridLinesEnabled()).toBe(true);
    expect(DEFAULT_BACKGROUND_COLOR).toBe('#000000');
    expect(DEFAULT_CELL_COLOR).toBe('#ffffff');
  });

  it('reads back every value that was set', () => {
    const settings = new RenderSettings();

    settings.setBackgroundColor('#123456');
    settings.setCellColor('rgb(1, 2, 3)');
    settings.setGridLinesEnabled(false);

    expect(settings.getBackgroundColor()).toBe('#123456');
    expect(settings.getCellColor()).toBe('rgb(1, 2, 3)');
    expect(settings.isGridLinesEnabled()).toBe(false);

    settings.setGridLinesEnabled(true);
    expect(settings.isGridLinesEnabled()).toBe(true);
  });
});
