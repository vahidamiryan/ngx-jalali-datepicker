import { ComponentRef, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateInputComponent } from './date-input.component';
import { GregorianCalendarAdapter } from '@vahidamiryan/datepicker-core';
import { provideNgxDatepicker } from '../../datepicker.providers';
import { dayKey } from '@vahidamiryan/datepicker-core';

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
        provideNgxDatepicker(new GregorianCalendarAdapter('en-US')),
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
});
