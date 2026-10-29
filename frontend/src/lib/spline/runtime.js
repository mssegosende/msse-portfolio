import { MOBILE_LAYOUT_QUERY } from "../layout";

// Parches al runtime de Spline (API privada) y liberacion de contextos de GPU.
// patchSplineRuntime() se llama UNA vez, antes de montar cualquier escena.

// CELULAR: DPR TOPEADO EN 2. Los dos .splinecode traen pixelRatioMobile = 0,
// que el runtime traduce a window.devicePixelRatio entero: en un iPhone a DPR
// 3 cada canvas era 1206x2262 (medido en produccion), mas los render targets
// de pantalla completa del pipeline, que escalan con el cuadrado del DPR. El
// runtime lee la proporcion UNA vez por carga, en _getPixelRatio, y la pasa a
// setPixelRatio antes de dimensionar los buffers: topearla ahi evita el pico
// a resolucion completa, y los redimensionados (la barra de Safari) conservan
// el tope. Solo con el layout de celular; escritorio queda igual. Es API
// privada, como _camera: si el runtime la cambia, esto no hace nada.
const MOBILE_MAX_DPR = 2;
const mobileLayoutMQ =
  typeof window !== "undefined" ? window.matchMedia(MOBILE_LAYOUT_QUERY) : null;
const capMobilePixelRatio = (AP) => {
  if (!AP || typeof AP._getPixelRatio !== "function" || AP.__mobileDprCap) return;
  const getPixelRatio = AP._getPixelRatio;
  AP._getPixelRatio = function (mode) {
    const r = getPixelRatio.call(this, mode);
    return mobileLayoutMQ?.matches ? Math.min(r, MOBILE_MAX_DPR) : r;
  };
  AP.__mobileDprCap = true;
};

// CELULAR: WEBGL, NO WEBGPU. El runtime elige WebGPU en el constructor siempre
// que existe navigator.gpu (iOS 26+), y react-spline no deja pasar la opcion
// `renderer`. Con WebGPU cada escena descartada queda retenida por caches de
// modulo del pipeline de nodos de three.js (bug del runtime, ver
// lib/splineRelease.js) que no se alcanzan desde afuera: medido, +12.5 MB de
// heap por cambio de tema aun con todo lo demas liberado. Con WebGL, y
// splineRelease, el heap queda plano. Visualmente, medido a 390x844: la misma
// escena (diferencias de tono tenues, por debajo de lo que se ve). Se fuerza
// en load(), antes de que cree el renderer, con el layout de celular.
//
// ESCRITORIO FUERA DE CHROMIUM (Safari, Firefox): tambien WebGL. Los ojos del
// robot son un video (mp4 dentro del .splinecode) usado como textura; en la
// Mac (Safari 26, WebGPU) no se veian, en el iPhone (WebGL forzado) si. Todo el
// escritorio se midio en Chromium con WebGPU, que sigue igual; Brave forzado a
// WebGL da el mismo encuadre y los ojos. API privada (_rendererBackend): ver
// HANDOFF.
const isChromium =
  typeof navigator !== "undefined" &&
  !!navigator.userAgentData?.brands?.some((b) => b.brand === "Chromium");
const forceMobileWebGL = (AP) => {
  if (!AP || typeof AP.load !== "function" || AP.__mobileWebGL) return;
  const load = AP.load;
  AP.load = function (...args) {
    if (mobileLayoutMQ?.matches || !isChromium) {
      this._rendererBackend = "webgl";
      this._rendererAuto = false;
    }
    return load.apply(this, args);
  };
  AP.__mobileWebGL = true;
};

/** Install both runtime patches on Application.prototype (idempotent). */
export const patchSplineRuntime = (Application) => {
  capMobilePixelRatio(Application?.prototype);
  forceMobileWebGL(Application?.prototype);
};

/**
 * Hand the GPU context back. Application.dispose() drops the renderer but the
 * context itself survives until the browser garbage-collects it, and browsers
 * cap how many may be alive at once — so a handful of theme flips reaches
 * "Too many active WebGL contexts. Oldest context will be lost." and then the
 * next scene fails outright with "Error creating WebGL context".
 * WEBGL_lose_context is the only way to release one on demand. Safe on the 2D
 * grid canvas: asking a 2D canvas for a webgl context returns null.
 */
export const releaseGlContext = (canvas) => {
  if (!canvas) return;
  try {
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const ext = gl && gl.getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
  } catch (e) {
    /* context already gone */
  }
};
