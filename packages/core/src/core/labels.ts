/**
 * User-facing text — the single source of every string the pickers render.
 *
 * Kept separate from the calendar adapters on purpose: which calendar you show
 * (Jalali, Gregorian, Hijri) and which language you label it in are independent
 * choices. A Jalali calendar in an English admin panel is a normal pairing.
 */
export interface NdpLabels {
  /** Previous month / period. */
  prev: string;
  /** Next month / period. */
  next: string;
  /** Dismisses an open dropdown or popover. */
  close: string;
  /** Jumps the view to the current date. */
  today: string;
  /** Clears the whole selection. */
  clear: string;
  /** Clears only the range start. */
  clearStart: string;
  /** Clears only the range end. */
  clearEnd: string;
  /** Opens the calendar popover from an input field. */
  openCalendar: string;
  /** Switches to the secondary calendar (label is the calendar's own name). */
  switchCalendar: string;
  /** Display names per calendar id, used by the calendar-toggle button. */
  calendars: Record<string, string>;
  /** Hours field in the time picker. */
  hours: string;
  /** Minutes field in the time picker. */
  minutes: string;
  /** Steps the hours field up / down. */
  increaseHours: string;
  decreaseHours: string;
  /** Steps the minutes field up / down. */
  increaseMinutes: string;
  decreaseMinutes: string;
}

export const NDP_EN_LABELS: NdpLabels = {
  prev: 'Previous',
  next: 'Next',
  close: 'Close',
  today: 'Today',
  clear: 'Clear',
  clearStart: 'Clear start date',
  clearEnd: 'Clear end date',
  openCalendar: 'Open calendar',
  switchCalendar: 'Switch calendar',
  calendars: { gregorian: 'Gregorian', jalali: 'Jalali', hijri: 'Hijri' },
  hours: 'Hours',
  minutes: 'Minutes',
  increaseHours: 'Increase hours',
  decreaseHours: 'Decrease hours',
  increaseMinutes: 'Increase minutes',
  decreaseMinutes: 'Decrease minutes',
};

export const NDP_FA_LABELS: NdpLabels = {
  prev: 'قبلی',
  next: 'بعدی',
  close: 'بستن',
  today: 'امروز',
  clear: 'پاک کردن',
  clearStart: 'پاک کردن تاریخ شروع',
  clearEnd: 'پاک کردن تاریخ پایان',
  openCalendar: 'باز کردن تقویم',
  switchCalendar: 'تغییر تقویم',
  calendars: { gregorian: 'میلادی', jalali: 'شمسی', hijri: 'قمری' },
  hours: 'ساعت',
  minutes: 'دقیقه',
  increaseHours: 'افزایش ساعت',
  decreaseHours: 'کاهش ساعت',
  increaseMinutes: 'افزایش دقیقه',
  decreaseMinutes: 'کاهش دقیقه',
};

/**
 * Default label set for a calendar id. Jalali and Hijri default to Persian,
 * Gregorian to English — the common pairing, and what every picker rendered
 * before labels were configurable.
 */
export function defaultLabelsFor(calendarId: string): NdpLabels {
  return calendarId === 'gregorian' ? NDP_EN_LABELS : NDP_FA_LABELS;
}

/** Merges caller overrides over a base set, leaving unnamed labels intact. */
export function resolveLabels(
  overrides?: Partial<NdpLabels>,
  base: NdpLabels = NDP_EN_LABELS,
): NdpLabels {
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    // `calendars` is a map, so merge it rather than letting a partial
    // override drop the names it doesn't mention.
    calendars: { ...base.calendars, ...overrides.calendars },
  };
}
