/**
 * Pure helpers for the optional time-of-day feature. A "date" in the picker is a
 * Gregorian instant that is normally at local midnight; when time selection is on,
 * the same `Date` carries its hours/minutes and these helpers read / write that
 * time component without disturbing the calendar day. Framework-agnostic and
 * side-effect free so they can be unit-tested and reused by a headless UI.
 */

/** Hours (0–23) and minutes (0–59) of a date, in local time. */
export interface TimeOfDay {
  hours: number;
  minutes: number;
}

/** Read the local time-of-day from a date. */
export function getTimeOfDay(date: Date): TimeOfDay {
  return { hours: date.getHours(), minutes: date.getMinutes() };
}

/**
 * Return a copy of `date` with its time-of-day set to `hours:minutes` (seconds and
 * milliseconds cleared). The calendar day is preserved. Does not mutate the input.
 */
export function withTimeOfDay(date: Date, hours: number, minutes: number): Date {
  const d = new Date(date.getTime());
  d.setHours(clampHours(hours), clampMinutes(minutes), 0, 0);
  return d;
}

/** Copy the time-of-day (h:m, seconds cleared) from `source` onto `target`'s day. */
export function copyTimeOfDay(target: Date, source: Date): Date {
  return withTimeOfDay(target, source.getHours(), source.getMinutes());
}

/** Clamp to a valid 0–23 hour, wrapping around so 24 → 0 and -1 → 23. */
export function wrapHours(hours: number): number {
  return ((hours % 24) + 24) % 24;
}

/**
 * Snap `minutes` down to the nearest multiple of `step`, wrapping into 0–59.
 * A `step` of 1 (or less) leaves the value unchanged apart from the wrap.
 */
export function snapMinutes(minutes: number, step: number): number {
  const wrapped = ((minutes % 60) + 60) % 60;
  const s = normalizeStep(step);
  return s <= 1 ? wrapped : Math.floor(wrapped / s) * s;
}

/**
 * Advance `minutes` by `step` and wrap within the hour. When stepping up past 59
 * it returns to 0; stepping down past 0 lands on the last valid slot for the step.
 */
export function stepMinutes(minutes: number, step: number, dir: -1 | 1): number {
  const s = normalizeStep(step);
  const base = snapMinutes(minutes, s);
  return ((base + dir * s) % 60 + 60) % 60;
}

/** Coerce a user-supplied minute step into a sane divisor-friendly value (1–30). */
export function normalizeStep(step: number): number {
  if (!Number.isFinite(step)) return 1;
  return Math.min(30, Math.max(1, Math.floor(step)));
}

function clampHours(hours: number): number {
  return Math.min(23, Math.max(0, Math.floor(hours) || 0));
}

function clampMinutes(minutes: number): number {
  return Math.min(59, Math.max(0, Math.floor(minutes) || 0));
}
