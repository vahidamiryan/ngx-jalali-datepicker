---
layout: home

hero:
  name: NDP Date Picker
  text: One core, every framework
  tagline: High-performance Jalali / Gregorian / Hijri date picker. A shared headless @ndp/core with first-class Angular and Vue 3 components.
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
    details: "All calendar math, adapters, selection and view-building live in @ndp/core — pure TypeScript, zero framework deps. Fix a bug once, both frameworks get it."
  - title: Jalali · Gregorian · Hijri
    details: "Battle-tested conversion math verified against the platform Intl calendars, with dual-script display and a pluggable adapter layer for any calendar."
  - title: Angular & Vue, identical behavior
    details: "@ndp/angular (signals, zoneless, OnPush) and @ndp/vue (Composition API, v-model, scoped slots) render the same UI from the same core."
  - title: Fast by construction
    details: "Every per-day flag is precomputed once; templates read only booleans. Numeric yyyymmdd keys, no per-cell string allocations."
---
