/*
 * Public API Surface of @vahidamirian/ngx-jalali-datepicker
 */

// Re-export the entire framework-agnostic core (types, adapters, math, headless
// view builders) so consumers can import everything from one package if they wish.
export * from '@vahidamirian/datepicker-core';

// Angular configuration & DI
export * from './datepicker.providers';

// Components & directives
export * from './components/calendar-month/calendar-month.component';
export * from './components/calendar-period/calendar-period.component';
export * from './components/datepicker/datepicker.component';
export * from './components/date-input/date-input.component';
export * from './components/time-picker/time-picker.component';
export * from './components/time-input/time-input.component';
export * from './components/day-cell.directive';
