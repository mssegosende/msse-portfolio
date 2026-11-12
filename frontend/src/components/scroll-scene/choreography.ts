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

/** A line of scene 2's title on phones: its box's right end, top and bottom, px. */
export interface TitleLine {
  right: number;
  top: number;
  bottom: number;
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
// Phone hero framing at the mock's 390 x 844: zoom, pan (share of the width;
// negative is left) and down (% of the frame). Closer than the mock's
// 0.94 / -11.2 (María Sol, 9 Nov: half the screen read grey): the head whole
// ~55px from the top, the body down to the Ø1 counter. On the left (María Sol,
// 10 Nov): the mirror of the mock's place on the right, the head just inside
// the left edge, so the barcode and its data sit with STATUS on the right.
// CRT redesign (HeroM.dc.html): centred under the MSSE wordmark, the head
// whole inside the crosshair (box 92,140 200x240), crown ~150px down.
const PHONE_HERO = { scale: 0.8, dx: 0.012, y: -2.4 };
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

const HERO_ALT_K = 1.07;

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
      altScale: f.scale,
      altY: `${f.y}%`,
      heroDx: PHONE_HERO.dx * width,
    };
  }
  // CRT redesign (Hero.dc.html): pulled back so the head shows whole, the
  // crown ~6% from the top, the shoulders ~80% of the width.
  const HERO_SCALE = 1.3;
  const HERO_CROWN_NATIVE = 0.0456;
  const HERO_CROWN_TARGET = 0.06;
  const yAt = (scale: number) =>
    (HERO_CROWN_TARGET - 0.5 - (HERO_CROWN_NATIVE - 0.5) * scale) * 100;
  const y = yAt(HERO_SCALE);
  return {
    startScale: HERO_SCALE,
    startY: `${y}%`,
    endY: `${y}%`,
    // Light's black robot (the alt mount): its head slightly bigger than the
    // silver one's (HeroLight.dc.html), crown at the same height.
    altScale: HERO_SCALE * HERO_ALT_K,
    altY: `${yAt(HERO_SCALE * HERO_ALT_K)}%`,
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
export const giantHeadFraming = (
  isMobile: boolean,
  viewport: Viewport,
  /** Phones: where the title ends, px from the top (the crown goes just under it). */
  titleBottom = PHONE_HEAD.crownY - PHONE_HEAD.crownGap,
  /** Phones: the title's lines and its last letter, measured (PHONE_TITLE before). */
  title: PhoneTitle = PHONE_TITLE,
): Framing => {
  const vw = vwOf(viewport.width);
  if (!isMobile) {
    // Scene 2 desktop is the 1440 x 900 layout scaled by one factor (A9): on a
    // window narrower than 16:10 the head is framed as in a 16:10 frame as wide
    // as the window, from the top, so it shrinks with the title and the cards
    // instead of keeping the window's height.
    const h = viewport.height;
    const stage = scene2StageHeight(viewport);
    return {
      scale: (GIANT.scale * stage) / h,
      x: vw(GIANT.dx * stage),
      y: `${100 * ((stage / h) * (0.5 + GIANT.y / 100) - 0.5)}%`,
    };
  }
  // Phones: the big head of the mock, as wide as its share of the screen at
  // any height (María Sol, 10 Nov: on a real phone it read small and centred;
  // R53 sized it to the gap between the title and the card, which a 3-line
  // title and a short screen close). The crown sits just under the title; the
  // eyes go lower to make room, down to PHONE_HEAD.eyesMin over the tallest
  // card (the head holds while the cards change; the card hides more of the
  // face than in the mock). Where even that is short, the crown rises in front
  // of the title, never above the Ø2 pill, and only then does the head get
  // smaller.
  const h = viewport.height;
  const cardTop = h - PHONE_HEAD.cardBlock;
  const span = (viewport.width * PHONE_HEAD.width) / HEAD_N.widthToCrownEyes;
  const underTitle = Math.max(PHONE_HEAD.topMin, titleBottom + PHONE_HEAD.crownGap);
  const eyes = Math.min(cardTop - PHONE_HEAD.eyesMin, underTitle + span);
  const crownToEyes = Math.max(60, Math.min(span, eyes - PHONE_HEAD.topMin));
  // Screen y / height = 0.5 - scale * n + y / 100, n measured on the model.
  const scale = crownToEyes / ((HEAD_N.crown - HEAD_N.eyes) * h);
  // On the right, in front of the title (María Sol, 10 Nov): the head hides
  // the title's last letter (the N of ON) and no other, so WHAT THE and CORE
  // read whole. Its left edge stays right of every other line's end and of
  // the last letter's left side (the O) on their lowest inked row, where the
  // dome is widest; the screen's right edge crops the rest of the head. The
  // edge slopes across the letter's height, so the head rises from R81's
  // place, up to under the Ø2 pill, to wherever that slope leaves the least of
  // the N showing (at its top left).
  // Its outline turned left is wider than the head the size is set from.
  const half = (crownToEyes * HEAD_N.outlineToCrownEyes) / 2;
  const last = title.lines[title.lines.length - 1];
  const inked = (line: TitleLine) => {
    const h0 = line.bottom - line.top;
    return { top: line.top + TITLE_INK.top * h0, bottom: line.bottom - TITLE_INK.bottom * h0 };
  };
  const place = (crown: number) => {
    const halfAt = (row: number) => half * headProfile((row - crown) / crownToEyes);
    const centre = Math.max(
      ...title.lines
        .slice(0, -1)
        .map((line) => line.right + PHONE_HEAD.titleClear + halfAt(inked(line).bottom)),
      last ? title.lastLeft + PHONE_HEAD.letterClear + halfAt(inked(last).bottom) : 0,
    );
    // How far the edge stands right of the N's left side at its top: what shows.
    const open = last ? centre - halfAt(inked(last).top) - title.lastLeft : 0;
    return { crown, centre, open };
  };
  let best = place(eyes - crownToEyes);
  for (let crown = best.crown - 2; crown >= PHONE_HEAD.topMin; crown -= 2) {
    const p = place(crown);
    if (p.open < best.open - 0.5) best = p;
  }
  const y = 100 * ((best.crown + crownToEyes) / h - 0.5 + scale * HEAD_N.eyes);
  const native = viewport.width / 2 + HEAD_N.x * crownToEyes * HEAD_N.widthToCrownEyes;
  return { scale, x: vw(best.centre - native), y: `${y}%` };
};

/** Scene 2's title on phones, px in the section: each line's box, and the last letter's left. */
export interface PhoneTitle {
  lines: TitleLine[];
  lastLeft: number;
}
// The title at 390 (WHAT THE / CORE / RUNS ON, settled), until it is measured.
const PHONE_TITLE: PhoneTitle = {
  lines: [
    { right: 274, top: 53, bottom: 103 },
    { right: 164, top: 88, bottom: 138 },
    { right: 259, top: 124, bottom: 174 },
  ],
  lastLeft: 219,
};
// Where the capitals' ink sits in a line's box (shares of its height from the
// top and the bottom), measured on the title's font.
const TITLE_INK = { top: 0.24, bottom: 0.26 };
// Phone scene 2, in px (design/source/mobile/light/scene-2-capabilities.dc.html
// at 390 x 844): the card block of the tallest card (its tags in two rows, as
// Ø2.3 at 390 and every card from 375 down: card + Ø2.x counter + the gap to
// the bottom), the least room between the eye line and that card's top (the
// eye dots' half height and a little), the crown's place
// under the title (crownY at 390 x 844, crownGap below the title's last line),
// the highest the crown goes (under the Ø2 pill: the head is in front of the
// title), the head's width as a share of the screen's (the mock's ~354 of
// 390), and the least room between the head and a title line's end, and the
// O (its ink ends ~4 px before the N's box; the sway moves the head ~4 px).
const PHONE_HEAD = {
  cardBlock: 451,
  eyesMin: 26,
  crownY: 143,
  crownGap: 6,
  topMin: 64,
  width: 0.91,
  titleClear: 6,
  letterClear: 1,
};
// The head's crown and eye line in camera units (screen offset from the centre
// per unit of scale, in viewport heights), measured on the phone robot, its
// width over its crown-to-eyes height (facing front), its outline's width
// turned left (PHONE_HEAD_GAZE), and its centre's offset from the screen's
// centre without a pan, as a share of its width, turned left.
const HEAD_N = {
  crown: 0.4437,
  eyes: 0.2858,
  widthToCrownEyes: 1.46,
  outlineToCrownEyes: 1.6,
  x: 0.008,
};

/**
 * The head's half width at a depth below the crown (0 at the crown, 1 at the
 * eye line), as a share of its widest: a dome fuller than an ellipse,
 * measured on the phone robot.
 */
const headProfile = (depth: number) => {
  const d = 1 - Math.max(0, Math.min(1, depth));
  return Math.pow(1 - Math.pow(d, 2.5), 1 / 2.5);
};

/** The reference layout scene 2 is drawn at on desktop. */
export const SCENE2_REF = { width: 1440, height: 900 };

/**
 * Scene 2 desktop's one scale factor (A9): the 1440 x 900 layout fitted to the
 * window, min of the width and height ratios. The head, the title and the
 * cards all follow it.
 */
export const scene2Scale = ({ width, height }: Viewport) =>
  Math.min(width / SCENE2_REF.width, height / SCENE2_REF.height);

/**
 * The height of that scaled layout, px: the window's on 16:10 and wider (where
 * the camera's vertical field of view already scales the head), less on a
 * narrower window, whose extra height goes below it.
 */
export const scene2StageHeight = (viewport: Viewport) =>
  Math.min(viewport.height, scene2Scale(viewport) * SCENE2_REF.height);

/**
 * Phones: the robot starts further back (the mock's 90px down, 0.55 scale)
 * and on the left, where scene 1 left it, and approaches the head shot on the
 * right as the scroll moves from the crossfade to the first card (María Sol,
 * 10 Nov: it reads as the robot crossing from left to right).
 */
export const phoneApproachFrom = (f: Framing, viewport: Viewport): Framing => ({
  scale: f.scale * 0.55,
  x: vwOf(viewport.width)(PHONE_APPROACH_X * viewport.width),
  y: `${parseFloat(f.y) + (90 / viewport.height) * 100}%`,
});
/** The approach's start: the head over scene 1's (~32 % of the width), as a pan. */
const PHONE_APPROACH_X = -0.18;

/**
 * Phones, scene 2: the head's resting direction (radians), turned to the left,
 * toward the title and the cards; headSway moves around it.
 */
export const PHONE_HEAD_GAZE = { x: 0, y: -0.3 };
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
