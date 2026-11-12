import { expect, test } from "@playwright/test";
import { blockSpline, DESKTOP, openHome, PHONE, pinProgress, scrollToPin } from "./helpers";

test.describe("desktop", () => {
  test.use({ viewport: DESKTOP });

  test("the footer logo returns to the very top", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    await page.getByTestId("footer").scrollIntoViewIfNeeded();
    await page.getByTestId("footer-brand").click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("the theme toggle switches in place", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    let reloaded = false;
    page.on("framenavigated", () => (reloaded = true));
    await page.getByTestId("theme-toggle").dispatchEvent("click");
    // Pages open in dark (CRT redesign); the toggle goes to light.
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
    expect(reloaded).toBe(false);
  });

  test("no window shape asks to rotate (DevTools docked, huge screens)", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    for (const size of [
      { width: 1440, height: 300 },
      { width: 900, height: 900 },
      { width: 7500, height: 5200 },
    ]) {
      await page.setViewportSize(size);
      await expect(page.getByTestId("rotate-lock")).toBeHidden();
      await expect(page.locator("#hero")).toBeVisible();
    }
  });
});

test.describe("phone", () => {
  test.use(PHONE);

  test("a theme change reloads into the same point of the sequence", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    await scrollToPin(page, 0.6);
    const before = await pinProgress(page);

    await Promise.all([
      page.waitForEvent("load"),
      page.getByTestId("theme-toggle").dispatchEvent("click"),
    ]);
    // Pages open in dark (CRT redesign); the toggle goes to light.
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
    await expect.poll(() => pinProgress(page)).toBeCloseTo(before, 1);
    // The sequence was already seen: the dock comes back shown.
    await expect(page.getByTestId("navigation-dock")).toHaveCSS("opacity", "1");
  });

  test("portrait shows the site, landscape asks to rotate", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    await expect(page.getByTestId("rotate-lock")).toBeHidden();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.getByTestId("rotate-lock")).toBeVisible();
  });
});
