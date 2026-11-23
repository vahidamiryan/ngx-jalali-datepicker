import { CalendarAdapter } from './calendar-adapter';
import { toLatinDigits } from './date-key.util';

const PAGE_SIZE = 12;

export function buildYearNavigation(
  adapter: CalendarAdapter,
  month: Date,
  today: Date,
  min: Date | null,
  max: Date | null,
  offset: number,
  query: string,
) {
  const year = adapter.getYear(month);
  const monthNumber = adapter.getMonth(month);
  const todayYear = adapter.getYear(today);
  const minYear = min ? adapter.getYear(min) : -Infinity;
  const maxYear = max ? adapter.getYear(max) : Infinity;
  const anchor = Math.min(maxYear, Math.max(minYear, year));
  const first = min ? minYear : Math.min(anchor, todayYear - 100);
  const last = max ? maxYear : Math.max(anchor, todayYear + 20);
  const page = Math.floor(anchor / PAGE_SIZE) + offset;
  const from = Math.max(first, page * PAGE_SIZE);
  const to = Math.min(last, (page + 1) * PAGE_SIZE - 1);
  const term = toLatinDigits(query.trim());
  const searching = term !== '';
  const candidate = /^-?\d{1,6}$/.test(term) ? Number(term) : NaN;
  const years = searching ? [candidate] : Array.from(
    { length: Math.max(0, to - from + 1) }, (_, index) => from + index,
  );
  const options = years.flatMap(value => {
    if (!Number.isFinite(value) || value < minYear || value > maxYear) return [];
    // Round-trip to catch years that the adapter cannot represent, including
    // adapters that normalize an unsupported year instead of throwing.
    let date: Date;
    try {
      date = adapter.createDate(value, monthNumber, 1);
      if (!Number.isFinite(date.getTime()) || adapter.getYear(date) !== value) return [];
    } catch {
      return [];
    }
    return [{ year: value, label: adapter.getYearLabel(date) }];
  });
  return {
    year,
    options,
    searching,
    canPrevious: from > first,
    canNext: to < last,
  };
}
