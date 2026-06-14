import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  DatepickerComponent,
  NdpDayCellTemplate,
  DateRange,
  DatepickerMode,
  NdpTheme,
  JalaliCalendarAdapter,
  GregorianCalendarAdapter,
  HijriCalendarAdapter,
  JalaaliMath,
  HijriMath,
} from 'ngx-jalali-datepicker';
import changelogRaw from '../../../ngx-jalali-datepicker/CHANGELOG.md';
import { parseChangelog } from './changelog';

type PgCalendar = 'jalali' | 'gregorian' | 'hijri';
type ExampleId = 'single' | 'range' | 'period' | 'hijri' | 'triple' | 'custom' | 'dropdown' | 'forms';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatepickerComponent, NdpDayCellTemplate, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '[attr.data-theme]': 'theme()',
    '(document:keydown.escape)': 'dropOpen.set(false)',
  },
})
export class App {
  readonly version = '1.0.0';

  // ── Theme ───────────────────────────────────────────────────────────────────
  readonly theme = signal<NdpTheme>('light');
  readonly themeLabel = computed(() => {
    const t = this.theme();
    return t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'Auto';
  });

  cycleTheme(): void {
    const order: NdpTheme[] = ['light', 'dark', 'auto'];
    const i = order.indexOf(this.theme());
    this.theme.set(order[(i + 1) % order.length]);
  }

  readonly today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  /** One year ahead of today — the upper bound used by the playground's `max` toggle. */
  readonly nextYear = (() => {
    const d = new Date(this.today);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  })();

  // Shared adapters for read-only labelling across the page.
  private readonly jCal = new JalaliCalendarAdapter();
  private readonly gCal = new GregorianCalendarAdapter('en-US');
  private readonly hCal = new HijriCalendarAdapter();
  private readonly hCalAdjusted = new HijriCalendarAdapter({ adjustment: -1 });

  private readonly jShort = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'short' });
  private readonly jLong = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'full' });

  // ══════════════════════════════════════════════════════════════════════════
  //  Interactive playground
  // ══════════════════════════════════════════════════════════════════════════
  readonly pgMode = signal<DatepickerMode>('single');
  readonly pgCalendar = signal<PgCalendar>('jalali');
  readonly pgMonths = signal(1);
  readonly pgMin = signal(false);
  readonly pgMax = signal(false);
  readonly pgSecondary = signal(false);
  readonly pgFooter = signal(true);
  readonly pgQuickNav = signal(true);
  readonly pgSlide = signal(true);

  readonly pgValue = signal<DateRange>({ start: null, end: null });

  /** Day-grid modes (single/range) expose options that month/year modes hide. */
  readonly pgIsDayMode = computed(() => this.pgMode() === 'single' || this.pgMode() === 'range');

  readonly pgMinDate = computed(() => (this.pgMin() ? this.today : null));
  readonly pgMaxDate = computed(() => (this.pgMax() ? this.nextYear : null));

  /** The active calendar's own short/long renderer for the picked value. */
  readonly pgValueLabel = computed(() => {
    const v = this.pgValue();
    if (!v.start) return '—';
    const cal = this.calAdapter(this.pgCalendar());
    const fmt = (d: Date) => `${cal.format(d)}`;
    return v.end ? `${fmt(v.start)}  ←→  ${fmt(v.end)}` : fmt(v.start);
  });

  private calAdapter(id: PgCalendar) {
    return id === 'gregorian' ? this.gCal : id === 'hijri' ? this.hCal : this.jCal;
  }

  // ── Live-generated code ─────────────────────────────────────────────────────
  /** Template snippet reflecting exactly the toggles above (defaults omitted). */
  readonly generatedHtml = computed(() => {
    const lines: string[] = [];
    if (this.pgMode() !== 'single') lines.push(`  mode="${this.pgMode()}"`);
    if (this.pgCalendar() !== 'jalali') lines.push(`  calendar="${this.pgCalendar()}"`);
    lines.push(`  [theme]="'${this.theme()}'"`);
    if (this.pgIsDayMode() && this.pgMonths() !== 1) lines.push(`  [numberOfMonths]="${this.pgMonths()}"`);
    if (this.pgMin()) lines.push(`  [min]="today"`);
    if (this.pgMax()) lines.push(`  [max]="nextYear"`);
    if (this.pgIsDayMode() && this.pgSecondary()) lines.push(`  [showSecondaryDate]="true"`);
    if (!this.pgFooter()) lines.push(`  [showFooter]="false"`);
    if (this.pgIsDayMode() && !this.pgQuickNav()) lines.push(`  [showQuickNav]="false"`);
    if (this.pgSlide()) lines.push(`  animation="slide"`);
    lines.push(`  [(value)]="value"`);
    return `<ndp-datepicker\n${lines.join('\n')} />`;
  });

  /**
   * Provider snippet. Only the adapters the chosen config actually needs are
   * registered — a direct nod to the library's tree-shaking: ship just what you use.
   */
  readonly generatedTs = computed(() => {
    const ids: PgCalendar[] = [this.pgCalendar()];
    if (this.pgIsDayMode() && this.pgSecondary()) {
      const companion: PgCalendar = this.pgCalendar() === 'gregorian' ? 'jalali' : 'gregorian';
      ids.push(companion);
    }
    const ctor: Record<PgCalendar, string> = {
      jalali: 'JalaliCalendarAdapter',
      gregorian: 'GregorianCalendarAdapter',
      hijri: 'HijriCalendarAdapter',
    };
    const names = ids.map(id => ctor[id]);
    const imports = ['provideNgxDatepicker', ...names].join(', ');
    const args = ids.map(id => `new ${ctor[id]}()`).join(', ');
    return (
      `import { ${imports} } from '@vahidamirian/ngx-jalali-datepicker';\n\n` +
      `export const appConfig: ApplicationConfig = {\n` +
      `  providers: [\n` +
      `    // Only these adapters are bundled — unused calendars tree-shake away.\n` +
      `    provideNgxDatepicker(${args}),\n` +
      `  ],\n` +
      `};`
    );
  });

  readonly copiedKey = signal<string | null>(null);

  copy(text: string, key: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedKey.set(key);
      setTimeout(() => {
        if (this.copiedKey() === key) this.copiedKey.set(null);
      }, 2000);
    });
  }

  copyInstall(): void {
    this.copy('npm install @vahidamirian/ngx-jalali-datepicker', 'install');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Examples (tabbed) — each keeps its own live state + a copy-ready snippet
  // ══════════════════════════════════════════════════════════════════════════
  readonly exampleTabs: { id: ExampleId; label: string }[] = [
    { id: 'single', label: 'Single date' },
    { id: 'range', label: 'Range' },
    { id: 'period', label: 'Month / Year' },
    { id: 'hijri', label: 'Hijri' },
    { id: 'triple', label: 'Tri-calendar' },
    { id: 'custom', label: 'Custom cell' },
    { id: 'dropdown', label: 'Dropdown' },
    { id: 'forms', label: 'Reactive Forms' },
  ];
  readonly activeExample = signal<ExampleId>('single');

  readonly single = signal<DateRange>({ start: null, end: null });
  readonly range = signal<DateRange>({ start: null, end: null });
  readonly month = signal<DateRange>({ start: null, end: null });
  readonly year = signal<DateRange>({ start: null, end: null });
  readonly hijri = signal<DateRange>({ start: null, end: null });
  readonly triple = signal<DateRange>({ start: null, end: null });
  readonly custom = signal<DateRange>({ start: null, end: null });

  readonly singleShort = computed(() => this.describe(this.single(), this.jShort));
  readonly singleLong = computed(() => this.describe(this.single(), this.jLong));
  readonly rangeShort = computed(() => this.describe(this.range(), this.jShort));
  readonly rangeLong = computed(() => this.describe(this.range(), this.jLong));
  readonly customShort = computed(() => this.describe(this.custom(), this.jShort));

  readonly monthLabel = computed(() => {
    const s = this.month().start;
    return s ? this.jCal.getMonthLabel(s) : '—';
  });
  readonly yearLabel = computed(() => {
    const s = this.year().start;
    return s ? this.jCal.getYearLabel(s) : '—';
  });

  // ── Hijri example ───────────────────────────────────────────────────────────
  readonly hijriShort = computed(() => {
    const s = this.hijri().start;
    if (!s) return '—';
    const h = HijriMath.toHijri(s);
    return `${h.hy}/${h.hm}/${h.hd}`;
  });
  readonly hijriLong = computed(() => {
    const s = this.hijri().start;
    return s ? `${this.hCal.format(s)} ${this.hCal.getYearLabel(s)}` : '—';
  });
  readonly todayInHijriAdjusted =
    `${this.hCalAdjusted.format(this.today)} ${this.hCalAdjusted.getYearLabel(this.today)}`;
  readonly todayInHijri = (() => {
    const h = HijriMath.toHijri(this.today);
    return `${h.hy}/${h.hm}/${h.hd}`;
  })();
  readonly ramadanIso = (() => {
    const { hy } = HijriMath.toHijri(this.today);
    const g = HijriMath.toGregorian(hy, 9, 1);
    return new Date(g.gy, g.gm - 1, g.gd).toLocaleDateString('en-CA');
  })();

  // ── Tri-calendar example ────────────────────────────────────────────────────
  gregDayLabel(date: Date): string {
    return this.gCal.getDayLabel(date);
  }
  hijriDayLabel(date: Date): string {
    return this.hCal.getDayLabel(date);
  }
  readonly tripleJalali = computed(() => {
    const s = this.triple().start;
    return s ? this.jLong.format(s) : '—';
  });
  readonly tripleGregorian = computed(() => {
    const s = this.triple().start;
    return s ? this.gCal.format(s) : '—';
  });
  readonly tripleHijri = computed(() => {
    const s = this.triple().start;
    return s ? `${this.hCal.format(s)} ${this.hCal.getYearLabel(s)}` : '—';
  });

  // ── Dropdown example ────────────────────────────────────────────────────────
  readonly dropOpen = signal(false);
  readonly dropValue = signal<DateRange>({ start: null, end: null });
  readonly dropLabel = computed(() => {
    const s = this.dropValue().start;
    return s ? this.jShort.format(s) : 'No date selected';
  });
  readonly dropEmpty = computed(() => !this.dropValue().start);

  toggleDrop(): void {
    this.dropOpen.update(v => !v);
  }
  onDropSelected(): void {
    this.dropOpen.set(false);
  }

  // ── Reactive forms example ──────────────────────────────────────────────────
  readonly dateCtrl = new FormControl<DateRange>({ start: null, end: null });
  readonly formValueLabel = signal('—');
  readonly formDisabled = signal(false);

  constructor() {
    this.dateCtrl.valueChanges.subscribe(v => {
      this.formValueLabel.set(v?.start ? this.jLong.format(v.start) : '—');
    });
  }

  toggleFormDisabled(): void {
    const next = !this.formDisabled();
    this.formDisabled.set(next);
    next ? this.dateCtrl.disable() : this.dateCtrl.enable();
  }

  // ── Example code snippets ───────────────────────────────────────────────────
  readonly exampleCode: Record<ExampleId, string> = {
    single: `<ndp-datepicker
  [showSecondaryDate]="true"
  animation="slide"
  [(value)]="value" />`,
    range: `<ndp-datepicker
  mode="range"
  [numberOfMonths]="2"
  [min]="today"
  animation="slide"
  [(value)]="range" />`,
    period: `<!-- Month grid -->
<ndp-datepicker mode="month" [(value)]="month" />

<!-- Year grid (paged) -->
<ndp-datepicker mode="year" [(value)]="year" />`,
    hijri: `// app.config.ts — register the Hijri adapter
provideNgxDatepicker(
  new HijriCalendarAdapter({ adjustment: -1 }),
  new GregorianCalendarAdapter(),
)

// template
<ndp-datepicker calendar="hijri" [showSecondaryDate]="true" [(value)]="hijri" />`,
    triple: `<ndp-datepicker [(value)]="value">
  <ng-template ndpDayCell let-day>
    <span class="tri">
      <span class="tri__main">{{ day.label }}</span>
      @if (day.inCurrentMonth) {
        <span class="tri__sub">
          {{ gregDayLabel(day.date) }} · {{ hijriDayLabel(day.date) }}
        </span>
      }
    </span>
  </ng-template>
</ndp-datepicker>`,
    custom: `<ndp-datepicker [(value)]="value">
  <ng-template ndpDayCell let-day>
    <span class="cell">
      {{ day.label }}
      @if (day.isWeekend && day.inCurrentMonth) {
        <i class="cell__dot"></i>
      }
    </span>
  </ng-template>
</ndp-datepicker>`,
    dropdown: `@if (open()) {
  <div class="backdrop" (click)="open.set(false)"></div>
  <div class="panel">
    <ndp-datepicker
      [showFooter]="false"
      [(value)]="value"
      (dateSelected)="open.set(false)" />
  </div>
}`,
    forms: `import { ReactiveFormsModule, FormControl } from '@angular/forms';

dateCtrl = new FormControl<DateRange>({ start: null, end: null });

// template — the picker is a ControlValueAccessor
<ndp-datepicker [formControl]="dateCtrl" />`,
  };

  // ── Headless conversions (no UI) ────────────────────────────────────────────
  readonly todayInGregorian = this.gCal.format(this.today);
  readonly todayInJalali = (() => {
    const j = JalaaliMath.toJalaali(this.today);
    return `${j.jy}/${j.jm}/${j.jd}`;
  })();
  readonly todayInJalaliPretty = this.jCal.format(this.today);
  readonly nowruz1404Iso = (() => {
    const g = JalaaliMath.toGregorian(1404, 1, 1);
    const d = new Date(g.gy, g.gm - 1, g.gd);
    d.setHours(0, 0, 0, 0);
    return d.toLocaleDateString('en-CA');
  })();

  // ── API reference rows ──────────────────────────────────────────────────────
readonly apiRows: { name: string; type: string; def: string; note: string }[] = [
  { name: 'value', type: 'DateRange (model)', def: '{ start, end }', note: 'Two-way binding; also supports ControlValueAccessor' },
  { name: 'mode', type: "'single' | 'range' | 'month' | 'year'", def: "'single'", note: 'Selection mode' },
  { name: 'calendar', type: 'string (model)', def: 'First adapter', note: "Active calendar ID, e.g. 'jalali'" },
  { name: 'theme', type: "'light' | 'dark' | 'auto'", def: "'light'", note: 'Base color palette' },
  { name: 'numberOfMonths', type: 'number', def: '1', note: 'Number of months displayed side by side' },
  { name: 'min / max', type: 'Date | null', def: 'null', note: 'Inclusive boundaries' },
  { name: 'dateFilter', type: '(d: Date) => boolean', def: 'null', note: 'Returns true if the date is selectable' },
  { name: 'showSecondaryDate', type: 'boolean', def: 'false', note: 'Show corresponding date in the secondary calendar' },
  { name: 'animation', type: "'none' | 'slide'", def: "'none'", note: 'Navigation animation' },
  { name: 'customVars', type: 'Record<string,string>', def: '{}', note: 'Overrides --ndp-* design tokens' },
  { name: '(dateSelected)', type: 'EventEmitter<DateRange>', def: '—', note: 'Emitted when a date is selected' },
];

  /** Parsed straight from the library's CHANGELOG.md (bundled as raw text). */
  readonly changelog = parseChangelog(changelogRaw);

  private describe(r: DateRange, fmt: Intl.DateTimeFormat): string {
    if (!r.start) return '—';
    const s = fmt.format(r.start);
    return r.end ? `${s} – ${fmt.format(r.end)}` : s;
  }
}
