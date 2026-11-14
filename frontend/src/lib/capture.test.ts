import { afterEach, describe, expect, it, vi } from "vitest";
import { CAPTURE_QUERY, layoutViewport } from "./capture";

// Capture mode: a full-page shot stretches the viewport to the whole page; the
// layout then sizes itself from the reference frame, not the stretched height.

const fakeMatchMedia = (capture: boolean) =>
  vi.fn((q: string) => ({
    matches: q === CAPTURE_QUERY ? capture : false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("layoutViewport", () => {
  it("is the window outside capture mode", () => {
    vi.stubGlobal("matchMedia", fakeMatchMedia(false));
    vi.stubGlobal("innerWidth", 1440);
    vi.stubGlobal("innerHeight", 500);
    expect(layoutViewport()).toEqual({ width: 1440, height: 500 });
  });

  it("is the 1440 x 900 frame's height in a desktop capture, an 844px screen in a phone's", () => {
    vi.stubGlobal("matchMedia", fakeMatchMedia(true));
    vi.stubGlobal("innerWidth", 1440);
    vi.stubGlobal("innerHeight", 18000);
    expect(layoutViewport()).toEqual({ width: 1440, height: 900 });
    vi.stubGlobal("innerWidth", 390);
    expect(layoutViewport()).toEqual({ width: 390, height: 844 });
  });
});

describe("CAPTURE_QUERY", () => {
  it("covers print and a viewport far taller than wide, never a real screen", () => {
    expect(CAPTURE_QUERY).toContain("print");
    // Desktop widths: taller than 2.5x the width; any width: taller than 3x.
    expect(CAPTURE_QUERY).toContain("(min-width: 1024px) and (max-aspect-ratio: 2/5)");
    expect(CAPTURE_QUERY).toContain("(max-aspect-ratio: 1/3)");
  });
});
