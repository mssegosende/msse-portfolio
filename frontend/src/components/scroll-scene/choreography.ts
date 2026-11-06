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
export const heroFraming = (isMobile: boolean, reduce: boolean, { height }: Viewport) => {
  if (isMobile) {
    // Phones keep their framing until P5. It also keeps Spline's in-canvas
    // badge out of frame (it shows below ~1.2).
    return {
      startScale: reduce ? 1 : 1.86,
      startY: reduce ? "2%" : "16.5%",
      endY: reduce ? "3%" : "17.9%",
      heroDx: 0,
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
 * Chapter 2 framings, one per whole value of the timeline's `body.t` (0..5).
 * `headBottomPx` is where the "System Features" title ends, which the closing
 * beat frames the head under.
 *
 * Each beat is chosen by L = 0.5 + (0.5 - y) / S, the native canvas fraction at
 * the frame's bottom edge, which must stay above the waist (desktop p .709) on
 * every beat and in between. The scale steps back between beats and comes in
 * again for the close. On phones the robot's size comes from the rig (botRig);
 * the canvas scale only crops.
 */
export const chapterTwoFramings = (
  isMobile: boolean,
  viewport: Viewport,
  headBottomPx: number,
): { steps: Framing[]; story: Framing } => {
  const vw = vwOf(viewport.width);
  const pre: Framing = isMobile
    ? { scale: 1.833, x: "0%", y: "35.0%", rx: 13.3 } // L .582
    : { scale: 3.0, x: vw(0), y: "53%" }; // L .490
  // Story: a tight head shot (the head fills ~70% of the height), stepped left
  // to clear the text.
  const story: Framing = isMobile
    ? { scale: 1.667, x: "0%", y: "27.5%", rx: 14.6 } // L .635
    : { scale: 4.0, x: vw(-350), y: "103%" }; // L .368
  // Card 01 (left): the body sits opposite its card to balance the frame.
  const card01: Framing = isMobile
    ? { scale: 1.5, x: "0%", y: "20.0%", rx: -16.3 } // L .700
    : { scale: 2.75, x: vw(150), y: "49.1%" }; // L .503 — above the elbow
  // Card 02 (right): leans toward its card.
  const card02: Framing = isMobile
    ? { scale: 1.333, x: "0%", y: "12.5%", rx: 18.3 } // L .781
    : { scale: 2.15, x: vw(-200), y: "28.3%" }; // L .601 — past the elbow
  // Card 03: the widest beat, so the waist rule binds here.
  const card03: Framing = isMobile
    ? { scale: 1.167, x: "0%", y: "5.0%", rx: -13.7 } // L .885
    : { scale: 1.835, x: vw(0), y: "17.9%" }; // L .675, above the waist
  // Closing: comes back in. On desktop the whole head sits just under the
  // title, so y depends on the window height. Cards 02 and 03 re-anchor higher
  // on the same body parts (connectorAnchors).
  const CROWN_P = 13.3;
  const crownAtPct = ((headBottomPx + 14) / viewport.height) * 100;
  const endScale = 2.28;
  const closeY = crownAtPct - 50 - (CROWN_P - 50) * endScale;
  // The rig leaves the head left of the camera axis, an offset that scales with
  // the window height. Compensated on the closing beat only, so the anchors
  // stay calibrated everywhere else.
  const closeDx = 0.0158 * viewport.height;
  const end: Framing = isMobile
    ? { scale: 1.333, x: "0%", y: "12.5%", rx: -9.1 } // L .781
    : { scale: endScale, x: vw(closeDx), y: `${closeY}%` };
  return { steps: [pre, story, card01, card02, card03, end], story };
};

// Gaze poses, radians, capped at ±0.35. +y turns the face to the viewer's
// right, +x tips it down. Each one points at where its card actually sits.
export const GAZE = {
  text: { x: 0.26, y: 0.32 }, // story block, right — and down
  card01: { x: -0.18, y: -0.3 }, // card 01: left, upper
  card02: { x: 0.02, y: 0.32 }, // card 02: right, middle
  card03: { x: 0.24, y: -0.26 }, // card 03: left, lower
  front: { x: 0.0, y: 0.0 }, // released at the end
  closeMobile: { x: 0.24, y: -0.28 }, // phone close: chin down, to the left
};

/** A connector's target on the body; `fromX/fromY` are measured off its card. */
export interface Anchor {
  px: number;
  py: number;
  /** Desktop closing beat: where the anchor glides to. */
  close?: { px: number; py: number } | null;
  fromX: number;
  fromY: number;
}

/**
 * Anchors in the robot's own space (% of the untransformed layer), measured off
 * the silhouette at the closing framing. Card 02 anchors to the forearm: the
 * hand falls below the frame at its scale. Fresh objects per call: the timeline
 * writes the measured line origins into them.
 */
export const connectorAnchors = (isMobile: boolean): Anchor[] => {
  // Moves anchors measured with the body 180px right of centre onto the
  // now-centred rig.
  const anchorShift = -9;
  // Closing beat (desktop): the forearm and chest plate fall below the frame, so
  // cards 02 and 03 move up the same body parts and their dots glide there.
  const closeAnchors = isMobile
    ? []
    : [
        null,
        { px: 69.5 + anchorShift, py: 39.4 }, // 02 HANDS -> upper arm
        { px: 58.5 + anchorShift, py: 40.9 }, // 03 TORSO -> upper chest
      ];
  return [
    { px: 58.5 + anchorShift, py: 26.4 }, // 01 HEAD   — visor centre
    { px: 73.3 + anchorShift, py: 56.7 }, // 02 HANDS  — right forearm (see note above)
    { px: 58.5 + anchorShift, py: 54.1 }, // 03 TORSO  — centre of the chest plate
  ].map((a, i) => ({ ...a, close: closeAnchors[i], fromX: 0, fromY: 0 }));
};

// Timeline positions, in timeline seconds.

/** Where layer 2 fades in. */
export const XFADE_AT = 0.5;
export const XFADE_DURATION = 0.12;

/** One beat per card: steps 0.60 apart, each card landing after the body settles. */
export const BEATS = [
  { at: 1.1, cardAt: 1.32, pose: GAZE.card01 },
  { at: 1.7, cardAt: 1.92, pose: GAZE.card02 },
  { at: 2.3, cardAt: 2.52, pose: GAZE.card03 },
];

/** The closing beat: the robot centres and the head turns front. */
export const closeAt = (isMobile: boolean) => (isMobile ? 2.72 : 2.92);
