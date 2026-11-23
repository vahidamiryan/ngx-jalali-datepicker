import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  DateInputComponent,
  DatepickerComponent,
  DateRange,
  GregorianCalendarAdapter,
  JalaliCalendarAdapter,
  NdpTheme,
} from '@vahidamirian/ngx-jalali-datepicker';

@Component({
  selector: 'app-calendar-showcase',
  imports: [DateInputComponent, DatepickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-showcase.html',
  styleUrl: './calendar-showcase.css',
})
export class CalendarShowcase {
  readonly theme = input.required<NdpTheme>();
  protected readonly density = signal<'compact' | 'comfortable' | null>(null);
  protected readonly densities = [
    { label: 'Compact', value: 'compact' },
    { label: 'Default', value: null },
    { label: 'Comfortable', value: 'comfortable' },
  ] as const;
  protected readonly calendars = [
    { id: 'gregorian', label: 'Gregorian', direction: 'ltr', lang: 'en' },
    { id: 'jalali', label: 'هجری شمسی', direction: 'rtl', lang: 'fa' },
  ] as const;

  private readonly today = offsetDays(new Date(), 0);
  private readonly gregorian = new GregorianCalendarAdapter('en-US');
  private readonly jalali = new JalaliCalendarAdapter();
  protected readonly single = signal<DateRange>({ start: offsetDays(this.today, 2), end: null });
  protected readonly isRtl = signal(false);
  private readonly adapter = computed(() => this.isRtl() ? this.jalali : this.gregorian);
  protected readonly presets = computed(() => {
    const adapter = this.adapter();
    const month = adapter.startOfMonth(this.today);
    return [
      { en: 'Today', fa: 'امروز', start: this.today, end: this.today },
      { en: 'Last 7 days', fa: '۷ روز اخیر', start: offsetDays(this.today, -6), end: this.today },
      { en: 'This month', fa: 'این ماه', start: month, end: offsetDays(adapter.addCalendarMonths(month, 1), -1) },
      { en: 'Last month', fa: 'ماه گذشته', start: adapter.addCalendarMonths(month, -1), end: offsetDays(month, -1) },
    ];
  });
  protected readonly applied = signal<DateRange>({
    start: offsetDays(this.gregorian.startOfMonth(this.today), -4),
    end: offsetDays(this.gregorian.startOfMonth(this.today), 4),
  });
  protected readonly draft = signal(this.applied());
  private readonly rangeRevision = signal(0);
  protected readonly rangeView = computed(() => ({
    key: `${this.adapter().id}:${this.rangeRevision()}`,
    calendar: this.adapter().id,
  }));
  protected readonly appliedText = computed(() => {
    const { start, end } = this.applied();
    const adapter = this.adapter();
    return `${adapter.formatInput(start!)} – ${adapter.formatInput(end!)}`;
  });

  protected isActivePreset(range: DateRange): boolean {
    const draft = this.draft();
    return draft.start?.getTime() === range.start?.getTime()
      && draft.end?.getTime() === range.end?.getTime();
  }

  protected replaceDraft({ start, end }: DateRange): void {
    this.draft.set({ start, end });
    this.rangeRevision.update(revision => revision + 1);
  }
}

function offsetDays(date: Date, offset: number): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + offset);
  return result;
}
