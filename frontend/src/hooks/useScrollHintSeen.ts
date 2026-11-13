import { useEffect, useState } from "react";

// SCROLL is a first-visit hint (María Sol, 13 Nov): it shows at the start of
// scene 1 and goes for good on the first scroll; it never comes back, not at
// the top again, not on a reload (localStorage). The timeline still moves the
// outer box (the HUD's fade); this flag fades and then drops what is inside.
const SCROLL_HINT_KEY = "msse-scroll-hint";
const readHintSeen = () => {
  try {
    return localStorage.getItem(SCROLL_HINT_KEY) === "seen";
  } catch {
    return false;
  }
};

/** Whether the visitor has scrolled once, on this visit or an earlier one. */
export const useScrollHintSeen = (): boolean => {
  const [seen, setSeen] = useState(readHintSeen);
  useEffect(() => {
    if (seen) return undefined;
    const onScroll = () => {
      if (window.scrollY <= 0) return;
      try {
        localStorage.setItem(SCROLL_HINT_KEY, "seen");
      } catch {
        /* no storage: gone for this visit only */
      }
      setSeen(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [seen]);
  return seen;
};
