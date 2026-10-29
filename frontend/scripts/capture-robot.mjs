// Renders one Spline scene on its own and saves a screenshot. Step 1 of the
// static fallback for chapter 2 (public/robot-alpha.png); make-alpha.py keys
// the background out.
//
//   node scripts/capture-robot.mjs <scene-url> [out.png] [width] [height]
//
// Uses Playwright's Chromium, or PW_CHROMIUM_PATH if set.
import { chromium } from "@playwright/test";

// The package's own ESM build; keep the version in step with package.json.
// (esm.sh's rebuild of the runtime fails to load scenes.)
const RUNTIME = "https://cdn.jsdelivr.net/npm/@splinetool/runtime@2.0.54/build/runtime.js";
// The scene's own intro animation has to finish before the capture.
const SETTLE_MS = 45_000;

const [url, out = "scripts/robot-full.png", width = "1000", height = "1200"] =
  process.argv.slice(2);
if (!url) {
  console.error("usage: node scripts/capture-robot.mjs <scene-url> [out.png] [width] [height]");
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM_PATH || undefined,
  args: ["--enable-unsafe-swiftshader", "--hide-scrollbars"],
});
try {
  const page = await browser.newPage({
    viewport: { width: Number(width), height: Number(height) },
  });
  await page.setContent(`<!doctype html>
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}canvas{position:fixed;inset:0;width:100%;height:100%}</style>
<canvas></canvas>
<script type="module">
  import { Application } from "${RUNTIME}";
  new Application(document.querySelector("canvas")).load(${JSON.stringify(url)});
</script>`);
  await page.waitForTimeout(SETTLE_MS);
  await page.screenshot({ path: out });
  console.log("saved", out);
} finally {
  await browser.close();
}
