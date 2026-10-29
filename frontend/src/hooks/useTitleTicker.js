import { useEffect } from "react";

// Also the static title in public/index.html (shown before mount and kept
// with reduced motion).
export const STATIC_TITLE = "msse:// Software & AI Engineer";

// The trailing " | " separates the end from the start when it wraps.
export const TICKER_TEXT =
  "msse:// software & ai engineering | python | fastapi | react | typescript | llm | agents | ";

/**
 * Scrolls the tab title like a departure board, one character every
 * `stepMs`. Keeps the static title with prefers-reduced-motion.
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
