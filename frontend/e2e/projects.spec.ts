import { expect, test, type Page } from "@playwright/test";
import { blockSpline, openHome } from "./helpers";

// Scene 3 on desktop: the featured project never shows in the folder row at
// the same time; the row holds the other five, three at a time.

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

/** Settled: one featured card, three row cards, and the featured one not among them. */
const settledApart = async (page: Page) => {
  await expect
    .poll(async () => {
      const s = await state(page);
      return s.row.length === 3 && !!s.featured && !s.row.includes(s.featured);
    })
    .toBe(true);
  return state(page);
};

test.use({ viewport: { width: 1440, height: 900 } });

test("the featured project is never in the folder row", async ({ page }) => {
  await blockSpline(page);
  await openHome(page);
  await page.getByTestId("projects-section").scrollIntoViewIfNeeded();
  // Hold the reel so the featured project only changes when picked.
  await page.getByTestId("project-reel-toggle").click();

  const seen = new Set<string>();
  const first = await settledApart(page);
  first.row.forEach((id) => seen.add(id));

  // ‹ › go round the other five.
  for (let i = 0; i < 5; i++) {
    await page.getByTestId("projects-row-next").click();
    const s = await settledApart(page);
    expect(s.featured).toBe(first.featured);
    s.row.forEach((id) => seen.add(id));
  }
  expect(seen.size).toBe(5);
  expect(seen.has(first.featured!)).toBe(false);

  // Picking a folder sends it up; it leaves the row.
  const picked = (await state(page)).row[1]!;
  await page.getByTestId(`project-folder-${picked}`).click();
  await expect.poll(async () => (await state(page)).featured).toBe(picked);
  const after = await settledApart(page);
  expect(after.row).not.toContain(picked);
});

test("cards link only to Live, never to the code", async ({ page }) => {
  await blockSpline(page);
  await openHome(page);
  const section = page.getByTestId("projects-section");
  await section.scrollIntoViewIfNeeded();
  await page.getByTestId("project-reel-toggle").click();
  await expect(section.locator('[data-testid^="project-code-link-"]')).toHaveCount(0);
  await expect(section.getByRole("link", { name: /: Code/ })).toHaveCount(0);
  // Lynx (in the row at first) has a Live URL.
  await expect(page.getByTestId("project-live-link-lynx")).toHaveAttribute(
    "href",
    "https://lynx-site.vercel.app",
  );
});
