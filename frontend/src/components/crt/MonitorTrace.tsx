import { useEffect, useRef } from "react";

// A hospital-monitor trace (María Sol, pre-launch): a signal written left to
// right by a glowing head, the older trace fading behind it, a short gap ahead
// of the head where the last sweep is wiped. About's ECG and Contact's pulse
// and breathing. One frame per animation frame while on screen; still with
// reduced motion (one whole sweep, no head).

/** The trail's fade: these shares of a sweep, from newest to oldest. */
const TRAIL = [1, 0.78, 0.58, 0.42, 0.28, 0.16];

export interface MonitorTraceProps {
  /** The signal at t (ms): about -0.3..1, 1 the top of its range. */
  signal: (t: number) => number;
  /** The drawing's units (viewBox); the SVG fills its box. */
  width: number;
  height: number;
  /** One sweep across, ms. */
  sweepMs: number;
  /** Where 0 sits (share of the height from the top) and how far 1 reaches up. */
  baseline?: number;
  scale?: number;
  reduced: boolean;
  /** Each frame, with the time drawn and the time drawn before (the ECG's beep). */
  onFrame?: (elapsed: number, before: number) => void;
}

export const MonitorTrace = ({
  signal,
  width,
  height,
  sweepMs,
  baseline = 0.64,
  scale = 0.52,
  reduced,
  onFrame,
}: MonitorTraceProps) => {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const headRef = useRef<SVGCircleElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // The latest callbacks, without restarting the loop.
  const signalRef = useRef(signal);
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    signalRef.current = signal;
    onFrameRef.current = onFrame;
  });

  useEffect(() => {
    const y = (v: number) => height * baseline - v * height * scale;
    const gap = width * 0.023;
    const step = Math.max(1, Math.round(width / 300));
    const sig = (t: number) => signalRef.current(t);
    if (reduced) {
      let d = "";
      for (let x = 0; x <= width; x += step)
        d += `${x ? "L" : "M"}${x} ${y(sig(1200 + (x / width) * sweepMs)).toFixed(1)} `;
      pathRefs.current.forEach((p, i) => p?.setAttribute("d", i === 0 ? d : ""));
      return undefined;
    }
    const speed = width / sweepMs;
    const draw = (elapsed: number) => {
      const head = (elapsed * speed) % width;
      const paths = TRAIL.map(() => "");
      let prev: { b: number; x: number; y: number } | null = null;
      for (let x = 0; x <= width; x += step) {
        const age = (head - x + width) % width;
        if (age > width - gap) {
          prev = null;
          continue;
        }
        const py = y(sig(elapsed - age / speed));
        const b = Math.min(TRAIL.length - 1, Math.floor((age / width) * TRAIL.length));
        if (!prev || prev.b !== b) {
          // A new piece: from the last point, so the pieces join.
          paths[b] += prev
            ? `M${prev.x} ${prev.y.toFixed(1)} L${x} ${py.toFixed(1)} `
            : `M${x} ${py.toFixed(1)} `;
        } else paths[b] += `L${x} ${py.toFixed(1)} `;
        prev = { b, x, y: py };
      }
      paths.forEach((d, i) => pathRefs.current[i]?.setAttribute("d", d));
      headRef.current?.setAttribute("cx", head.toFixed(1));
      headRef.current?.setAttribute("cy", y(sig(elapsed)).toFixed(1));
    };
    draw(0);
    let onScreen = false;
    let raf = 0;
    const t0 = performance.now();
    let before = 0;
    const loop = () => {
      raf = 0;
      if (!onScreen || document.hidden) return;
      const elapsed = performance.now() - t0;
      draw(elapsed);
      onFrameRef.current?.(elapsed, before);
      before = elapsed;
      raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([e]) => {
            onScreen = !!e?.isIntersecting;
            wake();
          });
    if (svgRef.current) io?.observe(svgRef.current);
    document.addEventListener("visibilitychange", wake);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [width, height, sweepMs, baseline, scale, reduced]);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block"
    >
      {TRAIL.map((o, i) => (
        <path
          key={o}
          ref={(el) => {
            pathRefs.current[i] = el;
          }}
          className="crt-scope__wave"
          fill="none"
          strokeWidth="1.6"
          style={{ opacity: reduced && i === 0 ? 1 : o }}
        />
      ))}
      {!reduced && <circle ref={headRef} r="2.4" className="crt-scope__head" />}
    </svg>
  );
};
