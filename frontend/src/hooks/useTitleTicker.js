import { useEffect } from "react";

// The static title lives in public/index.html too: it is what the tab shows
// before the app mounts, and what a reduced-motion visitor keeps.
export const STATIC_TITLE = "msse:// Software & AI Engineer";

// The trailing " | " is the loop separator: rotated, the end runs straight
// back into the start with no gap.
export const TICKER_TEXT =
  "msse:// software & ai engineering | python | fastapi | react | typescript | llm | agents | ";

/**
 * Turns the tab title into an endless ticker, like a departure board: one
 * character every `stepMs`, forever. With prefers-reduced-motion the static
 * title stays instead, and the choice follows the setting if it changes.
 *
 * One interval at a time: the cleanup clears it, so StrictMode's dev-only
 * mount / unmount / remount never leaves two tickers running.
 */
export const useTitleTicker = (text = TICKER_TEXT, staticTitle = STATIC_TITLE, stepMs = 250) => {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let id = null;
    let i = 0;

    const stop = () => {
      if (id !== null) clearInterval(id);
      id = null;
    };
    const start = () => {
      stop();
      if (reduce.matches) {
        document.title = staticTitle;
        return;
      }
      document.title = text;
      id = setInterval(() => {
        i = (i + 1) % text.length;
        document.title = text.slice(i) + text.slice(0, i);
      }, stepMs);
    };

    start();
    reduce.addEventListener("change", start);
    return () => {
      reduce.removeEventListener("change", start);
      stop();
      document.title = staticTitle;
    };
  }, [text, staticTitle, stepMs]);
};
