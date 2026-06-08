import { InjectionToken, Provider } from '@angular/core';
import { CalendarAdapter } from './core/calendar-adapter';
import { GregorianCalendarAdapter } from './adapters/gregorian.adapter';
import { JalaliCalendarAdapter } from './adapters/jalali.adapter';

/**
 * Ordered list of calendars the picker offers. The first entry is the default.
 * Override it to add or reorder calendars without changing any component.
 */
export const NDP_CALENDAR_ADAPTERS = new InjectionToken<CalendarAdapter[]>('NDP_CALENDAR_ADAPTERS', {
  factory: () => [new JalaliCalendarAdapter(), new GregorianCalendarAdapter()],
});

/**
 * Configure the available calendars for an application (or a component subtree).
 *
 * ```ts
 * provideNgxDatepicker(new GregorianCalendarAdapter('en-GB'), new JalaliCalendarAdapter())
 * ```
 */
export function provideNgxDatepicker(...adapters: CalendarAdapter[]): Provider[] {
  return [{ provide: NDP_CALENDAR_ADAPTERS, useValue: adapters }];
}
