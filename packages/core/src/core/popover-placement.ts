/** Horizontal correction for a popover measured before any viewport offset is applied. */
export function getPopoverViewportOffset(left: number, right: number, viewportWidth: number): number {
  const gutter = 8;
  return Math.max(gutter - left, Math.min(0, viewportWidth - gutter - right));
}
