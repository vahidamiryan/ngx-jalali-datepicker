# Calendars & adapters

The picker never branches on a locale string — it talks only to a `CalendarAdapter`.
Three ship in `@vahidamirian/datepicker-core`:

- **`JalaliCalendarAdapter`** — Jalali / Shamsi (Persian). A faithful port of the
  `jalaali-js` algorithm, verified against the platform `Intl` Persian calendar.
- **`GregorianCalendarAdapter`** — pass a locale, e.g. `new GregorianCalendarAdapter('en-US')`.
- **`HijriCalendarAdapter`** — the tabular Islamic (civil) calendar; deterministic in
  every region, with an optional `adjustment` for observed offsets.

All three, and the conversion math, are exported so you can convert headlessly:

```ts
import { JalaaliMath, HijriMath } from '@vahidamirian/datepicker-core'

JalaaliMath.toJalaali(new Date(2026, 2, 21)) // { jy: 1405, jm: 1, jd: 1 }
JalaaliMath.toGregorian(1404, 1, 1)          // { gy: 2025, gm: 3, gd: 21 }
HijriMath.toHijri(new Date(2026, 5, 12))     // { hy: 1447, hm: 12, hd: 26 }
```

## Choosing calendars

The order you register them sets the default (first) and what the calendar-toggle
button cycles through. **A `calendar="…"` binding or the toggle only works for a
calendar you actually registered** — using an unregistered id throws a
descriptive "calendar not registered" error. Register only what you use; the rest
(and their conversion math) never ship.

**Vue** — via the plugin or a per-component `:adapters` prop:

```ts
app.use(NdpDatepickerPlugin, {
  adapters: [
    new JalaliCalendarAdapter(),
    new GregorianCalendarAdapter('en-US'),
    new HijriCalendarAdapter(),
  ],
})
```

**Angular** — via `provideNgxDatepicker`:

```ts
provideNgxDatepicker(
  new JalaliCalendarAdapter(),
  new GregorianCalendarAdapter('en-US'),
  new HijriCalendarAdapter(),
)
```

Switch the active calendar at runtime with `v-model:calendar` (Vue) /
`[(calendar)]` (Angular), or let users flip it with the footer's calendar-toggle
button.

## Hijri day adjustment

`HijriCalendarAdapter` is the deterministic **tabular** civil calendar, which can
differ from a locally observed (sighting / Umm al-Qura) calendar by ±1–2 days.
Shift the tabular result by whole days with `adjustment` — a fixed number or a
per-date function:

```ts
new HijriCalendarAdapter({ adjustment: -1 })                      // fixed offset
new HijriCalendarAdapter({ adjustment: (date) => offsetFor(date) }) // lookup table
```

`+1` means the observed calendar runs one day ahead of the tabular one. Keep the
offset stable within any one Hijri month so round-trips stay exact. Month names
and the digit/weekday locale are configurable via `NdpHijriConfig`
(`monthNames`, `locale`).

## Dual-script display

Show every date in a second calendar at the same time (Gregorian under Jalali, etc.):

```vue
<NdpDatepicker v-model="value" :show-secondary-date="true" />
```

```html
<ndp-datepicker [showSecondaryDate]="true" [(value)]="value" />
```

## Adding your own calendar

Implement `CalendarAdapter` and register it — no component changes needed, since the
entire UI talks only to the interface. Because the adapter lives in `@vahidamirian/datepicker-core`, the
same custom calendar works in both Angular and Vue.
