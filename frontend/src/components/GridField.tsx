import { useEffect, useRef } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/motion";

// Scene 5's grid, recoloured to the CRT phosphor (SPEC §7; laid as a
// perspective floor by its container in Contact.module.css). Originally
// (design/source/desktop/light/scene-5-contact.dc.html): lines
// every 72 px (39 px on phones), ink at 20 %, faded in from the top by a mask,
// bulging around the cursor. Each point is pushed away from the cursor by
// d * exp(-d² / R²) * K. Touch screens and reduced motion get the still grid.
const STEP_DESKTOP = 72;
const STEP_PHONE = 39;
const SUB = 24; // sample spacing along each line, so the bulge curves
const R = 190;
const K = 0.42;
const EASE = 0.14;

const MASK = "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 25%, #000 55%)";

export const GridField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still =
      window.matchMedia(REDUCED_MOTION_QUERY).matches ||
      window.matchMedia("(pointer: coarse)").matches;

    let w = 0;
    let h = 0;
    let step = STEP_DESKTOP;
    let raf = 0;
    let visible = false;
    // Where the bulge is (eased) and where it is heading, in canvas px.
    const cur = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const client = { x: 0, y: 0, moved: false };

    // A 2D canvas can't use CSS classes, so the colour is read from the root
    // token (the CRT floor's phosphor, --crt-floor) and re-read when the theme
    // attribute changes.
    let ink = "rgba(31, 95, 175, 0.22)";
    const readInk = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--crt-floor").trim();
      if (v) ink = v;
      draw();
    };

    const warp = (x: number, y: number): [number, number] => {
      const dx = x - cur.x;
      const dy = y - cur.y;
      const f = Math.exp(-(dx * dx + dy * dy) / (R * R)) * K;
      return [x + dx * f, y + dy * f];
    };

    function draw() {
      if (!w || !h) return;
      ctx!.clearRect(0, 0, w, h);
      ctx!.lineWidth = 1;
      ctx!.strokeStyle = ink;
      ctx!.beginPath();
      for (let x = 0; x <= w + step; x += step) {
        for (let y = 0; y <= h + SUB; y += SUB) {
          const [px, py] = warp(x, y);
          if (y === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
      }
      for (let y = 0; y <= h + step; y += step) {
        for (let x = 0; x <= w + SUB; x += SUB) {
          const [px, py] = warp(x, y);
          if (x === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
      }
      ctx!.stroke();
    }

    const build = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      step = w < 768 ? STEP_PHONE : STEP_DESKTOP;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (still && w < 768) {
        // Phones: a flat grid, no bulge.
        cur.x = target.x = -9999;
        cur.y = target.y = -9999;
      } else if (!client.moved) {
        // Before the pointer arrives: the bulge rests bottom-right, as in the mock.
        cur.x = target.x = w * 0.82;
        cur.y = target.y = h * 0.84;
      }
      draw();
    };

    const loop = () => {
      raf = 0;
      if (!visible) return;
      if (client.moved) {
        const rect = canvas.getBoundingClientRect();
        target.x = client.x - rect.left;
        target.y = client.y - rect.top;
      }
      cur.x += (target.x - cur.x) * EASE;
      cur.y += (target.y - cur.y) * EASE;
      draw();
      if (Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.5) {
        raf = requestAnimationFrame(loop);
      }
    };
    const kick = () => {
      if (!raf && visible && !still) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      kick();
    });
    io.observe(canvas);

    const onMove = (e: MouseEvent) => {
      client.x = e.clientX;
      client.y = e.clientY;
      client.moved = true;
      kick();
    };
    const themeObserver = new MutationObserver(readInk);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const resize = new ResizeObserver(build);
    if (canvas.parentElement) resize.observe(canvas.parentElement);
    if (!still) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("scroll", kick, { passive: true });
    }
    readInk();
    build();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      resize.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", kick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="grid-field"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ WebkitMaskImage: MASK, maskImage: MASK }}
    />
  );
};
