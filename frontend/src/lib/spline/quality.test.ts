import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SplineApp } from "./types";

type Quality = typeof import("./quality");

/** A scene in a box of the given CSS size (the box can be resized later). */
const fakeApp = (width: number, height: number) => {
  const box = document.createElement("div");
  const size = { width, height };
  Object.defineProperty(box, "clientWidth", { get: () => size.width });
  Object.defineProperty(box, "clientHeight", { get: () => size.height });
  const canvas = document.createElement("canvas");
  box.appendChild(canvas);
  const setPixelRatio = vi.fn();
  const setSize = vi.fn();
  const app = {
    canvas,
    _renderer: { viewportWidth: width, viewportHeight: height, setPixelRatio, setSize },
  } as unknown as SplineApp;
  return { app, box: size, setPixelRatio, setSize };
};

/** The same, with the runtime's private resize path (as Application has it). */
const runtimeApp = (width: number, height: number) => {
  const fake = fakeApp(width, height);
  const app = fake.app;
  const updateProjectionMatrix = vi.fn();
  app._camera = {
    position: { x: 0, y: 0, z: 0 },
    zoom: 1,
    aspect: width / height,
    projectionMatrix: { elements: [] },
    updateProjectionMatrix,
  };
  // Like the runtime: buffers and camera from _viewportWidth/Height.
  const resize = vi.fn(() => {
    const w = app._viewportWidth ?? 0;
    const h = app._viewportHeight ?? 0;
    app._renderer!.viewportWidth = w;
    app._renderer!.viewportHeight = h;
    app._camera!.aspect = w / h;
  });
  app._resize = resize;
  app._debouncedResize = vi.fn();
  app._isPaused = false;
  /** What the runtime's ResizeObserver does when the box changes. */
  const resizeBox = (w: number, h: number) => {
    fake.box.width = w;
    fake.box.height = h;
    app._viewportWidth = w;
    app._viewportHeight = h;
    app._debouncedResize?.();
  };
  return { ...fake, resize, resizeBox, updateProjectionMatrix };
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
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"],
    });
    vi.resetModules();
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    quality = await import("./quality");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Advance the clock (performance.now and timers) by ms. */
  const wait = (ms: number) => {
    now += ms;
    vi.advanceTimersByTime(ms);
  };

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

  it("never lowers the resolution while the window is being resized", () => {
    const { app, setPixelRatio } = fakeApp(4000, 2000);
    quality.cappedPixelRatio(app, 1);
    quality.trackRenderQuality(app);
    // A four-second drag: slow frames between resize events.
    for (let i = 0; i < 40; i++) {
      window.dispatchEvent(new Event("resize"));
      frames(2, 40);
      wait(20);
    }
    // And the second after it settles.
    frames(30, 40);
    expect(setPixelRatio).not.toHaveBeenCalled();
    // Slow frames well after the resize still count.
    frames(200, 40);
    expect(setPixelRatio).toHaveBeenCalled();
  });

  it("on settle, fits a running scene to its box, not the renderer's cached size", () => {
    const { app, resize, resizeBox } = runtimeApp(2448, 1530);
    quality.cappedPixelRatio(app, 1);
    quality.trackRenderQuality(app);
    resizeBox(3264, 1836);
    // During the drag only the camera follows (one frame later), not the buffers.
    vi.advanceTimersToNextFrame();
    expect(app._camera!.aspect).toBeCloseTo(3264 / 1836, 6);
    expect(resize).not.toHaveBeenCalled();
    // The renderer's cached viewport is stale; the box is what counts.
    app._viewportWidth = 2448;
    app._viewportHeight = 1530;
    wait(300);
    expect(resize).toHaveBeenCalledTimes(1);
    expect(app._renderer!.viewportWidth).toBe(3264);
    expect(app._renderer!.viewportHeight).toBe(1836);
    expect(app._camera!.aspect).toBeCloseTo(3264 / 1836, 6);
  });

  it("leaves a stopped scene alone until it runs again", () => {
    const { app, resize, resizeBox } = runtimeApp(2448, 1530);
    quality.cappedPixelRatio(app, 1);
    quality.trackRenderQuality(app);
    app._isPaused = true;
    resizeBox(2176, 1224);
    wait(1000);
    expect(resize).not.toHaveBeenCalled();
    quality.prepareToRun(app);
    expect(resize).toHaveBeenCalledTimes(1);
    expect(app._renderer!.viewportWidth).toBe(2176);
    // Already fitted: playing again costs nothing.
    quality.prepareToRun(app);
    expect(resize).toHaveBeenCalledTimes(1);
  });

  it("a lower step reaches a stopped scene when it runs again", () => {
    const { app, setPixelRatio } = runtimeApp(4000, 2000);
    const full = quality.cappedPixelRatio(app, 1);
    quality.trackRenderQuality(app);
    app._isPaused = true;
    wait(2000);
    frames(200, 40);
    expect(setPixelRatio).not.toHaveBeenCalled();
    quality.prepareToRun(app);
    expect(setPixelRatio.mock.calls[0]?.[0]).toBeLessThan(full);
  });
});
