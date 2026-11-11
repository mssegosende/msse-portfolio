import { useEffect, useRef } from "react";
import { MOBILE_LAYOUT_QUERY } from "./layout";
import { reloadWithTheme, type Theme } from "./themeReload";

// Desktop windows that cross the phone breakpoint reload the page instead of
// swapping the hero's scenes in place. A switch unmounts the scenes of one
// layout and creates the other's: on a Windows/AMD laptop the GPU memory
// climbed from 2.5 to 4.2 GB over two switches (the old scenes not yet freed)
// and the driver reset the device; the browser then took WebGL away from the
// page for the session, and the robot stayed on its fallback. A reload frees
// everything at once. The position and theme come back (lib/themeReload).
//
// Mouse devices only: phones and touch tablets never resize across the
// breakpoint in normal use (phones are portrait-only), and keep switching in
// place as before.
const MOUSE_DEVICE_QUERY = "(hover: hover) and (pointer: fine)";

const matches = (query: string): boolean =>
  typeof window !== "undefined" && window.matchMedia(query).matches;

/** Whether this device reloads on a layout switch (read once per load). */
export const LAYOUT_RELOADS = matches(MOUSE_DEVICE_QUERY);

/** The layout this page loaded with; on LAYOUT_RELOADS devices it never changes. */
export const LOADED_AS_PHONE = matches(MOBILE_LAYOUT_QUERY);

/**
 * How long the window must stay on the other side before the reload: one
 * drag that crosses back and forth reloads once, at its end, and not at all
 * if it ends on the side it started.
 */
export const LAYOUT_SETTLE_MS = 400;

/**
 * Watch for a desktop window crossing the breakpoint and reload once it has
 * settled on the other side. Returns the cleanup.
 */
export const watchLayoutSwitch = (journeyDone: () => boolean): (() => void) => {
  if (!LAYOUT_RELOADS) return () => {};
  const mq = window.matchMedia(MOBILE_LAYOUT_QUERY);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let reloading = false;
  const check = () => {
    if (reloading) return;
    if (mq.matches === LOADED_AS_PHONE) {
      if (timer) clearTimeout(timer);
      timer = null;
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (reloading || mq.matches === LOADED_AS_PHONE) return;
      reloading = true;
      const theme: Theme =
        document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      // Without sessionStorage the position is lost, but the layout still has to switch.
      if (!reloadWithTheme(theme, journeyDone())) window.location.reload();
    }, LAYOUT_SETTLE_MS);
  };
  window.addEventListener("resize", check);
  mq.addEventListener("change", check);
  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener("resize", check);
    mq.removeEventListener("change", check);
  };
};

/** App-level: reload on a desktop layout switch, carrying whether the intro was seen. */
export const useLayoutReload = (journeyDone: boolean): void => {
  const doneRef = useRef(journeyDone);
  useEffect(() => {
    doneRef.current = journeyDone;
  }, [journeyDone]);
  useEffect(() => watchLayoutSwitch(() => doneRef.current), []);
};
