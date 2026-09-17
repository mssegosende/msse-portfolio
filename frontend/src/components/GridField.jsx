import { useEffect, useRef } from "react";

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
    let t = 0;
    let grid = [];
    let cols = 0;
    let rows = 0;
    const mouse = { x: -9999, y: -9999, cx: 0, cy: 0, active: false };

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
      cols = Math.ceil(w / STEP) + 1;
      rows = Math.ceil(h / STEP) + 1;
      grid = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) row.push({ x: c * STEP, y: r * STEP, ox: 0, oy: 0 });
        grid.push(row);
      }
    };

    const step = () => {
      t += 0.004;
      const rect = canvas.getBoundingClientRect();
      mouse.x = mouse.cx - rect.left;
      mouse.y = mouse.cy - rect.top;
      mouse.active =
        !isTouch && mouse.y > -RADIUS && mouse.y < rect.height + RADIUS;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = grid[r][c];
          let tx = 0;
          let ty = 0;
          if (isTouch) {
            tx = Math.sin(p.x * 0.012 + t) * 5;
            ty = Math.cos(p.y * 0.014 + t * 0.8) * 5;
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
      ctx.strokeStyle = `rgba(255,255,255,${baseAlpha})`;
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
            ctx.strokeStyle = `rgba(255,255,255,${(0.06 + 0.16 * (1 - d / RADIUS)) * intensity})`;
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
