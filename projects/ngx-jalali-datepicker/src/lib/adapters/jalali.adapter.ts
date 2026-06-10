import { CalendarAdapter } from '../core/calendar-adapter';
import { jalaaliMonthLength, toGregorian, toJalaali } from './jalaali';

/**
 * Jalaali (Persian / Shamsi) calendar adapter. Date *math* is exact and runs
 * through the pure conversion in `./jalaali`; the platform `Intl` API is used
 * only to produce localized labels (month names and Persian-Indic digits).
 */
export class JalaliCalendarAdapter extends CalendarAdapter {
  readonly id = 'jalali';
  readonly direction = 'rtl' as const;
  readonly weekStartsOn = 6; // Saturday — the start of the Iranian week

  /** Saturday → Friday, narrow form. */
  private static readonly WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

  private readonly monthYearFmt: Intl.DateTimeFormat;
  private readonly dayFmt: Intl.DateTimeFormat;
  private readonly fullFmt: Intl.DateTimeFormat;
  private readonly yearFmt: Intl.DateTimeFormat;
  private readonly monthNames: readonly string[];

  constructor(locale: string = 'fa-IR-u-ca-persian') {
    super();
    this.monthYearFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    this.dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric' });
    this.fullFmt = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' });
    this.yearFmt = new Intl.DateTimeFormat(locale, { year: 'numeric' });
    // Build the 12 month names once. 1404 is an ordinary Jalali year; any year works.
    const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long' });
    const names: string[] = [];
    for (let m = 1; m <= 12; m++) names.push(monthFmt.format(this.createDate(1404, m, 1)));
    this.monthNames = names;
  }

  getYear(date: Date): number {
    return toJalaali(date).jy;
  }

  getMonth(date: Date): number {
    return toJalaali(date).jm;
  }

  getDayOfMonth(date: Date): number {
    return toJalaali(date).jd;
  }

  getDaysInMonth(date: Date): number {
    const { jy, jm } = toJalaali(date);
    return jalaaliMonthLength(jy, jm);
  }

  createDate(year: number, month: number, day: number): Date {
    const { gy, gm, gd } = toGregorian(year, month, day);
    const d = new Date(gy, gm - 1, gd);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  addCalendarMonths(date: Date, delta: number): Date {
    const { jy, jm, jd } = toJalaali(date);
    // Normalize the month into a 0-based absolute index, shift, then split back.
    const total = (jy * 12 + (jm - 1)) + delta;
    const targetYear = Math.floor(total / 12);
    const targetMonth = (total % 12) + 1;
    const day = Math.min(jd, jalaaliMonthLength(targetYear, targetMonth));
    return this.createDate(targetYear, targetMonth, day);
  }

  startOfMonth(date: Date): Date {
    const { jy, jm } = toJalaali(date);
    return this.createDate(jy, jm, 1);
  }

  getMonthLabel(date: Date): string {
    return this.monthYearFmt.format(date);
  }

  override getYearLabel(date: Date): string {
    return this.yearFmt.format(date);
  }

  override getMonthNames(): readonly string[] {
    return this.monthNames;
  }

  getDayLabel(date: Date): string {
    return this.dayFmt.format(date);
  }

  getWeekdayLabels(): readonly string[] {
    return JalaliCalendarAdapter.WEEKDAYS;
  }

  format(date: Date): string {
    return this.fullFmt.format(date);
  }

  isWeekend(date: Date): boolean {
    return date.getDay() === 5; // Friday
  }
}
