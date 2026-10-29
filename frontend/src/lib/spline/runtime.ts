import { MOBILE_LAYOUT_QUERY } from "../layout";

/** The private parts of Application.prototype these patches touch. */
interface PatchableApp {
  _getPixelRatio?: (mode: unknown) => number;
  load?: (...args: unknown[]) => unknown;
  _rendererBackend?: string;
  _rendererAuto?: boolean;
  __mobileDprCap?: boolean;
  __mobileWebGL?: boolean;
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
    return mobileLayoutMQ?.matches ? Math.min(r, MOBILE_MAX_DPR) : r;
  };
  AP.__mobileDprCap = true;
};

// Force WebGL on phones and on desktop browsers other than Chromium. The
// runtime picks WebGPU whenever navigator.gpu exists, and react-spline can't
// pass the `renderer` option.
// - Phones: with WebGPU, node-pipeline caches inside the runtime retain every
//   discarded scene.
// - Safari/Firefox desktop: the robot's eyes are a video texture that WebGPU
//   in Safari doesn't render. Chromium keeps WebGPU, where everything was
//   tuned.
// navigator.userAgentData is Chromium-only (and not in TypeScript's DOM types).
type NavigatorUAData = Navigator & { userAgentData?: { brands?: { brand: string }[] } };
const isChromium =
  typeof navigator !== "undefined" &&
  !!(navigator as NavigatorUAData).userAgentData?.brands?.some((b) => b.brand === "Chromium");
const forceMobileWebGL = (AP: PatchableApp | undefined): void => {
  if (!AP || typeof AP.load !== "function" || AP.__mobileWebGL) return;
  const load = AP.load;
  AP.load = function (this: PatchableApp, ...args: unknown[]) {
    if (mobileLayoutMQ?.matches || !isChromium) {
      this._rendererBackend = "webgl";
      this._rendererAuto = false;
    }
    return load.apply(this, args);
  };
  AP.__mobileWebGL = true;
};

/** Install both runtime patches on Application.prototype (idempotent). */
export const patchSplineRuntime = (Application: { prototype: unknown }): void => {
  const proto = Application.prototype as PatchableApp;
  capMobilePixelRatio(proto);
  forceMobileWebGL(proto);
};

/**
 * Release a canvas's WebGL context now. dispose() leaves it alive until GC,
 * and browsers cap live contexts, so repeated theme flips ended in "Error
 * creating WebGL context". Safe on 2D canvases (getContext returns null).
 */
export const releaseGlContext = (canvas: HTMLCanvasElement | null | undefined): void => {
  if (!canvas) return;
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
