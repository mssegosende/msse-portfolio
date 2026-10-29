import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { matchMedia, resetMediaQueries } from "./matchMedia";

// Browser APIs jsdom lacks. IntersectionObserver never fires: whileInView
// content stays in its initial state, which tests don't depend on.
class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

vi.stubGlobal("matchMedia", matchMedia);
vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

afterEach(() => {
  cleanup();
  resetMediaQueries();
  sessionStorage.clear();
  vi.restoreAllMocks();
});
