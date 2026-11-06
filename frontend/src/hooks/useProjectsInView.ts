import { useEffect, type RefObject } from "react";
import { setProjectsInView } from "@/lib/sceneFocus";

/**
 * Marks scene 3 as in view while it covers the middle of the screen (from
 * its arrival until it has mostly scrolled away), so the Spline scenes pause.
 */
export const useProjectsInView = (ref: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setProjectsInView(!!e?.isIntersecting), {
      rootMargin: "-45% 0px -45% 0px",
    });
    io.observe(el);
    return () => {
      io.disconnect();
      setProjectsInView(false);
    };
  }, [ref]);
};
