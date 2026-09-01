/**
 * Icon set — the single source of every glyph the pickers render.
 *
 * Each entry is the *inner* markup of a 24x24 `viewBox` SVG; the components
 * supply the wrapping `<svg>` so stroke, size and colour stay token-driven.
 * Icons are outline-style, 2px stroke, and paint with `currentColor`.
 */
export type NdpIconName =
  | 'prev'
  | 'next'
  | 'caret'
  | 'clear'
  | 'arrow'
  | 'calendar'
  | 'clock';

export type NdpIconSet = Record<NdpIconName, string>;

export const NDP_DEFAULT_ICONS: NdpIconSet = {
  prev: '<path d="M15 18l-6-6 6-6" />',
  next: '<path d="M9 18l6-6-6-6" />',
  caret: '<path d="M6 9l6 6 6-6" />',
  clear: '<path d="M18 6L6 18M6 6l12 12" />',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6" />',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />',
  clock: '<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />',
};

/** Merges caller overrides over the defaults, leaving unnamed icons intact. */
export function resolveIcons(overrides?: Partial<NdpIconSet>): NdpIconSet {
  return overrides ? { ...NDP_DEFAULT_ICONS, ...overrides } : NDP_DEFAULT_ICONS;
}
