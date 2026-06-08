import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideNgxDatepicker,
  GregorianCalendarAdapter,
  JalaliCalendarAdapter,
} from 'ngx-jalali-datepicker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The library is built on signals — no Zone.js needed.
    provideZonelessChangeDetection(),
    // Jalali is the default calendar; Gregorian is available via the toggle.
    provideNgxDatepicker(new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')),
  ],
};
