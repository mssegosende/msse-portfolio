import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, HERO_PIN, openHome } from "./helpers";

// Full-page captures and DevTools (María Sol, 13 Nov: two layout problems a
// reviewer will hit).
// 1. A full-page capture stretches the viewport to the page's whole height and
//    takes one shot: the site goes still and stacked (capture mode,
//    lib/capture), every scene in order at the 1440 x 900 frame's size, no
//    loading screen; back to a normal viewport, the pinned site returns
//    without a reload. Print gets the same.
// 2. Docking DevTools at the bottom (1440 x 500) or the side (900 x 900):
//    nothing oversized or cut, and the visitor stays at the same scene.

test.use({ viewport: DESKTOP });

const SCENE_TITLES = [/what the core runs on/i, /^projects$/i, /the human behind/i, /let.s talk/i];

/** Stretch the viewport to the page's measured height, as capture tools do. */
const stretch = async (page: Page) => {
  const cdp = await page.context().newCDPSession(page);
  const { cssContentSize } = await cdp.send("Page.getLayoutMetrics");
  const height = Math.ceil(cssContentSize.height);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: DESKTOP.width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return { cdp, height };
};

const sceneBoxes = (page: Page) =>
  page.evaluate(() =>
    ["hero", "capabilities", "projects", "about", "contact"].map((id) => {
      const el = document.getElementById(id);
      const r = el?.getBoundingClientRect();
      return { id, top: Math.round(r?.top ?? -1), height: Math.round(r?.height ?? 0) };
    }),
  );

test("a full-page capture shows every scene stacked at the frame's size, then the site comes back", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await blockSpline(page);
  await openHome(page);
  const before = await page.evaluate(() => document.documentElement.scrollHeight);

  const { cdp, height } = await stretch(page);
  await expect(page.locator("#hero")).toHaveAttribute("data-stacked", "true");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  // In order, each scene one 900px screen (Projects and About as long as their content).
  const boxes = await sceneBoxes(page);
  expect(boxes.map((b) => b.id)).toEqual(["hero", "capabilities", "projects", "about", "contact"]);
  expect(boxes[0]).toMatchObject({ top: 0, height: 900 });
  expect(boxes[1]).toMatchObject({ top: 900, height: 900 });
  boxes.slice(1).forEach((box, i) => {
    const prev = boxes[i]!;
    expect(box.top).toBeGreaterThanOrEqual(prev.top + prev.height - 1);
  });
  expect(boxes.at(-1)!.top + boxes.at(-1)!.height).toBeLessThan(height);
  for (const name of SCENE_TITLES) await expect(page.getByRole("heading", { name })).toBeVisible();
  // The dock, the rail and the signature stay out of the shot.
  await expect(page.getByTestId("navigation-dock")).toBeHidden();
  await expect(page.getByTestId("section-index")).toBeHidden();
  // The shot itself, DevTools' way.
  const shot = await cdp.send("Page.captureScreenshot", {
    format: "jpeg",
    quality: 50,
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: DESKTOP.width, height, scale: 0.1 },
  });
  expect(shot.data.length).toBeGreaterThan(1000);

  // Back to a normal window: pinned again, the page as long as before.
  await cdp.send("Emulation.clearDeviceMetricsOverride");
  await expect(page.locator(HERO_PIN)).toBeAttached();
  await expect(page.locator("#hero")).toHaveAttribute("data-stacked", "false");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight), { timeout: 10_000 })
    .toBe(before);
  expect(errors).toEqual([]);
});

test.describe("a first visit", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a capture never shows the loading screen or the choice", async ({ page }) => {
    await blockSpline(page);
    await page.goto("/");
    await expect(page.locator("#boot")).toBeVisible();
    await stretch(page);
    await expect(page.locator("#boot")).toBeHidden();
    await expect(page.locator("#hero")).toHaveAttribute("data-hero-in", "true", {
      timeout: 15_000,
    });
  });
});

test("print renders the still, stacked site, one 1440 x 900 page per screen", async ({ page }) => {
  test.setTimeout(90_000);
  await blockSpline(page);
  await openHome(page);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#hero")).toHaveAttribute("data-stacked", "true");
  for (const name of SCENE_TITLES) await expect(page.getByRole("heading", { name })).toBeVisible();
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const pages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? [];
  // Five scenes, Projects and About longer than a screen: at least six pages.
  expect(pages.length).toBeGreaterThanOrEqual(6);
  await page.emulateMedia({ media: "screen" });
  await expect(page.locator(HERO_PIN)).toBeAttached();
});

const hud = (page: Page) =>
  page.evaluate(() => {
    const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
    const tile = box('[data-testid="hero-intro-tile"]');
    const check = box('[data-testid="hero-system-check"]');
    return {
      heroH: Math.round(box("#hero").height),
      tileBottom: Math.round(tile.bottom),
      checkTop: Math.round(check.top),
      checkBottom: Math.round(check.bottom),
      vh: window.innerHeight,
    };
  });

const litScene = (page: Page) =>
  page.getByTestId("section-index").locator('[aria-current="true"]').textContent();

test("DevTools docked at the bottom: scene 1 fits the short window, nothing cut", async ({
  page,
}) => {
  await blockSpline(page);
  await openHome(page);
  await page.setViewportSize({ width: 1440, height: 500 });
  await expect.poll(async () => (await hud(page)).heroH, { timeout: 10_000 }).toBe(500);
  const h = await hud(page);
  expect(h.checkBottom).toBeLessThanOrEqual(h.vh);
  expect(h.tileBottom).toBeLessThan(h.checkTop); // the tour tile and SYSTEM CHECK apart
  await page.setViewportSize(DESKTOP);
  await expect.poll(async () => (await hud(page)).heroH, { timeout: 10_000 }).toBe(900);
});

for (const [side, size] of [
  ["bottom", { width: 1440, height: 500 }],
  ["side", { width: 900, height: 900 }],
] as const) {
  test(`DevTools docked at the ${side} and closed again: the visitor stays in scene 2`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await blockSpline(page);
    await openHome(page);
    await page.getByTestId("section-index").getByRole("button").nth(1).click();
    await expect.poll(() => litScene(page), { timeout: 10_000 }).toBe("02");
    await page.setViewportSize(size);
    await page.waitForTimeout(2000);
    await expect.poll(() => litScene(page), { timeout: 10_000 }).toBe("02");
    await page.setViewportSize(DESKTOP);
    await page.waitForTimeout(2000);
    await expect.poll(() => litScene(page), { timeout: 10_000 }).toBe("02");
  });
}
