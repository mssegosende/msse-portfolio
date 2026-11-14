import { expect, test } from "@playwright/test";
import { blockSpline } from "./helpers";

// The tab icon follows the browser's mode (María Sol, 13 Nov): navy on a light
// tab, white on a dark one, and it switches when the mode does.
const icon = 'link[rel="icon"][type="image/svg+xml"]';

for (const [scheme, href] of [
  ["dark", "/favicon-dark.svg"],
  ["light", "/favicon-light.svg"],
] as const) {
  test(`a ${scheme} browser gets the ${scheme === "dark" ? "white" : "navy"} icon`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await blockSpline(page);
    await page.goto("/");
    await expect(page.locator(icon)).toHaveAttribute("href", href);
    expect((await page.request.get(href)).status()).toBe(200);
  });
}

test("switches when the browser's mode changes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await blockSpline(page);
  await page.goto("/");
  await expect(page.locator(icon)).toHaveAttribute("href", "/favicon-light.svg");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator(icon)).toHaveAttribute("href", "/favicon-dark.svg");
});
