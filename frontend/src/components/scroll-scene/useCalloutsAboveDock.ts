import { useEffect, type RefObject } from "react";

const GAP = 16;
/** Between scene 2's title and the rail, px. */
const UNDER_TITLE = 14;

/**
 * Phones: scene 2's rail and card right under the title (María Sol, 13 Nov),
 * kept 16px above the dock: on a short screen the block scales down (frame
 * and type together, from its top) instead of running under it. CSS units
 * can't: the pinned section is 100vh (on iOS, the height with the browser
 * bars hidden), so with the bars showing its bottom edge is off screen. The
 * dock is fixed to the visible edge, so it is the reference.
 */
export const useCalloutsAboveDock = (
  enabled: boolean,
  sectionRef: RefObject<HTMLElement | null>,
  cardRef: RefObject<HTMLElement | null>,
): void => {
  useEffect(() => {
    if (!enabled) return undefined;
    let raf = 0;
    let last = "";
    const placeCallouts = () => {
      raf = 0;
      const slot = document.querySelector("[data-dock-slot]");
      const sec = sectionRef.current;
      const card = cardRef.current;
      if (!slot || !sec || !card) return;
      const title = sec.querySelector<HTMLElement>('[data-testid="capabilities-title"]');
      const top = Math.round((title ? title.offsetTop + title.offsetHeight : 90) + UNDER_TITLE);
      // The section is pinned at the viewport's top while this shows.
      const room = slot.getBoundingClientRect().top - GAP - top;
      const k = Math.min(1, room / Math.max(1, card.offsetHeight));
      const key = `${top}:${k.toFixed(3)}`;
      if (key === last) return;
      last = key;
      card.style.top = `${top}px`;
      card.style.bottom = "auto";
      card.style.transformOrigin = "50% 0";
      card.style.scale = k < 1 ? String(Math.max(0.6, k)) : "";
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(placeCallouts);
    };
    placeCallouts();
    // Browser bars come and go on scroll; some browsers fire resize, others
    // only visualViewport. The card's height changes with the step.
    const vv = window.visualViewport;
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    vv?.addEventListener("resize", schedule);
    const card = cardRef.current;
    const ro = typeof ResizeObserver === "undefined" || !card ? null : new ResizeObserver(schedule);
    if (card) ro?.observe(card);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      vv?.removeEventListener("resize", schedule);
      ro?.disconnect();
      if (card) {
        card.style.top = "";
        card.style.bottom = "";
        card.style.scale = "";
      }
    };
  }, [enabled, sectionRef, cardRef]);
};
