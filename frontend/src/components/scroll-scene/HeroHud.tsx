import type { ReactNode, Ref } from "react";

// Scene 1's marks, CRT look (design/crt/msse-crt-redesign/design-source/Hero*.dc.html).
// The timeline fades each HUD window in on its own scroll step; no translate
// utilities on the outer boxes, GSAP animates their y. Colours are the page
// theme's --crt-* tokens (the hero section itself is fixed to data-theme="dark",
// so no Tailwind dark: variants in here).

// The sign's bad tubes: each letter on its own random timing (seeded, so the
// server and the client agree), dropping out for a moment now and then.
const tube = (n: number) => {
  const r = (k: number) => {
    const x = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    animationDuration: `${(4.5 + r(1) * 7).toFixed(2)}s`,
    animationDelay: `${(-r(2) * 9).toFixed(2)}s`,
  };
};

const COPIES = 3;

/** One run of the sign: MSSE MSSE MSSE, every letter its own tube. */
const NeonRun = ({ run }: { run: number }) => (
  <span className="flex shrink-0">
    {Array.from({ length: COPIES }, (_, c) => (
      <span key={c} className="flex shrink-0">
        {"MSSE".split("").map((ch, k) => (
          <span key={k} className="neon-tube" style={tube(run * 100 + c * 10 + k)}>
            {ch}
          </span>
        ))}
        {/* A plain space between copies (a real one: the flex row would drop
            a bare whitespace). */}
        <span className="whitespace-pre">{" "}</span>
      </span>
    ))}
  </span>
);

/**
 * MSSE behind the robot: a neon sign (María Sol, 12 Nov). A seamless,
 * endless marquee in one direction (two identical runs sliding by one run's
 * width: never a gap), each letter's tube flickering on its own timing, the
 * glow breathing; a wide halo and softer letters make it read as distant.
 * Paused while the hero is off screen. Reduced motion: one still, steady MSSE.
 */
export const HeroWordmark = ({
  ref,
  isMobile,
}: {
  ref?: Ref<HTMLDivElement>;
  isMobile: boolean;
}) => (
  // The CSS load fade sits on the inner box; GSAP owns the outer one's opacity.
  <div
    ref={ref}
    aria-hidden="true"
    className={`hero-wordmark--depth pointer-events-none absolute inset-x-0 overflow-hidden ${
      // Phones: behind the head, which sits at 20% of the height
      // (choreography's PHONE_CROWN_AT): 186px at the old 183px crown.
      isMobile ? "hero-wordmark--depth-phone top-[calc(20vh+3px)]" : "top-[16.67%]"
    }`}
  >
    <div className={`hero-title-in hero-wordmark ${isMobile ? "hero-wordmark--phone" : ""}`}>
      {/* The breathing on its own box: the load fade owns the outer one's animation. */}
      <div className="neon-breathe">
        <div className="hero-marquee flex w-max motion-reduce:hidden">
          <NeonRun run={0} />
          <NeonRun run={1} />
        </div>
        <div className="hidden motion-reduce:block">MSSE</div>
      </div>
    </div>
  </div>
);

// Desktop crosshair around the head (Hero.dc.html at 1440x900: box 525,28
// 360x372). The camera keeps its vertical field of view, so the head scales
// with the window height and stays centred: the box is in vh from the centre.
const VH = (px: number) => `${(px / 900) * 100}vh`;

/**
 * [core.head] crosshair around the robot's head, with its tags. The timeline
 * moves and sizes the box onto the head every frame (headScreenRect); until it
 * has read the head, the box sits where the design puts it.
 */
export const HeadCrosshair = ({
  ref,
  isMobile,
}: {
  ref?: Ref<HTMLDivElement>;
  isMobile: boolean;
}) => {
  const tag = "absolute whitespace-nowrap font-mono text-crt-node crt-glow-label";
  return (
    <div aria-hidden="true" data-testid="hero-crosshair" className="hero-bar-in">
      <div
        ref={ref}
        data-testid="hero-crosshair-box"
        className="absolute will-change-transform"
        style={
          isMobile
            ? // HeroM.dc.html at 390x844: box 92,140 200x240.
              { left: 92, top: 140, width: 200, height: 240 }
            : {
                left: `calc(50% - ${VH(15)} - ${VH(180)})`,
                top: VH(28),
                width: VH(360),
                height: VH(372),
              }
        }
      >
        <Corners size={isMobile ? 24 : 40} width={isMobile ? 2 : 3} />
        {!isMobile && (
          <>
            {/* The centre mark (Hero.dc.html: 12x2 and 2x12 at 194,150 of 360x372). */}
            <span className="absolute left-[54%] top-[40.6%] h-[2px] w-3 bg-crt-node" />
            <span className="absolute left-[55.3%] top-[39%] h-3 w-[2px] bg-crt-node" />
          </>
        )}
        <span
          className={`${tag} ${isMobile ? "-top-[22px] left-0 text-[11px]" : "-left-[45px] -top-6 text-[14px]"}`}
        >
          [core.head]
        </span>
        {!isMobile && (
          <span className={`${tag} left-[calc(100%+15px)] top-[calc(100%+4px)] text-[14px]`}>
            [msse.online]
          </span>
        )}
      </div>
    </div>
  );
};

const Corners = ({ size, width }: { size: number; width: number }) => {
  const c = "absolute border-crt-node";
  const s = { width: size, height: size };
  return (
    <>
      <span
        className={`${c} left-0 top-0`}
        style={{ ...s, borderLeftWidth: width, borderTopWidth: width }}
      />
      <span
        className={`${c} right-0 top-0`}
        style={{ ...s, borderRightWidth: width, borderTopWidth: width }}
      />
      <span
        className={`${c} bottom-0 left-0`}
        style={{ ...s, borderLeftWidth: width, borderBottomWidth: width }}
      />
      <span
        className={`${c} bottom-0 right-0`}
        style={{ ...s, borderRightWidth: width, borderBottomWidth: width }}
      />
    </>
  );
};

// Barcode bars (Hero.dc.html's generator): 46 bars, 1/2/4px wide, every 9th taller.
const BARS = Array.from({ length: 46 }, (_, i) => {
  const s = Math.sin(i * 91.7) * 43758.5453;
  const r = s - Math.floor(s);
  return { w: r > 0.7 ? 4 : r > 0.35 ? 2 : 1, h: i % 9 === 0 ? 34 : 28 };
});

// The design's SYSTEM CHECK lines; "ok" values in the brightest ink.
const CHECKS = [
  ["core", "................."],
  ["interface", "............"],
  ["engine", "..............."],
] as const;

/** Ø1.2: barcode + SYSTEM CHECK, bottom-left. */
export const SystemCheck = ({ ref, scale = 1 }: { ref?: Ref<HTMLDivElement>; scale?: number }) => (
  // Hero.dc.html: 64 from the left, 340 wide (~24vw), scaled with the window;
  // 104px from the bottom, clear of the floating MSSE:// signature under it
  // (María Sol, pre-launch: they collided at the design's 56).
  <div ref={ref} data-testid="hero-system-check" className="absolute bottom-[104px] left-[4.44vw]">
    {/* The load fade on the whole window: the frame never shows alone. */}
    <div
      className="hero-bar-in w-[340px] border border-crt-line bg-[var(--crt-panel)] px-4 py-3.5"
      style={{ zoom: scale }}
    >
      <div aria-hidden="true" className="flex h-[34px] items-end gap-0.5">
        {BARS.map((b, i) => (
          <span key={i} className="block bg-crt-node" style={{ width: b.w, height: b.h }} />
        ))}
      </div>
      <div className="mt-2.5 font-mono text-[11px] leading-[1.7] text-crt-text-2">
        <div>
          <span className="text-crt-text">SYSTEM CHECK</span> · MSSE-095
        </div>
        {CHECKS.map(([name, dots]) => (
          <div key={name}>
            &gt; {name} {dots} <span className="text-crt-title">OK</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Phones: the top of WATCH THE VIDEOS and BUILD THE FUTURE (HeroM.dc.html's
 * 590px less the button), raised on a short screen so the lines and SCROLL
 * stay above the dock and the browser's bars (svh: the visible height).
 */
export const PHONE_HEADLINE_TOP = "min(528px, calc(100svh - 240px))";

/** Ø1.3: BUILD THE FUTURE / ONE SYSTEM AT A TIME, top-right (phones: centred, low). */
export const HeroHeadline = ({
  ref,
  isMobile,
  scale = 1,
  children,
}: {
  ref?: Ref<HTMLDivElement>;
  isMobile: boolean;
  /** Desktop: the HUD's scale with the window (22px type, ~1.5vw at 1440). */
  scale?: number;
  /** Phones: the WATCH THE VIDEOS button above the lines. */
  children?: ReactNode;
}) => (
  <div
    ref={ref}
    className={`hero-headline absolute font-inter font-extralight uppercase tracking-[0.3em] ${
      isMobile
        ? "inset-x-0 text-center text-[15px] leading-[1.7]"
        : "right-[4.44vw] top-[6.4vh] text-right text-[22px] leading-[1.6]"
    }`}
    style={isMobile ? { top: PHONE_HEADLINE_TOP } : undefined}
  >
    {/* Phones: WATCH THE VIDEOS above the lines (María Sol, 13 Nov: never
        under the dock). */}
    {isMobile && children}
    {/* Screen readers get these lines from HeroHeading, the page's h1. */}
    <div aria-hidden="true" className="hero-bar-in" style={isMobile ? undefined : { zoom: scale }}>
      <div data-testid="hero-headline-1" className="text-crt-title crt-glow-label">
        Build the future
      </div>
      <p data-testid="hero-headline-2" className="hero-headline__2">
        One system at a time
      </p>
    </div>
    {!isMobile && children}
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

/** SCROLL, bottom centre, with its line. */
const Scroll = ({ ref, isMobile }: { ref?: Ref<HTMLDivElement>; isMobile: boolean }) => (
  <div
    ref={ref}
    aria-hidden="true"
    data-testid="scroll-cue"
    className={`pointer-events-none absolute left-1/2 crt-cue flex w-20 flex-col items-center font-vt uppercase tracking-[0.2em] ${
      isMobile
        ? "bottom-[calc(100vh-100svh+env(safe-area-inset-bottom,0px)+64px)] -ml-10 gap-1.5 text-[17px]"
        : "bottom-[30px] -ml-10 gap-2 text-[20px]"
    }`}
  >
    <span className="hero-bar-in">Scroll</span>
    <span
      className={`hero-bar-in hero-hint block w-px bg-[linear-gradient(180deg,var(--crt-title),transparent)] ${
        isMobile ? "h-[26px]" : "h-9"
      }`}
    />
  </div>
);

/** Phones: SCROLL, shown from the start. */
export const ScrollCuePhone = ({ ref }: { ref?: Ref<HTMLDivElement> }) => (
  <Scroll ref={ref} isMobile />
);

/** The SCROLL indicator, after the three steps (desktop). */
export const ScrollCue = ({ ref }: { ref?: Ref<HTMLDivElement> }) => (
  <Scroll ref={ref} isMobile={false} />
);
