import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  DatepickerComponent,
  NdpDayCellTemplate,
  DateRange,
  NdpTheme,
  JalaliCalendarAdapter,
  GregorianCalendarAdapter,
  JalaaliMath,
} from 'ngx-jalali-datepicker';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatepickerComponent, NdpDayCellTemplate],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '[attr.data-theme]': 'theme()',
    '(document:keydown.escape)': 'dropOpen.set(false)',
  },
})
export class App {
  // ── Theme ───────────────────────────────────────────────────────────────────
  readonly theme = signal<NdpTheme>('light');
  readonly themeLabel = computed(() => {
    const t = this.theme();
    return t === 'light' ? 'روشن' : t === 'dark' ? 'تیره' : 'خودکار';
  });

  cycleTheme(): void {
    const order: NdpTheme[] = ['light', 'dark', 'auto'];
    const i = order.indexOf(this.theme());
    this.theme.set(order[(i + 1) % order.length]);
  }

  /**
   * Custom vars for the purple-accent demo card. Translucent range/preview bands
   * so a single override looks correct on both light and dark surfaces.
   */
  readonly purpleVars: Record<string, string> = {
    '--ndp-accent': '#8b5cf6',
    '--ndp-accent-hover': '#7c3aed',
    '--ndp-accent-contrast': '#ffffff',
    '--ndp-range-bg': 'rgba(139, 92, 246, 0.18)',
    '--ndp-range-color': '#8b5cf6',
    '--ndp-preview-bg': 'rgba(139, 92, 246, 0.10)',
    '--ndp-focus-ring': '#8b5cf6',
    '--ndp-today-border': '#8b5cf6',
  };

  // Demo state
  readonly single = signal<DateRange>({ start: null, end: null });
  readonly range = signal<DateRange>({ start: null, end: null });
  readonly custom = signal<DateRange>({ start: null, end: null });
  readonly themed = signal<DateRange>({ start: null, end: null });
  readonly month = signal<DateRange>({ start: null, end: null });
  readonly year = signal<DateRange>({ start: null, end: null });

  readonly today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  // ── Output formatting ───────────────────────────────────────────────────────
  // Short ("۱۴۰۴/۳/۱۹") and long ("چهارشنبه ۱۹ خرداد ۱۴۰۴") Jalali renderings,
  // built once and reused — Intl formatters are comparatively expensive to create.
  private readonly jShort = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'short' });
  private readonly jLong = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'full' });

  readonly singleShort = computed(() => this.describe(this.single(), this.jShort));
  readonly singleLong = computed(() => this.describe(this.single(), this.jLong));
  readonly rangeShort = computed(() => this.describe(this.range(), this.jShort));
  readonly rangeLong = computed(() => this.describe(this.range(), this.jLong));
  readonly customShort = computed(() => this.describe(this.custom(), this.jShort));
  readonly customLong = computed(() => this.describe(this.custom(), this.jLong));

  // Month / year picker outputs — labelled via the Jalali adapter (e.g. "خرداد ۱۴۰۴", "۱۴۰۴").
  readonly monthLabel = computed(() => {
    const s = this.month().start;
    return s ? this.jCal.getMonthLabel(s) : '—';
  });
  readonly yearLabel = computed(() => {
    const s = this.year().start;
    return s ? this.jCal.getYearLabel(s) : '—';
  });

  // ── Dropdown demo ──────────────────────────────────────────────────────────
  private readonly jCal = new JalaliCalendarAdapter();
  private readonly gCal = new GregorianCalendarAdapter('en-US');

  readonly dropOpen = signal(false);
  readonly dropValue = signal<DateRange>({ start: null, end: null });
  readonly dropLabel = computed(() => {
    const s = this.dropValue().start;
    return s ? this.jShort.format(s) : 'تاریخی انتخاب نشده';
  });
  /** True while no date is chosen — drives the placeholder (muted) trigger style. */
  readonly dropEmpty = computed(() => !this.dropValue().start);

  toggleDrop(): void {
    this.dropOpen.update(v => !v);
  }

  onDropSelected(): void {
    // single mode completes on the first click → close the panel
    this.dropOpen.set(false);
  }

  // ── Conversion demo (no UI needed — pure adapter / math API) ────────────────
  /** Gregorian → Jalali via the raw math helper. */
  readonly todayInJalali = (() => {
    const j = JalaaliMath.toJalaali(this.today);
    return `${j.jy}/${j.jm}/${j.jd}`;
  })();
  readonly todayInJalaliPretty = this.jCal.format(this.today);
  readonly todayInGregorian = this.gCal.format(this.today);

  /** Jalali → Gregorian: 1 Farvardin 1404 (Nowruz), as a real `Date` instance… */
  readonly nowruz1404Date = (() => {
    const g = JalaaliMath.toGregorian(1404, 1, 1);
    const d = new Date(g.gy, g.gm - 1, g.gd);
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  /** …and the same conversion rendered as an ISO date string. */
  readonly nowruz1404Iso = this.nowruz1404Date.toLocaleDateString('en-CA');

  /**
   * Render a range as a single string. A lone start (single mode, or a range
   * awaiting its end) shows just that date — no dangling separator, which read
   * as an unfinished range and was the source of the single-day UX confusion.
   */
  private describe(r: DateRange, fmt: Intl.DateTimeFormat): string {
    if (!r.start) return '—';
    const s = fmt.format(r.start);
    return r.end ? `${s} تا ${fmt.format(r.end)}` : s;
  }
}
