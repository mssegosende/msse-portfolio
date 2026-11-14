/**
 * Capture mode: a full-page screenshot or a print.
 *
 * Full-page capture tools (Puppeteer-style shots, DevTools in device mode,
 * capture extensions) stretch the viewport to the document's whole height and
 * take one shot. The scroll-driven site then showed scene 1 stretched over the
 * whole capture (its sizes follow the viewport) and black below it, since no
 * scroll ever ran. In capture mode the site renders still and stacked instead
 * (the reduced-motion layout: every scene in its final state, in order), each
 * scene sized from a fixed reference height instead of the stretched viewport.
 *
 * When: a viewport far taller than wide, which no real screen is, or print.
 * - Desktop widths (>= 1024px): taller than 2.5x the width (aspect <= 2/5).
 *   A real desktop window is at most a portrait monitor, ~1:1.8 (0.56).
 * - Any width: taller than 3x the width (aspect <= 1/3). The tallest real
 *   phones and folds' cover screens stay above it (21:9 = 0.43, Galaxy Z
 *   Fold2's 25:9 cover = 0.36).
 * A full-page capture of this site is 5 000 to 18 000px tall: far past both.
 *
 * Kept in sync with the same list in index.css and About.module.css (CSS has
 * no variables in media queries).
 */
export const CAPTURE_QUERY =
  "print, screen and (max-aspect-ratio: 1/3), screen and (min-width: 1024px) and (max-aspect-ratio: 2/5)";

/** One scene's height in capture mode: the design frame's (desktop), a phone's. */
export const CAPTURE_SCENE_H = { desktop: 900, phone: 844 } as const;

export const isCapture = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(CAPTURE_QUERY).matches
    : false;

/**
 * The viewport the layout should size itself from: the window's, or in
 * capture mode the reference scene height (the stretched height would make
 * everything giant).
 */
export const layoutViewport = (): { width: number; height: number } => {
  const width = window.innerWidth;
  if (!isCapture()) return { width, height: window.innerHeight };
  return {
    width,
    height: width >= 1024 ? CAPTURE_SCENE_H.desktop : CAPTURE_SCENE_H.phone,
  };
};
