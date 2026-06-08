/**
 * Public types for the datepicker. Kept framework-agnostic so the headless
 * core and the adapter layer can be reused outside the default UI.
 */

/** Selection mode of the picker. */
export type DatepickerMode = 'single' | 'range';

/** A numeric day key in the form yyyymmdd (Gregorian), used for cheap, allocation-free comparisons. */
export type DayKey = number;

/**
 * A selected value. For `single` mode only `start` is used (`end` stays null).
 * For `range` mode both ends are populated once a range is completed.
 */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/** Where a day sits relative to the current selection — precomputed so templates never recompute it. */
export interface DayCell {
  /** Canonical Gregorian instant at local midnight. */
  date: Date;
  /** Numeric yyyymmdd key (Gregorian) for fast equality/range checks. */
  key: DayKey;
  /** Day-of-month label already localized to the active calendar (e.g. "۱۲" or "12"). */
  label: string;
  /** Day-of-month as a plain number in the active calendar. */
  dayOfMonth: number;
  /** Column index 0..6 within the active calendar's week. */
  weekday: number;
  /** True when the day belongs to the month currently shown (vs. leading/trailing padding). */
  inCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  /** Inside the committed range (exclusive of the ends). */
  isInRange: boolean;
  /** Inside the tentative range being previewed via hover (range mode, before the end is committed). */
  isPreview: boolean;
}

/** A fully built month, ready to render. */
export interface MonthView {
  /** First day (local midnight) of the displayed month. */
  monthStart: Date;
  /** Localized month + year heading, e.g. "شهریور ۱۴۰۲" or "August 2023". */
  label: string;
  /** Localized weekday short names in display order. */
  weekdays: readonly string[];
  /** 6×7 = 42 cells including leading/trailing padding for a stable grid height. */
  cells: DayCell[];
}

/** Predicate used to disable specific days. Receives the canonical Gregorian date. */
export type DateFilterFn = (date: Date) => boolean;
