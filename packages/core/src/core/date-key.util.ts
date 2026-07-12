import { DayKey } from './types';

/** Return a new Date set to local midnight (strips time-of-day). Does not mutate the input. */
export function atMidnight(date: Date): Date {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Build a numeric yyyymmdd key from a Gregorian date. Comparing these is far
 * cheaper than `toDateString()` and never allocates a string — the key driver
 * of the picker's per-cell rendering cost.
 */
export function dayKey(date: Date): DayKey {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/** True when two dates fall on the same calendar day, ignoring time. */
export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return !!a && !!b && dayKey(a) === dayKey(b);
}

/** Clamp `date` into the optional [min, max] bounds (inclusive), returning a midnight Date. */
export function clampDate(date: Date, min: Date | null, max: Date | null): Date {
  const t = atMidnight(date).getTime();
  if (min && t < atMidnight(min).getTime()) return atMidnight(min);
  if (max && t > atMidnight(max).getTime()) return atMidnight(max);
  return atMidnight(date);
}

/** Convert any Persian/Arabic-Indic digits in a string to ASCII digits. */
export function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, d => {
    const code = d.charCodeAt(0);
    if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0); // Persian
    return String(code - 0x0660); // Arabic
  });
}

/** Convert ASCII digits in a string to Persian (extended Arabic-Indic) digits. */
export function toPersianDigits(value: string): string {
  return value.replace(/\d/g, d => String.fromCharCode(0x06f0 + Number(d)));
}
