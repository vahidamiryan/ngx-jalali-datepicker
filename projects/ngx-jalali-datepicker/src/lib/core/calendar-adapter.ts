import { InjectionToken } from '@angular/core';

/**
 * Strategy that teaches the picker how to read and build dates in a particular
 * calendar system (Gregorian, Jalali, …). The rest of the library never branches
 * on a locale string — it talks only to this interface. Implement it to add a
 * new calendar without touching any component.
 *
 * Contract: a "date" everywhere in the public API is a native JS `Date`
 * representing a Gregorian instant at local midnight. Adapters translate between
 * that canonical instant and their own year/month/day fields.
 */
export abstract class CalendarAdapter {
  /** Stable id, e.g. `'gregorian'` or `'jalali'`. */
  abstract readonly id: string;

  /** Text direction the calendar reads in. */
  abstract readonly direction: 'ltr' | 'rtl';

  /** JS `getDay()` value (0=Sun … 6=Sat) that starts this calendar's week. */
  abstract readonly weekStartsOn: number;

  /** Year in this calendar for the given Gregorian date. */
  abstract getYear(date: Date): number;

  /** 1-based month in this calendar. */
  abstract getMonth(date: Date): number;

  /** 1-based day-of-month in this calendar. */
  abstract getDayOfMonth(date: Date): number;

  /** Number of days in the calendar month containing `date`. */
  abstract getDaysInMonth(date: Date): number;

  /** Build a canonical Gregorian midnight Date from this calendar's y/m/d. */
  abstract createDate(year: number, month: number, day: number): Date;

  /** Move by whole calendar months, preserving day-of-month where possible. */
  abstract addCalendarMonths(date: Date, delta: number): Date;

  /** First day (midnight) of the calendar month containing `date`. */
  abstract startOfMonth(date: Date): Date;

  /** Localized month + year heading, e.g. "شهریور ۱۴۰۲" or "August 2023". */
  abstract getMonthLabel(date: Date): string;

  /** Localized day-of-month label (digits in the calendar's own numerals). */
  abstract getDayLabel(date: Date): string;

  /** Seven short weekday names, ordered from {@link weekStartsOn}. */
  abstract getWeekdayLabels(): readonly string[];

  /** A fully written-out date, e.g. "چهارشنبه ۱ شهریور" / "Wednesday, August 23". */
  abstract format(date: Date): string;

  /** Column index 0..6 of `date` within this calendar's week. */
  getWeekdayIndex(date: Date): number {
    return (date.getDay() - this.weekStartsOn + 7) % 7;
  }

  /** Whether the given day is a weekend in this calendar. Override per culture. */
  abstract isWeekend(date: Date): boolean;
}

/** DI token carrying the active {@link CalendarAdapter}. */
export const CALENDAR_ADAPTER = new InjectionToken<CalendarAdapter>('CALENDAR_ADAPTER');
