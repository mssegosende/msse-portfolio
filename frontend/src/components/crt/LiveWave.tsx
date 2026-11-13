import { useEffect, useRef } from "react";

// Contact's live signals (María Sol, pre-launch: "more character, not a fixed
// shape sliding by"): the shape itself changes, its amplitude swelling and
// fading along the screen, a burst now and then, a little noise; behind it a
// faint pink ghost of the same signal, a moment late and a few units over,
// like LET'S TALK's ghost copies. ~30 frames a second while `live`; one
// still frame with reduced motion.

const vnoise = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return (v - Math.floor(v)) * 2 - 1;
  };
  const u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
};

/** The signal at u (0..1 across) and t (ms), about -1..1. `seed` sets it apart. */
const contactSignal = (u: number, t: number, seed = 0): number => {
  const tau = Math.PI * 2;
  const fr = 3.2 + 0.5 * Math.sin(t * 0.00041 + seed);
  // A swell that travels across and breathes.
  const env =
    0.45 + 0.3 * Math.sin(u * 4.2 - t * 0.0011 + seed) + 0.15 * Math.sin(t * 0.0007 + seed * 2);
  // A burst every ~3.6 s at a spot of its own.
  const cycle = t / 3600 + seed * 0.37;
  const since = (cycle - Math.floor(cycle)) * 3600;
  const at = (Math.floor(cycle) * 0.618 + 0.15 + seed * 0.1) % 1;
  const burst =
    Math.exp(-since / 300) * Math.exp(-(((u - at) / 0.08) ** 2)) * Math.sin(u * 160 + t * 0.04);
  return (
    env * Math.sin(tau * u * fr - t * 0.0032) +
    0.22 * Math.sin(tau * u * fr * 2.7 + t * 0.0019) +
    0.45 * burst +
    0.06 * vnoise(u * 48 + t * 0.01 + seed * 9)
  );
};

const path = (w: number, h: number, t: number, seed: number, dx = 0) => {
  let d = "";
  for (let x = 0; x <= w; x += 3) {
    const v = contactSignal(x / w, t, seed);
    const y = h / 2 - (h / 2 - 3) * 0.78 * Math.max(-1.25, Math.min(1.25, v));
    d += `${x === 0 ? "M" : "L"}${(x + dx).toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
};

/** How late and how far over the ghost trace runs. */
const GHOST_MS = 220;
const GHOST_DX = 4;

export const LiveWave = ({
  width,
  height,
  seed = 0,
  live,
  still,
  className = "",
}: {
  /** The drawing's units (viewBox); the SVG stretches to its box. */
  width: number;
  height: number;
  seed?: number;
  /** On screen: the loop runs only then. */
  live: boolean;
  /** Reduced motion: one still frame. */
  still: boolean;
  className?: string;
}) => {
  const mainRef = useRef<SVGPathElement>(null);
  const ghostRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    const draw = (t: number) => {
      mainRef.current?.setAttribute("d", path(width, height, t, seed));
      ghostRef.current?.setAttribute("d", path(width, height, t - GHOST_MS, seed, GHOST_DX));
    };
    draw(1500);
    if (still || !live) return undefined;
    let raf = 0;
    let lastDraw = 0;
    const t0 = performance.now() - 1500;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || now - lastDraw < 32) return;
      lastDraw = now;
      draw(now - t0);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [width, height, seed, live, still]);
  return (
    <svg
      aria-hidden="true"
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`block ${className}`}
    >
      <path ref={ghostRef} className="crt-wave-ghost" fill="none" strokeWidth="1.3" />
      <path ref={mainRef} className="crt-scope__wave" fill="none" strokeWidth="1.5" />
    </svg>
  );
};
