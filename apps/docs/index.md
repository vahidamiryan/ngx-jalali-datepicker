---
layout: home

hero:
  name: Jalali Date Picker
  text: Angular & Vue, one shared core
  tagline: Free, high-performance Jalali (Shamsi) / Gregorian / Hijri date picker. Zoneless & signals for Angular 20+, Composition API for Vue 3 — from one headless engine.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Vue examples
      link: /vue/
    - theme: alt
      text: Angular examples
      link: /angular/

features:
  - title: Shared headless core
    details: "All calendar math, adapters, selection and view-building live in @vahidamiryan/datepicker-core — pure TypeScript, zero framework deps. Fix a bug once, both frameworks get it."
  - title: Jalali · Gregorian · Hijri
    details: "Battle-tested conversion math verified against the platform Intl calendars, with dual-script display and a pluggable adapter layer for any calendar."
  - title: Angular & Vue, identical behavior
    details: "@vahidamiryan/ngx-jalali-datepicker (signals, zoneless, OnPush) and @vahidamiryan/vue-datepicker (Composition API, v-model, scoped slots) render the same UI from the same core."
  - title: Fast by construction
    details: "Every per-day flag is precomputed once; templates read only booleans. Numeric yyyymmdd keys, no per-cell string allocations."
---
