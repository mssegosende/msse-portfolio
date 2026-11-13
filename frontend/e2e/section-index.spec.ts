import { expect, test } from "@playwright/test";
import { blockSpline, DESKTOP, openHome } from "./helpers";

// The section rail (01-05, desktop): the lit square is the section on screen.
// At load it lit 03: its first measure ran before the pins were built.

test.use({ viewport: DESKTOP });

const lit = (page: import("@playwright/test").Page) =>
  page.getByTestId("section-index").locator('button[aria-current="true"]');

test("lights 01 at the top and follows the page through 01-05", async ({ page }) => {
  await blockSpline(page);
  await openHome(page);
  const rail = page.getByTestId("section-index");
  await expect(rail).toBeVisible();
  // Once the pins are built, and still with no scroll.
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(lit(page)).toHaveCount(1);
  await expect(lit(page)).toHaveText("01");

  for (const n of ["02", "03", "04", "05", "01"]) {
    await rail
      .getByRole("button")
      .nth(Number(n) - 1)
      .click();
    await expect(lit(page)).toHaveText(n, { timeout: 10_000 });
    // The floating signature never sits over Projects' cards.
    if (n === "03") await expect(page.getByTestId("signature")).toHaveCSS("opacity", "0");
  }
});

test("scrolling back up with the wheel lights the section passed", async ({ page }) => {
  await blockSpline(page);
  await openHome(page);
  const rail = page.getByTestId("section-index");
  await rail.getByRole("button").nth(3).click();
  await expect(lit(page)).toHaveText("04", { timeout: 10_000 });
  // The wheel back up into Projects.
  for (let k = 0; k < 40; k++) {
    await page.mouse.wheel(0, -400);
    if ((await lit(page).textContent()) === "03") break;
    await page.waitForTimeout(100);
  }
  await expect(lit(page)).toHaveText("03");
});
