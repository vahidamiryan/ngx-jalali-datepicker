import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { NdpVue, NdpDatepickerPlugin } from '@ndp/vue';
import {
  JalaliCalendarAdapter,
  GregorianCalendarAdapter,
  HijriCalendarAdapter,
} from '@ndp/core';
// Pull in every component's styles from the workspace source (the alias maps
// @ndp/vue to its source entry, so we reference the CSS by relative path).
import '../../../../packages/vue/src/components/NdpDatepicker.css';
import '../../../../packages/vue/src/components/NdpCalendarMonth.css';
import '../../../../packages/vue/src/components/NdpCalendarPeriod.css';
import '../../../../packages/vue/src/components/NdpTimePicker.css';
import '../../../../packages/vue/src/components/NdpDateInput.css';
import '../../../../packages/vue/src/components/NdpTimeInput.css';
import './custom.css';
import AngularDemo from './AngularDemo.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Live Angular islands used on the Angular docs page (client-only inside).
    app.component('AngularDemo', AngularDemo);
    // Register every Vue component globally and configure the three calendars so
    // the live examples throughout the docs just work.
    app.use(NdpVue);
    app.use(NdpDatepickerPlugin, {
      adapters: [
        new JalaliCalendarAdapter(),
        new GregorianCalendarAdapter('en-US'),
        new HijriCalendarAdapter(),
      ],
    });
  },
} satisfies Theme;
