# @vahidamirian/datepicker-core

[![npm](https://img.shields.io/npm/v/@vahidamirian/datepicker-core)](https://www.npmjs.com/package/@vahidamirian/datepicker-core)

Framework-agnostic **headless core** for the NDP date picker. Pure TypeScript with **zero
framework dependencies** — the shared foundation under
[`@vahidamirian/ngx-jalali-datepicker`](../angular) and
[`@vahidamirian/vue-datepicker`](../vue). Use it directly to build a completely custom UI, or
just for calendar math and Jalali ⇆ Gregorian ⇆ Hijri conversion.

**npm:** https://www.npmjs.com/package/@vahidamirian/datepicker-core

---

## Contents

- [Install](#install)
- [What it ships](#what-it-ships)
- [Core concept: the canonical date](#core-concept-the-canonical-date)
- [Calendar adapters](#calendar-adapters)
- [Conversion math (`JalaaliMath` / `HijriMath`)](#conversion-math-jalaalimath--hijrimath)
- [Parsing, formatting & digits](#parsing-formatting--digits)
- [Date arithmetic — add / subtract](#date-arithmetic--add--subtract)
- [View builders (render-ready grids)](#view-builders-render-ready-grids)
- [Selection reducer](#selection-reducer)
- [Time-of-day helpers](#time-of-day-helpers)
- [Date-key utilities](#date-key-utilities)
- [Writing a custom calendar adapter](#writing-a-custom-calendar-adapter)
- [Building a headless picker (worked example)](#building-a-headless-picker-worked-example)
- [Type reference](#type-reference)
- [Full export list](#full-export-list)

---

## Install

```bash
npm install @vahidamirian/datepicker-core
```

Used on its own, or as a peer of the Angular / Vue packages (which re-export it, so a single
import point works either way).

## What it ships

- **Calendar adapters** — `GregorianCalendarAdapter`, `JalaliCalendarAdapter`,
  `HijriCalendarAdapter`, and the `CalendarAdapter` abstract base you extend to add your own.
- **Conversion math** — `JalaaliMath`, `HijriMath` (dependency-free, verified day-by-day
  against the platform `Intl` calendars).
- **Render-ready view builders** — `buildMonthView`, `buildMonthsView`, `buildYearsView`:
  every per-cell flag (selected / in-range / disabled / today …) precomputed once so any UI
  layer only ever reads booleans.
- **Pure logic** — `applySelection`, `isSelectionComplete`, `rangeEquals`, time-of-day
  helpers, and the `dayKey` / digit / clamp utilities.

Everything is a pure function or a class with no side effects, so it is trivially testable and
reusable in any environment (browser, Node, a worker, SSR).

## Core concept: the canonical date

A "date" everywhere in the public API is a native JS `Date` representing a **Gregorian instant
at local midnight**. Adapters translate between that canonical instant and their own
year/month/day fields. This is why:

- you never pass Jalali numbers around — you pass `Date`s, and ask the adapter for labels;
- the same `DateRange` works across calendars — switching the active calendar re-labels the
  *same* days;
- comparisons are cheap: a date reduces to a numeric `yyyymmdd` **day key** (see
  [`dayKey`](#date-key-utilities)).

```ts
import { JalaliCalendarAdapter, buildMonthView, applySelection } from '@vahidamirian/datepicker-core';

const cal = new JalaliCalendarAdapter();
cal.parse('۱۴۰۴/۰۳/۲۸'); // Date | null
```

## Calendar adapters

An adapter teaches the library how to read and build dates in one calendar system. The rest of
the library never branches on a locale string — it talks only to the `CalendarAdapter`
interface.

| Adapter | id | Direction | Week starts | Notes |
| --- | --- | --- | --- | --- |
| `GregorianCalendarAdapter` | `'gregorian'` | ltr | Sunday | `new GregorianCalendarAdapter(locale = 'en-US')` |
| `JalaliCalendarAdapter` | `'jalali'` | rtl | Saturday | `new JalaliCalendarAdapter(locale = 'fa-IR-u-ca-persian')` |
| `HijriCalendarAdapter` | `'hijri'` | rtl | Saturday | `new HijriCalendarAdapter(config?: NdpHijriConfig)` — tabular civil |

```ts
import {
  GregorianCalendarAdapter,
  JalaliCalendarAdapter,
  HijriCalendarAdapter,
} from '@vahidamirian/datepicker-core';

const en = new GregorianCalendarAdapter('en-US');
const fa = new JalaliCalendarAdapter();               // Persian names + Persian digits
const faGregorian = new GregorianCalendarAdapter('fa-IR'); // Gregorian months, Persian digits
const hijri = new HijriCalendarAdapter({ locale: 'ar', adjustment: -1 });
```

Every adapter exposes the same surface (see the [type reference](#type-reference) for full
signatures):

```ts
fa.getYear(date); fa.getMonth(date); fa.getDayOfMonth(date); fa.getDaysInMonth(date);
fa.createDate(1404, 3, 28);           // Jalali y/m/d → canonical Date
fa.startOfMonth(date); fa.startOfYear(date);
fa.addCalendarMonths(date, 1); fa.addCalendarYears(date, -1);
fa.getMonthLabel(date);   // "خرداد ۱۴۰۴"
fa.getMonthNames();       // ["فروردین", …]
fa.getYearLabel(date);    // "۱۴۰۴"
fa.getDayLabel(date);     // "۲۸"
fa.getWeekdayLabels();    // ["ش","ی","د","س","چ","پ","ج"]
fa.format(date);          // "چهارشنبه ۲۸ خرداد"
fa.isWeekend(date);       // Friday in Jalali
fa.parse('1404/3/28'); fa.formatInput(date);
```

### Hijri configuration (`NdpHijriConfig`)

```ts
interface NdpHijriConfig {
  locale?: string;                      // digits + weekday labels. Default 'fa-IR'
  monthNames?: readonly string[];       // 12 names, Muharram first. Default Persian names
  adjustment?: NdpHijriDayAdjustment;   // shift the tabular result. Default 0
}

type NdpHijriDayAdjustment =
  | number                              // fixed offset, e.g. -1
  | ((date: Date) => number)            // per-date function / lookup table
  | NdpHijriDayAdjuster;                // an object with getDayAdjustment(date): number
```

The tabular math is deterministic (never `Intl`-based for the y/m/d fields), so the
`adjustment` stays consistent across both labels and math. `+1` means the locally observed
calendar runs one day ahead of the tabular one; keep the offset stable within any one Hijri
month so round-trips stay exact.

## Conversion math (`JalaaliMath` / `HijriMath`)

Pure numeric conversion, no `Date` juggling and no adapter needed. Exported as namespaces:

```ts
import { JalaaliMath, HijriMath } from '@vahidamirian/datepicker-core';

// Jalali
JalaaliMath.toJalaali(new Date(2026, 2, 21)); // { jy: 1405, jm: 1, jd: 1 }
JalaaliMath.toGregorian(1404, 1, 1);          // { gy: 2025, gm: 3, gd: 21 }
JalaaliMath.jalaaliMonthLength(1403, 12);     // 30 (leap year) | 29
JalaaliMath.isLeapJalaaliYear(1403);          // true

// Hijri (tabular Islamic civil)
HijriMath.toHijri(new Date(2026, 5, 12));     // { hy: 1447, hm: 12, hd: 26 }
HijriMath.toGregorian(1447, 12, 26);          // { gy: 2026, gm: 6, gd: 12 }
HijriMath.hijriMonthLength(1446, 12);         // 29 (common) | 30 (leap)
HijriMath.isLeapHijriYear(1445);              // true (30-year cycle)
```

Rebuild a `Date` from a numeric result when you need one:

```ts
const g = JalaaliMath.toGregorian(1404, 1, 1);
const date = new Date(g.gy, g.gm - 1, g.gd);
```

> The conversion is dependency-free and unit-verified against the platform `Intl` Persian /
> `islamic-civil` calendars, including leap years and month lengths.

## Parsing, formatting & digits

`CalendarAdapter` gives you round-trippable, machine-readable date I/O in any calendar:

```ts
const cal = new JalaliCalendarAdapter();

cal.parse('۱۴۰۴/۰۳/۲۸');   // Date (Gregorian midnight) or null
cal.parse('1404/3/28');     // same — ASCII + loose separators (/ - .) ok
cal.parse('1404/07/31');    // null — Mehr has 30 days (round-trip validated)
cal.formatInput(new Date()); // "۱۴۰۴/۰۳/۲۸"  (compact, editable — inverse of parse)

cal.maskInput('14040328');   // "۱۴۰۴/۰۳/۲۸"  (group digits, insert separators as you type)
cal.getInputMask();          // [4, 2, 2]      (segment widths)
cal.getInputFormatHint();    // "سال/ماه/روز"  (placeholder hint)
cal.formatNumber(9, 2);      // "۰۹"           (localized, zero-padded)
```

`format()` produces a *written-out* string (`"چهارشنبه ۲۸ خرداد"`) for display, while
`formatInput()` / `parse()` are the compact round-trippable pair for text inputs.

Standalone digit helpers:

```ts
import { toLatinDigits, toPersianDigits } from '@vahidamirian/datepicker-core';

toLatinDigits('۱۴۰۴/۰۳/۲۸'); // "1404/03/28"  (Persian & Arabic-Indic → ASCII)
toPersianDigits('1404');      // "۱۴۰۴"
```

## Date arithmetic — add / subtract

Use the adapter for **calendar-correct** month/year math (it knows month lengths and leap
years in its own calendar), and raw `Date` math for day offsets:

```ts
const cal = new JalaliCalendarAdapter();

cal.addCalendarMonths(date, 1);   // next Jalali month, day-of-month preserved where possible
cal.addCalendarMonths(date, -3);  // subtract three Jalali months
cal.addCalendarYears(date, 1);    // next Jalali year (12-month shift by default)
cal.startOfMonth(date);           // first day of the current Jalali month
cal.startOfYear(date);            // 1 Farvardin of the current Jalali year

// Whole days (calendar-independent):
function addDays(date: Date, n: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}
```

`addCalendarMonths` clamps the day when the target month is shorter (e.g. the 31st of a
Jalali month → the 30th/29th of the next), so you never get an overflow into the following
month.

## View builders (render-ready grids)

The heart of the fast-rendering design: each builder resolves **every** per-cell flag exactly
once and hands back a plain data structure. Your UI reads booleans only — no date comparisons
in the render path.

### `buildMonthView(adapter, monthStart, ctx): MonthView`

Builds a stable 6×7 = 42-cell month grid (leading/trailing padding included so the height
never jumps).

```ts
import { buildMonthView } from '@vahidamirian/datepicker-core';

const view = buildMonthView(cal, new Date(), {
  mode: 'range',
  value: { start: someStart, end: null },
  hovered: hoveredDate,   // previews the tentative range band
  today: new Date(),
  min: null,
  max: null,
  dateFilter: null,       // (d) => boolean — true = selectable
});

view.label;      // "خرداد ۱۴۰۴"
view.weekdays;   // ["ش","ی",…]
view.cells;      // DayCell[42] — each with isSelected / isInRange / isDisabled / isPreview / …
```

### `buildMonthsView(adapter, dateInYear, ctx): PeriodView`

The 12-month grid for the month picker.

### `buildYearsView(adapter, dateInPage, ctx): PeriodView`

One page of the years grid (`YEARS_PER_PAGE` = 12, pages aligned to stable boundaries).

```ts
import { buildMonthsView, buildYearsView, YEARS_PER_PAGE } from '@vahidamirian/datepicker-core';

const months = buildMonthsView(cal, new Date(), { value, today, min: null, max: null });
const years  = buildYearsView(cal, new Date(), { value, today, min: null, max: null });
// each cell: { date, key, label, isCurrent, isSelected, isDisabled }
```

## Selection reducer

A pure, side-effect-free reducer: given the mode, the current selection, and a clicked date,
it returns the next selection — auto-ordering range endpoints regardless of click order.

```ts
import { applySelection, isSelectionComplete, rangeEquals } from '@vahidamirian/datepicker-core';

let value = { start: null, end: null };
value = applySelection('range', value, day1);  // { start: day1, end: null }
value = applySelection('range', value, day0);  // { start: day0, end: day1 } — reordered
value = applySelection('range', value, day5);  // starts a fresh range: { start: day5, end: null }

isSelectionComplete('single', value); // !!start
isSelectionComplete('range', value);  // !!start && !!end
rangeEquals(a, b);                     // structural equality, compared by calendar day
```

## Time-of-day helpers

For the optional time feature: read / write a `Date`'s hours & minutes without disturbing its
calendar day. All pure and non-mutating.

```ts
import {
  getTimeOfDay, withTimeOfDay, copyTimeOfDay,
  wrapHours, snapMinutes, stepMinutes, normalizeStep,
} from '@vahidamirian/datepicker-core';

getTimeOfDay(date);              // { hours: 14, minutes: 30 }
withTimeOfDay(date, 9, 0);       // same day at 09:00 (new Date)
copyTimeOfDay(target, source);   // copy source's h:m onto target's day
wrapHours(24);                   // 0   (wraps 0–23)
snapMinutes(37, 15);             // 30  (down to nearest step)
stepMinutes(30, 15, 1);          // 45  (advance by step, wrap in the hour)
normalizeStep(0);                // 1   (coerce a step into 1–30)
```

## Date-key utilities

```ts
import { atMidnight, dayKey, isSameDay, clampDate } from '@vahidamirian/datepicker-core';

atMidnight(date);                // strip time-of-day (new Date)
dayKey(date);                    // 20260321 — numeric yyyymmdd for cheap comparison
isSameDay(a, b);                 // same calendar day, ignoring time (null-safe)
clampDate(date, min, max);       // clamp into inclusive [min, max], returns a midnight Date
```

## Writing a custom calendar adapter

Extend `CalendarAdapter` and implement the abstract members; the rest have working defaults
built only on those, so a minimal adapter compiles and works everywhere (including `parse`,
`formatInput`, `maskInput`, `addCalendarYears`, `startOfYear`, month/year labels).

```ts
import { CalendarAdapter } from '@vahidamirian/datepicker-core';

export class MyCalendarAdapter extends CalendarAdapter {
  readonly id = 'mycal';
  readonly direction = 'ltr' as const;
  readonly weekStartsOn = 1; // Monday (JS getDay 0=Sun … 6=Sat)

  getYear(date: Date): number { /* … */ return 0; }
  getMonth(date: Date): number { /* 1-based */ return 1; }
  getDayOfMonth(date: Date): number { /* 1-based */ return 1; }
  getDaysInMonth(date: Date): number { /* … */ return 30; }
  createDate(year: number, month: number, day: number): Date { /* → canonical midnight Date */ return new Date(); }
  addCalendarMonths(date: Date, delta: number): Date { /* preserve day-of-month */ return new Date(); }
  startOfMonth(date: Date): Date { /* first day, midnight */ return new Date(); }

  getMonthLabel(date: Date): string { return ''; }  // "August 2023"
  getDayLabel(date: Date): string { return ''; }    // "12"
  getWeekdayLabels(): readonly string[] { return []; } // 7 names from weekStartsOn
  format(date: Date): string { return ''; }         // "Wednesday, August 23"
  isWeekend(date: Date): boolean { return false; }

  // Optional overrides for a richer month/year picker & localized numerals:
  // override getMonthNames() { … }
  // override getYearLabel(date) { … }
  // override addCalendarYears(date, delta) { … }   // non-12-month calendars only
  // protected override localizeNumber(v, pad) { … } // native digits
}
```

Register it with either framework package (or use it headlessly): no component changes are
ever required — the whole UI talks only to this interface.

## Building a headless picker (worked example)

Compose the view builder + selection reducer to drive your own markup:

```ts
import {
  JalaliCalendarAdapter, buildMonthView, applySelection, atMidnight,
  type DateRange,
} from '@vahidamirian/datepicker-core';

const cal = new JalaliCalendarAdapter();
let value: DateRange = { start: null, end: null };
let month = atMidnight(new Date());

function render() {
  const view = buildMonthView(cal, month, {
    mode: 'range', value, hovered: null,
    today: atMidnight(new Date()), min: null, max: null, dateFilter: null,
  });

  // view.label → heading; view.weekdays → header row
  for (const cell of view.cells) {
    // read cell.label, cell.isSelected, cell.isInRange, cell.isDisabled, cell.inCurrentMonth …
    // wire a click to:
    //   if (!cell.isDisabled && cell.inCurrentMonth) { value = applySelection('range', value, cell.date); render(); }
  }
}
```

Both framework packages are literally this pattern wrapped in signals / refs — see
`useDatepicker` in the [Vue package](../vue) for a full reference implementation.

## Type reference

```ts
type DatepickerMode = 'single' | 'range' | 'month' | 'year';
type CalendarView   = 'day' | 'month' | 'year';
type NdpTheme       = 'light' | 'dark' | 'auto';
type NdpAnimation   = 'none' | 'slide';
type DayKey         = number;                 // yyyymmdd
type DateFilterFn   = (date: Date) => boolean;

interface DateRange { start: Date | null; end: Date | null }
interface TimeOfDay { hours: number; minutes: number }

interface DayCell {
  date: Date; key: DayKey; label: string; dayOfMonth: number; weekday: number;
  inCurrentMonth: boolean; isToday: boolean; isWeekend: boolean; isDisabled: boolean;
  isSelected: boolean; isRangeStart: boolean; isRangeEnd: boolean;
  isInRange: boolean; isPreview: boolean;
}
interface MonthView { monthStart: Date; label: string; weekdays: readonly string[]; cells: DayCell[] }

interface PeriodCell { date: Date; key: number; label: string; isCurrent: boolean; isSelected: boolean; isDisabled: boolean }
interface PeriodView { label: string; cells: PeriodCell[] }
```

## Full export list

- **Adapters:** `CalendarAdapter`, `GregorianCalendarAdapter`, `JalaliCalendarAdapter`,
  `HijriCalendarAdapter` (+ `NdpHijriConfig`, `NdpHijriDayAdjustment`, `NdpHijriDayAdjuster`)
- **Math:** `JalaaliMath.*`, `HijriMath.*`
- **View builders:** `buildMonthView`, `buildMonthsView`, `buildYearsView`, `YEARS_PER_PAGE`
  (+ `MonthContext`, `PeriodContext`)
- **Selection:** `applySelection`, `isSelectionComplete`, `rangeEquals`
- **Time:** `getTimeOfDay`, `withTimeOfDay`, `copyTimeOfDay`, `wrapHours`, `snapMinutes`,
  `stepMinutes`, `normalizeStep`
- **Utilities:** `atMidnight`, `dayKey`, `isSameDay`, `clampDate`, `toLatinDigits`,
  `toPersianDigits`
- **Types:** `DateRange`, `DayCell`, `MonthView`, `PeriodCell`, `PeriodView`, `TimeOfDay`,
  `DatepickerMode`, `CalendarView`, `DayKey`, `DateFilterFn`, `NdpTheme`, `NdpAnimation`

## License

MIT © [Vahid Amirian](https://github.com/vahidamiryan)
