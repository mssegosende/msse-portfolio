import { defineConfig } from "@playwright/test";

// Runs against the production build (`pnpm build` first). CI installs
// Playwright's Chromium; locally, PW_CHROMIUM_PATH can point at any installed
// Chromium (Chrome, Brave, Edge) instead.
const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Tests tagged @gpu need the real Spline scenes rendered at speed. CI runners
  // have no GPU (SwiftShader): the scenes never finish loading there, so CI
  // skips them; they run locally, on a GPU.
  grepInvert: process.env.CI ? /@gpu/ : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    browserName: "chromium",
    baseURL: `http://localhost:${PORT}`,
    deviceScaleFactor: 1,
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM_PATH || undefined,
      // Software WebGL for the Spline scenes on GPU-less runners.
      args: ["--enable-unsafe-swiftshader"],
    },
    trace: "retain-on-failure",
    // A returning visitor who entered silent: the loading screen enters by
    // itself at 100%, so the specs meet scene 1 as before. The loading
    // screen's own spec (boot.spec.ts) starts from an empty store, a first visit.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: `http://localhost:${PORT}`,
          localStorage: [{ name: "msse-entry", value: "silent" }],
        },
      ],
    },
  },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
