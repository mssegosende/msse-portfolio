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
 * Start every load at the top (the inline script in index.html disables the
 * browser's scroll restoration, which would land mid-sequence). Not after a
 * phone theme reload: ScrollScene restores that position.
 */
export const pinScrollToTopOnReload = () => {
  if (pendingThemeReload) return;
  window.scrollTo(0, 0);
};

/**
 * Back to the very top: a jump, not a smooth scroll, which would play the
 * pinned sequence backwards. The scrub tweens are finished too, or the
 * timeline would still ease back for a second.
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
