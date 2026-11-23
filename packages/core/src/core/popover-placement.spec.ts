import { describe, expect, it } from 'vitest';
import { getPopoverViewportOffset } from './popover-placement';

describe('getPopoverViewportOffset', () => {
  it('keeps the original anchor when the panel already fits', () => {
    expect(getPopoverViewportOffset(32, 232, 320)).toBe(0);
  });

  it('shifts right when an RTL anchor positions the panel outside the left edge', () => {
    expect(getPopoverViewportOffset(-20, 260, 320)).toBe(28);
  });

  it('shifts left when an LTR anchor positions the panel outside the right edge', () => {
    expect(getPopoverViewportOffset(80, 368, 320)).toBe(-56);
  });
});
