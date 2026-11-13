import { useEffect, useState, type RefObject } from "react";

/**
 * True while the element covers the viewport's middle line: the one section
 * that "has" the screen. The background words (WORK, HUMAN, TALK) show only
 * then, so two never share the screen at a boundary (María Sol, pre-launch:
 * on phones HUMAN still showed at the bottom while TALK came in at the top).
 */
export const useOwnsCenter = (ref: RefObject<HTMLElement | null>): boolean => {
  const [owns, setOwns] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setOwns(!!e?.isIntersecting), {
      rootMargin: "-50% 0px -50% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return owns;
};
