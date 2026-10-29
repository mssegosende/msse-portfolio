import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Spline from "@splinetool/react-spline";
import { Application } from "@splinetool/runtime";
import {
  SPLINE_SCENE_URL,
  SPLINE_SCENE_2_URL,
  profile,
  systemFeatures,
} from "../data/portfolioData";
import { useTheme } from "../hooks/useTheme";
import {
  hasThemeReloadPosition,
  pendingThemeReload,
  takeThemeReloadScrollY,
} from "../lib/themeReload";
import { MOBILE_LAYOUT_QUERY } from "../lib/layout";
import { heroLineReveal as lineReveal, heroUiFade as uiFade } from "../lib/motion";
import {
  HERO_CAM_DESKTOP,
  HERO_CAM_MOBILE,
  CAM_FINAL,
  OVERSAMPLE,
  OVERSAMPLE_1,
  VIEW_CSS_SCALE,
  applyView,
  pinCamera,
} from "../lib/spline/camera";
import { patchSplineRuntime, releaseGlContext } from "../lib/spline/runtime";
import { BOT_HOME, applyPose, collectArms, findBot, placeBot } from "../lib/spline/rig";
import { L2_DESKTOP_URLS, themeModel } from "../lib/spline/scenes";
import { ReleasingBox } from "./spline/ReleasingBox";
import { SceneBoundary } from "./spline/SceneBoundary";
import { FeatureCard } from "./scroll-scene/FeatureCard";
import { FeatureConnectors } from "./scroll-scene/FeatureConnectors";
import { FeaturesRail } from "./scroll-scene/FeaturesRail";
import { HeroLoader } from "./scroll-scene/HeroLoader";
import { StoryPanel } from "./scroll-scene/StoryPanel";
import { useCalloutsAboveDock } from "./scroll-scene/useCalloutsAboveDock";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { getLenis } from "../hooks/useLenis";

gsap.registerPlugin(ScrollTrigger);
patchSplineRuntime(Application);

export const ScrollScene = ({ onReady, onJourneyEnd }) => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  // Chapter 2's UI follows the page theme; the section itself is fixed to
  // data-theme="dark", so its children set the page theme explicitly.
  const ch2Theme = darkMode ? "dark" : "light";
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [scene2Failed, setScene2Failed] = useState(false);
  // Layer 2 mounts that have drawn their first frames, by "m:"/"d:" + url.
  const [drawn2, setDrawn2] = useState({});
  // Mounts whose load failed (reported by SceneBoundary): "alt" and "d:" + url.
  const [deadScenes, setDeadScenes] = useState({});
  const markDead = (key) => setDeadScenes((d) => (d[key] ? d : { ...d, [key]: true }));
  // A phone theme reload comes from the dock, so the sequence was already seen:
  // start with the dock shown and no SKIP INTRO.
  const [journeyDone, setJourneyDone] = useState(!!pendingThemeReload);
  const readyRef = useRef(false);
  // Scene 2 renders only when layer 2 is about to appear. Set by the pin's
  // onUpdate, read by onLoad.
  const awake2Ref = useRef(false);
  const stopped1Ref = useRef(false);
  const journeyRef = useRef(!!pendingThemeReload);
  // Scroll position saved when the timeline is rebuilt: reverting the GSAP context
  // removes the pin spacer and the browser clamps the scroll.
  const restoreScrollRef = useRef(null);
  // In a ref so the layout effect doesn't depend on it (App passes a new closure
  // every render).
  const onJourneyEndRef = useRef(onJourneyEnd);
  useLayoutEffect(() => {
    onJourneyEndRef.current = onJourneyEnd;
  });
  const app1Ref = useRef(null);
  const app2Ref = useRef(null);
  const applyGazeRef = useRef(null);
  const armsRef = useRef([]);
  const botRef = useRef(null);
  const head1Ref = useRef(null);
  const heroEndRef = useRef(0);
  // Desktop layer A mounts both models with fixed keys and the theme only picks
  // which one shows. The second mount has its own refs: a different model, with
  // its own head, arms and app.
  const appAltRef = useRef(null);
  const armsAltRef = useRef([]);
  const headAltRef = useRef(null);
  const altCanvasRef = useRef(null);
  // Layer 2 mounts by "m:"/"d:" + url. On desktop the ticker writes camera, rig,
  // pose and gaze to both, so the hidden one is always in the current beat and a
  // theme change is visibility only.
  const l2Ref = useRef({});
  // Phones: the hero's arms (on phones armsRef holds layer 2's).
  const heroArmsRef = useRef([]);
  // Kept by the hero IntersectionObserver: a scene that loads with the hero off
  // screen draws once and stops.
  const heroVisibleRef = useRef(true);
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

  const sectionRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const canvas2WrapRef = useRef(null);
  const parallax1Ref = useRef(null);
  const parallax2Ref = useRef(null);
  const idle1Ref = useRef(null);
  const idle2Ref = useRef(null);
  // Each layer A mount gets its own box: with two canvases in canvasWrapRef, a
  // querySelector would release the wrong one.
  const slot1BoxRef = useRef(null);
  const altBoxRef = useRef(null);
  const splineLayerRef = useRef(null);
  const overlayRef = useRef(null);
  const wallRef = useRef(null);
  const wallTopRef = useRef(null);
  const vignetteRef = useRef(null);
  const storyTitleRef = useRef(null);
  const storyPanelRef = useRef(null);
  const scrollCueRef = useRef(null);
  const layer2Ref = useRef(null);
  const layer2InnerRef = useRef(null);
  const headlineRef = useRef(null);
  const skipRef = useRef(null);
  const featuresHeaderRef = useRef(null);
  const storyRefs = useRef([]);
  const calloutRefs = useRef([]);
  const lineRefs = useRef([]);
  const dotRefs = useRef([]);
  const railRefs = useRef([]);

  // A breakpoint flip rebuilds the timeline (isMobile is an effect dependency).
  const isMobile = useMediaQuery(MOBILE_LAYOUT_QUERY);

  // One model per theme throughout: the black robot (scene 1) in light, the
  // silver one (scene 2) in dark.
  //
  // Desktop: layers A and 2 mount both models with fixed keys and the theme only
  // picks which shows, so a toggle never reloads or rebuilds anything.
  //
  // Phones: only the theme's model is mounted, two scenes in total; more made iOS
  // kill the page. Theme changes reload the page (lib/themeReload.js); only
  // without sessionStorage does the model change in place, remounting both.
  //
  // sceneUrl is constant: it is a timeline dependency, and the phone hero
  // remounts through its key (slot1Url) instead.
  const sceneUrl = SPLINE_SCENE_2_URL;
  const mobileModel = themeModel(darkMode);
  const slot1Url = isMobile ? mobileModel : sceneUrl;
  // Phone layer 2 only; desktop layer 2 mounts L2_DESKTOP_URLS.
  const slot2Url = mobileModel;
  // If the theme's model failed to load, show the other one.
  const l2Alive = L2_DESKTOP_URLS.filter((u) => !deadScenes["d:" + u]);
  const l2Preferred = themeModel(darkMode);
  const l2VisibleUrl = l2Alive.includes(l2Preferred) ? l2Preferred : l2Alive[0];

  // Desktop only: layer A's black robot, shown in light.
  const HERO_ALT_URL = SPLINE_SCENE_URL;
  const showAlt = !isMobile && !darkMode && !deadScenes.alt;
  // Hidden desktop mounts also get visibility:hidden, which takes them out of
  // compositing and hit-testing: one live robot per layer.
  const hiddenCls = "invisible opacity-0";

  // Loader: eases toward 90% until the scene loads.
  useEffect(() => {
    if (loaded || failed) return;
    const t = setInterval(() => {
      setProgress((p) => Math.min(p + (90 - p) * 0.03, 90));
    }, 90);
    return () => clearInterval(t);
  }, [loaded, failed]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!readyRef.current) {
        setFailed(true);
        onReady?.();
      }
    }, 22000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoad = (app) => {
    app1Ref.current = app;
    placeBot(app);
    pinCamera(app, isMobile ? HERO_CAM_MOBILE : HERO_CAM_DESKTOP);
    if (isMobile) heroArmsRef.current = collectArms(app);
    else armsRef.current = collectArms(app);
    head1Ref.current = app?.findObjectByName?.("Head") || null;
    // Transparent background: an opaque canvas could only show the wall through a
    // blend mode, which also leaks through the body.
    try {
      app.setBackgroundColor("rgba(0,0,0,0)");
    } catch {
      /* older runtime */
    }
    glCanvasRefs.current.slot1 = slot1BoxRef.current
      ? slot1BoxRef.current.querySelector("canvas")
      : canvasWrapRef.current
        ? canvasWrapRef.current.querySelector("canvas")
        : null;
    // After a phone theme reload the hero may load past its part of the sequence or
    // off screen: draw a couple of frames, then stop. Scrolling back restarts it.
    if (isMobile) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (app1Ref.current !== app) return;
          if (stopped1Ref.current || !heroVisibleRef.current) {
            try {
              app.stop();
            } catch {
              /* runtime without stop() */
            }
          }
        }),
      );
    }
    if (readyRef.current) return;
    readyRef.current = true;
    setProgress(100);
    setTimeout(() => {
      setLoaded(true);
      onReady?.();
    }, 700);
  };

  // Desktop layer A's alternate mount (the black robot). It has its own head and
  // arms, and doesn't gate `loaded`: the hero is ready once slot1 is.
  const handleAltLoad = (app) => {
    appAltRef.current = app;
    placeBot(app);
    pinCamera(app, isMobile ? HERO_CAM_MOBILE : HERO_CAM_DESKTOP);
    armsAltRef.current = collectArms(app);
    headAltRef.current = app?.findObjectByName?.("Head") || null;
    // Transparent for the same reason as slot1.
    try {
      app.setBackgroundColor("rgba(0,0,0,0)");
    } catch {
      /* older runtime */
    }
    altCanvasRef.current = altBoxRef.current ? altBoxRef.current.querySelector("canvas") : null;
  };

  // Layer 2 load. "m:" is the phone mount (the theme's model); "d:" the two
  // desktop mounts.
  const onScene2Load = (key, app) => {
    placeBot(app);
    pinCamera(app, CAM_FINAL);
    const entry = {
      app,
      arms: collectArms(app),
      bot: findBot(app),
      head: app?.findObjectByName?.("Head") || null,
      canvas: app?.canvas || null,
    };
    l2Ref.current[key] = entry;
    if (key.startsWith("m:")) {
      // kept: the directed gaze writes Head.rotation on it.
      app2Ref.current = app;
      armsRef.current = entry.arms;
      botRef.current = entry.bot;
      glCanvasRefs.current.slot2 = canvas2WrapRef.current
        ? canvas2WrapRef.current.querySelector("canvas")
        : null;
    }
    // Transparent here too: chapter 2's backdrop is the section's own colour,
    // which already follows the theme, so the scene does not need to paint one.
    try {
      app.setBackgroundColor("rgba(0,0,0,0)");
    } catch {
      /* older runtime without setBackgroundColor */
    }
    // Ready after two drawn frames, so the rig is in place before the fade; on
    // desktop, once both models are in. Then paused again while the visitor is
    // still in the hero, or while the hero is off screen.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setDrawn2((d) => (d[key] ? d : { ...d, [key]: true }));
        if (!awake2Ref.current || !heroVisibleRef.current) {
          try {
            app.stop();
          } catch {
            /* runtime without stop() */
          }
        }
      }),
    );
  };

  const revealed = loaded || failed;
  // Scene 2 mounts as soon as the hero has loaded, not on scroll: a flick reaches
  // the crossfade in half a second, faster than any scroll threshold. Its loop
  // stays paused until near the crossfade (awake2Ref).
  const mountScene2 = revealed;
  // Ready once its mounts have drawn; on desktop, every model that hasn't failed
  // (if both fail, the fallback PNG shows).
  const scene2Ready = isMobile
    ? !!drawn2["m:" + slot2Url]
    : l2Alive.length > 0 && l2Alive.every((u) => drawn2["d:" + u]);
  const scene2Dead = scene2Failed || (!isMobile && l2Alive.length === 0);

  // Scene 2 watchdog: fallback render if it never comes up.
  useEffect(() => {
    if (!mountScene2 || scene2Ready || scene2Dead) return;
    const t = setTimeout(() => setScene2Failed(true), 25000);
    return () => clearTimeout(t);
  }, [mountScene2, scene2Ready, scene2Dead]);

  // Release each slot's GPU context when its scene goes away, from the canvas it
  // recorded at load. Sweeping the DOM in cleanup doesn't work: by then the
  // replacement canvas is already in the tree.
  const glCanvasRefs = useRef({});
  // One effect per slot: a shared one released slot1's context whenever layer 2's
  // url changed, even though slot1 hadn't remounted.
  useLayoutEffect(() => {
    const held = glCanvasRefs.current;
    return () => {
      releaseGlContext(held.slot1);
      held.slot1 = null;
    };
  }, [slot1Url]);
  useLayoutEffect(() => {
    const held = glCanvasRefs.current;
    const url = slot2Url;
    // Captured here; the registry object is never reassigned.
    const entries = l2Ref.current;
    return () => {
      releaseGlContext(held.slot2);
      held.slot2 = null;
      delete entries["m:" + url];
    };
  }, [slot2Url]);

  // The alternate mount has a fixed key and is desktop only: its context is
  // released only when it unmounts (entering the phone layout, or leaving).
  const dropAlt = useCallback(() => {
    releaseGlContext(altCanvasRef.current);
    altCanvasRef.current = null;
    appAltRef.current = null;
    headAltRef.current = null;
    armsAltRef.current = [];
  }, []);
  useLayoutEffect(() => dropAlt, [dropAlt]);
  // Passive, not layout: runs after react-spline's dispose on unmount.
  useEffect(() => {
    if (isMobile) dropAlt();
  }, [isMobile, dropAlt]);

  useCalloutsAboveDock(isMobile, sectionRef, calloutRefs);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    // Hero start scale. It also keeps Spline's in-canvas badge out of frame (it
    // shows below ~1.2).
    const startScale = reduce ? 1 : isMobile ? 1.86 : 1.9;
    // Desktop hero: the crown sits HERO_CROWN_TOP px from the top at any window
    // height. The head follows the cursor and moves the crown; 16px + 3.1% of the
    // height leaves ~16px with the head at rest. The y is a camera pan;
    // HERO_CROWN_FRAC_AT_BASE is the crown's measured position at a 38% pan.
    const HERO_Y_BASE = 38;
    const HERO_CROWN_FRAC_AT_BASE = 0.05;
    const heroVH = window.innerHeight || 900;
    const HERO_CROWN_TOP = 16 + 0.031 * heroVH;
    const heroY = HERO_Y_BASE + (HERO_CROWN_TOP / heroVH - HERO_CROWN_FRAC_AT_BASE) * 100;
    const startY = reduce ? "2%" : isMobile ? "16.5%" : `${heroY}%`;
    const endY = reduce ? "3%" : isMobile ? "17.9%" : `${heroY + 1.3}%`;
    // The rig leaves the head left of the camera axis, an offset that scales with
    // the window height. Desktop hero only.
    const heroDx = 0.0148 * heroVH;
    // Framings are written as the body's offset from the viewport centre, in px;
    // vw() turns that into a % of the viewport width for the transform.
    const VW = window.innerWidth || 2000;
    const vw = (px) => `${(px / VW) * 100}%`;

    // Chapter 2 framings. Each beat is chosen by L = 0.5 + (0.5 - y) / S, the
    // native canvas fraction at the frame's bottom edge, which must stay above the
    // waist (desktop p .709) on every beat and in between. The scale steps back
    // between beats and comes in again for the close. On phones the robot's size
    // comes from the rig (botRig); the canvas scale only crops.
    const c2pre = isMobile
      ? { scale: 1.833, x: "0%", y: "35.0%", rx: 13.3 } // L .582
      : { scale: 3.0, x: vw(0), y: "53%" }; // L .490
    // Story: a tight head shot (the head fills ~70% of the height), stepped left
    // to clear the text.
    const c2close = isMobile
      ? { scale: 1.667, x: "0%", y: "27.5%", rx: 14.6 } // L .635
      : { scale: 4.0, x: vw(-350), y: "103%" }; // L .368
    // Card 01 (left): the body sits opposite its card to balance the frame.
    const c2s2 = isMobile
      ? { scale: 1.5, x: "0%", y: "20.0%", rx: -16.3 } // L .700
      : { scale: 2.75, x: vw(150), y: "49.1%" }; // L .503 — above the elbow
    // Card 02 (right): leans toward its card.
    const c2s3 = isMobile
      ? { scale: 1.333, x: "0%", y: "12.5%", rx: 18.3 } // L .781
      : { scale: 2.15, x: vw(-200), y: "28.3%" }; // L .601 — past the elbow
    // Card 03: the widest beat, so the waist rule binds here.
    const c2far = isMobile
      ? { scale: 1.167, x: "0%", y: "5.0%", rx: -13.7 } // L .885
      : { scale: 1.835, x: vw(0), y: "17.9%" }; // L .675, above the waist
    // Closing: comes back in. On desktop the whole head sits just under the
    // "System Features" title, whose bottom edge is read from the DOM, so y
    // depends on the window height. Cards 02 and 03 re-anchor higher on the same
    // body parts (closeAnchors).
    const CROWN_P = 13.3;
    const headEl = featuresHeaderRef.current;
    const headBottomPx = headEl ? headEl.offsetTop + headEl.offsetHeight : 163;
    const VH = window.innerHeight || 900;
    const crownAtPct = ((headBottomPx + 14) / VH) * 100;
    const endScale = 2.28;
    const closeY = crownAtPct - 50 - (CROWN_P - 50) * endScale;
    // The rig leaves the head left of the camera axis, an offset that scales with
    // the window height. Compensated on the closing beat only, so the anchors stay
    // calibrated everywhere else.
    const closeDx = 0.0158 * VH;
    const c2end = isMobile
      ? { scale: 1.333, x: "0%", y: "12.5%", rx: -9.1 } // L .781
      : { scale: endScale, x: vw(closeDx), y: `${closeY}%` };
    const BODY_STEPS = [c2pre, c2close, c2s2, c2s3, c2far, c2end];

    // Gaze poses, radians, capped at ±0.35. +y turns the face to the viewer's
    // right, +x tips it down. Each one points at where its card actually sits.
    const GAZE = {
      text: { x: 0.26, y: 0.32 }, // story block, right — and down
      card01: { x: -0.18, y: -0.3 }, // card 01: left, upper
      card02: { x: 0.02, y: 0.32 }, // card 02: right, middle
      card03: { x: 0.24, y: -0.26 }, // card 03: left, lower
      front: { x: 0.0, y: 0.0 }, // released at the end
      closeMobile: { x: 0.24, y: -0.28 }, // phone close: chin down, to the left
    };

    // Touch devices on the desktop layout (tablets) have no pointer, so the scroll
    // drives the parallax offsets instead.
    const touchParallax = (p) => {
      if (reduce || isMobile || !parallax1Ref.current) return;
      const sway = Math.sin(p * Math.PI * 2.2);
      const rise = Math.cos(p * Math.PI * 1.6);
      gsap.set(parallax1Ref.current, { x: sway * 14, y: rise * 9 });
      if (parallax2Ref.current) gsap.set(parallax2Ref.current, { x: sway * -16, y: rise * 10 });
    };

    // Mouse parallax on scene 1 only (set up outside gsap.context). Scene 2 ignores
    // the cursor: its canvas inherits pointer-events-none.
    let removeMouse = null;
    let removeResize = null;
    if (!reduce) {
      const px1 = gsap.quickTo(parallax1Ref.current, "x", { duration: 0.9, ease: "power2.out" });
      const py1 = gsap.quickTo(parallax1Ref.current, "y", { duration: 0.9, ease: "power2.out" });
      const onMouse = (e) => {
        const r = sectionRef.current.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        px1(nx * 12);
        py1(ny * 8);
        mouseNRef.current = { x: nx, y: ny };
      };
      sectionRef.current.addEventListener("mousemove", onMouse);
      removeMouse = () => sectionRef.current?.removeEventListener("mousemove", onMouse);
    }

    // Desktop hero framing lives in this proxy and the camera applies it (applyView).
    const heroView = { scale: startScale, x: vw(heroDx), y: startY };
    const scene2View = { scale: 1, x: "0%", y: "0%" };

    const ctx = gsap.context(() => {
      if (isMobile) {
        gsap.set(canvasWrapRef.current, {
          scale: startScale,
          x: vw(-58),
          y: startY,
          transformOrigin: "50% 50%",
        });
        gsap.set(canvas2WrapRef.current, { ...c2close, transformOrigin: "50% 50%" });
      } else {
        [canvasWrapRef.current, canvas2WrapRef.current].forEach((el) =>
          gsap.set(el, { scale: VIEW_CSS_SCALE, x: 0, y: 0, transformOrigin: "50% 50%" }),
        );
        Object.assign(scene2View, { scale: c2close.scale, x: c2close.x, y: c2close.y });
      }
      // Initial state. Colours come from page-theme CSS variables, so nothing here
      // depends on the theme.

      // Vignette tint.
      vignetteRef.current.style.setProperty("--vignette", "0 0 0");

      gsap.set(wallTopRef.current, { opacity: 0 });
      if (isMobile) {
        [parallax1Ref.current, parallax2Ref.current, idle1Ref.current, idle2Ref.current].forEach(
          (el) => el && gsap.set(el, { x: 0, y: 0, rotation: 0, scale: 1 }),
        );
      }
      gsap.set(vignetteRef.current, { opacity: 0 });
      gsap.set(layer2Ref.current, { opacity: 0 });
      layer2InnerRef.current.style.setProperty("--lift-t", 0);
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
        canvasWrapRef.current.style.setProperty("--drain-t", drain.t);
      };
      applyDrain();
      const lift = { t: 0 };
      const applyLift = () => {
        layer2InnerRef.current.style.setProperty("--lift-t", lift.t);
      };

      // ---- phase 3 rig ------------------------------------------------------
      // `body.t` walks 0..3 across the four framings; anchors are re-projected
      // against whatever scale/offset that lands on, never against the final one.
      const lerp = (a, b, t) => a + (b - a) * t;

      // Anchors in the robot's own space (% of the untransformed layer), measured off
      // the silhouette at the closing framing. Card 02 anchors to the forearm: the
      // hand falls below the frame at its scale. anchorShift moves anchors measured
      // with the body 180px right of centre onto the now-centred rig.
      const anchorShift = -9;
      // Closing beat (desktop): the forearm and chest plate fall below the frame, so
      // cards 02 and 03 move up the same body parts and their dots glide there.
      const closeAnchors = isMobile
        ? []
        : [
            null,
            { px: 69.5 + anchorShift, py: 39.4 }, // 02 HANDS -> upper arm
            { px: 58.5 + anchorShift, py: 40.9 }, // 03 TORSO -> upper chest
          ];
      const anchors = [
        { px: 58.5 + anchorShift, py: 26.4 }, // 01 HEAD   — visor centre
        { px: 73.3 + anchorShift, py: 56.7 }, // 02 HANDS  — right forearm (see note above)
        { px: 58.5 + anchorShift, py: 54.1 }, // 03 TORSO  — centre of the chest plate
      ].map((a, i) => ({
        ...a,
        close: closeAnchors[i],
        fromX: 0,
        fromY: 0,
      }));

      // Where each connector starts, in % of the layer: `lineFrom` placed on the
      // card's own box (cards scale with the window). offsetLeft/Top ignore the y
      // GSAP animates on the cards.
      const measureLineOrigins = () => {
        calloutRefs.current.forEach((card, i) => {
          const layer = card?.offsetParent;
          const line = lineRefs.current[i];
          if (!card || !layer || !line) return;
          const lf = systemFeatures[i].lineFrom;
          anchors[i].fromX =
            ((card.offsetLeft + lf.x * card.offsetWidth) / layer.clientWidth) * 100;
          anchors[i].fromY =
            ((card.offsetTop + lf.y * card.offsetHeight) / layer.clientHeight) * 100;
          line.setAttribute("x1", anchors[i].fromX);
          line.setAttribute("y1", anchors[i].fromY);
        });
      };
      measureLineOrigins();

      const body = { t: 0 };
      const draw = systemFeatures.map(() => ({ p: 0 }));

      const applyPull = () => {
        // Interpolate between the two framings `body.t` sits between.
        const i = Math.min(Math.floor(body.t), BODY_STEPS.length - 2);
        const f = Math.min(Math.max(body.t - i, 0), 1);
        const A = BODY_STEPS[i],
          B = BODY_STEPS[i + 1];
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
            const ex = lerp(a.fromX, x, draw[i].p);
            const ey = lerp(a.fromY, y, draw[i].p);
            line.setAttribute("x2", ex);
            line.setAttribute("y2", ey);
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
        Object.keys(l2Ref.current)
          .filter((k) => k.startsWith("d:"))
          .map((k) => l2Ref.current[k]);

      // ---- directed gaze -----------------------------------------------------
      // Only the timeline steers the head; the cursor never does.
      const gaze = { x: 0, y: 0 }; // target written by the timeline
      const cur = { x: 0, y: 0 }; // what is actually applied, eased
      const applyGaze = () => {
        const heads = isMobile
          ? [
              app2Ref.current && app2Ref.current.findObjectByName
                ? app2Ref.current.findObjectByName("Head")
                : null,
            ]
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

      // The pose normaliser rides the gaze ticker rather than adding its own.
      const applyGazeAndPose = () => {
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

      // Where layer 2 fades in, in timeline seconds. Scene 2 wakes a little earlier
      // (60% of the way there) so it has drawn the framed robot by the time it shows.
      const XFADE_AT = 0.5;
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
            const wake2 = p > (XFADE_AT / tl.duration()) * 0.6;
            if (wake2 !== awake2Ref.current) {
              awake2Ref.current = wake2;
              const apps = isMobile ? [app2Ref.current] : l2Desktop().map((e) => e.app);
              apps.forEach((a) => {
                try {
                  if (wake2) a?.play();
                  else a?.stop();
                } catch {
                  /* runtime without play()/stop() */
                }
              });
            }
            if (p > 0.45 && !stopped1Ref.current) {
              stopped1Ref.current = true;
              // Both desktop layer A mounts, including the hidden one.
              try {
                app1Ref.current?.stop();
              } catch {
                /* runtime without stop() */
              }
              try {
                appAltRef.current?.stop();
              } catch {
                /* runtime without stop() */
              }
            }
            // Latches once: the dock stays even if the visitor scrolls back up.
            if (p > 0.985 && !journeyRef.current) {
              journeyRef.current = true;
              setJourneyDone(true);
              onJourneyEndRef.current?.();
            }
            if (p < 0.25 && stopped1Ref.current) {
              stopped1Ref.current = false;
              try {
                app1Ref.current?.play();
              } catch {
                /* runtime without play() */
              }
              try {
                appAltRef.current?.play();
              } catch {
                /* runtime without play() */
              }
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

      // Phase 2: crossfade to chapter 2; the robot rises in close-up.
      tl.to(splineLayerRef.current, { opacity: 0, duration: 0.12 }, XFADE_AT);
      tl.to(layer2Ref.current, { opacity: 1, duration: 0.12 }, XFADE_AT);
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

      const STEP_AT = [1.1, 1.7, 2.3]; // evenly spaced, 0.60 apart
      const CARD_IN = [1.32, 1.92, 2.52]; // card lands after the body settles
      const POSES = [GAZE.card01, GAZE.card02, GAZE.card03];

      if (storyEls.length)
        tl.to(storyEls, { opacity: 0, y: -24, duration: 0.1, ease: "power1.in" }, 1.02);
      tl.to(storyTitleRef.current, { opacity: 0, y: -24, duration: 0.1, ease: "power1.in" }, 1.02);
      tl.to(storyPanelRef.current, { opacity: 0, duration: 0.1, ease: "power1.in" }, 1.04);
      tl.to(featuresHeaderRef.current, { opacity: 1, y: 0, duration: 0.1 }, 1.1);

      systemFeatures.forEach((f, i) => {
        const at = STEP_AT[i];
        const cardAt = CARD_IN[i];
        // The head turns first and holds for the whole step.
        tl.to(gaze, { ...POSES[i], duration: 0.14, ease: "power2.inOut" }, at);
        tl.to(body, { t: i + 2, duration: 0.3, ease: "power1.inOut" }, at + 0.06);

        // The previous card and its connector leave with the same motion.
        if (i > 0) {
          tl.to(dotRefs.current[i - 1], { opacity: 0, duration: 0.04 }, at);
          tl.to(draw[i - 1], { p: 0, duration: 0.12, ease: "power1.inOut" }, at);
          tl.to(calloutRefs.current[i - 1], { opacity: 0, y: -20, duration: 0.1 }, at + 0.02);
          tl.set(lineRefs.current[i - 1], { opacity: 0 }, at + 0.14);
        }

        tl.to(
          calloutRefs.current[i],
          { opacity: 1, y: 0, duration: 0.12, ease: "power1.out" },
          cardAt,
        );
        tl.set(lineRefs.current[i], { opacity: 1 }, cardAt);
        tl.to(draw[i], { p: 1, duration: 0.14, ease: "power1.inOut" }, cardAt);
        tl.to(dotRefs.current[i], { opacity: 1, duration: 0.05 }, cardAt + 0.14);
        tl.to(railRefs.current[i], { opacity: 1, duration: 0.05 }, cardAt);
      });

      // Phones: SKIP INTRO shares the cards' spot (nothing else is free through the
      // whole sequence), so it hides while a card is on screen. autoAlpha also stops
      // it catching taps.
      if (isMobile && skipRef.current) {
        CARD_IN.forEach((cardAt, i) => {
          tl.to(skipRef.current, { autoAlpha: 0, duration: 0.05 }, cardAt - 0.05);
          // Card i leaves at STEP_AT[i + 1]; the last one stays to the end.
          if (i < CARD_IN.length - 1)
            tl.to(skipRef.current, { autoAlpha: 1, duration: 0.04 }, STEP_AT[i + 1] + 0.12);
        });
      }

      // Closing: the robot centres and the head turns front; on desktop all three
      // cards come back with their connectors.
      const closeAt = isMobile ? 2.72 : 2.92;
      tl.to(body, { t: 5, duration: 0.3, ease: "power1.inOut" }, closeAt);
      tl.to(
        gaze,
        { ...(isMobile ? GAZE.closeMobile : GAZE.front), duration: 0.16, ease: "power2.inOut" },
        closeAt,
      );
      if (!isMobile) {
        [0, 1].forEach((i) => {
          tl.to(
            calloutRefs.current[i],
            { opacity: 1, y: 0, duration: 0.12, ease: "power1.out" },
            3.16,
          );
          tl.set(lineRefs.current[i], { opacity: 1 }, 3.16);
          tl.to(draw[i], { p: 1, duration: 0.14, ease: "power1.inOut" }, 3.16);
          tl.to(dotRefs.current[i], { opacity: 1, duration: 0.05 }, 3.3);
          tl.to(railRefs.current[i], { opacity: 1, duration: 0.05 }, 3.16);
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
    let restoreRaf = null;
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

    // Both runtimes idle while the hero is off screen. Coming back, scene 2 always
    // resumes; scene 1 only if the sequence hasn't parked it.
    const heroVisibility = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        heroVisibleRef.current = visible;
        try {
          const l2Apps = isMobile
            ? [app2Ref.current]
            : Object.keys(l2Ref.current)
                .filter((k) => k.startsWith("d:"))
                .map((k) => l2Ref.current[k].app);
          if (visible) {
            l2Apps.forEach((a) => a?.play?.());
            // The alternate mount follows slot1's rule.
            if (!stopped1Ref.current) {
              app1Ref.current?.play?.();
              appAltRef.current?.play?.();
            }
          } else {
            app1Ref.current?.stop?.();
            appAltRef.current?.stop?.();
            l2Apps.forEach((a) => a?.stop?.());
          }
        } catch {
          /* runtime without play/stop */
        }
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
      if (removeMouse) removeMouse();
      if (removeResize) removeResize();
      heroVisibility.disconnect();
      if (lenis) lenis.off("scroll", onScroll);
      gsap.ticker.remove(applyGazeRef.current);
      ctx.revert();
    };
    // Depends on sceneUrl, not darkMode: a theme change rebuilds nothing.
  }, [isMobile, sceneUrl]);

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
                        <SceneBoundary
                          key={slot1Url}
                          name="hero slot1"
                          onFail={() => {
                            setFailed(true);
                            onReady?.();
                          }}
                        >
                          <Spline scene={slot1Url} onLoad={handleLoad} />
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
                        <SceneBoundary
                          key={HERO_ALT_URL}
                          name="hero alt"
                          onFail={() => markDead("alt")}
                        >
                          <Spline scene={HERO_ALT_URL} onLoad={handleAltLoad} />
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
              <div
                data-testid="hero-fallback-badge"
                className="absolute right-6 top-24 border border-ink/[0.13] bg-surface/60 px-4 py-2 font-display text-[13px] uppercase tracking-[0.02em] text-ink/65 backdrop-blur-md"
              >
                3D OFFLINE // STATIC RENDER
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
                              onFail={() => setScene2Failed(true)}
                            >
                              <Spline
                                scene={slot2Url}
                                onLoad={(app) => onScene2Load("m:" + slot2Url, app)}
                              />
                            </SceneBoundary>
                          </div>
                        )
                      : L2_DESKTOP_URLS.map((url) => (
                          <ReleasingBox
                            key={url}
                            onGone={() => {
                              const e = l2Ref.current["d:" + url];
                              if (e) releaseGlContext(e.canvas);
                              delete l2Ref.current["d:" + url];
                            }}
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
                              onFail={() => markDead("d:" + url)}
                            >
                              <Spline scene={url} onLoad={(app) => onScene2Load("d:" + url, app)} />
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
          className="font-orbitron text-xs font-bold tracking-[0.12em] text-white sm:text-sm sm:tracking-[0.3em]"
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
          Lands just past the pin so the marquee isn't skipped. Same treatment as the
          headline: difference over the black robot, solid white over the silver one. */}
      {!journeyDone && (
        <button
          ref={skipRef}
          data-testid="skip-intro"
          onClick={() => {
            const y = heroEndRef.current || window.innerHeight * 10;
            const lenis = getLenis();
            if (lenis) lenis.scrollTo(y + 4, { duration: 1.1 });
            else window.scrollTo({ top: y + 4, behavior: "smooth" });
          }}
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
            ref={(el) => (calloutRefs.current[i] = el)}
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
