import { ComponentRef, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatepickerComponent } from './datepicker.component';
import { GregorianCalendarAdapter } from '../../adapters/gregorian.adapter';
import { provideNgxDatepicker } from '../../datepicker.providers';
import { dayKey } from '../../core/date-key.util';

describe('DatepickerComponent keyboard navigation bounds', () => {
  let fixture: ComponentFixture<DatepickerComponent>;
  let component: DatepickerComponent;
  let ref: ComponentRef<DatepickerComponent>;

  /** Read the protected `focusedDate` signal for assertions. */
  const focusedDate = (): Date | null => (component as any).focusedDate();

  function press(key: string): void {
    fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DatepickerComponent],
      providers: [
        // The library is zoneless; the test environment must match.
        provideZonelessChangeDetection(),
        // Single Gregorian calendar keeps month math easy to assert on.
        provideNgxDatepicker(new GregorianCalendarAdapter('en-US')),
      ],
    });

    fixture = TestBed.createComponent(DatepickerComponent);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
  });

  /** Seed a deterministic focused date (setInput on `value` doesn't move focus). */
  function focusOn(date: Date): void {
    component.writeValue({ start: date, end: null });
    fixture.detectChanges();
  }

  it('clamps PageUp to the min month instead of entering disabled past months', () => {
    const min = new Date(2026, 5, 1); // 1 Jun 2026
    ref.setInput('min', min);
    focusOn(new Date(2026, 5, 15));

    press('PageUp'); // would land on 15 May 2026 — fully before min

    expect(dayKey(focusedDate()!)).toBe(dayKey(min));
  });

  it('clamps PageDown to the max month instead of entering disabled future months', () => {
    const max = new Date(2026, 5, 30); // 30 Jun 2026
    ref.setInput('max', max);
    focusOn(new Date(2026, 5, 15));

    press('PageDown'); // would land on 15 Jul 2026 — fully after max

    expect(dayKey(focusedDate()!)).toBe(dayKey(max));
  });

  it('clamps ArrowLeft at the min boundary', () => {
    const min = new Date(2026, 5, 1);
    ref.setInput('min', min);
    focusOn(min);

    press('ArrowLeft'); // would step to 31 May 2026 — before min

    expect(dayKey(focusedDate()!)).toBe(dayKey(min));
  });

  it('still navigates freely within the allowed range', () => {
    ref.setInput('min', new Date(2026, 0, 1));
    ref.setInput('max', new Date(2026, 11, 31));
    focusOn(new Date(2026, 5, 15));

    press('PageUp'); // 15 May 2026 — well inside range

    expect(dayKey(focusedDate()!)).toBe(dayKey(new Date(2026, 4, 15)));
  });
});

describe('DatepickerComponent month / year picker modes', () => {
  let fixture: ComponentFixture<DatepickerComponent>;
  let component: DatepickerComponent;
  let ref: ComponentRef<DatepickerComponent>;

  const value = (): { start: Date | null; end: Date | null } => component.value();

  function press(key: string): void {
    fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  }

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
  });

  it('month mode commits the first day of the chosen month', () => {
    ref.setInput('mode', 'month');
    component.writeValue({ start: new Date(2026, 5, 20), end: null }); // focus June 2026
    fixture.detectChanges();

    press('Enter'); // selects the focused month

    expect(value().start).toBeTruthy();
    expect(dayKey(value().start!)).toBe(dayKey(new Date(2026, 5, 1)));
    expect(value().end).toBeNull();
  });

  it('year mode commits the first day of the chosen year', () => {
    ref.setInput('mode', 'year');
    component.writeValue({ start: new Date(2026, 5, 20), end: null });
    fixture.detectChanges();

    press('ArrowRight'); // move focus to 2027
    press('Enter');

    expect(dayKey(value().start!)).toBe(dayKey(new Date(2027, 0, 1)));
  });
});
