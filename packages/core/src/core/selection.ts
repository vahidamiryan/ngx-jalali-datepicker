import { DateFilterFn, DateRange, DatepickerMode } from './types';
import { atMidnight, dayKey, isSameDay } from './date-key.util';

/** Shared validation for typed and keyboard date selection. */
export function isDateSelectable(
  date: Date,
  min: Date | null,
  max: Date | null,
  filter: DateFilterFn | null,
): boolean {
  const key = dayKey(date);
  return Number.isFinite(key) &&
    (!min || key >= dayKey(min)) &&
    (!max || key <= dayKey(max)) &&
    (!filter || filter(date));
}

/** First selectable day in a visible window, with an exclusive end. */
export function firstSelectableDate(
  start: Date,
  end: Date,
  min: Date | null,
  max: Date | null,
  filter: DateFilterFn | null,
): Date | null {
  const date = atMidnight(min && dayKey(min) > dayKey(start) ? min : start);
  const endKey = dayKey(end);
  const maxKey = max ? dayKey(max) : Infinity;
  for (let key = dayKey(date); key < endKey && key <= maxKey; key = dayKey(date)) {
    if (!filter || filter(new Date(date))) return date;
    date.setDate(date.getDate() + 1);
  }
  return null;
}

/**
 * Pure selection reducer. Given the current selection and a newly clicked date,
 * returns the next selection. Framework-agnostic and side-effect free so it can
 * power a custom headless UI or be unit-tested in isolation.
 */
export function applySelection(mode: DatepickerMode, current: DateRange, date: Date): DateRange {
  if (mode === 'single') {
    return { start: date, end: null };
  }

  // range mode
  if (current.end && !current.start) {
    const end = current.end!;
    return dayKey(date) > dayKey(end)
      ? { start: end, end: date }
      : { start: date, end };
  }

  const hasOpenStart = current.start && !current.end;
  if (!hasOpenStart) {
    // No range in progress (nothing selected, or a complete range) → begin a new one.
    return { start: date, end: null };
  }

  // A start exists and we're choosing the end — order the two ends regardless of click order.
  const start = current.start!;
  return dayKey(date) < dayKey(start)
    ? { start: date, end: start }
    : { start, end: date };
}

/** Structural equality for two ranges, compared by calendar day. */
export function rangeEquals(a: DateRange, b: DateRange): boolean {
  return isSameDay(a.start, b.start) && isSameDay(a.end, b.end);
}

/** True once a selection is complete for the given mode (single: start; range: both ends). */
export function isSelectionComplete(mode: DatepickerMode, value: DateRange): boolean {
  return mode === 'single' ? !!value.start : !!value.start && !!value.end;
}
