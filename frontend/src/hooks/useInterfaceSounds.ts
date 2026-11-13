import { useEffect } from "react";
import { confirmChirp, glitchBurst, GLITCH_SOUND, selectBleep } from "@/lib/sound";

// What the interface sounds answer to, by delegation (no markup of their own).
const CONTROLS = [
  '[data-testid="navigation-dock"] button',
  '[data-testid="capability-rail"] button',
  '[data-testid^="project-card-"]',
  '[data-testid="project-featured"]',
].join(", ");

const HOVER_MS = 90;
const GLITCH_MS = 400;

/**
 * The interface's sounds (María Sol, pre-launch; silent unless SOUND is on):
 * a select bleep when the pointer enters a dock item, a rail button or a
 * project card (throttled), a confirm chirp on their click, and a glitch
 * burst when a portrait or project glitch fires on screen.
 */
export const useInterfaceSounds = () => {
  useEffect(() => {
    let lastHover = 0;
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const el = (e.target as Element | null)?.closest?.(CONTROLS);
      if (!el || el.contains(e.relatedTarget as Node | null)) return;
      const now = performance.now();
      if (now - lastHover < HOVER_MS) return;
      lastHover = now;
      selectBleep();
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.(CONTROLS)) confirmChirp();
    };
    // The glitches are CSS loops that flash near the end of each cycle
    // (96-100 %): from one cycle's start, the next flash is ~96.5 % away.
    let lastGlitch = 0;
    const timers = new Set<number>();
    const onIteration = (e: AnimationEvent) => {
      if (!GLITCH_SOUND || !/glitch/.test(e.animationName)) return;
      const el = e.target as HTMLElement;
      const ms = parseFloat(getComputedStyle(el).animationDuration) * 1000;
      if (!Number.isFinite(ms) || ms <= 0) return;
      const t = window.setTimeout(() => {
        timers.delete(t);
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight || !r.width) return;
        const now = performance.now();
        if (now - lastGlitch < GLITCH_MS) return;
        lastGlitch = now;
        glitchBurst();
      }, ms * 0.965);
      timers.add(t);
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("click", onClick, true);
    document.addEventListener("animationiteration", onIteration);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("animationiteration", onIteration);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
};
