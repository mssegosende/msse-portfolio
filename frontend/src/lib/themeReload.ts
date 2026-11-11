import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOBILE_LAYOUT_QUERY } from "./layout";

// Phones change theme by reloading the page: iOS never frees discarded Spline
// scenes, so swapping them in place leaks until the tab is killed. Desktop
// windows that cross the phone breakpoint reload the same way (layoutReload).
// The theme and scroll position ride along in sessionStorage, once. The position is
// stored as pin progress, not px: the pin is 780% of the viewport height, and
// on iOS that height differs between loads (URL bar).

export type Theme = "light" | "dark";

/** What a reload carries: the theme and where the visitor was. */
interface PendingReload {
  theme: Theme;
  /** Whether the hero sequence had been seen (a theme reload: always). */
  journeyDone?: boolean;
  /** When it was saved (ms since epoch). */
  t: number;
  /** One of: pin progress 0..1, px past the pin's end, or px when there is no pin. */
  pin?: number;
  after?: number;
  y?: number;
}

const KEY = "theme-reload";

// An older entry is not from this reload (e.g. the tab reopened later).
const MAX_AGE_MS = 30000;

// The only pin on the page is ScrollScene's sequence.
const pinTrigger = () => ScrollTrigger.getAll().find((st) => st.pin);

// Read once at import: StrictMode runs initializers twice and the second
// read would find the key already consumed.
const take = (): PendingReload | null => {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingReload | null;
    if (!data || Date.now() - data.t > MAX_AGE_MS) return null;
    if (data.theme !== "dark" && data.theme !== "light") return null;
    return data;
  } catch {
    return null;
  }
};

export const pendingThemeReload: PendingReload | null =
  typeof window !== "undefined" ? take() : null;

/**
 * This load comes back with the hero sequence already seen: a theme reload
 * (from the dock), or a layout reload made after the sequence.
 */
export const pendingJourneyDone: boolean = pendingThemeReload
  ? (pendingThemeReload.journeyDone ?? true)
  : false;

export const themeNeedsReload = (): boolean =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_LAYOUT_QUERY).matches;

// Save the new theme and position, then reload. Returns false without
// sessionStorage, and the caller switches the theme in place instead.
export const reloadWithTheme = (theme: Theme, journeyDone?: boolean): boolean => {
  const y = window.scrollY;
  const st = pinTrigger();
  const pos = !st
    ? { y }
    : y <= st.end
      ? { pin: Math.max(0, Math.min(1, (y - st.start) / Math.max(1, st.end - st.start))) }
      : { after: y - st.end };
  try {
    const entry: PendingReload = { theme, ...pos, t: Date.now() };
    if (journeyDone !== undefined) entry.journeyDone = journeyDone;
    window.sessionStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
};

let positionTaken = false;

// Whether this load came from a theme reload whose position hasn't been
// restored yet. The timeline can be built more than once (StrictMode, a
// breakpoint change); the position applies once.
export const hasThemeReloadPosition = (): boolean => !!pendingThemeReload && !positionTaken;

// The saved position in this load's px, once. Call once the pin exists.
export const takeThemeReloadScrollY = (): number | null => {
  positionTaken = true;
  const d = pendingThemeReload;
  if (!d) return null;
  if (d.pin == null && d.after == null) return typeof d.y === "number" ? d.y : null;
  const st = pinTrigger();
  if (!st) return null;
  return d.pin != null ? st.start + d.pin * (st.end - st.start) : st.end + (d.after ?? 0);
};
