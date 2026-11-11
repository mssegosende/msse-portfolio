import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, PHONE } from "./helpers";

// Content never depends on an animation running. With reduced motion there
// is no pin and no scrub: every scene is stacked in normal flow and shown
// whole, so a full-page capture without scrolling shows every section. With
// normal motion, scrolling through the page brings every scene to its fully
// visible state.

const CONTENT = [
  '[data-testid="hero-status"]',
  '[data-testid="capabilities-title"] h2',
  '[data-testid="capability-cards"]',
  "#projects h2",
  "#about h2",
  '[data-testid="about-paragraph-1"]',
  '[data-testid="about-paragraph-4"]',
  '[data-testid="about-stat-code"]',
  '[data-testid^="manifesto-chapter-"]:last-of-type',
  "#contact h2",
  '[data-testid="contact-terminal"]',
  '[data-testid="footer"]',
];

/** Effective opacity of each element (product up the tree; hidden counts as 0). */
const opacities = (page: Page) =>
  page.evaluate((sels) => {
    const eff = (el: Element | null) => {
      if (!el) return -1;
      let o = 1;
      for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        o *= parseFloat(cs.opacity);
        if (cs.visibility === "hidden") o = 0;
      }
      return o;
    };
    return Object.fromEntries(sels.map((s) => [s, eff(document.querySelector(s))]));
  }, CONTENT);

for (const [name, device] of [
  ["desktop", { viewport: DESKTOP }],
  ["phone", PHONE],
] as const) {
  test.describe(name, () => {
    test.use(device);

    test("reduced motion: no pin, every scene stacked and fully visible", async ({ browser }) => {
      const context = await browser.newContext({ ...device, reducedMotion: "reduce" });
      const page = await context.newPage();
      await blockSpline(page);
      await page.goto("/");
      await expect(page.locator('[data-testid="capabilities-stacked"]')).toBeAttached();
      await page.waitForTimeout(800);
      expect(await page.locator(".pin-spacer").count()).toBe(0);
      for (const [sel, o] of Object.entries(await opacities(page))) {
        expect(o, sel).toBe(1);
      }
      // In page order, one after another.
      const tops = await page.evaluate(() =>
        ["hero", "capabilities", "projects", "about", "contact"].map(
          (id) => document.getElementById(id)!.getBoundingClientRect().top,
        ),
      );
      for (let i = 1; i < tops.length; i++) expect(tops[i]!).toBeGreaterThan(tops[i - 1]!);
      await context.close();
    });

    test("normal motion: scrolling through reaches every scene's visible state", async ({
      page,
    }) => {
      await blockSpline(page);
      await page.goto("/");
      await expect(page.locator(".pin-spacer")).toBeAttached();
      const best: Record<string, number> = {};
      const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const step = Math.round((device.viewport.height ?? 900) * 0.5);
      for (let y = 0; y <= total + step; y += step) {
        await page.evaluate((yy) => window.scrollTo(0, yy), Math.min(y, total));
        await page.waitForTimeout(350);
        for (const [sel, o] of Object.entries(await opacities(page))) {
          best[sel] = Math.max(best[sel] ?? 0, o);
        }
      }
      await page.waitForTimeout(1200);
      for (const [sel, o] of Object.entries(await opacities(page))) {
        best[sel] = Math.max(best[sel] ?? 0, o);
      }
      for (const sel of CONTENT) expect(best[sel], sel).toBe(1);
    });
  });
}
