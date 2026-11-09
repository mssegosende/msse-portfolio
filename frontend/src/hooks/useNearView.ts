import { useEffect, useState, type RefObject } from "react";

/**
 * True from the first time the element comes within `margin` of the
 * viewport, and from then on. Media that isn't on screen at load waits for
 * it, so it doesn't compete with the page for the network.
 */
export const useNearView = (ref: RefObject<HTMLElement | null>, margin = "100% 0px"): boolean => {
  // Without IntersectionObserver there is nothing to wait for.
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setNear(true);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);
  return near;
};
