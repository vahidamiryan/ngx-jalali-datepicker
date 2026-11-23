import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { JalaliCalendarAdapter, GregorianCalendarAdapter, type DateRange } from '@vahidamirian/datepicker-core';
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

  it('finds years from localized input and leaves the bound selection intact', async () => {
    const adapter = new JalaliCalendarAdapter();
    const start = adapter.createDate(1404, 11, 1);
    const wrapper = mountPicker({ modelValue: { start, end: null }, min: adapter.createDate(1300, 1, 1) });
    await wrapper.get('.ndp-year-trigger').trigger('click');
    const search = wrapper.get<HTMLInputElement>('.ndp-year-search');
    await search.setValue('١٢٩٥');
    expect(wrapper.find('.ndp-year-empty').exists()).toBe(true);
    await search.trigger('keydown', { key: 'Enter' });
    expect(wrapper.find('.ndp-year-search').exists()).toBe(true);
    await search.setValue('١٣٠٥');
    expect(wrapper.findAll('.ndp-year-grid button')).toHaveLength(1);
    await search.trigger('keydown', { key: 'Enter' });
    expect(wrapper.get('.ndp-month').attributes('aria-label'))
      .toBe(adapter.getMonthLabel(adapter.createDate(1305, 11, 1)));
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('dateSelected')).toBeUndefined();
  });

  it('allows keyboard focus in a new month and refuses blocked days and a disabled picker', async () => {
    const wrapper = mountPicker({
      calendar: 'gregorian',
      modelValue: { start: new Date(2026, 5, 14), end: null },
      dateFilter: (date: Date) => date.getDate() !== 15,
    });
    await wrapper.trigger('keydown', { key: 'ArrowRight' });
    await wrapper.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    await wrapper.get('.ndp-nav[aria-label="Next"]').trigger('click');
    expect(wrapper.find('.ndp-day[tabindex="0"]:enabled').exists()).toBe(true);
    await wrapper.setProps({ disabled: true });
    expect(wrapper.get('.ndp-panel').attributes('inert')).toBeDefined();
    await wrapper.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
