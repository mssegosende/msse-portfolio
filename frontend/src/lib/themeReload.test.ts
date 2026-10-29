import { beforeEach, describe, expect, it, vi } from "vitest";
import { setMediaQuery } from "@/test/matchMedia";
import { MOBILE_LAYOUT_QUERY } from "./layout";

const KEY = "theme-reload";

// The pending reload is read once, at import: each case loads a fresh copy.
const load = () => import("./themeReload");

const save = (entry: object) => sessionStorage.setItem(KEY, JSON.stringify(entry));

beforeEach(() => {
  vi.resetModules();
});

describe("pendingThemeReload", () => {
  it("is null on a normal load", async () => {
    expect((await load()).pendingThemeReload).toBeNull();
  });

  it("reads a fresh entry and consumes it", async () => {
    save({ theme: "dark", y: 1200, t: Date.now() });
    const { pendingThemeReload } = await load();
    expect(pendingThemeReload).toMatchObject({ theme: "dark", y: 1200 });
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("ignores an entry older than 30 s", async () => {
    save({ theme: "dark", y: 0, t: Date.now() - 31_000 });
    expect((await load()).pendingThemeReload).toBeNull();
  });

  it("ignores an unknown theme and malformed JSON", async () => {
    save({ theme: "sepia", t: Date.now() });
    expect((await load()).pendingThemeReload).toBeNull();
    vi.resetModules();
    sessionStorage.setItem(KEY, "{");
    expect((await load()).pendingThemeReload).toBeNull();
  });
});

describe("theme reload position", () => {
  it("restores a plain scroll position once", async () => {
    save({ theme: "light", y: 900, t: Date.now() });
    const mod = await load();
    expect(mod.hasThemeReloadPosition()).toBe(true);
    expect(mod.takeThemeReloadScrollY()).toBe(900);
    expect(mod.hasThemeReloadPosition()).toBe(false);
  });

  it("has nothing to restore on a normal load", async () => {
    const mod = await load();
    expect(mod.hasThemeReloadPosition()).toBe(false);
    expect(mod.takeThemeReloadScrollY()).toBeNull();
  });
});

describe("reloadWithTheme", () => {
  it("saves the theme and position before reloading", async () => {
    // jsdom can't navigate; it reports the reload as not implemented.
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "scrollY", "get").mockReturnValue(640);
    const { reloadWithTheme } = await load();
    expect(reloadWithTheme("dark")).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(KEY) ?? "null")).toMatchObject({
      theme: "dark",
      y: 640,
    });
  });

  it("returns false when sessionStorage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { reloadWithTheme } = await load();
    expect(reloadWithTheme("dark")).toBe(false);
  });
});

describe("themeNeedsReload", () => {
  it("follows the phone layout query", async () => {
    const { themeNeedsReload } = await load();
    expect(themeNeedsReload()).toBe(false);
    setMediaQuery(MOBILE_LAYOUT_QUERY, true);
    expect(themeNeedsReload()).toBe(true);
  });
});
