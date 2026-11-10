import type { Ref } from "react";
import { systemCheck } from "../../data/portfolioData";
import { Num } from "../Num";

// Scene 1's marks (design/source/desktop/light/scene-1-hero.dc.html). The
// timeline fades each HUD window in on its own scroll step; no translate
// utilities on the outer boxes, GSAP animates their y.

const INK = "text-[rgb(var(--hero-ink))]";
const INK_2 = "text-[rgb(var(--hero-ink-2))]";

const MarqueeRow = ({ className = "", phone = false }: { className?: string; phone?: boolean }) => {
  const size = phone ? "hero-wordmark--phone" : "text-center";
  const run = (
    <span className="flex">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="pr-[0.32em]">
          MSSE
        </span>
      ))}
    </span>
  );
  return (
    <>
      <div
        className={`hero-wordmark flex w-max motion-reduce:hidden ${phone ? size : ""} ${className}`}
      >
        {run}
        {run}
      </div>
      <div className={`hero-wordmark hidden motion-reduce:block ${size}`}>MSSE</div>
    </>
  );
};

/**
 * MSSE MSSE …: an endless marquee behind the robot (static with reduced motion).
 * Phones: two big rows (212px) low behind the robot, in opposite directions.
 */
export const HeroWordmark = ({ ref, isMobile }: { ref?: Ref<HTMLDivElement>; isMobile: boolean }) =>
  // The CSS load fade sits on the inner boxes; GSAP owns the outer one's opacity.
  isMobile ? (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="hero-title-in absolute inset-x-0 top-[20.85%] overflow-hidden drop-shadow-[0_16px_22px_rgba(30,38,50,0.14)]">
        <MarqueeRow phone className="hero-marquee hero-marquee--phone" />
      </div>
      <div className="hero-title-in absolute inset-x-0 top-[40.3%] overflow-hidden drop-shadow-[0_16px_22px_rgba(30,38,50,0.14)]">
        <div className="opacity-[0.55]">
          <MarqueeRow phone className="hero-marquee hero-marquee--reverse" />
        </div>
      </div>
    </div>
  ) : (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-[14.4%]"
    >
      <div className="hero-title-in overflow-hidden drop-shadow-[0_18px_26px_rgba(30,38,50,0.12)]">
        <MarqueeRow className="hero-marquee" />
      </div>
    </div>
  );

// Ø1.1, the intro video tile, lives in IntroVideo.tsx with its player.

// Barcode bar widths, px.
const BARS = [3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 2, 2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1];

// The data's type: 8px with 0.04em tracking from 390 up (the mock's), easing
// to 7px with none at 360. The robot keeps its px size and comes ~0.7px
// closer per px of narrower screen, so every line ends >= 10px clear of its
// head (at 8px, STATUS: OPEN TO WORK ran into it at 375 and under it at 360).
const PHONE_DATA_TYPE = {
  fontSize: "clamp(7px, calc(100vw / 30 - 5px), 8px)",
  letterSpacing: "clamp(0px, calc((100vw - 360px) * 0.32 / 30), 0.32px)",
};

/**
 * Phones: the Ø1.2 barcode, small and quiet, under MSSE:// at the top-left
 * (María Sol's review: scene 1 felt empty beside the robot), with the desktop
 * card's data under it, plain, without the card (María Sol, 9 Nov).
 */
export const PhoneBarcode = () => (
  <div
    aria-hidden="true"
    data-testid="hero-barcode-phone"
    className="hero-bar-in absolute left-[18px] top-[58px] text-[rgb(var(--hero-ink))] opacity-70"
  >
    <div className="flex h-3.5 gap-px">
      {BARS.map((w, i) => (
        <span key={i} className="block h-full bg-current" style={{ width: w * 0.6 }} />
      ))}
    </div>
    <div className="mt-2 font-mono leading-[1.6]" style={PHONE_DATA_TYPE}>
      {systemCheck.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  </div>
);

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

// Phones: the bottom stack sits on the light band of the scene 1 ground in both
// themes, so it keeps the mock's dark inks in dark mode too (mobile/dark mock).
// Line 2 is a touch darker than the mock's #2E343B: AA 4.5:1 on that band.
const PHONE_INK = "text-[#14181D]";
const PHONE_INK_2 = "text-[#22272D]";
const PHONE_CUE = "#24292F";

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
    className={`absolute font-display uppercase ${
      isMobile
        ? `inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+128px)] text-center ${PHONE_INK}`
        : `right-[112px] top-[22.2%] text-right text-[15px] leading-[1.6] tracking-[0.32em] ${INK}`
    }`}
  >
    {/* Phones: where the visitor is, Ø1 of Ø5 (no section index there). */}
    {isMobile && (
      <div className="hero-bar-in text-[12px] tracking-[0.12em]">
        <Num value="1" className="font-semibold" />{" "}
        <span className="opacity-[0.55]">
          / <Num value="5" />
        </span>
      </div>
    )}
    {/* Screen readers get these lines from HeroHeading, the page's h1. */}
    <div
      aria-hidden="true"
      className={isMobile ? "hero-bar-in mt-3.5 text-[13px] leading-[1.7] tracking-[0.3em]" : ""}
    >
      <div data-testid="hero-headline-1" className="font-normal">
        Build the future
      </div>
      <p data-testid="hero-headline-2" className={isMobile ? PHONE_INK_2 : INK_2}>
        One system at a time
      </p>
    </div>
  </div>
);

/**
 * The page's one h1, for screen readers: the visible headline (HeroHeadline)
 * is faded in at Ø1.3 and out at the crossfade with visibility, which takes an
 * h1 out of the accessibility tree; this one is there from load, always.
 */
export const HeroHeading = () => (
  <h1 data-testid="page-heading" className="sr-only">
    Build the future. One system at a time.
  </h1>
);

/** Phones: SCROLL under the headline, centred, shown from the start. */
export const ScrollCuePhone = ({ ref }: { ref?: Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    aria-hidden="true"
    data-testid="scroll-cue"
    className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom,0px)+60px)] left-1/2 -ml-[50px] flex w-[100px] flex-col items-center gap-2"
  >
    <span
      className="hero-bar-in font-display text-[11px] uppercase tracking-[0.4em]"
      style={{ color: PHONE_CUE }}
    >
      Scroll
    </span>
    <span className="hero-hint block h-[30px] w-px" style={{ background: PHONE_CUE }} />
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
