import { ComponentRef, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeInputComponent } from './time-input.component';
import { GregorianCalendarAdapter } from '@vahidamirian/datepicker-core';
import { provideNgxDatepicker } from '../../datepicker.providers';

describe('TimeInputComponent', () => {
  let fixture: ComponentFixture<TimeInputComponent>;
  let component: TimeInputComponent;
  let ref: ComponentRef<TimeInputComponent>;

  const value = (): Date | null => (component as any).value();
  const text = (): string => (component as any).text();
  const invalid = (): boolean => (component as any).invalid();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TimeInputComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNgxDatepicker(new GregorianCalendarAdapter('en-US')),
      ],
    });
    fixture = TestBed.createComponent(TimeInputComponent);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    fixture.detectChanges();
  });

  it('parses a typed HH:mm into a Date carrying that time', () => {
    (component as any).onInput('0930');
    fixture.detectChanges();
    expect(value()!.getHours()).toBe(9);
    expect(value()!.getMinutes()).toBe(30);
    expect(invalid()).toBe(false);
  });

  it('masks digits into HH:mm as the user types', () => {
    (component as any).onInput('1445');
    expect(text()).toBe('14:45');
  });

  it('wraps out-of-range hours and snaps minutes to the step', () => {
    ref.setInput('minuteStep', 15);
    fixture.detectChanges();
    (component as any).onInput('2537'); // 25h → 01, 37m snaps to 30
    fixture.detectChanges();
    expect(value()!.getHours()).toBe(1);
    expect(value()!.getMinutes()).toBe(30);
  });

  it('clears the value on empty input', () => {
    (component as any).onInput('0930');
    fixture.detectChanges();
    (component as any).onInput('');
    fixture.detectChanges();
    expect(value()).toBeNull();
  });

  it('applies a stepper time change from the popover', () => {
    (component as any).onTimeChange({ hours: 22, minutes: 5 });
    fixture.detectChanges();
    expect(value()!.getHours()).toBe(22);
    expect(value()!.getMinutes()).toBe(5);
    expect(text()).toBe('22:05');
  });

  it('reflects a written-in value in the field text (ControlValueAccessor)', () => {
    component.writeValue(new Date(2026, 5, 6, 7, 8));
    fixture.detectChanges();
    expect(text()).toBe('07:08');
  });
});
