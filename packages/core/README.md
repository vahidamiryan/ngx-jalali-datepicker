# @ndp/core

Framework-agnostic **headless core** for the NDP date picker. Pure TypeScript with
**zero framework dependencies** — the shared foundation under
[`@ndp/angular`](../angular) and [`@ndp/vue`](../vue).

It ships:

- **Calendar adapters** — `GregorianCalendarAdapter`, `JalaliCalendarAdapter`,
  `HijriCalendarAdapter`, and the `CalendarAdapter` abstract base you implement to
  add your own calendar.
- **Conversion math** — `JalaaliMath`, `HijriMath` (dependency-free, verified
  against the platform `Intl` calendars).
- **Render-ready view builders** — `buildMonthView`, `buildMonthsView`,
  `buildYearsView`: every per-cell flag (selected / in-range / disabled / today …)
  precomputed once so any UI layer only reads booleans.
- **Pure logic** — `applySelection`, `isSelectionComplete`, `rangeEquals`,
  time-of-day helpers (`getTimeOfDay`, `withTimeOfDay`, `snapMinutes`,
  `stepMinutes`), and the `dayKey` / digit utilities.

```ts
import { JalaliCalendarAdapter, buildMonthView, applySelection } from '@ndp/core';

const cal = new JalaliCalendarAdapter();
cal.parse('۱۴۰۴/۰۳/۲۸'); // Date | null
```

Build a completely custom UI on top of this, or use a framework package. See the
[repo README](https://github.com/vahidamiryan/ngx-jalali-datepicker) for the full API.

## License

MIT © Vahid Amirian
