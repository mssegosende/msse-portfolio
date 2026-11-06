import { createRef, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { systemFeatures } from "../../data/portfolioData";
import { getLenis } from "../../hooks/useLenis";
import { VIEW_CSS_SCALE, applyView } from "../../lib/spline/camera";
import { BOT_HOME, applyPose } from "../../lib/spline/rig";
import { noteRenderedFrame } from "../../lib/spline/quality";
import type { SplineApp, ViewTransform } from "../../lib/spline/types";
import {
  hasThemeReloadPosition,
  pendingThemeReload,
  takeThemeReloadScrollY,
} from "../../lib/themeReload";
import {
  BEATS,
  GAZE,
  XFADE_AT,
  XFADE_DURATION,
  chapterTwoFramings,
  closeAt as closeAtFor,
  connectorAnchors,
  heroFraming,
  vwOf,
} from "./choreography";
import type { HeroSceneRefs } from "./useHeroScenes";

gsap.registerPlugin(ScrollTrigger);
// Without 3D the scene wrappers never mount, so part of the timeline has no target.
gsap.config({ nullTargetWarn: false });

type Refs<T> = (T | null)[];

const list = <T>(): RefObject<Refs<T>> => ({ current: [] });

/**
 * The hero's elements, as one object that never changes: the timeline depends
 * on it rather than on each ref.
 */
export const useHeroElements = () =>
  useState(() => ({
    sectionRef: createRef<HTMLElement>(),
    canvasWrapRef: createRef<HTMLDivElement>(),
    canvas2WrapRef: createRef<HTMLDivElement>(),
    parallax1Ref: createRef<HTMLDivElement>(),
    parallax2Ref: createRef<HTMLDivElement>(),
    idle1Ref: createRef<HTMLDivElement>(),
    idle2Ref: createRef<HTMLDivElement>(),
    splineLayerRef: createRef<HTMLDivElement>(),
    overlayRef: createRef<HTMLDivElement>(),
    wallRef: createRef<HTMLDivElement>(),
    wallTopRef: createRef<HTMLDivElement>(),
    vignetteRef: createRef<HTMLDivElement>(),
    storyTitleRef: createRef<HTMLDivElement>(),
    storyPanelRef: createRef<HTMLDivElement>(),
    scrollCueRef: createRef<HTMLDivElement>(),
    layer2Ref: createRef<HTMLDivElement>(),
    layer2InnerRef: createRef<HTMLDivElement>(),
    headlineRef: createRef<HTMLDivElement>(),
    skipRef: createRef<HTMLButtonElement>(),
    featuresHeaderRef: createRef<HTMLDivElement>(),
    storyRefs: list<HTMLParagraphElement>(),
    calloutRefs: list<HTMLDivElement>(),
    lineRefs: list<SVGLineElement>(),
    dotRefs: list<HTMLSpanElement>(),
    railRefs: list<HTMLSpanElement>(),
  }))[0];

export type HeroElements = ReturnType<typeof useHeroElements>;

interface HeroTimelineOptions {
  isMobile: boolean;
  darkMode: boolean;
  sceneUrl: string;
  onJourneyEnd?: () => void;
  els: HeroElements;
  scenes: HeroSceneRefs;
}

/**
 * The pinned scroll sequence: GSAP timeline, ticker (camera, rig, pose, gaze),
 * parallax and idle motion, playback while off screen, and restoring the scroll
 * position when the timeline is rebuilt.
 */
export const useHeroTimeline = ({
  isMobile,
  darkMode,
  sceneUrl,
  onJourneyEnd,
  els,
  scenes,
}: HeroTimelineOptions) => {
  // A phone theme reload comes from the dock, so the sequence was already seen:
  // start with the dock shown and no SKIP INTRO.
  const [journeyDone, setJourneyDone] = useState(!!pendingThemeReload);
  const journeyRef = useRef(!!pendingThemeReload);
  // Scroll position saved when the timeline is rebuilt: reverting the GSAP context
  // removes the pin spacer and the browser clamps the scroll.
  const restoreScrollRef = useRef<number | null>(null);
  // In a ref so the layout effect doesn't depend on it (App passes a new closure
  // every render).
  const onJourneyEndRef = useRef(onJourneyEnd);
  useLayoutEffect(() => {
    onJourneyEndRef.current = onJourneyEnd;
  });
  const applyGazeRef = useRef<(() => void) | null>(null);
  const heroEndRef = useRef(0);
  // Normalized cursor over the hero (-0.5..0.5), for the desktop head.
  const mouseNRef = useRef({ x: 0, y: 0 });
  // Phone hero head's default direction (the black robot's, to the right) in both
  // themes. On desktop the head follows the mouse (applyHeadDesktop).
  const head1BaseRef = useRef({ x: 0.05, y: 0.27 });
  // The ticker needs the theme, but as an effect dependency it would rebuild the
  // timeline on every toggle.
  const darkModeRef = useRef(darkMode);
  useEffect(() => {
    darkModeRef.current = darkMode;
  }, [darkMode]);

  useLayoutEffect(() => {
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
    const {
      app1Ref,
      app2Ref,
      appAltRef,
      armsRef,
      heroArmsRef,
      botRef,
      head1Ref,
      headAltRef,
      l2Ref,
      settledRef,
      scenesLoadedRef,
      showAltRef,
      l2VisibleRef,
      heroVisibleRef,
    } = scenes;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const viewport = { width: window.innerWidth || 2000, height: window.innerHeight || 900 };
    const vw = vwOf(viewport.width);
    const { startScale, startY, endY, heroDx } = heroFraming(isMobile, reduce, viewport);
    // The closing framing puts the head under the features title, read from the DOM.
    const headEl = featuresHeaderRef.current;
    const headBottomPx = headEl ? headEl.offsetTop + headEl.offsetHeight : 163;
    const { steps: BODY_STEPS, story } = chapterTwoFramings(isMobile, viewport, headBottomPx);

    // Touch devices on the desktop layout (tablets) have no pointer, so the scroll
    // drives the parallax offsets instead.
    const touchParallax = (p: number) => {
      if (reduce || isMobile || !parallax1Ref.current) return;
      const sway = Math.sin(p * Math.PI * 2.2);
      const rise = Math.cos(p * Math.PI * 1.6);
      gsap.set(parallax1Ref.current, { x: sway * 14, y: rise * 9 });
      if (parallax2Ref.current) gsap.set(parallax2Ref.current, { x: sway * -16, y: rise * 10 });
    };

    // Mouse parallax on scene 1 only (set up outside gsap.context). Scene 2 ignores
    // the cursor: its canvas inherits pointer-events-none.
    let removeMouse: (() => void) | null = null;
    let removeResize: (() => void) | null = null;
    if (!reduce) {
      const px1 = gsap.quickTo(parallax1Ref.current, "x", { duration: 0.9, ease: "power2.out" });
      const py1 = gsap.quickTo(parallax1Ref.current, "y", { duration: 0.9, ease: "power2.out" });
      const onMouse = (e: MouseEvent) => {
        const sec = sectionRef.current;
        if (!sec) return;
        const r = sec.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        px1(nx * 12);
        py1(ny * 8);
        mouseNRef.current = { x: nx, y: ny };
      };
      sectionRef.current?.addEventListener("mousemove", onMouse);
      removeMouse = () => sectionRef.current?.removeEventListener("mousemove", onMouse);
    }

    // Desktop hero framing lives in this proxy and the camera applies it (applyView).
    const heroView: ViewTransform = { scale: startScale, x: vw(heroDx), y: startY };
    const scene2View: ViewTransform = { scale: 1, x: "0%", y: "0%" };

    const ctx = gsap.context(() => {
      if (isMobile) {
        gsap.set(canvasWrapRef.current, {
          scale: startScale,
          x: vw(-58),
          y: startY,
          transformOrigin: "50% 50%",
        });
        gsap.set(canvas2WrapRef.current, { ...story, transformOrigin: "50% 50%" });
      } else {
        [canvasWrapRef.current, canvas2WrapRef.current].forEach((el) =>
          gsap.set(el, { scale: VIEW_CSS_SCALE, x: 0, y: 0, transformOrigin: "50% 50%" }),
        );
        Object.assign(scene2View, { scale: story.scale, x: story.x, y: story.y });
      }
      // Initial state. Colours come from page-theme CSS variables, so nothing here
      // depends on the theme.

      // Vignette tint.
      vignetteRef.current?.style.setProperty("--vignette", "0 0 0");

      gsap.set(wallTopRef.current, { opacity: 0 });
      if (isMobile) {
        [parallax1Ref.current, parallax2Ref.current, idle1Ref.current, idle2Ref.current].forEach(
          (el) => el && gsap.set(el, { x: 0, y: 0, rotation: 0, scale: 1 }),
        );
      }
      gsap.set(vignetteRef.current, { opacity: 0 });
      gsap.set(layer2Ref.current, { opacity: 0 });
      layer2InnerRef.current?.style.setProperty("--lift-t", "0");
      gsap.set(featuresHeaderRef.current, { opacity: 0, y: 24 });
      gsap.set(overlayRef.current, { opacity: 0 });
      storyRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0, y: 28 }));
      gsap.set(storyTitleRef.current, { opacity: 0, y: 28 });
      // The story panel fades with its text; otherwise its translucent ground would
      // cover the robot from the first frame.
      gsap.set(storyPanelRef.current, { opacity: 0 });
      calloutRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0, y: 36 }));
      lineRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0 }));
      dotRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0 }));

      // Idle float and tilt, desktop only. Amplitudes are px inside the 1.3x wrap:
      // alive without reading as floating.
      if (!reduce && !isMobile) {
        [idle1Ref.current, idle2Ref.current].forEach((el) => {
          if (!el) return;
          gsap.set(el, { y: -1.2, rotation: -0.08 });
          gsap.to(el, { y: 1.2, duration: 5, yoyo: true, repeat: -1, ease: "sine.inOut" });
          gsap.to(el, {
            rotation: 0.08,
            duration: 6.3,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        });
        // A slow lateral drift and breath on scene 1, on periods that don't divide the
        // float's, so the motion never settles into a visible loop.
        if (idle1Ref.current) {
          gsap.fromTo(
            idle1Ref.current,
            { x: -1.6 },
            { x: 1.6, duration: 8.7, yoyo: true, repeat: -1, ease: "sine.inOut" },
          );
          gsap.fromTo(
            idle1Ref.current,
            { scale: 0.9988 },
            { scale: 1.0012, duration: 7.1, yoyo: true, repeat: -1, ease: "sine.inOut" },
          );
        }
      }

      // Tonal drain: light drains out of scene 1.
      const drain = { t: 0 };
      const applyDrain = () => {
        canvasWrapRef.current?.style.setProperty("--drain-t", String(drain.t));
      };
      applyDrain();
      const lift = { t: 0 };
      const applyLift = () => {
        layer2InnerRef.current?.style.setProperty("--lift-t", String(lift.t));
      };

      // ---- phase 3 rig ------------------------------------------------------
      // `body.t` walks 0..3 across the four framings; anchors are re-projected
      // against whatever scale/offset that lands on, never against the final one.
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      const anchors = connectorAnchors(isMobile);

      // Where each connector starts, in % of the layer: `lineFrom` placed on the
      // card's own box (cards scale with the window). offsetLeft/Top ignore the y
      // GSAP animates on the cards.
      const measureLineOrigins = () => {
        calloutRefs.current.forEach((card, i) => {
          const layer = card?.offsetParent;
          const line = lineRefs.current[i];
          const anchor = anchors[i];
          const lf = systemFeatures[i]?.lineFrom;
          if (!card || !layer || !line || !anchor || !lf) return;
          anchor.fromX = ((card.offsetLeft + lf.x * card.offsetWidth) / layer.clientWidth) * 100;
          anchor.fromY = ((card.offsetTop + lf.y * card.offsetHeight) / layer.clientHeight) * 100;
          line.setAttribute("x1", String(anchor.fromX));
          line.setAttribute("y1", String(anchor.fromY));
        });
      };
      measureLineOrigins();

      const body = { t: 0 };
      const draw = systemFeatures.map(() => ({ p: 0 }));

      // Card i's elements. Connectors and rail exist on desktop only; GSAP skips
      // a null target.
      const card = (i: number) => ({
        callout: calloutRefs.current[i] ?? null,
        line: lineRefs.current[i] ?? null,
        dot: dotRefs.current[i] ?? null,
        rail: railRefs.current[i] ?? null,
        draw: draw[i] ?? null,
      });

      const applyPull = () => {
        // Interpolate between the two framings `body.t` sits between.
        const i = Math.min(Math.floor(body.t), BODY_STEPS.length - 2);
        const f = Math.min(Math.max(body.t - i, 0), 1);
        const A = BODY_STEPS[i],
          B = BODY_STEPS[i + 1];
        if (!A || !B) return;
        const sc = lerp(A.scale, B.scale, f);
        const tx = lerp(parseFloat(A.x), parseFloat(B.x), f);
        const ty = lerp(parseFloat(A.y), parseFloat(B.y), f);
        if (isMobile) {
          gsap.set(canvas2WrapRef.current, { scale: sc, x: `${tx}%`, y: `${ty}%` });
        } else {
          scene2View.scale = sc;
          scene2View.x = `${tx}%`;
          scene2View.y = `${ty}%`;
        }
        // Phones shift the body through the rig (rx), not the canvas: near scale 1 a CSS
        // x would uncover the canvas edge. Desktop beats have no rx.
        if (A.rx !== undefined && B.rx !== undefined) {
          botRig.x = BOT_HOME.x + lerp(A.rx, B.rx, f);
        }

        // Re-project each anchor against the live transform. kClose glides the closing
        // anchors in with the body's last move.
        const kClose = i === BODY_STEPS.length - 2 ? f : 0;
        anchors.forEach((a, i) => {
          const apx = a.close ? lerp(a.px, a.close.px, kClose) : a.px;
          const apy = a.close ? lerp(a.py, a.close.py, kClose) : a.py;
          const x = 50 + (apx - 50) * sc + tx;
          const y = 50 + (apy - 50) * sc + ty;
          const line = lineRefs.current[i];
          if (line) {
            // The line grows by moving its endpoint, so the stroke never marches;
            // reversing draw[i].p erases it the same way.
            const p = draw[i]?.p ?? 0;
            const ex = lerp(a.fromX, x, p);
            const ey = lerp(a.fromY, y, p);
            line.setAttribute("x2", String(ex));
            line.setAttribute("y2", String(ey));
          }
          const dot = dotRefs.current[i];
          if (dot) {
            dot.style.left = `${x}%`;
            dot.style.top = `${y}%`;
          }
        });
      };

      // Desktop chapter-2 mounts currently loaded (both models).
      const l2Desktop = () =>
        Object.entries(l2Ref.current)
          .filter(([k]) => k.startsWith("d:"))
          .map(([, e]) => e);

      // ---- directed gaze -----------------------------------------------------
      // Only the timeline steers the head; the cursor never does.
      const gaze = { x: 0, y: 0 }; // target written by the timeline
      const cur = { x: 0, y: 0 }; // what is actually applied, eased
      const applyGaze = () => {
        const heads = isMobile
          ? [app2Ref.current?.findObjectByName("Head") ?? null]
          : l2Desktop().map((e) => e.head);
        cur.x += (gaze.x - cur.x) * 0.08;
        cur.y += (gaze.y - cur.y) * 0.08;
        heads.forEach((head) => {
          if (!head) return;
          head.rotation.x = cur.x;
          head.rotation.y = cur.y;
        });
      };
      // Rig scale and height per layout. Phones zoom through the rig, not the canvas:
      // the runtime sizes its buffer from the layout box, so a bigger rig renders
      // more pixels instead of stretching them. The rig scales about the hip, so its
      // y comes down to keep the crown in frame (and the waist out of reach).
      const botRig = isMobile
        ? { s: 1.2, x: BOT_HOME.x, y: -83.56 }
        : { s: 0.8, x: BOT_HOME.x, y: BOT_HOME.y };
      const applyBotRig = () => {
        const bots = isMobile ? [botRef.current] : l2Desktop().map((e) => e.bot);
        bots.forEach((bot) => {
          if (!bot) return;
          bot.scale.x = botRig.s;
          bot.scale.y = botRig.s;
          bot.scale.z = botRig.s;
          bot.position.x = botRig.x;
          bot.position.y = botRig.y;
        });
      };

      // Phone hero head: holds its default direction and wanders around it (two sines
      // on periods that don't divide each other, eased back).
      const HEAD1_BASE = head1BaseRef.current;
      const head1 = { x: HEAD1_BASE.x, y: HEAD1_BASE.y };
      let head1T = 0;
      // Desktop: both layer A heads follow the mouse, written by us. Spline's own
      // look-at only hears the visible canvas, so the hidden head drifted. Same range
      // as the look-at; centre pose until the cursor moves.
      const headD = { x: 0.087, y: 0 };
      const applyHeadDesktop = () => {
        const m = mouseNRef.current;
        const tx = 0.087 + (m.y < 0 ? m.y * 0.3 : m.y * 0.42);
        const ty = m.x * 0.57;
        headD.x += (tx - headD.x) * 0.08;
        headD.y += (ty - headD.y) * 0.08;
        [head1Ref.current, headAltRef.current].forEach((h) => {
          if (!h) return;
          h.rotation.x = headD.x;
          h.rotation.y = headD.y;
        });
      };
      const applyHead1 = () => {
        if (!isMobile) {
          applyHeadDesktop();
          return;
        }
        // Phones mount a single model in layer A.
        const h = head1Ref.current;
        if (!h) return;
        head1T += 0.004;
        const wy = Math.sin(head1T * 1.7) * 0.075 + Math.sin(head1T * 0.61) * 0.04;
        const wx = Math.sin(head1T * 1.13) * 0.03;
        head1.y += (HEAD1_BASE.y + wy - head1.y) * 0.05;
        head1.x += (HEAD1_BASE.x + wx - head1.x) * 0.05;
        h.rotation.y = head1.y;
        h.rotation.x = head1.x;
      };

      // Assigned once the timeline exists.
      let syncPlayback = () => {};

      // The pose normaliser rides the gaze ticker rather than adding its own.
      const applyGazeAndPose = () => {
        syncPlayback();
        applyGaze();
        // Phones: the hero's arms in light, layer 2's in dark.
        if (isMobile) {
          const arms = !darkModeRef.current ? heroArmsRef.current : armsRef.current;
          if (arms.length) applyPose(arms);
        } else {
          l2Desktop().forEach((e) => e.arms.length && applyPose(e.arms));
        }
        applyBotRig();
        applyHead1();
        if (!isMobile) {
          applyView(app1Ref.current, heroView);
          applyView(appAltRef.current, heroView);
          l2Desktop().forEach((e) => applyView(e.app, scene2View));
        }
      };
      applyGazeRef.current = applyGazeAndPose;
      gsap.ticker.add(applyGazeAndPose);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        // Keeps dots and lines on the robot while it moves.
        onUpdate: applyPull,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: isMobile ? "+=780%" : "+=1040%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            if (isTouchDevice && !isMobile) touchParallax(p);
            // Latches once: the dock stays even if the visitor scrolls back up.
            if (p > 0.985 && !journeyRef.current) {
              journeyRef.current = true;
              setJourneyDone(true);
              onJourneyEndRef.current?.();
            }
          },
        },
      });

      // Grey settles in ahead of the drain, so the order reads white -> grey
      // -> black instead of white -> black.
      tl.to(vignetteRef.current, { opacity: 1, duration: 0.2 }, 0.02);
      tl.to(wallTopRef.current, { opacity: 1, duration: 0.2 }, 0.02);

      // PHASE 1 exit: headline leaves, light drains to black, slight drift-in
      tl.to(headlineRef.current, { opacity: 0, y: -140, duration: 0.1 }, 0.06);
      tl.to(scrollCueRef.current, { opacity: 0, y: 20, duration: 0.06 }, 0.02);
      tl.to(drain, { t: 1, duration: 0.3, onUpdate: applyDrain }, 0.1);
      tl.to(overlayRef.current, { opacity: 1, duration: 0.34 }, 0.1);
      tl.to(
        isMobile ? canvasWrapRef.current : heroView,
        {
          scale: startScale * 0.96,
          x: vw(isMobile ? -58 : heroDx),
          y: endY,
          duration: 0.32,
          ease: "power1.inOut",
        },
        0.1,
      );

      // Only what is on screen renders: every scene is a full-screen GPU load, and
      // drawing all four at once is what a laptop GPU can't keep up with. The fade
      // follows the scrubbed time and scroll leads it, so the hero keeps running
      // until both are past the fade and layer 2 wakes as soon as either nears it.
      const setRunning = (app: SplineApp | null | undefined, on: boolean) => {
        if (!app || !settledRef.current.has(app)) return;
        try {
          if (on) {
            app.play();
          } else {
            app.stop();
            // A load starts its loop from a timeout. One that fires after a stop()
            // leaves the loop running on a scene marked as stopped, and stop() then
            // does nothing.
            app._renderer?.setAnimationLoop(null);
          }
        } catch {
          /* runtime without play()/stop() */
        }
      };
      syncPlayback = () => {
        const shown = tl.time();
        const scrolled = (tl.scrollTrigger?.progress ?? 0) * tl.duration();
        const hero =
          heroVisibleRef.current && Math.min(shown, scrolled) < XFADE_AT + XFADE_DURATION;
        const layer2 = heroVisibleRef.current && Math.max(shown, scrolled) > XFADE_AT * 0.9;
        setRunning(app1Ref.current, hero && !showAltRef.current);
        setRunning(appAltRef.current, hero && showAltRef.current);
        setRunning(app2Ref.current, layer2);
        Object.entries(l2Ref.current).forEach(([key, entry]) => {
          if (key.startsWith("d:"))
            setRunning(entry.app, layer2 && key === "d:" + l2VisibleRef.current);
        });
        if ((hero || layer2) && scenesLoadedRef.current) noteRenderedFrame();
      };

      // Phase 2: crossfade to chapter 2; the robot rises in close-up.
      tl.to(splineLayerRef.current, { opacity: 0, duration: XFADE_DURATION }, XFADE_AT);
      tl.to(layer2Ref.current, { opacity: 1, duration: XFADE_DURATION }, XFADE_AT);
      tl.to(lift, { t: 1, duration: 0.16, onUpdate: applyLift }, XFADE_AT);

      // Story paragraphs fade in one after another during the close-up hold.
      tl.to(storyPanelRef.current, { opacity: 1, duration: 0.07, ease: "power1.out" }, 0.54);
      tl.to(storyTitleRef.current, { opacity: 1, y: 0, duration: 0.07, ease: "power1.out" }, 0.56);
      if (storyRefs.current[0])
        tl.to(storyRefs.current[0], { opacity: 1, y: 0, duration: 0.07, ease: "power1.out" }, 0.62);
      if (storyRefs.current[1])
        tl.to(storyRefs.current[1], { opacity: 1, y: 0, duration: 0.07, ease: "power1.out" }, 0.78);

      // Phase 3: the robot is already moving when revealed, then four evenly spaced
      // steps and a closing beat.
      const storyEls = storyRefs.current.filter(Boolean);

      // Entry starts at 0.40, under the crossfade (0.50), so the scene is never
      // revealed frozen.
      tl.to(body, { t: 1, duration: 0.38, ease: "power2.out" }, 0.4);
      tl.to(gaze, { ...GAZE.text, duration: 0.1, ease: "power2.out" }, 0.46);

      if (storyEls.length)
        tl.to(storyEls, { opacity: 0, y: -24, duration: 0.1, ease: "power1.in" }, 1.02);
      tl.to(storyTitleRef.current, { opacity: 0, y: -24, duration: 0.1, ease: "power1.in" }, 1.02);
      tl.to(storyPanelRef.current, { opacity: 0, duration: 0.1, ease: "power1.in" }, 1.04);
      tl.to(featuresHeaderRef.current, { opacity: 1, y: 0, duration: 0.1 }, 1.1);

      BEATS.forEach(({ at, cardAt, pose }, i) => {
        // The head turns first and holds for the whole step.
        tl.to(gaze, { ...pose, duration: 0.14, ease: "power2.inOut" }, at);
        tl.to(body, { t: i + 2, duration: 0.3, ease: "power1.inOut" }, at + 0.06);

        // The previous card and its connector leave with the same motion.
        if (i > 0) {
          const prev = card(i - 1);
          tl.to(prev.dot, { opacity: 0, duration: 0.04 }, at);
          tl.to(prev.draw, { p: 0, duration: 0.12, ease: "power1.inOut" }, at);
          tl.to(prev.callout, { opacity: 0, y: -20, duration: 0.1 }, at + 0.02);
          tl.set(prev.line, { opacity: 0 }, at + 0.14);
        }

        const c = card(i);
        tl.to(c.callout, { opacity: 1, y: 0, duration: 0.12, ease: "power1.out" }, cardAt);
        tl.set(c.line, { opacity: 1 }, cardAt);
        tl.to(c.draw, { p: 1, duration: 0.14, ease: "power1.inOut" }, cardAt);
        tl.to(c.dot, { opacity: 1, duration: 0.05 }, cardAt + 0.14);
        tl.to(c.rail, { opacity: 1, duration: 0.05 }, cardAt);
      });

      // Phones: SKIP INTRO shares the cards' spot (nothing else is free through the
      // whole sequence), so it hides while a card is on screen. autoAlpha also stops
      // it catching taps.
      if (isMobile && skipRef.current) {
        BEATS.forEach(({ cardAt }, i) => {
          tl.to(skipRef.current, { autoAlpha: 0, duration: 0.05 }, cardAt - 0.05);
          // Card i leaves on the next beat; the last one stays to the end.
          const next = BEATS[i + 1];
          if (next) tl.to(skipRef.current, { autoAlpha: 1, duration: 0.04 }, next.at + 0.12);
        });
      }

      // Closing: the robot centres and the head turns front; on desktop all three
      // cards come back with their connectors.
      const closeAt = closeAtFor(isMobile);
      tl.to(body, { t: 5, duration: 0.3, ease: "power1.inOut" }, closeAt);
      tl.to(
        gaze,
        { ...(isMobile ? GAZE.closeMobile : GAZE.front), duration: 0.16, ease: "power2.inOut" },
        closeAt,
      );
      if (!isMobile) {
        [0, 1].forEach((i) => {
          const c = card(i);
          tl.to(c.callout, { opacity: 1, y: 0, duration: 0.12, ease: "power1.out" }, 3.16);
          tl.set(c.line, { opacity: 1 }, 3.16);
          tl.to(c.draw, { p: 1, duration: 0.14, ease: "power1.inOut" }, 3.16);
          tl.to(c.dot, { opacity: 1, duration: 0.05 }, 3.3);
          tl.to(c.rail, { opacity: 1, duration: 0.05 }, 3.16);
        });
      }

      // Hold before release; short on phones, where there is no three-card close.
      tl.to({}, { duration: isMobile ? 0.12 : 0.45 });

      if (tl.scrollTrigger) heroEndRef.current = tl.scrollTrigger.end;

      // First projection, so nothing is stale before the first scroll tick.
      applyPull();

      // The cards resize with the window: re-measure where the lines start.
      if (!isMobile) {
        let raf = 0;
        const onResize = () => {
          if (raf) return;
          raf = requestAnimationFrame(() => {
            raf = 0;
            measureLineOrigins();
            applyPull();
          });
        };
        window.addEventListener("resize", onResize);
        removeResize = () => {
          if (raf) cancelAnimationFrame(raf);
          window.removeEventListener("resize", onResize);
        };
      }
    }, sectionRef);

    // Restore the visitor's position. refresh() first, so the pin spacer restores
    // the page height before scrolling.
    let restoreRaf: number | null = null;
    // A phone theme reload brings its position as pin progress, converted to px
    // once the pin exists, once per load.
    if (restoreScrollRef.current == null && hasThemeReloadPosition()) {
      ScrollTrigger.refresh();
      restoreScrollRef.current = takeThemeReloadScrollY();
    }
    if (restoreScrollRef.current != null) {
      const y = restoreScrollRef.current;
      restoreScrollRef.current = null;
      ScrollTrigger.refresh();
      // Retried via rAF: the pin spacer takes a few frames to settle and a single
      // pass lands short.
      let tries = 0;
      const put = () => {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
        if (++tries < 12 && Math.abs(window.scrollY - y) > 2) {
          restoreRaf = requestAnimationFrame(put);
          return;
        }
        // Finish the scrub so the sequence doesn't play up to the restored position.
        ScrollTrigger.update();
        ScrollTrigger.getAll().forEach((st) => st.getTween()?.progress(1));
      };
      put();
    }

    // The playback sync idles every scene while the hero is off screen.
    const heroVisibility = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        heroVisibleRef.current = entry.isIntersecting;
      },
      { rootMargin: "120px" },
    );
    if (sectionRef.current) heroVisibility.observe(sectionRef.current);

    const lenis = getLenis();
    const onScroll = () => ScrollTrigger.update();
    if (lenis) lenis.on("scroll", onScroll);
    const refresh = setTimeout(() => ScrollTrigger.refresh(), 900);

    return () => {
      restoreScrollRef.current = window.scrollY;
      if (restoreRaf) cancelAnimationFrame(restoreRaf);
      // Stop writing rotations into apps being torn down: these refs outlive the
      // effect.
      armsRef.current = [];
      heroArmsRef.current = [];
      botRef.current = null;
      head1Ref.current = null;
      clearTimeout(refresh);
      removeMouse?.();
      removeResize?.();
      heroVisibility.disconnect();
      if (lenis) lenis.off("scroll", onScroll);
      if (applyGazeRef.current) gsap.ticker.remove(applyGazeRef.current);
      ctx.revert();
    };
    // Depends on sceneUrl, not darkMode: a theme change rebuilds nothing. els and
    // scenes are stable objects.
  }, [isMobile, sceneUrl, els, scenes]);

  // Lands just past the pin so the marquee isn't skipped.
  const skipIntro = () => {
    const y = heroEndRef.current || window.innerHeight * 10;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y + 4, { duration: 1.1 });
    else window.scrollTo({ top: y + 4, behavior: "smooth" });
  };

  return { journeyDone, skipIntro };
};
