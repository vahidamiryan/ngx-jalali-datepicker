import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PeriodCell, PeriodView } from '@ndp/core';

/**
 * Renders a grid of selectable periods — twelve months, or one page of years.
 * Purely presentational: the parent builds the {@link PeriodView} (all flags
 * precomputed) and owns selection / navigation state. Shared by the month and
 * year picker views; the only difference is the cell list it's handed.
 */
@Component({
  selector: 'ndp-calendar-period',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-period.component.html',
  styleUrl: './calendar-period.component.css',
})
export class CalendarPeriodComponent {
  readonly view = input.required<PeriodView>();
  /** Numeric key of the roving-focus cell, for `tabindex` management. */
  readonly focusedKey = input<number | null>(null);

  readonly periodSelect = output<PeriodCell>();

  onSelect(cell: PeriodCell): void {
    if (cell.isDisabled) return;
    this.periodSelect.emit(cell);
  }
}
