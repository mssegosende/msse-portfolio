import { useEffect, useRef } from "react";

// One page-wide grid drawn in pieces: each section has its own canvas, and
// each offsets its lines by where it sits in the document so they line up
// across section boundaries. The touch drift uses page coordinates and a
// shared clock for the same reason.
interface GridPoint {
  x: number;
  y: number;
  ox: number;
  oy: number;
}

export const GridField = ({ intensity = 1 }: { intensity?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    const STEP = 56;
    const RADIUS = 220;
    const PUSH = 26;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    let grid: GridPoint[][] = [];
    // In range by construction: r < rows, c < cols.
    const pt = (r: number, c: number) => grid[r]![c]!;
    let cols = 0;
    let rows = 0;
    const mouse = { x: -9999, y: -9999, cx: 0, cy: 0, active: false };

    // A 2D canvas can't use CSS classes, so the colour is read from the root
    // token, cached, and invalidated when the theme attribute changes.
    let inkChannels = "255 255 255";
    const readInk = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim();
      if (v) inkChannels = v;
    };
    readInk();
    const themeObserver = new MutationObserver(readInk);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const build = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // +2: the page-aligned grid starts up to one STEP before the canvas.
      cols = Math.ceil(w / STEP) + 2;
      rows = Math.ceil(h / STEP) + 2;
      grid = [];
      for (let r = 0; r < rows; r++) {
        const row: GridPoint[] = [];
        for (let c = 0; c < cols; c++) row.push({ x: c * STEP, y: r * STEP, ox: 0, oy: 0 });
        grid.push(row);
      }
    };

    const step = () => {
      // Shared clock, so every canvas reads the same t on the same frame.
      const t = performance.now() * 0.00024;
      const rect = canvas.getBoundingClientRect();
      // Read every frame: the pin spacer, fonts and images move sections
      // after mount.
      const docLeft = rect.left + window.scrollX;
      const docTop = rect.top + window.scrollY;
      const offX = ((docLeft % STEP) + STEP) % STEP;
      const offY = ((docTop % STEP) + STEP) % STEP;
      mouse.x = mouse.cx - rect.left;
      mouse.y = mouse.cy - rect.top;
      mouse.active = !isTouch && mouse.y > -RADIUS && mouse.y < rect.height + RADIUS;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = pt(r, c);
          p.x = c * STEP - offX;
          p.y = r * STEP - offY;
          let tx = 0;
          let ty = 0;
          if (isTouch) {
            // Applied directly, not eased: a canvas scrolling into view must
            // already match its neighbour.
            p.ox = Math.sin((docLeft + p.x) * 0.012 + t) * 5;
            p.oy = Math.cos((docTop + p.y) * 0.014 + t * 0.8) * 5;
            continue;
          } else if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const d = Math.hypot(dx, dy);
            if (d < RADIUS && d > 0.01) {
              const f = (1 - d / RADIUS) ** 2 * PUSH;
              tx = (dx / d) * f;
              ty = (dy / d) * f;
            }
          }
          p.ox += (tx - p.ox) * 0.07;
          p.oy += (ty - p.oy) * 0.07;
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;

      // base pass — barely perceptible
      const baseAlpha = 0.06 * intensity;
      ctx.strokeStyle = `rgb(${inkChannels} / ${baseAlpha})`;
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const p = pt(r, c);
          if (c === 0) ctx.moveTo(p.x + p.ox, p.y + p.oy);
          else ctx.lineTo(p.x + p.ox, p.y + p.oy);
        }
        ctx.stroke();
      }
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const p = pt(r, c);
          if (r === 0) ctx.moveTo(p.x + p.ox, p.y + p.oy);
          else ctx.lineTo(p.x + p.ox, p.y + p.oy);
        }
        ctx.stroke();
      }

      // brighten pass — segments near the pointer
      if (mouse.active) {
        const seg = (a: GridPoint, b: GridPoint) => {
          const mx = (a.x + a.ox + b.x + b.ox) / 2 - mouse.x;
          const my = (a.y + a.oy + b.y + b.oy) / 2 - mouse.y;
          const d = Math.hypot(mx, my);
          if (d < RADIUS) {
            ctx.strokeStyle = `rgb(${inkChannels} / ${(0.06 + 0.16 * (1 - d / RADIUS)) * intensity})`;
            ctx.beginPath();
            ctx.moveTo(a.x + a.ox, a.y + a.oy);
            ctx.lineTo(b.x + b.ox, b.y + b.oy);
            ctx.stroke();
          }
        };
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols - 1; c++) seg(pt(r, c), pt(r, c + 1));
        for (let c = 0; c < cols; c++)
          for (let r = 0; r < rows - 1; r++) seg(pt(r, c), pt(r + 1, c));
      }
    };

    const loop = () => {
      if (!visible) return;
      step();
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);

    const onMove = (e: MouseEvent) => {
      mouse.cx = e.clientX;
      mouse.cy = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", build);
    build();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", build);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="grid-field"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
};
