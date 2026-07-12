# Typed input

For faster entry than clicking, dates can be typed directly. The field parses
through the active calendar adapter (`/`, `-`, or `.` separators and
Persian/Arabic-Indic digits are all accepted); impossible dates are flagged
`aria-invalid` without changing the value.

<script setup>
import { ref } from 'vue'
const value = ref({ start: null, end: null })
const range = ref({ start: null, end: null })
</script>

## Vue — live

<div class="ndp-demo">
  <div class="ndp-demo__row">
    <NdpDateInput v-model="value" />
    <NdpDateInput v-model="range" mode="range" />
  </div>
</div>

```vue
<NdpDateInput v-model="value" />
<NdpDateInput v-model="range" mode="range" />
```

## Angular

```html
<ndp-date-input [(value)]="value" />
<ndp-date-input mode="range" [(value)]="range" />

<!-- render the typing field(s) inside the panel itself -->
<ndp-datepicker [showInput]="true" [(value)]="value" />
```

## Headless parsing

`parse` / `formatInput` live on `CalendarAdapter`, so you can convert a typed string
to a `Date` in any calendar without any UI:

```ts
import { JalaliCalendarAdapter } from '@vahidamiryan/datepicker-core'

const cal = new JalaliCalendarAdapter()
cal.parse('۱۴۰۴/۰۳/۲۸')    // Date or null
cal.parse('1404/07/31')     // null — Mehr has 30 days
cal.formatInput(new Date()) // "۱۴۰۴/۰۳/۲۸"
```
