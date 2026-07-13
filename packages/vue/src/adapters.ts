import { inject, type App, type InjectionKey } from 'vue';
import type { CalendarAdapter } from '@vahidamirian/datepicker-core';

/**
 * An adapter instance, or a factory that builds one. Factories run lazily when
 * the adapters are first resolved — the Vue counterpart of Angular's
 * injection-context factories.
 */
export type NdpCalendarAdapterSource = CalendarAdapter | (() => CalendarAdapter);

/** Injection key carrying the ordered list of configured calendar adapters. */
export const NDP_CALENDAR_ADAPTERS: InjectionKey<CalendarAdapter[]> = Symbol('NDP_CALENDAR_ADAPTERS');

/** Resolve an adapter source list into concrete instances. */
function resolveAdapters(sources: NdpCalendarAdapterSource[]): CalendarAdapter[] {
  return sources.map((a) => (typeof a === 'function' ? a() : a));
}

/**
 * Vue plugin that configures the available calendars app-wide. The first entry
 * is the default calendar.
 *
 * ```ts
 * import { createApp } from 'vue';
 * import { NdpDatepickerPlugin } from '@vahidamirian/vue-datepicker';
 * import { JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamirian/datepicker-core';
 *
 * createApp(App)
 *   .use(NdpDatepickerPlugin, {
 *     adapters: [new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')],
 *   })
 *   .mount('#app');
 * ```
 *
 * A component may also override the calendars locally with its `:adapters` prop.
 */
export const NdpDatepickerPlugin = {
  install(app: App, options: { adapters: NdpCalendarAdapterSource[] }) {
    const resolved = resolveAdapters(options?.adapters ?? []);
    if (resolved.length === 0) {
      throw new Error(
        '[@vahidamirian/vue-datepicker] NdpDatepickerPlugin was installed without any adapters. ' +
          'Pass at least one, e.g. app.use(NdpDatepickerPlugin, { adapters: [new JalaliCalendarAdapter()] }).',
      );
    }
    app.provide(NDP_CALENDAR_ADAPTERS, resolved);
  },
};

/**
 * Resolve the calendar adapters a component should use: an explicit per-component
 * list wins; otherwise the app-level plugin provides them. Throws with an
 * actionable message when neither is present (mirrors the Angular component).
 */
export function useCalendarAdapters(
  local?: NdpCalendarAdapterSource[] | null,
): CalendarAdapter[] {
  const resolved = local && local.length ? resolveAdapters(local) : inject(NDP_CALENDAR_ADAPTERS, null);
  if (!resolved || resolved.length === 0) {
    throw new Error(
      '[@vahidamirian/vue-datepicker] No calendar adapters configured. Install the plugin — ' +
        'app.use(NdpDatepickerPlugin, { adapters: [...] }) — or pass an :adapters prop, e.g. ' +
        ':adapters="[new JalaliCalendarAdapter(), new GregorianCalendarAdapter()]".',
    );
  }
  return resolved;
}
