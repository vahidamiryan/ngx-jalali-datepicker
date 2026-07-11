# @ndp/vue

High-performance, customizable **Jalali / Gregorian / Hijri date picker for Vue 3**,
built on the shared [`@ndp/core`](../core) headless engine — the same calendar math
and selection logic that powers [`@ndp/angular`](../angular), so behavior is identical
across frameworks.

## Install

```bash
npm install @ndp/vue @ndp/core vue
```

## Setup

Configure the calendars once via the plugin (the first is the default):

```ts
import { createApp } from 'vue';
import { NdpDatepickerPlugin } from '@ndp/vue';
import { JalaliCalendarAdapter, GregorianCalendarAdapter } from '@ndp/core';
import '@ndp/vue/styles.css';

createApp(App)
  .use(NdpDatepickerPlugin, {
    adapters: [new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')],
  })
  .mount('#app');
```

Or pass calendars per-component with the `:adapters` prop (no plugin needed).

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { NdpDatepicker, NdpDateInput, NdpTimeInput } from '@ndp/vue';
import type { DateRange } from '@ndp/core';

const value = ref<DateRange>({ start: null, end: null });
const time = ref<Date | null>(null);
</script>

<template>
  <!-- Single date -->
  <NdpDatepicker v-model="value" />

  <!-- Range, two months, no past dates -->
  <NdpDatepicker v-model="range" mode="range" :number-of-months="2" :min="today" />

  <!-- Typed input with a calendar popover -->
  <NdpDateInput v-model="value" />

  <!-- Time-only field -->
  <NdpTimeInput v-model="time" :minute-step="15" />

  <!-- Custom day cell via a scoped slot -->
  <NdpDatepicker v-model="value">
    <template #day="{ day }">{{ day.label }}<i v-if="day.isWeekend" /></template>
  </NdpDatepicker>
</template>
```

`v-model` binds the `DateRange` value; `v-model:calendar` binds the active calendar id.
`@date-selected` fires on every concrete pick (handy for closing a dropdown).

## Components

`NdpDatepicker`, `NdpDateInput`, `NdpTimePicker`, `NdpTimeInput`, `NdpCalendarMonth`,
`NdpCalendarPeriod` — plus the `useDatepicker` composable to build a fully custom UI on
the same state machine.

Theming, calendars, dual-script display, typed input, and time-of-day all work exactly
as documented in the [main README](https://github.com/vahidamiryan/ngx-jalali-datepicker) —
the API mirrors the Angular package.

## License

MIT © Vahid Amirian
