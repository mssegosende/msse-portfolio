import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, openHome, PHONE } from "./helpers";

// SCROLL is a first-visit hint (María Sol, 13 Nov): at the start of scene 1,
// gone for good on the first scroll; never back, not at the top, not on a
// reload; never over the menu dock.

const overlapsDock = (page: Page) =>
  page.evaluate(() => {
    const hint = document.querySelector('[data-testid="scroll-hint"]');
    const dock = document.querySelector('[data-testid="navigation-dock"]');
    if (!hint || !dock || getComputedStyle(dock).opacity === "0") return false;
    const a = hint.getBoundingClientRect();
    const b = dock.getBoundingClientRect();
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  });

for (const [name, use] of [
  ["desktop", { viewport: DESKTOP }],
  ["phone", PHONE],
] as const) {
  test.describe(name, () => {
    test.use(use);

    test("shows at the start, goes on the first scroll and never comes back", async ({ page }) => {
      await blockSpline(page);
      await openHome(page);
      const hint = page.getByTestId("scroll-hint");
      await expect(hint).toBeVisible();
      expect(await overlapsDock(page)).toBe(false);

      await page.mouse.wheel(0, 300);
      await expect(hint).toHaveCount(0);
      expect(await page.evaluate(() => localStorage.getItem("msse-scroll-hint"))).toBe("seen");

      // Back at the very top: still gone.
      // (The smooth scroll may still be gliding from the wheel: jump until it rests at 0.)
      await expect
        .poll(async () => {
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(200);
          return page.evaluate(() => window.scrollY);
        })
        .toBe(0);
      await page.waitForTimeout(800);
      await expect(hint).toHaveCount(0);

      // A reload: still gone.
      await page.reload();
      await expect(page.locator("#hero")).toBeAttached();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId("scroll-hint")).toHaveCount(0);
    });
  });
}
