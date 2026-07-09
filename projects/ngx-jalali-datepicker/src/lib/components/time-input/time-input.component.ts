import {
  ChangeDetectionStrategy,
  Component,
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
import { NdpTheme } from '../../core/types';
import { atMidnight, toLatinDigits } from '../../core/date-key.util';
import {
  TimeOfDay,
  getTimeOfDay,
  snapMinutes,
  withTimeOfDay,
  wrapHours,
} from '../../core/time.util';
import { TimePickerComponent } from '../time-picker/time-picker.component';

/**
 * A **time-only** field: a text input showing `HH:mm` plus a popover with the
 * {@link TimePickerComponent} stepper. The value is a `Date` whose *time* is what
 * matters (the day is today unless a date is written in from the outside), which
 * keeps it interchangeable with the rest of the `Date`-based API and a drop-in
 * `ControlValueAccessor`. Digits localize to the active calendar's numerals so it
 * reads naturally under an RTL locale, though `HH:mm` itself stays left-to-right.
 */
@Component({
  selector: 'ndp-time-input',
  standalone: true,
  imports: [TimePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './time-input.component.html',
  styleUrl: './time-input.component.css',
  host: {
    '[attr.dir]': 'adapter().direction',
    '[attr.data-ndp-theme]': 'theme()',
    '(keydown.escape)': 'close()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimeInputComponent), multi: true },
  ],
})
export class TimeInputComponent implements ControlValueAccessor {
  private readonly registry = new Map<string, CalendarAdapter>();
  private readonly calendarIds: string[];

  // ── Inputs ─────────────────────────────────────────────────────────────────
  readonly theme = input<NdpTheme>('light');
  readonly customVars = input<Record<string, string>>({});
  /** Minute increment for the stepper and the ↑/↓ arrow keys (1–30). */
  readonly minuteStep = input(1);
  /** Placeholder for the field. Defaults to `HH:mm`. */
  readonly placeholder = input('HH:mm');
  /** `id` applied to the input, so an external `<label for>` can target it. */
  readonly inputId = input<string | null>(null);
  /** Close the popover after a stepper change. Default `false` (stay open). */
  readonly closeOnSelect = input(false);

  readonly calendar = model<string>('');
  /** Selected value — a `Date` carrying the chosen time (day = today by default). */
  readonly value = model<Date | null>(null);

  readonly timeSelected = output<Date>();

  // ── State ──────────────────────────────────────────────────────────────────
  protected readonly open = signal(false);
  protected readonly disabled = signal(false);
  protected readonly text = signal('');
  protected readonly invalid = signal(false);
  /** True while the field has focus, so the value→text sync doesn't clobber typing. */
  private readonly editing = signal(false);

  protected readonly adapter = computed(
    () => this.registry.get(this.calendar()) ?? this.registry.get(this.calendarIds[0])!,
  );

  /** Time-of-day shown in the picker — the value's time, or the current wall clock. */
  protected readonly currentTime = computed<TimeOfDay>(() =>
    getTimeOfDay(this.value() ?? new Date()),
  );

  // ── CVA callbacks ───────────────────────────────────────────────────────────
  private onChange: (v: Date | null) => void = () => {};
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

    // Keep the text field in sync with the value (and active calendar) whenever
    // they change from the outside — but never while the user is typing.
    effect(() => {
      const v = this.value();
      const a = this.adapter();
      if (this.editing()) return;
      untracked(() => {
        this.text.set(v ? this.render(v, a) : '');
        this.invalid.set(false);
      });
    });
  }

  // ── Typing ───────────────────────────────────────────────────────────────────
  /** Parse `HH:mm` (or `HHmm`, Persian/ASCII digits) as the user types; commit when valid. */
  protected onInput(raw: string): void {
    const masked = this.mask(raw);
    this.text.set(masked);

    const parsed = this.parse(masked);
    if (masked === '') {
      this.invalid.set(false);
      this.commit(null);
      return;
    }
    if (!parsed) {
      this.invalid.set(true);
      return;
    }
    this.invalid.set(false);
    this.commit(parsed);
  }

  protected onFocus(): void {
    this.editing.set(true);
    this.open.set(true);
  }

  protected onBlur(): void {
    // Dropping focus re-runs the value→text effect: it reformats a valid value
    // and discards leftover invalid text.
    this.editing.set(false);
    this.onTouched();
  }

  // ── Popover ────────────────────────────────────────────────────────────────
  protected toggle(): void {
    if (this.disabled()) return;
    this.open.update(v => !v);
  }

  protected close(): void {
    this.open.set(false);
  }

  /** Stepper change from the popover — apply the time and maybe close. */
  protected onTimeChange(time: TimeOfDay): void {
    const base = this.value() ?? atMidnight(new Date());
    const next = withTimeOfDay(base, time.hours, time.minutes);
    this.value.set(next);
    this.text.set(this.render(next, this.adapter()));
    this.invalid.set(false);
    this.onChange(next);
    this.onTouched();
    this.timeSelected.emit(next);
    if (this.closeOnSelect()) this.close();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  /** Localized `HH:mm` for display. */
  private render(date: Date, a: CalendarAdapter): string {
    return `${a.formatNumber(date.getHours(), 2)}:${a.formatNumber(date.getMinutes(), 2)}`;
  }

  /** Group typed digits as `HH:mm` (max 4 digits), localizing to the calendar's numerals. */
  private mask(raw: string): string {
    const digits = toLatinDigits(raw).replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';
    const a = this.adapter();
    const h = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    // Localize each group; join with a plain colon once minutes start.
    const localize = (s: string) => s.replace(/\d/g, d => a.formatNumber(+d));
    return m ? `${localize(h)}:${localize(m)}` : localize(h);
  }

  /** Parse `HH:mm` into a today-dated `Date` (time wrapped/snapped), or null when incomplete. */
  private parse(text: string): Date | null {
    const digits = toLatinDigits(text).replace(/\D/g, '');
    if (digits.length < 3) return null; // need at least H:mm to be meaningful
    const hours = wrapHours(parseInt(digits.slice(0, 2), 10) || 0);
    const minutes = snapMinutes(parseInt(digits.slice(2, 4), 10) || 0, this.minuteStep());
    const base = this.value() ?? atMidnight(new Date());
    return withTimeOfDay(base, hours, minutes);
  }

  private commit(date: Date | null): void {
    this.value.set(date);
    this.onChange(date);
    if (date) this.timeSelected.emit(date);
  }

  // ── ControlValueAccessor ─────────────────────────────────────────────────────
  writeValue(value: Date | null): void {
    this.value.set(value instanceof Date ? value : null);
  }

  registerOnChange(fn: (v: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) this.open.set(false);
  }
}
