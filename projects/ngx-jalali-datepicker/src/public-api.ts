/*
 * Public API Surface of ngx-jalali-datepicker
 */

// Core types & headless utilities (build a custom UI on top of these)
export * from './lib/core/types';
export * from './lib/core/date-key.util';
export * from './lib/core/selection';
export * from './lib/core/time.util';
export * from './lib/core/build-month';
export * from './lib/core/build-period';
export { CalendarAdapter, CALENDAR_ADAPTER } from './lib/core/calendar-adapter';

// Calendar adapters
export * from './lib/adapters/gregorian.adapter';
export * from './lib/adapters/jalali.adapter';
export * from './lib/adapters/hijri.adapter';
export * as JalaaliMath from './lib/adapters/jalaali';
export * as HijriMath from './lib/adapters/hijri';

// Configuration
export * from './lib/datepicker.providers';

// Components & directives
export * from './lib/components/calendar-month/calendar-month.component';
export * from './lib/components/calendar-period/calendar-period.component';
export * from './lib/components/datepicker/datepicker.component';
export * from './lib/components/date-input/date-input.component';
export * from './lib/components/time-picker/time-picker.component';
export * from './lib/components/time-input/time-input.component';
export * from './lib/components/day-cell.directive';
