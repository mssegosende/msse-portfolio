import { expect, test } from "@playwright/test";
import { blockSpline, openHome } from "./helpers";

// The note under LinkedIn ("Add your LinkedIn for a faster reply.") sits in
// the gap below the field: it adds no height, so the contact screen keeps the
// design's size (at 1280x720 an extra line pushed the footer under the dock).
for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`the LinkedIn note adds no height, ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await blockSpline(page);
    await openHome(page);
    const note = page.getByTestId("contact-linkedin-note");
    await note.scrollIntoViewIfNeeded();
    await expect(note).toHaveText("Add your LinkedIn for a faster reply.");
    await expect(note).toHaveCSS("position", "absolute");
    const [noteBox, messageBox] = await Promise.all([
      note.boundingBox(),
      page.getByTestId("contact-message-input").locator("xpath=..").boundingBox(),
    ]);
    expect(noteBox!.y + noteBox!.height).toBeLessThanOrEqual(messageBox!.y);
  });
}
