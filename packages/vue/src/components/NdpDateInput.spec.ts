import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { JalaliCalendarAdapter, GregorianCalendarAdapter, type DateRange } from '@ndp/core';
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
});
