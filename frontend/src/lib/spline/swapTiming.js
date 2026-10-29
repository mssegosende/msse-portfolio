// Timing of the in-place theme swap on phones (runMobileSwap). Since theme
// changes reload the page (lib/themeReload.js), it only runs without
// sessionStorage.

// Temporary: with ?debug=1, swapSettle=<ms> and l2=now tune the swap for
// testing on a phone without a redeploy.
const swapDebug = (() => {
  try {
    const q = new URLSearchParams(window.location.search);
    return q.get("debug") === "1" ? q : null;
  } catch (e) {
    return null;
  }
})();

export const SWAP_FADE_MS = 300;
// Gap between releasing the old scenes and loading the new one. GPU memory
// is freed asynchronously and GC can't be forced; 500ms was not enough on iOS.
export const SWAP_SETTLE_MS = (() => {
  const v = Number(swapDebug?.get("swapSettle"));
  return swapDebug?.has("swapSettle") && Number.isFinite(v) && v >= 0 ? Math.min(v, 10000) : 1500;
})();
// The layer not on screen loads after this delay, or sooner if the scroll
// approaches it, so two scenes never load at once.
export const SECONDARY_DELAY_MS = 2500;
export const SECONDARY_NOW = swapDebug?.get("l2") === "now";
// A load that never arrives doesn't stall the swap; each layer's watchdog
// already falls back to the static render.
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
