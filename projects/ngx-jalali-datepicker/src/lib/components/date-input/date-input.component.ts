import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
import {
  DateFilterFn,
  DateRange,
  DatepickerMode,
  NdpAnimation,
  NdpTheme,
} from '../../core/types';
import { atMidnight, dayKey } from '../../core/date-key.util';
import { DatepickerComponent } from '../datepicker/datepicker.component';

/** Which endpoint a text field edits. In single mode only `start` is used. */
type Endpoint = 'start' | 'end';

/**
 * A text field that lets the user **type a date directly** (e.g. `۱۴۰۴/۰۳/۲۸`)
 * and opens a {@link DatepickerComponent} popover for picking. Typing parses
 * through the active {@link CalendarAdapter}; selecting in the calendar writes the
 * text back. In `range` mode it shows two fields (start / end).
 *
 * It is a `ControlValueAccessor`, so it drops straight into reactive or template
 * forms, and forwards the common picker inputs (min/max/theme/…) to the panel.
 */
@Component({
  selector: 'ndp-date-input',
  standalone: true,
  imports: [DatepickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.css',
  host: {
    '[attr.dir]': 'adapter().direction',
    '[attr.data-ndp-theme]': 'theme()',
    '(keydown.escape)': 'close()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateInputComponent), multi: true },
  ],
})
export class DateInputComponent implements ControlValueAccessor {
  private readonly registry = new Map<string, CalendarAdapter>();
  private readonly calendarIds: string[];

  // ── Inputs (forwarded to the inner panel, plus field-only options) ─────────
  readonly theme = input<NdpTheme>('light');
  readonly customVars = input<Record<string, string>>({});
  readonly mode = input<DatepickerMode>('single');
  readonly animation = input<NdpAnimation>('none');
  readonly numberOfMonths = input(1);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly dateFilter = input<DateFilterFn | null>(null);
  readonly showSecondaryDate = input(false);
  readonly secondaryCalendar = input<string | null>(null);
  /** Show the panel footer (Today / Clear / calendar toggle). */
  readonly showFooter = input(true);

  /** Placeholder for the field(s). Defaults to the adapter's format hint. */
  readonly placeholder = input<string | null>(null);
  /** `id` applied to the (start) input, so an external `<label for>` can target it. */
  readonly inputId = input<string | null>(null);
  /**
   * Close the popover after a calendar pick. `null` (default) closes in single
   * mode and stays open in range mode (so both ends can be chosen).
   */
  readonly closeOnSelect = input<boolean | null>(null);

  readonly calendar = model<string>('');
  readonly value = model<DateRange>({ start: null, end: null });

  readonly dateSelected = output<DateRange>();

  // ── State ──────────────────────────────────────────────────────────────────
  protected readonly open = signal(false);
  protected readonly disabled = signal(false);
  protected readonly startText = signal('');
  protected readonly endText = signal('');
  protected readonly startInvalid = signal(false);
  protected readonly endInvalid = signal(false);
  /** Which field currently has focus (so the value→text sync doesn't clobber typing). */
  private readonly focusedField = signal<Endpoint | null>(null);

  protected readonly adapter = computed(
    () => this.registry.get(this.calendar()) ?? this.registry.get(this.calendarIds[0])!,
  );

  protected readonly isRange = computed(() => this.mode() === 'range');
  protected readonly fieldPlaceholder = computed(
    () => this.placeholder() ?? this.adapter().getInputFormatHint(),
  );
  private readonly effectiveCloseOnSelect = computed(
    () => this.closeOnSelect() ?? this.mode() === 'single',
  );

  // ── CVA callbacks ───────────────────────────────────────────────────────────
  private onChange: (v: DateRange) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const adapters = inject(NDP_CALENDAR_ADAPTERS, { optional: true });
    if (!adapters || adapters.length === 0) {
      throw new Error(
        '[ngx-jalali-datepicker] No calendar adapters configured. Add ' +
          'provideNgxDatepicker(...) to your application (or component) providers.',
      );
    }
    for (const a of adapters) this.registry.set(a.id, a);
    this.calendarIds = adapters.map(a => a.id);
    if (!this.calendar()) this.calendar.set(this.calendarIds[0]);

    // Keep the text fields in sync with the value (and active calendar) whenever
    // they change from the outside — but never while the user is typing in them.
    effect(() => {
      const v = this.value();
      const a = this.adapter();
      const editing = this.focusedField();
      if (editing) return;
      untracked(() => {
        this.startText.set(v.start ? a.formatInput(v.start) : '');
        this.endText.set(v.end ? a.formatInput(v.end) : '');
        this.startInvalid.set(false);
        this.endInvalid.set(false);
      });
    });
  }

  // ── Typing ───────────────────────────────────────────────────────────────────
  protected onInput(which: Endpoint, raw: string): void {
    (which === 'start' ? this.startText : this.endText).set(raw);
    const trimmed = raw.trim();

    if (trimmed === '') {
      this.setInvalid(which, false);
      this.commitEndpoint(which, null);
      return;
    }

    const parsed = this.adapter().parse(raw);
    if (!parsed) {
      this.setInvalid(which, true);
      return;
    }
    this.setInvalid(which, false);
    this.commitEndpoint(which, parsed);
  }

  protected onFocus(which: Endpoint): void {
    this.focusedField.set(which);
    this.open.set(true);
  }

  protected onBlur(): void {
    // Dropping focus lets the value→text effect re-run: it reformats a valid
    // value and discards any leftover invalid text.
    this.focusedField.set(null);
    this.onTouched();
  }

  /** Write one endpoint into the value, keeping range order (start ≤ end). */
  private commitEndpoint(which: Endpoint, date: Date | null): void {
    let next: DateRange;
    if (!this.isRange()) {
      next = { start: date, end: null };
    } else {
      const cur = this.value();
      let start = which === 'start' ? date : cur.start;
      let end = which === 'end' ? date : cur.end;
      if (start && end && dayKey(start) > dayKey(end)) [start, end] = [end, start];
      next = { start, end };
    }
    this.value.set(next);
    this.onChange(next);
    this.dateSelected.emit(next);
  }

  private setInvalid(which: Endpoint, invalid: boolean): void {
    (which === 'start' ? this.startInvalid : this.endInvalid).set(invalid);
  }

  // ── Popover ────────────────────────────────────────────────────────────────
  protected toggle(): void {
    if (this.disabled()) return;
    this.open.update(v => !v);
  }

  protected close(): void {
    this.open.set(false);
  }

  /** Value change coming from the inner panel (calendar click, Today, Clear). */
  protected onPanelValue(range: DateRange): void {
    this.value.set(range);
    this.onChange(range);
  }

  /** A concrete pick happened inside the panel — emit and maybe close. */
  protected onPanelSelected(range: DateRange): void {
    this.dateSelected.emit(range);
    if (this.effectiveCloseOnSelect()) this.close();
  }

  // ── ControlValueAccessor ─────────────────────────────────────────────────────
  writeValue(value: DateRange | Date | null): void {
    this.value.set(this.normalize(value));
  }

  registerOnChange(fn: (v: DateRange) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) this.open.set(false);
  }

  private normalize(value: DateRange | Date | null): DateRange {
    if (!value) return { start: null, end: null };
    if (value instanceof Date) return { start: atMidnight(value), end: null };
    return value;
  }
}
