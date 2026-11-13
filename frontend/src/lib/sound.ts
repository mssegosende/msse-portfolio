import { useSyncExternalStore } from "react";

// The site's sounds (María Sol, pre-launch): synthesized with the Web Audio
// API, no audio files; CRT / terminal style and very quiet (the master gain
// is -24 dB). Off by default: nothing is created or played until the visitor
// turns SOUND on in the dock; the choice lasts the session. Everything stops
// while the tab is hidden.

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
let master: GainNode | null = null;
const listeners = new Set<() => void>();

const audio = (): AudioContext | null => {
  if (!on || typeof window === "undefined") return null;
  if (document.hidden) return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 10 ** (MASTER_DB / 20);
    master.connect(ctx.destination);
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

/** A gain envelope: up in `attack` s, down to silence by `release` s. */
const env = (c: AudioContext, peak: number, attack: number, release: number) => {
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + release);
  g.connect(master!);
  return g;
};

let noiseBuf: AudioBuffer | null = null;
const noise = (c: AudioContext) => {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  return src;
};

/** 1. A soft key click (the typing bio and the contact log). */
export const keyClick = () => {
  const c = audio();
  if (!c) return;
  const src = noise(c);
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2600 + Math.random() * 1400;
  band.Q.value = 3;
  src.connect(band).connect(env(c, 0.5, 0.002, 0.03));
  src.start();
  src.stop(c.currentTime + 0.04);
};

/** 2. A short low boot blip (scene 1's HUD, the video gallery). */
export const bootBlip = () => {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "square";
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(90, t + 0.14);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  o.connect(lp).connect(env(c, 0.35, 0.008, 0.18));
  o.start(t);
  o.stop(t + 0.2);
};

/** 3. A faint heartbeat tick (each R peak of About's monitor). */
export const heartbeat = () => {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(1050, t);
  o.frequency.exponentialRampToValueAtTime(880, t + 0.05);
  o.connect(env(c, 0.18, 0.003, 0.07));
  o.start(t);
  o.stop(t + 0.08);
};

/** 4. A short rising transmission chirp (a message sent). */
export const chirp = () => {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  [0, 0.16].forEach((at, k) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(500 + k * 500, t + at);
    o.frequency.exponentialRampToValueAtTime(1500 + k * 700, t + at + 0.14);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t + at);
    g.gain.exponentialRampToValueAtTime(0.4, t + at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.16);
    g.connect(master!);
    o.connect(g);
    o.start(t + at);
    o.stop(t + at + 0.18);
  });
};
