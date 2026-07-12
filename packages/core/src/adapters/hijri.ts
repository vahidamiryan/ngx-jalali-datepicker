/**
 * Pure Tabular Islamic (Hijri civil) ⇆ Gregorian conversion.
 *
 * This is the fully arithmetic "islamic-civil" calendar: a fixed 30-year cycle
 * with leap years {2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29}, a common year of
 * 354 days, a leap year of 355 days, and months alternating 30/29 days
 * (Dhu al-Hijjah gains a 30th day in leap years). The civil (Friday) epoch is
 * JDN 1948440 = 19 July 622 CE Gregorian.
 *
 * Deliberately NOT Umm al-Qura and NOT sighting-based: the result is
 * deterministic and identical in every region and runtime. Observational
 * offsets (±1–2 days) are layered on top by the adapter via
 * `NdpHijriDayAdjustment` — never inside this math.
 *
 * Kept dependency-free and Intl-independent so the calendar math is exact and
 * testable — Intl is used only for *labels*.
 */

/** Julian Day Number of 1 Muharram 1 AH in the civil (Friday) reckoning. */
export const HIJRI_EPOCH_JDN = 1948440;

function div(a: number, b: number): number {
  return Math.floor(a / b);
}

/** Julian Day Number at noon of the given Gregorian calendar date. */
export function gregorianToJdn(gy: number, gm: number, gd: number): number {
  const a = div(14 - gm, 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  return (
    gd + div(153 * m + 2, 5) + 365 * y + div(y, 4) - div(y, 100) + div(y, 400) - 32045
  );
}

/** Gregorian calendar date for the given Julian Day Number. */
export function jdnToGregorian(jdn: number): { gy: number; gm: number; gd: number } {
  const a = jdn + 32044;
  const b = div(4 * a + 3, 146097);
  const c = a - div(146097 * b, 4);
  const d = div(4 * c + 3, 1461);
  const e = c - div(1461 * d, 4);
  const m = div(5 * e + 2, 153);
  const gd = e - div(153 * m + 2, 5) + 1;
  const gm = m + 3 - 12 * div(m, 10);
  const gy = 100 * b + d - 4800 + div(m, 10);
  return { gy, gm, gd };
}

/**
 * Whether the given Hijri year is one of the 11 leap years of the 30-year
 * cycle ({2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29} → 355 days).
 */
export function isLeapHijriYear(hy: number): boolean {
  return (((11 * hy + 14) % 30) + 30) % 30 < 11;
}

/** 354 for a common year, 355 for a leap year. */
export function hijriYearLength(hy: number): number {
  return isLeapHijriYear(hy) ? 355 : 354;
}

/**
 * Days in the given Hijri month: odd months 30, even months 29, except
 * Dhu al-Hijjah (month 12) which has 30 days in a leap year.
 */
export function hijriMonthLength(hy: number, hm: number): number {
  if (hm === 12) return isLeapHijriYear(hy) ? 30 : 29;
  return hm % 2 === 1 ? 30 : 29;
}

/** Julian Day Number of the given civil Hijri date. */
export function hijriToJdn(hy: number, hm: number, hd: number): number {
  return (
    hd +
    Math.ceil(29.5 * (hm - 1)) + // days in the completed months of the year
    (hy - 1) * 354 +
    div(3 + 11 * hy, 30) + // leap days accumulated over previous years
    HIJRI_EPOCH_JDN -
    1
  );
}

/** Civil Hijri date for the given Julian Day Number. */
export function jdnToHijri(jdn: number): { hy: number; hm: number; hd: number } {
  const hy = div(30 * (jdn - HIJRI_EPOCH_JDN) + 10646, 10631);
  const hm = Math.min(12, Math.ceil((jdn - (29 + hijriToJdn(hy, 1, 1))) / 29.5) + 1);
  const hd = jdn - hijriToJdn(hy, hm, 1) + 1;
  return { hy, hm, hd };
}

/** Civil Hijri date of a local-time JS `Date` (the time-of-day is ignored). */
export function toHijri(date: Date): { hy: number; hm: number; hd: number } {
  return jdnToHijri(gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate()));
}

/** Gregorian y/m/d of the given civil Hijri date. */
export function toGregorian(hy: number, hm: number, hd: number): { gy: number; gm: number; gd: number } {
  return jdnToGregorian(hijriToJdn(hy, hm, hd));
}
