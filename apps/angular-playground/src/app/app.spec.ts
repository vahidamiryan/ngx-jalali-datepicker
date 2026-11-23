import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { appConfig } from './app.config';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let root: HTMLElement;
  const demo = () => root.querySelector<HTMLElement>('.ex__demo')!;
  const days = () => [...demo().querySelectorAll<HTMLButtonElement>('.ndp-day:not(.ndp-day--outside):enabled')];
  const click = (element: HTMLElement) => {
    element.click();
    fixture.detectChanges();
  };
  const tab = (name: string) => click(
    [...root.querySelectorAll<HTMLButtonElement>('.tabs__tab')].find(button => button.textContent?.trim() === name)!,
  );
  const type = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [appConfig.providers, provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('shows the live gallery in both directions and cycles colors', () => {
    expect(root.querySelector('h1')?.textContent).toContain('Calendar & date picker');
    expect([...root.querySelectorAll<HTMLElement>('.showcase-sample ndp-datepicker')].map(picker => picker.dir))
      .toEqual(['ltr', 'rtl']);
    const theme = root.querySelector<HTMLButtonElement>('.theme-toggle')!;
    click(theme);
    expect(root.querySelector('app-calendar-showcase ndp-datepicker')?.getAttribute('data-ndp-theme')).toBe('dark');
    click(theme);
    expect(root.querySelector('app-calendar-showcase ndp-datepicker')?.getAttribute('data-ndp-theme')).toBe('auto');
  });

  it('keeps a preset provisional until it is applied and restores it on Cancel', () => {
    const result = () => root.querySelector('.showcase-result output')!.textContent;
    const original = result();
    const presets = root.querySelectorAll<HTMLButtonElement>('.showcase-presets button');
    click(presets[0]);
    expect(presets[0].getAttribute('aria-pressed')).toBe('true');
    expect(result()).toBe(original);
    click(root.querySelector<HTMLButtonElement>('.showcase-actions button:first-child')!);
    expect(presets[0].getAttribute('aria-pressed')).toBe('false');
    click(presets[0]);
    click(root.querySelector<HTMLButtonElement>('.showcase-apply')!);
    expect(result()).not.toBe(original);
  });

  it('selects single and range dates, previews a range, and clears either endpoint', () => {
    const app = fixture.componentInstance;
    expect(demo().querySelector('.ndp-month-title__secondary')).toBeTruthy();
    click(days()[12]);
    expect(app.single().start).toBeInstanceOf(Date);
    tab('Range');
    click(days()[0]);
    days()[4].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(demo().querySelector('.ndp-day--preview')).toBeTruthy();
    click(days()[4]);
    expect(app.range().end).toBeInstanceOf(Date);
    click(demo().querySelector<HTMLButtonElement>('.ndp-summary__clear-btn')!);
    expect(app.range().start).toBeNull();
    expect(app.range().end).toBeInstanceOf(Date);
    const clear = demo().querySelector<HTMLButtonElement>('.ndp-actions .ndp-btn:last-child')!;
    expect(clear.disabled).toBeFalse();
    click(clear);
    expect(app.range().end).toBeNull();
  });

  it('supports typed Jalali dates, a date with time, and a standalone clock', () => {
    const app = fixture.componentInstance;
    tab('Date input');
    const dateField = demo().querySelector<HTMLInputElement>('.ndp-input__field')!;
    type(dateField, '۱۴۰۴/۰۳/۲۸');
    expect(app.inputSingle().start).toBeInstanceOf(Date);
    type(dateField, '9999/01/01');
    expect(dateField.getAttribute('aria-invalid')).toBe('true');
    tab('Date + time');
    click(days()[10]);
    const clock = demo().querySelector<HTMLInputElement>('ndp-datepicker .ndp-time__input')!;
    type(clock, '14');
    expect(app.time().start?.getHours()).toBe(14);
    click(days()[12]);
    expect(app.time().start?.getHours()).toBe(14);
    type(demo().querySelector<HTMLInputElement>('ndp-time-input input')!, '0930');
    expect(app.timeOnly()?.getHours()).toBe(9);
    expect(app.timeOnly()?.getMinutes()).toBe(30);
  });

  it('selects periods, Hijri dates and projected cells', () => {
    const app = fixture.componentInstance;
    tab('Month / Year');
    const grids = demo().querySelectorAll('.ndp-period-grid');
    click(grids[0].querySelector<HTMLButtonElement>('.ndp-period-cell:enabled')!);
    click(grids[1].querySelector<HTMLButtonElement>('.ndp-period-cell:enabled')!);
    expect(app.month().start).toBeInstanceOf(Date);
    expect(app.year().start).toBeInstanceOf(Date);
    tab('Hijri');
    click(days()[12]);
    expect(app.hijri().start).toBeInstanceOf(Date);
    tab('Tri-calendar');
    expect(demo().querySelector('.tri__sub')).toBeTruthy();
    click(days()[12]);
    expect(app.triple().start).toBeInstanceOf(Date);
    tab('Custom cell');
    expect(demo().querySelector('.cell__dot')).toBeTruthy();
    click(days()[12]);
    expect(app.custom().start).toBeInstanceOf(Date);
  });

  it('closes the dropdown after picking and respects reactive form disablement', () => {
    const app = fixture.componentInstance;
    tab('Dropdown');
    click(demo().querySelector<HTMLButtonElement>('.dropdown__trigger')!);
    click(days()[12]);
    expect(demo().querySelector('.dropdown__panel')).toBeNull();
    expect(app.dropValue().start).toBeInstanceOf(Date);
    tab('Reactive Forms');
    click(days()[12]);
    expect(app.dateCtrl.value?.start).toBeInstanceOf(Date);
    click(demo().querySelector<HTMLButtonElement>('.btn')!);
    expect(app.dateCtrl.disabled).toBeTrue();
    expect(demo().querySelector<HTMLElement>('.ndp-panel')?.inert).toBeTrue();
  });
});
