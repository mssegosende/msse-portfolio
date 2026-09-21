import { useEffect } from "react";
import Lenis from "lenis";

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
  window.scrollTo(0, 0);
};

export const scrollToTop = () => {
  if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.4 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
};

export const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
};
