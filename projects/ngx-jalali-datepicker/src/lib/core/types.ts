/**
 * Public types for the datepicker. Kept framework-agnostic so the headless
 * core and the adapter layer can be reused outside the default UI.
 */

/**
 * Selection mode of the picker.
 * - `single` / `range`: pick a day (or a day range). Month/year grids act only as
 *   quick navigation; the committed value is always a day.
 * - `month` / `year`: pick a whole month or year. The committed `value.start` is the
 *   first day (local midnight) of the chosen month/year; `end` stays null.
 */
export type DatepickerMode = 'single' | 'range' | 'month' | 'year';

/** Which grid the picker body is currently showing. */
export type CalendarView = 'day' | 'month' | 'year';

/** Built-in theme. `'auto'` follows the OS `prefers-color-scheme` media query. */
export type NdpTheme = 'light' | 'dark' | 'auto';

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

/**
 * A selectable period (a whole month or a whole year) in the month/year picker
 * grids. Like {@link DayCell}, every flag is precomputed so templates read only
 * booleans. The `date` is the canonical Gregorian midnight at the start of the
 * period (first day of the month / first day of the year).
 */
export interface PeriodCell {
  /** Canonical Gregorian instant at the start of the period (local midnight). */
  date: Date;
  /** Numeric key for fast equality — `yyyymm` for months, `yyyy` for years (active calendar). */
  key: number;
  /** Localized label — month name (e.g. "شهریور" / "August") or year (e.g. "۱۴۰۲" / "2023"). */
  label: string;
  /** True when today falls inside this period. */
  isCurrent: boolean;
  /** True when the current selection's start falls inside this period. */
  isSelected: boolean;
  /** True when the whole period lies outside [min, max]. */
  isDisabled: boolean;
}

/** A fully built grid of {@link PeriodCell}s, ready to render. */
export interface PeriodView {
  /** Heading for the grid — the year for a months grid, the year span for a years grid. */
  label: string;
  /** The period cells in display order (12 months, or one page of years). */
  cells: PeriodCell[];
}
