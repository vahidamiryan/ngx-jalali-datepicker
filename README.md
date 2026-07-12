<div align="center">

# 📅 Jalali Date Picker — Angular & Vue

**High-performance, zero-dependency Jalali (Shamsi) / Gregorian / Hijri date picker**
with first-class **Angular 20+** and **Vue 3** components on one shared headless core.

[![npm (Angular)](https://img.shields.io/npm/v/@vahidamiryan/ngx-jalali-datepicker?label=angular&color=dd0031)](https://www.npmjs.com/package/@vahidamiryan/ngx-jalali-datepicker)
[![npm (Vue)](https://img.shields.io/npm/v/@vahidamiryan/vue-datepicker?label=vue&color=42b883)](https://www.npmjs.com/package/@vahidamiryan/vue-datepicker)
[![npm (core)](https://img.shields.io/npm/v/@vahidamiryan/datepicker-core?label=core&color=3178c6)](https://www.npmjs.com/package/@vahidamiryan/datepicker-core)
[![downloads](https://img.shields.io/npm/dm/@vahidamiryan/ngx-jalali-datepicker?label=downloads&color=cb3837)](https://www.npmjs.com/package/@vahidamiryan/ngx-jalali-datepicker)
[![license](https://img.shields.io/npm/l/@vahidamiryan/ngx-jalali-datepicker?color=blue)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@vahidamiryan/ngx-jalali-datepicker?label=gzip)](https://bundlephobia.com/package/@vahidamiryan/ngx-jalali-datepicker)

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
  pure `@vahidamiryan/datepicker-core` with **zero framework dependencies**. Angular and
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
npm install @vahidamiryan/ngx-jalali-datepicker @vahidamiryan/datepicker-core
```
```ts
// app.config.ts
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgxDatepicker, JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamiryan/ngx-jalali-datepicker';

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
npm install @vahidamiryan/vue-datepicker @vahidamiryan/datepicker-core vue
```
```ts
// main.ts
import { NdpDatepickerPlugin } from '@vahidamiryan/vue-datepicker';
import { JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamiryan/datepicker-core';
import '@vahidamiryan/vue-datepicker/styles.css';

createApp(App).use(NdpDatepickerPlugin, {
  adapters: [new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')],
}).mount('#app');
```
```vue
<NdpDatepicker v-model="value" />
```

> **Headless, no UI?** Import `@vahidamiryan/datepicker-core` directly for Jalali ⇆ Gregorian ⇆ Hijri
> conversion and month-grid building with no framework at all.

## Packages

| Package | Framework | Description |
| --- | --- | --- |
| [`@vahidamiryan/ngx-jalali-datepicker`](packages/angular) | Angular 20+ | Signals, zoneless, `OnPush`, `ControlValueAccessor`. |
| [`@vahidamiryan/vue-datepicker`](packages/vue) | Vue 3 | Composition API, `v-model`, scoped slots. |
| [`@vahidamiryan/datepicker-core`](packages/core) | none | Headless engine — adapters, math, view builders. Zero deps. |

```
@vahidamiryan/datepicker-core   (pure TS engine — shared by both)
   ├── @vahidamiryan/ngx-jalali-datepicker   (Angular component layer)
   └── @vahidamiryan/vue-datepicker          (Vue 3 component layer)
```

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
