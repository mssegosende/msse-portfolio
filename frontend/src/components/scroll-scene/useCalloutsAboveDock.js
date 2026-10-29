import { useEffect } from "react";

const GAP = 16;

/**
 * Phones: keeps the feature cards 16px above the dock. CSS units can't: the
 * pinned section is 100vh (on iOS, the height with the browser bars hidden),
 * so with the bars showing its bottom edge is off screen. The dock is fixed
 * to the visible edge, so it is the reference.
 */
export const useCalloutsAboveDock = (enabled, sectionRef, calloutRefs) => {
  useEffect(() => {
    if (!enabled) return undefined;
    let raf = 0;
    let last = null;
    const placeCallouts = () => {
      raf = 0;
      const slot = document.querySelector("[data-dock-slot]");
      const sec = sectionRef.current;
      if (!slot || !sec) return;
      const bottom = Math.max(0, Math.round(sec.offsetHeight - slot.getBoundingClientRect().top + GAP));
      if (bottom === last) return;
      last = bottom;
      calloutRefs.current.forEach((el) => {
        if (el) el.style.bottom = `${bottom}px`;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(placeCallouts);
    };
    placeCallouts();
    // Browser bars come and go on scroll; some browsers fire resize, others
    // only visualViewport.
    const vv = window.visualViewport;
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    vv?.addEventListener("resize", schedule);
    const callouts = calloutRefs.current;
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      vv?.removeEventListener("resize", schedule);
      callouts.forEach((el) => {
        if (el) el.style.bottom = "";
      });
    };
  }, [enabled, sectionRef, calloutRefs]);
};
