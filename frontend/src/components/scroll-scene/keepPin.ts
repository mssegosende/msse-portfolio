/**
 * Where to put the visitor after a ScrollTrigger refresh, as pin progress, or
 * null to leave the scroll alone.
 *
 * The pin's length is a share of the viewport height, so after a window resize
 * the same scroll px is another beat of the sequence: the refreshes that
 * follow a resize keep the visitor's point instead. Any other refresh (load,
 * the timer after load, fonts, a restore) never moves the scroll. The point is
 * read from the last scroll before the resize (useHeroTimeline), since a
 * window crossing 1024px moves the scroll before the resize event fires.
 */
export const pinPointToKeep = ({
  resized,
  scrollY,
  start,
  end,
}: {
  /** A window resize happened (the caller holds the point while it settles). */
  resized: boolean;
  /** window.scrollY at the last scroll before the resize. */
  scrollY: number;
  /** The pin's start and end at that scroll, px. */
  start: number;
  end: number;
}): number | null => {
  if (!resized || !(end > start)) return null;
  const p = (scrollY - start) / (end - start);
  // Inside the pin only: at its ends the px position is already the right one.
  return p > 0.001 && p < 0.999 ? p : null;
};
