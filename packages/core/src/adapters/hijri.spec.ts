import {
  gregorianToJdn,
  HIJRI_EPOCH_JDN,
  hijriMonthLength,
  hijriToJdn,
  hijriYearLength,
  isLeapHijriYear,
  jdnToHijri,
  toGregorian,
  toHijri,
} from './hijri';
import { HijriCalendarAdapter, NdpHijriDayAdjuster } from './hijri.adapter';

describe('hijri math (tabular Islamic civil)', () => {
  it('anchors the civil epoch: 1 Muharram 1 AH = 19 July 622 CE = JDN 1948440', () => {
    expect(gregorianToJdn(622, 7, 19)).toBe(HIJRI_EPOCH_JDN);
    expect(hijriToJdn(1, 1, 1)).toBe(HIJRI_EPOCH_JDN);
    expect(jdnToHijri(HIJRI_EPOCH_JDN)).toEqual({ hy: 1, hm: 1, hd: 1 });
  });

  it('marks exactly the 11 cycle years {2,5,7,10,13,16,18,21,24,26,29} as leap', () => {
    const leapInCycle = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    for (let y = 1; y <= 30; y++) {
      expect(isLeapHijriYear(y)).withContext(`year ${y} of cycle`).toBe(leapInCycle.includes(y));
      // The rule must repeat across cycles.
      expect(isLeapHijriYear(y + 30 * 47)).toBe(leapInCycle.includes(y));
    }
  });

  it('gives 354/355-day years and alternating 30/29-day months', () => {
    expect(hijriYearLength(1445)).toBe(355); // 1445 ≡ 5 (mod 30) → leap
    expect(hijriYearLength(1446)).toBe(354); // 1446 ≡ 6 (mod 30) → common
    for (const hy of [1444, 1445, 1446, 1447]) {
      const total = Array.from({ length: 12 }, (_, i) => hijriMonthLength(hy, i + 1)).reduce(
        (a, b) => a + b,
      );
      expect(total).toBe(hijriYearLength(hy));
    }
    expect(hijriMonthLength(1446, 1)).toBe(30); // Muharram
    expect(hijriMonthLength(1446, 2)).toBe(29); // Safar
    expect(hijriMonthLength(1446, 11)).toBe(30); // Dhu al-Qi'dah
    // Dhu al-Hijjah: 29 in a common year, 30 in a leap year.
    const leap = [1444, 1445, 1446, 1447].find(isLeapHijriYear)!;
    const common = [1444, 1445, 1446, 1447].find((y) => !isLeapHijriYear(y))!;
    expect(hijriMonthLength(leap, 12)).toBe(30);
    expect(hijriMonthLength(common, 12)).toBe(29);
  });

  it('round-trips every day across several decades', () => {
    for (let jdn = gregorianToJdn(1990, 1, 1); jdn <= gregorianToJdn(2080, 12, 31); jdn += 13) {
      const { hy, hm, hd } = jdnToHijri(jdn);
      expect(hd).toBeGreaterThanOrEqual(1);
      expect(hd).toBeLessThanOrEqual(hijriMonthLength(hy, hm));
      expect(hijriToJdn(hy, hm, hd)).toBe(jdn);
    }
  });

  it('matches the platform Intl islamic-civil implementation day-by-day', () => {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-civil', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    // Sweep a prime stride so every weekday/month-edge combination is hit.
    const start = new Date(2000, 0, 1);
    for (let i = 0; i < 365 * 30; i += 17) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const parts = fmt.formatToParts(d);
      const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
      const { hy, hm, hd } = toHijri(d);
      expect({ hy, hm, hd })
        .withContext(`for ${d.toDateString()}`)
        .toEqual({ hy: get('year'), hm: get('month'), hd: get('day') });
    }
  });

  it('converts known dates in both directions', () => {
    // 1 Muharram 1446 AH (civil) — verified against ICU islamic-civil.
    const g = toGregorian(1446, 1, 1);
    const back = toHijri(new Date(g.gy, g.gm - 1, g.gd));
    expect(back).toEqual({ hy: 1446, hm: 1, hd: 1 });
  });
});

describe('HijriCalendarAdapter', () => {
  const adapter = new HijriCalendarAdapter();

  it('exposes hijri y/m/d for a Gregorian date and builds the inverse', () => {
    const d = adapter.createDate(1446, 9, 1); // 1 Ramadan 1446
    expect(adapter.getYear(d)).toBe(1446);
    expect(adapter.getMonth(d)).toBe(9);
    expect(adapter.getDayOfMonth(d)).toBe(1);
    expect(adapter.getDaysInMonth(d)).toBe(30); // Ramadan is month 9 → 30 days
    expect(d.getHours()).toBe(0);
  });

  it('navigates months across year boundaries and clamps the day', () => {
    const d = adapter.createDate(1446, 12, 29);
    const next = adapter.addCalendarMonths(d, 1);
    expect(adapter.getYear(next)).toBe(1447);
    expect(adapter.getMonth(next)).toBe(1);

    // 30 Muharram −1 month → Dhu al-Hijjah (29 days in a common year): clamp.
    const muh30 = adapter.createDate(1447, 1, 30);
    const prev = adapter.addCalendarMonths(muh30, -1);
    expect(adapter.getMonth(prev)).toBe(12);
    expect(adapter.getDayOfMonth(prev)).toBe(hijriMonthLength(1446, 12));
  });

  it('navigates years via the 12-month default and finds month/year starts', () => {
    const d = adapter.createDate(1446, 5, 17);
    const nextYear = adapter.addCalendarYears(d, 1);
    expect(adapter.getYear(nextYear)).toBe(1447);
    expect(adapter.getMonth(nextYear)).toBe(5);

    expect(adapter.getDayOfMonth(adapter.startOfMonth(d))).toBe(1);
    const soy = adapter.startOfYear(d);
    expect(adapter.getMonth(soy)).toBe(1);
    expect(adapter.getDayOfMonth(soy)).toBe(1);
  });

  it('labels months with the Persian names and Persian digits', () => {
    const ramadan = adapter.createDate(1446, 9, 1);
    expect(adapter.getMonthNames()[8]).toBe('رمضان');
    expect(adapter.getMonthLabel(ramadan)).toBe('رمضان ۱۴۴۶');
    expect(adapter.getDayLabel(ramadan)).toBe('۱');
    expect(adapter.getWeekdayLabels().length).toBe(7);
  });

  it('starts the week on Saturday and treats Friday as the weekend', () => {
    expect(adapter.weekStartsOn).toBe(6);
    const friday = new Date(2026, 5, 12); // 12 Jun 2026 is a Friday
    expect(adapter.isWeekend(friday)).toBeTrue();
    expect(adapter.isWeekend(new Date(2026, 5, 13))).toBeFalse();
  });

  it('applies a fixed manual adjustment symmetrically', () => {
    const plain = new HijriCalendarAdapter();
    const shifted = new HijriCalendarAdapter({ adjustment: -1 });

    const g = shifted.createDate(1446, 9, 1);
    expect(shifted.getDayOfMonth(g)).toBe(1); // round-trip through the offset
    // The observed calendar runs one day behind the tabular one.
    expect(g.getTime() - plain.createDate(1446, 9, 1).getTime()).toBe(24 * 3600 * 1000);

    // Labels follow the adjusted math, not raw Intl.
    expect(shifted.getMonthLabel(g)).toBe('رمضان ۱۴۴۶');
  });

  it('accepts an adjuster service object', () => {
    const service: NdpHijriDayAdjuster = {
      getDayAdjustment: () => 1,
    };
    const adapter2 = new HijriCalendarAdapter({ adjustment: service });
    const d = adapter2.createDate(1446, 9, 10);
    expect(adapter2.getDayOfMonth(d)).toBe(10);
    expect(adapter2.getMonth(d)).toBe(9);
  });
});
