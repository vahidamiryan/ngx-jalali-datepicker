import { ComponentRef, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateInputComponent } from './date-input.component';
import { GregorianCalendarAdapter, JalaliCalendarAdapter } from '@vahidamirian/datepicker-core';
import { provideNgxDatepicker } from '../../datepicker.providers';
import { dayKey } from '@vahidamirian/datepicker-core';

describe('DateInputComponent', () => {
  let fixture: ComponentFixture<DateInputComponent>;
  let component: DateInputComponent;
  let ref: ComponentRef<DateInputComponent>;

  const fields = (): HTMLInputElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.ndp-input__field'));

  function type(el: HTMLInputElement, text: string): void {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DateInputComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNgxDatepicker(new GregorianCalendarAdapter('en-US'), new JalaliCalendarAdapter()),
      ],
    });
    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    fixture.detectChanges();
  });

  it('parses a typed date into the value', () => {
    type(fields()[0], '2026/03/21');
    expect(dayKey(component.value().start!)).toBe(dayKey(new Date(2026, 2, 21)));
    expect(component.value().end).toBeNull();
  });

  it('marks invalid text via aria-invalid and leaves the value untouched', () => {
    type(fields()[0], '2026/03/15');
    const before = component.value().start;

    type(fields()[0], '2026/13/40');
    expect(fields()[0].getAttribute('aria-invalid')).toBe('true');
    expect(component.value().start).toBe(before); // unchanged
  });

  it('clearing the field clears the endpoint', () => {
    type(fields()[0], '2026/03/21');
    type(fields()[0], '');
    expect(component.value().start).toBeNull();
  });

  it('keeps the committed date when pasted text or date restrictions reject an edit', () => {
    ref.setInput('min', new Date(2026, 2, 10));
    ref.setInput('max', new Date(2026, 2, 31));
    ref.setInput('dateFilter', (date: Date) => date.getDate() !== 21);
    fixture.detectChanges();
    type(fields()[0], '2026/03/20');
    const before = component.value();
    for (const invalid of ['unavailable', '2026/03/09', '2026/03/21', '2026/04/01']) {
      type(fields()[0], invalid);
      expect(fields()[0].getAttribute('aria-invalid')).withContext(invalid).toBe('true');
      expect(component.value()).withContext(invalid).toBe(before);
    }
  });

  it('reflects an external value as formatted text', () => {
    component.writeValue({ start: new Date(2026, 4, 9), end: null });
    fixture.detectChanges();
    expect(fields()[0].value).toBe('2026/05/09');
  });

  describe('range mode', () => {
    beforeEach(() => {
      ref.setInput('mode', 'range');
      fixture.detectChanges();
    });

    it('shows two fields and fills both endpoints', () => {
      const f = fields();
      expect(f.length).toBe(2);
      type(f[0], '2026/03/10');
      type(f[1], '2026/03/20');
      expect(dayKey(component.value().start!)).toBe(dayKey(new Date(2026, 2, 10)));
      expect(dayKey(component.value().end!)).toBe(dayKey(new Date(2026, 2, 20)));
    });

    it('reorders endpoints when start is typed after end', () => {
      const f = fields();
      type(f[0], '2026/03/25'); // start later than the end we type next
      type(f[1], '2026/03/05');
      expect(dayKey(component.value().start!)).toBe(dayKey(new Date(2026, 2, 5)));
      expect(dayKey(component.value().end!)).toBe(dayKey(new Date(2026, 2, 25)));
    });
  });

  it('opens on focus and closes on Escape', () => {
    fields()[0].dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ndp-input__popover')).toBeTruthy();

    fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ndp-input__popover')).toBeFalsy();
  });

  it('reopens on the selected Jalali month without committing year navigation', () => {
    const jalali = new JalaliCalendarAdapter();
    const value = { start: jalali.createDate(1404, 11, 30), end: null };
    const onChange = jasmine.createSpy('onChange');
    const valueChange = jasmine.createSpy('valueChange');
    const dateSelected = jasmine.createSpy('dateSelected');
    const calendarChange = jasmine.createSpy('calendarChange');
    component.registerOnChange(onChange);
    component.value.subscribe(valueChange);
    component.dateSelected.subscribe(dateSelected);
    component.calendar.subscribe(calendarChange);
    ref.setInput('calendar', 'jalali');
    ref.setInput('value', value);
    fixture.detectChanges();

    function click(selector: string): void {
      fixture.nativeElement.querySelector(selector).click();
      fixture.detectChanges();
    }

    const monthLabel = (): string =>
      fixture.nativeElement.querySelector('.ndp-month').getAttribute('aria-label');

    expect(fields()[0].value).toBe('۱۴۰۴/۱۱/۳۰');
    click('.ndp-input__toggle');
    expect(monthLabel()).toBe(jalali.getMonthLabel(value.start));
    expect(fixture.nativeElement.querySelector('.ndp-summary__text').textContent).toContain('۱۴۰۴');

    click('.ndp-year-trigger');
    const active = fixture.nativeElement.querySelector('.ndp-year-option[aria-current="true"]');
    expect(active.textContent?.trim()).toBe('۱۴۰۴');
    const search: HTMLInputElement = fixture.nativeElement.querySelector('.ndp-year-search');
    type(search, '۱۲۹۵');
    expect(fixture.nativeElement.querySelectorAll('.ndp-year-grid button').length).toBe(1);
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    search.dispatchEvent(enter);
    fixture.detectChanges();
    expect(monthLabel()).toBe(jalali.getMonthLabel(jalali.createDate(1295, 11, 1)));

    click('.ndp-input__toggle');
    click('.ndp-input__toggle');
    expect(monthLabel()).toBe(jalali.getMonthLabel(value.start));
    expect(component.value()).toBe(value);
    expect(onChange).not.toHaveBeenCalled();
    expect(valueChange).not.toHaveBeenCalled();
    expect(dateSelected).not.toHaveBeenCalled();
    expect(calendarChange).not.toHaveBeenCalled();
  });

  it('opens on today when the bound selection is invalid', () => {
    const jalali = new JalaliCalendarAdapter();
    ref.setInput('calendar', 'jalali');
    ref.setInput('value', { start: new Date(NaN), end: null });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.ndp-input__toggle').click();
    fixture.detectChanges();

    expect(fields()[0].value).toBe('');
    expect(fixture.nativeElement.querySelector('.ndp-month').getAttribute('aria-label'))
      .toBe(jalali.getMonthLabel(new Date()));
  });
});
