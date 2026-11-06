import type { Ref } from "react";
import { systemCheck } from "../../data/portfolioData";

// Scene 1's marks (design/source/desktop/light/scene-1-hero.dc.html). The
// timeline fades each HUD window in on its own scroll step; no translate
// utilities on the outer boxes, GSAP animates their y.

const INK = "text-[rgb(var(--hero-ink))]";
const INK_2 = "text-[rgb(var(--hero-ink-2))]";

/** MSSE MSSE …: an endless marquee behind the robot (static with reduced motion). */
export const HeroWordmark = ({ ref }: { ref?: Ref<HTMLDivElement> }) => {
  const row = (
    <span className="flex">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="pr-[0.32em]">
          MSSE
        </span>
      ))}
    </span>
  );
  // The CSS load fade sits on the inner box; GSAP owns the outer one's opacity.
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-[14.4%]"
    >
      <div className="hero-title-in overflow-hidden drop-shadow-[0_18px_26px_rgba(30,38,50,0.12)]">
        <div className="hero-wordmark hero-marquee flex w-max motion-reduce:hidden">
          {row}
          {row}
        </div>
        <div className="hero-wordmark hidden text-center motion-reduce:block">MSSE</div>
      </div>
    </div>
  );
};

/** Ø1.1: the intro video tile. TODO(polish): play the intro once the video exists. */
export const IntroTile = ({ ref }: { ref?: Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    role="img"
    aria-label="Intro video"
    data-testid="hero-intro-tile"
    className="absolute left-[112px] top-[44.4%] w-[184px]"
  >
    <span className="relative block h-[104px] overflow-hidden bg-[#121417] shadow-[0_16px_30px_-14px_rgba(10,14,20,0.6)]">
      <img
        src="/robot-alpha.png"
        alt=""
        className="h-full w-full object-cover [object-position:48%_14%]"
      />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,15,0)_40%,rgba(10,12,15,0.55)_100%)]" />
      <span className="absolute left-1/2 top-1/2 -ml-[17px] -mt-[17px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/[0.92]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#0B0D10" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="absolute bottom-[5px] right-[6px] font-mono text-[9px] text-[#E9EDF1]">
        [ 1:30 ]
      </span>
    </span>
    <span className={`mt-[9px] block text-[12px] leading-[1.45] ${INK}`}>
      <span className="block font-medium">Watch the intro</span>
      <span className={`block ${INK_2}`}>What I&apos;m building right now</span>
    </span>
  </div>
);

// Barcode bar widths, px.
const BARS = [3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 2, 2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1];

/** Ø1.2: barcode + SYSTEM CHECK, frosted, bottom-left. */
export const SystemCheck = ({ ref }: { ref?: Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    data-testid="hero-system-check"
    className="absolute bottom-12 left-10 border border-white/70 bg-[rgba(238,241,244,0.68)] px-4 py-3.5 font-mono text-[10px] leading-[1.65] tracking-[0.04em] text-[#14181D] backdrop-blur-[10px]"
  >
    <div aria-hidden="true" className="mb-3 flex h-6 gap-0.5">
      {BARS.map((w, i) => (
        <span key={i} className="block h-6 bg-[#14181D]" style={{ width: w }} />
      ))}
    </div>
    <div>SYSTEM CHECK</div>
    <div aria-hidden="true" className="text-[#2E343B]">
      ------------------
    </div>
    {systemCheck.map((line) => (
      <div key={line}>{line}</div>
    ))}
    <div aria-hidden="true" className="text-[#2E343B]">
      ------------------
    </div>
  </div>
);

/** Ø1.3: BUILD THE FUTURE / ONE SYSTEM AT A TIME, top-right (phones: bottom, centred). */
export const HeroHeadline = ({
  ref,
  isMobile,
}: {
  ref?: Ref<HTMLDivElement>;
  isMobile: boolean;
}) => (
  <div
    ref={ref}
    className={`absolute font-display text-[15px] uppercase leading-[1.6] tracking-[0.32em] ${INK} ${
      isMobile
        ? "inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+9rem)] text-center text-[13px] tracking-[0.24em]"
        : "right-[112px] top-[22.2%] text-right"
    }`}
  >
    <h1 data-testid="hero-headline-1" className="font-normal">
      Build the future
    </h1>
    <p data-testid="hero-headline-2" className={INK_2}>
      One system at a time
    </p>
  </div>
);

/** The SCROLL indicator, after the three steps (desktop). */
export const ScrollCue = ({ ref }: { ref?: Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    aria-hidden="true"
    data-testid="scroll-cue"
    className="pointer-events-none absolute left-[52px] top-[36.7%] flex flex-col items-center gap-[18px]"
  >
    <span
      className={`font-display text-[13px] uppercase tracking-[0.4em] [writing-mode:vertical-rl] ${INK}`}
    >
      Scroll
    </span>
    <span className="hero-hint block h-[70px] w-px bg-[rgb(var(--hero-ink))]" />
  </div>
);
