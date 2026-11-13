import { useEffect, useRef, useState, type Ref } from "react";
import { INTRO_VIDEO } from "../../data/introVideo";
import { tourVideos } from "../../data/videosData";
import { openGallery } from "../../lib/gallery";
import { useMediaQuery } from "../../hooks/useMediaQuery";

/** 90 -> "1:30". */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// How many videos the README tour holds (the gallery's channels).
const VIDEO_COUNT = tourVideos.length;
const VIDEO_COUNT_LABEL = `${VIDEO_COUNT} VIDEO${VIDEO_COUNT === 1 ? "" : "S"}`;

const PLAY = (
  <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" className="crt-play">
    <path d="M14 10 L34 22 L14 34 Z" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

/**
 * Ø1.1, CH.01 · README TOUR: a dossier frame with nodes (Hero.dc.html). The
 * thumbnail is a muted looping preview in the CRT palette (the poster with
 * reduced motion); WATCH THE TOUR opens the README tour (the video gallery).
 */
export const IntroTile = ({ ref, scale = 1 }: { ref?: Ref<HTMLDivElement>; scale?: number }) => {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [length, setLength] = useState<string | null>(null);
  // The tile comes in with the first scroll step, so its clip waits for the
  // first scroll (or a hover/focus on it): nothing downloads at load.
  const [armed, setArmed] = useState(() => window.scrollY > 0);
  const previewRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (armed) return undefined;
    const arm = () => setArmed(true);
    window.addEventListener("scroll", arm, { once: true, passive: true });
    return () => window.removeEventListener("scroll", arm);
  }, [armed]);
  useEffect(() => {
    if (armed && !reduced) previewRef.current?.play().catch(() => {});
  }, [armed, reduced]);

  return (
    <div
      ref={ref}
      data-testid="hero-intro-tile"
      // Hero.dc.html: 64,300, 300 wide (~21vw), scaled with the window; a
      // little higher (31%) so SYSTEM CHECK, raised over the signature,
      // clears it on short windows.
      className="absolute left-[4.44vw] top-[31%]"
      onPointerEnter={() => setArmed(true)}
    >
      {/* The load fade on the whole frame: never a border alone. */}
      <div className="crt-frame hero-bar-in relative w-[300px]" style={{ zoom: scale }}>
        {(
          [
            "left-[-4px] top-[-4px]",
            "right-[-4px] top-[-4px]",
            "bottom-[-4px] left-[-4px]",
            "bottom-[-4px] right-[-4px]",
          ] as const
        ).map((pos) => (
          <span key={pos} aria-hidden="true" className={`crt-node ${pos}`} />
        ))}
        <div className="flex h-10 items-center justify-between border-b border-crt-line px-3.5 font-vt text-[20px] tracking-[0.12em]">
          <span className="text-[var(--crt-row-value)]">CH.01 · README TOUR</span>
          <span aria-hidden="true" className="crt-term__dots">
            <span />
            <span />
            <span />
          </span>
        </div>
        <div className="relative m-3.5 h-[152px] overflow-hidden border border-crt-line [background:var(--crt-media)]">
          <video
            key={reduced ? "still" : "loop"}
            ref={previewRef}
            src={INTRO_VIDEO.src}
            poster={INTRO_VIDEO.poster}
            muted
            loop
            playsInline
            preload={armed ? "metadata" : "none"}
            aria-hidden="true"
            tabIndex={-1}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) setLength(clock(d));
            }}
            className="h-full w-full object-cover"
          />
          {/* The palette as a small blend layer over the clip, like the robot's:
            an SVG filter on a playing video cost scene 1 frames. */}
          <span aria-hidden="true" className="crt-tile-tint absolute inset-0" />
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
            {PLAY}
          </span>
          <span
            aria-hidden="true"
            className="crt-scanlines crt-scanlines--media absolute inset-0"
          />
        </div>
        <div className="flex items-center justify-between px-3.5 pb-3.5">
          <button
            type="button"
            onClick={() => openGallery()}
            onFocus={() => setArmed(true)}
            aria-haspopup="dialog"
            aria-label={`Watch the README tour, ${VIDEO_COUNT_LABEL.toLowerCase()}${length ? ` (intro ${length})` : ""}`}
            data-testid="hero-intro-open"
            className="crt-button min-h-11 px-3.5 text-[21px]"
          >
            WATCH THE TOUR
          </button>
          <span className="font-mono text-[11px] text-crt-dim">[{VIDEO_COUNT_LABEL}]</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Phones: WATCH THE VIDEOS (HeroM.dc.html), opening the README tour (the
 * video gallery). Above BUILD THE FUTURE, under the sign (María Sol, 13 Nov).
 */
export const IntroButtonPhone = () => {
  return (
    <div className="mb-[18px] flex justify-center">
      <button
        type="button"
        onClick={() => openGallery()}
        aria-haspopup="dialog"
        aria-label="Watch the videos: the README tour"
        data-testid="hero-intro-open"
        className="crt-button hero-bar-in pointer-events-auto flex min-h-11 items-center gap-2.5 px-[18px] text-[21px] tracking-[0.14em]"
        // On a panel: it sits over the robot's chest (dark ink in light). Inline:
        // .crt-button's own background would win over a utility.
        style={{ background: "var(--crt-panel)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M3 2 L12 7 L3 12 Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        WATCH THE VIDEOS
      </button>
    </div>
  );
};
