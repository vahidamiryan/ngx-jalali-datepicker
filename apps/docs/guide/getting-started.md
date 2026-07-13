# Getting started

The NDP date picker is a monorepo of three packages:

| Package | What it is |
| --- | --- |
| **`@vahidamirian/datepicker-core`** | The framework-agnostic headless engine — types, calendar adapters + math, selection and view builders. Pure TypeScript, zero framework deps. |
| **`@vahidamirian/ngx-jalali-datepicker`** | Angular 20+ components built on `@vahidamirian/datepicker-core`. |
| **`@vahidamirian/vue-datepicker`** | Vue 3 components built on `@vahidamirian/datepicker-core`. |

Pick the framework package for your app; it pulls in `@vahidamirian/datepicker-core` for you.

## Vue 3

```bash
npm install @vahidamirian/vue-datepicker @vahidamirian/datepicker-core vue
```

```ts
import { createApp } from 'vue'
import { NdpDatepickerPlugin } from '@vahidamirian/vue-datepicker'
import { JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamirian/datepicker-core'
import '@vahidamirian/vue-datepicker/styles.css'

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
npm install @vahidamirian/ngx-jalali-datepicker @vahidamirian/datepicker-core
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
