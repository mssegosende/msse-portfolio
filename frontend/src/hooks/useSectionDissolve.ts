import { useEffect } from "react";

// The page's sections in order (the hero holds scenes 1 and 2).
const ORDER = ["hero", "projects", "about", "contact"] as const;

/** A leaving section is gone once its bottom is this far up the screen. */
const LEAVE = 0.6;
/** An entering section's word and head are whole once its top is this high. */
const ENTER_END = 0.3;
const BLUR = 8; // px, at the end of a leave

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Desktop scene transitions after scene 2, as smooth as 1 -> 2 (María Sol,
 * 9 Nov; the design: content dissolves on the way out with fade + blur).
 * Scrubbed by the scroll, so both directions play it:
 * - a leaving section (its bottom rising through the screen) fades and blurs
 *   out, over the next ground's top colour (<main> takes it), so the next
 *   ground meets it without a seam;
 * - an entering section's background word and head fade in (`--enter`, read
 *   by .bg-word and .dissolve-in in index.css), and its top edge feathers
 *   into that same colour.
 * Phones keep their transitions. Reduced motion: the fade, no blur.
 * Never on the Spline canvas itself: opacity and blur on a section, no transform.
 */
export const useSectionDissolve = () => {
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const on = desktop.matches;
      let backdrop = "";
      ORDER.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const next = ORDER[i + 1];
        const leave = on && next ? clamp((vh - r.bottom) / (LEAVE * vh)) : 0;
        const enter = on && i > 0 ? clamp((r.top - ENTER_END * vh) / ((1 - ENTER_END) * vh)) : 0;
        el.style.opacity = leave > 0 ? (1 - leave).toFixed(3) : "";
        el.style.filter =
          leave > 0 && !reduce.matches ? `blur(${(leave * BLUR).toFixed(2)}px)` : "";
        el.style.setProperty("--enter", enter.toFixed(3));
        // The edges where two grounds meet feather into the backdrop colour:
        // a leaving section's bottom (ramping in fast, so nothing jumps), an
        // entering one's top. No mask once a section has arrived.
        const feather =
          leave > 0
            ? `linear-gradient(0deg, transparent 0, #000 ${(Math.min(1, leave * 4) * 30).toFixed(1)}vh)`
            : enter > 0
              ? `linear-gradient(180deg, transparent 0, #000 ${(enter * 40).toFixed(1)}vh)`
              : "";
        el.style.maskImage = feather;
        el.style.webkitMaskImage = feather;
        if (leave > 0 && next) backdrop = `var(--top-${next})`;
      });
      const main = document.querySelector("main");
      if (main) main.style.backgroundColor = backdrop;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    desktop.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      desktop.removeEventListener("change", schedule);
    };
  }, []);
};
