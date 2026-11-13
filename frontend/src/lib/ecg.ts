// An ECG trace for About's SIGNAL · VITALS monitor (María Sol, pre-launch: a
// hospital monitor, not a piano's decaying wave). Beats ~0.8-0.95 s apart,
// each slightly different (rate and height), each a P wave, a sharp QRS
// spike and a T wave. Pure functions of time (ms), so a frame can be drawn
// from any moment.

const hash = (n: number) => {
  const v = Math.sin(n * 91.345 + 47.853) * 43758.5453;
  return v - Math.floor(v);
};

// Beat k starts at BEATS[k] (ms); extended as time goes on.
const BEATS: number[] = [0];
const beatLength = (k: number) => 800 + 150 * hash(k);
const beatAt = (t: number): { k: number; start: number; length: number } => {
  if (t < 0) return { k: 0, start: 0, length: beatLength(0) };
  while (BEATS[BEATS.length - 1]! <= t) {
    const k = BEATS.length - 1;
    BEATS.push(BEATS[k]! + beatLength(k));
  }
  // Binary search for the last start <= t.
  let lo = 0;
  let hi = BEATS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (BEATS[mid]! <= t) lo = mid;
    else hi = mid - 1;
  }
  return { k: lo, start: BEATS[lo]!, length: BEATS[lo + 1]! - BEATS[lo]! };
};

const bump = (p: number, at: number, width: number) => Math.exp(-(((p - at) / width) ** 2));

/** The trace at time t (ms), about -0.3..1 (the R peak near 1). */
export const ecg = (t: number): number => {
  const { k, start, length } = beatAt(t);
  // Fixed-length complexes (QRS doesn't stretch with the rate).
  const ms = t - start;
  const p = ms / 800;
  const h = 0.88 + 0.2 * hash(k + 0.5);
  const wander = 0.03 * Math.sin(t * 0.0009) + 0.012 * Math.sin(t * 0.0137 + k);
  const beat =
    0.12 * bump(p, 0.12, 0.045) - // P
    0.14 * bump(p, 0.255, 0.012) + // Q
    h * bump(p, 0.28, 0.013) - // R: the spike
    0.26 * bump(p, 0.305, 0.014) + // S
    0.3 * bump(p, 0.52, 0.06); // T
  return (ms < length ? beat : 0) + wander;
};

/** The R peaks' times (ms) in (from, to]: one heartbeat each. */
export const peaksBetween = (from: number, to: number): number[] => {
  const out: number[] = [];
  let { k, start } = beatAt(Math.max(0, from));
  for (;;) {
    const peak = start + 0.28 * 800;
    if (peak > to) break;
    if (peak > from) out.push(peak);
    k += 1;
    beatAt(start + beatLength(k - 1) + 1);
    start = BEATS[k]!;
  }
  return out;
};
