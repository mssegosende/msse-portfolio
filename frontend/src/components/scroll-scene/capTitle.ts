// Scene 2's title on desktop: the giant head sits in front of it, but every
// word must stay readable (María Sol's review). The title keeps one line where
// it ends clear of the head; otherwise it breaks after "WHAT THE CORE", as on
// phones, and only shrinks if that first line still runs into the head.

/** The title's size in the mock, px. */
export const CAP_TITLE_SIZE = 64;
/** Smallest the title gets on a desktop window (1024 wide). */
const MIN_SIZE = 36;
/** Left edge of the title block (left-14). */
const LEFT = 56;
/** One-line title's bottom plus the room to the cards, at CAP_TITLE_SIZE (the mock's 180). */
const ONE_LINE_BOTTOM = 180;
/** Clear space between the last letter and the head, px. */
const GAP = 28;
/**
 * The head's left edge, from the rig's framing (choreography GIANT): the
 * camera keeps its vertical field of view, so the head's size and its offset
 * from the centre both scale with the window height. Its edge sits at
 * w / 2 - HEAD_LEFT * h, the look-around turn included.
 */
const HEAD_LEFT = 0.08;

/** The title's lines measured at CAP_TITLE_SIZE: the whole title, and "WHAT THE CORE". */
export interface CapTitleWidths {
  full: number;
  first: number;
}

/** Science Gothic's widths at 64px, until the page measures its own. */
export const CAP_TITLE_WIDTHS: CapTitleWidths = { full: 1250, first: 776 };

export interface CapTitleFit {
  lines: 1 | 2;
  size: number;
  /** Where the cards may start, px from the top (the title's bottom plus its room). */
  bottom: number;
}

export const capTitleFit = (
  width: number,
  height: number,
  widths: CapTitleWidths = CAP_TITLE_WIDTHS,
): CapTitleFit => {
  const room = width / 2 - HEAD_LEFT * height - GAP - LEFT;
  if (widths.full <= room) {
    return { lines: 1, size: CAP_TITLE_SIZE, bottom: ONE_LINE_BOTTOM };
  }
  const size = Math.max(MIN_SIZE, Math.min(CAP_TITLE_SIZE, (CAP_TITLE_SIZE * room) / widths.first));
  // leading-none: each line is `size` tall.
  return { lines: 2, size, bottom: Math.ceil(ONE_LINE_BOTTOM - CAP_TITLE_SIZE + 2 * size) };
};
