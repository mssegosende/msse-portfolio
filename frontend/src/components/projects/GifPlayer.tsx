import { useEffect, useRef, useState } from "react";
import { useIsPresent } from "framer-motion";
import type { ShowcaseProject } from "@/data/projectsData";
import { seekToStart } from "./clip";
import { ProjectMedia } from "./ProjectMedia";

const PAUSE_ICON = "M6 5h4v14H6zM14 5h4v14h-4z";
const PLAY_ICON = "M8 5v14l11-7z";

interface GifPlayerProps {
  project: ShowcaseProject;
  nextName: string;
  /** Whether the clip should be running right now. */
  playing: boolean;
  /** The visitor's PAUSE/PLAY choice (drives the button). */
  paused: boolean;
  onToggle: () => void;
  /** Called when the clip ends; without it the clip loops (reduced motion). */
  onEnded?: () => void;
  compact?: boolean;
  /** How much to load before it plays: "none" for a slide that isn't showing yet. */
  preload?: "auto" | "none";
}

/**
 * The 16:10 "GIF" player: a muted clip with PAUSE/PLAY, a progress line and
 * NEXT · <name>. Remount it (key) per project so the clip starts over. The
 * clip starts at the project's startAt and plays one whole loop from there
 * (back round to startAt) before onEnded.
 */
export const GifPlayer = ({
  project,
  nextName,
  paused,
  onToggle,
  onEnded,
  compact = false,
  preload = "auto",
  playing: wanted,
}: GifPlayerProps) => {
  // A featured card on its way out (AnimatePresence) stops at once, so only
  // the incoming clip decodes during the hand-over.
  const present = useIsPresent();
  const playing = wanted && present;
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);
  const clock = useRef(0);
  // Loop tracking: the last time seen, and whether the clip has wrapped round.
  const lastT = useRef(0);
  const wrapped = useRef(false);
  // A clip that can't load still advances the reel, on its nominal length.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || failed) return;
    // AbortError (a pause() interrupting play()) is normal; only a missing or
    // unsupported source falls back to the clock.
    if (playing)
      v.play().catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "NotSupportedError") setFailed(true);
      });
    else v.pause();
  }, [playing, failed]);

  // Start at the project's offset, as soon as the clip knows its length (it
  // may already: the folder row loads the same file).
  useEffect(() => {
    const v = videoRef.current;
    if (!v || failed) return undefined;
    const start = () => {
      seekToStart(v, project.startAt);
      lastT.current = v.currentTime;
      wrapped.current = false;
    };
    if (v.readyState >= HTMLMediaElement.HAVE_METADATA) {
      start();
      return undefined;
    }
    v.addEventListener("loadedmetadata", start, { once: true });
    return () => v.removeEventListener("loadedmetadata", start);
  }, [project.startAt, failed]);

  // The progress line: written straight to the DOM, once per frame, while playing.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const v = videoRef.current;
      let p: number;
      if (failed || !v) {
        clock.current += (now - last) / 1000;
        if (clock.current >= project.seconds) {
          clock.current = 0;
          onEndedRef.current?.();
        }
        p = clock.current / project.seconds;
      } else {
        const d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : project.seconds;
        const start = (project.startAt ?? 0) % d;
        const t = v.currentTime;
        if (t + 0.5 < lastT.current) wrapped.current = true;
        lastT.current = t;
        // One whole loop from startAt: hand over once it is back there.
        if (wrapped.current && t >= start && onEndedRef.current) {
          wrapped.current = false;
          onEndedRef.current();
        }
        p = ((((t - start) % d) + d) % d) / d;
      }
      last = now;
      if (barRef.current) barRef.current.style.width = `${Math.min(100, p * 100)}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, failed, project.seconds, project.startAt]);

  return (
    <div
      className={`crt-player relative ${compact ? "crt-player--compact" : ""}`}
      data-testid={`project-player-${project.id}`}
    >
      <ProjectMedia project={project} corner={compact ? 16 : 26} inset={compact ? 10 : 18}>
        {!failed && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={project.media}
            poster={project.poster}
            muted
            playsInline
            preload={preload}
            // Always looping: the hand-over comes from the loop tracking above.
            loop
            onError={() => setFailed(true)}
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
      </ProjectMedia>
      <div className="crt-player__controls">
        <button
          type="button"
          className="crt-player__toggle"
          onClick={onToggle}
          aria-label={paused ? "Play the project reel" : "Pause the project reel"}
          data-testid="project-reel-toggle"
        >
          <svg
            width={compact ? 10 : 12}
            height={compact ? 10 : 12}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d={paused ? PLAY_ICON : PAUSE_ICON} />
          </svg>
          {paused ? "PLAY" : "PAUSE"}
        </button>
        <div className="crt-player__track" aria-hidden="true">
          <div ref={barRef} className="crt-player__bar" />
        </div>
        <span className="crt-player__next">NEXT · {nextName}</span>
      </div>
    </div>
  );
};
