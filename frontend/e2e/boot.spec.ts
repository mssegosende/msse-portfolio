import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, PHONE } from "./helpers";

// The loading screen (index.html #boot, María Sol, 13 Nov): a real percentage
// that only goes up; at 100% a first visit chooses how to enter; the choice
// sets the sound and is saved, so the next visit enters by itself.

// A first visit: nothing saved (the config presets a returning visitor).
test.use({ storageState: { cookies: [], origins: [] } });

/** A slow network: the app's code arrives late, so the screen has to show. */
const throttle = (page: Page) =>
  page.route(/\/assets\/index-[^/]+\.js$/, async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route.continue();
  });

/** Every percentage the bar shows until the choice appears, and whether the
 * choice ever showed before 100. */
const percentages = async (page: Page) => {
  const seen: number[] = [];
  let early = false;
  for (let i = 0; i < 200; i++) {
    const s = await page.evaluate(() => ({
      v: document.getElementById("boot-bar")?.getAttribute("aria-valuenow"),
      choice: document.getElementById("boot-choice")?.hidden === false,
    }));
    if (s.v != null && Number(s.v) !== seen.at(-1)) seen.push(Number(s.v));
    if (s.choice && Number(s.v) < 100) early = true;
    if (s.choice) return { seen, early };
    await page.waitForTimeout(50);
  }
  return { seen, early };
};

const sound = (page: Page) =>
  page.evaluate(() => ({
    session: sessionStorage.getItem("msse-sound"),
    saved: localStorage.getItem("msse-entry"),
  }));

/** Scene 1 is there and takes input. */
const sceneOneInteractive = async (page: Page) => {
  await expect(page.locator("#boot")).toHaveCount(0);
  await expect(page.locator("#root")).not.toHaveAttribute("aria-busy", "true");
  expect(await page.locator("#root").evaluate((el) => (el as HTMLElement).inert)).toBe(false);
  await expect(page.getByTestId("hero-brand")).toBeVisible();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
};

test.describe("desktop", () => {
  test.use({ viewport: DESKTOP });

  test("shows on a slow load, only goes up, and offers the choice at 100%", async ({ page }) => {
    await blockSpline(page);
    await throttle(page);
    await page.goto("/", { waitUntil: "commit" });
    const bar = page.getByRole("progressbar", { name: "Loading" });
    await expect(bar).toBeAttached();
    // Past the first ~300 ms it is on screen.
    await expect(page.locator(".boot__face")).toHaveCSS("opacity", "1");

    const { seen, early } = await percentages(page);
    expect(early).toBe(false); // the choice only at 100%
    expect(seen.at(-1)).toBe(100);
    expect(seen).toEqual([...seen].sort((a, b) => a - b)); // never down
    expect(seen[0]).toBeLessThan(100); // it was on screen before it was done
    await expect(page.locator("#boot-label")).toBeHidden();
    await expect(page.getByRole("button", { name: "[ ENTER WITH SOUND ]" })).toBeVisible();
    await expect(page.getByRole("button", { name: "[ ENTER SILENT ]" })).toBeVisible();
    // The page behind waits.
    await expect(page.locator("#root")).toHaveAttribute("aria-busy", "true");
  });

  test("ENTER SILENT: scene 1, sound off, saved; the next visit enters by itself", async ({
    page,
  }) => {
    await blockSpline(page);
    await throttle(page);
    await page.goto("/", { waitUntil: "commit" });
    await page.getByRole("button", { name: "[ ENTER SILENT ]" }).click();
    await sceneOneInteractive(page);
    expect(await sound(page)).toEqual({ session: "off", saved: "silent" });

    // Reload: no prompt, straight in at 100%, still silent.
    await page.reload();
    await expect(page.locator("#boot")).toHaveCount(0, { timeout: 20_000 });
    expect(await page.evaluate(() => document.documentElement.dataset.boot)).toBe("entered");
    expect(await sound(page)).toEqual({ session: "off", saved: "silent" });
  });

  test("ENTER WITH SOUND from the keyboard: sound on, saved; the next visit enters with it", async ({
    page,
  }) => {
    await blockSpline(page);
    await throttle(page);
    await page.goto("/", { waitUntil: "commit" });
    const withSound = page.getByRole("button", { name: "[ ENTER WITH SOUND ]" });
    await expect(withSound).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press("Tab");
    await expect(withSound).toBeFocused();
    await expect(withSound).toHaveCSS("outline-style", "solid"); // a visible focus
    await page.keyboard.press("Enter");
    await sceneOneInteractive(page);
    expect(await sound(page)).toEqual({ session: "on", saved: "sound" });

    await page.reload();
    await expect(page.locator("#boot")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByRole("button", { name: "[ ENTER WITH SOUND ]" })).toHaveCount(0);
    expect(await sound(page)).toEqual({ session: "on", saved: "sound" });
  });
});

test.describe("phone", () => {
  test.use(PHONE);

  test("the choice's tap targets are at least 44px tall", async ({ page }) => {
    await blockSpline(page);
    await throttle(page);
    await page.goto("/", { waitUntil: "commit" });
    for (const name of ["[ ENTER WITH SOUND ]", "[ ENTER SILENT ]"]) {
      const button = page.getByRole("button", { name });
      await expect(button).toBeVisible({ timeout: 20_000 });
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("button", { name: "[ ENTER SILENT ]" }).tap();
    await expect(page.locator("#boot")).toHaveCount(0);
  });
});

test.describe("reduced motion", () => {
  test.use({ viewport: DESKTOP, reducedMotion: "reduce" });

  test("the segments don't animate: just the number", async ({ page }) => {
    await blockSpline(page);
    await throttle(page);
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator(".boot__bar > i").first()).toHaveCSS("transition-duration", "0s");
  });
});
