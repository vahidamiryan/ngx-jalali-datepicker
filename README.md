# ngx-jalali-datepicker

High-performance, customizable, framework-idiomatic date picker for Angular 20+.
Built on **signals**, an **OnPush + zoneless** rendering model, a pluggable
**calendar adapter** layer (Jalali / Shamsi + Gregorian out of the box), and a
**headless core** you can reuse to build a completely custom UI.

## Why this design

| Goal | How it's achieved |
| --- | --- |
| **Performance** | Every per-day flag (selected / in-range / disabled / preview / today) is precomputed once in a `computed` (`buildMonthView`). Templates read only booleans — no `toDateString()` or `[ngClass]` object literals re-evaluated per cell per change-detection cycle. Comparisons use numeric `yyyymmdd` keys, never string allocations. |
| **Customizability** | Theme entirely via CSS custom properties (`--ndp-*`). Replace the day cell with content projection (`ng-template ndpDayCell`). Swap or add calendars by implementing `CalendarAdapter`. |
| **Maintainability** | Pure, testable headless core (`buildMonthView`, `applySelection`, adapters) is fully decoupled from the Angular components. No domain logic (pricing, etc.) baked into the core. |
| **Correctness** | Jalaali math is a faithful port of the battle-tested `jalaali-js` algorithm and is unit-verified against the platform `Intl` Persian calendar. |

## Install / use in this workspace

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

- **Components:** `DatepickerComponent` (`ndp-datepicker`), `CalendarMonthComponent` (`ndp-calendar-month`)
- **Directive:** `NdpDayCellTemplate` (`ng-template[ndpDayCell]`)
- **Adapters:** `CalendarAdapter` (abstract), `GregorianCalendarAdapter`, `JalaliCalendarAdapter`
- **Headless core:** `buildMonthView`, `applySelection`, `rangeEquals`, `isSelectionComplete`, `dayKey`, `atMidnight`, types (`DateRange`, `DayCell`, `MonthView`, `DatepickerMode`, `DateFilterFn`)
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

**Output:** `(dateSelected)` emits the `DateRange` on every selection — handy for closing a dropdown.

In **range** mode the summary bar shows a small ✕ next to each endpoint, so the
start or end can be cleared individually without resetting the whole range.

`min` / `max` also gate month navigation: the prev/next buttons (and `PageUp`/`PageDown`) stop at the bound month, so users can't browse into fully out-of-range months.

### Keyboard

`←↑↓→` move focus · `Enter`/`Space` select · `PageUp`/`PageDown` change month ·
`Home`/`End` jump to start/end of month. Arrow direction is mirrored in RTL.

## Adding a calendar

Implement `CalendarAdapter` and register it:

```ts
provideNgxDatepicker(new MyHijriAdapter(), new GregorianCalendarAdapter())
```

No component changes required — the entire UI talks only to the adapter interface.
