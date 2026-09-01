import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import {
  NdpIconName,
  NdpIconSet,
  resolveIcons,
} from '@vahidamirian/datepicker-core';

/**
 * Overrides for the built-in icon set. Provide a partial record to swap any
 * glyph application-wide:
 *
 * ```ts
 * { provide: NDP_ICONS, useValue: { prev: '<path d="…" />' } }
 * ```
 *
 * Values are trusted as SVG markup, so supply static strings you author —
 * never unsanitised user input.
 */
export const NDP_ICONS = new InjectionToken<Partial<NdpIconSet>>('NDP_ICONS');

@Component({
  selector: 'ndp-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="ndp-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      [innerHTML]="markup()"
    ></svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly icons = resolveIcons(inject(NDP_ICONS, { optional: true }) ?? undefined);

  readonly name = input.required<NdpIconName>();

  protected readonly markup = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.icons[this.name()]),
  );
}
