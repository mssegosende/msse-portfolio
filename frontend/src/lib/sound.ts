import { useSyncExternalStore } from "react";

// The site's sounds (María Sol, pre-launch): a futuristic HUD, sci-fi
// interface sound design, all synthesized with the Web Audio API (no files),
// very quiet (the master is -24 dB), with a light shared reverb and delay so
// they sound "in a space". Off by default: nothing is created or played until
// the visitor turns SOUND on in the dock; the choice lasts the session.
// Everything stops while the tab is hidden. ?view=sounds plays each one.

/** The glitch bursts (portrait and project glitch slices): drop them here. */
export const GLITCH_SOUND = true;

const KEY = "msse-sound";
const MASTER_DB = -24;

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

/** A short impulse response: decaying noise, a small bright room. */
const impulse = (c: AudioContext, seconds: number) => {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  return buf;
};

const build = (c: AudioContext) => {
  const master = c.createGain();
  master.gain.value = 10 ** (MASTER_DB / 20);
  master.connect(c.destination);
  bus = c.createGain();
  bus.connect(master);
  // The space: a short reverb and a filtered feedback delay, both quiet.
  const verb = c.createConvolver();
  verb.buffer = impulse(c, 1.1);
  const verbGain = c.createGain();
  verbGain.gain.value = 0.22;
  bus.connect(verb).connect(verbGain).connect(master);
  const delay = c.createDelay(1);
  delay.delayTime.value = 0.19;
  const feedback = c.createGain();
  feedback.gain.value = 0.28;
  const tone = c.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 3800;
  const delayGain = c.createGain();
  delayGain.gain.value = 0.16;
  bus.connect(delay);
  delay.connect(tone).connect(feedback).connect(delay);
  tone.connect(delayGain).connect(master);
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

/** A tone from `at` (s, context time) for `len` s with a quick envelope. */
const tone = (
  c: AudioContext,
  {
    type = "sine",
    freq,
    to,
    at = c.currentTime,
    len,
    peak = 0.3,
    attack = 0.003,
  }: {
    type?: OscillatorType;
    freq: number;
    to?: number;
    at?: number;
    len: number;
    peak?: number;
    attack?: number;
  },
) => {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + len);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  o.connect(g).connect(bus!);
  o.start(at);
  o.stop(at + len + 0.02);
};

let noiseBuf: AudioBuffer | null = null;
const noise = (c: AudioContext) => {
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

// ---- The sounds ------------------------------------------------------------

const BLIP_NOTES = [1800, 2135, 2400, 2700, 3200];

/** 1. Typing: a digital text blip, a random pitch from a small set, 15-30 ms. */
export const textBlip = (force = false) => {
  const c = audio(force);
  if (!c) return;
  const freq = BLIP_NOTES[Math.floor(Math.random() * BLIP_NOTES.length)]!;
  tone(c, {
    type: Math.random() < 0.5 ? "sine" : "square",
    freq,
    len: 0.015 + Math.random() * 0.015,
    peak: 0.12,
    attack: 0.002,
  });
};

/** 2. HUD boot: a rising filtered sweep, three quick bleeps, a sparkle. */
export const bootSweep = (force = false) => {
  const c = audio(force);
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(2000, t + 0.4);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.Q.value = 8;
  f.frequency.setValueAtTime(400, t);
  f.frequency.exponentialRampToValueAtTime(4200, t + 0.4);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  o.connect(f).connect(g).connect(bus!);
  o.start(t);
  o.stop(t + 0.45);
  [0.44, 0.52, 0.6].forEach((dt, k) =>
    tone(c, { type: "square", freq: 1600 + k * 400, at: t + dt, len: 0.045, peak: 0.1 }),
  );
  // A soft sparkle: bright noise, high-passed, fading.
  const n = noise(c);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 6000;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0001, t + 0.6);
  ng.gain.exponentialRampToValueAtTime(0.05, t + 0.63);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
  n.connect(hp).connect(ng).connect(bus!);
  n.start(t + 0.6);
  n.stop(t + 1);
};

/** 3. Section transition: a soft digital whoosh, then a tiny scan tick. */
export const whoosh = (force = false) => {
  const c = audio(force);
  if (!c) return;
  const t = c.currentTime;
  const n = noise(c);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 2.2;
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.exponentialRampToValueAtTime(5200, t + 0.3);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.14, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  n.connect(bp).connect(g).connect(bus!);
  n.start(t);
  n.stop(t + 0.34);
  tone(c, { type: "square", freq: 3600, at: t + 0.31, len: 0.012, peak: 0.08, attack: 0.001 });
};

/** 4a. Interface hover: a tiny two-tone select bleep. */
export const selectBleep = (force = false) => {
  const c = audio(force);
  if (!c) return;
  const t = c.currentTime;
  tone(c, { freq: 1400, at: t, len: 0.03, peak: 0.08 });
  tone(c, { freq: 2100, at: t + 0.035, len: 0.035, peak: 0.08 });
};

/** 4b. Interface click: a short confirm chirp. */
export const confirmChirp = (force = false) => {
  const c = audio(force);
  if (!c) return;
  tone(c, { type: "triangle", freq: 900, to: 2600, len: 0.09, peak: 0.16 });
};

/** 5. ECG: a soft hospital-monitor beep on each R peak. */
export const monitorBeep = (force = false) => {
  const c = audio(force);
  if (!c) return;
  tone(c, { freq: 1000, len: 0.06, peak: 0.12, attack: 0.005 });
};

/** 6. Message sent: "command accepted", three ascending bleeps, then data chatter. */
export const commandAccepted = (force = false) => {
  const c = audio(force);
  if (!c) return;
  const t = c.currentTime;
  [1200, 1600, 2400].forEach((freq, k) =>
    tone(c, { type: "square", freq, at: t + k * 0.075, len: 0.055, peak: 0.12 }),
  );
  // ~300 ms of processing chatter: random micro-blips.
  for (let k = 0; k < 18; k++) {
    tone(c, {
      type: "square",
      freq: 2200 + Math.random() * 2600,
      at: t + 0.26 + k * 0.017 + Math.random() * 0.006,
      len: 0.008,
      peak: 0.05,
      attack: 0.001,
    });
  }
};

/** 7. Glitch: a 40 ms bit-crushed noise burst, very low (GLITCH_SOUND). */
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
  g.gain.value = 0.05;
  src.connect(g).connect(bus!);
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
