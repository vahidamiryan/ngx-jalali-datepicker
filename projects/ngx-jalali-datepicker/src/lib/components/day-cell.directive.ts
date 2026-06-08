import { Directive, TemplateRef, inject } from '@angular/core';
import { DayCell } from '../core/types';

/**
 * Marks an `<ng-template>` as the custom renderer for a day cell.
 *
 * ```html
 * <ndp-datepicker>
 *   <ng-template ndpDayCell let-day>
 *     <span [class.cheap]="day.isWeekend">{{ day.label }}</span>
 *   </ng-template>
 * </ndp-datepicker>
 * ```
 */
@Directive({
  selector: 'ng-template[ndpDayCell]',
  standalone: true,
})
export class NdpDayCellTemplate {
  readonly template = inject<TemplateRef<{ $implicit: DayCell }>>(TemplateRef);

  /** Lets Angular's strict template type-checking infer `let-day` as a `DayCell`. */
  static ngTemplateContextGuard(
    _dir: NdpDayCellTemplate,
    ctx: unknown,
  ): ctx is { $implicit: DayCell } {
    return true;
  }
}
