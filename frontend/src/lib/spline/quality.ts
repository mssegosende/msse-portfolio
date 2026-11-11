import type { SplineApp } from "./types";

// Render resolution and buffer size for the Spline scenes. Their buffers are
// oversampled for framing, which reaches 9.6 MP on a 1440p screen: more than an
// integrated GPU can draw. So buffers are capped at a pixel budget, and the
// budget drops for good when frames stay slow on this machine.
const MAX_PIXELS = 3_700_000;

// Linear scale of the buffer at each step.
const STEPS = [1, 0.85, 0.7, 0.55];
const SLOW_FRAME_MS = 30;
// A window is about a second at 60 fps; one slow window can be a passing hitch.
const WINDOW_FRAMES = 45;
const SLOW_WINDOWS_TO_DROP = 2;
// Longer gaps are a background tab or a stall, not the frame rate.
const IGNORE_GAP_MS = 400;

// A window resize is "in progress" while its events (or the boxes' own resizes,
// which follow ScrollTrigger's refresh) come less than this far apart.
const RESIZE_SETTLE_MS = 300;
// Frames during a drag are slow by nature (every step reallocates buffers), so
// they never count toward a drop, nor for this long after it settles.
const RESIZE_QUIET_MS = 1000;

let step = 0;
const natural = new WeakMap<object, number>();
const tracked = new Set<SplineApp>();
// Scenes whose buffers don't match their box (resized while stopped, or a
// step drop): resized the moment they run again, before their first frame.
const dirty = new WeakSet<SplineApp>();

// TODO(polish): on very large windows (7500x5200) the robot fills the screen
// but the UI keeps its px sizes; scaling both together needs a root zoom
// checked against the pinned timeline.
// Longest side of a buffer, well under every GPU's MAX_RENDERBUFFER_SIZE
// (8192 at least on WebGL2), so an extreme window shape never fails to draw.
const MAX_SIDE = 4096;

const boxOf = (app: { canvas?: HTMLCanvasElement }) => app.canvas?.parentElement ?? null;

const ratioFor = (app: object & { canvas?: HTMLCanvasElement }, full: number): number => {
  const box = boxOf(app);
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

const isRunning = (app: SplineApp): boolean => !app._isPaused;

/**
 * Fit a scene's buffers, ratio and camera to its box as it is now. The box's
 * clientWidth/Height, never the renderer's cached viewport: mid-resize that
 * one is the old size, and a buffer sized from it kept the old aspect.
 */
const fitToBox = (app: SplineApp): void => {
  const renderer = app._renderer;
  const box = boxOf(app);
  const w = box?.clientWidth ?? 0;
  const h = box?.clientHeight ?? 0;
  if (!renderer || !w || !h) return;
  try {
    const full = natural.get(app);
    const ratio = full === undefined ? renderer._pixelRatio : ratioFor(app, full);
    const ratioChanged = ratio !== undefined && ratio !== renderer._pixelRatio;
    const sizeChanged = renderer.viewportWidth !== w || renderer.viewportHeight !== h;
    if (ratioChanged && ratio !== undefined) renderer.setPixelRatio(ratio);
    if (typeof app._resize === "function") {
      // The runtime's own resize: buffers, post-processing targets, camera
      // aspect and projection (applyView's hook keeps the zoom and the pan).
      // Its setSize ignores an unchanged size, so a new ratio alone needs the
      // runtime's own 1px nudge (force) to reach the buffers.
      app._viewportWidth = w;
      app._viewportHeight = h;
      app._resize(ratioChanged && !sizeChanged);
    } else {
      if (!sizeChanged) renderer.setSize(w - 1, h - 1, false);
      renderer.setSize(w, h, false);
    }
    dirty.delete(app);
  } catch {
    /* renderer without these methods: keeps its size */
  }
};

/**
 * During a drag only the projection follows the box: a scene drawn at the
 * box's aspect into its old buffer, which CSS stretches to the box, keeps its
 * proportions. Reallocating every buffer on every step is what made a drag
 * stall; the buffers follow once, when it settles.
 */
const fitAspect = (app: SplineApp): void => {
  const box = boxOf(app);
  const cam = app._camera;
  const w = box?.clientWidth ?? 0;
  const h = box?.clientHeight ?? 0;
  if (!cam || typeof cam.aspect !== "number" || !w || !h) return;
  try {
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    app._requestRenderAutoMode?.();
  } catch {
    /* runtime without an inspectable camera */
  }
};

// ---- resize coordination ---------------------------------------------------

// Frame-time counters (noteRenderedFrame); a resize resets them.
let last = 0;
let frames = 0;
let total = 0;
let slowWindows = 0;

let lastResizeAt = -Infinity;
let settleTimer: ReturnType<typeof setTimeout> | undefined;
let aspectFrame = 0;
const aspectPending = new Set<SplineApp>();

const resetFrameCount = () => {
  frames = 0;
  total = 0;
  slowWindows = 0;
};

/** Running scenes fit their boxes now; stopped ones wait (dirty) until they run. */
const refitAll = () => {
  tracked.forEach((app) => {
    // dispose() drops the renderer: a scene that is gone stops being followed.
    if (!app._renderer) tracked.delete(app);
    else if (isRunning(app)) fitToBox(app);
    else dirty.add(app);
  });
};

const settle = () => {
  settleTimer = undefined;
  refitAll();
};

const noteResize = () => {
  lastResizeAt = performance.now();
  resetFrameCount();
  clearTimeout(settleTimer);
  settleTimer = setTimeout(settle, RESIZE_SETTLE_MS);
};

const resizing = (now: number) => now - lastResizeAt < RESIZE_SETTLE_MS;

/** A scene's box changed size (the runtime's ResizeObserver). */
const onBoxResize = (app: SplineApp) => {
  dirty.add(app);
  noteResize();
  if (!isRunning(app)) return;
  aspectPending.add(app);
  if (aspectFrame) return;
  aspectFrame = requestAnimationFrame(() => {
    aspectFrame = 0;
    aspectPending.forEach(fitAspect);
    aspectPending.clear();
  });
};

if (typeof window !== "undefined") window.addEventListener("resize", noteResize);

/**
 * Follow a loaded scene: a later step drop also reaches it, and its box's
 * resizes go through the coordination above instead of the runtime's own
 * (which reallocated every scene, shown or not, on every step of a drag).
 */
export const trackRenderQuality = (app: SplineApp): void => {
  tracked.add(app);
  // The runtime's observer sets _viewportWidth/Height from the canvas and then
  // calls this, looked up on the instance at call time. Private API: if it
  // changes, the runtime resizes on its own as before.
  if (typeof app._debouncedResize === "function") app._debouncedResize = () => onBoxResize(app);
};

/**
 * Call right before a stopped scene plays again: a scene resized while it was
 * stopped fits its box before its first frame shows.
 */
export const prepareToRun = (app: SplineApp): void => {
  if (!dirty.has(app)) return;
  if (resizing(performance.now())) fitAspect(app);
  else fitToBox(app);
};

/** Call once per frame while a scene is running. */
export const noteRenderedFrame = (): void => {
  const now = performance.now();
  const gap = now - last;
  last = now;
  if (step >= STEPS.length - 1 || gap > IGNORE_GAP_MS) return;
  if (now - lastResizeAt < RESIZE_SETTLE_MS + RESIZE_QUIET_MS) {
    resetFrameCount();
    return;
  }
  frames += 1;
  total += gap;
  if (frames < WINDOW_FRAMES) return;
  slowWindows = total / frames > SLOW_FRAME_MS ? slowWindows + 1 : 0;
  frames = 0;
  total = 0;
  if (slowWindows < SLOW_WINDOWS_TO_DROP) return;
  slowWindows = 0;
  step += 1;
  refitAll();
};
