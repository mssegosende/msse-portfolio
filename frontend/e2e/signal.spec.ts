import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, openHome } from "./helpers";

// SIGNAL in Let's Talk (María Sol, 13 Nov): a star's name typed, its
// constellation drawn star by star, then joined; six in a loop, only while on
// screen; reduced motion: POLARIS, still. Desktop only (phones have no SIGNAL).

test.use({ viewport: DESKTOP });

const toContact = async (page: Page) => {
  await page.getByTestId("section-index").getByRole("button").nth(4).click();
  await expect(page.getByTestId("signal-label")).toBeVisible();
};

const state = (page: Page) =>
  page.evaluate(() => ({
    label: document.querySelector('[data-testid="signal-label"]')!.textContent!.trim(),
    con: document.querySelector('[data-testid="signal-sky"]')!.getAttribute("data-constellation"),
    stars: document.querySelectorAll('[data-testid="signal-sky"] circle').length,
    lines: document.querySelectorAll('[data-testid="signal-sky"] line').length,
  }));

test("types SIGNAL: POLARIS, draws Ursa Minor star by star, then moves on to ALPHECCA", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await blockSpline(page);
  await openHome(page);
  await toContact(page);
  await expect(page.getByTestId("signal-label")).toHaveText("SIGNAL: POLARIS", { timeout: 10_000 });

  const labels = new Set<string>();
  let maxStars = 0;
  let sawLines = false;
  for (let i = 0; i < 400; i++) {
    const s = await state(page);
    labels.add(s.label);
    if (s.con === "UMi") {
      maxStars = Math.max(maxStars, s.stars);
      sawLines ||= s.lines > 0;
    }
    if (s.con === "CrB" && s.label === "SIGNAL: ALPHECCA") break;
    await page.waitForTimeout(80);
  }
  expect(maxStars).toBe(7); // Ursa Minor's seven
  expect(sawLines).toBe(true);
  expect(labels).toContain("SIGNAL:"); // erased back before the next
  expect(labels).toContain("SIGNAL: ALPHECCA");
  for (const l of labels) expect(l).not.toMatch(/ALPHARD/);
});

test("pauses off screen", async ({ page }) => {
  await blockSpline(page);
  await openHome(page);
  await toContact(page);
  await page.waitForTimeout(1500);
  await page.getByTestId("section-index").getByRole("button").nth(0).click();
  await page.waitForTimeout(1500);
  const before = await state(page);
  await page.waitForTimeout(2500);
  expect(await state(page)).toEqual(before);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("POLARIS, whole and still", async ({ page }) => {
    await blockSpline(page);
    // Reduced motion stacks the scenes (no pin): straight to Contact.
    await page.goto("/");
    await page.evaluate(() => document.getElementById("contact")!.scrollIntoView());
    await expect(page.getByTestId("signal-label")).toBeVisible();
    const first = await state(page);
    // Ursa Minor: 7 stars; Stellarium's figure closes the bowl, 7 segments.
    expect(first).toEqual({ label: "SIGNAL: POLARIS", con: "UMi", stars: 7, lines: 7 });
    await page.waitForTimeout(2500);
    expect(await state(page)).toEqual(first);
  });
});
