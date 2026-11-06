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
// Phone hero framing at the mock's 390 x 844: zoom, pan right (share of the
// width) and down (% of the frame).
const PHONE_HERO = { scale: 0.94, dx: 0.222, y: -11.2 };
/** The phone mocks' height, which the phone framings are measured at. */
export const PHONE_REF_H = 844;

/**
 * The camera keeps its vertical field of view, so on a phone the robot scales
 * with the viewport height, and a real phone's browser bars leave ~660-750px
 * of the 844. This turns a framing measured at PHONE_REF_H into one that keeps
 * the robot the same size in px and the same distance from the top.
 */
const phoneFixedPx = (scale: number, y: number, height: number) => {
  const k = PHONE_REF_H / height;
  return { scale: scale * k, y: 100 * ((0.5 + y / 100) * k - 0.5) };
};

export const heroFraming = (isMobile: boolean, _reduce: boolean, { width, height }: Viewport) => {
  if (isMobile) {
    // Phones (design/source/mobile/light/scene-1-hero.dc.html): the robot lower
    // and to the right, one arm in frame, the head whole ~50px from the top, at
    // the mock's size on any phone height (María Sol's review: it read small).
    // A camera framing (applyView at css scale 1), the same with reduced motion.
    const f = phoneFixedPx(PHONE_HERO.scale, PHONE_HERO.y, height);
    return {
      startScale: f.scale,
      startY: `${f.y}%`,
      endY: `${f.y}%`,
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

/**
 * Scene 1's scroll steps, in timeline seconds: Ø1.1, Ø1.2, Ø1.3, then SCROLL,
 * then a hold (María Sol's review: a long one once Ø1.3 and SCROLL show).
 */
export const SCENE1 = { video: 0.1, check: 0.25, headline: 0.4, scroll: 0.55, end: 0.95 };

/**
 * Scene 2: the giant head, one fixed shot for the whole scene (it moves with
 * the idle sway and the cursor, not with the scroll). Desktop at 1440 x 900:
 * head ~670px wide (90 % of the handoff's, María Sol's review), centred at
 * ~68.5% of the width so it clears the card, its right edge ~40px short of the
 * section index; eye line at the same height as before, crown cut above the top.
 * TODO(polish): measured on the black robot at 1440 x 900 only.
 * Phones (design/source/mobile/light/scene-2-capabilities.dc.html): a big head
 * under the title, framed by the camera like desktop (applyView at css scale 1).
 */
export const giantHeadFraming = (isMobile: boolean, viewport: Viewport): Framing => {
  const vw = vwOf(viewport.width);
  if (!isMobile) return { scale: GIANT.scale, x: vw(GIANT.dx * viewport.height), y: `${GIANT.y}%` };
  // Phones: the face above the card, as in the mock (María Sol's review: it
  // was too close and the card hid the face on a real phone). The card is
  // fixed in px at the bottom, so the head is placed from the card's top: the
  // eye line PHONE_HEAD.eyesAbove px over it, the crown PHONE_HEAD.crownToEyes
  // px above the eyes, smaller when a short screen has less room.
  const h = viewport.height;
  const cardTop = h - PHONE_HEAD.cardBlock;
  const eyes = cardTop - PHONE_HEAD.eyesAbove;
  const crownToEyes = Math.max(60, Math.min(PHONE_HEAD.crownToEyes, eyes - PHONE_HEAD.topMin));
  // Screen y / height = 0.5 - scale * n + y / 100, n measured on the model.
  const scale = crownToEyes / ((HEAD_N.crown - HEAD_N.eyes) * h);
  const y = 100 * (eyes / h - 0.5 + scale * HEAD_N.eyes);
  return { scale, x: vw(PHONE_HEAD.dx * viewport.width), y: `${y}%` };
};
// Phone scene 2, in px (design/source/mobile/light/scene-2-capabilities.dc.html
// at 390 x 844): the card block (card + Ø2.x counter + 6rem to the bottom),
// the eye line above the card, crown to eyes, and the highest the crown goes
// (under the Ø2 pill: the head is in front of the title).
const PHONE_HEAD = { cardBlock: 416, eyesAbove: 115, crownToEyes: 170, topMin: 64, dx: 0.025 };
// The head's crown and eye line in camera units (screen offset from the centre
// per unit of scale, in viewport heights), measured on the phone robot.
const HEAD_N = { crown: 0.4437, eyes: 0.2858 };

/**
 * Phones: the robot starts further back and to the side and approaches the
 * head shot (the mock's 70px right, 90px down, 0.55 scale), as the scroll
 * moves from the crossfade to the first card.
 */
export const phoneApproachFrom = (f: Framing, viewport: Viewport): Framing => ({
  scale: f.scale * 0.55,
  x: vwOf(viewport.width)((parseFloat(f.x) / 100) * viewport.width + 70),
  y: `${parseFloat(f.y) + (90 / viewport.height) * 100}%`,
});
// dx scales with the window height, like the rig's own offset.
const GIANT = { scale: 4.86, dx: 0.342, y: 106.8 };

// Timeline positions, in timeline seconds.

/** Scene 1 -> scene 2 crossfade. */
export const XFADE_AT = SCENE1.end;
export const XFADE_DURATION = 0.16;

/** Scene 2: the title, then one card per step (Ø2.1-Ø2.3), then a hold. */
export const SCENE2 = {
  title: SCENE1.end + 0.12,
  cards: [0.3, 0.7, 1.1].map((t) => SCENE1.end + t),
  end: SCENE1.end + 1.55,
};

/**
 * The pin's scroll length per timeline second, in % of the viewport height:
 * every step keeps the same scroll pace however long the timeline gets.
 */
export const PIN_PER_SECOND = { desktop: 700 / 2.25, phone: 600 / 2.25 };
export const pinLength = (isMobile: boolean): string =>
  `+=${((isMobile ? PIN_PER_SECOND.phone : PIN_PER_SECOND.desktop) * SCENE2.end).toFixed(1)}%`;

/** Phones' scroll stops, as pin progress: the hero, each card, the end. */
export const snapStops = (): number[] => [
  0,
  ...SCENE2.cards.map((c) => (c + 0.04) / SCENE2.end),
  1,
];

/** Which card the timeline is on at time t: -1 before the first. */
export const cardIndexAt = (t: number): number => {
  let idx = -1;
  SCENE2.cards.forEach((at, i) => {
    if (t >= at - 0.001) idx = i;
  });
  return idx;
};

/** Phones' scene 2 head: a slow sway (radians, capped at ±0.35; no cursor there). */
export const headSway = (time: number, mouse: { x: number; y: number }) => ({
  x: Math.max(-0.35, Math.min(0.35, Math.sin(time * 0.37) * 0.05 + mouse.y * 0.16)),
  y: Math.max(-0.35, Math.min(0.35, Math.sin(time * 0.23) * 0.12 + mouse.x * 0.3)),
});

// Desktop scene 2's look-around (María Sol's review, A6): the head rests, turns
// slowly to one side, holds, comes back, then the other side. Keyframes in
// seconds and radians (y turns, x tilts), eased between; LOOK_PERIOD loops it.
const LOOK_KEYS: [t: number, y: number, x: number][] = [
  [0, 0, 0],
  [3, 0, 0],
  [5.5, 0.34, 0.05],
  [8.5, 0.34, 0.05],
  [11, 0, 0],
  [13, 0, 0],
  [15.5, -0.3, -0.04],
  [18.5, -0.3, -0.04],
  [21, 0, 0],
];
const LOOK_PERIOD = 21;
const LOOK_CAP = 0.5;

/** The look-around pose at time t (s): eased between LOOK_KEYS, looping. */
export const lookAround = (time: number) => {
  const t = ((time % LOOK_PERIOD) + LOOK_PERIOD) % LOOK_PERIOD;
  const i = Math.max(0, LOOK_KEYS.findIndex((k) => k[0] > t) - 1);
  const [t0, y0, x0] = LOOK_KEYS[i]!;
  const [t1, y1, x1] = LOOK_KEYS[i + 1] ?? LOOK_KEYS[i]!;
  const u = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
  const e = u * u * (3 - 2 * u);
  return { x: x0 + (x1 - x0) * e, y: y0 + (y1 - y0) * e };
};

/**
 * Desktop scene 2's head (radians): the cursor, as scene 1 follows it, while
 * `attention` is 1 (it moved lately); the look-around plus a slow sway when 0.
 * Capped at ±LOOK_CAP.
 */
export const headLook = (time: number, mouse: { x: number; y: number }, attention: number) => {
  const look = lookAround(time);
  const follow = { x: mouse.y < 0 ? mouse.y * 0.3 : mouse.y * 0.42, y: mouse.x * 0.57 };
  const a = Math.max(0, Math.min(1, attention));
  const cap = (v: number) => Math.max(-LOOK_CAP, Math.min(LOOK_CAP, v));
  return {
    x: cap(Math.sin(time * 0.37) * 0.03 + look.x * (1 - a) + follow.x * a),
    y: cap(Math.sin(time * 0.23) * 0.05 + look.y * (1 - a) + follow.y * a),
  };
};

/** How much the head follows the cursor, from ms since it last moved: 1, then fading to 0. */
export const cursorAttention = (idleMs: number) =>
  Math.max(0, Math.min(1, 1 - (idleMs - 2500) / 2000));
