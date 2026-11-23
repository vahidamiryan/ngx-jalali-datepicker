import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';
import { getPopoverViewportOffset } from '@vahidamirian/datepicker-core';

export function restoreInputPopoverFocus(host: HTMLElement): void {
  const active = host.ownerDocument.activeElement;
  if (active && host.contains(active) && active.closest('.ndp-input__popover, .ndp-input__backdrop')) {
    host.querySelector<HTMLButtonElement>('.ndp-input__toggle')?.focus({ preventScroll: true });
  }
}

/** Keep an absolutely positioned popover inside the viewport in either writing direction. */
@Directive({ selector: '[ndpFitPopover]' })
export class NdpFitPopover {
  constructor() {
    const panel = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroy = inject(DestroyRef);

    afterNextRender(() => {
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
      destroy.onDestroy(() => {
        observer?.disconnect();
        win.removeEventListener('resize', fit);
      });
    });
  }
}
