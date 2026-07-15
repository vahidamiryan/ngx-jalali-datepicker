# Options & customization

Every option works the same way in both frameworks — only the binding syntax
differs. This page covers the options the example pages use; the exhaustive
prop/input tables live in each package README
([Angular](https://github.com/vahidamiryan/ngx-jalali-datepicker/tree/main/packages/angular#datepickercomponent-inputs) ·
[Vue](https://github.com/vahidamiryan/ngx-jalali-datepicker/tree/main/packages/vue#ndpdatepicker--props--events--slots)).

## Selection modes

`mode` picks what a selection produces. In `month` / `year` the value's `start`
is the **first day** of the chosen period (`end` stays `null`), so the
`DateRange` contract never changes.

```html
<!-- Angular -->
<ndp-datepicker mode="single" [(value)]="value" /> <!-- default -->
<ndp-datepicker mode="range" [(value)]="value" />
<ndp-datepicker mode="month" [(value)]="value" />
<ndp-datepicker mode="year" [(value)]="value" />
```

```vue
<!-- Vue -->
<NdpDatepicker v-model="value" />              <!-- single (default) -->
<NdpDatepicker v-model="value" mode="range" />
<NdpDatepicker v-model="value" mode="month" />
<NdpDatepicker v-model="value" mode="year" />
```

Render several months at once with `numberOfMonths` (Angular) /
`:number-of-months` (Vue).

## Bounds & disabling days

Three complementary options decide which days can be picked. All are enforced by
the core, so keyboard navigation and typed input respect them too. `min` / `max`
also stop month navigation at the bound month.

| Option | Effect |
| --- | --- |
| `min` | Days before it are disabled; `‹` / `PageUp` stop at its month. |
| `max` | Days after it are disabled; `›` / `PageDown` stop at its month. |
| `dateFilter` | A predicate — return `true` to keep a day **selectable**, `false` to disable it. |

```ts
// A predicate is a plain function — combine as many rules as you like.
const today = new Date()
const holidays = new Set(['2026-03-21', '2026-03-22'])

const selectable = (d: Date) =>
  d.getDay() !== 5 &&                                  // no Fridays (Jalali weekend)
  !holidays.has(d.toISOString().slice(0, 10))         // no listed holidays
```

```html
<!-- Angular -->
<ndp-datepicker [min]="today" [dateFilter]="selectable" [(value)]="value" />
```

```vue
<!-- Vue -->
<NdpDatepicker v-model="value" :min="today" :date-filter="selectable" />
```

## Navigation animation

By default the grid swaps instantly. Set `animation="slide"` to slide the body
in the direction of travel — it honors `prefers-reduced-motion` and is tunable
with `--ndp-slide-duration` / `--ndp-slide-easing` / `--ndp-slide-distance`.

```html
<ndp-datepicker animation="slide" [(value)]="value" />
```

```vue
<NdpDatepicker v-model="value" animation="slide" />
```

## Footer & quick-nav toggles

The footer (summary bar + Today / Clear / calendar-toggle buttons) and the
month/year quick-nav dropdowns are all individually toggleable:

| Option | Default | Turns off |
| --- | --- | --- |
| `showFooter` / `show-footer` | `true` | The whole footer. |
| `showSummary` / `show-summary` | `true` | Just the selected-date summary bar. |
| `showToday` / `showClear` / `showCalendarToggle` | `true` | Individual footer buttons. |
| `showQuickNav` / `show-quick-nav` | `true` | The header month/year dropdowns (falls back to a plain label). |

Hide the footer entirely when you wrap the picker in your own popover — in single
mode `dateSelected` / `@date-selected` fires on the first click, the natural
moment to close.

## Keyboard

`←↑↓→` move focus · `Enter` / `Space` select · `PageUp` / `PageDown` change
month · `Home` / `End` jump to the start / end of the month. Arrow direction is
mirrored in RTL. In `month` / `year` mode the same keys drive the period grid,
and `Esc` closes an open quick-nav dropdown.
