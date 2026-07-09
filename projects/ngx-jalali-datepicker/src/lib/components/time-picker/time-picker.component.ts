import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CalendarAdapter } from '../../core/calendar-adapter';
import { TimeOfDay } from '../../core/time.util';
import { normalizeStep, snapMinutes, stepMinutes, wrapHours } from '../../core/time.util';
import { toLatinDigits } from '../../core/date-key.util';

/**
 * Two spinner fields (hours : minutes) for the optional time-of-day feature.
 * Purely presentational: the parent owns the time on the selected value and
 * feeds it in as {@link TimeOfDay}; every change is emitted back through
 * {@link timeChange}. Digits render in the active calendar's own numerals and
 * the layout follows the host's `dir`, so it sits naturally under an RTL grid.
 */
@Component({
  selector: 'ndp-time-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.css',
})
export class TimePickerComponent {
  /** Active calendar adapter — used only to localize the displayed digits. */
  readonly adapter = input.required<CalendarAdapter>();
  /** Current time-of-day shown in the fields. */
  readonly time = input.required<TimeOfDay>();
  /** Minute increment for the stepper and the arrow keys (1–30). */
  readonly minuteStep = input(1);
  /** Disable the whole control (mirrors the panel's disabled state). */
  readonly disabled = input(false);
  /** Draw the top divider that separates the stepper from a grid above it. */
  readonly bordered = input(true);

  /** Emitted with the new {@link TimeOfDay} whenever hours or minutes change. */
  readonly timeChange = output<TimeOfDay>();

  protected readonly step = computed(() => normalizeStep(this.minuteStep()));
  protected readonly hoursText = computed(() => this.adapter().formatNumber(this.time().hours, 2));
  protected readonly minutesText = computed(() => this.adapter().formatNumber(this.time().minutes, 2));

  /** Bump the hours by ±1 (wrapping 23→0 / 0→23). */
  protected stepHours(dir: -1 | 1): void {
    if (this.disabled()) return;
    this.emit(wrapHours(this.time().hours + dir), this.time().minutes);
  }

  /** Bump the minutes by ±`minuteStep`, snapping to the step grid and wrapping. */
  protected stepMinutes(dir: -1 | 1): void {
    if (this.disabled()) return;
    this.emit(this.time().hours, stepMinutes(this.time().minutes, this.step(), dir));
  }

  /** Commit a typed hours value; ignores non-numeric input, wraps out-of-range. */
  protected onHoursInput(raw: string): void {
    const n = this.readDigits(raw);
    if (n === null) return;
    this.emit(wrapHours(n), this.time().minutes);
  }

  /** Commit a typed minutes value; snaps to the step grid and wraps. */
  protected onMinutesInput(raw: string): void {
    const n = this.readDigits(raw);
    if (n === null) return;
    this.emit(this.time().hours, snapMinutes(n, this.step()));
  }

  /** Arrow-up / arrow-down adjust the focused field like the stepper buttons. */
  protected onHoursKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') { event.preventDefault(); this.stepHours(1); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); this.stepHours(-1); }
  }

  protected onMinutesKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') { event.preventDefault(); this.stepMinutes(1); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); this.stepMinutes(-1); }
  }

  private emit(hours: number, minutes: number): void {
    this.timeChange.emit({ hours, minutes });
  }

  /** Parse whatever the user typed (Persian/ASCII digits) into a plain int, or null. */
  private readDigits(raw: string): number | null {
    const digits = toLatinDigits(raw).replace(/\D/g, '');
    if (!digits) return null;
    return parseInt(digits, 10);
  }
}
