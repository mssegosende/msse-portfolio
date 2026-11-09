import type { SplineApp } from "./types";

// Render resolution for the Spline scenes. Their buffers are oversampled for
// framing, which reaches 9.6 MP on a 1440p screen: more than an integrated GPU
// can draw. So buffers are capped at a pixel budget, and the budget drops for
// good when frames stay slow on this machine.
const MAX_PIXELS = 3_700_000;

// Linear scale of the buffer at each step.
const STEPS = [1, 0.85, 0.7, 0.55];
const SLOW_FRAME_MS = 30;
// A window is about a second at 60 fps; one slow window can be a passing hitch.
const WINDOW_FRAMES = 45;
const SLOW_WINDOWS_TO_DROP = 2;
// Longer gaps are a background tab or a stall, not the frame rate.
const IGNORE_GAP_MS = 400;

let step = 0;
const natural = new WeakMap<object, number>();
const tracked = new Set<SplineApp>();

// TODO(polish): on very large windows (7500x5200) the robot fills the screen
// but the UI keeps its px sizes; scaling both together needs a root zoom
// checked against the pinned timeline.
// Longest side of a buffer, well under every GPU's MAX_RENDERBUFFER_SIZE
// (8192 at least on WebGL2), so an extreme window shape never fails to draw.
const MAX_SIDE = 4096;

const ratioFor = (app: object & { canvas?: HTMLCanvasElement }, full: number): number => {
  const box = app.canvas?.parentElement;
  const w = box?.clientWidth || window.innerWidth;
  const h = box?.clientHeight || window.innerHeight;
  return (
    Math.min(full, Math.sqrt(MAX_PIXELS / (w * h)), MAX_SIDE / Math.max(w, h)) * (STEPS[step] ?? 1)
  );
};

/** The runtime's ratio for a scene being loaded, within the budget. */
export const cappedPixelRatio = (app: object, full: number): number => {
  natural.set(app, full);
  return ratioFor(app, full);
};

/** Follow a loaded scene, so a later drop also reaches it. */
export const trackRenderQuality = (app: SplineApp): void => {
  tracked.add(app);
};

const applyStep = (app: SplineApp): void => {
  const renderer = app._renderer;
  const full = natural.get(app);
  if (!renderer || full === undefined) return;
  try {
    renderer.setPixelRatio(ratioFor(app, full));
    // The runtime's setSize ignores an unchanged size, so the new ratio only
    // reaches the buffers through a real change. Same trick the runtime uses.
    const { viewportWidth: w, viewportHeight: h } = renderer;
    renderer.setSize(w - 1, h - 1, false);
    renderer.setSize(w, h, false);
  } catch {
    /* renderer without these methods: keeps its size */
  }
};

// The runtime reads the ratio mid-resize, against the box's old size, and
// keeps it: after a huge window (DevTools undocked, a 5K screen) a normal one
// kept a tiny, blurred buffer. Once the window settles, set it again.
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
if (typeof window !== "undefined") {
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => tracked.forEach(applyStep), 250);
  });
}

let last = 0;
let frames = 0;
let total = 0;
let slowWindows = 0;

/** Call once per frame while a scene is running. */
export const noteRenderedFrame = (): void => {
  const now = performance.now();
  const gap = now - last;
  last = now;
  if (step >= STEPS.length - 1 || gap > IGNORE_GAP_MS) return;
  frames += 1;
  total += gap;
  if (frames < WINDOW_FRAMES) return;
  slowWindows = total / frames > SLOW_FRAME_MS ? slowWindows + 1 : 0;
  frames = 0;
  total = 0;
  if (slowWindows < SLOW_WINDOWS_TO_DROP) return;
  slowWindows = 0;
  step += 1;
  tracked.forEach(applyStep);
};
