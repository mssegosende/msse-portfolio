import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, openHome, PHONE, scrollToPin } from "./helpers";

// The one spec that loads the real Spline scenes (over the network).

const sceneCanvases = (page: Page) => page.locator('[data-testid="scene-section"] canvas').count();

const trackErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
};

// @gpu: real Spline rendering; CI (no GPU) skips these, see playwright.config.ts.
test.describe("desktop", { tag: "@gpu" }, () => {
  test.use({ viewport: DESKTOP });

  test("both hero models and both chapter 2 models load", async ({ page }) => {
    const errors = trackErrors(page);
    await openHome(page);
    await expect(page.getByTestId("spline-canvas-wrap")).toHaveAttribute("data-revealed", "true", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("hero-fallback")).toHaveCount(0);
    await expect.poll(() => sceneCanvases(page), { timeout: 30_000 }).toBe(4);
    expect(errors).toEqual([]);
  });
});

test.describe("when 3D is unavailable", () => {
  test.use({ viewport: DESKTOP });

  test("the hero shows the static robot", async ({ page }) => {
    const errors = trackErrors(page);
    const warnings: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "warning") warnings.push(m.text());
    });
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ) {
        if (/webgl|webgpu/.test(type)) return null;
        return getContext.call(this, type as "2d", ...(args as []));
      } as typeof getContext;
    });
    await openHome(page);
    await expect(page.getByTestId("hero-robot-fallback")).toBeVisible();
    expect(errors).toEqual([]);
    expect(warnings.filter((w) => w.includes("GSAP"))).toEqual([]);
  });
});

test.describe("phone", { tag: "@gpu" }, () => {
  test.use(PHONE);

  // iOS kills the tab above two live scenes.
  test("never mounts more than two scenes", async ({ page }) => {
    const errors = trackErrors(page);
    await openHome(page);
    await expect(page.getByTestId("spline-canvas-wrap")).toHaveAttribute("data-revealed", "true", {
      timeout: 30_000,
    });
    await expect.poll(() => sceneCanvases(page), { timeout: 30_000 }).toBe(2);
    await scrollToPin(page, 0.7);
    expect(await sceneCanvases(page)).toBe(2);
    expect(errors).toEqual([]);
  });
});
