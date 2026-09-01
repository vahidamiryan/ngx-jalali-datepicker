import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import { JalaliCalendarAdapter, GregorianCalendarAdapter } from '@vahidamirian/datepicker-core';

import NdpDatepicker from './NdpDatepicker.vue';
import NdpIcon from './NdpIcon.vue';
import { NDP_ICONS_KEY } from '../icons';

describe('NdpIcon', () => {
  it('renders the default glyph for a name', () => {
    const w = mount(NdpIcon, { props: { name: 'prev' } });
    expect(w.html()).toContain('M15 18l-6-6 6-6');
  });

  it('uses a provided override and keeps the rest of the set', () => {
    const w = mount(NdpIcon, {
      props: { name: 'prev' },
      global: { provide: { [NDP_ICONS_KEY as symbol]: { prev: '<path d="M0 0h1" />' } } },
    });
    expect(w.html()).toContain('M0 0h1');

    const untouched = mount(NdpIcon, {
      props: { name: 'next' },
      global: { provide: { [NDP_ICONS_KEY as symbol]: { prev: '<path d="M0 0h1" />' } } },
    });
    expect(untouched.html()).toContain('M9 18l6-6-6-6');
  });

  it('marks the range separator directional so it points forward in both cultures', () => {
    const w = mount(NdpDatepicker, {
      props: {
        adapters: [new GregorianCalendarAdapter('en-US')],
        mode: 'range',
        modelValue: { start: new Date(2026, 7, 21), end: new Date(2026, 8, 22) },
      },
    });
    // A plain '<-' glyph never flips; the icon carries the directional class instead.
    expect(w.text()).not.toContain('←');
    expect(w.findAll('.ndp-summary__sep.ndp-icon--directional').length).toBeGreaterThan(0);
  });

  it('marks nav chevrons directional so RTL mirrors them', () => {
    const rtl = mount(NdpDatepicker, { props: { adapters: [new JalaliCalendarAdapter()] } });
    expect(rtl.find('.ndp-root').attributes('dir')).toBe('rtl');
    expect(rtl.findAll('svg.ndp-icon--directional').length).toBeGreaterThan(0);

    const ltr = mount(NdpDatepicker, {
      props: { adapters: [new GregorianCalendarAdapter('en-GB')] },
    });
    expect(ltr.find('.ndp-root').attributes('dir')).toBe('ltr');
  });
});
