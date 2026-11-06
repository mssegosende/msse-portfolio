import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SplineApp } from "./types";

type Quality = typeof import("./quality");

/** A scene in a box of the given CSS size. */
const fakeApp = (width: number, height: number) => {
  const box = document.createElement("div");
  Object.defineProperty(box, "clientWidth", { value: width });
  Object.defineProperty(box, "clientHeight", { value: height });
  const canvas = document.createElement("canvas");
  box.appendChild(canvas);
  const setPixelRatio = vi.fn();
  const setSize = vi.fn();
  const app = {
    canvas,
    _renderer: { viewportWidth: width, viewportHeight: height, setPixelRatio, setSize },
  } as unknown as SplineApp;
  return { app, setPixelRatio, setSize };
};

describe("render quality", () => {
  let quality: Quality;
  let now = 0;

  /** Run frames of the given length through the governor. */
  const frames = (count: number, ms: number) => {
    for (let i = 0; i < count; i++) {
      now += ms;
      quality.noteRenderedFrame();
    }
  };

  beforeEach(async () => {
    vi.resetModules();
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    quality = await import("./quality");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("leaves a scene under the pixel budget at its full ratio", () => {
    const { app } = fakeApp(1000, 1000);
    expect(quality.cappedPixelRatio(app, 1)).toBe(1);
  });

  it("caps an oversampled buffer at the budget", () => {
    const { app } = fakeApp(4344, 2219);
    const ratio = quality.cappedPixelRatio(app, 1);
    expect(4344 * 2219 * ratio * ratio).toBeCloseTo(3_700_000, -2);
  });

  it("holds the resolution while frames keep up", () => {
    const { app, setPixelRatio } = fakeApp(4000, 2000);
    quality.cappedPixelRatio(app, 1);
    quality.trackRenderQuality(app);
    frames(500, 16);
    expect(setPixelRatio).not.toHaveBeenCalled();
  });

  it("lowers the resolution once frames stay slow, and resizes the buffers", () => {
    const { app, setPixelRatio, setSize } = fakeApp(4000, 2000);
    const full = quality.cappedPixelRatio(app, 1);
    quality.trackRenderQuality(app);
    frames(200, 40);
    expect(setPixelRatio.mock.calls[0]?.[0]).toBeLessThan(full);
    expect(setSize).toHaveBeenLastCalledWith(4000, 2000, false);
  });

  it("does not react to one slow moment", () => {
    const { app, setPixelRatio } = fakeApp(4000, 2000);
    quality.cappedPixelRatio(app, 1);
    quality.trackRenderQuality(app);
    frames(50, 40);
    frames(100, 16);
    frames(50, 40);
    expect(setPixelRatio).not.toHaveBeenCalled();
  });

  it("ignores gaps from a background tab", () => {
    const { app, setPixelRatio } = fakeApp(4000, 2000);
    quality.cappedPixelRatio(app, 1);
    quality.trackRenderQuality(app);
    frames(200, 5000);
    expect(setPixelRatio).not.toHaveBeenCalled();
  });
});
