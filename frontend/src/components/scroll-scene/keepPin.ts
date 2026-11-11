/**
 * Where to put the visitor after a ScrollTrigger refresh, as pin progress, or
 * null to leave the scroll alone.
 *
 * The pin's length is a share of the viewport height, so after a window resize
 * the same scroll px is another beat of the sequence: the refresh that follows
 * a resize keeps the visitor's point instead. Any other refresh (load, the
 * timer after load, fonts, a restore) never moves the scroll, and the point is
 * read from the live scroll position, not from ScrollTrigger's last update: a
 * scroll the visitor made just before the refresh is the one kept.
 */
export const pinPointToKeep = ({
  resized,
  scrollY,
  start,
  end,
}: {
  /** A window resize happened since the last refresh. */
  resized: boolean;
  /** window.scrollY when the refresh starts (refreshInit, before the revert). */
  scrollY: number;
  /** The pin's start and end before the refresh, px. */
  start: number;
  end: number;
}): number | null => {
  if (!resized || !(end > start)) return null;
  const p = (scrollY - start) / (end - start);
  // Inside the pin only: at its ends the px position is already the right one.
  return p > 0.001 && p < 0.999 ? p : null;
};
