import {
  getTimeOfDay,
  normalizeStep,
  snapMinutes,
  stepMinutes,
  withTimeOfDay,
  copyTimeOfDay,
  wrapHours,
} from './time.util';

describe('time.util', () => {
  describe('getTimeOfDay / withTimeOfDay', () => {
    it('reads the local hours and minutes', () => {
      const d = new Date(2026, 2, 21, 9, 45, 30, 500);
      expect(getTimeOfDay(d)).toEqual({ hours: 9, minutes: 45 });
    });

    it('sets the time and clears seconds/ms without changing the day', () => {
      const d = new Date(2026, 2, 21, 9, 45, 30, 500);
      const out = withTimeOfDay(d, 14, 5);
      expect(out.getFullYear()).toBe(2026);
      expect(out.getMonth()).toBe(2);
      expect(out.getDate()).toBe(21);
      expect(out.getHours()).toBe(14);
      expect(out.getMinutes()).toBe(5);
      expect(out.getSeconds()).toBe(0);
      expect(out.getMilliseconds()).toBe(0);
    });

    it('does not mutate the input', () => {
      const d = new Date(2026, 2, 21, 9, 45);
      withTimeOfDay(d, 1, 1);
      expect(d.getHours()).toBe(9);
    });

    it('clamps out-of-range hours and minutes', () => {
      const d = new Date(2026, 2, 21);
      expect(withTimeOfDay(d, 99, 99).getHours()).toBe(23);
      expect(withTimeOfDay(d, 99, 99).getMinutes()).toBe(59);
      expect(withTimeOfDay(d, -5, -5).getHours()).toBe(0);
    });
  });

  describe('copyTimeOfDay', () => {
    it('moves the source time onto the target day', () => {
      const target = new Date(2020, 0, 1);
      const source = new Date(2026, 5, 6, 8, 30);
      const out = copyTimeOfDay(target, source);
      expect(out.getDate()).toBe(1);
      expect(out.getHours()).toBe(8);
      expect(out.getMinutes()).toBe(30);
    });
  });

  describe('wrapHours', () => {
    it('wraps 24 → 0 and -1 → 23', () => {
      expect(wrapHours(24)).toBe(0);
      expect(wrapHours(-1)).toBe(23);
      expect(wrapHours(13)).toBe(13);
    });
  });

  describe('normalizeStep', () => {
    it('clamps into 1..30 and floors', () => {
      expect(normalizeStep(0)).toBe(1);
      expect(normalizeStep(5.9)).toBe(5);
      expect(normalizeStep(100)).toBe(30);
      expect(normalizeStep(NaN)).toBe(1);
    });
  });

  describe('snapMinutes', () => {
    it('snaps down to the step grid', () => {
      expect(snapMinutes(37, 15)).toBe(30);
      expect(snapMinutes(14, 15)).toBe(0);
      expect(snapMinutes(45, 15)).toBe(45);
    });

    it('leaves values unchanged for step 1', () => {
      expect(snapMinutes(37, 1)).toBe(37);
    });

    it('wraps out-of-range minutes into 0..59', () => {
      expect(snapMinutes(65, 1)).toBe(5);
    });
  });

  describe('stepMinutes', () => {
    it('advances by the step and wraps at the hour', () => {
      expect(stepMinutes(45, 15, 1)).toBe(0);
      expect(stepMinutes(30, 15, 1)).toBe(45);
    });

    it('steps down and wraps past zero', () => {
      expect(stepMinutes(0, 15, -1)).toBe(45);
      expect(stepMinutes(30, 15, -1)).toBe(15);
    });

    it('snaps an off-grid value before stepping', () => {
      // 37 snaps to 30, then +15 → 45
      expect(stepMinutes(37, 15, 1)).toBe(45);
    });
  });
});
