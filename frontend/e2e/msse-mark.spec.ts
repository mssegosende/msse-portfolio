import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, openHome } from "./helpers";

// MSSE:// is one style everywhere (María Sol, 13 Nov): the menu dock's and the
// footer's looked wider and heavier (tighter tracking under a blue glow).

const style = (page: Page, testid: string) =>
  page.evaluate((id) => {
    const host = document.querySelector(`[data-testid="${id}"]`)!;
    const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walk.nextNode()) && !/MSSE/.test(n.textContent ?? "")) {
      /* to the text */
    }
    const cs = getComputedStyle((n as Text).parentElement!);
    return {
      family: cs.fontFamily,
      weight: cs.fontWeight,
      synthesis: cs.fontSynthesis,
      // Tracking in em, whatever the size.
      tracking: Math.round((parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize)) * 100) / 100,
      glow: cs.textShadow,
      size: cs.fontSize,
      color: cs.color,
    };
  }, testid);

test.use({ viewport: DESKTOP });

test("MSSE:// renders the same in the dock, the footer, the signature and scene 1", async ({
  page,
}) => {
  await blockSpline(page);
  await openHome(page);
  const hero = await style(page, "hero-brand");
  await page.getByTestId("section-index").getByRole("button").nth(4).click();
  await expect(page.getByTestId("footer-brand")).toBeVisible();
  const marks = {
    hero,
    dock: await style(page, "nav-brand"),
    footer: await style(page, "footer-brand"),
    signature: await style(page, "signature"),
  };
  for (const [where, s] of Object.entries(marks)) {
    expect(s.family, where).toBe("Michroma, sans-serif");
    expect(s.weight, where).toBe("400");
    expect(s.synthesis, where).toBe("none");
    expect(s.tracking, where).toBe(0.18);
  }
  // The menu's is exactly the signature's (María Sol, 13 Nov: the signature is
  // the reference): same size, white, the same dark halo.
  expect(marks.dock).toEqual(marks.signature);
  // No blue glow thickening the letters anywhere.
  for (const where of ["hero", "footer"] as const) expect(marks[where].glow, where).toBe("none");
});
