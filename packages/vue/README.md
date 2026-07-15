# @vahidamirian/vue-datepicker

[![npm](https://img.shields.io/npm/v/@vahidamirian/vue-datepicker)](https://www.npmjs.com/package/@vahidamirian/vue-datepicker)

High-performance, customizable **Jalali (Shamsi) / Gregorian / Hijri date picker for Vue 3**,
built on the shared [`@vahidamirian/datepicker-core`](../core) headless engine — the same
calendar math and selection logic that powers
[`@vahidamirian/ngx-jalali-datepicker`](../angular), so behavior is identical across
frameworks.

- ⚡ **Fast by construction** — every per-day flag (selected / in-range / disabled / today)
  is precomputed once in a `computed`; the template reads only booleans, comparisons use
  numeric `yyyymmdd` keys, never string allocations.
- 🗓️ **Three calendars out of the box** — Jalali/Shamsi, Gregorian, and tabular Hijri, all
  verified against the platform `Intl`. Add your own by implementing one adapter interface.
- 🎨 **Themeable to the pixel** — every colour/radius/shadow is a `--ndp-*` CSS variable;
  light / dark / auto built in. Replace a whole day cell with a scoped slot.
- ✅ **Complete** — single & range, multi-month, month/year pickers, typed input with
  parsing, time-of-day, dual-script (Gregorian under Jalali), full keyboard nav, RTL, and
  `v-model` throughout.

**npm:** https://www.npmjs.com/package/@vahidamirian/vue-datepicker

---

## Contents

- [Install](#install)
- [Setup](#setup)
- [Quick start](#quick-start)
- [The value contract](#the-value-contract-daterange)
- [Components](#components)
- [`NdpDatepicker` — props / events / slots](#ndpdatepicker--props--events--slots)
- [Selection modes](#selection-modes-single--range--month--year)
- [Bounds & disabling days (`min` / `max` / `dateFilter`)](#bounds--disabling-days)
- [Date arithmetic — add / subtract](#date-arithmetic--add--subtract)
- [Theming (light / dark / custom)](#theming-light--dark--custom)
- [Customizing the day cell (scoped slot)](#customizing-the-day-cell-scoped-slot)
- [Typed input (`NdpDateInput`)](#typing-dates-ndpdateinput)
- [Time of day](#time-of-day)
- [Time only (`NdpTimeInput`)](#time-only-ndptimeinput)
- [Dual-script (Gregorian alongside Jalali)](#dual-script-gregorian-alongside-jalali)
- [Building a dropdown / popover](#building-a-dropdown--popover)
- [Calendars & conversion (headless)](#calendars--conversion-headless)
- [Hijri (Islamic civil) calendar](#hijri-islamic-civil-calendar)
- [Adding your own calendar](#adding-your-own-calendar)
- [Fully custom UI (`useDatepicker`)](#fully-custom-ui-usedatepicker)
- [Keyboard](#keyboard)
- [Recipes](#recipes)

---

## Install

```bash
npm install @vahidamirian/vue-datepicker @vahidamirian/datepicker-core vue
```

## Setup

Configure the calendars once via the plugin (the **first entry is the default**). Import the
stylesheet too:

```ts
// main.ts
import { createApp } from 'vue';
import { NdpDatepickerPlugin } from '@vahidamirian/vue-datepicker';
import { JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamirian/datepicker-core';
import '@vahidamirian/vue-datepicker/styles.css';
import App from './App.vue';

createApp(App)
  .use(NdpDatepickerPlugin, {
    adapters: [new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')],
  })
  .mount('#app');
```

> **Configuration is required** and has no zero-config default — that is what makes the
> picker fully tree-shakeable. You ship only the adapters (and their conversion math) you
> register, so a Gregorian-only app never bundles the Jalali or Hijri code. Using a
> component without adapters throws a descriptive error.

Two other ways to provide calendars:

```ts
// Register every component globally as well (optional convenience plugin):
import { NdpVue, NdpDatepickerPlugin } from '@vahidamirian/vue-datepicker';
app.use(NdpVue).use(NdpDatepickerPlugin, { adapters: [/* … */] });
```

```vue
<!-- Or per-component, no plugin needed — pass an :adapters prop: -->
<NdpDatepicker
  v-model="value"
  :adapters="[new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')]"
/>
```

Adapters may also be **factories** (`() => new JalaliCalendarAdapter()`), resolved lazily —
the Vue counterpart of Angular's injection-context factories.

## Quick start

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { NdpDatepicker, NdpDateInput, NdpTimeInput } from '@vahidamirian/vue-datepicker';
import type { DateRange } from '@vahidamirian/datepicker-core';

const value = ref<DateRange>({ start: null, end: null });
const range = ref<DateRange>({ start: null, end: null });
const time  = ref<Date | null>(null);
const today = new Date();
</script>

<template>
  <!-- Single date -->
  <NdpDatepicker v-model="value" />

  <!-- Range, two months, no past dates (min also blocks back-navigation) -->
  <NdpDatepicker v-model="range" mode="range" :number-of-months="2" :min="today" />

  <!-- Typed input with a calendar popover -->
  <NdpDateInput v-model="value" />

  <!-- Time-only field -->
  <NdpTimeInput v-model="time" :minute-step="15" />

  <!-- Switch the active calendar with v-model:calendar -->
  <NdpDatepicker v-model="value" v-model:calendar="cal" />

  <!-- Fire on every concrete pick (handy for closing a dropdown) -->
  <NdpDatepicker v-model="value" @date-selected="onPicked" />
</template>
```

## The value contract (`DateRange`)

Everywhere in the public API a "date" is a native JS `Date` at **local midnight**
(Gregorian instant). The `v-model` value is always a `DateRange`:

```ts
interface DateRange {
  start: Date | null;
  end: Date | null;
}
```

- **single** mode → only `start` is populated (`end` stays `null`).
- **range** mode → both ends populate once the range is complete.
- **month / year** mode → `start` is the **first day of the chosen month/year**; `end` is `null`.

The adapters translate that canonical `Date` to/from Jalali/Hijri fields — you never handle
Jalali numbers yourself unless you want to (see [conversion](#calendars--conversion-headless)).

## Components

| Component | Tag | Purpose |
| --- | --- | --- |
| `NdpDatepicker` | `<NdpDatepicker>` | The full panel — single / range / month / year, footer, quick-nav, time. |
| `NdpDateInput` | `<NdpDateInput>` | Text field(s) that parse typed dates + a calendar popover. |
| `NdpTimeInput` | `<NdpTimeInput>` | Time-only field (`HH:mm`) with a stepper popover, no calendar. |
| `NdpTimePicker` | `<NdpTimePicker>` | Bare hours:minutes stepper (presentational). |
| `NdpCalendarMonth` | `<NdpCalendarMonth>` | A single month grid (presentational). |
| `NdpCalendarPeriod` | `<NdpCalendarPeriod>` | A 12-month or paged-year grid (presentational). |

Plus the [`useDatepicker`](#fully-custom-ui-usedatepicker) composable to build a completely
custom UI on the same state machine.

## `NdpDatepicker` — props / events / slots

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `v-model` (`modelValue`) | `DateRange` | `{start:null,end:null}` | Two-way selected value. |
| `v-model:calendar` | `string` | first registered | Active calendar id (`'jalali'`, `'gregorian'`, `'hijri'`). |
| `mode` | `'single' \| 'range' \| 'month' \| 'year'` | `'single'` | Selection mode — see [modes](#selection-modes-single--range--month--year). |
| `number-of-months` | `number` | `1` | Render N adjacent months. |
| `min` / `max` | `Date \| null` | `null` | Inclusive bounds; also gate month navigation. |
| `date-filter` | `(d: Date) => boolean` | `null` | Return `true` if a date is **selectable**. |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | `auto` follows the OS `prefers-color-scheme`. |
| `custom-vars` | `Record<string,string>` | `{}` | Inline `--ndp-*` overrides (win over theme + stylesheet). |
| `animation` | `'none' \| 'slide'` | `'none'` | Body transition when navigating. Honors `prefers-reduced-motion`. |
| `show-secondary-date` | `boolean` | `false` | Render each date in a companion calendar (dual-script). |
| `secondary-calendar` | `string \| null` | `null` | Companion calendar id; defaults to the first *other* registered calendar. |
| `show-footer` | `boolean` | `true` | Master toggle for the whole footer (summary + action buttons). |
| `show-summary` | `boolean` | `true` | Selected-date summary bar inside the footer. |
| `show-today` / `show-clear` / `show-calendar-toggle` | `boolean` | `true` | Individual footer buttons. |
| `show-quick-nav` | `boolean` | `true` | Month/year dropdowns in the header. `false` → plain label. |
| `show-input` | `boolean` | `false` | Typed-date field above the grid (day modes only). |
| `show-time` | `boolean` | `false` | Hours:minutes picker under the grid (single mode only). |
| `minute-step` | `number` | `1` | Minute increment for the time stepper / arrow keys (clamped 1–30). |
| `disabled` | `boolean` | `false` | Disable the whole picker. |
| `adapters` | `NdpCalendarAdapterSource[] \| null` | `null` | Per-component calendar override; else the plugin's adapters. |

### Events

| Event | Payload | When |
| --- | --- | --- |
| `update:modelValue` | `DateRange` | Value changed (via `v-model`). |
| `update:calendar` | `string` | Active calendar changed (via `v-model:calendar`). |
| `date-selected` | `DateRange` | Every concrete pick — the natural moment to close a dropdown. |

### Slots

| Slot | Scope | Purpose |
| --- | --- | --- |
| `#day` | `{ day: DayCell }` | Replace the content of a day cell. See [below](#customizing-the-day-cell-scoped-slot). |

## Selection modes (`single` / `range` / `month` / `year`)

```vue
<!-- Single day -->
<NdpDatepicker v-model="value" />

<!-- Range — two clicks; endpoints auto-order regardless of click order -->
<NdpDatepicker v-model="range" mode="range" />

<!-- Month picker — body shows the 12 months of the active year -->
<NdpDatepicker v-model="month" mode="month" />

<!-- Year picker — body shows a paged grid of years (‹ › steps a page) -->
<NdpDatepicker v-model="year" mode="year" />
```

In **month / year** mode, selecting commits `value.start` as the **first day of the chosen
month/year** (`end` stays `null`), so the value contract is still a plain `Date`. Label a
committed month/year with the adapter:

```ts
import { JalaliCalendarAdapter } from '@vahidamirian/datepicker-core';
const cal = new JalaliCalendarAdapter();
cal.getMonthLabel(month.value.start!); // "خرداد ۱۴۰۴"
cal.getYearLabel(year.value.start!);   // "۱۴۰۴"
```

In **day** mode (`single` / `range`) the header shows separate **month** and **year**
dropdowns (`show-quick-nav`, on by default) — click either to jump straight to a month or
year instead of clicking `‹ ›` repeatedly. The menu closes on `Esc` or an outside click.

In **range** mode the summary bar shows a small ✕ next to each endpoint, so the start or end
can be cleared individually without resetting the whole range.

## Bounds & disabling days

Three complementary props control which days can be picked. All of them are enforced by the
core, so keyboard navigation and typed input respect them too.

| Prop | Effect |
| --- | --- |
| `min` | Days before it are disabled; `‹`/`PageUp` stop at its month. |
| `max` | Days after it are disabled; `›`/`PageDown` stop at its month. |
| `date-filter` | A predicate — return `true` to keep a day **selectable**, `false` to disable it. |

```vue
<script setup lang="ts">
const today = new Date();

// No weekends (Fri in Jalali, Sat/Sun in Gregorian — use the adapter to be calendar-aware)
const noWeekends = (d: Date) => d.getDay() !== 5;

// Block a fixed list of holidays
const holidays = new Set(['2026-03-21', '2026-03-22']);
const notHoliday = (d: Date) => !holidays.has(d.toISOString().slice(0, 10));

// Combine several rules
const selectable = (d: Date) => noWeekends(d) && notHoliday(d);
</script>

<template>
  <NdpDatepicker v-model="value" :min="today" :date-filter="selectable" />
</template>
```

> `min` / `max` compare by calendar **day** (time-of-day is ignored), and they also gate
> month/year navigation so users can't browse into fully out-of-range periods.

## Date arithmetic — add / subtract

You rarely need a date library. The active adapter does calendar-correct arithmetic (it
knows month lengths and leap years in *its* calendar), and the core exports numeric helpers.

**Shift by whole calendar months / years** (day-of-month preserved where possible):

```ts
import { JalaliCalendarAdapter } from '@vahidamirian/datepicker-core';
const cal = new JalaliCalendarAdapter();

cal.addCalendarMonths(new Date(), 1);   // next Jalali month
cal.addCalendarMonths(new Date(), -3);  // three Jalali months ago
cal.addCalendarYears(new Date(), 1);    // next Jalali year
cal.startOfMonth(new Date());           // first day of the current Jalali month
cal.startOfYear(new Date());            // 1 Farvardin of the current year
```

**Add / subtract raw days** (day length is calendar-independent):

```ts
function addDays(date: Date, delta: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + delta);
  d.setHours(0, 0, 0, 0);
  return d;
}

const inTwoWeeks = addDays(new Date(), 14);
```

Use these to build dynamic bounds — e.g. "only the next 30 days":

```vue
<script setup lang="ts">
import { computed } from 'vue';
const today = new Date();
const max = computed(() => addDays(today, 30));
</script>

<template>
  <NdpDatepicker v-model="value" :min="today" :max="max" />
</template>
```

For pure numeric conversion (no `Date` juggling) use `JalaaliMath` / `HijriMath` — see
[conversion](#calendars--conversion-headless).

## Theming (light / dark / custom)

Three built-in themes via the `theme` prop:

```vue
<NdpDatepicker v-model="value" theme="light" />  <!-- default -->
<NdpDatepicker v-model="value" theme="dark" />
<NdpDatepicker v-model="value" theme="auto" />   <!-- follows OS prefers-color-scheme -->
```

`theme` only swaps the default palette of design tokens — **every** colour, radius and
spacing value is a CSS custom property (`--ndp-*`) you can override.

**Override in CSS** (cascades — globally or scoped). Every component root carries the
`.ndp-root` class and a `data-ndp-theme` attribute. Target `.ndp-root` for all pickers, or
wrap one instance in your own container to scope it:

```css
/* all pickers */
.ndp-root {
  --ndp-accent: #8b5cf6;
  --ndp-accent-hover: #7c3aed;
  --ndp-range-bg: rgba(139, 92, 246, 0.18); /* translucent → works on any surface */
  --ndp-radius: 18px;
}

/* one instance, scoped */
.my-brand-picker .ndp-root { --ndp-accent: #16a34a; }
```

```vue
<div class="my-brand-picker"><NdpDatepicker v-model="value" /></div>
```

**Override programmatically** with `custom-vars` — handy for runtime / brand-driven values.
Applied as inline styles, so they win over both the built-in theme and your stylesheet:

```vue
<script setup lang="ts">
const brand: Record<string, string> = {
  '--ndp-accent': '#8b5cf6',
  '--ndp-range-bg': 'rgba(139, 92, 246, 0.18)',
};
</script>

<template>
  <NdpDatepicker v-model="value" theme="dark" :custom-vars="brand" />
</template>
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
| `--ndp-day-color` / `--ndp-weekday-color` / `--ndp-day-outside-color` | Day text, weekday header text, and faded out-of-month days. Default to `--ndp-text` / `--ndp-muted`. |
| `--ndp-day-hover-bg` | Day / nav / button hover background. |
| `--ndp-shadow` | Panel drop shadow. |
| `--ndp-radius` / `--ndp-day-radius` | Panel and day-cell corner radius. |
| `--ndp-slide-duration` / `--ndp-slide-easing` / `--ndp-slide-distance` | Tuning for the `animation="slide"` navigation transition. |

## Customizing the day cell (scoped slot)

The `#day` slot receives the fully-built `DayCell` (every state flag precomputed), so you can
render badges, prices, dots — anything — while the picker keeps owning selection and layout:

```vue
<NdpDatepicker v-model="value">
  <template #day="{ day }">
    {{ day.label }}
    <i v-if="day.isWeekend" class="dot" />
    <small v-if="prices[day.key]">{{ prices[day.key] }}</small>
  </template>
</NdpDatepicker>
```

The `DayCell` scope:

```ts
interface DayCell {
  date: Date;          // canonical Gregorian midnight
  key: number;         // numeric yyyymmdd — great as a lookup key
  label: string;       // day-of-month, localized ("۱۲" / "12")
  dayOfMonth: number;
  weekday: number;     // 0..6 within the calendar's week
  inCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;  // strictly between the committed ends
  isPreview: boolean;  // inside the hover-preview band (range mode, end pending)
}
```

## Typing dates (`NdpDateInput`)

Sometimes typing `1404/03/28` beats clicking through a calendar. `NdpDateInput` is a text
field with a calendar popover: type to parse, or open the panel to pick; selecting writes the
text back. It forwards the usual picker props.

```vue
<!-- Single -->
<NdpDateInput v-model="value" />

<!-- Range — two fields (start / end), kept in order -->
<NdpDateInput v-model="range" mode="range" :min="today" />

<!-- With a companion Gregorian date and a placeholder -->
<NdpDateInput v-model="value" :show-secondary-date="true" placeholder="۱۴۰۴/۰۳/۲۸" />
```

Both accept `/`, `-` or `.` separators and Persian/Arabic-Indic digits, and an impossible
date (month 13, the 31st of a 30-day month, …) is flagged (`aria-invalid`) without changing
the value.

### `NdpDateInput` props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `v-model` (`modelValue`) | `DateRange` | `{start:null,end:null}` | Selected value. |
| `v-model:calendar` | `string` | first registered | Active calendar id. |
| `mode` | `'single' \| 'range'` | `'single'` | `range` renders two fields. |
| `min` / `max` / `date-filter` | — | — | Forwarded to the panel. |
| `number-of-months` / `theme` / `custom-vars` / `animation` / `show-secondary-date` / `secondary-calendar` | — | — | Forwarded to the panel. |
| `show-footer` | `boolean` | `true` | Panel footer. |
| `show-time` / `minute-step` | — | — | Forwarded (single mode). See [Time](#time-of-day). |
| `placeholder` | `string \| null` | adapter hint | Field placeholder. |
| `input-id` | `string \| null` | `null` | `id` on the start field for an external `<label for>`. |
| `close-on-select` | `boolean \| null` | `null` | Close after a pick. `null` = close in single, stay open in range. |
| `disabled` | `boolean` | `false` | Disable the field. |
| `adapters` | — | — | Per-component calendar override. |

**Events:** `update:modelValue`, `update:calendar`, `date-selected` (emits the `DateRange`
on every commit — typed or picked).

## Time of day

Set `show-time` (single mode only) to render an hours : minutes stepper under the grid. The
selected value's `Date` carries the chosen time, so `value.start` becomes a full timestamp
rather than local midnight. Picking another day keeps the clock; typing in `NdpDateInput`
preserves it too. `minute-step` (1–30, default `1`) sets the increment for the steppers and
the `↑`/`↓` arrow keys.

```vue
<!-- Pick a day, then set the time. 5-minute increments. -->
<NdpDatepicker v-model="value" :show-time="true" :minute-step="5" />

<!-- Also available inside the typed field's popover -->
<NdpDateInput v-model="value" :show-time="true" />
```

The digits render in the active calendar's own numerals. Read or set the time headlessly:

```ts
import { getTimeOfDay, withTimeOfDay } from '@vahidamirian/datepicker-core';

getTimeOfDay(value.value.start!);        // { hours: 14, minutes: 30 }
withTimeOfDay(value.value.start!, 9, 0); // same day at 09:00 (a new Date)
```

> Only `single` mode carries a time. `range` / `month` / `year` keep their midnight-based
> value contract, so `show-time` is ignored outside single mode.

## Time only (`NdpTimeInput`)

A standalone field for picking **just** a time — a text input showing `HH:mm` with a stepper
popover, no calendar. Type `0930` (Persian or ASCII digits) or open the popover to step. Its
value is a `Date` carrying the time (the day is today unless one is written in).

```vue
<NdpTimeInput v-model="time" />                    <!-- value: Date | null -->
<NdpTimeInput v-model="time" :minute-step="15" />
```

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `v-model` (`modelValue`) | `Date \| null` | `null` | The date's *time* is what matters. |
| `v-model:calendar` | `string` | first registered | Calendar whose numerals the digits render in. |
| `minute-step` | `number` | `1` | Minute increment (1–30). |
| `theme` | `NdpTheme` | `'light'` | Same theming as the picker. |
| `placeholder` | `string` | `'HH:mm'` | Field placeholder. |
| `input-id` | `string \| null` | `null` | `id` for an external `<label for>`. |
| `close-on-select` | `boolean` | `false` | Close the popover after a stepper change. |
| `disabled` | `boolean` | `false` | Disable the field. |
| `adapters` | — | — | Per-component calendar override. |

**Events:** `update:modelValue`, `update:calendar`, `time-selected` (emits the `Date` on
every commit — typed or stepped).

For a bare stepper with no field, use `NdpTimePicker` directly (props: `adapter`, `time:
TimeOfDay`, `minute-step`, `disabled`, `bordered`; event `time-change`).

## Dual-script (Gregorian alongside Jalali)

Set `show-secondary-date` to render each date in a second calendar at the same time —
Gregorian under Jalali, or vice-versa when the active calendar is Gregorian. The secondary
defaults to the first *other* registered calendar; override it with `secondary-calendar`.

```vue
<NdpDatepicker v-model="value" :show-secondary-date="true" />
<!-- force a specific companion calendar -->
<NdpDatepicker v-model="value" :show-secondary-date="true" secondary-calendar="gregorian" />
```

The month heading shows the companion month range (months don't line up 1:1) and the footer
summary shows the companion full date.

## Building a dropdown / popover

The component is just a panel — wrap it however you like. In `single` mode it fires
`@date-selected` on the first click, the natural moment to close:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { NdpDatepicker, JalaliCalendarAdapter } from '@vahidamirian/vue-datepicker';
import type { DateRange } from '@vahidamirian/datepicker-core';

const open = ref(false);
const value = ref<DateRange>({ start: null, end: null });
const cal = new JalaliCalendarAdapter();
const label = computed(() => (value.value.start ? cal.format(value.value.start) : 'Pick a date'));
</script>

<template>
  <div class="dropdown">
    <button @click="open = !open">{{ label }} ▾</button>
    <template v-if="open">
      <div class="backdrop" @click="open = false" />
      <div class="panel">
        <NdpDatepicker
          v-model="value"
          :show-footer="false"
          @date-selected="open = false"
        />
      </div>
    </template>
  </div>
</template>
```

(Or just reach for `NdpDateInput`, which already is a field + popover.)

## Calendars & conversion (headless)

Everything needed for Jalali ⇆ Gregorian ⇆ Hijri conversion is exported from the core, so you
can use it with no UI at all.

```ts
import {
  JalaaliMath, HijriMath,
  JalaliCalendarAdapter, GregorianCalendarAdapter,
} from '@vahidamirian/datepicker-core';

// Numeric conversion (no Date)
JalaaliMath.toJalaali(new Date(2026, 2, 21)); // { jy: 1405, jm: 1, jd: 1 }
JalaaliMath.toGregorian(1404, 1, 1);          // { gy: 2025, gm: 3, gd: 21 }

// Localized, written-out strings via the adapters
new JalaliCalendarAdapter().format(new Date());        // "شنبه ۱۷ خرداد"
new GregorianCalendarAdapter('en-US').format(new Date()); // "Saturday, June 7"

// Parse / format a compact editable string in any calendar
const cal = new JalaliCalendarAdapter();
cal.parse('۱۴۰۴/۰۳/۲۸');   // Date (Gregorian midnight) or null
cal.parse('1404/07/31');    // null — Mehr has 30 days
cal.formatInput(new Date()); // "۱۴۰۴/۰۳/۲۸"
```

Pass a locale to the Gregorian or Jalali adapter to control names and numerals, e.g.
`new GregorianCalendarAdapter('fa-IR')` or `new JalaliCalendarAdapter('en-US-u-ca-persian')`.

## Hijri (Islamic civil) calendar

`HijriCalendarAdapter` implements the **tabular Islamic civil** calendar: a fully arithmetic
30-year cycle, 354/355-day years, months alternating 30/29 days. It is deliberately **not**
Umm al-Qura and **not** sighting-based, so results are deterministic and identical in every
region and runtime.

```ts
import { HijriCalendarAdapter, JalaliCalendarAdapter } from '@vahidamirian/datepicker-core';

app.use(NdpDatepickerPlugin, {
  adapters: [new HijriCalendarAdapter(), new JalaliCalendarAdapter()],
});
```

**Day adjustment (observed vs. tabular).** Locally observed Hijri calendars differ from the
tabular computation by ±1–2 days depending on country and year. Rather than baking regional
data in, the adapter accepts an `adjustment` that shifts the tabular result by whole days:

```ts
new HijriCalendarAdapter({ adjustment: -1 });                  // fixed offset
new HijriCalendarAdapter({ adjustment: (date) => offset(date) }); // function / lookup table
```

`+1` means the observed calendar runs one day ahead of the tabular one. Keep the offset
stable within any one Hijri month so round-trips stay exact. Month names (Persian by default)
and the digit/weekday locale are configurable via `NdpHijriConfig` (`monthNames`, `locale`).

The math is exported headlessly too:

```ts
HijriMath.toHijri(new Date(2026, 5, 12)); // { hy: 1447, hm: 12, hd: 26 }
HijriMath.isLeapHijriYear(1445);          // true
HijriMath.hijriMonthLength(1446, 12);     // 29 (common year)
```

## Adding your own calendar

Implement `CalendarAdapter` and register it — no component changes required, the entire UI
talks only to the adapter interface:

```ts
import { CalendarAdapter } from '@vahidamirian/datepicker-core';

class MyEthiopianAdapter extends CalendarAdapter {
  readonly id = 'ethiopian';
  readonly direction = 'ltr' as const;
  readonly weekStartsOn = 0;
  // …implement getYear / getMonth / createDate / getMonthLabel / … (see the core README)
}

app.use(NdpDatepickerPlugin, {
  adapters: [new MyEthiopianAdapter(), new GregorianCalendarAdapter()],
});
```

`parse`, `formatInput`, `maskInput`, `addCalendarYears` and `startOfYear` all have working
defaults built on the abstract members, so a minimal adapter compiles and works immediately.
For the month/year picker, override `getMonthNames()` and `getYearLabel()` for localized
names. See the [core README](../core) for the full interface.

## Fully custom UI (`useDatepicker`)

Want your own markup entirely? `useDatepicker` is the full picker state machine as a
composable (the same one the SFC uses). You feed it reactive options and render its exposed
state however you like:

```ts
import { ref } from 'vue';
import { useDatepicker } from '@vahidamirian/vue-datepicker';
import { JalaliCalendarAdapter } from '@vahidamirian/datepicker-core';
import type { DateRange } from '@vahidamirian/datepicker-core';

const value = ref<DateRange>({ start: null, end: null });
const dp = useDatepicker({
  adapters: [new JalaliCalendarAdapter()],
  mode: ref('single'),
  numberOfMonths: ref(1),
  min: ref(null), max: ref(null), dateFilter: ref(null),
  animation: ref('none'),
  showTime: ref(false), minuteStep: ref(1),
  showSecondaryDate: ref(false), secondaryCalendar: ref(null),
  showInput: ref(false),
  value,
  calendar: ref(''),
  onSelected: (range) => {/* … */},
  getHost: () => hostEl.value,
});

// dp exposes: adapter, visibleMonths, monthsView, yearsView, canGoPrev/Next,
// onDaySelect, goPrev, goNext, goToToday, clear, toggleCalendar, onKeydown, … and more.
```

The presentational `NdpCalendarMonth` / `NdpCalendarPeriod` components pair naturally with
it, or drop down to the core's `buildMonthView` / `buildMonthsView` / `buildYearsView`.

## Keyboard

`←↑↓→` move focus · `Enter`/`Space` select · `PageUp`/`PageDown` change month ·
`Home`/`End` jump to start/end of month. Arrow direction is mirrored in RTL.

In **month / year** mode the same keys drive the period grid: `←→` move one month/year,
`↑↓` move a row (3 cells), `PageUp`/`PageDown` step the year (month mode) or page (year
mode), and `Enter`/`Space` commit. `Esc` closes an open quick-nav dropdown.

## Recipes

**Booking window — only the next 30 days, no weekends:**

```vue
<NdpDatepicker
  v-model="value"
  :min="today"
  :max="in30Days"
  :date-filter="(d) => d.getDay() !== 5"
/>
```

**Range limited to a maximum span** (e.g. 14 nights) — clamp `max` reactively to the chosen
start:

```ts
const max = computed(() =>
  range.value.start && !range.value.end ? addDays(range.value.start, 14) : null,
);
```

**Persist as ISO and restore:**

```ts
const iso = computed(() => value.value.start?.toISOString() ?? null);
// restore:
value.value = { start: saved ? new Date(saved) : null, end: null };
```

**Default the picker to a specific calendar and let the user switch:**

```vue
<NdpDatepicker v-model="value" v-model:calendar="cal" />
<!-- cal starts as 'jalali'; the footer's calendar toggle (or setting cal) flips it -->
```

**Month picker for a "billing month" selector:**

```vue
<NdpDateInput v-model="value" mode="range" />  <!-- or mode="month" on NdpDatepicker -->
```

---

Theming, calendars, dual-script, typed input, and time-of-day all behave identically to the
[Angular package](../angular) — same shared core. For the deepest headless details (view
builders, selection reducer, adapter interface), see the [core README](../core).

## License

MIT © [Vahid Amirian](https://github.com/vahidamiryan)
