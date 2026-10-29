import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(root, "src") },
  },
  server: { port: 3000 },
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
  },
});
