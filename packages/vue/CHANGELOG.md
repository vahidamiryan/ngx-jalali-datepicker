# Changelog

All notable changes to **@vahidamirian/vue-datepicker** are documented in
this file. The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

**npm:** https://www.npmjs.com/package/@vahidamirian/vue-datepicker

## [1.0.0]

### Added
- **Initial release** — Vue 3 date picker components built on the shared
  `@vahidamirian/datepicker-core` headless engine. Feature-parity with
  `@vahidamirian/ngx-jalali-datepicker` v1.3.0.

#### Components
- **`<NdpDatepicker>`** — the main calendar panel. Supports `single` and
  `range` selection modes, multi-month layouts (`monthsToShow`), month/year
  picker modes, quick navigation dropdowns (`showQuickNav`), slide animation,
  light/dark/auto theming, time-of-day picker (`showTime`, `minuteStep`),
  inline date input (`showInput`), secondary calendar overlay
  (`showSecondaryDate`), day-of-week filter, `min`/`max` bounds, custom CSS
  tokens (`customVars`), and full keyboard navigation. Supports `v-model`.
- **`<NdpDateInput>`** — a text field that parses typed dates (e.g.
  `۱۴۰۴/۰۳/۲۸`) and opens an `<NdpDatepicker>` popover for picking. Range
  mode shows two fields (start / end). Supports `v-model`.
- **`<NdpTimePicker>`** — standalone hours:minutes stepper with localized
  digits and configurable `minuteStep`. `bordered` prop for embedded use.
- **`<NdpTimeInput>`** — a time-only text field (`HH:mm`) with a stepper
  popover and no calendar. Supports `v-model`.
- **`<NdpCalendarMonth>`** — the day grid as a standalone component. Accepts a
  precomputed `MonthView` and emits `select` / `hover` events.
- **`<NdpCalendarPeriod>`** — month/year period grid as a standalone
  component.

#### Plugin & DI
- **`NdpDatepickerPlugin`** — Vue plugin to configure calendars app-wide:
  `app.use(NdpDatepickerPlugin, { adapters: [...] })`. Adapter sources can be
  instances or lazy factories.
- **`NdpVue`** — optional convenience plugin that registers all components
  globally.
- **`useCalendarAdapters()`** — composable to resolve the active adapters
  (per-component `:adapters` prop wins over the app-level plugin).
- **`useDatepicker()`** — headless composable exposing the full reactive
  datepicker state (views, selection, navigation, time). Build a completely
  custom UI on top of it.

#### Scoped slots
- **`#day-cell`** — scoped slot on `<NdpDatepicker>` and `<NdpCalendarMonth>`
  for custom day cell rendering. Receives the full `DayCell` object.

#### Styling
- All CSS ported from the Angular package using CSS custom properties
  (`--ndp-*`). Shipped as `@vahidamirian/vue-datepicker/styles.css`.
- Light, dark, and auto themes via the `theme` prop.
- Full `customVars` support for programmatic token overrides.

#### Re-exports
- The entire `@vahidamirian/datepicker-core` public API is re-exported, so
  consumers can import adapters, math, types, and headless utilities from a
  single package.

[1.0.0]: https://github.com/vahidamiryan/ngx-jalali-datepicker/releases/tag/vue-v1.0.0
