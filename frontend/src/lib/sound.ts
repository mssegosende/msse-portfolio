import { useSyncExternalStore } from "react";

// The site's sounds (María Sol, pre-launch): futuristic HUD sound design, cut
// from her two sound-design tracks (scripts/build-sounds.mjs -> public/sounds/):
// nine short interface sounds, and her track as a quiet background loop while
// sound is on. Off by default: nothing is downloaded, created or played until
// the visitor turns SOUND on in the dock; the choice lasts the session. The
// loudest peaks sit near -24 dBFS. Everything stops while the tab is hidden;
// the background ducks while a gallery video plays. ?view=sounds plays each one.

/** The glitch bursts (portrait and project glitch slices): drop them here. */
export const GLITCH_SOUND = true;
/**
 * The typing blips (About's bio, the contact log): off (María Sol: the bio's
 * typing sounded hollow and was not needed). true brings them back.
 */
export const TYPING_SOUND = false;

const KEY = "msse-sound";
/** The loading screen's saved entry choice (index.html): "sound" or "silent". */
const ENTRY_KEY = "msse-entry";
/** The master: the files peak at ~-3 dBFS, so the loudest land near -24 dBFS. */
const MASTER_DB = -21;
/** The background loop's level under the master, and its fade, s. */
const BACKGROUND_GAIN = 1;
const BACKGROUND_FADE = 2;

const FILES = {
  blipA: "/sounds/blip-a.wav",
  blipB: "/sounds/blip-b.wav",
  beep: "/sounds/beep.wav",
  select: "/sounds/select.wav",
  confirm: "/sounds/confirm.wav",
  boot: "/sounds/boot.wav",
  whoosh: "/sounds/whoosh.wav",
  command: "/sounds/command.wav",
  glitch: "/sounds/glitch.wav",
  background: "/sounds/background.mp3",
} as const;
type Clip = keyof typeof FILES;

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
const buffers: Partial<Record<Clip, AudioBuffer>> = {};
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Fetch and decode every clip, once, the first time sound is used. */
const load = (c: AudioContext) =>
  (loading ??= Promise.all(
    (Object.keys(FILES) as Clip[]).map(async (k) => {
      try {
        const res = await fetch(FILES[k]);
        buffers[k] = await c.decodeAudioData(await res.arrayBuffer());
      } catch {
        /* that one stays silent */
      }
    }),
  ).then(() => {
    if (on) startBackground();
  }));

// Browsers start audio only after the visitor's first gesture. Until then no
// context is made and nothing is scheduled (a sound scheduled on a suspended
// context would play late, on that first gesture): sound "on" from a saved
// choice stays silent until then, and then works normally.
let gestured = false;
if (typeof window !== "undefined") {
  const first = () => {
    gestured = true;
    for (const type of GESTURES) window.removeEventListener(type, first, true);
    if (on && audio()) startBackground();
  };
  const GESTURES = ["pointerdown", "keydown", "touchend"] as const;
  for (const type of GESTURES) window.addEventListener(type, first, true);
}

/** The context, if sound is on (or `force`: the test page), and the tab visible. */
const audio = (force = false): AudioContext | null => {
  if ((!on && !force) || typeof window === "undefined" || document.hidden) return null;
  if (!gestured && !force) return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 10 ** (MASTER_DB / 20);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.ratio.value = 6;
    master.connect(limiter).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  void load(ctx);
  return ctx;
};

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend().catch(() => {});
    else if (on) void ctx.resume().catch(() => {});
  });
}

// ---- The background loop ---------------------------------------------------

let bgSource: AudioBufferSourceNode | null = null;
let bgGain: GainNode | null = null;
let ducked = false;

const bgLevel = () => (ducked ? BACKGROUND_GAIN * 0.15 : BACKGROUND_GAIN);

function startBackground() {
  const c = ctx;
  const buf = buffers.background;
  if (!c || !buf || bgSource) return;
  bgGain = c.createGain();
  bgGain.gain.setValueAtTime(0.0001, c.currentTime);
  bgGain.gain.exponentialRampToValueAtTime(bgLevel(), c.currentTime + BACKGROUND_FADE);
  bgGain.connect(master!);
  bgSource = c.createBufferSource();
  bgSource.buffer = buf;
  bgSource.loop = true;
  bgSource.connect(bgGain);
  bgSource.start();
}

const stopBackground = () => {
  const c = ctx;
  const src = bgSource;
  const g = bgGain;
  bgSource = null;
  bgGain = null;
  if (!c || !src || !g) return;
  g.gain.cancelScheduledValues(c.currentTime);
  g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6);
  src.stop(c.currentTime + 0.65);
};

/** The background steps back while something else speaks (a gallery video). */
export const duckBackground = (duck: boolean) => {
  ducked = duck;
  if (!ctx || !bgGain) return;
  bgGain.gain.cancelScheduledValues(ctx.currentTime);
  bgGain.gain.setValueAtTime(Math.max(0.0001, bgGain.gain.value), ctx.currentTime);
  bgGain.gain.exponentialRampToValueAtTime(bgLevel(), ctx.currentTime + 0.5);
};

// ---- On / off --------------------------------------------------------------

export const isSoundOn = () => on;

/** Turn sound on or off (from a click: browsers start audio only then). */
export const setSound = (next: boolean) => {
  on = next;
  try {
    sessionStorage.setItem(KEY, next ? "on" : "off");
    // The loading screen's saved choice follows the last setting, so the next
    // visit enters the way this one ended (index.html, msse-entry).
    localStorage.setItem(ENTRY_KEY, next ? "sound" : "silent");
  } catch {
    /* private mode: for this page only */
  }
  if (next) {
    if (audio()) startBackground();
  } else stopBackground();
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

// ---- Playing a clip --------------------------------------------------------

const play = (
  clip: Clip,
  {
    gain = 1,
    rate = 1,
    pan = 0,
    force = false,
  }: { gain?: number; rate?: number; pan?: number; force?: boolean } = {},
) => {
  const c = audio(force);
  if (!c) return;
  const buf = buffers[clip];
  // Not downloaded yet (the very first sounds): play it as soon as it is.
  if (!buf) {
    void load(c).then(() => buffers[clip] && play(clip, { gain, rate, pan, force }));
    return;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  const g = c.createGain();
  g.gain.value = gain;
  let node: AudioNode = src.connect(g);
  if (pan && c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.value = pan;
    node = node.connect(p);
  }
  node.connect(master!);
  src.start();
};

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// ---- The sounds ------------------------------------------------------------

/** 1. Typing (the bio, the contact log): one of two blips, its pitch a little different each time. */
export const textBlip = (force = false) =>
  (TYPING_SOUND || force) &&
  play(Math.random() < 0.5 ? "blipA" : "blipB", {
    gain: 0.35,
    rate: rnd(0.9, 1.35),
    pan: rnd(-0.3, 0.3),
    force,
  });

/** 2. HUD boot (scene 1's HUD, the gallery): the rising sweep. */
export const bootSweep = (force = false) => play("boot", { gain: 1.9, force });

/** 3. Section transition (every crossfade): the air. */
// One whoosh per change: overlapping copies of it (the change into Projects
// fired it three times in 0.3 s) phase into a hollow sound.
let lastWhoosh = -Infinity;
export const whoosh = (force = false) => {
  const now = performance.now();
  if (!force && now - lastWhoosh < 1200) return;
  lastWhoosh = now;
  play("whoosh", { gain: 0.6, force });
};

/** 4a. Interface hover: the two-tone select. */
export const selectBleep = (force = false) => play("select", { gain: 0.45, force });

/** 4b. Interface click: the stepping confirm. */
export const confirmChirp = (force = false) => play("confirm", { gain: 0.6, force });

/** 5. ECG: the pure beep, on each R peak. */
export const monitorBeep = (force = false) => play("beep", { gain: 0.4, force });

/** 6. Message sent: the repeated bleeps. */
export const commandAccepted = (force = false) => play("command", { gain: 0.9, force });

/** 7. Glitch: the short chaotic burst, off to one side, very low (GLITCH_SOUND). */
export const glitchBurst = (force = false) => {
  if (!GLITCH_SOUND) return;
  play("glitch", { gain: 0.12, pan: Math.random() < 0.5 ? -0.5 : 0.5, force });
};

/** The test page's background switch (whatever the dock's SOUND says). */
export const previewBackground = (start: boolean) => {
  if (start) {
    const c = audio(true);
    if (c) void load(c).then(startBackground);
  } else stopBackground();
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
