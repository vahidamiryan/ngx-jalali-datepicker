import { InjectionToken, Provider } from '@angular/core';
import { CalendarAdapter, NdpIconSet, NdpLabels } from '@vahidamirian/datepicker-core';

import { NDP_ICONS } from './components/icon/icon.component';

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

/**
 * Override any subset of the built-in icons for an application (or a component
 * subtree). Unnamed icons keep their defaults.
 *
 * ```ts
 * provideNdpIcons({ prev: '<path d="M15 18l-6-6 6-6" />' })
 * ```
 *
 * Each value is the *inner* markup of a 24x24 viewBox — the wrapping `<svg>` is
 * supplied by the renderer, so stroke, colour and size stay token-driven. Values
 * are trusted as SVG markup: supply static strings you author, never
 * unsanitised user input.
 */
export function provideNdpIcons(icons: Partial<NdpIconSet>): Provider[] {
  return [{ provide: NDP_ICONS, useValue: icons }];
}

/** Overrides for the user-facing text. Unnamed labels keep their defaults. */
export const NDP_LABELS = new InjectionToken<Partial<NdpLabels>>('NDP_LABELS');

/**
 * Override any subset of the built-in text for an application (or a component
 * subtree). Unnamed labels keep the default set for the active calendar —
 * English for Gregorian, Persian for Jalali and Hijri.
 *
 * ```ts
 * provideNdpLabels({ today: 'Today', clear: 'Clear' })
 * ```
 */
export function provideNdpLabels(labels: Partial<NdpLabels>): Provider[] {
  return [{ provide: NDP_LABELS, useValue: labels }];
}
