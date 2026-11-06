import { useEffect, useRef, useState } from "react";
import type { ShowcaseProject } from "@/data/projectsData";
import s from "./projects.module.css";

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
}

/**
 * The 16:10 "GIF" player: a muted clip with PAUSE/PLAY, a progress line and
 * NEXT · <name>. Remount it (key) per project so the clip starts over.
 */
export const GifPlayer = ({
  project,
  nextName,
  playing,
  paused,
  onToggle,
  onEnded,
  compact = false,
}: GifPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);
  const clock = useRef(0);
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
        p = v.ended ? 1 : v.currentTime / d;
      }
      last = now;
      if (barRef.current) barRef.current.style.width = `${Math.min(100, p * 100)}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, failed, project.seconds]);

  return (
    <div
      className={`${s.player} ${compact ? s.compact : ""}`}
      style={{ background: project.art }}
      data-testid={`project-player-${project.id}`}
    >
      {!failed && (
        <video
          ref={videoRef}
          className={s.video}
          src={project.media}
          poster={project.poster}
          muted
          playsInline
          preload="auto"
          loop={!onEnded}
          onEnded={() => onEndedRef.current?.()}
          onError={() => setFailed(true)}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <div className={s.controls}>
        <button
          type="button"
          className={s.toggle}
          onClick={onToggle}
          aria-label={paused ? "Play the project reel" : "Pause the project reel"}
          data-testid="project-reel-toggle"
        >
          <svg
            width={compact ? 10 : 12}
            height={compact ? 10 : 12}
            viewBox="0 0 24 24"
            fill="#FFFFFF"
            aria-hidden="true"
          >
            <path d={paused ? PLAY_ICON : PAUSE_ICON} />
          </svg>
          {paused ? "PLAY" : "PAUSE"}
        </button>
        <div className={s.track} aria-hidden="true">
          <div ref={barRef} className={s.bar} />
        </div>
        <span className={s.next}>NEXT · {nextName}</span>
      </div>
    </div>
  );
};
