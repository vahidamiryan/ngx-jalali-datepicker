import { describe, it, expect } from 'vitest';

import { NDP_EN_LABELS, NDP_FA_LABELS, defaultLabelsFor, resolveLabels } from './labels';

describe('labels', () => {
  it('defaults to English for Gregorian and Persian for the others', () => {
    expect(defaultLabelsFor('gregorian')).toBe(NDP_EN_LABELS);
    expect(defaultLabelsFor('jalali')).toBe(NDP_FA_LABELS);
    expect(defaultLabelsFor('hijri')).toBe(NDP_FA_LABELS);
  });

  it('merges a partial override without dropping the rest', () => {
    const t = resolveLabels({ today: 'Jump' }, NDP_EN_LABELS);
    expect(t.today).toBe('Jump');
    expect(t.clear).toBe(NDP_EN_LABELS.clear);
  });

  it('deep-merges calendars so a partial map keeps the other names', () => {
    const t = resolveLabels({ calendars: { jalali: 'Shamsi' } }, NDP_EN_LABELS);
    expect(t.calendars.jalali).toBe('Shamsi');
    expect(t.calendars.gregorian).toBe('Gregorian');
  });

  it('has no name for an unregistered calendar id, so callers must fall back', () => {
    // A custom adapter's id is absent from the map; the toggle button falls
    // back to the id itself rather than rendering "undefined".
    expect(NDP_EN_LABELS.calendars['ethiopic']).toBeUndefined();
  });
});
