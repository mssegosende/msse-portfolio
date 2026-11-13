import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));

// `vite preview` (the e2e's server) sends the headers production does: the
// frontend service's own in ../vercel.json, the CSP among them, so the local
// checks run under the live policy.
const vercel = JSON.parse(readFileSync(path.resolve(root, "../vercel.json"), "utf8"));
const productionHeaders = Object.fromEntries(
  vercel.services.frontend.headers
    .find((rule) => rule.source === "/(.*)")
    .headers.map((h) => [h.key, h.value]),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(root, "src") },
  },
  server: { port: 3000 },
  preview: { headers: productionHeaders },
  build: {
    // The Spline runtime alone is ~1.5 MB; it loads once and is cached.
    chunkSizeWarningLimit: 2500,
  },
  test: {
    // e2e/ holds the Playwright specs.
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    env: { VITE_BACKEND_URL: "http://api.test" },
    coverage: {
      provider: "v8",
      // Listed explicitly so files no test imports still show, at 0%.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/main.tsx", "src/vite-env.d.ts"],
      reporter: ["text", "html"],
    },
  },
});
