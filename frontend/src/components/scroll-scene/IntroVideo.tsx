import { useEffect, useRef, useState, type Ref } from "react";
import { createPortal } from "react-dom";
import { INTRO_VIDEO } from "../../data/introVideo";
import { getLenis } from "../../hooks/useLenis";
import { useMediaQuery } from "../../hooks/useMediaQuery";

const INK = "text-[rgb(var(--hero-ink))]";
const INK_2 = "text-[rgb(var(--hero-ink-2))]";

/** 90 -> "1:30". */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/**
 * Ø1.1: the intro video tile. The thumbnail is a muted looping preview (the
 * poster with reduced motion); clicking it opens the player.
 */
export const IntroTile = ({ ref }: { ref?: Ref<HTMLDivElement> }) => {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [open, setOpen] = useState(false);
  const [length, setLength] = useState<string | null>(null);

  // left-[112px]: the top bar's MSSE:// sits on the same edge (ScrollScene.tsx).
  return (
    <div
      ref={ref}
      data-testid="hero-intro-tile"
      className="absolute left-[112px] top-[44.4%] w-[184px]"
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${INTRO_VIDEO.title}${length ? ` (${length})` : ""}`}
        data-testid="hero-intro-open"
        className="group block w-full cursor-pointer text-left"
      >
        <span className="relative block h-[104px] overflow-hidden bg-[#121417] shadow-[0_16px_30px_-14px_rgba(10,14,20,0.6)]">
          <video
            key={reduced ? "still" : "loop"}
            src={INTRO_VIDEO.src}
            poster={INTRO_VIDEO.poster}
            muted
            loop
            playsInline
            autoPlay={!reduced}
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) setLength(clock(d));
            }}
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,15,0)_40%,rgba(10,12,15,0.55)_100%)]" />
          <span className="absolute left-1/2 top-1/2 -ml-[17px] -mt-[17px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/[0.92] transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#0B0D10" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          {length && (
            <span className="absolute bottom-[5px] right-[6px] font-mono text-[9px] text-[#E9EDF1]">
              [ {length} ]
            </span>
          )}
        </span>
        <span className={`mt-[9px] block text-[12px] leading-[1.45] ${INK}`}>
          <span className="block font-medium">{INTRO_VIDEO.title}</span>
          <span className={`block ${INK_2}`}>{INTRO_VIDEO.subtitle}</span>
        </span>
      </button>
      {open && <IntroPlayer reduced={reduced} onClose={() => setOpen(false)} />}
    </div>
  );
};

/**
 * The player: a modal dialog (focus stays inside, the page behind is inert),
 * closed with Esc, the close button or a click outside the video. Plays with
 * sound on open, except with reduced motion (the visitor presses play).
 */
const IntroPlayer = ({ reduced, onClose }: { reduced: boolean; onClose: () => void }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const lenis = getLenis();
    lenis?.stop();
    if (!reduced) void videoRef.current?.play().catch(() => {});
    return () => {
      lenis?.start();
      if (dialog.open) dialog.close();
    };
  }, [reduced]);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={INTRO_VIDEO.title}
      data-testid="intro-dialog"
      onClose={() => {
        // A re-run effect (StrictMode) closes and reopens it: that close event
        // arrives with the dialog open again, and isn't the visitor's.
        if (!dialogRef.current?.open) onClose();
      }}
      onClick={(e) => {
        // The dialog box fills the screen; a click on it (not on the player) is outside.
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
      className="intro-dialog fixed inset-0 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-6 backdrop:bg-[rgba(8,10,13,0.82)] backdrop:backdrop-blur-[6px]"
    >
      <div className="relative w-full max-w-[1100px]">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          data-testid="intro-close"
          className="absolute -top-12 right-0 flex h-10 items-center gap-2 px-1 font-display text-[14px] uppercase tracking-[0.32em] text-[#E9EDF1] hover:text-white"
        >
          Close
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <video
          ref={videoRef}
          src={INTRO_VIDEO.src}
          poster={INTRO_VIDEO.poster}
          controls
          playsInline
          preload="auto"
          className="block aspect-video max-h-[calc(100vh-120px)] w-full bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
        />
      </div>
    </dialog>,
    document.body,
  );
};
