import { toLatinDigits } from './date-key.util';

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

  // ── Typed-input support (parse / machine-readable format) ──────────────────
  //
  // `format()` produces a written-out string ("شنبه ۱۷ خرداد") that can't be
  // parsed back. These two methods give a compact, round-trippable representation
  // ("۱۴۰۴/۰۳/۲۸" / "2026/03/21") so a text input can read and write dates.
  // Both have working defaults built only on the existing abstract members, so
  // every custom adapter keeps compiling with no changes.

  /**
   * Compact, editable representation of a date — `YYYY/MM/DD` in this calendar,
   * with month/day zero-padded and digits in the calendar's own numerals.
   * The inverse of {@link parse}.
   */
  formatInput(date: Date): string {
    return (
      `${this.localizeNumber(this.getYear(date))}/` +
      `${this.localizeNumber(this.getMonth(date), 2)}/` +
      `${this.localizeNumber(this.getDayOfMonth(date), 2)}`
    );
  }

  /**
   * Parse a `YYYY/MM/DD` string in this calendar into a canonical Gregorian
   * midnight `Date`, or `null` when the text isn't a valid date. Accepts `/`,
   * `-` or `.` separators and Persian/Arabic-Indic digits. A round-trip check
   * rejects impossible dates (month 13, day 31 in a 30-day month, …).
   */
  parse(text: string): Date | null {
    const s = toLatinDigits(text).trim();
    const m = s.match(/^(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
    if (!m) return null;
    const year = +m[1];
    const month = +m[2];
    const day = +m[3];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = this.createDate(year, month, day);
    if (
      this.getYear(date) !== year ||
      this.getMonth(date) !== month ||
      this.getDayOfMonth(date) !== day
    ) {
      return null;
    }
    return date;
  }

  /**
   * Render an integer in the calendar's own numerals, optionally zero-padded to
   * `pad` digits. Defaults to ASCII; localized calendars override to emit their
   * native digits (Persian/Arabic-Indic).
   */
  protected localizeNumber(value: number, pad = 0): string {
    return String(value).padStart(pad, '0');
  }

  /** Localize a string of ASCII digits into the calendar's own numerals. Defaults to ASCII. */
  protected localizeDigits(digits: string): string {
    return digits;
  }

  /**
   * Digit counts of the `YYYY/MM/DD` segments, in order — `[4, 2, 2]` for a
   * four-digit-year calendar. Drives the typed-input auto-formatting so the user
   * types only digits and the separators appear on their own. Override for
   * calendars with differently sized fields.
   */
  getInputMask(): readonly number[] {
    return [4, 2, 2];
  }

  /**
   * Take whatever the user typed and re-render it as a partial `YYYY/MM/DD`
   * string: keep only the digits, group them per {@link getInputMask}, join the
   * groups with `/`, and localize to the calendar's numerals. Lets a field
   * insert the separators automatically while the user types only digits.
   */
  maskInput(text: string): string {
    const digits = toLatinDigits(text).replace(/\D/g, '');
    if (!digits) return '';
    const groups: string[] = [];
    let i = 0;
    for (const size of this.getInputMask()) {
      if (i >= digits.length) break;
      groups.push(digits.slice(i, i + size));
      i += size;
    }
    // Any overflow digits past the last group are dropped — the date is full.
    return this.localizeDigits(groups.join('/'));
  }

  /** Human-readable hint for an input placeholder, e.g. `"YYYY/MM/DD"`. */
  getInputFormatHint(): string {
    return 'YYYY/MM/DD';
  }

  /**
   * Public rendering of an integer in the calendar's own numerals, optionally
   * zero-padded to `pad` digits (e.g. the time-of-day fields render "۰۹" / "09"
   * through this). Thin wrapper over {@link localizeNumber} so callers outside the
   * adapter can localize digits without the protected internals.
   */
  formatNumber(value: number, pad = 0): string {
    return this.localizeNumber(value, pad);
  }
}
