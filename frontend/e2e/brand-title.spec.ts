import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, openHome, PHONE } from "./helpers";

// The tab says MSSE:// on every view and never changes (it used to scroll like
// a departure board); the brand area (the logo lockup) is static once scene 1
// has faded in.

/** The title, sampled over `ms`: every value it took. */
const titlesOver = async (page: Page, ms: number) => {
  const seen = new Set<string>();
  for (let t = 0; t <= ms; t += 250) {
    seen.add(await page.title());
    await page.waitForTimeout(250);
  }
  return [...seen];
};

test.describe("desktop", () => {
  test.use({ viewport: DESKTOP });

  test("the tab title is MSSE:// on load and stays so while scrolling", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    expect(await titlesOver(page, 1500)).toEqual(["MSSE://"]);
    await page.mouse.wheel(0, 2400);
    expect(await titlesOver(page, 1500)).toEqual(["MSSE://"]);
  });

  for (const view of ["?view=videos", "?view=videos&v=03", "?view=sounds"]) {
    test(`the tab title is MSSE:// on ${view}`, async ({ page }) => {
      await blockSpline(page);
      await page.goto(`/${view}`);
      expect(await titlesOver(page, 1000)).toEqual(["MSSE://"]);
    });
  }

  test("the brand area shows the lockup and runs no animation once scene 1 settles", async ({
    page,
  }) => {
    await blockSpline(page);
    await openHome(page);
    const brand = page.getByTestId("hero-brand");
    await expect(brand).toBeVisible();
    await expect(brand).toHaveAccessibleName("MSSE://");
    await expect(brand.getByTestId("logo-mark")).toBeVisible();
    // The bar's one fade-in (hero-bar-in) is 1.4 s.
    await expect
      .poll(() =>
        brand.evaluate((el) => {
          const own = el.getAnimations({ subtree: true });
          const above: Animation[] = [];
          for (let n = el.parentElement; n; n = n.parentElement) above.push(...n.getAnimations());
          return [...own, ...above].filter((a) => a.playState === "running").length;
        }),
      )
      .toBe(0);
    // And it stays put: the same box a second later.
    const before = await brand.boundingBox();
    await page.waitForTimeout(1000);
    expect(await brand.boundingBox()).toEqual(before);
  });
});

test.describe("phone", () => {
  test.use(PHONE);

  test("the lockup fits beside ONLINE, and the title is MSSE://", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    expect(await page.title()).toBe("MSSE://");
    const brand = await page.getByTestId("hero-brand").boundingBox();
    const status = await page.getByTestId("hero-status").boundingBox();
    expect(brand!.x + brand!.width).toBeLessThan(status!.x);
  });
});
