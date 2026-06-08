import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  DatepickerComponent,
  NdpDayCellTemplate,
  DateRange,
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
})
export class App {
  // Demo state
  readonly single = signal<DateRange>({ start: null, end: null });
  readonly range = signal<DateRange>({ start: null, end: null });
  readonly custom = signal<DateRange>({ start: null, end: null });

  readonly today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  readonly singleLabel = computed(() => this.fmt(this.single()));
  readonly rangeLabel = computed(() => this.fmt(this.range()));
  readonly customLabel = computed(() => this.fmt(this.custom()));

  // ── Dropdown demo ──────────────────────────────────────────────────────────
  private readonly jCal = new JalaliCalendarAdapter();
  private readonly gCal = new GregorianCalendarAdapter('en-US');

  readonly dropOpen = signal(false);
  readonly dropValue = signal<DateRange>({ start: null, end: null });
  readonly dropLabel = computed(() => {
    const s = this.dropValue().start;
    return s ? this.jCal.format(s) : 'تاریخی انتخاب نشده';
  });

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

  /** Jalali → Gregorian: 1 Farvardin 1404 (Nowruz). */
  readonly nowruz1404 = (() => {
    const g = JalaaliMath.toGregorian(1404, 1, 1);
    return `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`;
  })();

  private fmt(r: DateRange): string {
    if (!r.start) return '—';
    const s = r.start.toLocaleDateString('en-CA');
    return r.end ? `${s} → ${r.end.toLocaleDateString('en-CA')}` : s;
  }
}
