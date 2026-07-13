/*
 * Public API of @vahidamirian/datepicker-core — the framework-agnostic headless core.
 *
 * Everything here is pure TypeScript with zero framework dependencies: types,
 * calendar math/adapters, and the render-ready view builders. Both @vahidamirian/ngx-jalali-datepicker
 * and @vahidamirian/vue-datepicker consume this package so a single source of truth drives every
 * framework — bug-fixes and new calendars apply everywhere automatically.
 */

// Core types & headless utilities (build a custom UI on top of these)
export * from './core/types';
export * from './core/date-key.util';
export * from './core/selection';
export * from './core/time.util';
export * from './core/build-month';
export * from './core/build-period';
export { CalendarAdapter } from './core/calendar-adapter';

// Calendar adapters
export * from './adapters/gregorian.adapter';
export * from './adapters/jalali.adapter';
export * from './adapters/hijri.adapter';
export * as JalaaliMath from './adapters/jalaali';
export * as HijriMath from './adapters/hijri';
