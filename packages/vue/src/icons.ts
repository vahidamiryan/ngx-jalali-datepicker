import type { InjectionKey } from 'vue';
import type { NdpIconSet } from '@vahidamirian/datepicker-core';

/**
 * Provide a partial set to swap any icon app-wide:
 *
 * ```ts
 * app.provide(NDP_ICONS_KEY, { prev: '<path d="…" />' })
 * ```
 *
 * Values are inserted as raw SVG markup, so treat them like any other template
 * you author — supply static strings, never unsanitised user input.
 */
export const NDP_ICONS_KEY: InjectionKey<Partial<NdpIconSet>> = Symbol('ndp-icons');
