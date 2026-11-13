import { expect, test } from "@playwright/test";
import { blockSpline, openHome, PHONE } from "./helpers";

// The note under LinkedIn ("Add your LinkedIn for a faster reply."). Desktop:
// in the gap below the field, so it adds no height and the contact screen
// keeps the design's size (at 1280x720 an extra line pushed the footer under
// the dock). Phones: a line of its own (the page scrolls; the gap there is
// narrower than the note). Either way it never touches the MESSAGE label.

const clearsTheMessageLabel = async (page: import("@playwright/test").Page) => {
  const note = page.getByTestId("contact-linkedin-note");
  await note.scrollIntoViewIfNeeded();
  await expect(note).toHaveText("Add your LinkedIn for a faster reply.");
  const gap = await page.evaluate(() => {
    const n = document.querySelector('[data-testid="contact-linkedin-note"]')!;
    const label = document.querySelector('[data-testid="contact-message-input"]')!.parentElement!;
    return label.getBoundingClientRect().top - n.getBoundingClientRect().bottom;
  });
  expect(gap).toBeGreaterThanOrEqual(0);
  return note;
};

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
]) {
  test(`desktop ${viewport.width}x${viewport.height}: the LinkedIn note adds no height`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await blockSpline(page);
    await openHome(page);
    const note = await clearsTheMessageLabel(page);
    await expect(note).toHaveCSS("position", "absolute");
  });
}

test.describe("phone", () => {
  test.use(PHONE);

  test("the LinkedIn note is a line of its own, clear of MESSAGE", async ({ page }) => {
    await blockSpline(page);
    await openHome(page);
    const note = await clearsTheMessageLabel(page);
    await expect(note).toHaveCSS("position", "static");
  });
});
