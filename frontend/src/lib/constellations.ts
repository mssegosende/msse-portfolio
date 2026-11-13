import type { Constellation } from "@/data/constellations";

// SIGNAL's constellations (data/constellations.ts): their real positions
// projected to 2D, and the sequence as a pure function of time, so a frame is
// the same wherever it is drawn (and testable).

export interface ProjectedStar {
  hip: number;
  x: number;
  y: number;
  /** Dot radius, in the box's units: brighter stars a little larger. */
  r: number;
  named: boolean;
}

export interface Projection {
  /** Every star, in the order they appear (the stick figure's order). */
  stars: ProjectedStar[];
  /** The stick figure's segments, in drawing order, as HIP pairs. */
  segments: [number, number][];
}

const RAD = Math.PI / 180;

/**
 * Gnomonic (tangent-plane) projection about the constellation's centre, as
 * the sky looks from Earth: north up, east to the LEFT. Then scaled to fit
 * a `width` x `height` box with `pad` around it, keeping its proportions.
 */
export const project = (
  c: Constellation,
  width: number,
  height: number,
  pad: number,
): Projection => {
  const unit = c.stars.map((s) => {
    const a = s.ra * 15 * RAD;
    const d = s.dec * RAD;
    return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)] as const;
  });
  // The centre: the mean direction of its stars.
  const sum = unit.reduce((m, v) => [m[0] + v[0], m[1] + v[1], m[2] + v[2]], [0, 0, 0]);
  const a0 = Math.atan2(sum[1], sum[0]);
  const d0 = Math.atan2(sum[2], Math.hypot(sum[0], sum[1]));
  const flat = c.stars.map((s) => {
    const a = s.ra * 15 * RAD;
    const d = s.dec * RAD;
    const cosc = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a - a0);
    const x = (Math.cos(d) * Math.sin(a - a0)) / cosc;
    const y = (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a - a0)) / cosc;
    // East to the left, north up (screen y grows downward).
    return { s, x: -x, y: -y };
  });
  const xs = flat.map((p) => p.x);
  const ys = flat.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const scale = Math.min(
    (width - 2 * pad) / (maxX - minX || 1),
    (height - 2 * pad) / (maxY - minY || 1),
  );
  const offX = (width - (maxX - minX) * scale) / 2 - minX * scale;
  const offY = (height - (maxY - minY) * scale) / 2 - minY * scale;
  const byHip = new Map(
    flat.map(({ s, x, y }) => [
      s.hip,
      {
        hip: s.hip,
        x: x * scale + offX,
        y: y * scale + offY,
        // Magnitude -0.05 (Arcturus) to ~5.5: about 2.3 to 1.1.
        r: Math.max(1.1, Math.min(2.3, 2.2 - s.mag * 0.2)),
        named: s.hip === c.named,
      },
    ]),
  );
  // Appearance order: as the stick figure first meets each star; then any star
  // off the figure (51 Pegasi).
  const order: number[] = [];
  for (const line of c.lines) for (const hip of line) if (!order.includes(hip)) order.push(hip);
  for (const s of c.stars) if (!order.includes(s.hip)) order.push(s.hip);
  const segments: [number, number][] = [];
  for (const line of c.lines)
    for (let k = 1; k < line.length; k++) segments.push([line[k - 1]!, line[k]!]);
  return { stars: order.map((hip) => byHip.get(hip)!), segments };
};

// ---- The sequence -----------------------------------------------------------

/** Typing, as CHANNEL OPEN's log (~75 ms a character); erasing is quicker. */
export const TYPE_MS = 75;
export const ERASE_MS = 40;
export const STAR_MS = 160;
export const LINE_MS = 200;
export const HOLD_MS = 2000;
/** A beat on the bare "SIGNAL:" before the next star. */
export const GAP_MS = 600;

export interface SignalFrame {
  /** Which constellation. */
  index: number;
  /** How much of its name is typed after "SIGNAL: ". */
  typed: number;
  /** How many stars and segments are drawn. */
  stars: number;
  segments: number;
  /** 1 while drawn, falling to 0 as the name is erased. */
  opacity: number;
}

const phases = (c: Constellation, starCount: number, segmentCount: number) => {
  const type = c.signal.length * TYPE_MS;
  const stars = starCount * STAR_MS;
  const lines = segmentCount * LINE_MS;
  const erase = c.signal.length * ERASE_MS;
  return {
    type,
    stars,
    lines,
    hold: HOLD_MS,
    erase,
    total: type + stars + lines + HOLD_MS + erase + GAP_MS,
  };
};

/** The frame at `t` ms into the loop over every constellation. */
export const signalFrame = (list: readonly Constellation[], t: number): SignalFrame => {
  const counts = list.map((c) => ({
    stars: c.stars.length,
    segments: c.lines.reduce((n, l) => n + Math.max(0, l.length - 1), 0),
  }));
  const spans = list.map((c, i) => phases(c, counts[i]!.stars, counts[i]!.segments));
  const loop = spans.reduce((n, p) => n + p.total, 0);
  let rest = ((t % loop) + loop) % loop;
  let index = 0;
  while (rest >= spans[index]!.total) rest -= spans[index++]!.total;
  const c = list[index]!;
  const p = spans[index]!;
  const { stars: n, segments: m } = counts[index]!;
  const frame: SignalFrame = { index, typed: 0, stars: 0, segments: 0, opacity: 1 };
  if (rest < p.type) return { ...frame, typed: Math.floor(rest / TYPE_MS) };
  rest -= p.type;
  frame.typed = c.signal.length;
  if (rest < p.stars) return { ...frame, stars: Math.floor(rest / STAR_MS) + 1 };
  rest -= p.stars;
  frame.stars = n;
  if (rest < p.lines) return { ...frame, segments: Math.floor(rest / LINE_MS) + 1 };
  rest -= p.lines;
  frame.segments = m;
  if (rest < p.hold) return frame;
  rest -= p.hold;
  // Erasing: the name backs off to "SIGNAL:" as the drawing fades.
  if (rest < p.erase) {
    const gone = Math.min(c.signal.length, Math.floor(rest / ERASE_MS) + 1);
    return { ...frame, typed: c.signal.length - gone, opacity: 1 - rest / p.erase };
  }
  // Then a beat on the bare "SIGNAL:", nothing drawn, before the next star.
  return { ...frame, typed: 0, stars: 0, segments: 0, opacity: 0 };
};

/** The still frame (reduced motion): POLARIS, whole. */
export const stillFrame = (list: readonly Constellation[]): SignalFrame => {
  const c = list[0]!;
  return {
    index: 0,
    typed: c.signal.length,
    stars: c.stars.length,
    segments: c.lines.reduce((n, l) => n + Math.max(0, l.length - 1), 0),
    opacity: 1,
  };
};
