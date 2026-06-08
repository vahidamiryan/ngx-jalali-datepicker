import { DateRange, DatepickerMode } from './types';
import { dayKey, isSameDay } from './date-key.util';

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
