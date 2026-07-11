# Angular

`@ndp/angular` is the Angular 20+ build — signals, zoneless, `OnPush`, and full
`ControlValueAccessor` support. It renders the same UI as `@ndp/vue` from the same
`@ndp/core`, so behavior is identical.

> The examples below are runnable Angular code. For live interactive demos in this
> browser, see the [Vue examples](/vue/) — they exercise the shared core the Angular
> components sit on. A standalone Angular playground ships in the repo under
> `apps/` and is linked from the site header.

```bash
npm install @ndp/angular @ndp/core
```

## Setup

```ts
// app.config.ts
import { provideZonelessChangeDetection } from '@angular/core';
import {
  provideNgxDatepicker,
  JalaliCalendarAdapter,
  GregorianCalendarAdapter,
} from '@ndp/angular';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideNgxDatepicker(new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')),
  ],
};
```

## Use

```html
<!-- Single date -->
<ndp-datepicker [(value)]="value" />

<!-- Range, two months, no past dates -->
<ndp-datepicker mode="range" [numberOfMonths]="2" [min]="today" [(value)]="range" />

<!-- Reactive forms -->
<ndp-datepicker [formControl]="ctrl" />

<!-- Typed input with a calendar popover -->
<ndp-date-input [(value)]="value" />

<!-- Time-only field -->
<ndp-time-input [minuteStep]="15" [(value)]="time" />

<!-- Custom day cell -->
<ndp-datepicker [(value)]="value">
  <ng-template ndpDayCell let-day>
    {{ day.label }} @if (day.isWeekend) { <i></i> }
  </ng-template>
</ndp-datepicker>
```

## Dual-script

```html
<ndp-datepicker [showSecondaryDate]="true" [(value)]="value" />
<ndp-datepicker [showSecondaryDate]="true" secondaryCalendar="gregorian" [(value)]="value" />
```

The full input reference (min/max, `dateFilter`, `animation`, `showTime`,
`minuteStep`, footer toggles, keyboard) is documented in the
[package README](https://github.com/vahidamiryan/ngx-jalali-datepicker/tree/main/packages/angular).
