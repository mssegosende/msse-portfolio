// Frame time and CPU of the live site, scene by scene, for the CRT redesign's
// before/after (design/crt/msse-crt-redesign/SPEC-crt-redesign.md, phase 6).
// Local only, on a real GPU: never in CI, never as e2e (its own port, 4180).
//
//   pnpm build
//   node scripts/perf-crt.mjs                              # record perf/crt-baseline.json
//   node scripts/perf-crt.mjs --out perf/crt-after.json --compare perf/crt-baseline.json
//
// Options: --runs N (3), --only desktop-light,phone-dark, --label text.
//
// Per scenario (median of the runs): fps, frame time p50/p95, share of frames
// over 20 ms and 33 ms, long tasks, main-thread CPU (DevTools' TaskDuration
// and ScriptDuration over wall time), dropped video frames, and whether a
// Spline buffer shrank during it (quality.ts dropped a step: frames were slow).
//
// Desktop runs at 1440x900, DPR 1, no throttling. "phone" is 390x844, DPR 3,
// touch, CPU throttled 4x on this machine's GPU: a stand-in, not a phone. The
// phone verdict needs a real device (Chrome remote debugging / Safari's Web
// Inspector).
/* global window, document, requestAnimationFrame, getComputedStyle */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import { preview } from "vite";

const PORT = 4180;
const BASE = `http://localhost:${PORT}`;

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const RUNS = Number(arg("runs", "3"));
const OUT = arg("out", "perf/crt-baseline.json");
const COMPARE = arg("compare", null);
const LABEL = arg("label", "baseline");
const ONLY = arg("only", null)?.split(",");
// --load-only: just the load (first contentful paint, time to scene 1), no
// scenarios; cheap enough for more runs.
const LOAD_ONLY = process.argv.includes("--load-only");

const CONFIGS = {
  "desktop-light": { phone: false, dark: false },
  "desktop-dark": { phone: false, dark: true },
  "phone-light": { phone: true, dark: false },
  "phone-dark": { phone: true, dark: true },
};

// Each scene 2 card's point of the hero timeline (choreography.ts:
// SCENE2.cards[i] + 0.04), and the timeline's length: SCENE2.end, plus scene
// 2's exit into Projects on desktop (SCENE2_EXIT, R107). As pin progress, the
// same points as the baseline's.
const CARD_T = [1.29, 1.69, 2.09];
const SCENE2_END = 2.5;
const heroEnd = (phone) => SCENE2_END + (phone ? 0 : 0.36);

// ---- In the page ----

// A frame-time recorder and a long-task counter, armed by measure().
const instrument = () => {
  const p = { on: false, last: 0, frames: [], longTasks: 0, longMs: 0 };
  window.__perf = p;
  const loop = (t) => {
    if (p.on && p.last) p.frames.push(t - p.last);
    p.last = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((list) => {
      if (!p.on) return;
      for (const e of list.getEntries()) {
        p.longTasks += 1;
        p.longMs += e.duration;
      }
    }).observe({ type: "longtask" });
  } catch {
    /* no long-task API */
  }
};

// Start in a theme the way a phone theme reload does (lib/themeReload), at the
// top. Both themes, explicitly: the default changed (dark since the CRT
// redesign; light when the baseline was recorded).
const startTheme = (theme) => {
  window.sessionStorage.setItem(
    "theme-reload",
    JSON.stringify({ theme, pin: 0, journeyDone: false, t: Date.now() }),
  );
};

const pinY = (p) => {
  const spacer = document.querySelector(".pin-spacer:has(> #hero)");
  if (!spacer) throw new Error("the hero pin is not built");
  const start = spacer.getBoundingClientRect().top + window.scrollY;
  const end = start + spacer.offsetHeight - window.innerHeight;
  return start + p * (end - start);
};

const pageState = () => ({
  videos: [...document.querySelectorAll("video")].reduce(
    (acc, v) => {
      const q = v.getVideoPlaybackQuality?.();
      if (q) {
        acc.total += q.totalVideoFrames;
        acc.dropped += q.droppedVideoFrames;
      }
      if (!v.paused) acc.playing += 1;
      return acc;
    },
    { total: 0, dropped: 0, playing: 0 },
  ),
  // Buffers of the Spline scenes on screen (hidden mounts excluded).
  canvasPx: [...document.querySelectorAll('[data-testid="scene-section"] canvas')]
    .filter(
      (c) => c.getBoundingClientRect().width > 0 && getComputedStyle(c).visibility !== "hidden",
    )
    .map((c) => c.width * c.height),
});

// ---- Measuring ----

const quantile = (sorted, q) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0;
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

const cdpMetrics = async (cdp) => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
};

/** Run `during` (or wait `ms`) with the recorders armed; return its numbers. */
const measure = async (page, cdp, { ms = 0, during } = {}) => {
  const m0 = await cdpMetrics(cdp);
  const s0 = await page.evaluate(pageState);
  await page.evaluate(() => {
    Object.assign(window.__perf, { on: true, last: 0, frames: [], longTasks: 0, longMs: 0 });
  });
  const t0 = Date.now();
  await (during ? during() : page.waitForTimeout(ms));
  const wallMs = Date.now() - t0;
  const r = await page.evaluate(() => {
    window.__perf.on = false;
    const { frames, longTasks, longMs } = window.__perf;
    return { frames, longTasks, longMs };
  });
  const m1 = await cdpMetrics(cdp);
  const s1 = await page.evaluate(pageState);

  const f = [...r.frames].sort((a, b) => a - b);
  const total = f.reduce((a, b) => a + b, 0) || 1;
  const shrank =
    s0.canvasPx.length === s1.canvasPx.length && s1.canvasPx.some((px, i) => px < s0.canvasPx[i]);
  return {
    fps: round((f.length / total) * 1000),
    p50: round(quantile(f, 0.5)),
    p95: round(quantile(f, 0.95)),
    over20: round((f.filter((x) => x > 20).length / (f.length || 1)) * 100),
    over33: round((f.filter((x) => x > 33.4).length / (f.length || 1)) * 100),
    longTasks: r.longTasks,
    longMs: Math.round(r.longMs),
    cpu: round(((m1.TaskDuration - m0.TaskDuration) * 1000 * 100) / wallMs),
    script: round(((m1.ScriptDuration - m0.ScriptDuration) * 1000 * 100) / wallMs),
    videoDropped: s1.videos.dropped - s0.videos.dropped,
    videoFrames: s1.videos.total - s0.videos.total,
    videosPlaying: s1.videos.playing,
    bufferShrank: shrank ? 1 : 0,
  };
};

const scrollTo = (page, y) => page.evaluate((top) => window.scrollTo(0, top), y);

/** Scroll the pinned sequence from p0 to p1 over ms, one step per frame. */
const scrollPin = (page, p0, p1, ms) =>
  page.evaluate(
    ([a, b, dur, pinYSrc]) =>
      new Promise((done) => {
        const at = new Function(`return (${pinYSrc})`)();
        const y0 = at(a);
        const y1 = at(b);
        const t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur);
          window.scrollTo(0, y0 + (y1 - y0) * k);
          if (k < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      }),
    [p0, p1, ms, pinY.toString()],
  );

const gotoPin = async (page, p, settleMs = 3000) => {
  const y = await page.evaluate(
    ([src, prog]) => new Function(`return (${src})`)()(prog),
    [pinY.toString(), p],
  );
  await scrollTo(page, y);
  await page.waitForTimeout(settleMs); // scrub: 1 eases for about a second, then the cards rise
};

const oneRun = async (browser, { phone, dark }) => {
  const context = await browser.newContext(
    phone
      ? {
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true,
        }
      : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(instrument);
  await page.addInitScript(startTheme, dark ? "dark" : "light");
  // A returning visitor who entered silent: the loading screen (index.html)
  // enters by itself at 100%, as it would for them.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("msse-entry", "silent");
    } catch {
      /* no storage: the screen would ask; the run would time out */
    }
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  if (phone) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const loadT0 = Date.now();
  await page.goto(BASE);
  await page.locator(".pin-spacer:has(> #hero)").waitFor({ state: "attached" });
  await page
    .locator('[data-testid="spline-canvas-wrap"][data-revealed="true"]')
    .waitFor({ state: "attached", timeout: 60_000 });
  const revealMs = Date.now() - loadT0;
  // Scene 1 starts to show: the loading screen's crossfade begins (with no
  // loading screen, the reveal itself).
  await page.waitForFunction(
    () => !document.getElementById("boot") || document.documentElement.dataset.boot === "entered",
    null,
    { timeout: 60_000 },
  );
  const enteredMs = Date.now() - loadT0;
  // Scene 1 alone on screen: the robot revealed and the loading screen gone.
  await page.locator("#boot").waitFor({ state: "detached", timeout: 60_000 });
  const sceneMs = Date.now() - loadT0;
  // The browser's own first contentful paint, from navigation start.
  const fcpMs = Math.round(
    await page.evaluate(
      () => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0,
    ),
  );
  const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  if (dark !== (theme === "dark")) throw new Error(`theme is ${theme}, expected dark=${dark}`);
  if (LOAD_ONLY) {
    await context.close();
    return { revealMs, enteredMs, sceneMs, fcpMs, errors, scenarios: {} };
  }
  await page.waitForTimeout(4000); // the reveal fade and the scene's own intro

  const s = {};
  s["s1-idle"] = await measure(page, cdp, { ms: 10_000 });
  s["s1-to-s2-scroll"] = await measure(page, cdp, {
    during: () => scrollPin(page, 0, SCENE2_END / heroEnd(phone), 8000),
  });
  for (const [i, t] of CARD_T.entries()) {
    await gotoPin(page, t / heroEnd(phone));
    s[`s2-card${i + 1}`] = await measure(page, cdp, { ms: 6000 });
  }
  // Where Projects has arrived: its top, or with the section crossfades
  // (desktop, R107) its pin spacer's top plus the crossfade's scroll.
  const projectsY = await page.evaluate(() => {
    const el = document.getElementById("projects");
    const box = el.parentElement.classList.contains("pin-spacer") ? el.parentElement : el;
    const xf = Number(document.documentElement.style.getPropertyValue("--xf-vh")) || 0;
    return box.getBoundingClientRect().top + window.scrollY + (window.innerHeight * xf) / 100;
  });
  await scrollTo(page, projectsY);
  await page.waitForTimeout(3500); // the clip loads and starts
  s["projects"] = await measure(page, cdp, { ms: 10_000 });
  if (!phone) {
    await page.locator('[data-testid^="project-folder-"]').first().hover();
    await page.waitForTimeout(2500);
    s["projects-hover"] = await measure(page, cdp, { ms: 8000 });
  }
  await context.close();
  return { revealMs, enteredMs, sceneMs, fcpMs, errors, scenarios: s };
};

const gpuOf = async (browser) => {
  const page = await browser.newPage();
  const gpu = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    return ext
      ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
      : gl
        ? "webgl, renderer hidden"
        : "no webgl";
  });
  await page.close();
  return gpu;
};

// ---- Report ----

const COLS = [
  "fps",
  "p95",
  "over20",
  "over33",
  "longMs",
  "cpu",
  "script",
  "videoDropped",
  "bufferShrank",
];

const table = (result, base) => {
  const width = (c) => Math.max(base ? 16 : 9, c.length + 2);
  const lines = [];
  for (const [cfg, data] of Object.entries(result.configs)) {
    const was = base?.configs?.[cfg]?.revealMs;
    const fcpWas = base?.configs?.[cfg]?.fcpMs;
    lines.push(
      `\n${cfg}  (fcp ${fcpWas ? `${fcpWas} → ` : ""}${data.fcpMs} ms,` +
        ` reveal ${was ? `${was} → ` : ""}${data.revealMs} ms,` +
        ` scene ${base?.configs?.[cfg]?.sceneMs ? `${base.configs[cfg].sceneMs} → ` : ""}${data.sceneMs} ms)`,
    );
    lines.push(["scenario".padEnd(18), ...COLS.map((c) => c.padStart(width(c)))].join(""));
    for (const [name, m] of Object.entries(data.scenarios)) {
      const b = base?.configs?.[cfg]?.scenarios?.[name];
      const cell = (c) => (b ? `${b[c]} → ${m[c]}` : `${m[c]}`).padStart(width(c));
      lines.push([name.padEnd(18), ...COLS.map(cell)].join(""));
    }
    if (data.errors.length) lines.push(`  page errors: ${data.errors.join(" | ")}`);
  }
  return lines.join("\n");
};

// ---- Main ----

const server = await preview({ preview: { port: PORT, strictPort: true }, logLevel: "warn" });
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM_PATH || undefined,
  // Headed: headless Chromium draws WebGL with SwiftShader (no GPU) and has
  // no real compositor or vsync. No SwiftShader fallback either: a run
  // without the GPU would be meaningless.
  headless: false,
  // A covered or unfocused window must keep drawing at full rate.
  args: [
    "--ignore-gpu-blocklist",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--disable-features=CalculateNativeWinOcclusion",
  ],
});
try {
  const gpu = await gpuOf(browser);
  console.log(`GPU: ${gpu}`);
  if (/swiftshader|llvmpipe|no webgl/i.test(gpu)) throw new Error("no hardware GPU: not measuring");

  const result = {
    label: LABEL,
    date: new Date().toISOString(),
    commit: execSync("git rev-parse --short HEAD").toString().trim(),
    machine: { gpu, cpu: os.cpus()[0]?.model.trim(), browser: browser.version() },
    runs: RUNS,
    configs: {},
  };
  for (const [name, cfg] of Object.entries(CONFIGS)) {
    // The live site is dark only (THEME_TOGGLE off, R190): the light runs only
    // when asked for (--only desktop-light,phone-light), on the light-mode branch.
    if (ONLY ? !ONLY.includes(name) : !cfg.dark) continue;
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      process.stdout.write(`${name} run ${i + 1}/${RUNS}… `);
      runs.push(await oneRun(browser, cfg));
      console.log("ok");
    }
    const scenarios = {};
    for (const sc of Object.keys(runs[0].scenarios)) {
      scenarios[sc] = Object.fromEntries(
        Object.keys(runs[0].scenarios[sc]).map((k) => [
          k,
          round(median(runs.map((r) => r.scenarios[sc][k]))),
        ]),
      );
    }
    result.configs[name] = {
      revealMs: Math.round(median(runs.map((r) => r.revealMs))),
      fcpMs: Math.round(median(runs.map((r) => r.fcpMs))),
      enteredMs: Math.round(median(runs.map((r) => r.enteredMs))),
      sceneMs: Math.round(median(runs.map((r) => r.sceneMs))),
      errors: [...new Set(runs.flatMap((r) => r.errors))],
      scenarios,
    };
  }

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
  const base = COMPARE ? JSON.parse(readFileSync(COMPARE, "utf8")) : null;
  console.log(table(result, base));
  console.log(`\nsaved ${OUT}`);
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
