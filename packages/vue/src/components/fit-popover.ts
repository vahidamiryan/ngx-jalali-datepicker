import { getPopoverViewportOffset } from '@vahidamirian/datepicker-core';
import type { Directive } from 'vue';

export function restoreInputPopoverFocus(host: HTMLElement): void {
  const active = host.ownerDocument.activeElement;
  if (active && host.contains(active) && active.closest('.ndp-input__popover, .ndp-input__backdrop')) {
    host.querySelector<HTMLButtonElement>('.ndp-input__toggle')?.focus({ preventScroll: true });
  }
}

const cleanup = new WeakMap<HTMLElement, () => void>();

export const vFitPopover: Directive<HTMLElement> = {
  mounted(panel) {
    const win = panel.ownerDocument.defaultView;
    if (!win) return;
    let offset = 0;
    const fit = () => {
      const { left, right } = panel.getBoundingClientRect();
      offset = getPopoverViewportOffset(left - offset, right - offset, panel.ownerDocument.documentElement.clientWidth);
      panel.style.marginLeft = `${offset}px`;
      panel.style.marginRight = `${-offset}px`;
    };
    fit();
    const observer = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(fit) : null;
    observer?.observe(panel);
    win.addEventListener('resize', fit);
    cleanup.set(panel, () => {
      observer?.disconnect();
      win.removeEventListener('resize', fit);
    });
  },
  unmounted(panel) {
    cleanup.get(panel)?.();
    cleanup.delete(panel);
  },
};
