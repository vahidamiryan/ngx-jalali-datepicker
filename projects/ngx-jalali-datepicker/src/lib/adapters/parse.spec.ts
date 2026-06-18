import { CalendarAdapter } from '../core/calendar-adapter';
import { GregorianCalendarAdapter } from './gregorian.adapter';
import { JalaliCalendarAdapter } from './jalali.adapter';
import { HijriCalendarAdapter } from './hijri.adapter';
import { dayKey } from '../core/date-key.util';

describe('CalendarAdapter typed-input (parse / formatInput)', () => {
  const adapters: { name: string; cal: CalendarAdapter }[] = [
    { name: 'Gregorian', cal: new GregorianCalendarAdapter('en-US') },
    { name: 'Jalali', cal: new JalaliCalendarAdapter() },
    { name: 'Hijri', cal: new HijriCalendarAdapter() },
  ];

  for (const { name, cal } of adapters) {
    describe(name, () => {
      it('round-trips formatInput → parse for a year of dates', () => {
        // Walk a full year of Gregorian days and assert the canonical date
        // survives a format → parse cycle in every calendar.
        const d = new Date(2026, 0, 1);
        for (let i = 0; i < 366; i++) {
          const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const text = cal.formatInput(date);
          const parsed = cal.parse(text);
          expect(parsed).withContext(`${name} @ ${text}`).not.toBeNull();
          expect(dayKey(parsed!)).withContext(`${name} @ ${text}`).toBe(dayKey(date));
          d.setDate(d.getDate() + 1);
        }
      });

      it('accepts Persian/Arabic-Indic digits and - / . separators', () => {
        const date = cal.createDate(cal.getYear(new Date(2026, 5, 15)), 6, 7);
        const y = cal.getYear(date);
        const ascii = `${y}/06/07`;
        const persian = ascii.replace(/\d/g, ch => String.fromCharCode(0x06f0 + +ch));
        for (const text of [ascii, `${y}-06-07`, `${y}.6.7`, persian]) {
          const parsed = cal.parse(text);
          expect(parsed).withContext(`${name} @ ${text}`).not.toBeNull();
          expect(cal.getMonth(parsed!)).toBe(6);
          expect(cal.getDayOfMonth(parsed!)).toBe(7);
        }
      });

      it('maskInput groups bare digits into YYYY/MM/DD and round-trips', () => {
        const date = cal.createDate(cal.getYear(new Date(2026, 5, 15)), 6, 7);
        const y = cal.getYear(date);
        const bare = `${y}0607`.replace(/\d/g, ch => cal['localizeDigits'](ch));
        const masked = cal.maskInput(bare);
        // Three slash-separated groups, parseable back to the same day.
        expect(masked.split('/').length).withContext(`${name} masked=${masked}`).toBe(3);
        const parsed = cal.parse(masked);
        expect(parsed).withContext(`${name} masked=${masked}`).not.toBeNull();
        expect(cal.getMonth(parsed!)).toBe(6);
        expect(cal.getDayOfMonth(parsed!)).toBe(7);
      });

      it('maskInput leaves a partial entry partial and ignores existing separators', () => {
        expect(cal.maskInput('')).toBe('');
        // Two digits → still just the (partial) year group, no trailing slash.
        expect(cal.maskInput('14').includes('/')).toBe(false);
        // Pre-typed separators are stripped then re-applied identically.
        expect(cal.maskInput('1405/06/07')).toBe(cal.maskInput('14050607'));
      });

      it('rejects malformed and impossible dates', () => {
        const y = cal.getYear(new Date(2026, 5, 15));
        expect(cal.parse('')).toBeNull();
        expect(cal.parse('not a date')).toBeNull();
        expect(cal.parse(`${y}/13/01`)).toBeNull(); // month 13
        expect(cal.parse(`${y}/01/40`)).toBeNull(); // day 40
        expect(cal.parse(`${y}/02`)).toBeNull(); // missing day
      });
    });
  }

  it('Jalali rejects day 31 in a 30-day month (Mehr)', () => {
    const cal = new JalaliCalendarAdapter();
    expect(cal.parse('1404/07/31')).toBeNull(); // Mehr has 30 days
    expect(cal.parse('1404/07/30')).not.toBeNull();
    expect(cal.parse('1404/01/31')).not.toBeNull(); // Farvardin has 31
  });

  it('Gregorian rejects 31 Feb', () => {
    const cal = new GregorianCalendarAdapter('en-US');
    expect(cal.parse('2026/02/31')).toBeNull();
    expect(cal.parse('2024/02/29')).not.toBeNull(); // leap year
    expect(cal.parse('2026/02/29')).toBeNull(); // non-leap
  });

  it('localizes digits: Jalali uses Persian numerals, Gregorian uses ASCII', () => {
    const greg = new GregorianCalendarAdapter('en-US').formatInput(new Date(2026, 2, 21));
    expect(greg).toBe('2026/03/21');

    const jalali = new JalaliCalendarAdapter().formatInput(new Date(2025, 2, 21)); // 1 Farvardin 1404
    expect(jalali).toMatch(/^[۰-۹]+\/[۰-۹]{2}\/[۰-۹]{2}$/);
  });
});
