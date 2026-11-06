import { MOBILE_LAYOUT_QUERY } from "../layout";
import { cappedPixelRatio } from "./quality";

/** The private parts of Application.prototype these patches touch. */
interface PatchableApp {
  _getPixelRatio?: (mode: unknown) => number;
  canvas?: HTMLCanvasElement;
  load?: (...args: unknown[]) => unknown;
  _rendererBackend?: string;
  _rendererAuto?: boolean;
  __mobileDprCap?: boolean;
  __forcedWebGL?: boolean;
}

// Patches to the Spline runtime (private API) and GPU context release.
// Call patchSplineRuntime() once, before any scene mounts.

// Phones: cap DPR at 2. Both scene files ask for the full device pixel
// ratio, so at DPR 3 every canvas and full-screen render target was huge. The
// runtime reads the ratio once per load in _getPixelRatio, before sizing its
// buffers. Private API: if it changes, this silently does nothing.
const MOBILE_MAX_DPR = 2;
const mobileLayoutMQ =
  typeof window !== "undefined" ? window.matchMedia(MOBILE_LAYOUT_QUERY) : null;
const capMobilePixelRatio = (AP: PatchableApp | undefined): void => {
  if (!AP || typeof AP._getPixelRatio !== "function" || AP.__mobileDprCap) return;
  const getPixelRatio = AP._getPixelRatio;
  AP._getPixelRatio = function (this: PatchableApp, mode: unknown) {
    const r = getPixelRatio.call(this, mode);
    return cappedPixelRatio(this, mobileLayoutMQ?.matches ? Math.min(r, MOBILE_MAX_DPR) : r);
  };
  AP.__mobileDprCap = true;
};

// Force WebGL everywhere. The runtime picks WebGPU whenever navigator.gpu exists,
// and react-spline can't pass the `renderer` option.
// - It is faster here: on an integrated AMD GPU at 1440p, 46-56 fps against 33-41
//   with the same scene.
// - A lost WebGPU device fires nothing on the canvas, so a GPU reset would leave a
//   blank robot; a lost WebGL context can be caught (watchContextLoss).
// - Phones: with WebGPU, node-pipeline caches inside the runtime retain every
//   discarded scene.
// - Safari: the robot's eyes are a video texture its WebGPU doesn't render.
const forceWebGL = (AP: PatchableApp | undefined): void => {
  if (!AP || typeof AP.load !== "function" || AP.__forcedWebGL) return;
  const load = AP.load;
  AP.load = function (this: PatchableApp, ...args: unknown[]) {
    this._rendererBackend = "webgl";
    this._rendererAuto = false;
    return load.apply(this, args);
  };
  AP.__forcedWebGL = true;
};

/** Install both runtime patches on Application.prototype (idempotent). */
export const patchSplineRuntime = (Application: { prototype: unknown }): void => {
  const proto = Application.prototype as PatchableApp;
  capMobilePixelRatio(proto);
  forceWebGL(proto);
};

// Contexts this code let go of: their loss event is not a failure.
const released = new WeakSet<HTMLCanvasElement>();

/** Whether this browser can create a WebGL context at all. */
export const canRender3D = (): boolean => {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
};

/**
 * Report a context the browser took away, as it does when the GPU resets. The
 * scene would otherwise stay on screen as a blank canvas.
 */
export const watchContextLoss = (
  canvas: HTMLCanvasElement | null | undefined,
  onLost: () => void,
): void => {
  canvas?.addEventListener("webglcontextlost", () => {
    if (!released.has(canvas)) onLost();
  });
};

/**
 * Release a canvas's WebGL context now. dispose() leaves it alive until GC,
 * and browsers cap live contexts, so repeated theme flips ended in "Error
 * creating WebGL context". Safe on 2D canvases (getContext returns null).
 */
export const releaseGlContext = (canvas: HTMLCanvasElement | null | undefined): void => {
  if (!canvas) return;
  released.add(canvas);
  try {
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ||
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    const ext = gl && gl.getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
  } catch {
    /* context already gone */
  }
};
