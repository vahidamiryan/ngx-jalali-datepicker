# ngx-jalali-datepicker

[![npm](https://img.shields.io/npm/v/@vahidamirian/ngx-jalali-datepicker)](https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker)

High-performance, customizable, framework-idiomatic date picker for Angular 20+.
Built on **signals**, an **OnPush + zoneless** rendering model, a pluggable
**calendar adapter** layer (Jalali / Shamsi + Gregorian + Hijri out of the box), and a
**headless core** you can reuse to build a completely custom UI.

**npm:** [https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker](https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker)

## Why this design

| Goal | How it's achieved |
| --- | --- |
| **Performance** | Every per-day flag (selected / in-range / disabled / preview / today) is precomputed once in a `computed` (`buildMonthView`). Templates read only booleans — no `toDateString()` or `[ngClass]` object literals re-evaluated per cell per change-detection cycle. Comparisons use numeric `yyyymmdd` keys, never string allocations. |
| **Customizability** | Built-in light / dark / auto themes (`theme` input). Theme entirely via CSS custom properties (`--ndp-*`), set in your stylesheet or programmatically with the `customVars` input. Replace the day cell with content projection (`ng-template ndpDayCell`). Swap or add calendars by implementing `CalendarAdapter`. |
| **Maintainability** | Pure, testable headless core (`buildMonthView`, `applySelection`, adapters) is fully decoupled from the Angular components. No domain logic (pricing, etc.) baked into the core. |
| **Correctness** | Jalaali math is a faithful port of the battle-tested `jalaali-js` algorithm and is unit-verified against the platform `Intl` Persian calendar. Hijri math is the pure tabular Islamic (civil) algorithm, unit-verified day-by-day against `Intl` `islamic-civil`. |

## Installation

```bash
npm install @vahidamirian/ngx-jalali-datepicker
```

Package on npm: https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker

## Quick start

Provide the calendars once, then drop the component in a template.

```ts
// app.config.ts
import { provideNgxDatepicker, JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamirian/ngx-jalali-datepicker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideNgxDatepicker(new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')),
  ],
};
```

```html
<!-- Single date -->
<ndp-datepicker [(value)]="value" />

<!-- Range, two months, no past dates (min also blocks back-navigation) -->
<ndp-datepicker mode="range" [numberOfMonths]="2" [min]="today" [(value)]="range" />

<!-- Reactive forms (ControlValueAccessor) -->
<ndp-datepicker [formControl]="ctrl" />

<!-- Hide the selected-date summary bar but keep the footer action buttons -->
<ndp-datepicker [showSummary]="false" [(value)]="value" />

<!-- Custom day cell -->
<ndp-datepicker [(value)]="value">
  <ng-template ndpDayCell let-day>
    {{ day.label }} @if (day.isWeekend) { <i></i> }
  </ng-template>
</ndp-datepicker>
```

> Note: `value` is a `DateRange` (`{ start, end }`). In `single` mode only
> `start` is populated.

## Month & year picker + quick navigation

Set `mode` to `"month"` or `"year"` to pick a whole period. The body becomes a
12-month grid (or a paged year grid); selecting commits `value.start` as the
**first day of the chosen month/year** (`end` stays null), so the value contract
is still a plain `Date`.

```html
<!-- Month picker — body shows the 12 months of the active year -->
<ndp-datepicker mode="month" [(value)]="month" />

<!-- Year picker — body shows a paged grid of years (‹ › steps a page) -->
<ndp-datepicker mode="year" [(value)]="year" />
```

```ts
// Label a committed month/year with the adapter
const cal = new JalaliCalendarAdapter();
cal.getMonthLabel(month().start!); // "خرداد ۱۴۰۴"
cal.getYearLabel(year().start!);   // "۱۴۰۴"
```

In **day** mode (`single` / `range`) the header shows separate **month** and
**year** dropdowns — click either to jump straight to a month or year instead of
clicking `‹ ›` repeatedly. The menu closes on `Esc` or an outside click. This
quick navigation needs no configuration; it's always on in day mode.

## Dual-script (Gregorian alongside Jalali)

Set `showSecondaryDate` to render each date in a second calendar at the same time
— Gregorian under Jalali, or vice-versa when the active calendar is Gregorian.
The secondary defaults to the first *other* registered calendar; override it with
`secondaryCalendar`.

```html
<ndp-datepicker [showSecondaryDate]="true" [(value)]="value" />
<!-- force a specific companion calendar -->
<ndp-datepicker [showSecondaryDate]="true" secondaryCalendar="gregorian" [(value)]="value" />
```

The month heading shows the companion month range (months don't line up 1:1) and
the footer summary shows the companion full date.

## Theming (light / dark / custom)

The picker ships with three built-in themes selected via the `theme` input:

```html
<ndp-datepicker theme="light" [(value)]="value" />  <!-- default -->
<ndp-datepicker theme="dark"  [(value)]="value" />
<ndp-datepicker theme="auto"  [(value)]="value" />  <!-- follows the OS prefers-color-scheme -->
```

`theme` only swaps the default palette of design tokens — every colour, radius
and spacing value is a CSS custom property (`--ndp-*`) you can override.

**Override in CSS** (cascades, so you can scope it to one instance or globally):

```css
ndp-datepicker {
  --ndp-accent: #8b5cf6;
  --ndp-accent-hover: #7c3aed;
  --ndp-range-bg: rgba(139, 92, 246, 0.18); /* translucent → works on any surface */
  --ndp-radius: 18px;
}
```

**Override programmatically** with the `customVars` input — handy for runtime or
theme-driven values. These are applied as inline styles, so they win over both
the built-in theme and your stylesheet:

```ts
readonly brand: Record<string, string> = {
  '--ndp-accent': '#8b5cf6',
  '--ndp-range-bg': 'rgba(139, 92, 246, 0.18)',
};
```

```html
<ndp-datepicker theme="dark" [customVars]="brand" [(value)]="value" />
```

### Theme tokens

| Token | Purpose |
| --- | --- |
| `--ndp-accent` / `--ndp-accent-hover` / `--ndp-accent-contrast` | Selected day fill, its hover, and the text on it. |
| `--ndp-range-bg` / `--ndp-range-color` | Committed range band background and text. |
| `--ndp-preview-bg` | Tentative (hover) range band background. |
| `--ndp-focus-ring` | Keyboard focus ring. |
| `--ndp-today-border` | "Today" outline. |
| `--ndp-weekend-color` | Weekend day text. |
| `--ndp-surface` / `--ndp-border` / `--ndp-text` / `--ndp-muted` | Panel background, borders, primary and muted text. |
| `--ndp-day-color` / `--ndp-weekday-color` / `--ndp-day-outside-color` | Day text, weekday header text, and faded out-of-month days. Default to `--ndp-text` / `--ndp-muted` so they follow the theme automatically. |
| `--ndp-day-hover-bg` | Day / nav / button hover background. |
| `--ndp-shadow` | Panel drop shadow. |
| `--ndp-radius` / `--ndp-day-radius` | Panel and day-cell corner radius. |
| `--ndp-slide-duration` / `--ndp-slide-easing` / `--ndp-slide-distance` | Tuning for the `animation="slide"` navigation transition (duration, timing function, travel distance). |

## Typing dates (input field)

Sometimes clicking through a calendar is slower than just typing `1404/03/28`.
Two complementary options cover that:

**`<ndp-date-input>`** — a text field with a calendar popover. Type to parse, or
open the panel to pick; selecting writes the text back. It is a
`ControlValueAccessor` and forwards the usual picker inputs.

```html
<!-- Single -->
<ndp-date-input [(value)]="value" />

<!-- Range — shows two fields (start / end), kept in order -->
<ndp-date-input mode="range" [min]="today" [(value)]="range" />

<!-- Reactive forms -->
<ndp-date-input [formControl]="ctrl" />
```

**`showInput`** — render the same typing field(s) inside the panel itself
(day modes only), above the grid:

```html
<ndp-datepicker [showInput]="true" [(value)]="value" />
```

Both accept `/`, `-` or `.` separators and Persian/Arabic-Indic digits, and an
impossible date (month 13, the 31st of a 30-day month, …) is flagged
(`aria-invalid`) without changing the value.

## Time of day

Set `showTime` (single mode only) to render an hours : minutes stepper under the
grid. The selected value's `Date` carries the chosen time, so `value.start`
becomes a full timestamp rather than local midnight. Picking another day keeps
the clock, and typing in `<ndp-date-input>` preserves it too. `minuteStep` (1–30,
default `1`) sets the increment for the steppers and the `↑`/`↓` arrow keys.

```html
<!-- Pick a day, then set the time. 5-minute increments. -->
<ndp-datepicker [showTime]="true" [minuteStep]="5" [(value)]="value" />

<!-- Also available inside the typed field's popover -->
<ndp-date-input [showTime]="true" [(value)]="value" />
```

The digits render in the active calendar's own numerals. Read or set the time
headlessly with the exported helpers:

```ts
import { getTimeOfDay, withTimeOfDay } from '@vahidamirian/ngx-jalali-datepicker';

getTimeOfDay(value().start!);              // { hours: 14, minutes: 30 }
withTimeOfDay(value().start!, 9, 0);       // same day at 09:00 (a new Date)
```

> Only `single` mode carries a time. `range` / `month` / `year` keep their
> midnight-based value contract, so `showTime` is ignored outside single mode.

### Time only (no calendar)

**`<ndp-time-input>`** is a standalone field for picking **just** a time — a text
input showing `HH:mm` with a stepper popover, no calendar. Type `0930` (Persian
or ASCII digits) or open the popover to step. Its value is a `Date` carrying the
time (the day is today unless one is written in), so it drops straight into the
`Date`-based API and works as a `ControlValueAccessor`.

```html
<ndp-time-input [(value)]="time" />                 <!-- value: Date | null -->
<ndp-time-input [minuteStep]="15" [(value)]="time" />
<ndp-time-input [formControl]="timeCtrl" />          <!-- reactive forms -->
```

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` (model) | `Date \| null` | `null` | Two-way; also a `ControlValueAccessor`. The date's *time* is what matters. |
| `minuteStep` | `number` | `1` | Minute increment for the stepper / arrow keys (1–30). |
| `calendar` (model) | `string` | first registered | Calendar whose numerals the digits render in. |
| `theme` / `customVars` | — | — | Same theming as the picker. |
| `placeholder` | `string` | `'HH:mm'` | Field placeholder. |
| `inputId` | `string \| null` | `null` | `id` on the input for an external `<label for>`. |
| `closeOnSelect` | `boolean` | `false` | Close the popover after a stepper change. |

**Output:** `(timeSelected)` emits the `Date` on every commit (typed or stepped).

### Parsing without UI

`parse` / `formatInput` live on `CalendarAdapter`, so you can convert a typed
string to a `Date` (and back) headlessly, in any registered calendar:

```ts
const cal = new JalaliCalendarAdapter();
cal.parse('۱۴۰۴/۰۳/۲۸');        // Date (Gregorian midnight) or null
cal.parse('1404/3/28');          // same — ASCII + loose separators ok
cal.parse('1404/07/31');         // null — Mehr has 30 days
cal.formatInput(new Date());     // "۱۴۰۴/۰۳/۲۸"
```

### `DateInputComponent` inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` (model) | `DateRange` | `{start:null,end:null}` | Two-way; also a `ControlValueAccessor`. |
| `calendar` (model) | `string` | first registered | Active calendar id. |
| `mode` | `'single' \| 'range'` | `'single'` | `range` renders two fields. |
| `min` / `max` / `dateFilter` | — | — | Forwarded to the panel. |
| `theme` / `animation` / `numberOfMonths` / `showSecondaryDate` / `secondaryCalendar` / `customVars` | — | — | Forwarded to the panel. |
| `showFooter` | `boolean` | `true` | Panel footer (Today / Clear / toggle). |
| `showTime` / `minuteStep` | — | — | Forwarded to the panel (single mode). See [Time of day](#time-of-day). The popover stays open while time is on. |
| `placeholder` | `string \| null` | adapter hint | Field placeholder. |
| `inputId` | `string \| null` | `null` | `id` on the start field for an external `<label for>`. |
| `closeOnSelect` | `boolean \| null` | `null` | Close the popover after a pick. `null` = close in single, stay open in range. |

**Output:** `(dateSelected)` emits the `DateRange` on every commit (typed or picked).

## Building a dropdown / popover

The component is just a panel — wrap it however you like. In `single` mode it
fires `(dateSelected)` on the first click, which is the natural moment to close:

```ts
@Component({ /* … */ imports: [DatepickerComponent] })
export class FieldComponent {
  readonly open = signal(false);
  readonly value = signal<DateRange>({ start: null, end: null });
  private readonly cal = new JalaliCalendarAdapter();
  readonly label = computed(() => {
    const s = this.value().start;
    return s ? this.cal.format(s) : 'Pick a date';
  });
}
```

```html
<div class="dropdown">
  <button (click)="open.update(v => !v)">{{ label() }} ▾</button>
  @if (open()) {
    <div class="backdrop" (click)="open.set(false)"></div>
    <div class="panel">
      <ndp-datepicker
        [showFooter]="false"
        [value]="value()"
        (valueChange)="value.set($event)"
        (dateSelected)="open.set(false)" />
    </div>
  }
</div>
```

## Converting Gregorian ⇆ Jalali (no UI)

Everything needed for conversion is exported, so you can use it headlessly.

```ts
import { JalaaliMath, JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamirian/ngx-jalali-datepicker';

// Gregorian → Jalali (numeric)
const j = JalaaliMath.toJalaali(new Date(2026, 2, 21)); // { jy: 1405, jm: 1, jd: 1 }

// Jalali → Gregorian (numeric)
const g = JalaaliMath.toGregorian(1404, 1, 1);          // { gy: 2025, gm: 3, gd: 21 }
const date = new Date(g.gy, g.gm - 1, g.gd);

// Localized, written-out strings via the adapters
const jalali = new JalaliCalendarAdapter().format(new Date());     // "شنبه ۱۷ خرداد"
const greg   = new GregorianCalendarAdapter('en-US').format(new Date()); // "Saturday, June 7"
```

> The conversion math is dependency-free and verified against the platform
> `Intl` Persian calendar, including leap years and month lengths.

## Hijri (Islamic civil) calendar

`HijriCalendarAdapter` implements the **tabular Islamic civil** calendar: a
fully arithmetic 30-year cycle (leap years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26,
29), 354/355-day years, and months alternating 30/29 days (Dhu al-Hijjah gains
a 30th day in leap years). It is deliberately **not** Umm al-Qura and **not**
sighting-based, so results are deterministic and identical in every region and
runtime.

```ts
provideNgxDatepicker(new HijriCalendarAdapter(), new JalaliCalendarAdapter())
```

The math is exported headlessly as well:

```ts
import { HijriMath } from '@vahidamirian/ngx-jalali-datepicker';

HijriMath.toHijri(new Date(2026, 5, 12));  // { hy: 1447, hm: 12, hd: 26 }
HijriMath.toGregorian(1447, 12, 26);       // { gy: 2026, gm: 6, gd: 12 }
HijriMath.isLeapHijriYear(1445);           // true (cycle year 5)
HijriMath.hijriMonthLength(1446, 12);      // 29 (common year)
```

### Day adjustment (observed vs. tabular)

Locally observed Hijri calendars (moon sighting, Umm al-Qura) can differ from
the tabular computation by ±1–2 days, and the correct offset depends on country
and year — there is no universal rule. Instead of baking regional data into the
library, the adapter accepts an `adjustment` in its config that shifts the
tabular result by whole days. Supply it **manually** or **as a service**:

```ts
// 1) Manual — fixed offset
new HijriCalendarAdapter({ adjustment: -1 })

// 2) Manual — function, e.g. backed by a lookup table you maintain
new HijriCalendarAdapter({ adjustment: (date) => myOffsetFor(date) })

// 3) Service — implement NdpHijriDayAdjuster and pass a factory so inject() works
@Injectable({ providedIn: 'root' })
export class HijriAdjustmentService implements NdpHijriDayAdjuster {
  // Must answer synchronously from data it already holds — preload/cache any
  // remote data before the picker renders.
  getDayAdjustment(date: Date): number { return 0; /* offset for date */ }
}

provideNgxDatepicker(
  () => new HijriCalendarAdapter({ adjustment: inject(HijriAdjustmentService) }),
  new JalaliCalendarAdapter(),
)
```

`+1` means the observed calendar runs one day ahead of the tabular one. Keep the
offset stable within any one Hijri month so round-trips stay exact. Month names
(Persian by default) and the digit/weekday locale are configurable via
`NdpHijriConfig` (`monthNames`, `locale`) — labels always follow the adjusted
math, never raw `Intl` formatting.

## Public API

- **Components:** `DatepickerComponent` (`ndp-datepicker`), `DateInputComponent` (`ndp-date-input`), `TimePickerComponent` (`ndp-time-picker`), `TimeInputComponent` (`ndp-time-input`), `CalendarMonthComponent` (`ndp-calendar-month`), `CalendarPeriodComponent` (`ndp-calendar-period`)
- **Directive:** `NdpDayCellTemplate` (`ng-template[ndpDayCell]`)
- **Adapters:** `CalendarAdapter` (abstract), `GregorianCalendarAdapter`, `JalaliCalendarAdapter`, `HijriCalendarAdapter` (+ `NdpHijriConfig`, `NdpHijriDayAdjustment`, `NdpHijriDayAdjuster`)
- **Headless core:** `buildMonthView`, `buildMonthsView`, `buildYearsView`, `applySelection`, `rangeEquals`, `isSelectionComplete`, `dayKey`, `atMidnight`, `toLatinDigits`, `toPersianDigits`, `getTimeOfDay`, `withTimeOfDay`, `copyTimeOfDay`, `snapMinutes`, `stepMinutes`, adapter `parse` / `formatInput` / `formatNumber`, types (`DateRange`, `DayCell`, `MonthView`, `PeriodCell`, `PeriodView`, `TimeOfDay`, `DatepickerMode`, `CalendarView`, `DateFilterFn`, `NdpTheme`, `NdpAnimation`)
- **Config:** `provideNgxDatepicker`, `NDP_CALENDAR_ADAPTERS`

> **Configuration is required.** `provideNgxDatepicker(...)` has no zero-config
> default on purpose — that is what makes the picker fully tree-shakeable. You
> ship only the adapters (and their date-conversion math) you actually register,
> so a Gregorian-only app never bundles the Jalali or Hijri code. Using
> `<ndp-datepicker>` without a `provideNgxDatepicker(...)` provider throws a
> descriptive error.

### `DatepickerComponent` inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` (model) | `DateRange` | `{start:null,end:null}` | Two-way bindable; also a `ControlValueAccessor`. |
| `calendar` (model) | `string` | first registered | Active calendar id, e.g. `'jalali'`/`'gregorian'`. |
| `mode` | `'single' \| 'range' \| 'month' \| 'year'` | `'single'` | See [Month & year picker](#month--year-picker--quick-navigation). |
| `animation` | `'none' \| 'slide'` | `'none'` | Body transition when navigating months/years/pages. Honors `prefers-reduced-motion`. |
| `numberOfMonths` | `number` | `1` | Render N adjacent months. |
| `min` / `max` | `Date \| null` | `null` | Inclusive bounds. |
| `dateFilter` | `(d: Date) => boolean` | `null` | Return `true` if a date is **selectable**. |
| `showSecondaryDate` | `boolean` | `false` | Show each date in a companion calendar (dual-script). |
| `secondaryCalendar` | `string \| null` | `null` | Companion calendar id; defaults to the first other registered calendar. |
| `showFooter` | `boolean` | `true` | Master toggle for the whole footer (summary bar + action buttons). |
| `showSummary` | `boolean` | `true` | Show the selected-date summary bar inside the footer. Set `false` to hide just the summary while keeping the action buttons. |
| `showToday` / `showClear` / `showCalendarToggle` | `boolean` | `true` | Footer action buttons. |
| `showQuickNav` | `boolean` | `true` | Show the month/year quick-navigation dropdowns in the header. Set `false` for a plain, non-interactive month/year label. |
| `showInput` | `boolean` | `false` | Render a typed-date field above the grid (day modes only). See [Typing dates](#typing-dates-input-field). |
| `showTime` | `boolean` | `false` | Render an hours:minutes time picker under the grid (single mode only). The value's `Date` carries the time. See [Time of day](#time-of-day). |
| `minuteStep` | `number` | `1` | Minute increment for the time picker's stepper and arrow keys (clamped 1–30). |

**Output:** `(dateSelected)` emits the `DateRange` on every selection — handy for closing a dropdown.

In **range** mode the summary bar shows a small ✕ next to each endpoint, so the
start or end can be cleared individually without resetting the whole range.

`min` / `max` also gate month navigation: the prev/next buttons (and `PageUp`/`PageDown`) stop at the bound month, so users can't browse into fully out-of-range months.

### Keyboard

`←↑↓→` move focus · `Enter`/`Space` select · `PageUp`/`PageDown` change month ·
`Home`/`End` jump to start/end of month. Arrow direction is mirrored in RTL.

In **month / year** mode the same keys drive the period grid: `←→` move one
month/year, `↑↓` move a row (3 cells), `PageUp`/`PageDown` step the year (month
mode) or page (year mode), and `Enter`/`Space` commit. `Esc` closes an open
quick-nav dropdown.

## Navigation animation

By default the grid swaps instantly when you move between months/years/pages. Set
`animation="slide"` to slide the body in the direction of travel. It honors
`prefers-reduced-motion` (users who ask for less motion get the instant swap), and you can
tune it with three CSS variables:

```html
<ndp-datepicker animation="slide" [(value)]="value" />
```

```css
ndp-datepicker {
  --ndp-slide-duration: 220ms;
  --ndp-slide-easing: cubic-bezier(0.22, 1, 0.36, 1);
  --ndp-slide-distance: 24px;
}
```

## Bounds & disabling days

Three complementary inputs control which days can be picked. All are enforced by the core, so
keyboard navigation and typed input respect them too.

| Input | Effect |
| --- | --- |
| `min` | Days before it are disabled; `‹`/`PageUp` stop at its month. |
| `max` | Days after it are disabled; `›`/`PageDown` stop at its month. |
| `dateFilter` | A predicate — return `true` to keep a day **selectable**, `false` to disable it. |

```ts
// No Fridays (weekend in the Jalali calendar)
readonly noFridays = (d: Date) => d.getDay() !== 5;

// Block a fixed list of holidays (compare by ISO day)
private readonly holidays = new Set(['2026-03-21', '2026-03-22']);
readonly notHoliday = (d: Date) => !this.holidays.has(d.toISOString().slice(0, 10));

// Combine rules
readonly selectable = (d: Date) => this.noFridays(d) && this.notHoliday(d);
```

```html
<ndp-datepicker [min]="today" [dateFilter]="selectable" [(value)]="value" />
```

`min` / `max` compare by calendar **day** (time-of-day is ignored).

## Date arithmetic — add / subtract

You rarely need a date library. The active adapter does calendar-correct arithmetic (it knows
month lengths and leap years in *its* calendar), and the core exports numeric helpers.

```ts
import { JalaliCalendarAdapter } from '@vahidamirian/ngx-jalali-datepicker';
const cal = new JalaliCalendarAdapter();

cal.addCalendarMonths(new Date(), 1);   // next Jalali month (day-of-month preserved/clamped)
cal.addCalendarMonths(new Date(), -3);  // three Jalali months ago
cal.addCalendarYears(new Date(), 1);    // next Jalali year
cal.startOfMonth(new Date());           // first day of the current Jalali month
cal.startOfYear(new Date());            // 1 Farvardin of the current year
```

Whole days are calendar-independent:

```ts
function addDays(date: Date, n: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}
```

Use these to build dynamic bounds with signals — e.g. "only the next 30 days":

```ts
readonly today = atMidnight(new Date());
readonly max = computed(() => addDays(this.today, 30));
```

```html
<ndp-datepicker [min]="today" [max]="max()" [(value)]="value" />
```

For pure numeric conversion (no `Date` juggling), reach for `JalaaliMath` / `HijriMath` — see
[Converting Gregorian ⇆ Jalali](#converting-gregorian--jalali-no-ui).

## Recipes

**Booking window — next 30 days, no weekends:**

```html
<ndp-datepicker [min]="today" [max]="max()" [dateFilter]="noFridays" [(value)]="value" />
```

**Range capped to a maximum span** (e.g. 14 nights) — clamp `max` reactively to the chosen
start:

```ts
readonly max = computed(() => {
  const r = this.range();
  return r.start && !r.end ? addDays(r.start, 14) : null;
});
```

**Persist as ISO and restore:**

```ts
const iso = this.value().start?.toISOString() ?? null;      // save
this.value.set({ start: iso ? new Date(iso) : null, end: null }); // restore
```

**Reactive forms with validation:**

```ts
readonly ctrl = new FormControl<DateRange>({ start: null, end: null }, {
  validators: (c) => (c.value?.start ? null : { required: true }),
});
```

```html
<ndp-datepicker [formControl]="ctrl" />
```

**A "billing month" selector** — commit a whole month as a plain `Date`:

```html
<ndp-datepicker mode="month" [(value)]="month" />
```

## Adding a calendar

Implement `CalendarAdapter` and register it:

```ts
provideNgxDatepicker(new MyEthiopianAdapter(), new GregorianCalendarAdapter())
```

When the adapter needs an Angular service, pass a factory instead of an
instance — factories run inside the injection context, so `inject()` works:

```ts
provideNgxDatepicker(() => new MyEthiopianAdapter(inject(MyService)))
```

No component changes required — the entire UI talks only to the adapter interface.
For the month/year picker, override `getMonthNames()` and `getYearLabel()` to get
localized names/digits; `startOfYear()` and `addCalendarYears()` already have
working defaults (a 12-month shift) you only need to replace for non-twelve-month
calendars.
