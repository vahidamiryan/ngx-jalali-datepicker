# Changelog

All notable changes to **@vahidamirian/vue-datepicker** are documented in
this file. The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

**npm:** https://www.npmjs.com/package/@vahidamirian/vue-datepicker

## [1.2.0]

### Added
- **Configurable labels** — the `labels` prop on every component, and `NDP_LABELS_KEY`
  for application-wide text via `app.provide()`. A component's prop wins over the
  provide, and both merge over the calendar default, so you override only the keys you
  need.

### Fixed
- **English UI showed Persian text.** The footer buttons, every `aria-label`, and the
  calendar-toggle button were hardcoded Persian regardless of the active calendar, so a
  Gregorian picker in an English app rendered `امروز` / `پاک کردن` and announced Persian to
  screen readers. Text now comes from a label set that defaults to English for Gregorian
  and Persian for Jalali / Hijri.
- **The range separator pointed the wrong way in LTR.** It was a hardcoded `←` glyph, so
  `Aug 21 ← Sep 22` read backwards in English. It is now a directional icon that mirrors
  with the writing direction, as the nav chevrons already do.
- The calendar-toggle button assumed a Jalali/Gregorian pair and mislabelled itself when
  Hijri was registered; it now names whichever calendar it will switch to.

## [1.1.0]

### Added
- **Swappable icons** — provide `NDP_ICONS_KEY` to override any subset of the built-in
  glyphs; `NdpIcon` renders them as inline SVG that inherits `currentColor` and the size
  tokens.
- **Density presets** — `data-ndp-preset="compact"` / `"comfortable"` on the component
  or any ancestor.
- **New tokens** — `--ndp-font-family`, `--ndp-font-size`, `--ndp-day-font-size`,
  `--ndp-weekday-font-size`, `--ndp-space`, `--ndp-cell-gap`, `--ndp-icon-size`,
  `--ndp-icon-size-sm`, `--ndp-icon-stroke`, `--ndp-disabled-opacity`.

### Changed
- **Tokens are now defined once on `:root`** instead of being redeclared per component,
  so a single global override re-themes the picker, date input and time field together.
  They are bundled into `styles.css` — no extra import needed.
- **Palette corrected for WCAG contrast.** Selected-day text (3.68:1), weekend days
  (3.76:1), muted text (2.56:1) and out-of-month days (1.48:1 light / 1.93:1 dark) all
  fell below 4.5:1. Accent is now `#2563eb`, weekend `#dc2626`, muted `#64748b`.
- Disabled controls use `--ndp-disabled-opacity` (0.65, was 0.45), which was illegible.
- Navigation chevrons, dropdown caret and clear buttons are SVG instead of typographic
  characters, and mirror correctly in RTL.

### Removed
- Hardcoded `var(--ndp-x, #fallback)` colour fallbacks, which shadowed the palette.

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
