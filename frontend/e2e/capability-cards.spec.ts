import { expect, test, type Page } from "@playwright/test";
import { blockSpline, openHome, PHONE, scrollToPin } from "./helpers";

// Scene 2's card has to fit whatever screen it is on, clear of the title and
// the dock (it broke on Safari's shorter viewport and under the phone's dock before).

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
    return {
      cards: shown.map(rect),
      title: rect(document.querySelector('[data-testid="capabilities-title"] h2')),
      dockTop: document.querySelector("[data-dock-slot]")!.getBoundingClientRect().top,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const DESKTOP_SIZES = [
  { width: 1280, height: 720 },
  { width: 1440, height: 790 }, // Safari with its toolbars on a 1440x900 screen
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

for (const viewport of DESKTOP_SIZES) {
  test.describe(`desktop ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("the last card sits on screen, clear of the title and the dock", async ({ page }) => {
      await blockSpline(page);
      await openHome(page);
      await scrollToPin(page, 0.99);
      const { cards, title, viewport: vp } = await boxes(page);
      expect(cards).toHaveLength(1);
      const card = cards[0]!;
      const dock = await page.getByTestId("navigation-dock").boundingBox();
      expect(card.top).toBeGreaterThanOrEqual(0);
      expect(card.left).toBeGreaterThanOrEqual(0);
      expect(card.right).toBeLessThanOrEqual(vp.width);
      expect(card.bottom).toBeLessThanOrEqual(vp.height);
      expect(overlaps(card, title!)).toBe(false);
      expect(card.bottom).toBeLessThanOrEqual(dock!.y);
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
