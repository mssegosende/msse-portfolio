import { expect, test, type Page } from "@playwright/test";
import { blockSpline, openHome, PHONE, scrollToPin } from "./helpers";

// Scene 2's cards have to fit whatever screen they are on, clear of the title and
// the dock (it broke on Safari's shorter viewport and under the phone's dock before).
// Desktop shows the three together, stacked, from 900px of window height and
// only where every card shows at least 4 lines of its text (the rest scrolls
// inside the card); shorter windows and phones show one at a time.

type Box = { top: number; bottom: number; left: number; right: number };

const boxes = (page: Page) =>
  page.evaluate(() => {
    const rect = (el: Element | null): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    const shown = [
      ...document.querySelectorAll('[data-testid="capability-cards"] .cap-rise article'),
    ];
    const root = document.querySelector('[data-testid="capability-cards"]')!;
    return {
      layout: root.getAttribute("data-layout"),
      // The fewest lines of text any shown card has in view (its text box's
      // height, or the whole text when shorter), in unscaled card px.
      minLines: Math.min(
        ...shown.map((a) => {
          const p = a.querySelector("p");
          const box = p?.parentElement?.parentElement;
          if (!p || !box) return 0;
          const line = parseFloat(getComputedStyle(p).lineHeight);
          return Math.min(box.clientHeight, p.offsetHeight) / line;
        }),
      ),
      cards: shown.map(rect),
      title: rect(document.querySelector('[data-testid="capabilities-title"] h2')),
      dockTop: document.querySelector("[data-dock-slot]")!.getBoundingClientRect().top,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const DESKTOP_SIZES: { width: number; height: number; layout: "stack" | "single" }[] = [
  { width: 1280, height: 720, layout: "single" },
  { width: 1440, height: 790, layout: "single" }, // Safari with its toolbars on a 1440x900 screen
  { width: 1440, height: 900, layout: "stack" },
  { width: 1920, height: 1080, layout: "stack" },
  { width: 1920, height: 1200, layout: "stack" },
  { width: 2560, height: 1440, layout: "stack" },
];

for (const { layout: expected, ...viewport } of DESKTOP_SIZES) {
  test.describe(`desktop ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("the cards sit on screen, apart, clear of the title and the dock", async ({ page }) => {
      await blockSpline(page);
      await openHome(page);
      await scrollToPin(page, 0.99);
      const first = await boxes(page);
      expect(first.layout).toBe(expected);
      const stacked = first.layout === "stack";
      await expect.poll(async () => (await boxes(page)).cards.length).toBe(stacked ? 3 : 1);
      // Let the last card finish rising (cap-rise moves it up 40px).
      await page.waitForFunction(() =>
        document
          .getAnimations()
          .every(
            (a) => a.playState !== "running" || a.effect?.getComputedTiming().endTime === Infinity,
          ),
      );
      const { cards, title, minLines, viewport: vp } = await boxes(page);
      // Stacked cards show at least 4 lines of text each (a little slack for
      // sub-pixel rounding).
      if (stacked) expect(minLines).toBeGreaterThan(3.9);
      const dock = await page.getByTestId("navigation-dock").boundingBox();
      cards.forEach((card, i) => {
        expect(card!.top).toBeGreaterThanOrEqual(0);
        expect(card!.left).toBeGreaterThanOrEqual(0);
        expect(card!.right).toBeLessThanOrEqual(vp.width);
        expect(card!.bottom).toBeLessThanOrEqual(vp.height);
        expect(overlaps(card!, title!)).toBe(false);
        expect(card!.bottom).toBeLessThanOrEqual(dock!.y);
        if (i > 0) expect(card!.top).toBeGreaterThanOrEqual(cards[i - 1]!.bottom);
      });
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
