// Scene 2's cards on desktop (María Sol's review): the vertical cards side by
// side in one row, under the title, between its left margin and the giant head.
// The cards keep their size (the mock's 324 x 463 at 85 %, scaled with the
// window as before); where one more card would fit by shrinking a little (at
// most to ROW_SHRINK of that size), they shrink, so wide windows show all
// three. Cards that don't fit wait off the row's left edge (the row slides
// left as each new one comes) or, when the visitor goes back, off its right.
import { CAP_LEFT, capHeadClear } from "./capTitle";

export const CARD_W = 324;
export const CARD_H = 463;
const CARD_SCALE = 0.85;
/** Room kept free above the dock, px. */
const DOCK_CLEAR = 100;
/** Between two cards, card px. */
const ROW_GAP = 16;
/** The ‹ › controls under the row: their gap plus their height, px. */
export const ROW_CONTROLS = 46;
/** Smallest share of the usual size the cards take to fit one more. */
const ROW_SHRINK = 0.9;

export interface RowFit {
  /** The cards' scale (card px to screen px). */
  s: number;
  /** How many cards fit side by side. */
  fit: number;
  /** The row's left edge (the title's) and its width up to the head, px. */
  left: number;
  room: number;
  cardW: number;
  gap: number;
  cardH: number;
  /** The row's top, px: centred between the title and the dock (with the controls when shown). */
  top: number;
}

export const fitRow = (w: number, h: number, titleBottom: number, count: number): RowFit => {
  const room = Math.max(0, capHeadClear(w, h) - CAP_LEFT);
  const avail = h - titleBottom - DOCK_CLEAR;
  const s0 =
    CARD_SCALE * Math.min(1.25, Math.max(0.72, Math.min(h / 900, w / 1440, avail / CARD_H)));
  let fit = 1;
  let s = Math.min(s0, room / CARD_W);
  for (let n = count; n > 1; n--) {
    const sn = Math.min(s0, room / (n * CARD_W + (n - 1) * ROW_GAP));
    if (sn >= ROW_SHRINK * s0) {
      fit = n;
      s = sn;
      break;
    }
  }
  const cardH = CARD_H * s;
  const free = avail - cardH - (fit < count ? ROW_CONTROLS : 0);
  return {
    s,
    fit,
    left: CAP_LEFT,
    room,
    cardW: CARD_W * s,
    gap: ROW_GAP * s,
    cardH,
    top: titleBottom + Math.max(0, free / 2),
  };
};

/** How far the row slides left (px) so card `last` ends inside it. */
export const rowOffset = (row: RowFit, last: number) =>
  Math.max(0, (last + 1) * row.cardW + last * row.gap - row.room);
