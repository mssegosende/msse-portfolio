import { expect, test } from "@playwright/test";
import { blockSpline, DESKTOP, openHome, PHONE, pinProgress, scrollToPin } from "./helpers";

test.describe("desktop", () => {
  test.use({ viewport: DESKTOP });

  test("the footer logo returns to the very top", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    // The page's end: the footer comes in with Contact's crossfade (desktop),
    // so it shows once that has played, not as soon as its box is on screen.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.getByTestId("footer-brand").click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("the theme toggle switches in place", async ({ page }) => {
    test.skip(true, "Dark only on the live site (THEME_TOGGLE off): back on the light-mode branch");
    await blockSpline(page);
    await openHome(page);
    let reloaded = false;
    page.on("framenavigated", () => (reloaded = true));
    await page.getByTestId("theme-toggle").dispatchEvent("click");
    // Pages open in dark (CRT redesign); the toggle goes to light.
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
    expect(reloaded).toBe(false);
  });

  test("dark only: no theme toggle in the menu, a saved light preference is ignored", async ({
    page,
  }) => {
    await blockSpline(page);
    // A saved "light" from a theme reload, as an old session would have left.
    await page.addInitScript(() =>
      sessionStorage.setItem(
        "theme-reload",
        JSON.stringify({ theme: "light", t: Date.now(), journeyDone: true, y: 0 }),
      ),
    );
    await openHome(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByTestId("section-index").getByRole("button").nth(2).click();
    await expect(page.getByTestId("navigation-dock")).toBeVisible();
    await expect(page.getByTestId("theme-toggle")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /light mode|dark mode/i })).toHaveCount(0);
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
    test.skip(true, "Dark only on the live site (THEME_TOGGLE off): back on the light-mode branch");
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
