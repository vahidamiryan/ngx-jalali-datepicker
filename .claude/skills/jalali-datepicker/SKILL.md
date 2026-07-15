---
name: jalali-datepicker
description: >-
  Integrate, configure, or extend the @vahidamirian Jalali (Shamsi) / Gregorian / Hijri
  date picker in Angular 20+ or Vue 3 — setup (provider/plugin), single & range & month/year
  modes, min/max & dateFilter, theming with --ndp-* CSS variables, time-of-day, dual-script,
  typed input, adding a custom calendar adapter, and working on the monorepo itself (build,
  test, headless core). Use whenever a task involves ngx-jalali-datepicker, vue-datepicker,
  datepicker-core, a Persian/Shamsi/Jalali calendar picker, or an NdpDatepicker / ndp-datepicker
  component.
---

# Jalali Date Picker (NDP) — integration & development skill

A zero-dependency Jalali/Gregorian/Hijri date picker built on one shared **headless core**
(`@vahidamirian/datepicker-core`) with thin **Angular** and **Vue** component layers. Same
engine, identical behavior across frameworks.

**First decide which task you have:**

- **Integrating** the picker into an app → [§1 Integration](#1-integration).
- **Developing** the library (this monorepo) → [§2 Development](#2-development).

The package READMEs are the exhaustive reference — this skill is the fast, correct path for
the common cases. Deep detail: `packages/{core,angular,vue}/README.md`.

---

## 0. Non-negotiable facts (get these right first)

1. **Configuration is required — there is NO zero-config default.** You must register at least
   one calendar adapter (Angular: `provideNgxDatepicker(...)`; Vue: `NdpDatepickerPlugin` or an
   `:adapters` prop). Using a component without it throws a descriptive error. This is
   deliberate — it keeps the library tree-shakeable.
2. **The value is always a `DateRange`**: `{ start: Date | null; end: Date | null }`. In
   `single` mode only `start` is set. In `month`/`year` mode `start` is the **first day** of
   the chosen period. A "date" everywhere is a native JS `Date` at **local midnight**.
3. **The first registered adapter is the default calendar.**
4. **Package names & versions:** `@vahidamirian/datepicker-core` (1.x),
   `@vahidamirian/ngx-jalali-datepicker` (Angular, 2.x), `@vahidamirian/vue-datepicker` (1.x).
   The framework packages re-export the core, so you can import adapters/types/math from either.

---

## 1. Integration

### 1a. Angular (20+, standalone, zoneless)

Install:
```bash
npm install @vahidamirian/ngx-jalali-datepicker @vahidamirian/datepicker-core
```

Register adapters in `app.config.ts` (first = default):
```ts
import { provideZonelessChangeDetection } from '@angular/core';
import {
  provideNgxDatepicker, JalaliCalendarAdapter, GregorianCalendarAdapter,
} from '@vahidamirian/ngx-jalali-datepicker';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideNgxDatepicker(new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')),
  ],
};
```

Import the standalone component where used, then:
```html
<ndp-datepicker [(value)]="value" />                                   <!-- single -->
<ndp-datepicker mode="range" [numberOfMonths]="2" [min]="today" [(value)]="range" />
<ndp-datepicker [formControl]="ctrl" />                                <!-- reactive forms -->
```

- Two-way inputs are `value` (model, `DateRange`) and `calendar` (model, active calendar id).
- Output `(dateSelected)` fires on every concrete pick (close a dropdown here).
- It's a `ControlValueAccessor`, so `[formControl]` / `[(ngModel)]` work.

When an adapter needs Angular DI, pass a **factory** (runs in injection context):
```ts
provideNgxDatepicker(() => new HijriCalendarAdapter({ adjustment: inject(MyAdjuster) }), new JalaliCalendarAdapter())
```

### 1b. Vue 3

Install:
```bash
npm install @vahidamirian/vue-datepicker @vahidamirian/datepicker-core vue
```

Register once in `main.ts` (and import the stylesheet):
```ts
import { NdpDatepickerPlugin } from '@vahidamirian/vue-datepicker';
import { JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamirian/datepicker-core';
import '@vahidamirian/vue-datepicker/styles.css';

createApp(App).use(NdpDatepickerPlugin, {
  adapters: [new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')],
}).mount('#app');
```

Use with `v-model`:
```vue
<NdpDatepicker v-model="value" />
<NdpDatepicker v-model="range" mode="range" :number-of-months="2" :min="today" />
<NdpDatepicker v-model="value" v-model:calendar="cal" @date-selected="onPicked" />
```

- `v-model` → value (`DateRange`); `v-model:calendar` → active calendar id.
- `@date-selected` fires on every concrete pick.
- No plugin? Pass `:adapters="[new JalaliCalendarAdapter(), …]"` per component. Factories allowed.

### 1c. Common tasks (both frameworks — same options, different binding syntax)

Angular uses `[input]`/`(output)`/`[(model)]`; Vue uses `:prop`/`@event`/`v-model`. Property
names are identical modulo camelCase↔kebab-case (`numberOfMonths` ↔ `:number-of-months`).

| Task | Option(s) |
| --- | --- |
| Single / range / month / year | `mode="single|range|month|year"` |
| Multiple months side by side | `numberOfMonths` (Ng) / `:number-of-months` (Vue) |
| Bounds | `min` / `max` (`Date \| null`, inclusive; also gate month nav) |
| Disable specific days | `dateFilter` = `(d: Date) => boolean` — return **true = selectable** |
| Theme | `theme="light|dark|auto"` (auto = OS `prefers-color-scheme`) |
| Custom colors programmatically | `customVars` / `:custom-vars` = `Record<string,string>` of `--ndp-*` |
| Navigation animation | `animation="none|slide"` |
| Time of day (single only) | `showTime` + `minuteStep` (1–30) |
| Dual-script (e.g. Gregorian under Jalali) | `showSecondaryDate` + optional `secondaryCalendar` |
| Typed field above grid | `showInput` (day modes only) — or use the `<ndp-date-input>` / `<NdpDateInput>` component |
| Footer bits | `showFooter`, `showSummary`, `showToday`, `showClear`, `showCalendarToggle`, `showQuickNav` |

**Disable days — examples:**
```ts
const noFridays = (d: Date) => d.getDay() !== 5;               // Jalali weekend
const holidays = new Set(['2026-03-21', '2026-03-22']);
const notHoliday = (d: Date) => !holidays.has(d.toISOString().slice(0, 10));
const selectable = (d: Date) => noFridays(d) && notHoliday(d);
```

**Date arithmetic (add / subtract)** — use the adapter for calendar-correct month/year math,
raw `Date` for days. Do NOT reach for moment/dayjs:
```ts
const cal = new JalaliCalendarAdapter();
cal.addCalendarMonths(d, 1);  cal.addCalendarMonths(d, -3);  cal.addCalendarYears(d, 1);
cal.startOfMonth(d);          cal.startOfYear(d);
function addDays(d: Date, n: number){ const x=new Date(d.getTime()); x.setDate(x.getDate()+n); x.setHours(0,0,0,0); return x; }
```

**Theming** — every color/radius/shadow is a `--ndp-*` variable. Override in CSS or via
`customVars` (inline, wins over theme + stylesheet). Angular host tag: `ndp-datepicker`.
Vue root class: `.ndp-root`. Both carry `data-ndp-theme`.
```css
ndp-datepicker { --ndp-accent:#8b5cf6; --ndp-range-bg:rgba(139,92,246,.18); --ndp-radius:18px; }
/* Vue: .ndp-root { … }  or  .my-wrapper .ndp-root { … } to scope one instance */
```
Key tokens: `--ndp-accent`, `--ndp-accent-hover`, `--ndp-accent-contrast`, `--ndp-range-bg`,
`--ndp-preview-bg`, `--ndp-focus-ring`, `--ndp-today-border`, `--ndp-weekend-color`,
`--ndp-surface`, `--ndp-border`, `--ndp-text`, `--ndp-muted`, `--ndp-radius`, `--ndp-day-radius`,
`--ndp-shadow`, `--ndp-slide-{duration,easing,distance}`. Full table in the READMEs.

**Custom day cell** — Angular content projection / Vue scoped slot, receives a fully-built
`DayCell` (all flags precomputed: `isSelected`, `isInRange`, `isDisabled`, `isPreview`, `key`, …):
```html
<!-- Angular -->
<ndp-datepicker [(value)]="value">
  <ng-template ndpDayCell let-day>{{ day.label }} @if (day.isWeekend) { <i></i> }</ng-template>
</ndp-datepicker>
```
```vue
<!-- Vue -->
<NdpDatepicker v-model="value">
  <template #day="{ day }">{{ day.label }}<i v-if="day.isWeekend" /></template>
</NdpDatepicker>
```

**Typed input & time-only** — dedicated components:
`ndp-date-input`/`NdpDateInput` (text + calendar popover, parses `1404/03/28`, Persian digits,
`/ - .` separators), and `ndp-time-input`/`NdpTimeInput` (just `HH:mm`, value is a `Date`
carrying the time).

**Keyboard:** `←↑↓→` move focus (mirrored in RTL) · `Enter`/`Space` select ·
`PageUp`/`PageDown` change month · `Home`/`End` month start/end · `Esc` closes quick-nav.

### 1d. Headless / conversion (no UI)
```ts
import { JalaaliMath, HijriMath, JalaliCalendarAdapter } from '@vahidamirian/datepicker-core';
JalaaliMath.toJalaali(new Date(2026,2,21));  // { jy:1405, jm:1, jd:1 }
JalaaliMath.toGregorian(1404,1,1);           // { gy:2025, gm:3, gd:21 }
new JalaliCalendarAdapter().parse('۱۴۰۴/۰۳/۲۸'); // Date | null (round-trip validated)
```

### 1e. Hijri
```ts
new HijriCalendarAdapter()                              // pure tabular Islamic civil (deterministic)
new HijriCalendarAdapter({ adjustment: -1 })            // shift toward observed calendar (±days)
new HijriCalendarAdapter({ locale: 'ar', monthNames })  // localize digits + names
```
It is **not** Umm al-Qura / sighting-based. Keep any `adjustment` stable within one Hijri month.

---

## 2. Development (this monorepo)

### Layout
```
packages/
  core/     @vahidamirian/datepicker-core     — pure TS engine (adapters, math, view builders). ZERO deps.
  angular/  @vahidamirian/ngx-jalali-datepicker — Angular 20 signals/zoneless/OnPush/CVA layer.
  vue/      @vahidamirian/vue-datepicker        — Vue 3 Composition API / v-model layer.
apps/       demo / docs / playground.
```
Dependency order: **core → angular → vue**. A fix in the core lands in both frameworks.

### Build / test (npm workspaces, Node 20+)
```bash
npm install
npm run build            # core → angular → vue (order matters)
npm run build:core | :angular | :vue
npm run test             # core + vue (vitest); angular uses karma/jasmine
npm run test:core | :vue
npm run dev:docs         # docs app with live Angular + Vue examples
```

### The core contract (know this before touching anything)
- Canonical date = JS `Date` at local midnight (Gregorian instant). Adapters translate to/from
  their own y/m/d. The rest of the library never branches on a locale string.
- Per-cell state is precomputed once in `buildMonthView` / `buildMonthsView` / `buildYearsView`;
  templates read only booleans. Comparisons use numeric `dayKey` (`yyyymmdd`), never strings.
  **Do not add date math or comparisons in component templates** — extend the builders instead.
- Selection is a pure reducer: `applySelection(mode, current, date)` (auto-orders range ends).
- Keep domain logic (pricing, business rules) OUT of the core — it stays generic and testable.

### Adding a calendar
Extend `CalendarAdapter` (in `packages/core/src/core/calendar-adapter.ts`) — implement the
abstract members; `parse`/`formatInput`/`maskInput`/`addCalendarYears`/`startOfYear` and the
month/year labels have working defaults. Verify math against `Intl` in a `*.spec.ts` (see
`hijri.spec.ts` / `parse.spec.ts` for the pattern). **No component changes are needed** — the
UI talks only to the adapter interface. Register via `provideNgxDatepicker(...)` /
`NdpDatepicker` `adapters`.

### Cross-framework parity rule
Angular `DatepickerComponent` and Vue `useDatepicker` are faithful ports of the same state
machine. If you change selection/navigation behavior, change **both** (or push the logic into
the shared core so it applies once). Tests exist on both sides — run them.

### When editing
- Match the surrounding style: signals/`computed` in Angular, `ref`/`computed` in Vue.
- New public surface → export it from `packages/*/src/{index.ts,public-api.ts}` AND document it
  in that package's README (props/events table + a short example) and the CHANGELOG.
- Never introduce a runtime dependency in the core.

---

## Common mistakes to avoid
- ❌ Rendering `<ndp-datepicker>` without a provider → throws. Always register adapters.
- ❌ Treating the value as a bare `Date`. It's a `DateRange`; read `value.start`.
- ❌ Using `showTime` in range/month/year mode — it's single-mode only.
- ❌ Hardcoding colors — use `--ndp-*` variables / `customVars`.
- ❌ Pulling in moment/dayjs/date-fns for arithmetic — the adapter + `Date` cover it.
- ❌ Forgetting `import '@vahidamirian/vue-datepicker/styles.css'` in Vue apps.
