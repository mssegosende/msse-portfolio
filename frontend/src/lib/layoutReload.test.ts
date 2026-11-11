import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setMediaQuery } from "@/test/matchMedia";
import { MOBILE_LAYOUT_QUERY } from "./layout";

const MOUSE = "(hover: hover) and (pointer: fine)";
const KEY = "theme-reload";

// The device and the loaded layout are read at import: each case loads a fresh copy.
const load = async ({ mouse, phone }: { mouse: boolean; phone: boolean }) => {
  setMediaQuery(MOUSE, mouse);
  setMediaQuery(MOBILE_LAYOUT_QUERY, phone);
  return import("./layoutReload");
};

/** Each reload writes its entry first; jsdom can't navigate, so count the writes. */
let reloads: string[] = [];

/** Move the window to a side of the breakpoint, the way a drag step does. */
const resizeTo = (phone: boolean) => {
  setMediaQuery(MOBILE_LAYOUT_QUERY, phone);
  window.dispatchEvent(new Event("resize"));
};

describe("layout reload", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    reloads = [];
    vi.spyOn(console, "error").mockImplementation(() => {});
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === KEY) reloads.push(value);
      return setItem.call(this, key, value);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("reloads once when a desktop window settles on the phone side", async () => {
    const { watchLayoutSwitch, LAYOUT_SETTLE_MS } = await load({ mouse: true, phone: false });
    const stop = watchLayoutSwitch(() => true);
    resizeTo(true);
    vi.advanceTimersByTime(LAYOUT_SETTLE_MS - 1);
    expect(reloads).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(reloads).toHaveLength(1);
    expect(JSON.parse(reloads[0]!)).toMatchObject({ theme: "light", journeyDone: true });
    // Later resizes on the same side don't reload again.
    resizeTo(true);
    vi.advanceTimersByTime(5000);
    expect(reloads).toHaveLength(1);
    stop();
  });

  it("a drag back and forth across the breakpoint reloads once, at its end", async () => {
    const { watchLayoutSwitch } = await load({ mouse: true, phone: false });
    const stop = watchLayoutSwitch(() => false);
    for (let i = 0; i < 12; i++) {
      resizeTo(i % 2 === 0);
      vi.advanceTimersByTime(60);
    }
    resizeTo(true);
    vi.advanceTimersByTime(5000);
    expect(reloads).toHaveLength(1);
    expect(JSON.parse(reloads[0]!)).toMatchObject({ journeyDone: false });
    stop();
  });

  it("a drag that ends on the side it started doesn't reload", async () => {
    const { watchLayoutSwitch } = await load({ mouse: true, phone: false });
    const stop = watchLayoutSwitch(() => false);
    for (let i = 0; i < 12; i++) {
      resizeTo(i % 2 === 0);
      vi.advanceTimersByTime(60);
    }
    resizeTo(false);
    vi.advanceTimersByTime(5000);
    expect(reloads).toHaveLength(0);
    stop();
  });

  it("reloads the other way too, back to the desktop layout", async () => {
    const { watchLayoutSwitch, LOADED_AS_PHONE } = await load({ mouse: true, phone: true });
    expect(LOADED_AS_PHONE).toBe(true);
    const stop = watchLayoutSwitch(() => false);
    resizeTo(false);
    vi.advanceTimersByTime(5000);
    expect(reloads).toHaveLength(1);
    stop();
  });

  it("phones and touch tablets never reload: their layout switches in place", async () => {
    const { watchLayoutSwitch, LAYOUT_RELOADS } = await load({ mouse: false, phone: true });
    expect(LAYOUT_RELOADS).toBe(false);
    const stop = watchLayoutSwitch(() => false);
    resizeTo(false);
    vi.advanceTimersByTime(5000);
    expect(reloads).toHaveLength(0);
    stop();
  });

  it("keeps the dark theme across the reload", async () => {
    document.documentElement.setAttribute("data-theme", "dark");
    const { watchLayoutSwitch } = await load({ mouse: true, phone: false });
    const stop = watchLayoutSwitch(() => false);
    resizeTo(true);
    vi.advanceTimersByTime(5000);
    expect(JSON.parse(reloads[0]!)).toMatchObject({ theme: "dark" });
    stop();
    document.documentElement.removeAttribute("data-theme");
  });
});
