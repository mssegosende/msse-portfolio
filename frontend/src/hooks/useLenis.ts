import { useEffect } from "react";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { pendingThemeReload } from "@/lib/themeReload";

// The page's Lenis instance, while App is mounted.
let instance: Lenis | null = null;
export const getLenis = (): Lenis | null => instance;

export const useLenis = (): void => {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    instance = lenis;
    let raf: number;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      instance = null;
    };
  }, []);
};

/**
 * Start every load at the top (the inline script in index.html disables the
 * browser's scroll restoration, which would land mid-sequence). Not after a
 * phone theme reload: ScrollScene restores that position.
 */
export const pinScrollToTopOnReload = (): void => {
  if (pendingThemeReload) return;
  window.scrollTo(0, 0);
};

/**
 * Back to the very top: a jump, not a smooth scroll, which would play the
 * pinned sequence backwards. The scrub tweens are finished too, or the
 * timeline would still ease back for a second.
 */
export const scrollToTop = (): void => {
  if (instance) instance.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0, behavior: "instant" });
  ScrollTrigger.update();
  ScrollTrigger.getAll().forEach((st) => st.getTween()?.progress(1));
};

export const scrollToId = (id: string): void => {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
};
