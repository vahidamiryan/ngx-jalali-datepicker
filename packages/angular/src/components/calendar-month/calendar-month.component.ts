import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CalendarAdapter } from '@ndp/core';
import { buildMonthView } from '@ndp/core';
import { DateFilterFn, DateRange, DayCell, DatepickerMode } from '@ndp/core';

/**
 * Renders a single month grid. Pure presentational + fully precomputed:
 * `buildMonthView` resolves every per-day flag once inside a `computed`, so the
 * template reads only booleans and the grid re-renders solely when an input
 * actually changes. Selection / navigation state lives in the parent.
 */
@Component({
  selector: 'ndp-calendar-month',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-month.component.html',
  styleUrl: './calendar-month.component.css',
})
export class CalendarMonthComponent {
  readonly adapter = input.required<CalendarAdapter>();
  readonly monthStart = input.required<Date>();
  readonly mode = input<DatepickerMode>('single');
  readonly value = input<DateRange>({ start: null, end: null });
  readonly hovered = input<Date | null>(null);
  readonly today = input.required<Date>();
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly dateFilter = input<DateFilterFn | null>(null);
  /** Numeric key of the roving-focus day, for `tabindex` management. */
  readonly focusedKey = input<number | null>(null);
  /** Optional custom day-cell template. */
  readonly dayTemplate = input<TemplateRef<{ $implicit: DayCell }> | null>(null);

  readonly daySelect = output<DayCell>();
  readonly dayHover = output<Date | null>();

  /** The single source of render truth — recomputed only when an input changes. */
  readonly view = computed(() =>
    buildMonthView(this.adapter(), this.monthStart(), {
      mode: this.mode(),
      value: this.value(),
      hovered: this.hovered(),
      today: this.today(),
      min: this.min(),
      max: this.max(),
      dateFilter: this.dateFilter(),
    }),
  );

  onSelect(cell: DayCell): void {
    // Padding days from adjacent months are display-only — they keep the band
    // visually continuous but can't start or extend a selection.
    if (cell.isDisabled || !cell.inCurrentMonth) return;
    this.daySelect.emit(cell);
  }

  onEnter(cell: DayCell): void {
    if (!cell.isDisabled && cell.inCurrentMonth) this.dayHover.emit(cell.date);
  }

  onLeave(): void {
    this.dayHover.emit(null);
  }
}
