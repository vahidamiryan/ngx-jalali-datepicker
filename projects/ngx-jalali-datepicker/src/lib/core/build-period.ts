import { CalendarAdapter } from './calendar-adapter';
import { DateRange, PeriodCell, PeriodView } from './types';
import { atMidnight, dayKey } from './date-key.util';

/** Inputs that decorate a month/year grid with selection / current / disabled state. */
export interface PeriodContext {
  value: DateRange;
  today: Date;
  min: Date | null;
  max: Date | null;
}

/** Number of years shown on one page of the years grid. */
export const YEARS_PER_PAGE = 12;

/** Last day (local midnight) of the calendar month containing `monthStart`. */
function endOfMonth(adapter: CalendarAdapter, monthStart: Date): Date {
  const next = adapter.addCalendarMonths(monthStart, 1);
  const d = new Date(next.getTime());
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** True when [periodStart, periodEnd] lies entirely outside the [min, max] bounds. */
function periodDisabled(
  periodStart: Date,
  periodEnd: Date,
  min: Date | null,
  max: Date | null,
): boolean {
  if (min && dayKey(periodEnd) < dayKey(atMidnight(min))) return true;
  if (max && dayKey(periodStart) > dayKey(atMidnight(max))) return true;
  return false;
}

/**
 * Build the 12-month grid for the calendar year containing `dateInYear`. Each
 * cell is a whole month; every flag is resolved here once so the template reads
 * only booleans (mirrors {@link buildMonthView}).
 */
export function buildMonthsView(
  adapter: CalendarAdapter,
  dateInYear: Date,
  ctx: PeriodContext,
): PeriodView {
  const year = adapter.getYear(dateInYear);
  const names = adapter.getMonthNames();
  const todayYear = adapter.getYear(ctx.today);
  const todayMonth = adapter.getMonth(ctx.today);
  const startYM = ctx.value.start ? yearMonth(adapter, ctx.value.start) : null;
  const endYM = ctx.value.end ? yearMonth(adapter, ctx.value.end) : null;

  const cells: PeriodCell[] = new Array(12);
  for (let m = 1; m <= 12; m++) {
    const date = adapter.createDate(year, m, 1);
    const periodEnd = endOfMonth(adapter, date);
    const ym = year * 100 + m;
    cells[m - 1] = {
      date,
      key: ym,
      label: names[m - 1],
      isCurrent: year === todayYear && m === todayMonth,
      isSelected: ym === startYM || ym === endYM,
      isDisabled: periodDisabled(date, periodEnd, ctx.min, ctx.max),
    };
  }

  return { label: adapter.getYearLabel(dateInYear), cells };
}

/**
 * Build one page of the years grid around `dateInPage`. Pages are aligned to
 * {@link YEARS_PER_PAGE} boundaries so navigation lands on stable pages.
 */
export function buildYearsView(
  adapter: CalendarAdapter,
  dateInPage: Date,
  ctx: PeriodContext,
): PeriodView {
  const year = adapter.getYear(dateInPage);
  const pageStart = Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  const todayYear = adapter.getYear(ctx.today);
  const startYear = ctx.value.start ? adapter.getYear(ctx.value.start) : null;
  const endYear = ctx.value.end ? adapter.getYear(ctx.value.end) : null;

  const cells: PeriodCell[] = new Array(YEARS_PER_PAGE);
  for (let i = 0; i < YEARS_PER_PAGE; i++) {
    const y = pageStart + i;
    const date = adapter.createDate(y, 1, 1);
    const periodEnd = endOfMonth(adapter, adapter.createDate(y, 12, 1));
    cells[i] = {
      date,
      key: y,
      label: adapter.getYearLabel(date),
      isCurrent: y === todayYear,
      isSelected: y === startYear || y === endYear,
      isDisabled: periodDisabled(date, periodEnd, ctx.min, ctx.max),
    };
  }

  const last = pageStart + YEARS_PER_PAGE - 1;
  const label = `${adapter.getYearLabel(adapter.createDate(pageStart, 1, 1))} – ${adapter.getYearLabel(
    adapter.createDate(last, 1, 1),
  )}`;
  return { label, cells };
}

/** Compact `yyyymm` key in the active calendar. */
function yearMonth(adapter: CalendarAdapter, date: Date): number {
  return adapter.getYear(date) * 100 + adapter.getMonth(date);
}
