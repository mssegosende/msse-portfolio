import { useRef } from "react";
import Spline from "@splinetool/react-spline";
import { Application } from "@splinetool/runtime";
import { profile } from "../data/portfolioData";
import { useTheme } from "../hooks/useTheme";
import { MOBILE_LAYOUT_QUERY } from "../lib/layout";
import { OVERSAMPLE, OVERSAMPLE_1 } from "../lib/spline/camera";
import { patchSplineRuntime } from "../lib/spline/runtime";
import { L2_DESKTOP_URLS } from "../lib/spline/scenes";
import { ReleasingBox } from "./spline/ReleasingBox";
import { SceneBoundary } from "./spline/SceneBoundary";
import { CapabilityCards } from "./scroll-scene/CapabilityCards";
import {
  HeroHeadline,
  HeroWordmark,
  IntroTile,
  ScrollCue,
  SystemCheck,
} from "./scroll-scene/HeroHud";
import { useCalloutsAboveDock } from "./scroll-scene/useCalloutsAboveDock";
import { useHeroScenes } from "./scroll-scene/useHeroScenes";
import { useHeroElements, useHeroTimeline } from "./scroll-scene/useHeroTimeline";
import { useMediaQuery } from "../hooks/useMediaQuery";

patchSplineRuntime(Application);

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
  } = els;
  // Each layer A mount gets its own box: with two canvases in canvasWrapRef, a
  // querySelector would release the wrong one.
  const slot1BoxRef = useRef<HTMLDivElement>(null);
  const altBoxRef = useRef<HTMLDivElement>(null);

  // A breakpoint flip rebuilds the timeline (isMobile is an effect dependency).
  const isMobile = useMediaQuery(MOBILE_LAYOUT_QUERY);

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

  // Hidden desktop mounts also get visibility:hidden, which takes them out of
  // compositing and hit-testing: one live robot per layer.
  const hiddenCls = "invisible opacity-0";

  useCalloutsAboveDock(isMobile, sectionRef, cardsRef);

  const { journeyDone, skipIntro, cardIndex, atEnd } = useHeroTimeline({
    isMobile,
    darkMode,
    sceneUrl,
    onJourneyEnd,
    els,
    scenes: sceneRefs,
  });

  // The section is fixed to data-theme="dark", so its own tokens never change
  // with the page theme; elements that follow the page set data-theme themselves.
  return (
    <section
      id="hero"
      ref={sectionRef}
      data-testid="scene-section"
      data-theme="dark"
      className="relative h-screen min-h-[640px] w-full overflow-hidden"
    >
      {/* Scene 2 ground, under scene 1's: gradient, glow behind the head, shade,
          vignette and the STACK word. Scene 1's ground fades off it. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ background: "var(--hero-bg-2)" }} />
        <div
          className="subject-glow"
          style={{ left: "58%", top: "33%", width: 900, height: 900 }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_22%_78%,rgba(25,32,42,0.22)_0%,rgba(25,32,42,0)_70%),radial-gradient(ellipse_120%_90%_at_55%_45%,rgba(0,0,0,0)_55%,rgba(20,26,34,0.28)_100%)]" />
        <div className="bg-word bg-word--left bg-word--soft">STACK</div>
      </div>

      {/* Scene 2 title. Behind the robot: the giant head sits in front of it. */}
      <div
        ref={title2Ref}
        data-testid="capabilities-title"
        className="pointer-events-none absolute left-4 top-6 sm:left-14 sm:top-[52px]"
      >
        <div className="section-pill bg-white/90 shadow-none">Capabilities</div>
        <h2 className="section-title section-title--light mt-4 leading-none sm:whitespace-nowrap">
          What the core runs on
        </h2>
      </div>

      {/* Scene 1 ground: gradient, a soft glow behind the head, ground shade and vignette. */}
      <div ref={bg1Ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ background: "var(--hero-bg-1)" }} />
        <div className="subject-glow" style={{ left: "50%", top: 350, width: 820, height: 820 }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_15%_88%,rgba(25,32,42,0.2)_0%,rgba(25,32,42,0)_70%),radial-gradient(ellipse_120%_90%_at_50%_40%,rgba(0,0,0,0)_55%,rgba(20,26,34,0.28)_100%)]" />
      </div>

      <HeroWordmark ref={wordmarkRef} />

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
              className="hero-robot absolute inset-0"
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

      {/* Layer 2: scene 2's giant head */}
      <div ref={layer2Ref} className="pointer-events-none absolute inset-0">
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
            }`}
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

      {/* Scene 1 HUD, one window per scroll step (Ø1.1-Ø1.3), then SCROLL. Phones
          get the headline and SCROLL only. */}
      {!isMobile && <IntroTile ref={introRef} />}
      {!isMobile && <SystemCheck ref={checkRef} />}
      <HeroHeadline ref={headlineRef} isMobile={isMobile} />
      {/* TODO(P5): phones get SCROLL in the bottom stack (design: mobile scene 1). */}
      {!isMobile && <ScrollCue ref={scrollCueRef} />}

      {/* Top bar, scene 1 only: MSSE:// and STATUS. */}
      <div ref={topBarRef} className="absolute inset-x-0 top-0">
        {/* The CSS load fade sits on this inner box; GSAP owns the outer one. */}
        <div className="hero-bar-in flex items-center justify-between px-6 py-6 sm:px-12 sm:py-[52px]">
          <span
            data-testid="hero-brand"
            className="font-michroma text-xs tracking-[0.2em] text-[rgb(var(--hero-ink))] sm:text-[19px]"
          >
            {profile.shortMark}
          </span>
          <span className="flex items-center gap-2.5 font-display text-[13px] uppercase tracking-[0.08em] text-[rgb(var(--hero-ink))] sm:text-[15px]">
            <span
              data-testid="hero-status-dot"
              aria-hidden="true"
              className="h-[7px] w-[7px] rounded-full bg-[#2E6FF2] animate-pulse-dot motion-reduce:animate-none"
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
          className={`pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom,0px)+1.75rem)] left-1/2 -translate-x-1/2 px-2.5 py-3.5 font-display text-[14px] uppercase tracking-[0.32em] text-[#F1F3F5] data-[scene="2"]:text-[rgb(var(--hero-ink))] sm:bottom-7 ${
            // On phones the timeline drives its opacity (it hides with the cards); a CSS
            // transition would lag behind it.
            isMobile ? "" : "transition-[opacity,color] duration-300"
          }`}
        >
          <span className="hero-bar-in">Skip intro</span>
        </button>
      )}

      {/* Scene 2's cards, in front of the robot. */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <CapabilityCards
          ref={cardsRef}
          scrollIndex={cardIndex}
          autoRotate={journeyDone && atEnd}
          isMobile={isMobile}
          theme={pageTheme}
        />
      </div>

      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 z-20" />
    </section>
  );
};
