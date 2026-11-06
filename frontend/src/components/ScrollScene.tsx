import { useRef } from "react";
import { motion } from "framer-motion";
import Spline from "@splinetool/react-spline";
import { Application } from "@splinetool/runtime";
import { profile, systemFeatures } from "../data/portfolioData";
import { useTheme } from "../hooks/useTheme";
import { MOBILE_LAYOUT_QUERY } from "../lib/layout";
import { heroLineReveal as lineReveal, heroUiFade as uiFade } from "../lib/motion";
import { OVERSAMPLE, OVERSAMPLE_1 } from "../lib/spline/camera";
import { patchSplineRuntime } from "../lib/spline/runtime";
import { L2_DESKTOP_URLS } from "../lib/spline/scenes";
import { ReleasingBox } from "./spline/ReleasingBox";
import { SceneBoundary } from "./spline/SceneBoundary";
import { FeatureCard } from "./scroll-scene/FeatureCard";
import { FeatureConnectors } from "./scroll-scene/FeatureConnectors";
import { FeaturesRail } from "./scroll-scene/FeaturesRail";
import { HeroLoader } from "./scroll-scene/HeroLoader";
import { StoryPanel } from "./scroll-scene/StoryPanel";
import { useCalloutsAboveDock } from "./scroll-scene/useCalloutsAboveDock";
import { useHeroScenes } from "./scroll-scene/useHeroScenes";
import { useHeroElements, useHeroTimeline } from "./scroll-scene/useHeroTimeline";
import { useMediaQuery } from "../hooks/useMediaQuery";

patchSplineRuntime(Application);

export const ScrollScene = ({ onJourneyEnd }: { onJourneyEnd?: () => void }) => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  // Chapter 2's UI follows the page theme; the section itself is fixed to
  // data-theme="dark", so its children set the page theme explicitly.
  const ch2Theme = darkMode ? "dark" : "light";

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
    overlayRef,
    wallRef,
    wallTopRef,
    vignetteRef,
    storyTitleRef,
    storyPanelRef,
    scrollCueRef,
    layer2Ref,
    layer2InnerRef,
    headlineRef,
    skipRef,
    featuresHeaderRef,
    storyRefs,
    calloutRefs,
    lineRefs,
    dotRefs,
    railRefs,
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
    progress,
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

  useCalloutsAboveDock(isMobile, sectionRef, calloutRefs);

  const { journeyDone, skipIntro } = useHeroTimeline({
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
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[rgb(var(--page-surface))]"
    >
      {/* Layer A: the hero scene over the painted wall */}
      <div ref={splineLayerRef} className="absolute inset-0">
        <div
          ref={canvasWrapRef}
          data-testid="hero-canvas-zoom"
          className="hero-drain absolute inset-0 will-change-transform"
        >
          {/* The wall stays outside the drift wrappers: only the canvas drifts. */}
          <div ref={wallRef} className="absolute inset-0 bg-[rgb(var(--wall-a))]">
            <div
              ref={wallTopRef}
              className="pointer-events-none absolute inset-0 bg-[rgb(var(--wall-b))]"
            />
          </div>

          {!failed && (
            <div className="absolute inset-0" data-testid="spline-canvas-wrap">
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

      {/* Overlay that deepens with the drain (scene 1 only) */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 bg-[rgb(var(--page-surface))]"
      />

      {/* Layer C: the chapter 2 scene */}
      <div ref={layer2Ref} className="pointer-events-none absolute inset-0">
        <div ref={layer2InnerRef} className="hero-lift absolute inset-0">
          {/* Same decoupling as scene 1: only the canvas drifts. The drift transforms
              nest inside the blend wrapper, which resolves against layer2Inner's filter. */}
          <div className="absolute left-1/2 top-1/2 h-[90vh] w-[90vh] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgb(var(--ink) / 0.07),transparent_62%)]" />

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
            {mountScene2 && !scene2Dead && (
              <div className="absolute inset-0">
                <div ref={parallax2Ref} className="absolute inset-0">
                  <div ref={idle2Ref} className="absolute inset-0">
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
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edge vignette, faded in by the timeline */}
      <div
        ref={vignetteRef}
        data-testid="hero-vignette"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(var(--vignette,0_0_0) / 0.55)_100%)]"
      />

      {/* The headline lives outside the z-indexed UI layer: its blend must resolve
          against the scene, and a z-index on an ancestor would cut it off from it. */}
      {/* Features header, outside the z-10 layer for the same reason: the difference
          blend keeps it readable over both the body and the ground. */}
      <div
        ref={featuresHeaderRef}
        className="pointer-events-none absolute inset-x-0 top-8 hidden text-center mix-blend-difference sm:block sm:top-12"
      >
        <p className="font-display text-[13px] uppercase tracking-[0.02em] text-white/[0.83]">
          01 // system features
        </p>
        <h2
          data-testid="features-headline"
          className="mt-4 font-display text-3xl font-light uppercase text-white sm:text-5xl"
        >
          System Features
        </h2>
        <p className="mt-3 font-display text-[13px] uppercase tracking-[0.02em] text-white/65">
          based on the msg·01 core
        </p>
      </div>

      {/* Hero headline. Its treatment depends on the robot behind it, i.e. the theme.
          Over the black robot, difference reads on both wall and body. Over the silver
          one, difference returns mid-grey, so dark mode uses solid white. */}
      <div
        ref={headlineRef}
        className={`pointer-events-none absolute inset-x-0 bottom-44 text-center sm:bottom-44 ${
          darkMode ? "" : "mix-blend-difference"
        }`}
      >
        <div className="overflow-hidden px-4">
          <motion.h1
            variants={lineReveal}
            custom={0}
            initial="hidden"
            animate={revealed ? "show" : "hidden"}
            data-testid="hero-headline-1"
            className={`font-inter text-[clamp(1.4rem,3.3vw,3.1rem)] font-extralight uppercase leading-none tracking-[0.12em] sm:tracking-[0.3em] ${
              isMobile || darkMode ? "text-white" : "text-ink"
            }`}
          >
            — Build the future —
          </motion.h1>
        </div>
        <div className="mt-4 overflow-hidden px-4">
          <motion.p
            variants={lineReveal}
            custom={1}
            initial="hidden"
            animate={revealed ? "show" : "hidden"}
            data-testid="hero-headline-2"
            className={`font-inter text-[clamp(0.8rem,1.81vw,1.6rem)] font-extralight uppercase leading-none tracking-[0.2em] sm:tracking-[0.42em] ${
              isMobile || darkMode ? "text-white" : "text-ink sm:text-ink/40"
            }`}
          >
            one system at a time
          </motion.p>
        </div>
      </div>

      {/* Brand and status sit outside the z-10 layer so their blend works. Light:
          white with difference; dark: solid white (difference over mid-grey metal
          returns mid-grey). */}
      <motion.div
        variants={uiFade}
        custom={0}
        initial="hidden"
        animate={revealed ? "show" : "hidden"}
        className={`absolute left-6 top-6 sm:left-10 sm:top-8 ${
          darkMode ? "" : "mix-blend-difference"
        }`}
      >
        <span
          data-testid="hero-brand"
          className="font-michroma text-xs tracking-[0.12em] text-white sm:text-sm sm:tracking-[0.3em]"
        >
          {profile.shortMark}
          <span className="hidden text-white/65 sm:inline"> {profile.markSuffix}</span>
        </span>
      </motion.div>

      <motion.div
        variants={uiFade}
        custom={1}
        initial="hidden"
        animate={revealed ? "show" : "hidden"}
        data-theme={ch2Theme}
        className="absolute right-6 top-6 sm:right-10 sm:top-8 flex items-center gap-2"
      >
        <span
          data-testid="hero-status-dot"
          className="h-1.5 w-1.5 rounded-full bg-[#2E6FF2] animate-pulse-dot"
        />
        <span
          data-testid="hero-status"
          className="font-display text-[13px] uppercase tracking-[0.02em] text-ink/[0.83] text-halo"
        >
          STATUS: {profile.status}
        </span>
      </motion.div>

      {/* Skip intro, until the sequence has been seen (then the dock takes over).
          Same treatment as the headline: difference over the black robot, solid white over the silver one. */}
      {!journeyDone && (
        <button
          ref={skipRef}
          data-testid="skip-intro"
          onClick={skipIntro}
          className={`pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] left-1/2 flex -translate-x-1/2 items-center gap-2 px-4 py-2 font-display text-[11px] uppercase tracking-[0.24em] sm:bottom-10 ${
            // On phones the timeline drives its opacity (it hides with the cards); a CSS
            // transition would lag behind it.
            isMobile ? "" : "transition-opacity duration-300"
          } ${
            isMobile || darkMode
              ? "text-white"
              : "text-ink hover:text-ink sm:text-white/70 sm:hover:text-white"
          } ${darkMode ? "" : "mix-blend-difference"}`}
        >
          Skip intro
        </button>
      )}

      {/* Scroll cue: the hero is the scroll, so say so. Fades on the first beat;
          difference keeps it legible on the wall, on the robot and in both themes.
          On phones it sits on the right, the side with free wall. */}
      <div
        ref={scrollCueRef}
        data-testid="scroll-cue"
        className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 mix-blend-difference sm:left-6 sm:right-auto sm:gap-3 lg:left-10"
      >
        <span className="font-display text-[9px] uppercase tracking-[0.28em] text-white/75 [writing-mode:vertical-rl] sm:text-[11px] sm:tracking-[0.34em]">
          Scroll
        </span>
        <span className="relative block h-7 w-px overflow-hidden bg-white/25 sm:h-12">
          <span className="absolute inset-x-0 top-0 block h-4 animate-scroll-cue bg-white" />
        </span>
      </div>

      {/* Layer D: UI. z-10 keeps the cards and rail from blending; the marks that
          must blend live outside it. */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Story paragraphs (phase 2) */}
        <StoryPanel
          ref={storyPanelRef}
          titleRef={storyTitleRef}
          paragraphRefs={storyRefs}
          theme={ch2Theme}
        />

        {/* Connector lines and dots (desktop) */}
        {!isMobile && <FeatureConnectors lineRefs={lineRefs} dotRefs={dotRefs} theme={ch2Theme} />}

        {/* Feature cards */}
        {systemFeatures.map((f, i) => (
          <FeatureCard
            key={f.num}
            ref={(el) => {
              calloutRefs.current[i] = el;
            }}
            feature={f}
            isMobile={isMobile}
            theme={ch2Theme}
          />
        ))}

        {/* Progress rail (desktop) */}
        {!isMobile && <FeaturesRail railRefs={railRefs} theme={ch2Theme} />}
      </div>

      {/* Loader */}
      <HeroLoader visible={!revealed} progress={progress} />
    </section>
  );
};
