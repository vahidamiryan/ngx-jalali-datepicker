# Changelog

All notable changes to **@vahidamirian/ngx-jalali-datepicker** are documented in
this file. The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

**npm:** https://www.npmjs.com/package/@vahidamirian/ngx-jalali-datepicker

## [Unreleased]

### Added
- **Navigation slide animation** — opt-in via the new `animation` input
  (`'none' | 'slide'`, default `'none'`). With `animation="slide"` the calendar
  body slides in from the direction of travel on every navigation (prev/next
  arrows, quick-nav jumps, Today, and keyboard month/page changes), in day,
  month and year views alike. Direction-aware in RTL, honors
  `prefers-reduced-motion`, and tunable via the `--ndp-slide-duration`,
  `--ndp-slide-easing` and `--ndp-slide-distance` tokens. New `NdpAnimation`
  type exported.
- **Month & year picker modes** — `mode="month"` and `mode="year"` turn the body
  into a 12-month grid / paged year grid. Selecting commits the whole period:
  `value.start` is the first day (local midnight) of the chosen month/year, `end`
  stays null. Full keyboard support (arrows move within the 3-column grid,
  PageUp/PageDown step the year/page, Enter/Space commit).
- **Quick navigation** — in day mode the header shows separate month and year
  dropdowns; click either to jump straight to a month or year without stepping
  through with the `‹ ›` arrows. `Esc` or an outside click closes the menu.
  Toggle with the new `showQuickNav` input (default `true`); set `false` for a
  plain, non-interactive month/year header label.
- Headless `buildMonthsView` / `buildYearsView` builders and `PeriodCell` /
  `PeriodView` types, mirroring `buildMonthView` — build a custom month/year UI
  on the same precomputed core. New `CalendarView` type and reusable
  `CalendarPeriodComponent` exported.
- `CalendarAdapter` gains `getMonthNames()`, `getYearLabel()`, `startOfYear()`
  and `addCalendarYears()`. All have working base-class defaults, so existing
  custom adapters keep compiling; the built-in adapters override the first two
  for localized names/digits.
- Built-in **light / dark / auto themes** via a new `theme` input on
  `DatepickerComponent` (default `'light'`). `'auto'` follows the OS
  `prefers-color-scheme`. The dark palette also sets `color-scheme: dark` so
  native UI (scrollbars, focus rings) adapts. New `NdpTheme` type exported.
- `customVars` input — override any `--ndp-*` design token programmatically
  (e.g. `{ '--ndp-accent': '#8b5cf6' }`); applied as inline styles so it wins
  over both the built-in theme and external stylesheets.
- `showSummary` input on `DatepickerComponent` (default `true`). Set it to
  `false` to hide just the selected-date summary bar inside the footer while
  keeping the action buttons (Today / Clear / calendar toggle).

### Changed
- The few remaining hard-coded hover colours (nav and footer buttons) now read
  from the `--ndp-border` / `--ndp-day-hover-bg` tokens, so they theme correctly
  in dark mode and respond to custom overrides.
- Calendar-grid colours are now driven by the theme: `--ndp-day-color` and
  `--ndp-weekday-color` default to `--ndp-text` / `--ndp-muted`, and the panel
  shadow is tokenised as `--ndp-shadow` (deeper in dark mode).

### Fixed
- Day-cell text was invisible in dark mode — the grid used `--ndp-day-color`
  (a light-only fallback) that the dark palette never set. Day, weekday-header
  and outside-month colours now follow the active theme.

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
