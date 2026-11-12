import type { ReactNode, Ref } from "react";

// Scene 1's marks, CRT look (design/crt/msse-crt-redesign/design-source/Hero*.dc.html).
// The timeline fades each HUD window in on its own scroll step; no translate
// utilities on the outer boxes, GSAP animates their y. Colours are the page
// theme's --crt-* tokens (the hero section itself is fixed to data-theme="dark",
// so no Tailwind dark: variants in here).

/** MSSE in phosphor, behind the robot. Static: the CRT design has no marquee. */
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
    className={`pointer-events-none absolute inset-x-0 ${isMobile ? "top-[96px]" : "top-[16.67%]"}`}
  >
    <div className={`hero-title-in hero-wordmark ${isMobile ? "hero-wordmark--phone" : ""}`}>
      MSSE
    </div>
  </div>
);

// Desktop crosshair around the head (Hero.dc.html at 1440x900: box 525,28
// 360x372). The camera keeps its vertical field of view, so the head scales
// with the window height and stays centred: the box is in vh from the centre.
const VH = (px: number) => `${(px / 900) * 100}vh`;

/** [core.head] crosshair around the robot's head, with its tags. */
export const HeadCrosshair = ({ isMobile }: { isMobile: boolean }) => {
  const tag = "absolute whitespace-nowrap font-mono text-crt-node crt-glow-label";
  if (isMobile) {
    // HeroM.dc.html at 390x844: box 92,140 200x240, tag above it.
    return (
      <div aria-hidden="true" data-testid="hero-crosshair" className="hero-bar-in">
        <div className="absolute left-[92px] top-[140px] h-[240px] w-[200px]">
          <Corners size={24} width={2} />
        </div>
        <span className={`${tag} left-[92px] top-[118px] text-[11px]`}>[core.head]</span>
      </div>
    );
  }
  return (
    <div aria-hidden="true" data-testid="hero-crosshair" className="hero-bar-in">
      <div
        className="absolute"
        style={{
          left: `calc(50% - ${VH(15)} - ${VH(180)})`,
          top: VH(28),
          width: VH(360),
          height: VH(372),
        }}
      >
        <Corners size={40} width={3} />
        {/* The centre mark (Hero.dc.html: 12x2 and 2x12 at 194,150). */}
        <span
          className="absolute h-[2px] w-3 bg-crt-node"
          style={{ left: VH(194), top: VH(150) }}
        />
        <span
          className="absolute h-3 w-[2px] bg-crt-node"
          style={{ left: VH(199), top: VH(145) }}
        />
        <span className={`${tag} text-[14px]`} style={{ left: VH(-45), top: VH(-24) }}>
          [core.head]
        </span>
        <span
          className={`${tag} text-[14px]`}
          style={{ left: "calc(100% + 15px)", top: "calc(100% + 4px)" }}
        >
          [msse.online]
        </span>
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
export const SystemCheck = ({ ref }: { ref?: Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    data-testid="hero-system-check"
    className="absolute bottom-14 left-16 w-[340px] border border-crt-line bg-[var(--crt-panel)] px-4 py-3.5"
  >
    <div aria-hidden="true" className="flex h-[34px] items-end gap-0.5">
      {BARS.map((b, i) => (
        <span key={i} className="block bg-crt-node" style={{ width: b.w, height: b.h }} />
      ))}
    </div>
    <div className="mt-2.5 font-mono text-[11px] leading-[1.7] text-crt-text-2">
      <div>
        <span className="text-crt-text">SYSTEM CHECK</span> · MSSE-01
      </div>
      {CHECKS.map(([name, dots]) => (
        <div key={name}>
          &gt; {name} {dots} <span className="text-crt-title">OK</span>
        </div>
      ))}
    </div>
  </div>
);

/** Ø1.3: BUILD THE FUTURE / ONE SYSTEM AT A TIME, top-right (phones: centred, low). */
export const HeroHeadline = ({
  ref,
  isMobile,
  children,
}: {
  ref?: Ref<HTMLDivElement>;
  isMobile: boolean;
  /** Phones: the WATCH THE VIDEOS button under the lines. */
  children?: ReactNode;
}) => (
  <div
    ref={ref}
    className={`hero-headline absolute font-inter font-extralight uppercase tracking-[0.3em] ${
      isMobile
        ? "inset-x-0 top-[590px] text-center text-[15px] leading-[1.7]"
        : "right-16 top-[58px] text-right text-[22px] leading-[1.6]"
    }`}
  >
    {/* Screen readers get these lines from HeroHeading, the page's h1. */}
    <div aria-hidden="true" className={isMobile ? "hero-bar-in" : ""}>
      <div data-testid="hero-headline-1" className="text-crt-title crt-glow-label">
        Build the future
      </div>
      <p data-testid="hero-headline-2" className="hero-headline__2">
        One system at a time
      </p>
    </div>
    {children}
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
        ? "bottom-[calc(env(safe-area-inset-bottom,0px)+64px)] -ml-10 gap-1.5 text-[17px]"
        : "bottom-[30px] -ml-10 gap-2 text-[20px]"
    }`}
  >
    <span className={isMobile ? "hero-bar-in" : ""}>Scroll</span>
    <span
      className={`hero-hint block w-px bg-[linear-gradient(180deg,var(--crt-title),transparent)] ${
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
