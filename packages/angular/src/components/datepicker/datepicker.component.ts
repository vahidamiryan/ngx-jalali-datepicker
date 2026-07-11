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
import { CalendarAdapter } from '@ndp/core';
import { NDP_CALENDAR_ADAPTERS } from '../../datepicker.providers';
import {
  CalendarView,
  DateFilterFn,
  DateRange,
  DayCell,
  DatepickerMode,
  NdpAnimation,
  NdpTheme,
  PeriodCell,
} from '@ndp/core';
import { atMidnight, clampDate, dayKey } from '@ndp/core';
import { applySelection, isSelectionComplete } from '@ndp/core';
import { buildMonthsView, buildYearsView, YEARS_PER_PAGE } from '@ndp/core';
import { TimeOfDay, getTimeOfDay, withTimeOfDay } from '@ndp/core';
import { CalendarMonthComponent } from '../calendar-month/calendar-month.component';
import { CalendarPeriodComponent } from '../calendar-period/calendar-period.component';
import { TimePickerComponent } from '../time-picker/time-picker.component';
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
  imports: [CalendarMonthComponent, CalendarPeriodComponent, TimePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.css',
  host: {
    '[attr.dir]': 'adapter().direction',
    '[attr.data-ndp-theme]': 'theme()',
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
  readonly theme = input<NdpTheme>('light');
  /** Override individual CSS design tokens programmatically, e.g. `{ '--ndp-accent': '#8b5cf6' }`. */
  readonly customVars = input<Record<string, string>>({});
  readonly mode = input<DatepickerMode>('single');
  /** Body animation when navigating between months / years / pages. `'none'` by default. */
  readonly animation = input<NdpAnimation>('none');
  readonly numberOfMonths = input(1);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly dateFilter = input<DateFilterFn | null>(null);
  readonly showFooter = input(true);
  readonly showSummary = input(true);
  readonly showToday = input(true);
  readonly showClear = input(true);
  readonly showCalendarToggle = input(true);
  /** Show the month/year quick-navigation dropdowns in the header. When false, the header shows a plain (non-interactive) month/year label. */
  readonly showQuickNav = input(true);
  /** Show a text field above the grid for typing the date directly. Day modes only (single / range). */
  readonly showInput = input(false);
  /** Show an hours:minutes time picker under the grid. Single mode only — the selected value carries the chosen time. */
  readonly showTime = input(false);
  /** Minute increment for the time picker's stepper and arrow keys (1–30). */
  readonly minuteStep = input(1);
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

  // ── Typed-input state (active only when `showInput` is on, in day modes) ─────
  protected readonly startText = signal('');
  protected readonly endText = signal('');
  protected readonly startInvalid = signal(false);
  protected readonly endInvalid = signal(false);
  /** Which input field has focus, so the value→text sync doesn't clobber typing. */
  private readonly typingField = signal<'start' | 'end' | null>(null);
  /** True when the typing field(s) should render: opt-in and a day mode. */
  protected readonly inputVisible = computed(
    () => this.showInput() && (this.mode() === 'single' || this.mode() === 'range'),
  );

  /** True when the time picker should render: opt-in, single mode, day view. */
  protected readonly timeVisible = computed(
    () => this.showTime() && this.mode() === 'single' && this.viewMode() === 'day',
  );

  /**
   * Time-of-day shown in the time picker — the selected value's time, or the
   * current wall-clock time as a sensible default before anything is picked.
   */
  protected readonly currentTime = computed<TimeOfDay>(() => {
    const start = this.value().start;
    return getTimeOfDay(start ?? new Date());
  });

  /** Which grid the body shows. Driven by `mode`: month/year modes pin their grid. */
  protected readonly viewMode = computed<CalendarView>(() => {
    const m = this.mode();
    return m === 'month' || m === 'year' ? m : 'day';
  });
  /**
   * Open state of the header quick-navigation menus (day mode only). Stores the
   * index of the month block whose menu is open (or null when closed), so each
   * calendar in a multi-month layout owns its own dropdown.
   */
  protected readonly monthMenuOpen = signal<number | null>(null);
  protected readonly yearMenuOpen = signal<number | null>(null);
  /** True when any quick-nav menu is open (note: block index 0 is falsy on its own). */
  protected readonly anyMenuOpen = computed(
    () => this.monthMenuOpen() !== null || this.yearMenuOpen() !== null,
  );

  /**
   * Direction of the in-flight slide animation, or null when idle. Set right
   * before `activeMonth` moves so the freshly rendered grid mounts with the
   * direction class already applied; cleared on `animationend`.
   */
  protected readonly slideDir = signal<'prev' | 'next' | null>(null);

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

  // ── Month / year picker views ──────────────────────────────────────────────
  private readonly periodContext = computed(() => ({
    value: this.value(),
    today: this.today(),
    min: this.min(),
    max: this.max(),
  }));

  protected readonly monthsView = computed(() =>
    buildMonthsView(this.adapter(), this.activeMonth(), this.periodContext()),
  );

  protected readonly yearsView = computed(() =>
    buildYearsView(this.adapter(), this.activeMonth(), this.periodContext()),
  );

  /**
   * The grid shown in month/year modes. The template keys the period component
   * on this view's label so navigation recreates it — which is what lets the
   * slide-in animation replay on every page change.
   */
  protected readonly activePeriodView = computed(() =>
    this.viewMode() === 'year' ? this.yearsView() : this.monthsView(),
  );

  /** Roving-focus key for the active period grid (month or year view). */
  protected readonly periodFocusedKey = computed<number | null>(() => {
    const a = this.adapter();
    const base = this.focusedDate() ?? this.activeMonth();
    if (this.viewMode() === 'month') return a.getYear(base) * 100 + a.getMonth(base);
    if (this.viewMode() === 'year') return a.getYear(base);
    return null;
  });

  /** Heading shown in month view (the year) and year view (the year span). */
  protected readonly periodHeading = computed(() =>
    this.viewMode() === 'year' ? this.yearsView().label : this.monthsView().label,
  );

  // ── Quick-navigation menus (day mode header dropdowns) ──────────────────────
  protected readonly monthOptions = computed(() =>
    this.adapter()
      .getMonthNames()
      .map((label, i) => ({ month: i + 1, label })),
  );

  /** Localized month name for a block's month, shown on its month dropdown trigger. */
  protected blockMonthName(monthStart: Date): string {
    const a = this.adapter();
    return a.getMonthNames()[a.getMonth(monthStart) - 1];
  }

  /** Localized year label for a block's month, shown on its year dropdown trigger. */
  protected blockYearLabel(monthStart: Date): string {
    return this.adapter().getYearLabel(monthStart);
  }

  /** A block's month number (1-based), to flag the selected item in its month menu. */
  protected blockMonthNumber(monthStart: Date): number {
    return this.adapter().getMonth(monthStart);
  }

  /** A block's year number, to flag the selected item in its year menu. */
  protected blockYearNumber(monthStart: Date): number {
    return this.adapter().getYear(monthStart);
  }

  /** Active year number for the month-picker header dropdown (single-block period view). */
  protected readonly activeYearNumber = computed(() => this.adapter().getYear(this.activeMonth()));

  /** Years offered by the year dropdown — bounded by [min, max] or a generous default span. */
  protected readonly yearOptions = computed(() => {
    const a = this.adapter();
    const todayYear = a.getYear(this.today());
    const min = this.min();
    const max = this.max();
    const lo = min ? a.getYear(atMidnight(min)) : todayYear - 100;
    const hi = max ? a.getYear(atMidnight(max)) : todayYear + 20;
    const out: { year: number; label: string }[] = [];
    for (let y = lo; y <= hi; y++) out.push({ year: y, label: a.getYearLabel(a.createDate(y, 1, 1)) });
    return out;
  });

  // ── Navigation guards ───────────────────────────────────────────────────────
  /** Can the view move back? Meaning depends on the active view (month / year / page). */
  protected readonly canGoPrev = computed(() => {
    const min = this.min();
    if (!min) return true;
    const a = this.adapter();
    const minKey = dayKey(atMidnight(min));
    switch (this.viewMode()) {
      case 'month':
        return a.getYear(this.activeMonth()) > a.getYear(atMidnight(min));
      case 'year': {
        const pageStart = Math.floor(a.getYear(this.activeMonth()) / YEARS_PER_PAGE) * YEARS_PER_PAGE;
        return pageStart > a.getYear(atMidnight(min));
      }
      default:
        return dayKey(this.visibleMonths()[0]) > dayKey(a.startOfMonth(atMidnight(min)));
    }
  });

  /** Can the view move forward? Meaning depends on the active view (month / year / page). */
  protected readonly canGoNext = computed(() => {
    const max = this.max();
    if (!max) return true;
    const a = this.adapter();
    switch (this.viewMode()) {
      case 'month':
        return a.getYear(this.activeMonth()) < a.getYear(atMidnight(max));
      case 'year': {
        const pageEnd =
          Math.floor(a.getYear(this.activeMonth()) / YEARS_PER_PAGE) * YEARS_PER_PAGE +
          YEARS_PER_PAGE -
          1;
        return pageEnd < a.getYear(atMidnight(max));
      }
      default: {
        const months = this.visibleMonths();
        const lastStart = months[months.length - 1];
        return dayKey(lastStart) < dayKey(a.startOfMonth(atMidnight(max)));
      }
    }
  });

  // ── CVA callbacks ──────────────────────────────────────────────────────────
  private onChange: (v: DateRange) => void = () => {};
  private onTouched: () => void = () => {};
  private _prevCustomVarKeys: string[] = [];

  constructor() {
    const adapters = inject(NDP_CALENDAR_ADAPTERS, { optional: true });
    if (!adapters || adapters.length === 0) {
      throw new Error(
        '[ngx-jalali-datepicker] No calendar adapters configured. Add ' +
          'provideNgxDatepicker(...) to your application (or component) providers, e.g. ' +
          'provideNgxDatepicker(new JalaliCalendarAdapter(), new GregorianCalendarAdapter()).',
      );
    }
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

    // Keep the typed-input field(s) in sync with the value and active calendar,
    // except while the user is typing in them.
    effect(() => {
      const v = this.value();
      const a = this.adapter();
      if (this.typingField()) return;
      untracked(() => {
        this.startText.set(v.start ? a.formatInput(v.start) : '');
        this.endText.set(v.end ? a.formatInput(v.end) : '');
        this.startInvalid.set(false);
        this.endInvalid.set(false);
      });
    });

    // Apply custom CSS variable overrides directly on the host element.
    effect(() => {
      const vars = this.customVars();
      const el = this.host.nativeElement;
      for (const key of this._prevCustomVarKeys) {
        el.style.removeProperty(key);
      }
      for (const [key, value] of Object.entries(vars)) {
        el.style.setProperty(key, value);
      }
      this._prevCustomVarKeys = Object.keys(vars);
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  protected onDaySelect(cell: DayCell): void {
    let next = applySelection(this.mode(), this.value(), cell.date);
    // In time mode, carry the currently chosen time onto the newly picked day so
    // clicking a date doesn't reset the clock to midnight.
    if (this.timeVisible()) {
      const t = this.currentTime();
      next = { start: next.start ? withTimeOfDay(next.start, t.hours, t.minutes) : null, end: next.end };
    }
    this.value.set(next);
    this.focusedDate.set(cell.date);
    this.onChange(next);
    this.onTouched();
    if (isSelectionComplete(this.mode(), next)) this.hovered.set(null);
    this.dateSelected.emit(next);
  }

  /** Apply a new time-of-day to the selected day (or today if nothing is picked yet). */
  protected onTimeChange(time: TimeOfDay): void {
    const start = this.value().start ?? atMidnight(this.today());
    const next: DateRange = { start: withTimeOfDay(start, time.hours, time.minutes), end: null };
    this.value.set(next);
    this.focusedDate.set(next.start);
    this.onChange(next);
    this.onTouched();
    this.dateSelected.emit(next);
  }

  protected onDayHover(date: Date | null): void {
    this.hovered.set(date);
  }

  // ── Typed input ──────────────────────────────────────────────────────────────
  /** Handle text typed into the start/end field: parse, validate, commit. */
  protected onInputType(which: 'start' | 'end', raw: string): void {
    (which === 'start' ? this.startText : this.endText).set(raw);
    const trimmed = raw.trim();

    if (trimmed === '') {
      this.setInputInvalid(which, false);
      this.commitTyped(which, null);
      return;
    }

    const parsed = this.adapter().parse(raw);
    if (!parsed) {
      this.setInputInvalid(which, true);
      return;
    }
    this.setInputInvalid(which, false);
    this.commitTyped(which, parsed);
  }

  protected onInputFocus(which: 'start' | 'end'): void {
    this.typingField.set(which);
  }

  protected onInputBlur(): void {
    // Dropping focus re-runs the value→text effect: it reformats a valid value
    // and discards leftover invalid text.
    this.typingField.set(null);
    this.onTouched();
  }

  /** Write one typed endpoint into the value, keep range order, and navigate to it. */
  private commitTyped(which: 'start' | 'end', date: Date | null): void {
    let next: DateRange;
    if (this.mode() === 'range') {
      const cur = this.value();
      let start = which === 'start' ? date : cur.start;
      let end = which === 'end' ? date : cur.end;
      if (start && end && dayKey(start) > dayKey(end)) [start, end] = [end, start];
      next = { start, end };
    } else {
      next = { start: date, end: null };
    }
    this.value.set(next);
    this.onChange(next);
    if (date) {
      this.focusedDate.set(date);
      if (!this.isVisible(date)) this.activeMonth.set(this.adapter().startOfMonth(date));
    }
    this.dateSelected.emit(next);
  }

  private setInputInvalid(which: 'start' | 'end', invalid: boolean): void {
    (which === 'start' ? this.startInvalid : this.endInvalid).set(invalid);
  }

  // ── Navigation / footer ─────────────────────────────────────────────────────
  /** Step the view back: by a month (day view), a year (month view), or a page (year view). */
  protected goPrev(): void {
    if (!this.canGoPrev()) return;
    this.beginSlide(-1);
    this.activeMonth.set(this.shiftActive(-1));
  }

  /** Step the view forward — counterpart to {@link goPrev}. */
  protected goNext(): void {
    if (!this.canGoNext()) return;
    this.beginSlide(1);
    this.activeMonth.set(this.shiftActive(1));
  }

  /** Arm the slide animation for the upcoming view change (no-op when disabled). */
  private beginSlide(dir: -1 | 1): void {
    if (this.animation() !== 'slide') return;
    this.slideDir.set(dir === 1 ? 'next' : 'prev');
  }

  /** Arm the slide animation toward `target`, inferring the direction from the current view. */
  private beginSlideTowards(target: Date): void {
    const delta = dayKey(target) - dayKey(this.activeMonth());
    if (delta !== 0) this.beginSlide(delta > 0 ? 1 : -1);
  }

  /** Clears the direction class once the slide finishes so it can re-trigger later. */
  protected onSlideEnd(): void {
    this.slideDir.set(null);
  }

  /** Move `activeMonth` by one navigation step in the current view's unit. */
  private shiftActive(dir: -1 | 1): Date {
    const a = this.adapter();
    switch (this.viewMode()) {
      case 'month':
        return a.addCalendarYears(this.activeMonth(), dir);
      case 'year':
        return a.addCalendarYears(this.activeMonth(), dir * YEARS_PER_PAGE);
      default:
        return a.addCalendarMonths(this.activeMonth(), dir);
    }
  }

  protected goToToday(): void {
    const t = this.today();
    const target = this.adapter().startOfMonth(t);
    this.beginSlideTowards(target);
    this.activeMonth.set(target);
    this.focusedDate.set(t);
  }

  // ── Month / year picker selection ───────────────────────────────────────────
  /** Commit a whole month or year (month/year modes) from the body grid. */
  protected onPeriodSelect(cell: PeriodCell): void {
    this.commitPeriod(cell.date);
  }

  /** Commit the period containing `date`, snapping to its month/year start. */
  private commitPeriod(date: Date): void {
    const a = this.adapter();
    const start = this.viewMode() === 'year' ? a.startOfYear(date) : a.startOfMonth(date);
    const next: DateRange = { start, end: null };
    this.value.set(next);
    this.activeMonth.set(start);
    this.focusedDate.set(start);
    this.onChange(next);
    this.onTouched();
    this.dateSelected.emit(next);
  }

  // ── Quick-navigation menus ──────────────────────────────────────────────────
  /** Toggle the month menu for block `index`; only one menu is open at a time. */
  protected toggleMonthMenu(index = 0): void {
    this.yearMenuOpen.set(null);
    this.monthMenuOpen.update(v => (v === index ? null : index));
  }

  /** Toggle the year menu for block `index`; only one menu is open at a time. */
  protected toggleYearMenu(index = 0): void {
    this.monthMenuOpen.set(null);
    this.yearMenuOpen.update(v => (v === index ? null : index));
  }

  protected closeMenus(): void {
    this.monthMenuOpen.set(null);
    this.yearMenuOpen.set(null);
  }

  /**
   * Jump so that block `index` shows `month` of its current year, keeping the
   * day view. `activeMonth` is the first block, so a later block is offset back
   * by `index` months to land the pick in that block's slot.
   */
  protected pickMonth(month: number, index = 0): void {
    const a = this.adapter();
    const blockMonth = a.addCalendarMonths(this.activeMonth(), index);
    const picked = a.createDate(a.getYear(blockMonth), month, 1);
    const target = a.addCalendarMonths(picked, -index);
    this.beginSlideTowards(target);
    this.activeMonth.set(target);
    this.monthMenuOpen.set(null);
  }

  /** Jump so that block `index` shows `year`, preserving that block's month. */
  protected pickYear(year: number, index = 0): void {
    const a = this.adapter();
    const blockMonth = a.addCalendarMonths(this.activeMonth(), index);
    const picked = a.createDate(year, a.getMonth(blockMonth), 1);
    const target = a.addCalendarMonths(picked, -index);
    this.beginSlideTowards(target);
    this.activeMonth.set(target);
    this.yearMenuOpen.set(null);
  }

  protected clear(): void {
    const empty: DateRange = { start: null, end: null };
    this.value.set(empty);
    this.hovered.set(null);
    this.onChange(empty);
    this.dateSelected.emit(empty);
  }

  protected clearStart(): void {
    const current = this.value();
    const next: DateRange = { start: null, end: current.end };
    this.value.set(next);
    this.hovered.set(null);
    this.onChange(next);
    this.dateSelected.emit(next);
  }

  protected clearEnd(): void {
    const current = this.value();
    const next: DateRange = { start: current.start, end: null };
    this.value.set(next);
    this.hovered.set(null);
    this.onChange(next);
    this.dateSelected.emit(next);
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
    if (event.key === 'Escape' && this.anyMenuOpen()) {
      this.closeMenus();
      return;
    }
    if (this.viewMode() !== 'day') {
      this.onPeriodKeydown(event);
      return;
    }
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
    if (!this.isVisible(next)) {
      const target = a.startOfMonth(next);
      this.beginSlideTowards(target);
      this.activeMonth.set(target);
    }
    requestAnimationFrame(() => this.focusActiveCell());
  }

  /** Keyboard navigation for the month / year picker grids (3-column layout). */
  private onPeriodKeydown(event: KeyboardEvent): void {
    const a = this.adapter();
    const rtl = a.direction === 'rtl';
    const isYear = this.viewMode() === 'year';
    const current = this.focusedDate() ?? this.activeMonth();
    // One step is a month (month view) or a year (year view); a row is 3 cells.
    const step = (units: number) =>
      isYear ? a.addCalendarYears(current, units) : a.addCalendarMonths(current, units);
    let next: Date | null = null;

    switch (event.key) {
      case 'ArrowRight':
        next = step(rtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        next = step(rtl ? 1 : -1);
        break;
      case 'ArrowDown':
        next = step(3);
        break;
      case 'ArrowUp':
        next = step(-3);
        break;
      case 'PageDown':
        next = isYear ? a.addCalendarYears(current, YEARS_PER_PAGE) : a.addCalendarYears(current, 1);
        break;
      case 'PageUp':
        next = isYear ? a.addCalendarYears(current, -YEARS_PER_PAGE) : a.addCalendarYears(current, -1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.commitPeriod(current);
        return;
      default:
        return;
    }

    event.preventDefault();
    next = clampDate(next, this.min(), this.max());
    this.focusedDate.set(next);
    if (!this.isPeriodVisible(next)) {
      const target = a.startOfMonth(next);
      this.beginSlideTowards(target);
      this.activeMonth.set(target);
    }
    requestAnimationFrame(() => this.focusActiveCell());
  }

  /** True when `date`'s period (year for month view, page for year view) is on screen. */
  private isPeriodVisible(date: Date): boolean {
    const a = this.adapter();
    if (this.viewMode() === 'year') {
      const page = (y: number) => Math.floor(y / YEARS_PER_PAGE);
      return page(a.getYear(date)) === page(a.getYear(this.activeMonth()));
    }
    return a.getYear(date) === a.getYear(this.activeMonth());
  }

  private focusActiveCell(): void {
    // In the period views the focusable cell is keyed by the period key; in the
    // day view it's the day key. Either way exactly one cell carries tabindex 0.
    const key = this.viewMode() === 'day' ? this.focusedKey() : this.periodFocusedKey();
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
