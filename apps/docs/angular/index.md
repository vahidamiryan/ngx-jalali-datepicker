# Angular

Live, interactive examples rendered by the real `@vahidamiryan/ngx-jalali-datepicker` components,
bootstrapped as Angular islands right here on the page. They render the same UI
as `@vahidamiryan/vue-datepicker` from the same `@vahidamiryan/datepicker-core`, so behavior is identical. Install:

```bash
npm install @vahidamiryan/ngx-jalali-datepicker @vahidamiryan/datepicker-core
```

## Setup

```ts
// app.config.ts
import { provideZonelessChangeDetection } from '@angular/core';
import {
  provideNgxDatepicker,
  JalaliCalendarAdapter,
  GregorianCalendarAdapter,
} from '@vahidamiryan/ngx-jalali-datepicker';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideNgxDatepicker(new JalaliCalendarAdapter(), new GregorianCalendarAdapter('en-US')),
  ],
};
```

## Single date

<AngularDemo id="single" />

```html
<ndp-datepicker [(value)]="value" />
```

## Range, two months, no past dates

<AngularDemo id="range" />

```html
<ndp-datepicker mode="range" [numberOfMonths]="2" [min]="today" [(value)]="range" />
```

## Typed input with a calendar popover

<AngularDemo id="input" />

```html
<ndp-date-input [(value)]="value" />
```

## Time-only field

<AngularDemo id="time" />

```html
<ndp-time-input [minuteStep]="5" [(value)]="time" />
```

## Month / year picker

<AngularDemo id="period" />

```html
<ndp-datepicker mode="month" [(value)]="value" />
<ndp-datepicker mode="year" [(value)]="value" />
```

## Hijri with a secondary date

<AngularDemo id="hijri" />

```html
<ndp-datepicker calendar="hijri" [showSecondaryDate]="true" [(value)]="value" />
```

## Dual-script (Gregorian under Jalali)

<AngularDemo id="dual" />

```html
<ndp-datepicker [showSecondaryDate]="true" [(value)]="value" />
<ndp-datepicker [showSecondaryDate]="true" secondaryCalendar="gregorian" [(value)]="value" />
```

## Custom day cell (content projection)

<AngularDemo id="custom" />

```html
<ndp-datepicker [(value)]="value">
  <ng-template ndpDayCell let-day>
    {{ day.label }} @if (day.isWeekend) { <span>•</span> }
  </ng-template>
</ndp-datepicker>
```

## Reactive forms (`ControlValueAccessor`)

<AngularDemo id="forms" />

```html
<ndp-datepicker [formControl]="ctrl" />
```

---

The full input reference (min/max, `dateFilter`, `animation`, `showTime`,
`minuteStep`, footer toggles, keyboard) is documented in the
[package README](https://github.com/vahidamiryan/ngx-jalali-datepicker/tree/main/packages/angular).
