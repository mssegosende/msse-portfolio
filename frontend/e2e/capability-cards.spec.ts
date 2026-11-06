import { expect, test, type Page } from "@playwright/test";
import { blockSpline, openHome, PHONE, scrollToPin } from "./helpers";

// Scene 2's cards have to fit whatever screen they are on, clear of the title and
// the dock (it broke on Safari's shorter viewport and under the phone's dock before).
// Desktop shows the three together, stacked, only where every card shows its
// whole text without scrolling; shorter windows and phones show one at a time.

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
      // Any shown card whose text box scrolls.
      overflowing: shown.filter((a) => {
        const box = a.querySelector("p")?.parentElement?.parentElement;
        return !!box && box.scrollHeight > box.clientHeight + 1;
      }).length,
      cards: shown.map(rect),
      title: rect(document.querySelector('[data-testid="capabilities-title"] h2')),
      dockTop: document.querySelector("[data-dock-slot]")!.getBoundingClientRect().top,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const DESKTOP_SIZES: { width: number; height: number; layout?: "stack" | "single" }[] = [
  { width: 1280, height: 720, layout: "single" },
  { width: 1440, height: 790 }, // Safari with its toolbars on a 1440x900 screen
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 1920, height: 1200 },
  { width: 2560, height: 1440 },
];

for (const { layout: expected, ...viewport } of DESKTOP_SIZES) {
  test.describe(`desktop ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("the cards sit on screen, apart, clear of the title and the dock", async ({ page }) => {
      await blockSpline(page);
      await openHome(page);
      await scrollToPin(page, 0.99);
      const first = await boxes(page);
      if (expected) expect(first.layout).toBe(expected);
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
      const { cards, title, overflowing, viewport: vp } = await boxes(page);
      console.log(`${viewport.width}x${viewport.height}: ${first.layout}`);
      // Stacked cards show their whole text.
      if (stacked) expect(overflowing).toBe(0);
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
