import { InjectionToken, Provider } from '@angular/core';
import { CalendarAdapter } from '@vahidamirian/datepicker-core';

/** DI token carrying the active {@link CalendarAdapter} for a component subtree. */
export const CALENDAR_ADAPTER = new InjectionToken<CalendarAdapter>('CALENDAR_ADAPTER');

/**
 * Ordered list of calendars the picker offers. The first entry is the default.
 *
 * The token has *no* default value on purpose: a default factory would have to
 * statically reference concrete adapters, which would pin every calendar (and
 * its date-conversion math) into every bundle that uses the picker — defeating
 * tree-shaking. Supply the calendars you actually use with
 * {@link provideNgxDatepicker}; a consumer that configures only Gregorian then
 * never ships the Jalali / Hijri adapters or their math.
 */
export const NDP_CALENDAR_ADAPTERS = new InjectionToken<CalendarAdapter[]>('NDP_CALENDAR_ADAPTERS');

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
