import { useEffect, useState, type RefObject } from "react";

// Same rule as the section index (lib/sections.ts): a section is reached when
// its top passes 40 % of the viewport, and its steps split its height evenly.
// Kept in step so the index and the section's own reveal agree.
const PROBE = 0.4;

/**
 * The step a scrolled section is on: -1 before it is reached, then 0 to
 * `steps - 1`.
 */
export const useSectionStep = (ref: RefObject<HTMLElement | null>, steps: number): number => {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      // +1: the index counts a step as reached one pixel early.
      const rect = el.getBoundingClientRect();
      const p = (window.innerHeight * PROBE - rect.top + 1) / el.offsetHeight;
      // A section only a little taller than the screen (phones) never moves its
      // top far enough for its last step: its bottom on screen counts as the end.
      const atEnd = rect.bottom <= window.innerHeight + 1;
      setStep(p < 0 ? -1 : atEnd ? steps - 1 : Math.min(steps - 1, Math.floor(p * steps)));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref, steps]);

  return step;
};
