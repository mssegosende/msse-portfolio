import { expect, test, type Page } from "@playwright/test";
import {
  blockSpline,
  DESKTOP,
  HERO_PIN,
  openHome,
  PHONE,
  pinProgress,
  scrollToPin,
} from "./helpers";

// Content never depends on an animation running. With reduced motion there
// is no pin and no scrub: every scene is stacked in normal flow and shown
// whole, so a full-page capture without scrolling shows every section. With
// normal motion, scrolling through the page brings every scene to its fully
// visible state.

const CONTENT = [
  '[data-testid="hero-status"]',
  '[data-testid="capabilities-title"] h2',
  '[data-testid="capability-cards"]',
  "#projects h2",
  "#about h2",
  '[data-testid="about-paragraph-1"]',
  '[data-testid="about-paragraph-4"]',
  '[data-testid="about-stat-code"]',
  '[data-testid^="manifesto-chapter-"]:last-of-type',
  "#contact h2",
  '[data-testid="contact-terminal"]',
  '[data-testid="footer"]',
];

/** Wait for running CSS transitions and animations to end (endless loops aside). */
const revealsDone = (page: Page) =>
  page
    .waitForFunction(
      () =>
        document
          .getAnimations()
          .every(
            (a) => a.playState !== "running" || a.effect?.getComputedTiming().endTime === Infinity,
          ),
      null,
      { timeout: 3000 },
    )
    .catch(() => {
      /* still moving after 3 s: the opacity check below says what it reached */
    });

/** Effective opacity of each element (product up the tree; hidden counts as 0). */
const opacities = (page: Page) =>
  page.evaluate((sels) => {
    const eff = (el: Element | null) => {
      if (!el) return -1;
      let o = 1;
      for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        o *= parseFloat(cs.opacity);
        if (cs.visibility === "hidden") o = 0;
      }
      return o;
    };
    return Object.fromEntries(sels.map((s) => [s, eff(document.querySelector(s))]));
  }, CONTENT);

for (const [name, device] of [
  ["desktop", { viewport: DESKTOP }],
  ["phone", PHONE],
] as const) {
  test.describe(name, () => {
    test.use(device);

    test("reduced motion: no pin, every scene stacked and fully visible", async ({ browser }) => {
      const context = await browser.newContext({ ...device, reducedMotion: "reduce" });
      const page = await context.newPage();
      await blockSpline(page);
      await page.goto("/");
      await expect(page.locator('[data-testid="capabilities-stacked"]')).toBeAttached();
      // The hero's load fade waits for the robot (here, its static fallback):
      // on a busy machine that took longer than a fixed wait.
      await expect(page.locator('#hero[data-hero-in="true"]')).toBeAttached();
      await page.waitForTimeout(800);
      expect(await page.locator(".pin-spacer").count()).toBe(0);
      for (const [sel, o] of Object.entries(await opacities(page))) {
        expect(o, sel).toBe(1);
      }
      // In page order, one after another.
      const tops = await page.evaluate(() =>
        ["hero", "capabilities", "projects", "about", "contact"].map(
          (id) => document.getElementById(id)!.getBoundingClientRect().top,
        ),
      );
      for (let i = 1; i < tops.length; i++) expect(tops[i]!).toBeGreaterThan(tops[i - 1]!);
      await context.close();
    });

    test("normal motion: scrolling through reaches every scene's visible state", async ({
      page,
    }) => {
      // ~30 scroll steps through a page that now runs more loops (the bio's
      // typing, the ASCII object): alone ~30 s, longer beside other workers.
      test.setTimeout(120_000);
      await blockSpline(page);
      await page.goto("/");
      await expect(page.locator(HERO_PIN)).toBeAttached();
      const best: Record<string, number> = {};
      const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const step = Math.round((device.viewport.height ?? 900) * 0.5);
      for (let y = 0; y <= total + step; y += step) {
        await page.evaluate((yy) => window.scrollTo(0, yy), Math.min(y, total));
        // Let the reveals this position started finish (About's slow ones take
        // 1.2 s): a fixed 350 ms sampled them mid-fade and moved on before the
        // last chapter, fully visible over ~1,200 px of scroll, reached 1.
        await page.waitForTimeout(150);
        await revealsDone(page);
        for (const [sel, o] of Object.entries(await opacities(page))) {
          best[sel] = Math.max(best[sel] ?? 0, o);
        }
      }
      await page.waitForTimeout(1200);
      for (const [sel, o] of Object.entries(await opacities(page))) {
        best[sel] = Math.max(best[sel] ?? 0, o);
      }
      for (const sel of CONTENT) expect(best[sel], sel).toBe(1);
    });
  });
}

// Resizing the window on scene 2 (desktop, the real scenes). A drag used to
// drop the render quality for good, move the pin to another beat (the pin is
// a share of the viewport height) and resize all four scenes on every step.
// After any resize the frame must match the one before it at the same size.

// Scene 2's first card: (SCENE1.end + 0.3 + 0.08) / (SCENE2.end + SCENE2_EXIT)
// (choreography.ts; desktop, where scene 2's exit is in the pin).
const FIRST_CARD = (0.95 + 0.3 + 0.08) / (0.95 + 1.55 + 0.36);
// Steps between those sizes, 16 ms apart, like a window drag. CI renders in
// software (seconds per frame), so it takes fewer.
const DRAG_STEPS = process.env.CI ? 8 : 30;
const DRAG: [number, number][] = [
  [1440, 900],
  [1600, 950],
  [1920, 1080],
  [2560, 1440],
  [1280, 720],
  [1440, 900],
];

/** Count page loads in this tab (a reload adds one). Top frame only. */
const countLoads = (page: Page) =>
  page.addInitScript(() => {
    if (window.top !== window) return;
    try {
      const n = Number(sessionStorage.getItem("e2e-loads") || 0) + 1;
      sessionStorage.setItem("e2e-loads", String(n));
    } catch {
      /* no sessionStorage */
    }
  });
const loads = (page: Page) =>
  page
    .evaluate(() => Number(sessionStorage.getItem("e2e-loads") || 0))
    // Mid-reload there is no page to ask; the polls ask again.
    .catch(() => -1);

/**
 * The hero canvas on screen: the share of sampled pixels it drew (read right
 * after one of its frames, from its own context) and its buffer's proportions.
 */
const heroDrawn = (page: Page) =>
  page.evaluate(async () => {
    const shown = [
      ...document.querySelectorAll<HTMLCanvasElement>('[data-testid="spline-canvas-wrap"] canvas'),
    ].filter((c) => {
      for (let n: Element | null = c; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.visibility === "hidden" || cs.opacity === "0") return false;
      }
      return true;
    });
    if (shown.length !== 1) return { canvases: shown.length, drawn: 0, aspect: 0 };
    const c = shown[0]!;
    // getContext hands back the canvas's existing context; it never makes one.
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    const drawn = await new Promise<number>((done) => {
      const timer = setTimeout(() => done(-1), 5000);
      c.addEventListener(
        "rendered",
        () => {
          clearTimeout(timer);
          if (!gl || gl.isContextLost()) return done(0);
          const w = gl.drawingBufferWidth;
          const h = gl.drawingBufferHeight;
          const row = new Uint8Array(w * 4);
          let lit = 0;
          let total = 0;
          for (let k = 1; k <= 9; k++) {
            gl.readPixels(0, Math.floor((h * k) / 10), w, 1, gl.RGBA, gl.UNSIGNED_BYTE, row);
            for (let x = 0; x < w; x += 4, total++) if (row[x * 4 + 3]! > 8) lit++;
          }
          done(lit / total);
        },
        { once: true },
      );
    });
    return {
      canvases: shown.length,
      drawn,
      aspect: c.width / c.height / (c.clientWidth / c.clientHeight),
    };
  });

// @gpu: real Spline rendering (canvas buffers, framing, drawn pixels); CI skips
// these (no GPU), see playwright.config.ts. The pin check runs in CI below.
// Scene 2 has no Spline scene since the CRT redesign (an ASCII object in its
// place), so its buffer and framing checks went with it; the pin check runs
// in CI below.
test.describe("desktop window across the phone breakpoint, drawn", { tag: "@gpu" }, () => {
  // One at a time: two pages of four software-rendered scenes starve each other.
  test.describe.configure({ mode: "default" });

  for (const theme of ["light", "dark"] as const) {
    // A desktop window crossing the phone breakpoint reloads the page, once per
    // crossing (lib/layoutReload): swapping the scenes in place piled up GPU
    // memory until the driver reset (R87), and their dispose() threw (R88-R89,
    // the page went white). Back on desktop, the hero draws again.
    test(`${theme}: across the phone breakpoint and back, the hero draws again`, async ({
      playwright,
      baseURL,
    }) => {
      test.setTimeout(300_000);
      test.skip(
        theme === "light",
        "Dark only on the live site (THEME_TOGGLE off): back on the light-mode branch",
      );
      const browser = await playwright.chromium.launch({
        executablePath: process.env.PW_CHROMIUM_PATH || undefined,
        args: ["--enable-unsafe-swiftshader", "--enable-gpu", "--ignore-gpu-blocklist"],
      });
      const page = await browser.newPage({ viewport: DESKTOP, deviceScaleFactor: 1, baseURL });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await countLoads(page);
      try {
        await openHome(page);
        await expect(page.getByTestId("spline-canvas-wrap")).toHaveAttribute(
          "data-revealed",
          "true",
          { timeout: 90_000 },
        );
        // Pages open in dark; light is one toggle away.
        if (theme === "light") {
          await page.getByTestId("theme-toggle").dispatchEvent("click");
          await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
        }
        const sceneCanvases = () => page.locator('[data-testid="scene-section"] canvas').count();
        const drag = async (from: number, to: number) => {
          for (let s = 1; s <= DRAG_STEPS; s++) {
            await page.setViewportSize({
              width: Math.round(from + ((to - from) * s) / DRAG_STEPS),
              height: DESKTOP.height,
            });
            await page.waitForTimeout(16);
          }
          await page.waitForTimeout(1000);
        };

        // Scene 1, top of the page: 1440 -> 760 (phone layout) -> 1440.
        await drag(DESKTOP.width, 760);
        await expect.poll(() => loads(page), { timeout: 30_000 }).toBe(2);
        expect(errors).toEqual([]);
        // Phones: the theme's hero alone.
        await expect.poll(sceneCanvases, { timeout: 60_000 }).toBe(1);
        await drag(760, DESKTOP.width);
        await expect.poll(() => loads(page), { timeout: 30_000 }).toBe(3);
        expect(errors).toEqual([]);
        // Desktop: both hero models.
        await expect.poll(sceneCanvases, { timeout: 90_000 }).toBe(2);
        await expect(page.getByTestId("spline-canvas-wrap")).toHaveAttribute(
          "data-revealed",
          "true",
          { timeout: 90_000 },
        );
        await expect(page.getByTestId("hero-fallback")).toHaveCount(0);
        await expect
          .poll(async () => (await heroDrawn(page)).drawn, { timeout: 60_000 })
          .toBeGreaterThan(0.1);
        // Polled: when the reload lands mid-drag, the new page is still being
        // resized, and its buffers follow ~300 ms after the drag settles (the
        // camera keeps the proportions meanwhile). A buffer stuck at the wrong
        // proportions never converges and fails here.
        await expect
          .poll(async () => Math.abs((await heroDrawn(page)).aspect - 1), { timeout: 10_000 })
          .toBeLessThan(0.005);

        expect(errors).toEqual([]);
      } finally {
        await browser.close();
      }
    });
  }
});

// Desktop windows reload across the breakpoint, once per drag and only if the
// drag ends on the other side; the reload keeps the point of the sequence.
// Layout logic only: the scenes are blocked.
test.describe("desktop window across the phone breakpoint", () => {
  test.use({ viewport: { width: 760, height: 900 } });

  // A drag across the breakpoint reloads once and keeps the point of the
  // sequence. Steps in one direction: on a slow runner each step can take
  // longer than the 400 ms settle, and a back-and-forth then rightly reloads at
  // every pause. That timing (one reload per drag, none if it ends where it
  // started) is covered by layoutReload.test.ts with fake timers.
  test("crossing it reloads once, at the same point of the pin", async ({ page }) => {
    await blockSpline(page);
    await countLoads(page);
    await openHome(page);
    expect(await loads(page)).toBe(1);
    // On the phone layout's first card; its snap settles the position.
    await scrollToPin(page, 0.52);
    const before = await pinProgress(page);

    for (let w = 780; w <= 1440; w += 60) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(16);
    }
    await expect.poll(() => loads(page), { timeout: 15_000 }).toBe(2);
    await expect(page.locator(HERO_PIN)).toBeAttached();
    await page.waitForTimeout(2500);
    expect(await loads(page)).toBe(2);
    expect(Math.abs((await pinProgress(page)) - before)).toBeLessThan(0.005);
  });
});

// The same resize drag with the scenes blocked: the pin keeps its point of the
// sequence at every size (R88-R89). Layout and scroll only, so it runs in CI.
test.describe("desktop window resize on scene 2, the pin", () => {
  test.use({ viewport: DESKTOP });

  test("keeps the point of the sequence at every size of a resize drag", async ({ page }) => {
    // 150 resize steps, each re-fitting the fluid scene blocks: ~30 s alone.
    test.setTimeout(120_000);
    await blockSpline(page);
    await openHome(page);
    await scrollToPin(page, FIRST_CARD);
    const before = await pinProgress(page);
    for (let i = 1; i < DRAG.length; i++) {
      const [w0, h0] = DRAG[i - 1]!;
      const [w1, h1] = DRAG[i]!;
      for (let s = 1; s <= DRAG_STEPS; s++) {
        await page.setViewportSize({
          width: Math.round(w0 + ((w1 - w0) * s) / DRAG_STEPS),
          height: Math.round(h0 + ((h1 - h0) * s) / DRAG_STEPS),
        });
        await page.waitForTimeout(16);
      }
      // Polled: the pin's refresh waits for 0.2 s of GSAP time, which a slow
      // runner stretches.
      await expect
        .poll(async () => Math.abs((await pinProgress(page)) - before), {
          message: `${w1}x${h1}`,
          timeout: 30_000,
        })
        .toBeLessThan(0.003);
    }
  });
});
