import { expect, test } from "@playwright/test";
import { blockSpline, openHome, PHONE, scrollToPin } from "./helpers";

// Chapter 2's cards have to fit whatever screen they're on: they broke on
// Safari's shorter viewport and under the phone's dock before.

const DESKTOP_SIZES = [
  { width: 1280, height: 720 },
  { width: 1440, height: 790 }, // Safari with its toolbars on a 1440x900 screen
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 768, height: 1024 }, // portrait tablet, desktop layout
];

for (const viewport of DESKTOP_SIZES) {
  test.describe(`desktop ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("the closing beat shows all three cards on screen, each line starting inside its card", async ({
      page,
    }) => {
      await blockSpline(page);
      await openHome(page);
      await scrollToPin(page, 0.99);

      const cards = await page.evaluate(() => {
        const section = document.querySelector('[data-testid="scene-section"]')!;
        const sec = section.getBoundingClientRect();
        return ["01", "02", "03"].map((num) => {
          const card = document.querySelector(`[data-testid="feature-callout-${num}"]`)!;
          const r = card.getBoundingClientRect();
          const line = document.querySelector(`[data-testid="feature-line-${num}"] line`)!;
          return {
            num,
            opacity: Number(getComputedStyle(card).opacity),
            box: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
            lineStart: {
              x: sec.left + (Number(line.getAttribute("x1")) / 100) * sec.width,
              y: sec.top + (Number(line.getAttribute("y1")) / 100) * sec.height,
            },
            viewport: { width: window.innerWidth, height: window.innerHeight },
          };
        });
      });

      for (const { num, opacity, box, lineStart, viewport: vp } of cards) {
        expect(opacity, `card ${num} visible`).toBeGreaterThan(0.95);
        expect(box.top, `card ${num} top`).toBeGreaterThanOrEqual(0);
        expect(box.bottom, `card ${num} bottom`).toBeLessThanOrEqual(vp.height);
        expect(box.left, `card ${num} left`).toBeGreaterThanOrEqual(0);
        expect(box.right, `card ${num} right`).toBeLessThanOrEqual(vp.width);
        expect(lineStart.x, `line ${num} x`).toBeGreaterThan(box.left);
        expect(lineStart.x, `line ${num} x`).toBeLessThan(box.right);
        expect(lineStart.y, `line ${num} y`).toBeGreaterThan(box.top);
        expect(lineStart.y, `line ${num} y`).toBeLessThan(box.bottom);
      }
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

      // Points inside each card's beat.
      for (const progress of [0.5, 0.67, 0.9]) {
        await scrollToPin(page, progress);
        const visible = await page.evaluate(() => {
          const dockTop = document.querySelector("[data-dock-slot]")!.getBoundingClientRect().top;
          return [...document.querySelectorAll<HTMLElement>('[data-testid^="feature-callout-"]')]
            .filter((card) => Number(getComputedStyle(card).opacity) > 0.5)
            .map((card) => {
              const r = card.getBoundingClientRect();
              return { top: r.top, bottom: r.bottom, dockTop };
            });
        });
        expect(visible.length, `a card is showing at ${progress}`).toBeGreaterThan(0);
        for (const card of visible) {
          expect(card.top).toBeGreaterThanOrEqual(0);
          expect(card.bottom).toBeLessThanOrEqual(card.dockTop);
        }
      }
    });
  });
}
