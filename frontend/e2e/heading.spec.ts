import { expect, test } from "@playwright/test";
import { blockSpline, DESKTOP, openHome, PHONE, scrollToPin } from "./helpers";

// The page has one h1, in the accessibility tree from load and all the way
// down (axe page-has-heading-one): the visible headline fades in at Ø1.3 and
// out at the crossfade, so it can't be the h1 itself.

for (const [name, options] of [
  ["desktop", { viewport: DESKTOP }],
  ["phone", PHONE],
] as const) {
  test.describe(name, () => {
    test.use(options);

    test("one h1, exposed from load and after the hero", async ({ page }) => {
      await blockSpline(page);
      await openHome(page);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveAccessibleName("Build the future. One system at a time.");

      await scrollToPin(page, 0.6);
      await expect(h1).toHaveCount(1);
    });
  });
}
