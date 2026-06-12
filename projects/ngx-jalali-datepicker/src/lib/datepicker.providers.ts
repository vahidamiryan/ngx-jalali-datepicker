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
 * An adapter instance, or a factory that builds one. Factories run inside the
 * Angular injection context, so they may call `inject()` — the way to feed an
 * adapter from an app service (e.g. a Hijri day-adjustment service).
 */
export type NdpCalendarAdapterSource = CalendarAdapter | (() => CalendarAdapter);

/**
 * Configure the available calendars for an application (or a component subtree).
 *
 * ```ts
 * provideNgxDatepicker(new GregorianCalendarAdapter('en-GB'), new JalaliCalendarAdapter())
 * ```
 *
 * Pass a factory instead of an instance when the adapter needs a DI service:
 *
 * ```ts
 * provideNgxDatepicker(
 *   () => new HijriCalendarAdapter({ adjustment: inject(MyHijriAdjustmentService) }),
 *   new JalaliCalendarAdapter(),
 * )
 * ```
 */
export function provideNgxDatepicker(...adapters: NdpCalendarAdapterSource[]): Provider[] {
  return [
    {
      provide: NDP_CALENDAR_ADAPTERS,
      useFactory: () => adapters.map((a) => (typeof a === 'function' ? a() : a)),
    },
  ];
}
