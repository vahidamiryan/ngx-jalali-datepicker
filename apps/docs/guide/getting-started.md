# Getting started

The NDP date picker is a monorepo of three packages:

| Package | What it is |
| --- | --- |
| **`@vahidamiryan/datepicker-core`** | The framework-agnostic headless engine — types, calendar adapters + math, selection and view builders. Pure TypeScript, zero framework deps. |
| **`@vahidamiryan/ngx-jalali-datepicker`** | Angular 20+ components built on `@vahidamiryan/datepicker-core`. |
| **`@vahidamiryan/vue-datepicker`** | Vue 3 components built on `@vahidamiryan/datepicker-core`. |

Pick the framework package for your app; it pulls in `@vahidamiryan/datepicker-core` for you.

## Vue 3

```bash
npm install @vahidamiryan/vue-datepicker @vahidamiryan/datepicker-core vue
```

```ts
import { createApp } from 'vue'
import { NdpDatepickerPlugin } from '@vahidamiryan/vue-datepicker'
import { JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamiryan/datepicker-core'
import '@vahidamiryan/vue-datepicker/styles.css'

createApp(App)
  .use(NdpDatepickerPlugin, {
    adapters: [new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')],
  })
  .mount('#app')
```

```vue
<NdpDatepicker v-model="value" />
```

→ [Live Vue examples](/vue/)

## Angular

```bash
npm install @vahidamiryan/ngx-jalali-datepicker @vahidamiryan/datepicker-core
```

```ts
provideNgxDatepicker(new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US'))
```

```html
<ndp-datepicker [(value)]="value" />
```

→ [Angular examples](/angular/)

## The value shape

Everywhere in the API a date is a native JS `Date` at local midnight, and a
selection is a `DateRange`:

```ts
interface DateRange {
  start: Date | null
  end: Date | null // only populated in range mode
}
```

The adapters translate that canonical Gregorian instant to and from each calendar's
own year/month/day — see [Calendars & adapters](/guide/calendars).
