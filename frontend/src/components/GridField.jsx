import { useEffect, useRef } from "react";

// One grid for the whole page, drawn in pieces. Each section that carries a
// GridField has its own canvas, and each used to start its grid at its OWN
// top-left -- so at every section boundary the lines jumped by the upper
// section's height mod STEP (up to 43px on a phone). Every canvas now puts its
// lines where the page-wide grid would have them: the origin is the top-left
// of the DOCUMENT, and each canvas offsets by where it sits in it. The touch
// drift is a function of page coordinates and a shared clock for the same
// reason, so a line crossing a boundary moves as one line.
export const GridField = ({ intensity = 1 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    const STEP = 56;
    const RADIUS = 220;
    const PUSH = 26;
    let w = 0;
    let h = 0;
    let raf = null;
    let visible = false;
    let grid = [];
    let cols = 0;
    let rows = 0;
    const mouse = { x: -9999, y: -9999, cx: 0, cy: 0, active: false };

    // 2D canvas takes no CSS classes, so the grid colour has to be read off
    // the root token. getComputedStyle is far too slow to call per frame, so
    // it is cached here and invalidated when the theme attribute flips.
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
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // +2: the page-aligned grid starts up to one STEP above/left of the
      // canvas, so it needs one extra line to still reach the far edge.
      cols = Math.ceil(w / STEP) + 2;
      rows = Math.ceil(h / STEP) + 2;
      grid = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) row.push({ x: c * STEP, y: r * STEP, ox: 0, oy: 0 });
        grid.push(row);
      }
    };

    const step = () => {
      // Shared clock: every canvas reads the same t on the same frame. It is
      // the old 0.004 per frame, expressed per millisecond at 60fps.
      const t = performance.now() * 0.00024;
      const rect = canvas.getBoundingClientRect();
      // Where this canvas sits in the document, and so where the page grid's
      // lines fall inside it. Read per frame: the pin spacer, fonts and
      // images all move sections after mount, and this rect is already here.
      const docLeft = rect.left + window.scrollX;
      const docTop = rect.top + window.scrollY;
      const offX = ((docLeft % STEP) + STEP) % STEP;
      const offY = ((docTop % STEP) + STEP) % STEP;
      mouse.x = mouse.cx - rect.left;
      mouse.y = mouse.cy - rect.top;
      mouse.active =
        !isTouch && mouse.y > -RADIUS && mouse.y < rect.height + RADIUS;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = grid[r][c];
          p.x = c * STEP - offX;
          p.y = r * STEP - offY;
          let tx = 0;
          let ty = 0;
          if (isTouch) {
            // Page coordinates, and applied directly rather than eased: a
            // canvas that just scrolled into view must already agree with its
            // neighbour instead of catching up to it.
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
          const p = grid[r][c];
          if (c === 0) ctx.moveTo(p.x + p.ox, p.y + p.oy);
          else ctx.lineTo(p.x + p.ox, p.y + p.oy);
        }
        ctx.stroke();
      }
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const p = grid[r][c];
          if (r === 0) ctx.moveTo(p.x + p.ox, p.y + p.oy);
          else ctx.lineTo(p.x + p.ox, p.y + p.oy);
        }
        ctx.stroke();
      }

      // brighten pass — segments near the pointer
      if (mouse.active) {
        const seg = (a, b) => {
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
          for (let c = 0; c < cols - 1; c++) seg(grid[r][c], grid[r][c + 1]);
        for (let c = 0; c < cols; c++)
          for (let r = 0; r < rows - 1; r++) seg(grid[r][c], grid[r + 1][c]);
      }
    };

    const loop = () => {
      if (!visible) return;
      step();
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);

    const onMove = (e) => {
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
