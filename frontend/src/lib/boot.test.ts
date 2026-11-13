import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// lib/boot.ts registers with index.html's loading screen when it is imported:
// each test stubs the screen first, then imports a fresh copy.

const sound = vi.hoisted(() => ({ setSound: vi.fn(), bootSweep: vi.fn() }));
vi.mock("./sound", () => sound);

type Entry = { sound: boolean; gesture: boolean };
let enter: (entry: Entry) => void;

beforeEach(() => {
  vi.resetModules();
  sound.setSound.mockReset();
  sound.bootSweep.mockReset();
  window.__msseBoot = {
    done: vi.fn(),
    progress: vi.fn(),
    skip: vi.fn(),
    onEnter: (cb) => {
      enter = cb;
    },
  };
});

afterEach(() => {
  delete window.__msseBoot;
});

describe("lib/boot", () => {
  it("ENTER WITH SOUND (a click): sound on and the power-up, once", async () => {
    await import("./boot");
    enter({ sound: true, gesture: true });

    expect(sound.setSound).toHaveBeenCalledWith(true);
    expect(sound.bootSweep).toHaveBeenCalledTimes(1);
  });

  it("a saved 'sound' entered by itself: sound on, nothing played (no gesture yet)", async () => {
    await import("./boot");
    enter({ sound: true, gesture: false });

    expect(sound.setSound).toHaveBeenCalledWith(true);
    expect(sound.bootSweep).not.toHaveBeenCalled();
  });

  it("ENTER SILENT: sound off, nothing played", async () => {
    await import("./boot");
    enter({ sound: false, gesture: true });

    expect(sound.setSound).toHaveBeenCalledWith(false);
    expect(sound.bootSweep).not.toHaveBeenCalled();
  });

  it("passes each finished stage to the screen", async () => {
    const { bootDone } = await import("./boot");
    bootDone("robot");

    expect(window.__msseBoot!.done).toHaveBeenCalledWith("robot");
  });

  it("without the screen (no index.html), the visitor is already in", async () => {
    delete window.__msseBoot;
    const { bootDone } = await import("./boot");

    expect(() => bootDone("app")).not.toThrow();
  });
});
