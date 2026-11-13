import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, openHome, PHONE } from "./helpers";

// Every status indicator, one style (María Sol, 13 Nov): the label white
// (--crt-title), the dot in --crt-phosphor. The old pink (#F472B6) is gone.
const TITLE = "rgb(238, 248, 255)"; // --crt-title, dark
const PHOSPHOR = "rgb(125, 198, 246)"; // --crt-phosphor, dark
const PINK = /244,\s*114,\s*182/;

/** Every element whose computed colour, background or shadow is the old pink. */
const pinkElements = (page: Page) =>
  page.evaluate((src) => {
    const pink = new RegExp(src);
    return [...document.querySelectorAll("*")]
      .filter((el) => {
        const cs = getComputedStyle(el);
        return pink.test(cs.color) || pink.test(cs.backgroundColor) || pink.test(cs.boxShadow);
      })
      .map((el) => el.outerHTML.slice(0, 80));
  }, PINK.source);

const dotsAndLabels = async (page: Page) => {
  for (const dot of await page.locator(".crt-status-dot, .crt-status__dot").all())
    await expect(dot).toHaveCSS("background-color", PHOSPHOR);
  for (const label of await page.locator(".crt-status-label, .crt-status").all())
    await expect(label).toHaveCSS("color", TITLE);
};

test.describe("desktop", () => {
  test.use({ viewport: DESKTOP });

  test("every STATUS dot is phosphor, every label white, nothing pink", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    await expect(page.getByTestId("hero-status-dot")).toHaveCSS("background-color", PHOSPHOR);
    await expect(page.getByTestId("hero-status")).toHaveCSS("color", TITLE);
    await expect(page.getByTestId("channel-status-dot")).toHaveCSS("background-color", PHOSPHOR);
    await expect(page.getByTestId("channel-status")).toHaveCSS("color", TITLE);
    expect(await page.locator(".crt-status-dot, .crt-status__dot").count()).toBeGreaterThanOrEqual(
      3,
    );
    await dotsAndLabels(page);
    expect(await pinkElements(page)).toEqual([]);
  });
});

test.describe("phone", () => {
  test.use(PHONE);

  test("the same on phones, nothing pink", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    await expect(page.getByTestId("hero-status-dot")).toHaveCSS("background-color", PHOSPHOR);
    // Scene 2's dot (hidden until scene 2, so by its label, not its role).
    await expect(page.locator('[aria-label="Status online"]').first()).toHaveCSS(
      "background-color",
      PHOSPHOR,
    );
    await dotsAndLabels(page);
    expect(await pinkElements(page)).toEqual([]);
  });
});
