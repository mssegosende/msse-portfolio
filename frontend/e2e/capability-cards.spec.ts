import { expect, test, type Page } from "@playwright/test";
import { blockSpline, openHome, PHONE, scrollToPin } from "./helpers";

// Scene 2's cards have to fit whatever screen they are on, clear of the title,
// the head and the dock (it broke on Safari's shorter viewport and under the
// phone's dock before). Desktop: the vertical cards in one row under the title,
// one more per step; where the next doesn't fit before the head, the row
// slides left, the earliest card fades off its left edge, and the row works as
// a carousel (‹ ›, arrow keys, drag). Phones show one card at a time.

type Box = { top: number; bottom: number; left: number; right: number };

const boxes = (page: Page) =>
  page.evaluate(() => {
    const rect = (el: Element | null): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    const root = document.querySelector('[data-testid="capability-cards"]')!;
    const slots = [...root.querySelectorAll("[data-place]")];
    return {
      layout: root.getAttribute("data-layout"),
      fit: Number(root.getAttribute("data-fit")),
      // Each card's place in the row: in, left / right (off the row), waiting.
      places: slots.map((s) => s.getAttribute("data-place")),
      inRow: slots
        .filter((s) => s.getAttribute("data-place") === "in")
        .map((s) => rect(s.querySelector("article"))),
      // Phones: the card showing.
      cards: [
        ...document.querySelectorAll('[data-testid="capability-cards"] .cap-rise article'),
      ].map(rect),
      title: rect(document.querySelector('[data-testid="capabilities-title"] h2')),
      dockTop: document.querySelector("[data-dock-slot]")!.getBoundingClientRect().top,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** Let the cards finish rising (cap-rise moves them 40px) and the row finish sliding. */
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) => a.playState !== "running" || a.effect?.getComputedTiming().endTime === Infinity,
      ),
  );

// How many cards fit side by side before the head. A9: the cards never get
// smaller than at 1440x900 (less 10 %), so narrower windows show fewer.
const DESKTOP_SIZES: { width: number; height: number; fit: number }[] = [
  { width: 768, height: 1024, fit: 1 },
  { width: 900, height: 1000, fit: 1 },
  { width: 1024, height: 768, fit: 1 },
  { width: 1280, height: 720, fit: 1 },
  { width: 1440, height: 790, fit: 2 }, // Safari with its toolbars on a 1440x900 screen
  { width: 1440, height: 900, fit: 2 },
  { width: 1920, height: 1080, fit: 2 },
  { width: 1920, height: 1200, fit: 2 },
  { width: 2560, height: 1080, fit: 3 },
  { width: 2560, height: 1440, fit: 3 },
];

for (const { fit, ...viewport } of DESKTOP_SIZES) {
  test.describe(`desktop ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("one card per step, in a row clear of the title, the head and the dock", async ({
      page,
    }) => {
      await blockSpline(page);
      await openHome(page);

      // Inside Ø2.1's and Ø2.2's steps: the cards come in from the left.
      for (const [progress, shown] of [
        [0.58, 1],
        [0.74, 2],
      ] as const) {
        await scrollToPin(page, progress);
        await expect
          .poll(async () => (await boxes(page)).places.filter((p) => p !== "waiting").length)
          .toBe(shown);
      }

      await scrollToPin(page, 0.99);
      const first = await boxes(page);
      expect(first.layout).toBe("row");
      expect(first.fit).toBe(fit);
      await expect
        .poll(async () => (await boxes(page)).places)
        .toEqual(
          // The earliest cards wait off the row's left edge.
          ["in", "in", "in"].map((p, i) => (i < 3 - fit ? "left" : p)),
        );
      await settled(page);

      const { inRow, title, viewport: vp } = await boxes(page);
      const dock = await page.getByTestId("navigation-dock").boundingBox();
      // The head's left edge, less its gap (capTitle.ts: capHeadClear): the
      // head scales with the 1440x900 layout fitted to the window (A9).
      const stage = Math.min(vp.height, (vp.width * 900) / 1440);
      const headClear = vp.width / 2 - 0.08 * stage - 28;
      // No word of the title under the head. capTitleFit sizes the title to fill
      // the room exactly (0.08 px to spare at 768x1024 on Windows); Linux draws
      // the same text at that fractional size ~1.5 px wider (319 vs 317.5 in
      // CI). 2 px of margin, inside the 28 px gap before the head.
      expect(title!.right).toBeLessThanOrEqual(headClear + 2);
      inRow.forEach((card, i) => {
        expect(card!.top).toBeGreaterThanOrEqual(0);
        expect(card!.left).toBeGreaterThanOrEqual(0);
        expect(card!.right).toBeLessThanOrEqual(headClear + 0.5);
        expect(card!.bottom).toBeLessThanOrEqual(dock!.y);
        expect(overlaps(card!, title!)).toBe(false);
        if (i > 0) expect(card!.left).toBeGreaterThanOrEqual(inRow[i - 1]!.right);
      });

      const controls = page.getByTestId("capability-controls");
      if (fit === 3) {
        await expect(controls).toHaveCount(0);
        return;
      }

      // A carousel: ‹ brings the earliest card back, the arrow keys move it too.
      // Where card `last` is the row's right-most: the ones before the row's
      // first are off its left edge, the ones after it off its right.
      const placesAt = (last: number) =>
        [0, 1, 2].map((i) => (i > last ? "right" : i <= last - fit ? "left" : "in"));
      await expect(controls).toBeVisible();
      const back = page.getByRole("button", { name: "Previous capability" });
      const next = page.getByRole("button", { name: "Next capability" });
      await expect(next).toBeDisabled();
      await back.click();
      await expect.poll(async () => (await boxes(page)).places).toEqual(placesAt(1));
      await next.press("ArrowRight");
      await expect.poll(async () => (await boxes(page)).places).toEqual(placesAt(2));

      // Dragging the row to the right brings the earliest card back as well.
      const card = (await boxes(page)).inRow[0]!;
      const y = (card.top + card.bottom) / 2;
      await page.mouse.move(card.left + 40, y);
      await page.mouse.down();
      await page.mouse.move(card.left + 140, y, { steps: 8 });
      await page.mouse.up();
      await expect.poll(async () => (await boxes(page)).places).toEqual(placesAt(1));
    });
  });
}

for (const viewport of [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
]) {
  test.describe(`phone ${viewport.width}x${viewport.height}`, () => {
    test.use({ ...PHONE, viewport });

    test("each card sits fully above the dock", async ({ page }) => {
      await blockSpline(page);
      await openHome(page);

      // Points inside each card's step, and the end. Phones snap one stop per
      // gesture, so the scroll settles after the snap and the scrub: poll.
      for (const progress of [0.5, 0.7, 0.99]) {
        await scrollToPin(page, progress);
        await expect
          .poll(async () => (await boxes(page)).cards.length, {
            message: `a card is showing at ${progress}`,
            timeout: 8000,
          })
          .toBeGreaterThan(0);
        const { cards, dockTop } = await boxes(page);
        for (const card of cards) {
          expect(card!.top).toBeGreaterThanOrEqual(0);
          expect(card!.bottom).toBeLessThanOrEqual(dockTop);
        }
      }
    });
  });
}
