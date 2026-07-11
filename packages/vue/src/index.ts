/*
 * Public API of @ndp/vue — Vue 3 date-picker components on the shared @ndp/core.
 */
import type { App } from 'vue';

import NdpDatepicker from './components/NdpDatepicker.vue';
import NdpDateInput from './components/NdpDateInput.vue';
import NdpTimePicker from './components/NdpTimePicker.vue';
import NdpTimeInput from './components/NdpTimeInput.vue';
import NdpCalendarMonth from './components/NdpCalendarMonth.vue';
import NdpCalendarPeriod from './components/NdpCalendarPeriod.vue';

export {
  NdpDatepicker,
  NdpDateInput,
  NdpTimePicker,
  NdpTimeInput,
  NdpCalendarMonth,
  NdpCalendarPeriod,
};

// Composable + adapter plumbing
export { useDatepicker } from './composables/useDatepicker';
export type { UseDatepickerOptions } from './composables/useDatepicker';
export {
  NdpDatepickerPlugin,
  NDP_CALENDAR_ADAPTERS,
  useCalendarAdapters,
} from './adapters';
export type { NdpCalendarAdapterSource } from './adapters';

// Re-export the framework-agnostic core so consumers can grab adapters, math,
// and types from a single import if they prefer.
export * from '@ndp/core';

/**
 * Optional convenience plugin that registers every component globally. Calendar
 * adapters are still configured via {@link NdpDatepickerPlugin} (or the
 * per-component `:adapters` prop).
 *
 * ```ts
 * app.use(NdpVue).use(NdpDatepickerPlugin, { adapters: [...] });
 * ```
 */
export const NdpVue = {
  install(app: App) {
    app.component('NdpDatepicker', NdpDatepicker);
    app.component('NdpDateInput', NdpDateInput);
    app.component('NdpTimePicker', NdpTimePicker);
    app.component('NdpTimeInput', NdpTimeInput);
    app.component('NdpCalendarMonth', NdpCalendarMonth);
    app.component('NdpCalendarPeriod', NdpCalendarPeriod);
  },
};
