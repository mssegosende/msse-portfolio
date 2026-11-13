import { useSyncExternalStore } from "react";
import { bootSweep, setSound } from "./sound";

// The app's side of the loading screen (index.html's inline #boot, María Sol,
// 13 Nov). The inline script owns the screen, the real percentage and the
// choice; the app reports each stage that blocks scene 1 as it finishes, and
// learns when the visitor has entered (with sound or silent).

/** The stages index.html weighs (app 20, fonts 10, scene 45, robot 20, intro 5). */
export type BootStage = "app" | "fonts" | "scene" | "robot" | "intro";

interface Entry {
  sound: boolean;
  /** Entered by a click or key (a gesture: audio may start), not automatically. */
  gesture: boolean;
}

interface BootApi {
  done: (stage: BootStage) => void;
  progress: (stage: BootStage, fraction: number) => void;
  onEnter: (cb: (entry: Entry) => void) => void;
  skip: () => void;
}

declare global {
  interface Window {
    __msseBoot?: BootApi;
  }
}

const api = (): BootApi | undefined =>
  typeof window === "undefined" ? undefined : window.__msseBoot;

/** A stage that blocks scene 1 has finished. */
export const bootDone = (stage: BootStage): void => api()?.done(stage);

/** No scene 1 behind it (?view=sounds): in at once, silent, nothing saved. */
export const bootSkip = (): void => api()?.skip();

// Without the inline loader (unit tests) the visitor is already in.
let entered = !api();
const listeners = new Set<() => void>();

api()?.onEnter((entry) => {
  entered = true;
  // The choice sets the sound, as the SOUND toggle would. With sound, the
  // power-up plays once, on the click itself (a gesture: browsers allow audio
  // then), as the crossfade into scene 1 starts. Entered automatically (a saved
  // choice) nothing plays until the visitor's first gesture (lib/sound).
  setSound(entry.sound);
  if (entry.sound && entry.gesture) bootSweep();
  listeners.forEach((l) => l());
});

/** Whether the visitor has entered (the loading screen is fading or gone). */
export const useEntered = (): boolean =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => entered,
    () => true,
  );
