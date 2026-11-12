import { useEffect, useState, type RefObject } from "react";
import { SECTION_XF_VH } from "@/components/scroll-scene/choreography";

// Same rule as the section index (lib/sections.ts): a section is reached when
// its top passes 40 % of the viewport, and its steps split its height evenly.
// Kept in step so the index and the section's own reveal agree.
const PROBE = 0.4;

/**
 * How far into a scrolled section the visitor is, on the index's scale: below
 * 0 before it is reached, then 0 to 1 over the section's height (step k of n
 * starts at k / n). For reveals finer than the index's steps.
 * `crossfaded`: the section crossfades in and out (desktop with motion,
 * <html data-xf="on">; useSectionDissolve), which takes a crossfade's scroll
 * at each end (its CSS adds both): the progress runs between them, so its
 * reveal keeps its pace.
 */
export const useSectionProgress = (
  ref: RefObject<HTMLElement | null>,
  crossfaded = false,
): number => {
  const [progress, setProgress] = useState(-1);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const xf =
        crossfaded && document.documentElement.dataset.xf === "on"
          ? (window.innerHeight * SECTION_XF_VH) / 100
          : 0;
      setProgress((window.innerHeight * PROBE - rect.top - xf + 1) / (el.offsetHeight - 2 * xf));
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
  }, [ref, crossfaded]);

  return progress;
};

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
