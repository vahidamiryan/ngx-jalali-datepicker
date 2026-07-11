# Vue 3

Live, interactive examples rendered by the real `@ndp/vue` components (this docs
site is itself a Vue app). Install:

```bash
npm install @ndp/vue @ndp/core vue
```

<script setup>
import { ref } from 'vue'

const single = ref({ start: null, end: null })
const range = ref({ start: null, end: null })
const typed = ref({ start: null, end: null })
const time = ref(null)

const today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d })()

function fmt(v) {
  if (v instanceof Date) return v.toString()
  if (!v || (!v.start && !v.end)) return '{ start: null, end: null }'
  const s = v.start ? v.start.toDateString() : 'null'
  const e = v.end ? v.end.toDateString() : 'null'
  return `{ start: ${s}, end: ${e} }`
}
</script>

## Single date

<div class="ndp-demo">
  <NdpDatepicker v-model="single" />
  <div class="ndp-demo__value">value = {{ fmt(single) }}</div>
</div>

```vue
<script setup>
import { ref } from 'vue'
import { NdpDatepicker } from '@ndp/vue'
const value = ref({ start: null, end: null })
</script>

<template>
  <NdpDatepicker v-model="value" />
</template>
```

## Range, two months, no past dates

<div class="ndp-demo">
  <NdpDatepicker v-model="range" mode="range" :number-of-months="2" :min="today" />
  <div class="ndp-demo__value">value = {{ fmt(range) }}</div>
</div>

```vue
<NdpDatepicker v-model="range" mode="range" :number-of-months="2" :min="today" />
```

## Typed input with a calendar popover

<div class="ndp-demo">
  <NdpDateInput v-model="typed" />
  <div class="ndp-demo__value">value = {{ fmt(typed) }}</div>
</div>

```vue
<NdpDateInput v-model="value" />
```

## Time-only field

<div class="ndp-demo">
  <NdpTimeInput v-model="time" :minute-step="15" />
  <div class="ndp-demo__value">value = {{ fmt(time) }}</div>
</div>

```vue
<NdpTimeInput v-model="time" :minute-step="15" />
```

## Dual calendar (Gregorian under Jalali)

<div class="ndp-demo">
  <NdpDatepicker v-model="single" :show-secondary-date="true" />
</div>

```vue
<NdpDatepicker v-model="value" :show-secondary-date="true" />
```

## Custom day cell (scoped slot)

<div class="ndp-demo">
  <NdpDatepicker v-model="single">
    <template #day="{ day }">
      <strong :style="{ color: day.isWeekend ? 'var(--vp-c-brand-1)' : 'inherit' }">{{ day.label }}</strong>
    </template>
  </NdpDatepicker>
</div>

```vue
<NdpDatepicker v-model="value">
  <template #day="{ day }">
    <strong :class="{ weekend: day.isWeekend }">{{ day.label }}</strong>
  </template>
</NdpDatepicker>
```

## Setup

Configure the calendars once (the first is the default):

```ts
import { createApp } from 'vue'
import { NdpDatepickerPlugin } from '@ndp/vue'
import { JalaliCalendarAdapter, GregorianCalendarAdapter } from '@ndp/core'
import '@ndp/vue/styles.css'

createApp(App)
  .use(NdpDatepickerPlugin, {
    adapters: [new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')],
  })
  .mount('#app')
```

`v-model` binds the `DateRange`; `v-model:calendar` binds the active calendar id;
`@date-selected` fires on every concrete pick.
