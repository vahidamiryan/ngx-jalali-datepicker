# Vue 3

Live, interactive examples rendered by the real `@vahidamirian/vue-datepicker` components (this docs
site is itself a Vue app). They render the same UI as `@vahidamirian/ngx-jalali-datepicker` from the same
`@vahidamirian/datepicker-core`, so behavior is identical. Install:

```bash
npm install @vahidamirian/vue-datepicker @vahidamirian/datepicker-core vue
```

<script setup>
import { ref } from 'vue'
import { useDocsTheme } from '../.vitepress/theme/useDocsTheme'

// Follow the site's light/dark toggle so every picker below flips with it.
const theme = useDocsTheme()

const single = ref({ start: null, end: null })
const range = ref({ start: null, end: null })
const typed = ref({ start: null, end: null })
const time = ref(null)
const period = ref({ start: null, end: null })
const hijri = ref({ start: null, end: null })
const dual = ref({ start: null, end: null })
const custom = ref({ start: null, end: null })
const form = ref({ start: null, end: null })

const today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d })()

function fmt(v) {
  if (v instanceof Date) return v.toString()
  if (!v || (!v.start && !v.end)) return '{ start: null, end: null }'
  const s = v.start ? v.start.toDateString() : 'null'
  const e = v.end ? v.end.toDateString() : 'null'
  return `{ start: ${s}, end: ${e} }`
}
</script>

## Setup

Configure the calendars once (the **first is the default**). Register every
calendar an example on this page uses — including `HijriCalendarAdapter`, or the
Hijri demo below throws a "calendar not registered" error:

```ts
// main.ts
import { createApp } from 'vue'
import { NdpDatepickerPlugin } from '@vahidamirian/vue-datepicker'
import {
  JalaliCalendarAdapter,
  GregorianCalendarAdapter,
  HijriCalendarAdapter,
} from '@vahidamirian/datepicker-core'
import '@vahidamirian/vue-datepicker/styles.css'

createApp(App)
  .use(NdpDatepickerPlugin, {
    adapters: [
      new JalaliCalendarAdapter(),
      new GregorianCalendarAdapter('en-US'),
      new HijriCalendarAdapter(),
    ],
  })
  .mount('#app')
```

> Only register what you actually use — a Jalali-only app can drop the other two
> and never bundles their conversion math.

## Single date

<div class="ndp-demo">
  <NdpDatepicker v-model="single" :theme="theme" />
  <div class="ndp-demo__value">value = {{ fmt(single) }}</div>
</div>

```vue
<script setup>
import { ref } from 'vue'
import { NdpDatepicker } from '@vahidamirian/vue-datepicker'
const value = ref({ start: null, end: null })
</script>

<template>
  <NdpDatepicker v-model="value" />
</template>
```

## Range, two months, no past dates

<div class="ndp-demo">
  <NdpDatepicker v-model="range" :theme="theme" mode="range" :number-of-months="2" :min="today" />
  <div class="ndp-demo__value">value = {{ fmt(range) }}</div>
</div>

```vue
<NdpDatepicker v-model="value" mode="range" :number-of-months="2" :min="today" />
```

## Typed input with a calendar popover

<div class="ndp-demo">
  <NdpDateInput v-model="typed" :theme="theme" />
  <div class="ndp-demo__value">value = {{ fmt(typed) }}</div>
</div>

```vue
<NdpDateInput v-model="value" />
```

## Time-only field

<div class="ndp-demo">
  <NdpTimeInput v-model="time" :theme="theme" :minute-step="5" />
  <div class="ndp-demo__value">value = {{ fmt(time) }}</div>
</div>

```vue
<NdpTimeInput v-model="time" :minute-step="5" />
```

## Month / year picker

<div class="ndp-demo">
  <NdpDatepicker v-model="period" :theme="theme" mode="month" />
  <div class="ndp-demo__value">value = {{ fmt(period) }}</div>
</div>

```vue
<NdpDatepicker v-model="value" mode="month" />
<NdpDatepicker v-model="value" mode="year" />
```

## Hijri with a secondary date

<div class="ndp-demo">
  <NdpDatepicker v-model="hijri" :theme="theme" calendar="hijri" :show-secondary-date="true" />
  <div class="ndp-demo__value">value = {{ fmt(hijri) }}</div>
</div>

```vue
<NdpDatepicker v-model="value" calendar="hijri" :show-secondary-date="true" />
```

## Dual-script (Gregorian under Jalali)

<div class="ndp-demo">
  <NdpDatepicker v-model="dual" :theme="theme" :show-secondary-date="true" />
  <div class="ndp-demo__value">value = {{ fmt(dual) }}</div>
</div>

```vue
<NdpDatepicker v-model="value" :show-secondary-date="true" />
<NdpDatepicker v-model="value" :show-secondary-date="true" secondary-calendar="gregorian" />
```

## Custom day cell (scoped slot)

<div class="ndp-demo">
  <NdpDatepicker v-model="custom" :theme="theme">
    <template #day="{ day }">
      {{ day.label }}<span v-if="day.isWeekend" aria-hidden="true"> •</span>
    </template>
  </NdpDatepicker>
  <div class="ndp-demo__value">value = {{ fmt(custom) }}</div>
</div>

```vue
<NdpDatepicker v-model="value">
  <template #day="{ day }">
    {{ day.label }}<span v-if="day.isWeekend"> •</span>
  </template>
</NdpDatepicker>
```

## v-model binding (forms)

`v-model` is the Vue equivalent of Angular's `ControlValueAccessor` — bind it to
any ref and it stays in sync, ready for vee-validate / FormKit.

<div class="ndp-demo">
  <NdpDatepicker v-model="form" :theme="theme" />
  <div class="ndp-demo__value">form value = {{ fmt(form) }}</div>
</div>

```vue
<NdpDatepicker v-model="form" />
```

---

`v-model` binds the `DateRange`; `v-model:calendar` binds the active calendar id;
`@date-selected` fires on every concrete pick.

**Keep going:** [Options & customization](/guide/options) (modes, `min`/`max`,
`date-filter`, animation, footer toggles, keyboard) · [Theming](/guide/theming) ·
[Calendars & adapters](/guide/calendars). The complete prop / event / slot table
is in the [package README](https://github.com/vahidamiryan/ngx-jalali-datepicker/tree/main/packages/vue#ndpdatepicker--props--events--slots).
