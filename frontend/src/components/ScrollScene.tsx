import { useEffect, useRef, useState, type ReactNode } from "react";
import Spline from "@splinetool/react-spline";
import { Application } from "@splinetool/runtime";
import { profile } from "../data/portfolioData";
import { useTheme } from "../hooks/useTheme";
import { MOBILE_LAYOUT_QUERY } from "../lib/layout";
import { LAYOUT_RELOADS, LOADED_AS_PHONE } from "../lib/layoutReload";
import { REDUCED_MOTION_QUERY } from "../lib/motion";
import { OVERSAMPLE_1 } from "../lib/spline/camera";
import { patchSplineRuntime } from "../lib/spline/runtime";
import { bootBlip } from "../lib/sound";
import { SceneBoundary } from "./spline/SceneBoundary";
import { CapabilityCards } from "./scroll-scene/CapabilityCards";
import { scene2Scale } from "./scroll-scene/choreography";
import { at, clampScale, FRAME } from "../hooks/useFrame";
import { DOSSIER_H, DOSSIER_W } from "./scroll-scene/CapabilityCards";

// Room kept under scene 2's card for the dock, px.
const DOCK_ROOM = 100;
import { AsciiObject } from "./scroll-scene/AsciiObject";
import type { Shape } from "./scroll-scene/ascii";
import { goToSection } from "../hooks/useActiveSection";
import {
  HeadCrosshair,
  HeroHeadline,
  HeroHeading,
  HeroWordmark,
  ScrollCue,
  ScrollCuePhone,
  SystemCheck,
} from "./scroll-scene/HeroHud";
import { IntroButtonPhone, IntroTile } from "./scroll-scene/IntroVideo";
import { useCalloutsAboveDock } from "./scroll-scene/useCalloutsAboveDock";
import { useHeroScenes } from "./scroll-scene/useHeroScenes";
import { useHeroElements, useHeroTimeline } from "./scroll-scene/useHeroTimeline";
import { useMediaQuery } from "../hooks/useMediaQuery";

patchSplineRuntime(Application);

// One screen of the hero (its section's h-screen min-h-[640px]).
const PANE_H = "h-[max(100vh,640px)]";
const PANE_MIN_H = "min-h-[max(100vh,640px)]";

// Longest wait for the robot before the wordmark and top bar fade in anyway, ms.
const HERO_IN_CAP = 6000;

export const ScrollScene = ({ onJourneyEnd }: { onJourneyEnd?: () => void }) => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const els = useHeroElements();
  const {
    sectionRef,
    canvasWrapRef,
    canvas2WrapRef,
    parallax1Ref,
    parallax2Ref,
    idle1Ref,
    idle2Ref,
    splineLayerRef,
    bg1Ref,
    wordmarkRef,
    topBarRef,
    crosshairRef,
    introRef,
    checkRef,
    scrollCueRef,
    headlineRef,
    skipRef,
    layer2Ref,
    title2Ref,
    cardsRef,
    scene2PaneRef,
  } = els;
  // Each layer A mount gets its own box: with two canvases in canvasWrapRef, a
  // querySelector would release the wrong one.
  const slot1BoxRef = useRef<HTMLDivElement>(null);
  const altBoxRef = useRef<HTMLDivElement>(null);

  // A breakpoint flip rebuilds the timeline (isMobile is an effect dependency).
  // Desktop windows keep the layout they loaded with: crossing the breakpoint
  // reloads the page (lib/layoutReload) instead of swapping the scenes here.
  const liveMobile = useMediaQuery(MOBILE_LAYOUT_QUERY);
  const isMobile = LAYOUT_RELOADS ? LOADED_AS_PHONE : liveMobile;
  // Reduced motion: no pin, no scrub; scene 2 gets its own screen under scene 1.
  // Also the fallback if the pinned timeline fails to build.
  const reduceMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [stackedFallback, setStackedFallback] = useState(false);
  const stacked = reduceMotion || stackedFallback;

  const {
    refs: sceneRefs,
    sceneUrl,
    slot1Url,
    heroAltUrl,
    showAlt,
    failed,
    revealed,
    onHeroLoad,
    onHeroFail,
    onAltLoad,
    onAltFail,
  } = useHeroScenes(isMobile, darkMode, { canvasWrapRef, slot1BoxRef, altBoxRef, canvas2WrapRef });

  // The load fades (wordmark, top bar) wait for the robot so all three land
  // together; a slow scene never holds the text back longer than HERO_IN_CAP.
  const [capped, setCapped] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCapped(true), HERO_IN_CAP);
    return () => clearTimeout(t);
  }, []);
  const heroIn = revealed || capped;
  // The HUD lands: a boot blip (when sound is on).
  useEffect(() => {
    if (heroIn) bootBlip();
  }, [heroIn]);

  // Hidden desktop mounts also get visibility:hidden, which takes them out of
  // compositing and hit-testing: one live robot per layer.
  const hiddenCls = "invisible opacity-0";

  useCalloutsAboveDock(isMobile && !stacked, sectionRef, cardsRef);

  // Once the hero has scrolled fully off screen it leaves painting: its idle
  // Spline canvases still cost the compositor enough to starve scene 3's
  // video decoder (the featured clip ran at ~0.3x). Back the moment a pixel
  // of it returns.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        el.style.visibility = e?.isIntersecting ? "" : "hidden";
        // CSS loops (the sign's marquee and tubes) pause with it.
        el.dataset.offscreen = e?.isIntersecting ? "false" : "true";
      },
      { rootMargin: "-1px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.style.visibility = "";
    };
  }, [sectionRef]);

  // Scene 2 desktop is the 1440 x 900 design scaled to the window (A9's one
  // factor, scene2Scale). The title no longer dodges a giant head: the robot
  // has left (CRT redesign), so the old title fit has nothing to fit around.
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  useEffect(() => {
    if (isMobile) return undefined;
    // One update per frame: a drag fires resize far more often.
    let frame = 0;
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setViewport({ width: window.innerWidth, height: window.innerHeight });
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [isMobile]);
  const stageK = scene2Scale(viewport);
  // Each scene 2 block keeps its place in the 1440 x 900 frame and scales with
  // the window's width, capped where the height runs out (María Sol, 12 Nov:
  // fluid, never a fixed small card): nothing overflows or reaches the title,
  // the rail or the dock.
  const kw = viewport.width / FRAME.width;
  const kh = viewport.height / FRAME.height;
  const kTitle = clampScale(Math.min(kw, 1.25 * kh));
  const kObject = clampScale(Math.min(kw, kh));
  // Scene 1's HUD (tour tile, SYSTEM CHECK, BUILD THE FUTURE, top bar, rail):
  // Hero.dc.html's sizes at the window's width, capped by its height, so they
  // grow on big screens and shrink on small ones without reaching the head
  // or the dock (María Sol, 12 Nov).
  const kHud = clampScale(Math.min(kw, 1.15 * kh), 0.75, 1.9);
  // The card's height follows its body (never clipped): measured, then fitted
  // (María Sol, 13 Nov) between WHAT THE CORE RUNS ON (its block at y 52:
  // the label and the title, ~72px at scale 1, then a gap) and the bottom of
  // the 01/02/03 rail (at y 776, 46px tall at the object's scale), the frame
  // and type scaled together.
  const [dossierH, setDossierH] = useState(DOSSIER_H);
  const cardTop = 52 * kh + 94 * kTitle;
  const cardBottom = Math.min(776 * kh + 46 * kObject, viewport.height - DOCK_ROOM * 0.75);
  const kCard = clampScale(
    Math.min(kw, (cardBottom - cardTop) / dossierH, (viewport.width - 64 - 800 * kw) / DOSSIER_W),
    0.5,
  );
  /** A block of the frame at (x, y), scaled by k from its top-left corner. */
  const block = (x: number, y: number, k: number, children: ReactNode, className = "") => (
    <div className={`absolute ${className}`} style={at(x, y)}>
      <div style={{ zoom: k }}>{children}</div>
    </div>
  );
  // The decor (glow, streaks, STACK): the whole frame scaled, centred.
  const stage = (children: ReactNode) => (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[1440px]"
      style={{ transform: `translate(-50%, -50%) scale(${stageK})` }}
    >
      {children}
    </div>
  );

  const { journeyDone, skipIntro, cardIndex } = useHeroTimeline({
    isMobile,
    stacked,
    onFail: () => setStackedFallback(true),
    darkMode,
    sceneUrl,
    onJourneyEnd,
    els,
    scenes: sceneRefs,
  });

  // Scene 2's step (0..2): the scroll's card in the pinned sequence (before
  // the first card, the first); stacked, the rail's pick.
  const [pickedStep, setPickedStep] = useState(0);
  const step = (stacked ? pickedStep : Math.max(0, cardIndex)) as Shape;
  const pickStep = (i: number) => {
    if (stacked) setPickedStep(i);
    else goToSection(1, i);
  };

  // Scene 2's pieces: inside the pinned hero, or (stacked) on their own screen
  // right below it.
  const scene2Ground = (
    <>
      {/* Scene 2 ground (Main*.dc.html), under scene 1's: the CRT ground, its
          grid, a soft glow behind the object, the light streaks and STACK. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-crt-bg" />
        <div className="crt-grid absolute inset-0" />
        {isMobile ? (
          <>
            <div className="crt-scene2-glow absolute left-0 top-20 h-[340px] w-full" />
            <div className="crt-streak absolute left-0 top-[168px] h-[5px] w-16 blur-[1.5px]" />
            <div className="crt-streak absolute right-0 top-[300px] h-[7px] w-[50px] opacity-70 blur-[2px]" />
          </>
        ) : (
          stage(
            <>
              <div className="crt-scene2-glow absolute left-[60px] top-[170px] h-[640px] w-[820px]" />
              <div className="crt-stack-word absolute -bottom-[70px] left-9 font-michroma text-[250px] leading-none tracking-[0.02em]">
                STACK
              </div>
              <div className="crt-streak absolute left-0 top-[262px] h-[7px] w-[150px] blur-[1.5px]" />
              <div className="crt-streak absolute left-0 top-[284px] h-[3px] w-[88px] opacity-75 blur-[1px]" />
              <div className="crt-streak absolute left-0 top-[548px] h-[10px] w-[120px] opacity-50 blur-[2.5px]" />
              <div className="crt-streak absolute left-0 top-[566px] h-1 w-[60px] blur-[1px]" />
              <div className="crt-streak absolute left-[712px] top-[640px] h-[5px] w-[70px] opacity-70 blur-[1.5px]" />
            </>,
          )
        )}
      </div>
    </>
  );
  const scene2TitleBox = (
    <div
      ref={title2Ref}
      data-testid="capabilities-title"
      className={`pointer-events-none absolute ${
        isMobile
          ? "left-[22px] right-[22px] top-[26px] flex items-start justify-between"
          : "inset-0"
      }`}
    >
      {(isMobile ? (c: ReactNode) => <div>{c}</div> : (c: ReactNode) => block(64, 52, kTitle, c))(
        <>
          <div
            className={`crt-section-label font-vt tracking-[0.14em] ${isMobile ? "text-[18px]" : "text-[22px]"}`}
          >
            02 // CAPABILITIES
          </div>
          <h2
            className={`crt-glow m-0 font-michroma font-normal uppercase text-[var(--crt-row-value)] ${
              isMobile
                ? "mt-1 whitespace-nowrap text-[clamp(14px,4.3vw,17px)] tracking-[0.05em]"
                : "mt-1.5 text-[34px] tracking-[0.06em]"
            }`}
          >
            What the core runs on
          </h2>
        </>,
      )}
      {isMobile ? (
        <span
          role="img"
          aria-label="Status online"
          className="mt-1.5 h-2 w-2 rounded-full bg-status shadow-[0_0_10px_#F472B6]"
        />
      ) : (
        <div
          className="crt-glow-label absolute flex items-center gap-2.5 font-vt text-[22px] tracking-[0.14em] text-crt-text"
          style={{
            right: `${(64 / FRAME.width) * 100}%`,
            // On the 02 // CAPABILITIES line (María Sol, 13 Nov).
            top: `${(52 / FRAME.height) * 100}%`,
            zoom: kTitle,
          }}
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-status shadow-[0_0_10px_#F472B6]"
          />
          <span>STATUS: ONLINE</span>
        </div>
      )}
    </div>
  );
  const scene2Title = scene2TitleBox;
  const scene2Head = (
    <>
      {/* Layer 2: the robot has left (SPEC §3). In its place, the ASCII object:
          text, not WebGL, so scene 2 frees the GPU. No Spline scene loads here
          any more; the crossfade still fades this layer in. */}
      <div
        ref={layer2Ref}
        data-scene2-layer=""
        className={`pointer-events-none absolute ${stacked ? `inset-x-0 top-0 ${PANE_H}` : "inset-0"}`}
      >
        {/* The timeline binds these wrappers (camera framing, drift); they
            stay, empty. */}
        <div ref={canvas2WrapRef} data-testid="spline2-canvas-wrap" className="absolute inset-0">
          <div ref={parallax2Ref} className="absolute inset-0">
            <div ref={idle2Ref} className="absolute inset-0" />
          </div>
        </div>
        {/* Phones: the object sits behind each card's description (CapabilityCard). */}
        {!isMobile &&
          block(
            150,
            210,
            kObject,
            <AsciiObject step={step} isMobile={false} reduced={reduceMotion} />,
          )}
      </div>
    </>
  );
  const cards = (
    <CapabilityCards
      ref={cardsRef}
      active={step}
      onPick={pickStep}
      isMobile={isMobile}
      stacked={stacked}
      scale={{ rail: kObject, card: kCard, cardTop }}
      onCardHeight={setDossierH}
    />
  );
  const scene2Cards = (
    <>
      {/* Scene 2's rail and card, in front of the object. */}
      <div
        className={`pointer-events-none z-10 ${
          !stacked
            ? "absolute inset-0"
            : isMobile
              ? "relative"
              : `absolute inset-x-0 top-0 ${PANE_H}`
        }`}
      >
        {cards}
      </div>
    </>
  );

  // The section is fixed to data-theme="dark", so its own tokens never change
  // with the page theme; elements that follow the page set data-theme themselves.
  return (
    <>
      <section
        id="hero"
        ref={sectionRef}
        data-testid="scene-section"
        data-theme="dark"
        data-hero-in={heroIn}
        data-stacked={stacked}
        className="relative h-screen min-h-[640px] w-full overflow-hidden"
      >
        <HeroHeading />
        {!stacked && scene2Ground}
        {!stacked && scene2Title}
        {/* Scene 1 ground (Hero*.dc.html): the CRT ground, its grid and a soft
            phosphor glow behind the robot. */}
        <div ref={bg1Ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-crt-bg" />
          <div className="crt-grid absolute inset-0" />
          <div
            className="crt-hero-glow absolute"
            style={
              isMobile
                ? { left: -60, top: 150, width: 510, height: 520 }
                : { left: "calc(50% - 450px)", top: "13.3%", width: 900, height: 820 }
            }
          />
        </div>

        <HeroWordmark ref={wordmarkRef} isMobile={isMobile} />

        {/* Layer A: the hero scene */}
        <div ref={splineLayerRef} className="absolute inset-0">
          <div
            ref={canvasWrapRef}
            data-testid="hero-canvas-zoom"
            className="absolute inset-0 will-change-transform"
          >
            {/* The robot fades in (opacity + blur on this wrapper) once its scene has loaded. */}
            {!failed && (
              <div
                className={`hero-robot absolute inset-0 ${isMobile ? "hero-robot--phone" : "hero-robot--crt"}`}
                data-revealed={revealed}
                data-testid="spline-canvas-wrap"
              >
                <div ref={parallax1Ref} className="crt-robot-filter absolute inset-0">
                  <div ref={idle1Ref} className="absolute inset-0">
                    {/* Desktop: both models stay mounted (fixed keys) and a class picks the visible
                      one, so a toggle remounts nothing. Phones: one mount, the theme's. */}
                    <div
                      ref={slot1BoxRef}
                      className={`absolute inset-0 ${
                        isMobile ? "opacity-100" : showAlt ? hiddenCls : "opacity-100"
                      }`}
                    >
                      {/* Desktop renders scene 1 at OVERSAMPLE_1 and shows it
                        back at 1:1 under the wrap's VIEW_CSS_SCALE. */}
                      <div
                        className="absolute left-1/2 top-1/2"
                        style={
                          isMobile
                            ? { position: "absolute", inset: 0 }
                            : {
                                width: `${OVERSAMPLE_1 * 100}%`,
                                height: `${OVERSAMPLE_1 * 100}%`,
                                transform: `translate(-50%, -50%) scale(${1 / OVERSAMPLE_1})`,
                              }
                        }
                      >
                        {/* slot1 is the hero: the timeline, view and loader depend on it. If it fails,
                          the hero falls back to the static render. */}
                        {slot1Url && (
                          <SceneBoundary key={slot1Url} name="hero slot1" onFail={onHeroFail}>
                            <Spline scene={slot1Url} onLoad={onHeroLoad} />
                          </SceneBoundary>
                        )}
                      </div>
                    </div>
                    {!isMobile && (
                      <div
                        ref={altBoxRef}
                        className={`absolute inset-0 ${showAlt ? "opacity-100" : hiddenCls}`}
                      >
                        <div
                          className="absolute left-1/2 top-1/2"
                          style={{
                            width: `${OVERSAMPLE_1 * 100}%`,
                            height: `${OVERSAMPLE_1 * 100}%`,
                            transform: `translate(-50%, -50%) scale(${1 / OVERSAMPLE_1})`,
                          }}
                        >
                          {/* Losing this mount leaves slot1's robot: showAlt turns off and the
                            silver one shows in both themes. */}
                          <SceneBoundary key={heroAltUrl} name="hero alt" onFail={onAltFail}>
                            <Spline scene={heroAltUrl} onLoad={onAltLoad} />
                          </SceneBoundary>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {failed && (
              <div className="absolute inset-0" data-testid="hero-fallback">
                <div className="absolute inset-0 bg-ink/[0.02]" />
                <div className="absolute inset-0 bg-grid opacity-50" />
                <div className="absolute inset-0 scanline-overlay" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/robot-alpha.png"
                    alt="MSG·01 humanoid unit — static render"
                    data-testid="hero-robot-fallback"
                    className="relative h-[80vh] object-contain md:h-[95vh]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* The robot's CRT treatment: a blend layer over the live canvas (SPEC §2,
            option 1), never a filter or transform on the canvas. Above the
            robot, under every HUD element. */}
        <div
          aria-hidden="true"
          data-testid="robot-tint"
          className="crt-robot-tint absolute inset-0"
        />

        {!stacked && scene2Head}
        {/* Scene 1 HUD, one window per scroll step (Ø1.1-Ø1.3), then SCROLL. Phones
          get the headline and SCROLL only. */}
        {!isMobile && <IntroTile ref={introRef} scale={kHud} />}
        {!isMobile && <SystemCheck ref={checkRef} scale={kHud} />}
        <HeroHeadline ref={headlineRef} isMobile={isMobile} scale={kHud}>
          {isMobile && <IntroButtonPhone />}
        </HeroHeadline>
        {isMobile ? <ScrollCuePhone ref={scrollCueRef} /> : <ScrollCue ref={scrollCueRef} />}

        {/* Top bar, scene 1 only: MSSE:// and STATUS, and the crosshair on the
            head (they leave together at the crossfade). */}
        <div ref={topBarRef} className="pointer-events-none absolute inset-0">
          <HeadCrosshair ref={crosshairRef} isMobile={isMobile} />
          {/* The CSS load fade sits on this inner box; GSAP owns the outer one.
              Desktop: on BUILD THE FUTURE's first line (María Sol, 13 Nov):
              the same top, a box as tall as that line (22px at 1.6), the
              text centred in it, at the same scale. */}
          <div
            className={`absolute ${isMobile ? "inset-x-5 top-[22px]" : "left-[4.44vw] top-[6.4vh]"}`}
          >
            <div
              className={`hero-bar-in flex items-center ${
                isMobile ? "justify-between" : "h-[35.2px] gap-[18px]"
              }`}
              style={isMobile ? undefined : { zoom: kHud }}
            >
              <span
                data-testid="hero-brand"
                className={`font-michroma tracking-[0.08em] text-crt-title crt-glow-label ${
                  isMobile ? "text-[13px]" : "text-[16px]"
                }`}
              >
                {profile.shortMark}
              </span>
              <span
                className={`flex items-center font-vt uppercase text-crt-text ${
                  isMobile
                    ? "gap-[7px] text-[17px] tracking-[0.12em]"
                    : "gap-2 text-[20px] tracking-[0.14em]"
                }`}
              >
                <span
                  data-testid="hero-status-dot"
                  aria-hidden="true"
                  className={`rounded-full bg-status shadow-[0_0_10px_#F472B6] animate-pulse-dot motion-reduce:animate-none ${
                    isMobile ? "h-1.5 w-1.5" : "h-[7px] w-[7px]"
                  }`}
                />
                <span data-testid="hero-status">
                  {isMobile ? profile.status : `STATUS: ${profile.status}`}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Skip intro, until the sequence has been seen (then the dock takes over). */}
        {!journeyDone && (
          <button
            ref={skipRef}
            data-testid="skip-intro"
            onClick={skipIntro}
            className={`crt-skip pointer-events-auto absolute min-h-11 whitespace-nowrap font-vt uppercase ${
              isMobile
                ? "bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] right-3 px-2 text-[17px] tracking-[0.18em]"
                : "bottom-9 right-14 px-3 text-[20px] tracking-[0.2em]"
            } ${
              // On phones the timeline drives its opacity (it hides with the cards); a CSS
              // transition would lag behind it.
              isMobile ? "" : "transition-[opacity,color] duration-300"
            }`}
          >
            <span className="hero-bar-in">Skip intro &gt;&gt;</span>
          </button>
        )}

        {!stacked && scene2Cards}
        {/* CRT overlays over the whole pinned hero (scenes 1 and 2). */}
        <div aria-hidden="true" className="crt-vignette absolute inset-0 z-20" />
        <div aria-hidden="true" className="crt-scanlines absolute inset-0 z-20" />
      </section>
      {/* Stacked (reduced motion, or no timeline): scene 2 as it ends, on its own
        screen under the hero, in normal flow. */}
      {stacked && (
        <div
          ref={scene2PaneRef}
          id="capabilities"
          data-testid="capabilities-stacked"
          data-theme="dark"
          className={`relative w-full overflow-hidden ${PANE_MIN_H}`}
        >
          {scene2Ground}
          {scene2Title}
          {scene2Head}
          {scene2Cards}
          <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 z-20" />
        </div>
      )}
    </>
  );
};
