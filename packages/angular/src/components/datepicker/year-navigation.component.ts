import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, input, output, signal, viewChild } from '@angular/core';
import { CalendarAdapter, NdpLabels, buildYearNavigation } from '@vahidamirian/datepicker-core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'ndp-year-navigation',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './year-navigation.component.html',
  styleUrl: './year-navigation.component.css',
})
export class YearNavigationComponent {
  readonly adapter = input.required<CalendarAdapter>();
  readonly month = input.required<Date>();
  readonly today = input.required<Date>();
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly labels = input.required<NdpLabels>();
  readonly jump = output<number>();

  protected readonly query = signal('');
  protected readonly offset = signal(0);
  protected readonly navigation = computed(() => buildYearNavigation(
    this.adapter(), this.month(), this.today(), this.min(), this.max(), this.offset(), this.query(),
  ));
  private readonly search = viewChild.required<ElementRef<HTMLInputElement>>('search');

  constructor() {
    afterNextRender(() => this.search().nativeElement.focus({ preventScroll: true }));
  }

  protected page(delta: number): void {
    this.offset.update(value => value + delta);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const { options, searching } = this.navigation();
    if (searching && options[0]) this.jump.emit(options[0].year);
  }
}
