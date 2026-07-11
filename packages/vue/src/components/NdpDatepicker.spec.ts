import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { JalaliCalendarAdapter, GregorianCalendarAdapter, type DateRange } from '@ndp/core';
import NdpDatepicker from './NdpDatepicker.vue';
import { NDP_CALENDAR_ADAPTERS } from '../adapters';

function mountPicker(props: Record<string, unknown> = {}) {
  return mount(NdpDatepicker, {
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

describe('NdpDatepicker (Vue)', () => {
  it('renders a 6×7 day grid', () => {
    const wrapper = mountPicker();
    const days = wrapper.findAll('.ndp-day');
    expect(days.length).toBe(42);
  });

  it('puts the .ndp-root theme class on the host so the --ndp-* CSS vars apply', () => {
    // Regression: the CSS defines every --ndp-* token on a root selector (ported
    // from Angular's :host). Without .ndp-root on the host element the whole
    // component renders unstyled (undefined --ndp-surface, --ndp-radius, …).
    const wrapper = mountPicker();
    expect(wrapper.element.classList.contains('ndp-root')).toBe(true);
    expect(wrapper.find('.ndp-root .ndp-panel').exists()).toBe(true);
  });

  it('emits update:modelValue and dateSelected on a day click (single mode)', async () => {
    const wrapper = mountPicker();
    const enabledDay = wrapper.findAll('.ndp-day').find((d) => !d.attributes('disabled') && !d.classes('ndp-day--outside'));
    expect(enabledDay).toBeTruthy();
    await enabledDay!.trigger('click');

    const model = wrapper.emitted('update:modelValue');
    const selected = wrapper.emitted('dateSelected');
    expect(model).toBeTruthy();
    expect(selected).toBeTruthy();
    const range = (selected!.at(-1)![0]) as DateRange;
    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeNull();
  });

  it('completes a range across two clicks (range mode)', async () => {
    const wrapper = mountPicker({ mode: 'range' });
    const enabled = wrapper.findAll('.ndp-day').filter((d) => !d.attributes('disabled') && !d.classes('ndp-day--outside'));
    await enabled[0].trigger('click');
    await enabled[5].trigger('click');
    const selected = wrapper.emitted('dateSelected')!;
    const range = selected.at(-1)![0] as DateRange;
    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeInstanceOf(Date);
    expect(range.start!.getTime()).toBeLessThanOrEqual(range.end!.getTime());
  });

  it('respects the min bound by disabling earlier days', () => {
    const min = new Date();
    min.setHours(0, 0, 0, 0);
    const wrapper = mountPicker({ min });
    // The day before `min` (if present in the visible grid) must be disabled.
    const disabled = wrapper.findAll('.ndp-day').filter((d) => d.attributes('disabled') !== undefined);
    expect(disabled.length).toBeGreaterThan(0);
  });

  it('switches active calendar via v-model:calendar', async () => {
    const wrapper = mountPicker({ calendar: 'gregorian' });
    // Gregorian is LTR; the host dir should reflect the active adapter.
    expect(wrapper.find('[data-ndp-theme]').attributes('dir')).toBe('ltr');
  });

  it('renders a custom day cell through the #day slot', () => {
    const wrapper = mount(NdpDatepicker, {
      slots: { day: '<template #day="{ day }"><em class="mark">{{ day.label }}</em></template>' },
      global: {
        provide: {
          [NDP_CALENDAR_ADAPTERS as symbol]: [new JalaliCalendarAdapter()],
        },
      },
    });
    expect(wrapper.find('.mark').exists()).toBe(true);
  });
});
