import { expect, test } from "@playwright/test";
import { blockSpline, DESKTOP, openHome, PHONE } from "./helpers";

// The README tour (María Sol, pre-launch): WATCH THE TOUR / WATCH THE VIDEOS
// open a full-screen gallery kept in the URL (?view=videos&v=05). X, Esc and
// Back close it, and closing lands at the top of the page.

test.describe("desktop", () => {
  test.use({ viewport: DESKTOP });

  test("opens from the tour tile, keeps the pick in the URL, Back closes it", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    await page.getByTestId("hero-intro-open").click();
    const gallery = page.getByRole("dialog", { name: "INDEX // README TOUR" });
    await expect(gallery).toBeVisible();
    await expect(page).toHaveURL(/\?view=videos$/);
    // The page behind does not scroll while it is open.
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");

    await page.getByTestId("gallery-channel-02").click();
    await expect(page).toHaveURL(/\?view=videos&v=02$/);
    await expect(gallery.getByRole("heading", { name: "Tech stack" })).toBeVisible();

    await page.goBack();
    await expect(gallery).toBeHidden();
    await expect(page).not.toHaveURL(/view=videos/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("a link opens it on one video; Esc closes it", async ({ page }) => {
    await blockSpline(page);
    await page.goto("/?view=videos&v=07");
    const gallery = page.getByRole("dialog", { name: "INDEX // README TOUR" });
    await expect(gallery).toBeVisible();
    await expect(gallery.getByRole("heading", { name: "March to June" })).toBeVisible();
    await expect(page.getByTestId("gallery-channel-07")).toHaveAttribute("aria-current", "true");
    await page.keyboard.press("Escape");
    await expect(gallery).toBeHidden();
    await expect(page).not.toHaveURL(/view=videos/);
  });
});

test.describe("phone", () => {
  test.use(PHONE);

  test("WATCH THE VIDEOS opens one video per swipe; X closes it", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    await page.getByTestId("hero-intro-open").click();
    const gallery = page.getByRole("dialog", { name: "INDEX // README TOUR" });
    await expect(gallery).toBeVisible();
    await expect(page.getByTestId("gallery-reel").locator("li")).toHaveCount(10);
    // Posters only on phones: no preview loops.
    await expect(gallery.locator("video")).toHaveCount(0);
    await page.getByTestId("gallery-close").click();
    await expect(gallery).toBeHidden();
  });
});
