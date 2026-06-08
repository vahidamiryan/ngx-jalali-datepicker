import { CalendarAdapter } from './calendar-adapter';
import { DateFilterFn, DateRange, DayCell, DatepickerMode, MonthView } from './types';
import { atMidnight, dayKey } from './date-key.util';

/** Inputs that decorate a month grid with selection / disabled / preview state. */
export interface MonthContext {
  mode: DatepickerMode;
  value: DateRange;
  /** Hovered date used to preview a range before its end is committed. */
  hovered: Date | null;
  today: Date;
  min: Date | null;
  max: Date | null;
  /** Returns `true` when a date is *selectable*. Absent ⇒ everything selectable. */
  dateFilter: DateFilterFn | null;
}

/** Number of cells in the grid — always six weeks so the height never jumps. */
const GRID_CELLS = 42;

/** Add `delta` whole days to a date. Day length is calendar-independent. */
function addDays(date: Date, delta: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + delta);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Build a complete, render-ready {@link MonthView}. All per-day state (selected,
 * in-range, disabled, preview, …) is resolved here exactly once — the template
 * only reads booleans, so change detection never recomputes date comparisons.
 */
export function buildMonthView(
  adapter: CalendarAdapter,
  monthStartInput: Date,
  ctx: MonthContext,
): MonthView {
  const monthStart = adapter.startOfMonth(monthStartInput);
  const leadingPad = adapter.getWeekdayIndex(monthStart);
  const daysInMonth = adapter.getDaysInMonth(monthStart);

  const startKey = ctx.value.start ? dayKey(ctx.value.start) : null;
  const endKey = ctx.value.end ? dayKey(ctx.value.end) : null;
  const todayKey = dayKey(ctx.today);
  const minKey = ctx.min ? dayKey(atMidnight(ctx.min)) : null;
  const maxKey = ctx.max ? dayKey(atMidnight(ctx.max)) : null;

  // Resolve the tentative preview band (range mode, start chosen, end pending).
  let previewLo: number | null = null;
  let previewHi: number | null = null;
  if (ctx.mode === 'range' && ctx.value.start && !ctx.value.end && ctx.hovered) {
    const a = dayKey(ctx.value.start);
    const b = dayKey(ctx.hovered);
    previewLo = Math.min(a, b);
    previewHi = Math.max(a, b);
  }

  const cells: DayCell[] = new Array(GRID_CELLS);
  for (let i = 0; i < GRID_CELLS; i++) {
    const offset = i - leadingPad;
    const date = addDays(monthStart, offset);
    const key = dayKey(date);
    const inCurrentMonth = offset >= 0 && offset < daysInMonth;

    const disabled =
      (minKey !== null && key < minKey) ||
      (maxKey !== null && key > maxKey) ||
      (ctx.dateFilter !== null && !ctx.dateFilter(date));

    // Padding days from adjacent months carry no visual state: the neighbouring
    // month is rendered in full elsewhere, so highlighting them here would show
    // the same day selected twice and read as ambiguous.
    const isStart = inCurrentMonth && startKey !== null && key === startKey;
    const isEnd = inCurrentMonth && endKey !== null && key === endKey;
    // Only a *committed* range (both ends present) flattens an endpoint's inner
    // corner. A lone selection — single mode, or a range start awaiting its end —
    // stays fully rounded so it never reads as a half-finished range.
    const hasRange = startKey !== null && endKey !== null;

    cells[i] = {
      date,
      key,
      label: adapter.getDayLabel(date),
      dayOfMonth: adapter.getDayOfMonth(date),
      weekday: i % 7,
      inCurrentMonth,
      isToday: inCurrentMonth && key === todayKey,
      isWeekend: inCurrentMonth && adapter.isWeekend(date),
      isDisabled: disabled,
      isSelected: isStart || isEnd,
      isRangeStart: hasRange && isStart,
      isRangeEnd: hasRange && isEnd,
      isInRange:
        inCurrentMonth && startKey !== null && endKey !== null && key > startKey && key < endKey,
      isPreview: inCurrentMonth && previewLo !== null && key >= previewLo && key <= previewHi!,
    };
  }

  return {
    monthStart,
    label: adapter.getMonthLabel(monthStart),
    weekdays: adapter.getWeekdayLabels(),
    cells,
  };
}
