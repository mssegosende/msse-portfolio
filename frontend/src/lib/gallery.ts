import { useSyncExternalStore } from "react";

// The video gallery's state, kept in the URL (María Sol, pre-launch):
// ?view=videos opens it, &v=05 picks a video. Opening pushes a history entry,
// so the browser's Back closes it; closing from the page goes back that entry
// (or, when the page was loaded with the gallery open, drops the query).

export interface GalleryState {
  open: boolean;
  /** The picked video's id ("05"), if any. */
  v: string | null;
}

const read = (): GalleryState => {
  if (typeof window === "undefined") return { open: false, v: null };
  const q = new URLSearchParams(window.location.search);
  return { open: q.get("view") === "videos", v: q.get("v") };
};

let state = read();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (next: GalleryState) => {
  if (next.open === state.open && next.v === state.v) return;
  state = next;
  emit();
};

const urlFor = ({ open, v }: GalleryState) => {
  const q = new URLSearchParams(window.location.search);
  q.delete("view");
  q.delete("v");
  if (open) {
    q.set("view", "videos");
    if (v) q.set("v", v);
  }
  const s = q.toString();
  return `${window.location.pathname}${s ? `?${s}` : ""}${window.location.hash}`;
};

/** Open the gallery (on video `v`, if given). */
export const openGallery = (v: string | null = null): void => {
  if (state.open) return pickVideo(v);
  const next = { open: true, v };
  window.history.pushState({ gallery: true }, "", urlFor(next));
  set(next);
};

/** Keep the picked video in the URL (no new history entry). */
export const pickVideo = (v: string | null): void => {
  if (!state.open) return;
  const next = { open: true, v };
  window.history.replaceState(window.history.state, "", urlFor(next));
  set(next);
};

/** Close it: Back over the entry the gallery pushed, or drop the query. */
export const closeGallery = (): void => {
  if (!state.open) return;
  if ((window.history.state as { gallery?: boolean } | null)?.gallery) {
    window.history.back();
    return;
  }
  window.history.replaceState(null, "", urlFor({ open: false, v: null }));
  set({ open: false, v: null });
};

if (typeof window !== "undefined") {
  // Back / Forward: the URL says whether it is open.
  window.addEventListener("popstate", () => set(read()));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useGallery = (): GalleryState =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
