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

  /**
   * Move by whole calendar years, preserving month/day where possible.
   * Defaults to a 12-month shift, which is correct for any 12-month calendar
   * (Gregorian, Jalali, …). Override only for non-twelve-month calendars.
   */
  addCalendarYears(date: Date, delta: number): Date {
    return this.addCalendarMonths(date, delta * 12);
  }

  /** First day (midnight) of the calendar year containing `date`. */
  startOfYear(date: Date): Date {
    return this.createDate(this.getYear(date), 1, 1);
  }

  /**
   * Twelve localized month names in calendar order (index 0 = month 1).
   * Defaults to numeric labels; override for localized names.
   */
  getMonthNames(): readonly string[] {
    const names: string[] = [];
    for (let m = 1; m <= 12; m++) names.push(String(m));
    return names;
  }

  /** Localized year label (digits in the calendar's own numerals). Defaults to ASCII. */
  getYearLabel(date: Date): string {
    return String(this.getYear(date));
  }

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
