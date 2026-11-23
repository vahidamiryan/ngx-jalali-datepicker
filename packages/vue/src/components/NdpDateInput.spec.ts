import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { JalaliCalendarAdapter, GregorianCalendarAdapter, type DateRange } from '@vahidamirian/datepicker-core';
import NdpDateInput from './NdpDateInput.vue';
import { NDP_CALENDAR_ADAPTERS } from '../adapters';

function mountInput(props: Record<string, unknown> = {}) {
  return mount(NdpDateInput, {
    props,
    global: {
      provide: {
        [NDP_CALENDAR_ADAPTERS as symbol]: [
          new JalaliCalendarAdapter(),
          new GregorianCalendarAdapter('en-US'),
        ],
      },
    },
  });
}

describe('NdpDateInput (Vue)', () => {
  it('parses a typed Gregorian date and emits it', async () => {
    const wrapper = mountInput({ calendar: 'gregorian' });
    const field = wrapper.find('input.ndp-input__field');
    await field.setValue('2026/03/21');
    await field.trigger('input');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    const range = emitted!.at(-1)![0] as DateRange;
    expect(range.start).toBeInstanceOf(Date);
    expect(range.start!.getFullYear()).toBe(2026);
    expect(range.start!.getMonth()).toBe(2); // March
    expect(range.start!.getDate()).toBe(21);
  });

  it('flags an impossible date as invalid without committing', async () => {
    const wrapper = mountInput({ calendar: 'gregorian' });
    const field = wrapper.find('input.ndp-input__field');
    // Feb 31 does not exist.
    await field.setValue('2026/02/31');
    await field.trigger('input');
    expect(field.attributes('aria-invalid')).toBe('true');
  });

  it('round-trips a Jalali date through parse → formatInput', () => {
    const cal = new JalaliCalendarAdapter();
    const d = cal.parse('1404/07/30'); // Mehr has 30 days
    expect(d).toBeInstanceOf(Date);
    expect(cal.parse('1404/07/31')).toBeNull(); // Mehr has no 31st
  });

  it('opens the popover panel on focus', async () => {
    const wrapper = mountInput();
    await wrapper.find('input.ndp-input__field').trigger('focus');
    expect(wrapper.find('.ndp-input__popover').exists()).toBe(true);
  });

  it('rejects text-only paste and dates excluded by the calendar bounds or filter', async () => {
    const wrapper = mountInput({
      calendar: 'gregorian', min: new Date(2026, 2, 10), max: new Date(2026, 2, 31),
      dateFilter: (date: Date) => date.getDate() !== 21,
    });
    const field = wrapper.get('input.ndp-input__field');
    await field.setValue('2026/03/20');
    for (const invalid of ['unavailable', '2026/03/09', '2026/03/21', '2026/04/01']) {
      await field.setValue(invalid);
      expect(field.attributes('aria-invalid'), invalid).toBe('true');
    }
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
  });

  it('emits a calendar pick once, then closes the single-date popover', async () => {
    const wrapper = mountInput({ calendar: 'gregorian' });
    await wrapper.get('.ndp-input__toggle').trigger('click');
    const day = wrapper.get('.ndp-day:not(.ndp-day--outside):enabled');
    await day.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
    expect(wrapper.emitted('dateSelected')).toHaveLength(1);
    expect(wrapper.find('.ndp-input__popover').exists()).toBe(false);
  });

  it('does not echo an external value from an open popover and closes when disabled', async () => {
    const wrapper = mountInput({ calendar: 'gregorian' });
    await wrapper.get('.ndp-input__toggle').trigger('click');
    await wrapper.setProps({ modelValue: { start: new Date(2026, 2, 20), end: null } });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.get<HTMLInputElement>('input.ndp-input__field').element.value).toBe('2026/03/20');
    await wrapper.setProps({ disabled: true });
    expect(wrapper.find('.ndp-input__popover').exists()).toBe(false);
  });
});
