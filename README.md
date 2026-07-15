<div align="center">

# 📅 Jalali Date Picker — Angular & Vue

**High-performance, zero-dependency Jalali (Shamsi) / Gregorian / Hijri date picker**
with first-class **Angular 20+** and **Vue 3** components on one shared headless core.

[![npm (Angular)](https://img.shields.io/npm/v/@vahidamirian/ngx-jalali-datepicker?label=angular&color=dd0031)](https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker)
[![npm (Vue)](https://img.shields.io/npm/v/@vahidamirian/vue-datepicker?label=vue&color=42b883)](https://www.npmjs.com/package/@vahidamirian/vue-datepicker)
[![npm (core)](https://img.shields.io/npm/v/@vahidamirian/datepicker-core?label=core&color=3178c6)](https://www.npmjs.com/package/@vahidamirian/datepicker-core)
[![downloads](https://img.shields.io/npm/dm/@vahidamirian/ngx-jalali-datepicker?label=downloads&color=cb3837)](https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker)
[![license](https://img.shields.io/npm/l/@vahidamirian/ngx-jalali-datepicker?color=blue)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@vahidamirian/ngx-jalali-datepicker?label=gzip)](https://bundlephobia.com/package/@vahidamirian/ngx-jalali-datepicker)

### [🔗 Live Demo & Docs →](https://vahidamiryan.github.io/ngx-jalali-datepicker/)

</div>

---

## Why this one?

Most Persian date pickers are heavy, tied to an old framework model, or a nightmare to
theme. This one is built differently:

- ⚡ **Fast by construction** — every per-day flag (selected / in-range / disabled / today)
  is precomputed once; templates read only booleans, comparisons use numeric `yyyymmdd`
  keys, never string allocations. Angular build is **zoneless + `OnPush` + signals**.
- 🧩 **Headless core, thin components** — all calendar math and selection logic live in a
  pure `@vahidamirian/datepicker-core` with **zero framework dependencies**. Angular and
  Vue share the *exact same* engine, so a fix in one lands in both.
- 🗓️ **Three calendars out of the box** — Jalali/Shamsi, Gregorian, and tabular Hijri, all
  verified against the platform `Intl`. Add your own by implementing one adapter interface.
- 🎨 **Themeable to the pixel** — every color/radius/shadow is a `--ndp-*` CSS variable;
  light/dark built in. Replace a whole day cell with content projection (Angular) or a
  scoped slot (Vue).
- ✅ **Complete** — range, multi-month, month/year pickers, typed input with parsing,
  time-of-day, dual-script (Gregorian under Jalali), full keyboard nav, RTL, forms
  integration (`ControlValueAccessor` / `v-model`).

## Install

**Angular**
```bash
npm install @vahidamirian/ngx-jalali-datepicker @vahidamirian/datepicker-core
```
```ts
// app.config.ts
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgxDatepicker, JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamirian/ngx-jalali-datepicker';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideNgxDatepicker(new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')),
  ],
};
```
```html
<ndp-datepicker [(value)]="value" />
```

**Vue 3**
```bash
npm install @vahidamirian/vue-datepicker @vahidamirian/datepicker-core vue
```
```ts
// main.ts
import { NdpDatepickerPlugin } from '@vahidamirian/vue-datepicker';
import { JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamirian/datepicker-core';
import '@vahidamirian/vue-datepicker/styles.css';

createApp(App).use(NdpDatepickerPlugin, {
  adapters: [new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')],
}).mount('#app');
```
```vue
<NdpDatepicker v-model="value" />
```

> **Headless, no UI?** Import `@vahidamirian/datepicker-core` directly for Jalali ⇆ Gregorian ⇆ Hijri
> conversion and month-grid building with no framework at all.

## Packages

Each package has its own full README (installation, every prop/input, theming
tokens, recipes) — the table links straight to it, not just the folder.

| Package | Framework | Full docs | Description |
| --- | --- | --- | --- |
| [`@vahidamirian/ngx-jalali-datepicker`](packages/angular#readme) | Angular 20+ | [README](packages/angular/README.md) | Signals, zoneless, `OnPush`, `ControlValueAccessor`. |
| [`@vahidamirian/vue-datepicker`](packages/vue#readme) | Vue 3 | [README](packages/vue/README.md) | Composition API, `v-model`, scoped slots. |
| [`@vahidamirian/datepicker-core`](packages/core#readme) | none | [README](packages/core/README.md) | Headless engine — adapters, math, view builders. Zero deps. |

```
@vahidamirian/datepicker-core   (pure TS engine — shared by both)
   ├── @vahidamirian/ngx-jalali-datepicker   (Angular component layer)
   └── @vahidamirian/vue-datepicker          (Vue 3 component layer)
```

## Features & options

Every option is documented per framework. The links below jump straight to the
right section of each package README — same feature, framework-idiomatic API.

| Feature | Angular | Vue | Core (headless) |
| --- | --- | --- | --- |
| Selection modes — single / range / month / year | [modes](packages/angular/README.md#month--year-picker--quick-navigation) | [modes](packages/vue/README.md#selection-modes-single--range--month--year) | [reducer](packages/core/README.md#selection-reducer) |
| Multi-month (`numberOfMonths`) | [inputs](packages/angular/README.md#datepickercomponent-inputs) | [props](packages/vue/README.md#ndpdatepicker--props--events--slots) | — |
| Bounds & disabling days (`min` / `max` / `dateFilter`) | [bounds](packages/angular/README.md#bounds--disabling-days) | [bounds](packages/vue/README.md#bounds--disabling-days) | [view builders](packages/core/README.md#view-builders-render-ready-grids) |
| Theming — light / dark / custom `--ndp-*` tokens | [theming](packages/angular/README.md#theming-light--dark--custom) | [theming](packages/vue/README.md#theming-light--dark--custom) | — |
| Custom day cell | [`ndpDayCell`](packages/angular/README.md#quick-start) | [`#day` slot](packages/vue/README.md#customizing-the-day-cell-scoped-slot) | [`DayCell`](packages/core/README.md#type-reference) |
| Typed input (parse + popover) | [typing dates](packages/angular/README.md#typing-dates-input-field) | [`NdpDateInput`](packages/vue/README.md#typing-dates-ndpdateinput) | [parsing](packages/core/README.md#parsing-formatting--digits) |
| Time of day | [time](packages/angular/README.md#time-of-day) | [time](packages/vue/README.md#time-of-day) | [time helpers](packages/core/README.md#time-of-day-helpers) |
| Calendars — Jalali / Gregorian / Hijri | [Hijri](packages/angular/README.md#hijri-islamic-civil-calendar) | [Hijri](packages/vue/README.md#hijri-islamic-civil-calendar) | [adapters](packages/core/README.md#calendar-adapters) |
| Dual-script (companion calendar) | [dual-script](packages/angular/README.md#dual-script-gregorian-alongside-jalali) | [dual-script](packages/vue/README.md#dual-script-gregorian-alongside-jalali) | — |
| Navigation animation | [animation](packages/angular/README.md#navigation-animation) | [props](packages/vue/README.md#ndpdatepicker--props--events--slots) | — |
| Date arithmetic (add / subtract) | [arithmetic](packages/angular/README.md#date-arithmetic--add--subtract) | [arithmetic](packages/vue/README.md#date-arithmetic--add--subtract) | [arithmetic](packages/core/README.md#date-arithmetic--add--subtract) |
| Conversion math (Jalali ⇆ Gregorian ⇆ Hijri) | [conversion](packages/angular/README.md#converting-gregorian--jalali-no-ui) | [conversion](packages/vue/README.md#calendars--conversion-headless) | [math](packages/core/README.md#conversion-math-jalaalimath--hijrimath) |
| Keyboard & RTL | [keyboard](packages/angular/README.md#keyboard) | [keyboard](packages/vue/README.md#keyboard) | — |
| Add your own calendar | [adding a calendar](packages/angular/README.md#adding-a-calendar) | [adding a calendar](packages/vue/README.md#adding-your-own-calendar) | [custom adapter](packages/core/README.md#writing-a-custom-calendar-adapter) |
| Fully custom / headless UI | [dropdown](packages/angular/README.md#building-a-dropdown--popover) | [`useDatepicker`](packages/vue/README.md#fully-custom-ui-usedatepicker) | [worked example](packages/core/README.md#building-a-headless-picker-worked-example) |

Prefer live, runnable demos? The [docs site](https://vahidamiryan.github.io/ngx-jalali-datepicker/)
renders every example with the real components.

## Develop

npm-workspaces monorepo (Node 20+):

```bash
npm install
npm run build          # core → angular → vue (dependency order)
npm run test           # core + vue suites
npm run dev:docs       # unified docs with live Angular + Vue examples
```

Publishing is automated in [`.github/workflows/release.yml`](.github/workflows/release.yml)
(core first, then the framework packages).

## Contributing

Issues, feature requests, and PRs are welcome — this project is actively developed and
shaped by real feedback. If a calendar edge case or a framework idiom is missing, open an
issue.

## License

MIT © [Vahid Amirian](https://github.com/vahidamiryan)
