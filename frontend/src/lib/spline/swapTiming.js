// Tiempos y esperas del cambio de tema en celular (runMobileSwap en
// ScrollScene). Desde la recarga de tema (lib/themeReload.js) solo corre si no
// hay sessionStorage.

// Con ?debug=1 (y solo asi), la URL ajusta el cambio de tema en celular para
// probar en el telefono sin redeploy: swapSettle=<ms> cambia SWAP_SETTLE_MS y
// l2=now carga la segunda capa enseguida en vez de diferirla. TEMPORAL, como
// la lectura de ?debug=1.
const swapDebug = (() => {
  try {
    const q = new URLSearchParams(window.location.search);
    return q.get("debug") === "1" ? q : null;
  } catch (e) {
    return null;
  }
})();

// Tiempos del cambio de tema en celular (ver runMobileSwap).
export const SWAP_FADE_MS = 300;
// Despues de soltar: la GPU se recupera de forma asincrona y el GC no se puede
// forzar; el hueco le da tiempo a iOS antes de pedir la escena nueva. 500ms
// no alcanzo en el iPhone (murio en el pico de carga del segundo cambio).
export const SWAP_SETTLE_MS = (() => {
  const v = Number(swapDebug?.get("swapSettle"));
  return swapDebug?.has("swapSettle") && Number.isFinite(v) && v >= 0 ? Math.min(v, 10000) : 1500;
})();
// La capa que NO se esta viendo carga despues: a este tiempo del fundido de
// vuelta, o antes si el scroll se acerca a ella. Asi nunca cargan dos escenas
// a la vez. l2=now (debug) la carga enseguida, como antes.
export const SECONDARY_DELAY_MS = 2500;
export const SECONDARY_NOW = swapDebug?.get("l2") === "now";
// Si una carga no llega, la secuencia sigue igual (los watchdogs de cada capa
// ya ponen el render estatico).
export const SWAP_LOAD_TIMEOUT_MS = 20000;
export const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));
/** Resolve (once) the pending swap wait held in `ref`. */
export const settleWait = (ref, ok) => {
  const done = ref.current;
  ref.current = null;
  done?.(ok);
};
export const waitFrames = (n) =>
  new Promise((r) => {
    const step = (left) => (left <= 0 ? r() : requestAnimationFrame(() => step(left - 1)));
    step(n);
  });
