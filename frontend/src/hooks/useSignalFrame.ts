import { useEffect, useRef, useState } from "react";
import { CONSTELLATIONS } from "@/data/constellations";
import { signalFrame, stillFrame, type SignalFrame } from "@/lib/constellations";

const STILL = stillFrame(CONSTELLATIONS);

const same = (a: SignalFrame, b: SignalFrame) =>
  a.index === b.index &&
  a.typed === b.typed &&
  a.stars === b.stars &&
  a.segments === b.segments &&
  Math.abs(a.opacity - b.opacity) < 0.02;

/**
 * SIGNAL's constellation sequence (lib/constellations): it runs only while
 * `on` (the section on screen) and keeps its place while paused; with reduced
 * motion, POLARIS, still. Renders only when the frame changes.
 */
export const useSignalFrame = (on: boolean, still: boolean): SignalFrame => {
  const [frame, setFrame] = useState<SignalFrame>(() => signalFrame(CONSTELLATIONS, 0));
  const elapsed = useRef(0);

  useEffect(() => {
    if (still || !on) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const next = signalFrame(CONSTELLATIONS, elapsed.current);
      setFrame((cur) => (same(cur, next) ? cur : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, still]);

  return still ? STILL : frame;
};
