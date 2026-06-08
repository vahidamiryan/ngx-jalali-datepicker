import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  contentChild,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CalendarAdapter } from '../../core/calendar-adapter';
import { NDP_CALENDAR_ADAPTERS } from '../../datepicker.providers';
import { DateFilterFn, DateRange, DayCell, DatepickerMode } from '../../core/types';
import { atMidnight, clampDate, dayKey } from '../../core/date-key.util';
import { applySelection, isSelectionComplete } from '../../core/selection';
import { CalendarMonthComponent } from '../calendar-month/calendar-month.component';
import { NdpDayCellTemplate } from '../day-cell.directive';

/**
 * The orchestrator: owns selection / navigation / focus state as signals, swaps
 * calendar adapters at runtime, and renders one or more {@link CalendarMonthComponent}
 * grids. Integrates with Angular forms via `ControlValueAccessor` and supports
 * full keyboard navigation. All heavy date logic lives in the pure headless core.
 */
@Component({
  selector: 'ndp-datepicker',
  standalone: true,
  imports: [CalendarMonthComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.css',
  host: {
    '[attr.dir]': 'adapter().direction',
    '(keydown)': 'onKeydown($event)',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatepickerComponent), multi: true },
  ],
})
export class DatepickerComponent implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly registry = new Map<string, CalendarAdapter>();
  private readonly calendarIds: string[];

  // ── Public inputs ────────────────────────────────────────────────────────
  readonly mode = input<DatepickerMode>('single');
  readonly numberOfMonths = input(1);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly dateFilter = input<DateFilterFn | null>(null);
  readonly showFooter = input(true);
  readonly showToday = input(true);
  readonly showClear = input(true);
  readonly showCalendarToggle = input(true);
  /** Show the same dates in a second calendar alongside the active one (e.g. Gregorian under Jalali). */
  readonly showSecondaryDate = input(false);
  /** Calendar id to use as the secondary. When null, the first registered calendar other than the active one. */
  readonly secondaryCalendar = input<string | null>(null);

  /** Active calendar id (two-way). Defaults to the first registered adapter. */
  readonly calendar = model<string>('');
  /** Selected value (two-way). `end` stays null in single mode. */
  readonly value = model<DateRange>({ start: null, end: null });

  readonly dateSelected = output<DateRange>();

  // ── Internal state ───────────────────────────────────────────────────────
  private readonly today = signal(atMidnight(new Date()));
  private readonly activeMonth = signal(atMidnight(new Date()));
  protected readonly hovered = signal<Date | null>(null);
  protected readonly focusedDate = signal<Date | null>(null);
  protected readonly disabled = signal(false);

  private readonly dayCell = contentChild(NdpDayCellTemplate);
  protected readonly dayTemplate = computed(() => this.dayCell()?.template ?? null);

  // ── Derived ──────────────────────────────────────────────────────────────
  protected readonly adapter = computed(
    () => this.registry.get(this.calendar()) ?? this.registry.get(this.calendarIds[0])!,
  );

  protected readonly visibleMonths = computed<Date[]>(() => {
    const a = this.adapter();
    const base = a.startOfMonth(this.activeMonth());
    const out: Date[] = [];
    for (let i = 0; i < this.numberOfMonths(); i++) {
      out.push(a.addCalendarMonths(base, i));
    }
    return out;
  });

  protected readonly focusedKey = computed(() => {
    const f = this.focusedDate();
    return f ? dayKey(f) : null;
  });

  protected readonly todayValue = this.today.asReadonly();
  protected readonly canToggleCalendar = computed(
    () => this.showCalendarToggle() && this.calendarIds.length > 1,
  );

  /** The adapter used for the secondary (companion) date, or null when disabled/unavailable. */
  protected readonly secondaryAdapter = computed<CalendarAdapter | null>(() => {
    if (!this.showSecondaryDate()) return null;
    const active = this.calendar();
    const explicit = this.secondaryCalendar();
    if (explicit && explicit !== active && this.registry.has(explicit)) {
      return this.registry.get(explicit)!;
    }
    const otherId = this.calendarIds.find(id => id !== active);
    return otherId ? this.registry.get(otherId)! : null;
  });

  /** Can the view move back a month? False once the first visible month is the `min` month. */
  protected readonly canGoPrev = computed(() => {
    const min = this.min();
    if (!min) return true;
    const a = this.adapter();
    const firstStart = this.visibleMonths()[0];
    return dayKey(firstStart) > dayKey(a.startOfMonth(atMidnight(min)));
  });

  /** Can the view move forward a month? False once the last visible month is the `max` month. */
  protected readonly canGoNext = computed(() => {
    const max = this.max();
    if (!max) return true;
    const a = this.adapter();
    const months = this.visibleMonths();
    const lastStart = months[months.length - 1];
    return dayKey(lastStart) < dayKey(a.startOfMonth(atMidnight(max)));
  });

  // ── CVA callbacks ──────────────────────────────────────────────────────────
  private onChange: (v: DateRange) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const adapters = inject(NDP_CALENDAR_ADAPTERS);
    for (const a of adapters) this.registry.set(a.id, a);
    this.calendarIds = adapters.map(a => a.id);
    if (!this.calendar()) this.calendar.set(this.calendarIds[0]);

    // Position the view on the current value (or today) and keep it in view as
    // the value changes from the outside.
    const start = this.value().start ?? this.today();
    this.activeMonth.set(this.adapter().startOfMonth(start));
    this.focusedDate.set(this.value().start ?? this.today());

    // Re-center the view only when the *value* changes from the outside (e.g. a
    // form patch). The visibility check reads `activeMonth` inside `untracked`
    // so manual prev/next navigation never re-triggers this and snaps back.
    effect(() => {
      const s = this.value().start;
      if (!s) return;
      untracked(() => {
        if (!this.isVisible(s)) {
          this.activeMonth.set(this.adapter().startOfMonth(s));
        }
      });
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  protected onDaySelect(cell: DayCell): void {
    const next = applySelection(this.mode(), this.value(), cell.date);
    this.value.set(next);
    this.focusedDate.set(cell.date);
    this.onChange(next);
    this.onTouched();
    if (isSelectionComplete(this.mode(), next)) this.hovered.set(null);
    this.dateSelected.emit(next);
  }

  protected onDayHover(date: Date | null): void {
    this.hovered.set(date);
  }

  // ── Navigation / footer ─────────────────────────────────────────────────────
  protected prevMonth(): void {
    if (!this.canGoPrev()) return;
    this.activeMonth.set(this.adapter().addCalendarMonths(this.activeMonth(), -1));
  }

  protected nextMonth(): void {
    if (!this.canGoNext()) return;
    this.activeMonth.set(this.adapter().addCalendarMonths(this.activeMonth(), 1));
  }

  protected goToToday(): void {
    const t = this.today();
    this.activeMonth.set(this.adapter().startOfMonth(t));
    this.focusedDate.set(t);
  }

  protected clear(): void {
    const empty: DateRange = { start: null, end: null };
    this.value.set(empty);
    this.hovered.set(null);
    this.onChange(empty);
    this.dateSelected.emit(empty);
  }

  protected toggleCalendar(): void {
    const i = this.calendarIds.indexOf(this.calendar());
    this.calendar.set(this.calendarIds[(i + 1) % this.calendarIds.length]);
  }

  protected monthLabel(monthStart: Date): string {
    return this.adapter().getMonthLabel(monthStart);
  }

  /** The active month rendered in the secondary calendar — a range, since months don't line up. */
  protected secondaryMonthLabel(monthStart: Date): string {
    const sec = this.secondaryAdapter();
    if (!sec) return '';
    const start = this.adapter().startOfMonth(monthStart);
    const lastDay = this.shiftDays(this.adapter().addCalendarMonths(start, 1), -1);
    const a = sec.getMonthLabel(start);
    const b = sec.getMonthLabel(lastDay);
    return a === b ? a : `${a} – ${b}`;
  }

  /** Fully written-out secondary date for the footer summary. */
  protected secondaryFormat(date: Date): string {
    return this.secondaryAdapter()?.format(date) ?? '';
  }

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  protected onKeydown(event: KeyboardEvent): void {
    const a = this.adapter();
    const rtl = a.direction === 'rtl';
    const current = this.focusedDate() ?? this.today();
    let next: Date | null = null;

    switch (event.key) {
      case 'ArrowRight':
        next = this.shiftDays(current, rtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        next = this.shiftDays(current, rtl ? 1 : -1);
        break;
      case 'ArrowDown':
        next = this.shiftDays(current, 7);
        break;
      case 'ArrowUp':
        next = this.shiftDays(current, -7);
        break;
      case 'PageDown':
        next = a.addCalendarMonths(current, 1);
        break;
      case 'PageUp':
        next = a.addCalendarMonths(current, -1);
        break;
      case 'Home':
        next = a.startOfMonth(current);
        break;
      case 'End':
        next = a.addCalendarMonths(a.startOfMonth(current), 1);
        next = this.shiftDays(next, -1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onDaySelect(this.toCell(current));
        return;
      default:
        return;
    }

    event.preventDefault();
    // Keep keyboard navigation inside the allowed range so PageUp/PageDown and
    // the arrows can't land on (and scroll the view to) a fully-disabled month.
    next = clampDate(next, this.min(), this.max());
    this.focusedDate.set(next);
    if (!this.isVisible(next)) this.activeMonth.set(a.startOfMonth(next));
    requestAnimationFrame(() => this.focusActiveCell());
  }

  private focusActiveCell(): void {
    const key = this.focusedKey();
    if (key == null) return;
    // Target the focusable in-month cell (tabindex 0) — the same day may also
    // appear as a non-interactive padding cell in an adjacent month's grid.
    const el = this.host.nativeElement.querySelector<HTMLElement>(
      `[data-key="${key}"][tabindex="0"]`,
    );
    el?.focus();
  }

  private shiftDays(date: Date, delta: number): Date {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + delta);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Minimal `DayCell` for keyboard selection (disabled state honored by `onDaySelect`'s guard upstream). */
  private toCell(date: Date): DayCell {
    return {
      date,
      key: dayKey(date),
      label: this.adapter().getDayLabel(date),
      dayOfMonth: this.adapter().getDayOfMonth(date),
      weekday: this.adapter().getWeekdayIndex(date),
      inCurrentMonth: true,
      isToday: false,
      isWeekend: false,
      isDisabled: this.isDisabled(date),
      isSelected: false,
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
      isPreview: false,
    };
  }

  private isDisabled(date: Date): boolean {
    const min = this.min();
    const max = this.max();
    const filter = this.dateFilter();
    const k = dayKey(date);
    if (min && k < dayKey(atMidnight(min))) return true;
    if (max && k > dayKey(atMidnight(max))) return true;
    return filter ? !filter(date) : false;
  }

  private isVisible(date: Date): boolean {
    const a = this.adapter();
    const months = this.visibleMonths();
    const firstStart = months[0];
    const lastEnd = a.addCalendarMonths(months[months.length - 1], 1);
    const k = dayKey(date);
    return k >= dayKey(firstStart) && k < dayKey(lastEnd);
  }

  // ── ControlValueAccessor ───────────────────────────────────────────────────
  writeValue(value: DateRange | Date | null): void {
    const range = this.normalize(value);
    this.value.set(range);
    if (range.start) {
      this.activeMonth.set(this.adapter().startOfMonth(range.start));
      this.focusedDate.set(range.start);
    }
  }

  registerOnChange(fn: (v: DateRange) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  private normalize(value: DateRange | Date | null): DateRange {
    if (!value) return { start: null, end: null };
    if (value instanceof Date) return { start: atMidnight(value), end: null };
    return value;
  }
}
