# Changelog

All notable changes to **@vahidamirian/datepicker-core** are documented in
this file. The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

**npm:** https://www.npmjs.com/package/@vahidamirian/datepicker-core

## [1.0.0]

### Added
- **Initial release** — extracted the framework-agnostic headless engine from
  `@vahidamirian/ngx-jalali-datepicker` into a standalone, zero-dependency
  package. This is the shared foundation under both the Angular and Vue
  date picker packages.

#### Calendar adapters
- `CalendarAdapter` abstract base class — implement it to add any calendar
  system without touching UI code.
- **`JalaliCalendarAdapter`** — full Jalali (Shamsi / Persian) calendar with
  pure-TypeScript math (`JalaaliMath`), parse/format, Persian digit support,
  RTL direction, and week starting on Saturday.
- **`GregorianCalendarAdapter`** — Gregorian calendar with configurable locale
  and `Intl.DateTimeFormat`-based formatting.
- **`HijriCalendarAdapter`** — tabular Islamic civil calendar (30-year cycle,
  fully arithmetic, deterministic). Supports `adjustment` config for
  observed-calendar corrections (fixed offset, function, or custom service).
  Headless math exported as `HijriMath`.

#### Core types & utilities
- `DateRange`, `SelectionMode`, `CalendarView`, `NdpTheme`, `NdpAnimation`,
  `DayCell`, `MonthView`, `PeriodCell`, `PeriodView` and all supporting types.
- `dayKey()`, `atMidnight()`, `clamp()`, `toLatinDigits()` — date key and
  normalization utilities.
- `applySelection()`, `isSelectionComplete()`, `rangeEquals()` — headless
  selection logic for single and range modes.
- `buildMonthView()` — render-ready day grid with precomputed per-cell flags
  (`isSelected`, `isInRange`, `isToday`, `isDisabled`, `isOutsideMonth`, …).
- `buildMonthsView()`, `buildYearsView()` — period grids for month-picker and
  year-picker modes.
- `getTimeOfDay()`, `withTimeOfDay()`, `snapMinutes()`, `stepMinutes()`,
  `wrapHours()` — time-of-day helpers.
- `CalendarAdapter.parse(text)`, `formatInput(date)`, `getInputFormatHint()`,
  `getMonthNames()`, `getYearLabel()`, `startOfYear()`, `addCalendarYears()`,
  `formatNumber()` — all with working base-class defaults so custom adapters
  compile without overriding them.

[1.0.0]: https://github.com/vahidamiryan/ngx-jalali-datepicker/releases/tag/core-v1.0.0
