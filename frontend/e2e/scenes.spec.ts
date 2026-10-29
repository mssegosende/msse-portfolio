import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, openHome, PHONE, scrollToPin } from "./helpers";

// The one spec that loads the real Spline scenes (over the network).

const sceneCanvases = (page: Page) => page.locator('[data-testid="scene-section"] canvas').count();

const trackErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
};

test.describe("desktop", () => {
  test.use({ viewport: DESKTOP });

  test("both hero models and both chapter 2 models load", async ({ page }) => {
    const errors = trackErrors(page);
    await openHome(page);
    await expect(page.getByTestId("hero-loader")).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId("hero-fallback")).toHaveCount(0);
    await expect.poll(() => sceneCanvases(page), { timeout: 30_000 }).toBe(4);
    expect(errors).toEqual([]);
  });
});

test.describe("phone", () => {
  test.use(PHONE);

  // iOS kills the tab above two live scenes.
  test("never mounts more than two scenes", async ({ page }) => {
    const errors = trackErrors(page);
    await openHome(page);
    await expect(page.getByTestId("hero-loader")).toBeHidden({ timeout: 30_000 });
    await expect.poll(() => sceneCanvases(page), { timeout: 30_000 }).toBe(2);
    await scrollToPin(page, 0.7);
    expect(await sceneCanvases(page)).toBe(2);
    expect(errors).toEqual([]);
  });
});
