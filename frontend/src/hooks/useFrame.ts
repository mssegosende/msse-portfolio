import { useEffect, useState } from "react";
import { layoutViewport } from "@/lib/capture";

/** The designs' frame (design/crt/.../*.dc.html, desktop). */
export const FRAME = { width: 1440, height: 900 };

export interface Frame {
  width: number;
  height: number;
  /** The window's width and height in units of the 1440 x 900 frame. */
  kw: number;
  kh: number;
}

// The window, or the reference frame in capture mode (lib/capture).
const read = (): Frame => {
  const { width, height } = layoutViewport();
  return { width, height, kw: width / FRAME.width, kh: height / FRAME.height };
};

/**
 * The window measured against the 1440 x 900 design frame, kept up to date
 * (one update per frame while a resize drags). Desktop cards scale by these:
 * a card keeps its share of the frame's width, capped where the height
 * runs out, so it never overflows or reaches the title or the dock.
 */
export const useFrame = (): Frame => {
  const [frame, setFrame] = useState(read);
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setFrame((cur) => {
          const next = read();
          return cur.width === next.width && cur.height === next.height ? cur : next;
        });
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return frame;
};

/** Clamp a scale to what still reads (small windows) and what still looks designed (huge ones). */
export const clampScale = (k: number, min = 0.6, max = 2.2) => Math.min(max, Math.max(min, k));

/** Where a point of the 1440 x 900 frame lands, as CSS percentages. */
export const at = (x: number, y: number) => ({
  left: `${(x / FRAME.width) * 100}%`,
  top: `${(y / FRAME.height) * 100}%`,
});
