# Time of day

Add an hours : minutes picker (single mode) so the selected `Date` carries a time
instead of local midnight. `minuteStep` (1–30) sets the increment for the steppers
and the ↑/↓ arrow keys.

<script setup>
import { ref } from 'vue'
const value = ref({ start: null, end: null })
const time = ref(null)
function fmt(v) {
  if (v instanceof Date) return v.toLocaleTimeString()
  const s = v?.start
  return s ? s.toString() : '—'
}
</script>

## Vue — live

<div class="ndp-demo">
  <NdpDatepicker v-model="value" :show-time="true" :minute-step="5" />
  <div class="ndp-demo__value">start = {{ fmt(value) }}</div>
</div>

```vue
<NdpDatepicker v-model="value" :show-time="true" :minute-step="5" />
```

### Time-only field

<div class="ndp-demo">
  <NdpTimeInput v-model="time" :minute-step="15" />
  <div class="ndp-demo__value">value = {{ fmt(time) }}</div>
</div>

```vue
<NdpTimeInput v-model="time" :minute-step="15" />
```

## Angular

```html
<ndp-datepicker [showTime]="true" [minuteStep]="5" [(value)]="value" />
<ndp-date-input [showTime]="true" [(value)]="value" />
<ndp-time-input [minuteStep]="15" [(value)]="time" />
```

## Headless helpers

```ts
import { getTimeOfDay, withTimeOfDay } from '@ndp/core'

getTimeOfDay(value.start)              // { hours: 14, minutes: 30 }
withTimeOfDay(value.start, 9, 0)       // same day at 09:00 (a new Date)
```
