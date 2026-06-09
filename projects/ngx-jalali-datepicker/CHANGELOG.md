# Changelog

All notable changes to **@vahidamirian/ngx-jalali-datepicker** are documented in
this file. The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- `showSummary` input on `DatepickerComponent` (default `true`). Set it to
  `false` to hide just the selected-date summary bar inside the footer while
  keeping the action buttons (Today / Clear / calendar toggle).

### Fixed
- Selected day no longer widens its grid column or shifts the row. The week
  grid now uses `repeat(7, minmax(0, 1fr))` (a bare `1fr` is `minmax(auto, 1fr)`,
  whose `min-content` floor let a bold-on-select label steal width from
  neighbouring cells). `.ndp-day` also gained `box-sizing: border-box` so its
  1px border can't overflow the track in apps without a global border-box reset.

## [0.0.4]

### Added
- Individual start/end clear buttons (✕) in the range-mode summary bar, so each
  endpoint can be cleared without resetting the whole range.
- Dual-script display via `showSecondaryDate` / `secondaryCalendar` — render each
  date in a companion calendar (e.g. Gregorian under Jalali).

### Changed
- Package metadata and publishing configuration for npm.

## [0.0.1]

### Added
- Initial release: zoneless, signal-based Jalali + Gregorian date picker with a
  pluggable `CalendarAdapter` layer and a reusable headless core
  (`buildMonthView`, `applySelection`). Single & range modes, multi-month
  rendering, full keyboard navigation, `ControlValueAccessor`, custom day-cell
  content projection, and CSS-variable theming.

[Unreleased]: https://github.com/vahidamiryan/ngx-jalali-datepicker/compare/v0.0.4...HEAD
[0.0.4]: https://github.com/vahidamiryan/ngx-jalali-datepicker/releases/tag/v0.0.4
[0.0.1]: https://github.com/vahidamiryan/ngx-jalali-datepicker/releases/tag/v0.0.1
