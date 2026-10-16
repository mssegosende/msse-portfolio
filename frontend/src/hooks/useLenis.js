import { useEffect } from "react";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { pendingThemeReload } from "@/lib/themeReload";

export const useLenis = () => {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis;
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
};

/**
 * The hero is pinned for +1040%, so scrollTo(heroElement) resolves to wherever
 * the pin currently holds it — which lands you in the middle of the sequence,
 * not at its start. The brand mark means "back to the beginning", so it goes
 * to absolute zero instead of to the element.
 */
/**
 * The scrollRestoration flag itself is set in the inline script in
 * index.html, because ScrollTrigger captures and restores that value while
 * building and a React effect is already too late. This just pins the
 * position once the app has mounted, for the case where the pin spacer
 * changed the document height after the browser settled.
 */
export const pinScrollToTopOnReload = () => {
  // La recarga del cambio de tema en celular vuelve a donde estaba el
  // visitante (la restaura ScrollScene, ver lib/themeReload.js).
  if (pendingThemeReload) return;
  window.scrollTo(0, 0);
};

/**
 * A jump, not a scroll. Scrolling there — however fast — travels back through
 * the whole pinned sequence and plays the hero in reverse on screen. The jump
 * alone is not enough either: the hero timeline is scrubbed (`scrub: 1`), so
 * it would still ease backwards for a second to catch up with the new
 * position. Forcing each scrub tween to its end lands it on the opening frame
 * in the same paint.
 */
export const scrollToTop = () => {
  if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0, behavior: "instant" });
  ScrollTrigger.update();
  ScrollTrigger.getAll().forEach((st) => st.getTween()?.progress(1));
};

export const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
};
