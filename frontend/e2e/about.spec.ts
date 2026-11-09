import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, openHome } from "./helpers";

// Scene 4 on desktop (María Sol's review): the four paragraphs appear one by
// one in one column and stay; the right column only comes in after the
// fourth, with the text still there: 2022, then each principle on its own
// scroll (9 Nov).

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
      paragraphs: on('[data-testid^="about-paragraph-"]'),
      right: on('[data-testid="about-stat-code"], [data-testid^="manifesto-chapter-"]'),
    };
  });

test.use({ viewport: DESKTOP });

test("paragraphs come one by one and stay, then the right column", async ({ page }) => {
  await blockSpline(page);
  await openHome(page);
  const expected: [number, { paragraphs: number; right: number }][] = [
    [0.05, { paragraphs: 1, right: 0 }],
    [0.15, { paragraphs: 2, right: 0 }],
    [0.25, { paragraphs: 3, right: 0 }],
    [0.35, { paragraphs: 4, right: 0 }],
    [0.47, { paragraphs: 4, right: 1 }],
    [0.57, { paragraphs: 4, right: 2 }],
    [0.67, { paragraphs: 4, right: 3 }],
    [0.77, { paragraphs: 4, right: 4 }],
    [0.88, { paragraphs: 4, right: 4 }],
  ];
  for (const [p, want] of expected) {
    await scrollToAbout(page, p);
    await expect.poll(() => state(page)).toEqual(want);
  }
  // The newest paragraph shows whole inside the text column (once the slide
  // settles), and the column ends above the dock.
  const win = (await page.getByTestId("about-text").boundingBox())!;
  const dock = (await page.getByTestId("navigation-dock").boundingBox())!;
  await expect
    .poll(async () => {
      const last = (await page.getByTestId("about-paragraph-4").boundingBox())!;
      return last.y >= win.y - 1 && last.y + last.height <= win.y + win.height + 1;
    })
    .toBe(true);
  expect(win.y + win.height).toBeLessThanOrEqual(dock.y);
});
