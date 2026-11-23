import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { GregorianCalendarAdapter } from '@vahidamirian/datepicker-core';
import NdpTimeInput from './NdpTimeInput.vue';

describe('NdpTimeInput', () => {
  it('parses time, keeps the value on invalid paste, and closes when disabled', async () => {
    const wrapper = mount(NdpTimeInput, {
      props: { adapters: [new GregorianCalendarAdapter('en-US')] },
    });
    const input = wrapper.get('input');
    await input.setValue('0930');
    const value = wrapper.emitted('update:modelValue')?.[0][0] as Date;
    expect([value.getHours(), value.getMinutes()]).toEqual([9, 30]);
    await input.setValue('unavailable');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
    await wrapper.get('button[aria-label="Open time picker"]').trigger('click');
    expect(wrapper.find('.ndp-input__popover').exists()).toBe(true);
    await wrapper.setProps({ disabled: true });
    expect(wrapper.find('.ndp-input__popover').exists()).toBe(false);
  });
});
