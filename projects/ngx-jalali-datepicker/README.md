# ngx-jalali-datepicker

[![npm](https://img.shields.io/npm/v/@vahidamirian/ngx-jalali-datepicker)](https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker)

High-performance, customizable, framework-idiomatic date picker for Angular 20+.
Built on **signals**, an **OnPush + zoneless** rendering model, a pluggable
**calendar adapter** layer (Jalali / Shamsi + Gregorian out of the box), and a
**headless core** you can reuse to build a completely custom UI.

**npm:** [https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker](https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker)

## Why this design

| Goal | How it's achieved |
| --- | --- |
| **Performance** | Every per-day flag (selected / in-range / disabled / preview / today) is precomputed once in a `computed` (`buildMonthView`). Templates read only booleans — no `toDateString()` or `[ngClass]` object literals re-evaluated per cell per change-detection cycle. Comparisons use numeric `yyyymmdd` keys, never string allocations. |
| **Customizability** | Built-in light / dark / auto themes (`theme` input). Theme entirely via CSS custom properties (`--ndp-*`), set in your stylesheet or programmatically with the `customVars` input. Replace the day cell with content projection (`ng-template ndpDayCell`). Swap or add calendars by implementing `CalendarAdapter`. |
| **Maintainability** | Pure, testable headless core (`buildMonthView`, `applySelection`, adapters) is fully decoupled from the Angular components. No domain logic (pricing, etc.) baked into the core. |
| **Correctness** | Jalaali math is a faithful port of the battle-tested `jalaali-js` algorithm and is unit-verified against the platform `Intl` Persian calendar. |

## Installation

```bash
npm install @vahidamirian/ngx-jalali-datepicker
```

Package on npm: https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker

## Use in this workspace (dev)

The demo app consumes the library directly from source via a `tsconfig` path
mapping, so no pre-build is needed during development.

```ts
// app.config.ts
import { provideNgxDatepicker, JalaliCalendarAdapter, GregorianCalendarAdapter } from 'ngx-jalali-datepicker';

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
import { JalaaliMath, JalaliCalendarAdapter, GregorianCalendarAdapter } from 'ngx-jalali-datepicker';

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

## Public API

- **Components:** `DatepickerComponent` (`ndp-datepicker`), `CalendarMonthComponent` (`ndp-calendar-month`), `CalendarPeriodComponent` (`ndp-calendar-period`)
- **Directive:** `NdpDayCellTemplate` (`ng-template[ndpDayCell]`)
- **Adapters:** `CalendarAdapter` (abstract), `GregorianCalendarAdapter`, `JalaliCalendarAdapter`
- **Headless core:** `buildMonthView`, `buildMonthsView`, `buildYearsView`, `applySelection`, `rangeEquals`, `isSelectionComplete`, `dayKey`, `atMidnight`, types (`DateRange`, `DayCell`, `MonthView`, `PeriodCell`, `PeriodView`, `DatepickerMode`, `CalendarView`, `DateFilterFn`, `NdpTheme`, `NdpTheme`)
- **Config:** `provideNgxDatepicker`, `NDP_CALENDAR_ADAPTERS`

### `DatepickerComponent` inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` (model) | `DateRange` | `{start:null,end:null}` | Two-way bindable; also a `ControlValueAccessor`. |
| `calendar` (model) | `string` | first registered | Active calendar id, e.g. `'jalali'`/`'gregorian'`. |
| `mode` | `'single' \| 'range'` | `'single'` | |
| `numberOfMonths` | `number` | `1` | Render N adjacent months. |
| `min` / `max` | `Date \| null` | `null` | Inclusive bounds. |
| `dateFilter` | `(d: Date) => boolean` | `null` | Return `true` if a date is **selectable**. |
| `showSecondaryDate` | `boolean` | `false` | Show each date in a companion calendar (dual-script). |
| `secondaryCalendar` | `string \| null` | `null` | Companion calendar id; defaults to the first other registered calendar. |
| `showFooter` | `boolean` | `true` | Master toggle for the whole footer (summary bar + action buttons). |
| `showSummary` | `boolean` | `true` | Show the selected-date summary bar inside the footer. Set `false` to hide just the summary while keeping the action buttons. |
| `showToday` / `showClear` / `showCalendarToggle` | `boolean` | `true` | Footer action buttons. |
| `showQuickNav` | `boolean` | `true` | Show the month/year quick-navigation dropdowns in the header. Set `false` for a plain, non-interactive month/year label. |

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

## Adding a calendar

Implement `CalendarAdapter` and register it:

```ts
provideNgxDatepicker(new MyHijriAdapter(), new GregorianCalendarAdapter())
```

No component changes required — the entire UI talks only to the adapter interface.
For the month/year picker, override `getMonthNames()` and `getYearLabel()` to get
localized names/digits; `startOfYear()` and `addCalendarYears()` already have
working defaults (a 12-month shift) you only need to replace for non-twelve-month
calendars.
