import { CalendarAdapter } from '../core/calendar-adapter';
import { atMidnight } from '../core/date-key.util';
import {
  gregorianToJdn,
  hijriMonthLength,
  hijriToJdn,
  jdnToGregorian,
  jdnToHijri,
} from './hijri';

/**
 * Object form of {@link NdpHijriDayAdjustment} — implement it on an Angular
 * service (or any class) that knows the local offset between the observed
 * Hijri calendar and the tabular one, e.g. a service fed by a remote API or a
 * per-country correction table.
 *
 * The adapter is synchronous, so the implementation must answer from data it
 * already holds — fetch/cache asynchronously *before* handing the service to
 * the adapter, never inside this call.
 */
export interface NdpHijriDayAdjuster {
  /**
   * Day offset to apply for the given Gregorian date. `+1` means the locally
   * observed Hijri calendar runs one day ahead of the tabular computation.
   * Must be stable within any one Hijri month for round-trips to be exact.
   */
  getDayAdjustment(date: Date): number;
}

/**
 * How the developer corrects the deterministic tabular computation toward a
 * locally observed Hijri calendar (sighting-based or Umm al-Qura differ from
 * the tabular one by ±1–2 days depending on region):
 *
 * - `number` — a fixed manual offset, e.g. `-1`;
 * - `(date) => number` — a manual function, e.g. backed by a lookup table;
 * - {@link NdpHijriDayAdjuster} — a service instance resolved per date.
 *
 * The tabular math itself is never altered — the offset is applied as a whole
 * number of days on top of it, so behavior stays predictable and testable.
 */
export type NdpHijriDayAdjustment = number | ((date: Date) => number) | NdpHijriDayAdjuster;

/** Construction-time configuration for {@link HijriCalendarAdapter}. */
export interface NdpHijriConfig {
  /** Locale used for digits and weekday labels. Default `'fa-IR'`. */
  locale?: string;
  /** Twelve month names (index 0 = Muharram). Defaults to the Persian names. */
  monthNames?: readonly string[];
  /** Day offset toward the observed calendar. Default `0` (pure tabular). */
  adjustment?: NdpHijriDayAdjustment;
}

/**
 * Tabular Islamic (Hijri civil) calendar adapter. Date *math* is exact and
 * runs through the pure arithmetic in `./hijri`; `Intl` is used only for
 * digits and weekday names, never for the year/month/day fields — that keeps
 * the optional {@link NdpHijriConfig.adjustment} consistent across labels and
 * math (an Intl `islamic-civil` formatter would ignore the offset).
 */
export class HijriCalendarAdapter extends CalendarAdapter {
  readonly id = 'hijri';
  readonly direction = 'rtl' as const;
  readonly weekStartsOn = 6; // Saturday

  /** Persian names of the Hijri months, Muharram first. */
  private static readonly MONTH_NAMES = [
    'محرم',
    'صفر',
    'ربیع‌الاول',
    'ربیع‌الثانی',
    'جمادی‌الاول',
    'جمادی‌الثانی',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذیقعده',
    'ذی‌الحجه',
  ] as const;

  private readonly digitFmt: Intl.NumberFormat;
  private readonly weekdayFmt: Intl.DateTimeFormat;
  private readonly weekdayLongFmt: Intl.DateTimeFormat;
  private readonly monthNames: readonly string[];
  private readonly adjustment: NdpHijriDayAdjustment;

  constructor(config: NdpHijriConfig = {}) {
    super();
    const locale = config.locale ?? 'fa-IR';
    this.digitFmt = new Intl.NumberFormat(locale, { useGrouping: false });
    this.weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    this.weekdayLongFmt = new Intl.DateTimeFormat(locale, { weekday: 'long' });
    this.monthNames = config.monthNames ?? HijriCalendarAdapter.MONTH_NAMES;
    this.adjustment = config.adjustment ?? 0;
  }

  /** Day offset for `date`, whichever form the developer configured. */
  private adjustmentFor(date: Date): number {
    const a = this.adjustment;
    if (typeof a === 'number') return a;
    if (typeof a === 'function') return a(date);
    return a.getDayAdjustment(date);
  }

  /** Adjusted Hijri y/m/d of a Gregorian date. */
  private toHijri(date: Date): { hy: number; hm: number; hd: number } {
    const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return jdnToHijri(jdn + this.adjustmentFor(date));
  }

  getYear(date: Date): number {
    return this.toHijri(date).hy;
  }

  getMonth(date: Date): number {
    return this.toHijri(date).hm;
  }

  getDayOfMonth(date: Date): number {
    return this.toHijri(date).hd;
  }

  getDaysInMonth(date: Date): number {
    const { hy, hm } = this.toHijri(date);
    return hijriMonthLength(hy, hm);
  }

  createDate(year: number, month: number, day: number): Date {
    const jdn = hijriToJdn(year, month, day);
    // Resolve the adjustment against the unadjusted Gregorian equivalent —
    // exact as long as the offset is stable within the month (see the
    // NdpHijriDayAdjuster contract).
    const base = jdnToGregorian(jdn);
    const probe = atMidnight(new Date(base.gy, base.gm - 1, base.gd));
    const { gy, gm, gd } = jdnToGregorian(jdn - this.adjustmentFor(probe));
    return atMidnight(new Date(gy, gm - 1, gd));
  }

  addCalendarMonths(date: Date, delta: number): Date {
    const { hy, hm, hd } = this.toHijri(date);
    // Normalize the month into a 0-based absolute index, shift, then split back.
    const total = hy * 12 + (hm - 1) + delta;
    const targetYear = Math.floor(total / 12);
    const targetMonth = ((total % 12) + 12) % 12 + 1;
    const day = Math.min(hd, hijriMonthLength(targetYear, targetMonth));
    return this.createDate(targetYear, targetMonth, day);
  }

  startOfMonth(date: Date): Date {
    const { hy, hm } = this.toHijri(date);
    return this.createDate(hy, hm, 1);
  }

  getMonthLabel(date: Date): string {
    const { hy, hm } = this.toHijri(date);
    return `${this.monthNames[hm - 1]} ${this.digitFmt.format(hy)}`;
  }

  override getYearLabel(date: Date): string {
    return this.digitFmt.format(this.getYear(date));
  }

  override getMonthNames(): readonly string[] {
    return this.monthNames;
  }

  getDayLabel(date: Date): string {
    return this.digitFmt.format(this.getDayOfMonth(date));
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
    const { hm, hd } = this.toHijri(date);
    return `${this.weekdayLongFmt.format(date)} ${this.digitFmt.format(hd)} ${this.monthNames[hm - 1]}`;
  }

  isWeekend(date: Date): boolean {
    return date.getDay() === 5; // Friday
  }

  protected override localizeDigits(digits: string): string {
    // Map each ASCII digit through the locale's formatter so masked input reads
    // in the same numerals as the labels; non-digits (the `/`) pass through.
    return digits.replace(/\d/g, d => this.digitFmt.format(+d));
  }

  protected override localizeNumber(value: number, pad = 0): string {
    // Reuse the construction-time digit formatter (honours `locale`) and pad in
    // its own numerals so a zero-padded month/day reads natively (e.g. "۰۳").
    return this.digitFmt.format(value).padStart(pad, this.digitFmt.format(0));
  }

  override getInputFormatHint(): string {
    return 'سال/ماه/روز';
  }
}
