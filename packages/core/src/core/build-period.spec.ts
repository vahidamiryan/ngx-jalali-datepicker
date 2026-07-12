import { GregorianCalendarAdapter } from '../adapters/gregorian.adapter';
import { JalaliCalendarAdapter } from '../adapters/jalali.adapter';
import { buildMonthsView, buildYearsView, YEARS_PER_PAGE } from './build-period';
import { DateRange } from './types';

const NO_SELECTION: DateRange = { start: null, end: null };

describe('buildMonthsView', () => {
  const adapter = new GregorianCalendarAdapter('en-US');
  const today = new Date(2026, 5, 15); // 15 Jun 2026

  it('builds twelve month cells for the year of the given date', () => {
    const view = buildMonthsView(adapter, new Date(2026, 2, 10), {
      value: NO_SELECTION,
      today,
      min: null,
      max: null,
    });

    expect(view.cells.length).toBe(12);
    expect(view.cells[0].label).toBe('January');
    expect(view.cells[11].label).toBe('December');
    // Every cell's canonical date is the first of its month in 2026.
    expect(view.cells[5].date.getFullYear()).toBe(2026);
    expect(view.cells[5].date.getMonth()).toBe(5);
    expect(view.cells[5].date.getDate()).toBe(1);
  });

  it('flags the current month and the selected month', () => {
    const view = buildMonthsView(adapter, today, {
      value: { start: new Date(2026, 8, 20), end: null }, // September
      today,
      min: null,
      max: null,
    });

    expect(view.cells[5].isCurrent).toBeTrue(); // June
    expect(view.cells[8].isSelected).toBeTrue(); // September
    expect(view.cells[8].isCurrent).toBeFalse();
  });

  it('disables months that fall entirely outside [min, max]', () => {
    const view = buildMonthsView(adapter, today, {
      value: NO_SELECTION,
      today,
      min: new Date(2026, 3, 10), // April
      max: new Date(2026, 7, 25), // August
    });

    expect(view.cells[2].isDisabled).toBeTrue(); // March — before min
    expect(view.cells[3].isDisabled).toBeFalse(); // April — partially in range
    expect(view.cells[7].isDisabled).toBeFalse(); // August — partially in range
    expect(view.cells[8].isDisabled).toBeTrue(); // September — after max
  });
});

describe('buildYearsView', () => {
  const adapter = new GregorianCalendarAdapter('en-US');
  const today = new Date(2026, 5, 15);

  it('builds an aligned page of years containing the given year', () => {
    const view = buildYearsView(adapter, new Date(2026, 0, 1), {
      value: NO_SELECTION,
      today,
      min: null,
      max: null,
    });

    expect(view.cells.length).toBe(YEARS_PER_PAGE);
    const first = Number(view.cells[0].key);
    expect(first % YEARS_PER_PAGE).toBe(0); // page is aligned to the boundary
    expect(view.cells.some(c => c.key === 2026)).toBeTrue();
    expect(view.cells.find(c => c.key === 2026)!.isCurrent).toBeTrue();
  });
});

describe('buildMonthsView (Jalali)', () => {
  const adapter = new JalaliCalendarAdapter();

  it('uses localized Jalali month names', () => {
    const farvardin1 = adapter.createDate(1404, 1, 1);
    const view = buildMonthsView(adapter, farvardin1, {
      value: NO_SELECTION,
      today: farvardin1,
      min: null,
      max: null,
    });

    expect(view.cells[0].label).toBe('فروردین');
    expect(view.cells[11].label).toBe('اسفند');
    expect(view.cells[0].isCurrent).toBeTrue();
  });
});
