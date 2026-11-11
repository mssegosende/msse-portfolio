import { expect, test, type Page } from "@playwright/test";
import { blockSpline, DESKTOP, openHome, PHONE, pinProgress, scrollToPin } from "./helpers";

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
      await blockSpline(page);
      await page.goto("/");
      await expect(page.locator(".pin-spacer")).toBeAttached();
      const best: Record<string, number> = {};
      const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const step = Math.round((device.viewport.height ?? 900) * 0.5);
      for (let y = 0; y <= total + step; y += step) {
        await page.evaluate((yy) => window.scrollTo(0, yy), Math.min(y, total));
        await page.waitForTimeout(350);
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

// Scene 2's first card: (SCENE1.end + 0.3 + 0.08) / SCENE2.end (choreography.ts).
const FIRST_CARD = (0.95 + 0.3 + 0.08) / (0.95 + 1.55);
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

/** The layer 2 canvas on screen: its buffer and its CSS box. */
const shownScene2 = (page: Page) =>
  page.evaluate(() => {
    const shown = [
      ...document.querySelectorAll<HTMLCanvasElement>('[data-testid="spline2-canvas-wrap"] canvas'),
    ].filter((c) => getComputedStyle(c).visibility === "visible");
    if (shown.length !== 1) throw new Error(`${shown.length} layer 2 canvases shown`);
    const c = shown[0]!;
    return {
      bufferAspect: c.width / c.height,
      boxAspect: c.clientWidth / c.clientHeight,
      scale: c.width / c.clientWidth,
    };
  });

/**
 * The robot's neck at 1440x900 (left and right edge, px): layer 2 alone over a
 * key colour. The head turns as it looks around; the neck only sways a few px.
 */
const neckEdges = async (page: Page) => {
  const restore = await page.evaluateHandle(() => {
    const sec = document.querySelector<HTMLElement>('[data-testid="scene-section"]')!;
    let l2: Element | null = document.querySelector('[data-testid="spline2-canvas-wrap"]');
    while (l2 && l2.parentElement !== sec) l2 = l2.parentElement;
    const hidden = [...sec.children].filter((ch): ch is HTMLElement => ch !== l2);
    hidden.forEach((ch) => (ch.style.visibility = "hidden"));
    sec.style.background = "#00ff00";
    return () => {
      hidden.forEach((ch) => (ch.style.visibility = ""));
      sec.style.background = "";
    };
  });
  const png = await page.screenshot({ clip: { x: 0, y: 690, width: 1360, height: 20 } });
  await restore.evaluate((undo) => undo());
  return page.evaluate(
    async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.canvas.width = img.width;
      ctx.canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const row = ctx.getImageData(0, 10, img.width, 1).data;
      let left = -1;
      let right = -1;
      for (let x = 400; x < img.width; x++) {
        const key = row[x * 4]! < 90 && row[x * 4 + 1]! > 170 && row[x * 4 + 2]! < 90;
        if (key) continue;
        if (left < 0) left = x;
        right = x;
      }
      return { left, right };
    },
    `data:image/png;base64,${png.toString("base64")}`,
  );
};

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

test.describe("desktop window resize on scene 2", () => {
  // One at a time: two pages of four software-rendered scenes starve each other.
  test.describe.configure({ mode: "default" });

  for (const theme of ["light", "dark"] as const) {
    test(`${theme}: same beat, same framing and same resolution after a resize drag`, async ({
      playwright,
      baseURL,
    }) => {
      test.setTimeout(300_000);
      // Its own browser, on the GPU where there is one (frame times like a
      // visitor's); without one Chromium falls back to software WebGL.
      const browser = await playwright.chromium.launch({
        executablePath: process.env.PW_CHROMIUM_PATH || undefined,
        args: ["--enable-unsafe-swiftshader", "--enable-gpu", "--ignore-gpu-blocklist"],
      });
      const page = await browser.newPage({ viewport: DESKTOP, deviceScaleFactor: 1, baseURL });
      try {
        await openHome(page);
        await expect(page.getByTestId("spline2-canvas-wrap")).toHaveClass(/opacity-100/, {
          timeout: 90_000,
        });
        if (theme === "dark") {
          await page.getByTestId("theme-toggle").dispatchEvent("click");
          await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        }
        await scrollToPin(page, FIRST_CARD);
        const before = { progress: await pinProgress(page), scene: await shownScene2(page) };
        const neckBefore = await neckEdges(page);
        expect(neckBefore.left).toBeGreaterThan(0);

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
          await page.waitForTimeout(1000);
          const label = `${w1}x${h1}`;
          // Polled: with software WebGL the frames are so long that the pin's
          // refresh (0.2 s of GSAP time, lag-smoothed) can take a few seconds.
          // Same point of the sequence.
          await expect
            .poll(async () => Math.abs((await pinProgress(page)) - before.progress), {
              message: label,
              timeout: 30_000,
            })
            .toBeLessThan(0.003);
          // The buffer has the box's proportions.
          await expect
            .poll(
              async () => {
                const s2 = await shownScene2(page);
                return Math.abs(s2.bufferAspect / s2.boxAspect - 1);
              },
              { message: label, timeout: 30_000 },
            )
            .toBeLessThan(0.005);
        }

        // Back at 1440x900: the resolution and the framing it had before.
        const after = await shownScene2(page);
        expect(Math.abs(after.scale / before.scene.scale - 1)).toBeLessThan(0.005);
        const neckAfter = await neckEdges(page);
        expect(Math.abs(neckAfter.left - neckBefore.left)).toBeLessThan(16);
        expect(Math.abs(neckAfter.right - neckBefore.right)).toBeLessThan(16);
      } finally {
        await browser.close();
      }
    });

    // Narrowing a desktop window into the phone layout unmounts the desktop
    // scenes: their dispose() threw (R88-R89) and the whole page went white,
    // for good. Back on desktop, the hero and scene 2 draw again.
    test(`${theme}: across the phone breakpoint and back, the hero draws again`, async ({
      playwright,
      baseURL,
    }) => {
      test.setTimeout(300_000);
      const browser = await playwright.chromium.launch({
        executablePath: process.env.PW_CHROMIUM_PATH || undefined,
        args: ["--enable-unsafe-swiftshader", "--enable-gpu", "--ignore-gpu-blocklist"],
      });
      const page = await browser.newPage({ viewport: DESKTOP, deviceScaleFactor: 1, baseURL });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      try {
        await openHome(page);
        await expect(page.getByTestId("spline2-canvas-wrap")).toHaveClass(/opacity-100/, {
          timeout: 90_000,
        });
        if (theme === "dark") {
          await page.getByTestId("theme-toggle").dispatchEvent("click");
          await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
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
        expect(errors).toEqual([]);
        await expect.poll(sceneCanvases, { timeout: 60_000 }).toBe(2);
        await drag(760, DESKTOP.width);
        expect(errors).toEqual([]);
        await expect.poll(sceneCanvases, { timeout: 90_000 }).toBe(4);
        await expect(page.getByTestId("spline-canvas-wrap")).toHaveAttribute(
          "data-revealed",
          "true",
          { timeout: 90_000 },
        );
        await expect(page.getByTestId("hero-fallback")).toHaveCount(0);
        await expect
          .poll(async () => (await heroDrawn(page)).drawn, { timeout: 60_000 })
          .toBeGreaterThan(0.1);
        const hero = await heroDrawn(page);
        expect(Math.abs(hero.aspect - 1)).toBeLessThan(0.005);

        // And on to scene 2.
        await expect(page.getByTestId("spline2-canvas-wrap")).toHaveClass(/opacity-100/, {
          timeout: 90_000,
        });
        await scrollToPin(page, FIRST_CARD);
        await expect
          .poll(async () => {
            const s2 = await shownScene2(page);
            return Math.abs(s2.bufferAspect / s2.boxAspect - 1);
          })
          .toBeLessThan(0.005);
        expect(errors).toEqual([]);
      } finally {
        await browser.close();
      }
    });
  }
});
