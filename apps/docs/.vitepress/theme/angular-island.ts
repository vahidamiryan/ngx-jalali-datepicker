/**
 * Bootstraps small, real Angular apps ("islands") inside the docs so the Angular
 * page shows genuinely live pickers — the same idea as the inline Vue examples,
 * but running the actual @vahidamirian/ngx-jalali-datepicker components. Each island is an isolated
 * `bootstrapApplication` call rendered into a host element supplied by the
 * `AngularDemo.vue` wrapper. Client-only: never imported during SSR.
 */
// The JIT compiler must load before any @Component is processed: the islands use
// runtime string templates, which AOT-built @vahidamirian/ngx-jalali-datepicker doesn't ship a compiler
// for. Importing it here registers the JIT resource loader globally.
import '@angular/compiler';
import {
  Component,
  ChangeDetectionStrategy,
  provideZonelessChangeDetection,
  signal,
  type ApplicationRef,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
// The built, template-inlined Angular package (FESM). Using the build output
// keeps us off ng-packagr's templateUrl/styleUrl source form, which Vite can't
// compile directly. Resolved via a Vite alias to dist/angular so the FESM file
// name (derived from the package name) never has to be hard-coded here.
import {
  DatepickerComponent,
  DateInputComponent,
  TimeInputComponent,
  NdpDayCellTemplate,
  provideNgxDatepicker,
  JalaliCalendarAdapter,
  GregorianCalendarAdapter,
  HijriCalendarAdapter,
  type DateRange,
} from '@ndp-angular-dist';

const today = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

function fmt(v: DateRange | Date | null): string {
  if (v instanceof Date) return v.toString();
  if (!v || (!v.start && !v.end)) return '{ start: null, end: null }';
  const s = v.start ? v.start.toDateString() : 'null';
  const e = v.end ? v.end.toDateString() : 'null';
  return `{ start: ${s}, end: ${e} }`;
}

/** Every live example the Angular docs page renders, keyed by a stable id. Each
 * picker binds `[theme]` so it follows the site's light/dark toggle. */
const TEMPLATES: Record<string, string> = {
  single: `
    <ndp-datepicker [theme]="theme()" [(value)]="value" />
    <div class="ndp-demo__value">value = {{ f(value()) }}</div>`,
  range: `
    <ndp-datepicker [theme]="theme()" mode="range" [numberOfMonths]="2" [min]="today" [(value)]="value" />
    <div class="ndp-demo__value">value = {{ f(value()) }}</div>`,
  input: `
    <ndp-date-input [theme]="theme()" [(value)]="value" />
    <div class="ndp-demo__value">value = {{ f(value()) }}</div>`,
  time: `
    <ndp-time-input [theme]="theme()" [minuteStep]="5" [(value)]="timeValue" />
    <div class="ndp-demo__value">value = {{ f(timeValue()) }}</div>`,
  period: `
    <ndp-datepicker [theme]="theme()" mode="month" [(value)]="value" />
    <div class="ndp-demo__value">value = {{ f(value()) }}</div>`,
  hijri: `
    <ndp-datepicker [theme]="theme()" calendar="hijri" [showSecondaryDate]="true" [(value)]="value" />
    <div class="ndp-demo__value">value = {{ f(value()) }}</div>`,
  dual: `
    <ndp-datepicker [theme]="theme()" [showSecondaryDate]="true" [(value)]="value" />
    <div class="ndp-demo__value">value = {{ f(value()) }}</div>`,
  custom: `
    <ndp-datepicker [theme]="theme()" [(value)]="value">
      <ng-template ndpDayCell let-day>
        {{ day.label }} @if (day.isWeekend) { <span aria-hidden="true">•</span> }
      </ng-template>
    </ndp-datepicker>
    <div class="ndp-demo__value">value = {{ f(value()) }}</div>`,
  forms: `
    <ndp-datepicker [theme]="theme()" [formControl]="ctrl" />
    <div class="ndp-demo__value">ctrl.value = {{ f(ctrl.value) }}</div>`,
};

/** Handle the Vue wrapper uses to drive an island after mount. */
export interface AngularDemoHandle {
  app: ApplicationRef;
  /** Push the current site theme into the island (re-renders zoneless). */
  setTheme(theme: 'light' | 'dark'): void;
}

/** Monotonic id so every island gets a unique root selector (multiple per page). */
let islandSeq = 0;

/** Bootstraps the island for `id` into `host`. `initialTheme` seeds the pickers;
 * the returned handle lets the caller flip the theme with the site toggle. */
export function mountAngularDemo(
  host: HTMLElement,
  id: string,
  initialTheme: 'light' | 'dark' = 'light',
): Promise<AngularDemoHandle> {
  const template = TEMPLATES[id];
  if (!template) return Promise.reject(new Error(`Unknown Angular demo id: ${id}`));

  // A unique selector per island: bootstrapApplication locates the root host by
  // the component's selector, so several islands on one page must not collide.
  const selector = `ndp-doc-island-${islandSeq++}`;
  const themeSignal = signal<'light' | 'dark'>(initialTheme);

  @Component({
    selector,
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      DatepickerComponent,
      DateInputComponent,
      TimeInputComponent,
      NdpDayCellTemplate,
      ReactiveFormsModule,
    ],
    template,
    host: { class: 'ndp-demo' },
  })
  class IslandComponent {
    readonly today = today;
    readonly theme = themeSignal;
    readonly value = signal<DateRange>({ start: null, end: null });
    readonly timeValue = signal<Date | null>(null);
    readonly ctrl = new FormControl<DateRange>({ start: null, end: null });
    readonly f = fmt;
  }

  host.innerHTML = '';
  const mountPoint = document.createElement(selector);
  host.appendChild(mountPoint);

  return bootstrapApplication(IslandComponent, {
    providers: [
      provideZonelessChangeDetection(),
      provideNgxDatepicker(
        new JalaliCalendarAdapter(),
        new GregorianCalendarAdapter('en-US'),
        new HijriCalendarAdapter(),
      ),
    ],
  }).then((app) => ({
    app,
    setTheme: (theme: 'light' | 'dark') => themeSignal.set(theme),
  }));
}
