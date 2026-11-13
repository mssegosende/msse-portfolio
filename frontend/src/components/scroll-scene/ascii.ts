// Scene 2's ASCII object (SPEC §3), ported from the design's renderer
// (design/crt/msse-crt-redesign/design-source/Main.dc.html: sdf, ascii, wave):
// ray-marched signed distance fields drawn as characters. Pure functions, no
// DOM: AsciiObject.tsx owns the timing.

/** Darkest to brightest. */
export const RAMP = " .`'-:;~=+*xzXUOZ0#%@";

/** Shapes by step: 0 sphere (MIND), 1 torus (INTERFACE), 2 rounded cube (ENGINE). */
export type Shape = 0 | 1 | 2;

const TORUS_TILT_C = Math.cos(1.1);
const TORUS_TILT_S = Math.sin(1.1);

/** Signed distance from (x, y, z) to the shape's surface. */
export const sdf = (kind: Shape, x: number, y: number, z: number): number => {
  if (kind === 0) return Math.sqrt(x * x + y * y + z * z) - 0.82;
  if (kind === 1) {
    const y2 = y * TORUS_TILT_C - z * TORUS_TILT_S;
    const z2 = y * TORUS_TILT_S + z * TORUS_TILT_C;
    const qx = Math.sqrt(x * x + z2 * z2) - 0.6;
    return Math.sqrt(qx * qx + y2 * y2) - 0.27;
  }
  const b = 0.52;
  const r = 0.07;
  const qx = Math.abs(x) - b;
  const qy = Math.abs(y) - b;
  const qz = Math.abs(z) - b;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const oz = Math.max(qz, 0);
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
};

const hash = (n: number): number => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

/** Glitch: 180 ms of shifted rows every 3.4 s. */
export const GLITCH_PERIOD_MS = 3400;
export const GLITCH_MS = 180;
/** Morph between shapes, eased with smoothstep. */
export const MORPH_MS = 900;
/** The design's tick: ~14 fps. */
export const TICK_MS = 70;

export const smoothstep = (k: number): number => {
  const c = Math.max(0, Math.min(1, k));
  return c * c * (3 - 2 * c);
};

export interface AsciiFrame {
  cols: number;
  rows: number;
  /** Time, ms: drives the rotation and the glitch. */
  t: number;
  prev: Shape;
  step: Shape;
  /** Morph progress 0..1 from prev to step (already eased). */
  k: number;
  /** Shifted rows on the glitch beat (off with reduced motion). */
  glitch: boolean;
}

// Light from the top left.
const LX = -0.45;
const LY = 0.55;
const LZ = -0.7;
const LN = Math.sqrt(LX * LX + LY * LY + LZ * LZ);

/** One frame of the object as rows of characters, joined with newlines. */
export const renderAscii = ({ cols, rows, t, prev, step, k, glitch }: AsciiFrame): string => {
  const R = (rows / 2) * 0.98;
  const ay = t * 0.0006;
  const ax = 0.4 + 0.3 * Math.sin(t * 0.00035);
  const cy = Math.cos(ay);
  const sy = Math.sin(ay);
  const cx = Math.cos(ax);
  const sx = Math.sin(ax);
  const mixing = prev !== step && k < 1;
  let lx = 0;
  let ly = 0;
  let lz = 0;
  const f = (x: number, y: number, z: number): number => {
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    const y1 = y * cx - z1 * sx;
    const z2 = y * sx + z1 * cx;
    lx = x1;
    ly = y1;
    lz = z2;
    const b = sdf(step, x1, y1, z2);
    if (!mixing) return b;
    const a = sdf(prev, x1, y1, z2);
    return a + (b - a) * k;
  };
  // The sphere's latitude / longitude lines, weighted through the morph.
  let w0 = 0;
  if (step === 0) w0 += mixing ? k : 1;
  if (prev === 0 && mixing) w0 += 1 - k;
  const onGlitch = glitch && t % GLITCH_PERIOD_MS < GLITCH_MS;
  const seed = Math.floor(t / 90);
  const lines: string[] = [];
  for (let j = 0; j < rows; j++) {
    const v = -(j + 0.5 - rows / 2) / R;
    let line = "";
    for (let i = 0; i < cols; i++) {
      const u = ((i + 0.5 - cols / 2) * 0.6) / R;
      let z = -2;
      let hit = false;
      for (let s = 0; s < 32; s++) {
        const d = f(u, v, z);
        if (d < 0.004) {
          hit = true;
          break;
        }
        z += d;
        if (z > 2) break;
      }
      if (!hit) {
        line += " ";
        continue;
      }
      const hx = lx;
      const hy = ly;
      const hz = lz;
      const e = 0.01;
      const nx = f(u + e, v, z) - f(u - e, v, z);
      const ny = f(u, v + e, z) - f(u, v - e, z);
      const nz = f(u, v, z + e) - f(u, v, z - e);
      const nn = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const diff = Math.max(0, (nx * LX + ny * LY + nz * LZ) / (nn * LN));
      let lum = 0.1 + 0.85 * diff;
      if (w0 > 0) {
        const r = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
        const lat = Math.asin(Math.max(-1, Math.min(1, hy / r)));
        const lon = Math.atan2(hz, hx);
        const st = Math.PI / 9;
        const fa = Math.abs(lat / st - Math.round(lat / st));
        const fo = Math.abs(lon / st - Math.round(lon / st));
        if (fa < 0.09 || fo < 0.07) lum += 0.4 * w0;
        else lum -= 0.12 * w0;
      }
      const idx = Math.max(1, Math.floor(Math.max(0, Math.min(1, lum)) * (RAMP.length - 1)));
      line += RAMP[idx];
    }
    if (onGlitch && hash(j * 13.1 + seed) > 0.8) {
      const n = 1 + Math.floor(hash(j + seed * 7.3) * 6);
      line = " ".repeat(n) + line.slice(0, cols - n);
    }
    lines.push(line);
  }
  return lines.join("\n");
};

// ---- The oscilloscope under the card: a live signal (María Sol, pre-launch:
// not a fixed wave panning by). Its own shape changes over time (amplitude
// and frequency drift, a little noise, now and then a burst) and follows the
// card's object: MIND (sphere) a smooth breathing sine, INTERFACE (torus) two
// interleaved frequencies, ENGINE (cube) a stepped digital wave. t in ms.

/** Smooth value noise in [-1, 1]. */
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

/** One shape's signal at x (0..1 across the screen), in [-1, 1]-ish. */
export const scopeSignal = (shape: Shape, x: number, t: number): number => {
  // ENGINE holds every value for a step (noise and bursts too): a digital trace.
  const u = shape === 2 ? Math.floor(x * 64) / 64 : x;
  // Drifts shared by every shape: amplitude and frequency wander slowly.
  const amp = 0.62 + 0.2 * Math.sin(t * 0.00071) + 0.1 * Math.sin(t * 0.00193 + 1.3);
  const fr = 1 + 0.16 * Math.sin(t * 0.00047) + 0.06 * Math.sin(t * 0.0013 + 0.7);
  // A burst every ~4.2 s: a fast ripple that flares at one spot and dies out.
  const cycle = t / 4200;
  const since = (cycle - Math.floor(cycle)) * 4200;
  const at = (Math.floor(cycle) * 0.618 + 0.2) % 1;
  const burst =
    Math.exp(-since / 260) * Math.exp(-(((u - at) / 0.07) ** 2)) * Math.sin(u * 190 + t * 0.03);
  const noise = 0.05 * vnoise(u * 60 + t * 0.012);
  const tau = Math.PI * 2;
  let v: number;
  if (shape === 0) {
    // MIND: one smooth sine, breathing.
    const breath = 0.72 + 0.28 * Math.sin(t * 0.0011);
    v = amp * breath * Math.sin(tau * u * 2.6 * fr - t * 0.0021);
  } else if (shape === 1) {
    // INTERFACE: two frequencies interleaved, beating against each other.
    v =
      amp *
      (0.58 * Math.sin(tau * u * 3.4 * fr - t * 0.0026) +
        0.42 * Math.sin(tau * u * 8.7 * fr + t * 0.0041));
  } else {
    // ENGINE: a stepped digital wave: a square carrier, quantized, held.
    const raw =
      Math.sign(Math.sin(tau * u * 5 * fr - t * 0.0024)) * 0.7 +
      0.3 * Math.sin(tau * u * 1.3 - t * 0.0013);
    v = amp * (Math.round(raw * 3) / 3);
  }
  return v + 0.35 * burst + noise;
};

/**
 * The oscilloscope's path, w x h: the shape `step`, morphing from `from` by
 * k (0..1, eased by the caller).
 */
export const wavePath = (
  t: number,
  step: Shape,
  w: number,
  h: number,
  from: Shape = step,
  k = 1,
): string => {
  let d = "";
  for (let x = 0; x <= w; x += 3) {
    const u = x / w;
    const a = scopeSignal(step, u, t);
    const v = k >= 1 ? a : scopeSignal(from, u, t) * (1 - k) + a * k;
    const y = h / 2 - h * 0.4 * Math.max(-1.15, Math.min(1.15, v));
    d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
  }
  // The last sample on the right edge, whatever the step.
  if (w % 3) d += `L${w} ${(h / 2 - h * 0.4 * scopeSignal(step, 1, t)).toFixed(1)} `;
  return d;
};
