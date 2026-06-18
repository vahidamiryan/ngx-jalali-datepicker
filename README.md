# ngx-jalali-datepicker

High-performance, customizable, framework-idiomatic date picker for Angular 20+.
Built on **signals**, an **OnPush + zoneless** rendering model, a pluggable
**calendar adapter** layer (Jalali / Shamsi + Gregorian + Hijri out of the box), and a
**headless core** you can reuse to build a completely custom UI.

## Why this design

| Goal | How it's achieved |
| --- | --- |
| **Performance** | Every per-day flag (selected / in-range / disabled / preview / today) is precomputed once in a `computed` (`buildMonthView`). Templates read only booleans — no `toDateString()` or `[ngClass]` object literals re-evaluated per cell per change-detection cycle. Comparisons use numeric `yyyymmdd` keys, never string allocations. |
| **Customizability** | Theme entirely via CSS custom properties (`--ndp-*`). Replace the day cell with content projection (`ng-template ndpDayCell`). Swap or add calendars by implementing `CalendarAdapter`. |
| **Maintainability** | Pure, testable headless core (`buildMonthView`, `applySelection`, adapters) is fully decoupled from the Angular components. No domain logic (pricing, etc.) baked into the core. |
| **Correctness** | Jalaali math is a faithful port of the battle-tested `jalaali-js` algorithm and is unit-verified against the platform `Intl` Persian calendar. Hijri math is the pure tabular Islamic (civil) algorithm, unit-verified day-by-day against `Intl` `islamic-civil`. |

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

## Typing dates (input field)

For faster entry than clicking, dates can be typed directly.

**`<ndp-date-input>`** — a text field with a calendar popover. Type to parse, or
open the panel to pick; selecting writes the text back. It's a
`ControlValueAccessor` and forwards the usual picker inputs.

```html
<!-- Single -->
<ndp-date-input [(value)]="value" />

<!-- Range — shows two fields (start / end), kept in order -->
<ndp-date-input mode="range" [min]="today" [(value)]="range" />
```

**`showInput`** — render the same typing field(s) inside the panel itself
(day modes only):

```html
<ndp-datepicker [showInput]="true" [(value)]="value" />
```

Both accept `/`, `-` or `.` separators and Persian/Arabic-Indic digits;
impossible dates are flagged (`aria-invalid`) without changing the value.

`parse` / `formatInput` also live on `CalendarAdapter`, so you can convert a
typed string to a `Date` headlessly in any calendar:

```ts
const cal = new JalaliCalendarAdapter();
cal.parse('۱۴۰۴/۰۳/۲۸');     // Date or null
cal.parse('1404/07/31');      // null — Mehr has 30 days
cal.formatInput(new Date());  // "۱۴۰۴/۰۳/۲۸"
```

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
import { HijriMath } from 'ngx-jalali-datepicker';

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

- **Components:** `DatepickerComponent` (`ndp-datepicker`), `DateInputComponent` (`ndp-date-input`), `CalendarMonthComponent` (`ndp-calendar-month`)
- **Directive:** `NdpDayCellTemplate` (`ng-template[ndpDayCell]`)
- **Adapters:** `CalendarAdapter` (abstract), `GregorianCalendarAdapter`, `JalaliCalendarAdapter`, `HijriCalendarAdapter` (+ `NdpHijriConfig`, `NdpHijriDayAdjustment`, `NdpHijriDayAdjuster`)
- **Headless core:** `buildMonthView`, `applySelection`, `rangeEquals`, `isSelectionComplete`, `dayKey`, `atMidnight`, `toLatinDigits`, `toPersianDigits`, adapter `parse` / `formatInput`, types (`DateRange`, `DayCell`, `MonthView`, `DatepickerMode`, `DateFilterFn`)
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
| `animation` | `'none' \| 'slide'` | `'none'` | Slide the calendar body in the direction of travel when navigating between months / years / pages. Direction-aware (mirrored in RTL) and disabled automatically under `prefers-reduced-motion`. |
| `showSecondaryDate` | `boolean` | `false` | Show each date in a companion calendar (dual-script). |
| `secondaryCalendar` | `string \| null` | `null` | Companion calendar id; defaults to the first other registered calendar. |
| `showFooter` | `boolean` | `true` | Master toggle for the whole footer (summary bar + action buttons). |
| `showSummary` | `boolean` | `true` | Show the selected-date summary bar inside the footer. Set `false` to hide just the summary while keeping the action buttons. |
| `showToday` / `showClear` / `showCalendarToggle` | `boolean` | `true` | Footer action buttons. |
| `showInput` | `boolean` | `false` | Render a typed-date field above the grid (day modes only). See [Typing dates](#typing-dates-input-field). |

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
provideNgxDatepicker(new MyEthiopianAdapter(), new GregorianCalendarAdapter())
```

When the adapter needs an Angular service, pass a factory instead of an
instance — factories run inside the injection context, so `inject()` works:

```ts
provideNgxDatepicker(() => new MyEthiopianAdapter(inject(MyService)))
```

No component changes required — the entire UI talks only to the adapter interface.
