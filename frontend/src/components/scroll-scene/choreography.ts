import type { ViewTransform } from "../../lib/spline/types";

// The hero sequence's choreography: framings, gaze poses, connector anchors
// and beat timing. Pure data and arithmetic; ScrollScene's timeline plays it.

/** A chapter 2 framing; `rx` (phones) shifts the rig instead of the canvas. */
export interface Framing extends ViewTransform {
  rx?: number;
}

export interface Viewport {
  width: number;
  height: number;
}

/**
 * Framings are written as the body's offset from the viewport centre, in px;
 * this turns that into a % of the viewport width for the transform.
 */
export const vwOf =
  (width: number) =>
  (px: number): string =>
    `${(px / width) * 100}%`;

/**
 * Scene 1 framing. Desktop: the robot nearly full width with the crown just cut
 * by the top edge (design/HANDOFF.md, P2). The y is a camera pan; the crown's
 * native position was measured at 1440x900 (HERO_CROWN_NATIVE, a fraction of
 * the frame height, at scale 1), so any scale can put it at HERO_CROWN_TARGET.
 */
// Phone hero framing: zoom, pan right (share of the width) and down (% of the frame).
const PHONE_HERO = { scale: 0.94, dx: 0.222, y: -9.6 };

export const heroFraming = (isMobile: boolean, _reduce: boolean, { width, height }: Viewport) => {
  if (isMobile) {
    // Phones (design/source/mobile/light/scene-1-hero.dc.html): the robot lower
    // and to the right, one arm in frame, the head whole ~40px from the top.
    // A camera framing (applyView at css scale 1), the same with reduced motion.
    return {
      startScale: PHONE_HERO.scale,
      startY: `${PHONE_HERO.y}%`,
      endY: `${PHONE_HERO.y}%`,
      heroDx: PHONE_HERO.dx * width,
    };
  }
  const HERO_SCALE = 1.9;
  const HERO_CROWN_NATIVE = 0.0456;
  const HERO_CROWN_TARGET = -0.008;
  const y = (HERO_CROWN_TARGET - 0.5 - (HERO_CROWN_NATIVE - 0.5) * HERO_SCALE) * 100;
  return {
    startScale: HERO_SCALE,
    startY: `${y}%`,
    endY: `${y}%`,
    // The rig leaves the head left of the camera axis, an offset that scales
    // with the window height and the zoom.
    heroDx: ((0.0148 * HERO_SCALE) / 1.9) * height,
  };
};

/** Scene 1's scroll steps, in timeline seconds: Ø1.1, Ø1.2, Ø1.3, then SCROLL. */
export const SCENE1 = { video: 0.1, check: 0.25, headline: 0.4, scroll: 0.55, end: 0.7 };

/**
 * Scene 2: the giant head, one fixed shot for the whole scene (it moves with
 * the idle sway and the cursor, not with the scroll). Desktop at 1440 x 900:
 * head ~670px wide (90 % of the handoff's, María Sol's review), centred at
 * ~68.5% of the width so it clears the card, its right edge ~40px short of the
 * section index; eye line at the same height as before, crown cut above the top.
 * TODO(polish): measured on the black robot at 1440 x 900 only.
 * Phones keep a tight head shot until P5; their rig shifts by `rx` instead of
 * the canvas moving.
 */
export const giantHeadFraming = (isMobile: boolean, viewport: Viewport): Framing => {
  const vw = vwOf(viewport.width);
  return isMobile
    ? { scale: 1.667, x: "0%", y: "27.5%", rx: 14.6 }
    : { scale: GIANT.scale, x: vw(GIANT.dx * viewport.height), y: `${GIANT.y}%` };
};
// dx scales with the window height, like the rig's own offset.
const GIANT = { scale: 4.86, dx: 0.342, y: 106.8 };

// Timeline positions, in timeline seconds.

/** Scene 1 -> scene 2 crossfade. */
export const XFADE_AT = SCENE1.end;
export const XFADE_DURATION = 0.16;

/** Scene 2: the title, then one card per step (Ø2.1-Ø2.3), then a hold. */
export const SCENE2 = { title: SCENE1.end + 0.12, cards: [1.0, 1.4, 1.8], end: 2.25 };

/** Which card the timeline is on at time t: -1 before the first. */
export const cardIndexAt = (t: number): number => {
  let idx = -1;
  SCENE2.cards.forEach((at, i) => {
    if (t >= at - 0.001) idx = i;
  });
  return idx;
};

/** Scene 2's head: a slow sway plus the cursor (radians, capped at ±0.35). */
export const headSway = (time: number, mouse: { x: number; y: number }) => ({
  x: Math.max(-0.35, Math.min(0.35, Math.sin(time * 0.37) * 0.05 + mouse.y * 0.16)),
  y: Math.max(-0.35, Math.min(0.35, Math.sin(time * 0.23) * 0.12 + mouse.x * 0.3)),
});
