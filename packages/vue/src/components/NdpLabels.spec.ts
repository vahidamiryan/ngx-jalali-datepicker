import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import { GregorianCalendarAdapter, JalaliCalendarAdapter } from '@vahidamirian/datepicker-core';

import NdpDatepicker from './NdpDatepicker.vue';
import { NDP_LABELS_KEY } from '../labels';

const gregorian = () => [new GregorianCalendarAdapter('en-US')];
const jalali = () => [new JalaliCalendarAdapter()];

describe('labels', () => {
  it('renders English footer buttons for a Gregorian calendar', () => {
    const w = mount(NdpDatepicker, { props: { adapters: gregorian() } });
    const text = w.text();
    expect(text).toContain('Today');
    expect(text).toContain('Clear');
    expect(text).not.toContain('امروز');
    expect(text).not.toContain('پاک کردن');
  });

  it('keeps Persian for a Jalali calendar (existing behaviour)', () => {
    const w = mount(NdpDatepicker, { props: { adapters: jalali() } });
    expect(w.text()).toContain('امروز');
  });

  it('honours the labels prop over the calendar default', () => {
    const w = mount(NdpDatepicker, {
      props: { adapters: jalali(), labels: { today: 'Jump to today' } },
    });
    expect(w.text()).toContain('Jump to today');
  });

  it('honours an app-wide provide, with the prop still winning', () => {
    const provided = { global: { provide: { [NDP_LABELS_KEY as symbol]: { today: 'Provided' } } } };
    expect(mount(NdpDatepicker, { props: { adapters: jalali() }, ...provided }).text())
      .toContain('Provided');
    expect(mount(NdpDatepicker, {
      props: { adapters: jalali(), labels: { today: 'Prop wins' } }, ...provided,
    }).text()).toContain('Prop wins');
  });

  it('localises aria-labels, not just visible text', () => {
    const w = mount(NdpDatepicker, { props: { adapters: gregorian() } });
    const navs = w.findAll('.ndp-nav').map((b) => b.attributes('aria-label'));
    expect(navs).toContain('Previous');
    expect(navs).toContain('Next');
  });
});
