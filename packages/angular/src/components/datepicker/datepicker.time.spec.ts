import { ComponentRef, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatepickerComponent } from './datepicker.component';
import { GregorianCalendarAdapter } from '@vahidamiryan/datepicker-core';
import { provideNgxDatepicker } from '../../datepicker.providers';
import { DateRange } from '@vahidamiryan/datepicker-core';

describe('DatepickerComponent time-of-day', () => {
  let fixture: ComponentFixture<DatepickerComponent>;
  let component: DatepickerComponent;
  let ref: ComponentRef<DatepickerComponent>;

  const value = (): DateRange => (component as any).value();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DatepickerComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNgxDatepicker(new GregorianCalendarAdapter('en-US')),
      ],
    });
    fixture = TestBed.createComponent(DatepickerComponent);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    ref.setInput('showTime', true);
    fixture.detectChanges();
  });

  it('renders the time picker only in single day mode when showTime is on', () => {
    expect((component as any).timeVisible()).toBe(true);
    ref.setInput('mode', 'range');
    fixture.detectChanges();
    expect((component as any).timeVisible()).toBe(false);
  });

  it('applies a chosen time onto the selected day', () => {
    component.writeValue({ start: new Date(2026, 5, 6), end: null });
    fixture.detectChanges();
    (component as any).onTimeChange({ hours: 14, minutes: 30 });
    fixture.detectChanges();
    expect(value().start!.getHours()).toBe(14);
    expect(value().start!.getMinutes()).toBe(30);
    expect(value().start!.getDate()).toBe(6);
  });

  it('keeps the time when a new day is clicked', () => {
    component.writeValue({ start: new Date(2026, 5, 6), end: null });
    fixture.detectChanges();
    (component as any).onTimeChange({ hours: 9, minutes: 15 });
    fixture.detectChanges();

    // Simulate picking another day in the same month.
    (component as any).onDaySelect({ date: new Date(2026, 5, 20) });
    fixture.detectChanges();

    expect(value().start!.getDate()).toBe(20);
    expect(value().start!.getHours()).toBe(9);
    expect(value().start!.getMinutes()).toBe(15);
  });

  it('does not carry time in range mode (time picker hidden)', () => {
    ref.setInput('mode', 'range');
    fixture.detectChanges();
    (component as any).onDaySelect({ date: new Date(2026, 5, 20) });
    fixture.detectChanges();
    expect(value().start!.getHours()).toBe(0);
  });
});
