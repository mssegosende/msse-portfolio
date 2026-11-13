import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Autoplay rules: no audio context before the visitor's first gesture, even
// with sound on (a saved choice); the SOUND setting saves the entry choice.

const contexts: unknown[] = [];
class FakeAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};
  constructor() {
    contexts.push(this);
  }
  createGain() {
    const param = {
      value: 1,
      setValueAtTime: () => param,
      exponentialRampToValueAtTime: () => param,
      cancelScheduledValues: () => param,
    };
    return { gain: param, connect: (n: unknown) => n };
  }
  createBufferSource() {
    return { connect: (n: unknown) => n, start: () => {}, stop: () => {} };
  }
  createStereoPanner() {
    return { pan: { value: 0 }, connect: (n: unknown) => n };
  }
  createDynamicsCompressor() {
    return { threshold: {}, ratio: {}, connect: (n: unknown) => n };
  }
  resume() {
    return Promise.resolve();
  }
  suspend() {
    return Promise.resolve();
  }
  decodeAudioData() {
    return Promise.resolve({});
  }
}

beforeEach(() => {
  vi.resetModules();
  contexts.length = 0;
  sessionStorage.clear();
  localStorage.clear();
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(new ArrayBuffer(8)))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("lib/sound", () => {
  it("makes no audio context before the first gesture, even with sound on", async () => {
    const { setSound, bootSweep } = await import("./sound");
    setSound(true);
    bootSweep();

    expect(contexts).toHaveLength(0);
    // The first gesture: now sound works normally.
    window.dispatchEvent(new Event("pointerdown"));
    expect(contexts).toHaveLength(1);
  });

  it("the SOUND setting saves the entry choice for the next visit", async () => {
    const { setSound } = await import("./sound");
    setSound(true);
    expect(localStorage.getItem("msse-entry")).toBe("sound");
    setSound(false);
    expect(localStorage.getItem("msse-entry")).toBe("silent");
    expect(sessionStorage.getItem("msse-sound")).toBe("off");
  });
});
