import { computed, ref, watch, type Ref } from 'vue';
import {
  type CalendarAdapter,
  type CalendarView,
  type DateFilterFn,
  type DateRange,
  type DayCell,
  type DatepickerMode,
  type PeriodCell,
  type TimeOfDay,
  atMidnight,
  clampDate,
  dayKey,
  applySelection,
  isSelectionComplete,
  buildMonthsView,
  buildYearsView,
  YEARS_PER_PAGE,
  getTimeOfDay,
  withTimeOfDay,
} from '@vahidamiryan/datepicker-core';

/**
 * Reactive inputs the composable reads. These mirror the Angular
 * `DatepickerComponent`'s `input()`s; the SFC wires them from its props.
 */
export interface UseDatepickerOptions {
  adapters: CalendarAdapter[];
  mode: Ref<DatepickerMode>;
  numberOfMonths: Ref<number>;
  min: Ref<Date | null>;
  max: Ref<Date | null>;
  dateFilter: Ref<DateFilterFn | null>;
  animation: Ref<'none' | 'slide'>;
  showTime: Ref<boolean>;
  minuteStep: Ref<number>;
  showSecondaryDate: Ref<boolean>;
  secondaryCalendar: Ref<string | null>;
  showInput: Ref<boolean>;
  /** Two-way value model. */
  value: Ref<DateRange>;
  /** Two-way active-calendar model. */
  calendar: Ref<string>;
  /** Called on every concrete selection (mirrors `(dateSelected)`). */
  onSelected: (range: DateRange) => void;
  /** Query the host element to move DOM focus to the active cell. */
  getHost: () => HTMLElement | null;
}

/**
 * The full picker state machine, ported from the Angular `DatepickerComponent`.
 * All heavy date logic delegates to the shared `@vahidamiryan/datepicker-core`, so behavior is
 * identical across frameworks. Signals → refs, computeds → computeds,
 * effects → watchers.
 */
export function useDatepicker(opts: UseDatepickerOptions) {
  const registry = new Map<string, CalendarAdapter>();
  for (const a of opts.adapters) registry.set(a.id, a);
  const calendarIds = opts.adapters.map((a) => a.id);
  if (!opts.calendar.value) opts.calendar.value = calendarIds[0];

  // ── Internal state ─────────────────────────────────────────────────────────
  const today = ref(atMidnight(new Date()));
  const activeMonth = ref(atMidnight(new Date()));
  const hovered = ref<Date | null>(null);
  const focusedDate = ref<Date | null>(null);
  const disabled = ref(false);

  // Typed-input state
  const startText = ref('');
  const endText = ref('');
  const startInvalid = ref(false);
  const endInvalid = ref(false);
  const typingField = ref<'start' | 'end' | null>(null);

  // Quick-nav menus + slide animation
  const monthMenuOpen = ref<number | null>(null);
  const yearMenuOpen = ref<number | null>(null);
  const slideDir = ref<'prev' | 'next' | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const adapter = computed(
    () => registry.get(opts.calendar.value) ?? registry.get(calendarIds[0])!,
  );

  const viewMode = computed<CalendarView>(() => {
    const m = opts.mode.value;
    return m === 'month' || m === 'year' ? m : 'day';
  });

  const inputVisible = computed(
    () => opts.showInput.value && (opts.mode.value === 'single' || opts.mode.value === 'range'),
  );

  const timeVisible = computed(
    () => opts.showTime.value && opts.mode.value === 'single' && viewMode.value === 'day',
  );

  const currentTime = computed<TimeOfDay>(() => getTimeOfDay(opts.value.value.start ?? new Date()));

  const anyMenuOpen = computed(() => monthMenuOpen.value !== null || yearMenuOpen.value !== null);

  const visibleMonths = computed<Date[]>(() => {
    const a = adapter.value;
    const base = a.startOfMonth(activeMonth.value);
    const out: Date[] = [];
    for (let i = 0; i < opts.numberOfMonths.value; i++) out.push(a.addCalendarMonths(base, i));
    return out;
  });

  const focusedKey = computed(() => {
    const f = focusedDate.value;
    return f ? dayKey(f) : null;
  });

  const canToggleCalendar = computed(() => calendarIds.length > 1);

  const secondaryAdapter = computed<CalendarAdapter | null>(() => {
    if (!opts.showSecondaryDate.value) return null;
    const active = opts.calendar.value;
    const explicit = opts.secondaryCalendar.value;
    if (explicit && explicit !== active && registry.has(explicit)) return registry.get(explicit)!;
    const otherId = calendarIds.find((id) => id !== active);
    return otherId ? registry.get(otherId)! : null;
  });

  // ── Period (month/year) views ────────────────────────────────────────────────
  const periodContext = computed(() => ({
    value: opts.value.value,
    today: today.value,
    min: opts.min.value,
    max: opts.max.value,
  }));

  const monthsView = computed(() =>
    buildMonthsView(adapter.value, activeMonth.value, periodContext.value),
  );
  const yearsView = computed(() =>
    buildYearsView(adapter.value, activeMonth.value, periodContext.value),
  );
  const activePeriodView = computed(() =>
    viewMode.value === 'year' ? yearsView.value : monthsView.value,
  );

  const periodFocusedKey = computed<number | null>(() => {
    const a = adapter.value;
    const base = focusedDate.value ?? activeMonth.value;
    if (viewMode.value === 'month') return a.getYear(base) * 100 + a.getMonth(base);
    if (viewMode.value === 'year') return a.getYear(base);
    return null;
  });

  const periodHeading = computed(() =>
    viewMode.value === 'year' ? yearsView.value.label : monthsView.value.label,
  );

  // ── Quick-nav menu option lists ──────────────────────────────────────────────
  const monthOptions = computed(() =>
    adapter.value.getMonthNames().map((label, i) => ({ month: i + 1, label })),
  );

  const activeYearNumber = computed(() => adapter.value.getYear(activeMonth.value));

  const yearOptions = computed(() => {
    const a = adapter.value;
    const todayYear = a.getYear(today.value);
    const min = opts.min.value;
    const max = opts.max.value;
    const lo = min ? a.getYear(atMidnight(min)) : todayYear - 100;
    const hi = max ? a.getYear(atMidnight(max)) : todayYear + 20;
    const out: { year: number; label: string }[] = [];
    for (let y = lo; y <= hi; y++) out.push({ year: y, label: a.getYearLabel(a.createDate(y, 1, 1)) });
    return out;
  });

  // ── Navigation guards ─────────────────────────────────────────────────────────
  const canGoPrev = computed(() => {
    const min = opts.min.value;
    if (!min) return true;
    const a = adapter.value;
    switch (viewMode.value) {
      case 'month':
        return a.getYear(activeMonth.value) > a.getYear(atMidnight(min));
      case 'year': {
        const pageStart = Math.floor(a.getYear(activeMonth.value) / YEARS_PER_PAGE) * YEARS_PER_PAGE;
        return pageStart > a.getYear(atMidnight(min));
      }
      default:
        return dayKey(visibleMonths.value[0]) > dayKey(a.startOfMonth(atMidnight(min)));
    }
  });

  const canGoNext = computed(() => {
    const max = opts.max.value;
    if (!max) return true;
    const a = adapter.value;
    switch (viewMode.value) {
      case 'month':
        return a.getYear(activeMonth.value) < a.getYear(atMidnight(max));
      case 'year': {
        const pageEnd =
          Math.floor(a.getYear(activeMonth.value) / YEARS_PER_PAGE) * YEARS_PER_PAGE +
          YEARS_PER_PAGE -
          1;
        return pageEnd < a.getYear(atMidnight(max));
      }
      default: {
        const months = visibleMonths.value;
        const lastStart = months[months.length - 1];
        return dayKey(lastStart) < dayKey(a.startOfMonth(atMidnight(max)));
      }
    }
  });

  // ── Initial positioning ──────────────────────────────────────────────────────
  const initialStart = opts.value.value.start ?? today.value;
  activeMonth.value = adapter.value.startOfMonth(initialStart);
  focusedDate.value = opts.value.value.start ?? today.value;

  // Re-center the view when the *value* changes from the outside (e.g. a form
  // patch) and the new value isn't already visible.
  watch(
    () => opts.value.value.start,
    (s) => {
      if (!s) return;
      if (!isVisible(s)) activeMonth.value = adapter.value.startOfMonth(s);
    },
  );

  // Keep the typed-input field(s) in sync with the value + active calendar,
  // except while the user is typing.
  watch(
    [() => opts.value.value, adapter],
    () => {
      if (typingField.value) return;
      const v = opts.value.value;
      const a = adapter.value;
      startText.value = v.start ? a.formatInput(v.start) : '';
      endText.value = v.end ? a.formatInput(v.end) : '';
      startInvalid.value = false;
      endInvalid.value = false;
    },
    { immediate: true, deep: true },
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  function shiftDays(date: Date, delta: number): Date {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + delta);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function isVisible(date: Date): boolean {
    const a = adapter.value;
    const months = visibleMonths.value;
    const firstStart = months[0];
    const lastEnd = a.addCalendarMonths(months[months.length - 1], 1);
    const k = dayKey(date);
    return k >= dayKey(firstStart) && k < dayKey(lastEnd);
  }

  function isPeriodVisible(date: Date): boolean {
    const a = adapter.value;
    if (viewMode.value === 'year') {
      const page = (y: number) => Math.floor(y / YEARS_PER_PAGE);
      return page(a.getYear(date)) === page(a.getYear(activeMonth.value));
    }
    return a.getYear(date) === a.getYear(activeMonth.value);
  }

  function isDisabledDate(date: Date): boolean {
    const min = opts.min.value;
    const max = opts.max.value;
    const filter = opts.dateFilter.value;
    const k = dayKey(date);
    if (min && k < dayKey(atMidnight(min))) return true;
    if (max && k > dayKey(atMidnight(max))) return true;
    return filter ? !filter(date) : false;
  }

  function commit(next: DateRange): void {
    opts.value.value = next;
    opts.onSelected(next);
  }

  // ── Selection ─────────────────────────────────────────────────────────────────
  function onDaySelect(cell: DayCell): void {
    let next = applySelection(opts.mode.value, opts.value.value, cell.date);
    if (timeVisible.value) {
      const t = currentTime.value;
      next = {
        start: next.start ? withTimeOfDay(next.start, t.hours, t.minutes) : null,
        end: next.end,
      };
    }
    focusedDate.value = cell.date;
    if (isSelectionComplete(opts.mode.value, next)) hovered.value = null;
    commit(next);
  }

  function onTimeChange(time: TimeOfDay): void {
    const start = opts.value.value.start ?? atMidnight(today.value);
    const next: DateRange = { start: withTimeOfDay(start, time.hours, time.minutes), end: null };
    focusedDate.value = next.start;
    commit(next);
  }

  function onDayHover(date: Date | null): void {
    hovered.value = date;
  }

  // ── Typed input ────────────────────────────────────────────────────────────────
  function onInputType(which: 'start' | 'end', raw: string): void {
    if (which === 'start') startText.value = raw;
    else endText.value = raw;
    const trimmed = raw.trim();
    if (trimmed === '') {
      setInputInvalid(which, false);
      commitTyped(which, null);
      return;
    }
    const parsed = adapter.value.parse(raw);
    if (!parsed) {
      setInputInvalid(which, true);
      return;
    }
    setInputInvalid(which, false);
    commitTyped(which, parsed);
  }

  function onInputFocus(which: 'start' | 'end'): void {
    typingField.value = which;
  }

  function onInputBlur(): void {
    typingField.value = null;
  }

  function commitTyped(which: 'start' | 'end', date: Date | null): void {
    let next: DateRange;
    if (opts.mode.value === 'range') {
      const cur = opts.value.value;
      let start = which === 'start' ? date : cur.start;
      let end = which === 'end' ? date : cur.end;
      if (start && end && dayKey(start) > dayKey(end)) [start, end] = [end, start];
      next = { start, end };
    } else {
      next = { start: date, end: null };
    }
    if (date) {
      focusedDate.value = date;
      if (!isVisible(date)) activeMonth.value = adapter.value.startOfMonth(date);
    }
    commit(next);
  }

  function setInputInvalid(which: 'start' | 'end', invalid: boolean): void {
    if (which === 'start') startInvalid.value = invalid;
    else endInvalid.value = invalid;
  }

  // ── Navigation / slide ──────────────────────────────────────────────────────────
  function beginSlide(dir: -1 | 1): void {
    if (opts.animation.value !== 'slide') return;
    slideDir.value = dir === 1 ? 'next' : 'prev';
  }

  function beginSlideTowards(target: Date): void {
    const delta = dayKey(target) - dayKey(activeMonth.value);
    if (delta !== 0) beginSlide(delta > 0 ? 1 : -1);
  }

  function onSlideEnd(): void {
    slideDir.value = null;
  }

  function shiftActive(dir: -1 | 1): Date {
    const a = adapter.value;
    switch (viewMode.value) {
      case 'month':
        return a.addCalendarYears(activeMonth.value, dir);
      case 'year':
        return a.addCalendarYears(activeMonth.value, dir * YEARS_PER_PAGE);
      default:
        return a.addCalendarMonths(activeMonth.value, dir);
    }
  }

  function goPrev(): void {
    if (!canGoPrev.value) return;
    beginSlide(-1);
    activeMonth.value = shiftActive(-1);
  }

  function goNext(): void {
    if (!canGoNext.value) return;
    beginSlide(1);
    activeMonth.value = shiftActive(1);
  }

  function goToToday(): void {
    const t = today.value;
    const target = adapter.value.startOfMonth(t);
    beginSlideTowards(target);
    activeMonth.value = target;
    focusedDate.value = t;
  }

  // ── Period selection ─────────────────────────────────────────────────────────
  function onPeriodSelect(cell: PeriodCell): void {
    commitPeriod(cell.date);
  }

  function commitPeriod(date: Date): void {
    const a = adapter.value;
    const start = viewMode.value === 'year' ? a.startOfYear(date) : a.startOfMonth(date);
    const next: DateRange = { start, end: null };
    activeMonth.value = start;
    focusedDate.value = start;
    commit(next);
  }

  // ── Quick-nav menus ──────────────────────────────────────────────────────────
  function toggleMonthMenu(index = 0): void {
    yearMenuOpen.value = null;
    monthMenuOpen.value = monthMenuOpen.value === index ? null : index;
  }

  function toggleYearMenu(index = 0): void {
    monthMenuOpen.value = null;
    yearMenuOpen.value = yearMenuOpen.value === index ? null : index;
  }

  function closeMenus(): void {
    monthMenuOpen.value = null;
    yearMenuOpen.value = null;
  }

  function pickMonth(month: number, index = 0): void {
    const a = adapter.value;
    const blockMonth = a.addCalendarMonths(activeMonth.value, index);
    const picked = a.createDate(a.getYear(blockMonth), month, 1);
    const target = a.addCalendarMonths(picked, -index);
    beginSlideTowards(target);
    activeMonth.value = target;
    monthMenuOpen.value = null;
  }

  function pickYear(year: number, index = 0): void {
    const a = adapter.value;
    const blockMonth = a.addCalendarMonths(activeMonth.value, index);
    const picked = a.createDate(year, a.getMonth(blockMonth), 1);
    const target = a.addCalendarMonths(picked, -index);
    beginSlideTowards(target);
    activeMonth.value = target;
    yearMenuOpen.value = null;
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  function clear(): void {
    const empty: DateRange = { start: null, end: null };
    hovered.value = null;
    commit(empty);
  }

  function clearStart(): void {
    const next: DateRange = { start: null, end: opts.value.value.end };
    hovered.value = null;
    commit(next);
  }

  function clearEnd(): void {
    const next: DateRange = { start: opts.value.value.start, end: null };
    hovered.value = null;
    commit(next);
  }

  function toggleCalendar(): void {
    const i = calendarIds.indexOf(opts.calendar.value);
    opts.calendar.value = calendarIds[(i + 1) % calendarIds.length];
  }

  // ── Labels ───────────────────────────────────────────────────────────────────
  function blockMonthName(monthStart: Date): string {
    const a = adapter.value;
    return a.getMonthNames()[a.getMonth(monthStart) - 1];
  }
  function blockYearLabel(monthStart: Date): string {
    return adapter.value.getYearLabel(monthStart);
  }
  function blockMonthNumber(monthStart: Date): number {
    return adapter.value.getMonth(monthStart);
  }
  function blockYearNumber(monthStart: Date): number {
    return adapter.value.getYear(monthStart);
  }
  function monthLabel(monthStart: Date): string {
    return adapter.value.getMonthLabel(monthStart);
  }
  function secondaryMonthLabel(monthStart: Date): string {
    const sec = secondaryAdapter.value;
    if (!sec) return '';
    const start = adapter.value.startOfMonth(monthStart);
    const lastDay = shiftDays(adapter.value.addCalendarMonths(start, 1), -1);
    const a = sec.getMonthLabel(start);
    const b = sec.getMonthLabel(lastDay);
    return a === b ? a : `${a} – ${b}`;
  }
  function secondaryFormat(date: Date): string {
    return secondaryAdapter.value?.format(date) ?? '';
  }

  // ── Keyboard ───────────────────────────────────────────────────────────────────
  function toCell(date: Date): DayCell {
    const a = adapter.value;
    return {
      date,
      key: dayKey(date),
      label: a.getDayLabel(date),
      dayOfMonth: a.getDayOfMonth(date),
      weekday: a.getWeekdayIndex(date),
      inCurrentMonth: true,
      isToday: false,
      isWeekend: false,
      isDisabled: isDisabledDate(date),
      isSelected: false,
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
      isPreview: false,
    };
  }

  function focusActiveCell(): void {
    const host = opts.getHost();
    if (!host) return;
    const key = viewMode.value === 'day' ? focusedKey.value : periodFocusedKey.value;
    if (key == null) return;
    const el = host.querySelector<HTMLElement>(`[data-key="${key}"][tabindex="0"]`);
    el?.focus();
  }

  function onPeriodKeydown(event: KeyboardEvent): void {
    const a = adapter.value;
    const rtl = a.direction === 'rtl';
    const isYear = viewMode.value === 'year';
    const current = focusedDate.value ?? activeMonth.value;
    const stepBy = (units: number) =>
      isYear ? a.addCalendarYears(current, units) : a.addCalendarMonths(current, units);
    let next: Date | null = null;

    switch (event.key) {
      case 'ArrowRight':
        next = stepBy(rtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        next = stepBy(rtl ? 1 : -1);
        break;
      case 'ArrowDown':
        next = stepBy(3);
        break;
      case 'ArrowUp':
        next = stepBy(-3);
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
        commitPeriod(current);
        return;
      default:
        return;
    }

    event.preventDefault();
    next = clampDate(next, opts.min.value, opts.max.value);
    focusedDate.value = next;
    if (!isPeriodVisible(next)) {
      const target = a.startOfMonth(next);
      beginSlideTowards(target);
      activeMonth.value = target;
    }
    requestAnimationFrame(() => focusActiveCell());
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && anyMenuOpen.value) {
      closeMenus();
      return;
    }
    if (viewMode.value !== 'day') {
      onPeriodKeydown(event);
      return;
    }
    const a = adapter.value;
    const rtl = a.direction === 'rtl';
    const current = focusedDate.value ?? today.value;
    let next: Date | null = null;

    switch (event.key) {
      case 'ArrowRight':
        next = shiftDays(current, rtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        next = shiftDays(current, rtl ? 1 : -1);
        break;
      case 'ArrowDown':
        next = shiftDays(current, 7);
        break;
      case 'ArrowUp':
        next = shiftDays(current, -7);
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
        next = shiftDays(next, -1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onDaySelect(toCell(current));
        return;
      default:
        return;
    }

    event.preventDefault();
    next = clampDate(next, opts.min.value, opts.max.value);
    focusedDate.value = next;
    if (!isVisible(next)) {
      const target = a.startOfMonth(next);
      beginSlideTowards(target);
      activeMonth.value = target;
    }
    requestAnimationFrame(() => focusActiveCell());
  }

  /** Set from the outside (CVA-equivalent) — position the view on the value. */
  function setDisabled(v: boolean): void {
    disabled.value = v;
  }

  return {
    // state
    today,
    activeMonth,
    hovered,
    focusedDate,
    disabled,
    startText,
    endText,
    startInvalid,
    endInvalid,
    monthMenuOpen,
    yearMenuOpen,
    slideDir,
    // derived
    adapter,
    viewMode,
    inputVisible,
    timeVisible,
    currentTime,
    anyMenuOpen,
    visibleMonths,
    focusedKey,
    canToggleCalendar,
    secondaryAdapter,
    monthsView,
    yearsView,
    activePeriodView,
    periodFocusedKey,
    periodHeading,
    monthOptions,
    activeYearNumber,
    yearOptions,
    canGoPrev,
    canGoNext,
    calendarIds,
    // methods
    onDaySelect,
    onTimeChange,
    onDayHover,
    onInputType,
    onInputFocus,
    onInputBlur,
    goPrev,
    goNext,
    goToToday,
    onSlideEnd,
    onPeriodSelect,
    toggleMonthMenu,
    toggleYearMenu,
    closeMenus,
    pickMonth,
    pickYear,
    clear,
    clearStart,
    clearEnd,
    toggleCalendar,
    blockMonthName,
    blockYearLabel,
    blockMonthNumber,
    blockYearNumber,
    monthLabel,
    secondaryMonthLabel,
    secondaryFormat,
    onKeydown,
    setDisabled,
  };
}
