# Angular

Live, interactive examples rendered by the real `@vahidamirian/ngx-jalali-datepicker` components,
bootstrapped as Angular islands right here on the page. They render the same UI
as `@vahidamirian/vue-datepicker` from the same `@vahidamirian/datepicker-core`, so behavior is identical. Install:

```bash
npm install @vahidamirian/ngx-jalali-datepicker @vahidamirian/datepicker-core
```

## Setup

Register every calendar an example on this page uses — including
`HijriCalendarAdapter`, or the Hijri demo below throws a "calendar not
registered" error. The **first adapter is the default**.

```ts
// app.config.ts
import { provideZonelessChangeDetection } from '@angular/core';
import {
  provideNgxDatepicker,
  JalaliCalendarAdapter,
  GregorianCalendarAdapter,
  HijriCalendarAdapter,
} from '@vahidamirian/ngx-jalali-datepicker';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideNgxDatepicker(
      new JalaliCalendarAdapter(),
      new GregorianCalendarAdapter('en-US'),
      new HijriCalendarAdapter(),
    ),
  ],
};
```

> Only register what you actually use — a Jalali-only app can drop the other two
> and never bundles their conversion math.

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

**Keep going:** [Options & customization](/guide/options) (modes, `min`/`max`,
`dateFilter`, `animation`, footer toggles, keyboard) · [Theming](/guide/theming) ·
[Calendars & adapters](/guide/calendars). The complete input / output reference
is in the [package README](https://github.com/vahidamiryan/ngx-jalali-datepicker/tree/main/packages/angular#datepickercomponent-inputs).
