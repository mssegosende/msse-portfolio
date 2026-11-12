import { expect, test, type Page } from "@playwright/test";
import { blockSpline, openHome } from "./helpers";

// Scene 3 on desktop (CRT redesign, Projects.dc.html): the featured card,
// then the grid of the other five; the featured project is never in the grid.

const state = (page: Page) =>
  page.evaluate(() => {
    const featured = [...document.querySelectorAll('[data-testid="project-featured"]')].at(-1);
    const player = featured?.querySelector('[data-testid^="project-player-"]');
    return {
      featured: player?.getAttribute("data-testid")?.replace("project-player-", "") ?? null,
      row: [
        ...document.querySelectorAll('[data-testid="projects-row"] [data-testid^="project-card-"]'),
      ].map((el) => el.getAttribute("data-testid")!.replace("project-card-", "")),
    };
  });

/** Settled: one featured card, the five others in the grid, and the featured one not among them. */
const settledApart = async (page: Page) => {
  await expect
    .poll(async () => {
      const s = await state(page);
      return s.row.length === 5 && !!s.featured && !s.row.includes(s.featured);
    })
    .toBe(true);
  return state(page);
};

test.use({ viewport: { width: 1440, height: 900 } });

test("the featured project is never in the grid", async ({ page }) => {
  await blockSpline(page);
  await openHome(page);
  await page.getByTestId("projects-section").scrollIntoViewIfNeeded();
  // Hold the reel so the featured project only changes when picked.
  await page.getByTestId("project-reel-toggle").click();

  const first = await settledApart(page);
  expect(new Set([first.featured, ...first.row]).size).toBe(6);

  // Picking a card sends it up; it leaves the grid, and the old one joins it.
  const picked = first.row[1]!;
  await page.getByTestId(`project-folder-${picked}`).click();
  await expect.poll(async () => (await state(page)).featured).toBe(picked);
  const after = await settledApart(page);
  expect(after.row).not.toContain(picked);
  expect(after.row).toContain(first.featured);
});

test("cards link only to Live, never to the code", async ({ page }) => {
  await blockSpline(page);
  await openHome(page);
  const section = page.getByTestId("projects-section");
  await section.scrollIntoViewIfNeeded();
  await page.getByTestId("project-reel-toggle").click();
  await expect(section.locator('[data-testid^="project-code-link-"]')).toHaveCount(0);
  await expect(section.getByRole("link", { name: /: Code/ })).toHaveCount(0);
  // Lynx (in the grid at first) has a Live URL.
  await expect(page.getByTestId("project-live-link-lynx")).toHaveAttribute(
    "href",
    "https://lynx-site-chi.vercel.app",
  );
});
