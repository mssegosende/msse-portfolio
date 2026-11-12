import { expect, test, type Page } from "@playwright/test";
import { blockSpline, openHome, PHONE, scrollToPin } from "./helpers";

// Scene 2, CRT redesign (design/crt/.../Main.dc.html, Mobile.dc.html): the
// robot has left; an ASCII object sits in crosshair corners with the rail
// 01 MIND · 02 INTERFACE · 03 ENGINE, and one "Dossier" card per step. The
// card has to fit whatever screen it is on, clear of the title, the object
// and the dock (it broke on Safari's shorter viewport and under the phone's
// dock before).

type Box = { top: number; bottom: number; left: number; right: number };

const boxes = (page: Page) =>
  page.evaluate(() => {
    const rect = (el: Element | null): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    const root = document.querySelector('[data-testid="capability-cards"]')!;
    return {
      layout: root.getAttribute("data-layout"),
      active: Number(root.getAttribute("data-active")),
      // The card showing (not the one sinking away).
      card: rect(root.querySelector(".cap-rise article")),
      rail: rect(root.querySelector('[data-testid="capability-rail"]')),
      pressed: [
        ...root.querySelectorAll('[data-testid="capability-rail"] button[aria-pressed="true"]'),
      ].map((b) => b.textContent),
      title: rect(document.querySelector('[data-testid="capabilities-title"] h2')),
      ascii: rect(document.querySelector("[data-scene2-layer] pre")),
      dockTop: document.querySelector("[data-dock-slot]")!.getBoundingClientRect().top,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** Let the card finish rising (cap-rise moves it 40px). */
const settled = (page: Page) =>
  page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) => a.playState !== "running" || a.effect?.getComputedTiming().endTime === Infinity,
      ),
  );

const DESKTOP_SIZES = [
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1440, height: 790 }, // Safari with its toolbars on a 1440x900 screen
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
];

for (const viewport of DESKTOP_SIZES) {
  test.describe(`desktop ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("one dossier per step, clear of the title, the object and the dock", async ({ page }) => {
      await blockSpline(page);
      await openHome(page);

      // Inside each card's step, then the end: the card and the rail follow the scroll.
      for (const [progress, step] of [
        [0.58, 0],
        [0.74, 1],
        [0.99, 2],
      ] as const) {
        await scrollToPin(page, progress);
        await expect.poll(async () => (await boxes(page)).active).toBe(step);
      }
      await settled(page);

      const b = await boxes(page);
      expect(b.layout).toBe("dossier");
      expect(b.pressed).toEqual(["03 ENGINE"]);
      const dock = await page.getByTestId("navigation-dock").boundingBox();
      const card = b.card!;
      expect(card.top).toBeGreaterThanOrEqual(0);
      expect(card.left).toBeGreaterThanOrEqual(0);
      expect(card.right).toBeLessThanOrEqual(b.viewport.width);
      expect(card.bottom).toBeLessThanOrEqual(dock!.y);
      expect(overlaps(card, b.title!)).toBe(false);
      expect(overlaps(card, b.ascii!)).toBe(false);
      expect(overlaps(card, b.rail!)).toBe(false);
    });

    test("the rail scrolls to its card's step", async ({ page }) => {
      await blockSpline(page);
      await openHome(page);
      await scrollToPin(page, 0.58);
      await page.getByRole("button", { name: "02 INTERFACE" }).click();
      await expect.poll(async () => (await boxes(page)).active, { timeout: 8000 }).toBe(1);
    });
  });
}

for (const viewport of [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
]) {
  test.describe(`phone ${viewport.width}x${viewport.height}`, () => {
    test.use({ ...PHONE, viewport });

    test("the card and its rail sit fully above the dock", async ({ page }) => {
      await blockSpline(page);
      await openHome(page);

      // Points inside each card's step, and the end. Phones snap one stop per
      // gesture, so the scroll settles after the snap and the scrub: poll.
      for (const progress of [0.5, 0.7, 0.99]) {
        await scrollToPin(page, progress);
        await expect
          .poll(async () => !!(await boxes(page)).card, {
            message: `a card is showing at ${progress}`,
            timeout: 8000,
          })
          .toBe(true);
        await settled(page);
        const { card, rail, dockTop } = await boxes(page);
        expect(rail!.top).toBeGreaterThanOrEqual(0);
        expect(rail!.bottom).toBeLessThanOrEqual(card!.top);
        expect(card!.bottom).toBeLessThanOrEqual(dockTop);
      }
    });
  });
}
