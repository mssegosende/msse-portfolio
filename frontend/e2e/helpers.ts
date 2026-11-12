import { expect, type Page } from "@playwright/test";

export const DESKTOP = { width: 1440, height: 900 };
export const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

/**
 * Layout specs don't need the 3D scenes: without them the hero shows its
 * static fallback and the sequence still runs, deterministically and offline.
 */
export const blockSpline = (page: Page) =>
  page.route("https://prod.spline.design/**", (route) => route.abort());

/** The hero's pin (Projects and Contact pin too, for their crossfades). */
export const HERO_PIN = ".pin-spacer:has(> #hero)";

/** Load the page and wait for the pinned sequence to be built. */
export const openHome = async (page: Page) => {
  await page.goto("/");
  await expect(page.locator(HERO_PIN)).toBeAttached();
};

/** Scroll to a point of the pinned sequence (0..1) and let the scrub settle. */
export const scrollToPin = async (page: Page, progress: number) => {
  await page.evaluate(
    ([p, sel]) => {
      const spacer = document.querySelector<HTMLElement>(sel);
      if (!spacer) throw new Error("the hero pin is not built");
      const start = spacer.getBoundingClientRect().top + window.scrollY;
      const end = start + spacer.offsetHeight - window.innerHeight;
      window.scrollTo(0, start + p * (end - start));
    },
    [progress, HERO_PIN] as const,
  );
  // scrub: 1 eases toward the scroll position for about a second.
  await page.waitForTimeout(2500);
};

/** Where the visitor is in the pinned sequence, 0..1. */
export const pinProgress = (page: Page) =>
  page.evaluate((sel) => {
    const spacer = document.querySelector<HTMLElement>(sel);
    if (!spacer) throw new Error("the hero pin is not built");
    const start = spacer.getBoundingClientRect().top + window.scrollY;
    const end = start + spacer.offsetHeight - window.innerHeight;
    return (window.scrollY - start) / (end - start);
  }, HERO_PIN);
