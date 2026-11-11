import { useEffect, useRef, useState } from "react";
import Spline from "@splinetool/react-spline";
import { Application } from "@splinetool/runtime";
import { profile } from "../data/portfolioData";
import { Num } from "./Num";
import { useTheme } from "../hooks/useTheme";
import { MOBILE_LAYOUT_QUERY } from "../lib/layout";
import { LAYOUT_RELOADS, LOADED_AS_PHONE } from "../lib/layoutReload";
import { REDUCED_MOTION_QUERY } from "../lib/motion";
import { OVERSAMPLE, OVERSAMPLE_1 } from "../lib/spline/camera";
import { patchSplineRuntime } from "../lib/spline/runtime";
import { L2_DESKTOP_URLS } from "../lib/spline/scenes";
import { ReleasingBox } from "./spline/ReleasingBox";
import { SceneBoundary } from "./spline/SceneBoundary";
import { CapabilityCards } from "./scroll-scene/CapabilityCards";
import {
  CAP_TITLE_SIZE,
  CAP_TITLE_WIDTHS,
  capTitleFit,
  type CapTitleWidths,
} from "./scroll-scene/capTitle";
import {
  HeroHeadline,
  HeroHeading,
  HeroWordmark,
  PhoneBarcode,
  ScrollCue,
  ScrollCuePhone,
  SystemCheck,
} from "./scroll-scene/HeroHud";
import { IntroTile } from "./scroll-scene/IntroVideo";
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
  // Scene 2's cards follow the page theme; the section itself is fixed to
  // data-theme="dark", so its children set the page theme explicitly.
  const pageTheme = darkMode ? "dark" : "light";

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
    slot2Url,
    heroAltUrl,
    l2VisibleUrl,
    showAlt,
    failed,
    revealed,
    mountScene2,
    scene2Ready,
    scene2Dead,
    onHeroLoad,
    onHeroFail,
    onAltLoad,
    onAltFail,
    onLayer2Load,
    onLayer2MobileFail,
    onLayer2DesktopFail,
    onLayer2Gone,
  } = useHeroScenes(isMobile, darkMode, { canvasWrapRef, slot1BoxRef, altBoxRef, canvas2WrapRef });

  // The load fades (wordmark, top bar) wait for the robot so all three land
  // together; a slow scene never holds the text back longer than HERO_IN_CAP.
  const [capped, setCapped] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCapped(true), HERO_IN_CAP);
    return () => clearTimeout(t);
  }, []);
  const heroIn = revealed || capped;

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
      },
      { rootMargin: "-1px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.style.visibility = "";
    };
  }, [sectionRef]);

  // Scene 2's title stays readable beside the giant head (capTitleFit): it
  // breaks onto two lines, and shrinks only if it must, where one line would
  // run under the head. The cards start below wherever it ends.
  const [viewport, setViewport] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }));
  const [titleWidths, setTitleWidths] = useState<CapTitleWidths>(CAP_TITLE_WIDTHS);
  const titleMeasureRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (isMobile) return undefined;
    let live = true;
    // One update per frame: a drag fires resize far more often, and each one
    // re-rendered the whole hero and its cards.
    let frame = 0;
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setViewport({ w: window.innerWidth, h: window.innerHeight });
      });
    };
    const measure = () => {
      const [full, first] = Array.from(titleMeasureRef.current?.children ?? []) as HTMLElement[];
      if (live && full?.offsetWidth && first?.offsetWidth) {
        setTitleWidths({ full: full.offsetWidth, first: first.offsetWidth });
      }
    };
    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", onResize);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [isMobile]);
  const titleFit = capTitleFit(viewport.w, viewport.h, titleWidths);

  const { journeyDone, skipIntro, cardIndex, atEnd } = useHeroTimeline({
    isMobile,
    stacked,
    onFail: () => setStackedFallback(true),
    darkMode,
    sceneUrl,
    onJourneyEnd,
    els,
    scenes: sceneRefs,
  });

  // Scene 2's pieces: inside the pinned hero, or (stacked) on their own screen
  // right below it.
  const scene2Ground = (
    <>
      {/* Scene 2 ground, under scene 1's: gradient, glow behind the head, shade,
          vignette and the STACK word. Scene 1's ground fades off it. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ background: "var(--hero-bg-2)" }} />
        <div
          className="subject-glow"
          style={
            isMobile
              ? { left: "72%", top: "39%", width: 620, height: 620 }
              : { left: "58%", top: "33%", width: 900, height: 900 }
          }
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_22%_78%,rgba(25,32,42,0.22)_0%,rgba(25,32,42,0)_70%),radial-gradient(ellipse_120%_90%_at_55%_45%,rgba(0,0,0,0)_55%,rgba(20,26,34,0.28)_100%)]" />
        <div className="bg-word bg-word--left bg-word--soft">STACK</div>
      </div>
    </>
  );
  const scene2Title = (
    <>
      {/* Scene 2 title, behind the robot: the giant head sits in front of it
          (phones too, María Sol's review). */}
      <div
        ref={title2Ref}
        data-testid="capabilities-title"
        className={`pointer-events-none absolute ${
          isMobile ? "left-[18px] top-[26px]" : "left-14 top-[52px]"
        }`}
      >
        <div className="section-pill bg-white/90 shadow-none">
          {isMobile && (
            <>
              <Num value="2" /> ·&nbsp;
            </>
          )}
          Capabilities
        </div>
        <h2
          className={`section-title section-title--light ${
            isMobile ? "mt-3 leading-[1.08]" : "mt-4 whitespace-nowrap leading-none"
          }`}
          style={isMobile ? undefined : { fontSize: titleFit.size }}
        >
          What the core {(isMobile || titleFit.lines === 2) && <br />}
          runs on
        </h2>
        {/* The title's lines at full size, measured in the loaded font for capTitleFit. */}
        {!isMobile && (
          <span
            ref={titleMeasureRef}
            aria-hidden="true"
            className="section-title invisible absolute left-0 top-0 whitespace-nowrap"
            style={{ fontSize: CAP_TITLE_SIZE }}
          >
            <span className="inline-block">What the core runs on</span>
            <span className="inline-block">What the core</span>
          </span>
        )}
      </div>
    </>
  );
  const scene2Head = (
    <>
      {/* Layer 2: scene 2's giant head */}
      <div
        ref={layer2Ref}
        className={`pointer-events-none absolute ${stacked ? `inset-x-0 top-0 ${PANE_H}` : "inset-0"}`}
      >
        <div className="absolute inset-0">
          {/* Fallback PNG only when the live scene fails; while loading, the layer
              shows nothing. */}
          {scene2Dead && (
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/robot-alpha.png"
                alt="MSG·01 humanoid unit — static render"
                data-testid="features-robot-fallback"
                className="relative h-[80vh] object-contain md:h-[95vh]"
              />
            </div>
          )}

          <div
            ref={canvas2WrapRef}
            data-testid="spline2-canvas-wrap"
            className={`absolute inset-0 transition-opacity duration-1000 ${
              scene2Ready ? "opacity-100" : "opacity-0"
            } ${isMobile ? "hero-l2--phone" : ""}`}
          >
            {/* The drift wrappers always exist, so the timeline can bind them before
                the scene mounts. */}
            <div ref={parallax2Ref} className="absolute inset-0">
              <div ref={idle2Ref} className="absolute inset-0">
                {mountScene2 && !scene2Dead && (
                  <>
                    {isMobile
                      ? slot2Url && (
                          <div className="absolute inset-0">
                            <SceneBoundary
                              key={slot2Url}
                              name="layer 2 mobile"
                              onFail={onLayer2MobileFail}
                            >
                              <Spline
                                scene={slot2Url}
                                onLoad={(app) => onLayer2Load("m:" + slot2Url, app)}
                              />
                            </SceneBoundary>
                          </div>
                        )
                      : L2_DESKTOP_URLS.map((url) => (
                          <ReleasingBox
                            key={url}
                            onGone={() => onLayer2Gone(url)}
                            className={`absolute left-1/2 top-1/2 ${url === l2VisibleUrl ? "" : "invisible opacity-0"}`}
                            style={{
                              width: `${OVERSAMPLE * 100}%`,
                              height: `${OVERSAMPLE * 100}%`,
                              transform: `translate(-50%, -50%) scale(${1 / OVERSAMPLE})`,
                            }}
                          >
                            {/* If one model fails the other shows (l2VisibleUrl); if both fail, the PNG. */}
                            <SceneBoundary
                              name={"layer 2 " + url}
                              onFail={() => onLayer2DesktopFail(url)}
                            >
                              <Spline scene={url} onLoad={(app) => onLayer2Load("d:" + url, app)} />
                            </SceneBoundary>
                          </ReleasingBox>
                        ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
  const scene2Cards = (
    <>
      {/* Scene 2's cards, in front of the robot. */}
      <div
        className={`pointer-events-none z-10 ${
          !stacked
            ? "absolute inset-0"
            : isMobile
              ? "relative"
              : `absolute inset-x-0 top-0 ${PANE_H}`
        }`}
      >
        <CapabilityCards
          ref={cardsRef}
          scrollIndex={cardIndex}
          autoRotate={journeyDone && atEnd}
          isMobile={isMobile}
          theme={pageTheme}
          titleBottom={titleFit.bottom}
          stacked={stacked}
        />
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
        {/* Scene 1 ground: gradient, a soft glow behind the head, ground shade and vignette. */}
        <div ref={bg1Ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0" style={{ background: "var(--hero-bg-1)" }} />
          <div
            className="subject-glow"
            style={
              isMobile
                ? { left: "36%", top: "39%", width: 620, height: 620 }
                : { left: "50%", top: 350, width: 820, height: 820 }
            }
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_15%_88%,rgba(25,32,42,0.2)_0%,rgba(25,32,42,0)_70%),radial-gradient(ellipse_120%_90%_at_50%_40%,rgba(0,0,0,0)_55%,rgba(20,26,34,0.28)_100%)]" />
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
                className={`hero-robot absolute inset-0 ${isMobile ? "hero-robot--phone" : ""}`}
                data-revealed={revealed}
                data-testid="spline-canvas-wrap"
              >
                <div ref={parallax1Ref} className="absolute inset-0">
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
                          {/* Losing this mount leaves slot1's robot: showAlt turns off and light mode
                            shows the silver one. */}
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

        {!stacked && scene2Head}
        {/* Scene 1 HUD, one window per scroll step (Ø1.1-Ø1.3), then SCROLL. Phones
          get the headline and SCROLL only. */}
        {!isMobile && <IntroTile ref={introRef} />}
        {!isMobile && <SystemCheck ref={checkRef} />}
        <HeroHeadline ref={headlineRef} isMobile={isMobile} />
        {isMobile ? <ScrollCuePhone ref={scrollCueRef} /> : <ScrollCue ref={scrollCueRef} />}

        {/* Top bar, scene 1 only: MSSE:// and STATUS (phones: the barcode under MSSE://). */}
        <div ref={topBarRef} className="absolute inset-x-0 top-0">
          {isMobile && <PhoneBarcode />}
          {/* The CSS load fade sits on this inner box; GSAP owns the outer one. */}
          <div
            className={`hero-bar-in flex items-center justify-between ${
              // Desktop: MSSE:// on the Ø1.1 tile's edge (112px, IntroVideo.tsx).
              isMobile ? "px-[18px] py-[22px]" : "py-[52px] pl-[112px] pr-12"
            }`}
          >
            {/* Phones: a small MSSE:// (STATUS size) and STATUS in a frosted pill. */}
            <span
              data-testid="hero-brand"
              className={`font-michroma text-[rgb(var(--hero-ink))] ${
                isMobile ? "text-[10.5px] tracking-[0.16em]" : "text-[19px] tracking-[0.2em]"
              }`}
            >
              {profile.shortMark}
            </span>
            <span
              className={`flex items-center font-display uppercase tracking-[0.08em] text-[rgb(var(--hero-ink))] ${
                isMobile
                  ? "hero-status-pill gap-2 rounded-full px-3 py-1.5 text-[13px]"
                  : "gap-2.5 text-[15px]"
              }`}
            >
              <span
                data-testid="hero-status-dot"
                aria-hidden="true"
                className={`rounded-full bg-status animate-pulse-dot motion-reduce:animate-none ${
                  isMobile ? "h-1.5 w-1.5" : "h-[7px] w-[7px]"
                }`}
              />
              <span data-testid="hero-status">STATUS: {profile.status}</span>
            </span>
          </div>
        </div>

        {/* Skip intro, until the sequence has been seen (then the dock takes over). */}
        {!journeyDone && (
          <button
            ref={skipRef}
            data-testid="skip-intro"
            onClick={skipIntro}
            className={`pointer-events-auto absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 font-display uppercase tracking-[0.32em] text-[#F1F3F5] data-[scene="2"]:text-[rgb(var(--hero-ink))] ${
              isMobile
                ? "bottom-[calc(env(safe-area-inset-bottom,0px)+12px)] py-3 text-[13px]"
                : "bottom-7 py-3.5 text-[14px]"
            } ${
              // On phones the timeline drives its opacity (it hides with the cards); a CSS
              // transition would lag behind it.
              isMobile ? "" : "transition-[opacity,color] duration-300"
            }`}
          >
            <span className="hero-bar-in">Skip intro</span>
          </button>
        )}

        {!stacked && scene2Cards}
        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 z-20" />
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
