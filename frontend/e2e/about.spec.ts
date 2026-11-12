import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, openHome } from "./helpers";

// Scene 4 on desktop (CRT redesign, María Sol 12 Nov): the SUBJECT MSSE-01
// dossier comes in first, then the bio types itself in a terminal panel
// beside it (the full text is in the DOM for screen readers); each principle
// comes in on its own stretch of the pinned scroll.

/** Scroll to a share (0..1) of the About section, on the index's scale. */
const scrollToAbout = async (page: Page, progress: number) => {
  await page.evaluate((p) => {
    const el = document.getElementById("about")!;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top - 0.4 * innerHeight + p * el.offsetHeight);
  }, progress);
};

const state = (page: Page) =>
  page.evaluate(() => {
    const on = (sel: string) =>
      [...document.querySelectorAll(sel)].filter((e) => e.getAttribute("data-on") === "true")
        .length;
    return {
      right: on('[data-testid="about-stat-code"], [data-testid^="manifesto-chapter-"]'),
    };
  });

test.use({ viewport: DESKTOP });

test("the dossier first, the bio as text, then each principle", async ({ page }) => {
  await blockSpline(page);
  await openHome(page);
  const expected: [number, number][] = [
    [0.05, 1],
    [0.57, 2],
    [0.67, 3],
    [0.77, 4],
    [0.88, 4],
  ];
  for (const [p, right] of expected) {
    await scrollToAbout(page, p);
    await expect.poll(async () => (await state(page)).right).toBe(right);
  }
  // The bio: its four paragraphs as real text, unchanged.
  const paragraphs = page.locator('[data-testid^="about-paragraph-"]');
  await expect(paragraphs).toHaveCount(4);
  await expect(paragraphs.first()).toContainText("I am María Sol");
  // The typing panel ends above the dock.
  const panel = (await page.getByTestId("about-text").boundingBox())!;
  const dock = (await page.getByTestId("navigation-dock").boundingBox())!;
  expect(panel.y + panel.height).toBeLessThanOrEqual(dock.y);
});
