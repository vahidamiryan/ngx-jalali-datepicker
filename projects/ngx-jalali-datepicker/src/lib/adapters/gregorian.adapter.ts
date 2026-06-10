import { CalendarAdapter } from '../core/calendar-adapter';
import { atMidnight } from '../core/date-key.util';

/**
 * Gregorian calendar adapter backed by the platform `Intl` API. Formatters are
 * created once and reused — constructing an `Intl.DateTimeFormat` is expensive,
 * and the legacy code rebuilt one on every `toLocaleDateString` call.
 */
export class GregorianCalendarAdapter extends CalendarAdapter {
  readonly id = 'gregorian';
  readonly direction = 'ltr' as const;
  readonly weekStartsOn = 0; // Sunday

  private readonly monthYearFmt: Intl.DateTimeFormat;
  private readonly dayFmt: Intl.DateTimeFormat;
  private readonly fullFmt: Intl.DateTimeFormat;
  private readonly weekdayFmt: Intl.DateTimeFormat;
  private readonly yearFmt: Intl.DateTimeFormat;
  private readonly monthNames: readonly string[];

  constructor(private readonly locale: string = 'en-US') {
    super();
    this.monthYearFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    this.dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric' });
    this.fullFmt = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' });
    this.weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    this.yearFmt = new Intl.DateTimeFormat(locale, { year: 'numeric' });
    const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long' });
    const names: string[] = [];
    for (let m = 1; m <= 12; m++) names.push(monthFmt.format(this.createDate(2023, m, 1)));
    this.monthNames = names;
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  getMonth(date: Date): number {
    return date.getMonth() + 1;
  }

  getDayOfMonth(date: Date): number {
    return date.getDate();
  }

  getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  createDate(year: number, month: number, day: number): Date {
    const d = new Date(year, month - 1, day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  addCalendarMonths(date: Date, delta: number): Date {
    const target = new Date(date.getFullYear(), date.getMonth() + delta, 1);
    const day = Math.min(date.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate());
    return this.createDate(target.getFullYear(), target.getMonth() + 1, day);
  }

  startOfMonth(date: Date): Date {
    return this.createDate(date.getFullYear(), date.getMonth() + 1, 1);
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
    const labels: string[] = [];
    // 2023-01-01 is a Sunday — a convenient anchor to walk a full week.
    const anchor = atMidnight(new Date(2023, 0, 1));
    for (let i = 0; i < 7; i++) {
      const d = new Date(anchor.getTime());
      d.setDate(anchor.getDate() + ((this.weekStartsOn + i) % 7));
      labels.push(this.weekdayFmt.format(d));
    }
    return labels;
  }

  format(date: Date): string {
    return this.fullFmt.format(date);
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sun / Sat
  }
}
