import { useSyncExternalStore } from "react";

// The site's sounds (María Sol, pre-launch): futuristic HUD sound design, the
// film-interface kind (her reference: "Futuristic HUD Sound Design", Blake
// Sanchez): glassy FM tones rather than plain beeps, each sound layered (a
// tonal core, high air, a little weight), spread in stereo, in a bright space
// with a ping-pong delay, with shimmer and granular data. All synthesized
// with the Web Audio API (no files), very quiet (peaks ~-24 dBFS). Off by
// default: nothing is created or played until the visitor turns SOUND on in
// the dock; the choice lasts the session. Everything stops while the tab is
// hidden. ?view=sounds plays each one.

/** The glitch bursts (portrait and project glitch slices): drop them here. */
export const GLITCH_SOUND = true;

const KEY = "msse-sound";
/**
 * The master gain: with it the loudest sounds (the boot, command accepted)
 * peak at about -24 dBFS, the interface ones some 10-15 dB under, the typing
 * and the glitch lower still (measured offline, rendered to a buffer).
 */
const MASTER_DB = -7;

const readOn = () => {
  try {
    return sessionStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
};

let on = typeof window !== "undefined" && readOn();
let ctx: AudioContext | null = null;
/** Dry sounds go here; it feeds the master and the space. */
let bus: GainNode | null = null;
const listeners = new Set<() => void>();

/** A bright stereo room: decorrelated decaying noise, a touch of pre-delay. */
const impulse = (c: AudioContext, seconds: number) => {
  const len = Math.floor(c.sampleRate * seconds);
  const pre = Math.floor(c.sampleRate * 0.012);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = pre; i < len; i++) {
      const k = (i - pre) / (len - pre);
      d[i] = (Math.random() * 2 - 1) * (1 - k) ** 2.4;
    }
  }
  return buf;
};

const build = (c: AudioContext) => {
  const master = c.createGain();
  master.gain.value = 10 ** (MASTER_DB / 20);
  // A gentle limiter, so stacked layers never clip.
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -10;
  comp.ratio.value = 6;
  master.connect(comp).connect(c.destination);
  bus = c.createGain();
  bus.connect(master);
  // The space: a bright ~1.8 s room...
  const verb = c.createConvolver();
  verb.buffer = impulse(c, 1.8);
  const verbHp = c.createBiquadFilter();
  verbHp.type = "highpass";
  verbHp.frequency.value = 400;
  const verbGain = c.createGain();
  verbGain.gain.value = 0.32;
  bus.connect(verbHp).connect(verb).connect(verbGain).connect(master);
  // ...and a filtered ping-pong delay (left 0.17 s, right 0.26 s).
  const merge = c.createChannelMerger(2);
  const [dl, dr] = [0.17, 0.26].map((t) => {
    const d = c.createDelay(1);
    d.delayTime.value = t;
    return d;
  });
  const fb = c.createGain();
  fb.gain.value = 0.32;
  const tone = c.createBiquadFilter();
  tone.type = "bandpass";
  tone.frequency.value = 2600;
  tone.Q.value = 0.7;
  const send = c.createGain();
  send.gain.value = 0.2;
  bus.connect(send).connect(tone);
  tone.connect(dl!);
  dl!.connect(dr!);
  dr!.connect(fb).connect(dl!);
  dl!.connect(merge, 0, 0);
  dr!.connect(merge, 0, 1);
  merge.connect(master);
};

/** The context, if sound is on (or `force`: the test page), and the tab visible. */
const audio = (force = false): AudioContext | null => {
  if ((!on && !force) || typeof window === "undefined" || document.hidden) return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    build(ctx);
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
};

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend().catch(() => {});
    else if (on) void ctx.resume().catch(() => {});
  });
}

export const isSoundOn = () => on;

/** Turn sound on or off (from a click: browsers start audio only then). */
export const setSound = (next: boolean) => {
  on = next;
  try {
    sessionStorage.setItem(KEY, next ? "on" : "off");
  } catch {
    /* private mode: for this page only */
  }
  if (!next) void ctx?.suspend().catch(() => {});
  else audio();
  listeners.forEach((l) => l());
};

export const useSound = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => on,
    () => false,
  );

// ---- Building blocks -------------------------------------------------------

/** An output at a stereo position (-1 left .. 1 right), into the bus. */
const out = (c: AudioContext, pan = 0): AudioNode => {
  if (!pan || !c.createStereoPanner) return bus!;
  const p = c.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  p.connect(bus!);
  return p;
};

/** An envelope: up in `attack` s to `peak`, down to silence by `len` s. */
const envelope = (c: AudioContext, at: number, len: number, peak: number, attack = 0.003) => {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  return g;
};

/**
 * A glassy FM tone: a sine carrier whose sine modulator (at `ratio` times its
 * frequency) fades from `index` to almost nothing, so it starts bright and
 * metallic and settles into a pure tone. Bell-like at ratios 3.5 or 2.76.
 */
const fm = (
  c: AudioContext,
  {
    freq,
    to,
    ratio = 3.5,
    index = 2.5,
    at = c.currentTime,
    len,
    peak = 0.2,
    attack = 0.002,
    pan = 0,
  }: {
    freq: number;
    to?: number;
    ratio?: number;
    index?: number;
    at?: number;
    len: number;
    peak?: number;
    attack?: number;
    pan?: number;
  },
) => {
  const car = c.createOscillator();
  const mod = c.createOscillator();
  const depth = c.createGain();
  car.frequency.setValueAtTime(freq, at);
  mod.frequency.setValueAtTime(freq * ratio, at);
  if (to) {
    car.frequency.exponentialRampToValueAtTime(to, at + len * 0.8);
    mod.frequency.exponentialRampToValueAtTime(to * ratio, at + len * 0.8);
  }
  depth.gain.setValueAtTime(freq * index, at);
  depth.gain.exponentialRampToValueAtTime(freq * 0.05 + 1, at + len * 0.6);
  mod.connect(depth).connect(car.frequency);
  const g = envelope(c, at, len, peak, attack);
  car.connect(g).connect(out(c, pan));
  car.start(at);
  mod.start(at);
  car.stop(at + len + 0.02);
  mod.stop(at + len + 0.02);
};

/** A plain oscillator tone (sub weight, pure beeps). */
const osc = (
  c: AudioContext,
  {
    type = "sine",
    freq,
    to,
    at = c.currentTime,
    len,
    peak = 0.2,
    attack = 0.004,
    pan = 0,
  }: {
    type?: OscillatorType;
    freq: number;
    to?: number;
    at?: number;
    len: number;
    peak?: number;
    attack?: number;
    pan?: number;
  },
) => {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + len);
  o.connect(envelope(c, at, len, peak, attack)).connect(out(c, pan));
  o.start(at);
  o.stop(at + len + 0.02);
};

let noiseBuf: AudioBuffer | null = null;
const noiseSource = (c: AudioContext) => {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  return src;
};

/** High air: a short burst of bright noise. */
const air = (c: AudioContext, at: number, len: number, peak: number, pan = 0, from = 7000) => {
  const n = noiseSource(c);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = from;
  n.connect(hp)
    .connect(envelope(c, at, len, peak, 0.01))
    .connect(out(c, pan));
  n.start(at);
  n.stop(at + len + 0.02);
};

/** Shimmer: a scatter of tiny high glass tones over `len` s, across the stereo field. */
const shimmer = (c: AudioContext, at: number, len: number, count: number, peak: number) => {
  for (let k = 0; k < count; k++) {
    fm(c, {
      freq: 3800 + Math.random() * 4200,
      ratio: 2.76,
      index: 1.2,
      at: at + Math.random() * len,
      len: 0.06 + Math.random() * 0.08,
      peak,
      pan: Math.random() * 1.6 - 0.8,
    });
  }
};

// A pentatonic set, for pitches that always sit well together.
const NOTES = [1760, 1976, 2349, 2637, 2960, 3136];
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)]!;

// ---- The sounds ------------------------------------------------------------

/** 1. Typing: a glassy micro-blip, a pitch from a small set, 15-30 ms, a little to either side. */
export const textBlip = (force = false) => {
  const c = audio(force);
  if (!c) return;
  fm(c, {
    freq: pick(NOTES),
    ratio: 2,
    index: 1.4,
    len: 0.015 + Math.random() * 0.015,
    peak: 0.16,
    attack: 0.001,
    pan: Math.random() * 0.8 - 0.4,
  });
};

/**
 * 2. HUD boot: weight underneath, a rising resonant sweep (200 -> 2000 Hz,
 * 0.4 s) widening in stereo, three glass bleeps left, centre, right, and a
 * shimmer of sparkle with air.
 */
export const bootSweep = (force = false) => {
  const c = audio(force);
  if (!c) return;
  const t = c.currentTime;
  osc(c, { freq: 62, to: 48, len: 0.35, peak: 0.25, attack: 0.01 });
  [-0.5, 0.5].forEach((pan, k) => {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.detune.value = k ? 9 : -9;
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(2000, t + 0.4);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 9;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(5200, t + 0.4);
    o.connect(f)
      .connect(envelope(c, t, 0.44, 0.07, 0.06))
      .connect(out(c, pan));
    o.start(t);
    o.stop(t + 0.46);
  });
  [2349, 2960, 3520].forEach((freq, k) =>
    fm(c, { freq, at: t + 0.42 + k * 0.07, len: 0.16, peak: 0.13, pan: (k - 1) * 0.6 }),
  );
  shimmer(c, t + 0.6, 0.3, 9, 0.035);
  air(c, t + 0.58, 0.4, 0.03);
};

/** 3. Section transition: air sweeping across the stereo field, a tonal swell, a scan tick. */
export const whoosh = (force = false) => {
  const c = audio(force);
  if (!c) return;
  const t = c.currentTime;
  const n = noiseSource(c);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.6;
  bp.frequency.setValueAtTime(400, t);
  bp.frequency.exponentialRampToValueAtTime(6000, t + 0.3);
  const p = c.createStereoPanner?.();
  if (p) {
    p.pan.setValueAtTime(-0.8, t);
    p.pan.linearRampToValueAtTime(0.8, t + 0.32);
    p.connect(bus!);
  }
  n.connect(bp)
    .connect(envelope(c, t, 0.34, 0.12, 0.13))
    .connect(p ?? bus!);
  n.start(t);
  n.stop(t + 0.36);
  osc(c, { freq: 520, to: 1560, len: 0.3, peak: 0.035, attack: 0.12 });
  fm(c, { freq: 4186, ratio: 1.5, index: 3, at: t + 0.3, len: 0.03, peak: 0.07, pan: 0.6 });
};

/** 4a. Interface hover: a tiny two-tone glass select. */
export const selectBleep = (force = false) => {
  const c = audio(force);
  if (!c) return;
  const t = c.currentTime;
  fm(c, { freq: 1976, ratio: 3.5, index: 1.6, at: t, len: 0.05, peak: 0.07, pan: -0.15 });
  fm(c, { freq: 2960, ratio: 3.5, index: 1.6, at: t + 0.04, len: 0.07, peak: 0.07, pan: 0.15 });
};

/** 4b. Interface click: a confirm chirp, a bright tick and a little sparkle. */
export const confirmChirp = (force = false) => {
  const c = audio(force);
  if (!c) return;
  const t = c.currentTime;
  fm(c, { freq: 1200, to: 2800, ratio: 2, index: 2, len: 0.11, peak: 0.13 });
  fm(c, { freq: 5274, ratio: 1.5, index: 2, at: t + 0.09, len: 0.04, peak: 0.05 });
  shimmer(c, t + 0.1, 0.12, 3, 0.025);
};

/** 5. ECG: a soft hospital-monitor beep (1 kHz sine, 60 ms) on each peak. */
export const monitorBeep = (force = false) => {
  const c = audio(force);
  if (!c) return;
  osc(c, { freq: 1000, len: 0.06, peak: 0.11, attack: 0.005 });
};

/** 6. Message sent: three ascending glass bleeps, then ~0.3 s of granular data. */
export const commandAccepted = (force = false) => {
  const c = audio(force);
  if (!c) return;
  const t = c.currentTime;
  osc(c, { freq: 70, to: 55, len: 0.2, peak: 0.16, attack: 0.008 });
  [1760, 2349, 3136].forEach((freq, k) =>
    fm(c, { freq, at: t + k * 0.08, len: 0.14, peak: 0.13, pan: (k - 1) * 0.5 }),
  );
  // The processing: a stream of tiny FM grains, scattered left and right.
  for (let k = 0; k < 26; k++) {
    fm(c, {
      freq: 2400 + Math.random() * 3600,
      ratio: pick([1.5, 2, 3.5]),
      index: 2,
      at: t + 0.27 + k * 0.012 + Math.random() * 0.006,
      len: 0.012,
      peak: 0.045,
      attack: 0.001,
      pan: Math.random() * 1.6 - 0.8,
    });
  }
  air(c, t + 0.27, 0.32, 0.02);
};

/** 7. Glitch: a 40 ms bit-crushed burst, very low, off to one side (GLITCH_SOUND). */
export const glitchBurst = (force = false) => {
  if (!GLITCH_SOUND) return;
  const c = audio(force);
  if (!c) return;
  const len = Math.floor(c.sampleRate * 0.04);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  // Bit-crushed: held for 12 samples, 3 bits deep.
  let held = 0;
  for (let i = 0; i < len; i++) {
    if (i % 12 === 0) held = Math.round((Math.random() * 2 - 1) * 4) / 4;
    d[i] = held * (1 - i / len);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = 0.045;
  src.connect(g).connect(out(c, Math.random() < 0.5 ? -0.5 : 0.5));
  src.start();
};

/** Every sound by name, for the test page (?view=sounds). */
export const SOUNDS = {
  "1 · Typing blip": textBlip,
  "2 · HUD boot": bootSweep,
  "3 · Section whoosh": whoosh,
  "4 · Select (hover)": selectBleep,
  "4 · Confirm (click)": confirmChirp,
  "5 · Monitor beep": monitorBeep,
  "6 · Command accepted": commandAccepted,
  "7 · Glitch burst": glitchBurst,
} as const;
