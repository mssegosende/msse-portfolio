import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Spline from "@splinetool/react-spline";
import { FolderOpen, Send } from "lucide-react";
import {
  SPLINE_SCENE_URL,
  SPLINE_SCENE_2_URL,
  profile,
  story,
  storyTitle,
  systemFeatures,
} from "../data/portfolioData";
import { scrollToId } from "../hooks/useLenis";
import { useTheme } from "../hooks/useTheme";

gsap.registerPlugin(ScrollTrigger);

const lineReveal = {
  hidden: { y: "110%" },
  show: (i) => ({
    y: "0%",
    transition: { delay: 0.2 + i * 0.18, duration: 1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const uiFade = {
  hidden: { opacity: 0, y: 14 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.7 + i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};

const WORDMARK = "MSSENGINEERING";

// Both scenes expose a `Bot` object, and they DO NOT ship it in the same
// place: scene 1 has it at x -2.75, scene 2 at x +68.25 (and y 25.68 vs
// 13.68). That difference is the whole reason ROBOT_DX existed — the old fix
// pushed the canvas sideways in CSS to compensate, which only held at one
// viewport width because the scene's own render scale is height-limited when
// wide and width-limited when narrow (measured: +108px at 1100, +178 at 1700,
// flat ~182 beyond). Normalising the object itself fixes it in scene units,
// so it holds at every width and the two themes land the robot in exactly the
// same place — which is what makes the toggle swap in place instead of the
// figure jumping.
const OVERSAMPLE = 1.7;

// The two scenes ship the rig in different POSES, which is why the silver
// robot never quite matched the black one even with the body in the same
// place. Read off both rigs:
//
//            scene 1    scene 2
//   arm.x     -0.306    -0.474   (scene 2 holds its arms higher)
//   elbow.y   -0.018     0.179
//   forearm.x -0.471    -0.863   (and bends them further)
//
// Scene 1's values are canonical, because white mode is the default and runs
// that rig in both slots. Applied every frame rather than once at load: each
// scene animates its own pose, so a single assignment drifts straight back.
const POSE_HOME = { arm: -0.306, elbowY: -0.018, forearm: -0.471 };

const BOT_HOME = { x: -2.75477817251231, y: 25.67686585695104 };

/**
 * Hand the GPU context back. Application.dispose() drops the renderer but the
 * context itself survives until the browser garbage-collects it, and browsers
 * cap how many may be alive at once — so a handful of theme flips reaches
 * "Too many active WebGL contexts. Oldest context will be lost." and then the
 * next scene fails outright with "Error creating WebGL context".
 * WEBGL_lose_context is the only way to release one on demand. Safe on the 2D
 * grid canvas: asking a 2D canvas for a webgl context returns null.
 */
const releaseGlContext = (canvas) => {
  if (!canvas) return;
  try {
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const ext = gl && gl.getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
  } catch (e) {
    /* context already gone */
  }
};

/** Collect every arm joint once; findObjectByName per frame would be silly. */
const findBot = (app) => {
  try {
    return app?.findObjectByName?.("Bot") || null;
  } catch (e) {
    return null;
  }
};

const collectArms = (app) => {
  const out = [];
  try {
    const walk = (o, d) => {
      if (!o || d > 9) return;
      if (o.name === "arm" || o.name === "elbow" || o.name === "forearm") out.push(o);
      (o.children || []).forEach((ch) => walk(ch, d + 1));
    };
    walk(app?._scene || app?.scene, 0);
  } catch (e) {
    /* runtime without an inspectable graph */
  }
  return out;
};

const applyPose = (joints) => {
  for (let i = 0; i < joints.length; i++) {
    const j = joints[i];
    if (j.name === "arm") j.rotation.x = POSE_HOME.arm;
    else if (j.name === "elbow") j.rotation.y = POSE_HOME.elbowY;
    else j.rotation.x = POSE_HOME.forearm;
  }
};

/** Place a scene's rig at a known spot. Both scenes share the same rig. */
const placeBot = (app, { scale, y } = {}) => {
  try {
    const bot = app?.findObjectByName?.("Bot");
    if (!bot) return;
    bot.position.x = BOT_HOME.x;
    bot.position.y = y === undefined ? BOT_HOME.y : y;
    if (scale !== undefined) {
      bot.scale.x = scale;
      bot.scale.y = scale;
      bot.scale.z = scale;
    }
  } catch (e) {
    /* older runtime, or a scene without the named rig */
  }
};

// Where each callout lands. The gaze turns toward these in order, so the
// positions and the head poses in GAZE must stay in sync.
// No translate utilities here: GSAP animates `y` on these nodes and would
// wipe a Tailwind transform, so card 03 centres with mx-auto instead.

export const ScrollScene = ({ onReady, onJourneyEnd }) => {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  // Chapter 2 plays against the OPPOSITE tone from the page: black behind the
  // scene in white mode, white in dark mode. Its text therefore scopes to the
  // inverse of the page theme, or it comes out matching its own backdrop.
  // Chapter 2 now shares the page's tone instead of opposing it, so its text
  // scopes to the page theme rather than the inverse.
  const ch2Theme = darkMode ? "dark" : "light";
  // ONE robot per theme, the whole way through. The theme picks the model and
  // both slots run it, so the figure you meet in the opening shot is the same
  // one that carries the feature cards — white mode is the black robot on
  // white throughout, dark mode the silver robot on black throughout.
  const sceneUrl = darkMode ? SPLINE_SCENE_2_URL : SPLINE_SCENE_URL;
  const slot1Url = sceneUrl;
  const slot2Url = sceneUrl;
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mountScene2, setMountScene2] = useState(false);
  const [scene2Ready, setScene2Ready] = useState(false);
  const [scene2Failed, setScene2Failed] = useState(false);
  const [journeyDone, setJourneyDone] = useState(false);
  const readyRef = useRef(false);
  const mount2Ref = useRef(false);
  const stopped1Ref = useRef(false);
  const journeyRef = useRef(false);
  // Where the visitor was when the timeline had to be rebuilt. Reverting the
  // GSAP context removes the pin, which collapses the +1040% spacer; the page
  // suddenly gets shorter and the browser clamps the scroll, which is why
  // flipping the theme used to fling you into the second scene.
  const restoreScrollRef = useRef(null);
  // Held in a ref so the layout effect does not have to list it: App passes a
  // fresh closure every render, and rebuilding the whole timeline for that
  // would tear down the pin mid-scroll.
  const onJourneyEndRef = useRef(onJourneyEnd);
  onJourneyEndRef.current = onJourneyEnd;
  const app1Ref = useRef(null);
  const app2Ref = useRef(null);
  const lastMouseRef = useRef(0);
  const mouseGazeRef = useRef({ x: 0, y: 0 });
  const applyGazeRef = useRef(null);
  const armsRef = useRef([]);
  const botRef = useRef(null);
  const head1Ref = useRef(null);
  const heroEndRef = useRef(0);

  const sectionRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const canvas2WrapRef = useRef(null);
  const parallax1Ref = useRef(null);
  const parallax2Ref = useRef(null);
  const idle1Ref = useRef(null);
  const idle2Ref = useRef(null);
  const splineLayerRef = useRef(null);
  const overlayRef = useRef(null);
  const wallRef = useRef(null);
  const vignetteRef = useRef(null);
  const wm1Ref = useRef(null);
  const storyTitleRef = useRef(null);
  const storyPanelRef = useRef(null);
  const scrollCueRef = useRef(null);
  const layer2Ref = useRef(null);
  const layer2InnerRef = useRef(null);
  const headlineRef = useRef(null);
  const pillsRef = useRef(null);
  const featuresHeaderRef = useRef(null);
  const storyRefs = useRef([]);
  const calloutRefs = useRef([]);
  const lineRefs = useRef([]);
  const dotRefs = useRef([]);
  const railRefs = useRef([]);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  // The breakpoint used to be read once at mount and never again, so a page
  // that loaded under 768px — browser zoom, a narrow window, devtools docked
  // to the side — kept the mobile layout (full-width cards pinned to the
  // bottom, no connectors, no progress rail) even after the viewport went
  // back to desktop width. Only a reload recovered it. The layout effect
  // below already lists isMobile in its deps and reverts its GSAP context,
  // so re-running on a real breakpoint change is the path it was written for.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // loader: smooth asymptotic fill to ~90% over ~2.5s, completes on scene load
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
    armsRef.current = collectArms(app);
    head1Ref.current = app?.findObjectByName?.("Head") || null;
    // Scene 1 ships an OPAQUE background, and that is the whole reason the
    // wordmark leaked: an opaque canvas can only reveal the wall underneath
    // through a blend mode, and multiply -- the only one that reveals it --
    // by definition also lets it through wherever the robot is not black.
    // Measured: 8272 pixels of the word showing in the body's deep interior.
    //
    // The runtime accepts a transparent background, so the scene stops being
    // a sheet of colour and becomes what scene 2 already was: a figure with
    // alpha. Composited normally, the robot's own pixels cover the wall and
    // its empty ones reveal it. No blend, no leak.
    try {
      app.setBackgroundColor("rgba(0,0,0,0)");
    } catch (e) {
      /* older runtime */
    }
    glCanvasRefs.current.slot1 = canvasWrapRef.current
      ? canvasWrapRef.current.querySelector("canvas")
      : null;
    if (readyRef.current) return;
    readyRef.current = true;
    setProgress(100);
    setTimeout(() => {
      setLoaded(true);
      onReady?.();
    }, 700);
  };

  // scene 2: lazy load watchdog -> fallback render if it never comes up
  useEffect(() => {
    if (!mountScene2 || scene2Ready || scene2Failed) return;
    const t = setTimeout(() => setScene2Failed(true), 25000);
    return () => clearTimeout(t);
  }, [mountScene2, scene2Ready, scene2Failed]);

  const revealed = loaded || failed;

  // Keyed on the scene urls: when a theme flip swaps them, React unmounts the
  // old canvases, and this cleanup runs in the mutation phase — while they are
  // still in the DOM and can still be asked to release their context.
  // Each slot records the canvas its scene actually took, at load. Sweeping
  // the DOM in the cleanup does not work: React runs destroy functions during
  // the mutation phase, by which point the REPLACEMENT canvas is already in
  // the tree, and the sweep kills the context that was just created.
  const glCanvasRefs = useRef({});
  useLayoutEffect(() => {
    const held = glCanvasRefs.current;
    return () => {
      releaseGlContext(held.slot1);
      releaseGlContext(held.slot2);
      held.slot1 = null;
      held.slot2 = null;
    };
  }, [slot1Url, slot2Url]);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    // middle ground: camera closer, robot vertically centered, little air above the head
    // Back to the approved close-up. The wide full-body framing read as too
    // distant. Note the overscale also keeps Spline's "Built with Spline"
    // badge out of frame — it is drawn INSIDE the WebGL canvas, not the DOM,
    // so CSS cannot reach it; anything at or below ~1.2 brings it into view.
    const startScale = reduce ? 1 : isMobile ? 1.95 : 1.78;
    // The head cleared the top of the viewport by ~78px at 2000x1014, which
    // read as dead air. Measured off the silhouette, not the transform: -3.9%
    // of the wrap height is ~39px, so the gap halves and the head still has
    // room. The wall is inside the same scaled wrap (1.45 => 228px of bleed
    // past each edge), so moving it up cannot expose an edge.
    // Zooming in pushes the crown off the top: scaling about the centre moves
    // a point at y40 to (40-507)*1.78/1.45+507 = -66 at 2000x1014. 66px of a
    // 1014 frame is 6.5%, so the framing steps down by that much to put the
    // head back where it was.
    // A phone is a portrait frame, so scene 1 is composed as a portrait: head
    // and shoulders, big and centred, with the headline under it — rather
    // than a mid-torso crop that reads as neither close nor wide. Derived the
    // same way as the story beat: the head occupies native fraction
    // p 0.154..0.33, and putting its midpoint at 34% of an 844 frame at
    // scale 2.15 solves to y 40%.
    const startY = reduce ? "2%" : isMobile ? "20%" : "12.6%";
    const endY = reduce ? "3%" : isMobile ? "22%" : "14.1%";
    // phase 2 (story): extreme close-up — head + upper chest fill the frame;
    // mobile sits higher/smaller so the story paragraphs fit below the head
    // The robot is NOT centred inside the Spline scene: its body sits about
    // 180px (unscaled) right of the canvas centre, so x:0 centres the CANVAS,
    // not the robot. Measured off the rendered silhouette at two scales
    // (+258px at 1.35, +208px at 1.15 => ~180px unscaled), not off the
    // transform. Every framing below is expressed as the visual offset of the
    // BODY from the viewport centre; fx() converts it into the transform.
    // ROBOT_DX is a property of the MODEL in slot 2, not of the slot. Measured
    // off the rendered silhouette's centroid at 2000px, default camera:
    //   scene 2's robot  +177.8px  (the calibrated 180 below)
    //   scene 1's robot    -6.5px  (centred — it is a different model)
    // So when dark mode puts scene 1's robot in slot 2, the correction has to
    // go to ~0 or every framing lands 180px off.
    // Zero now, in both themes: placeBot() centres the rig in SCENE units, so
    // there is nothing left for CSS to compensate and nothing that drifts with
    // viewport width. Kept as a named constant because every framing below is
    // still expressed as "where the BODY goes", not where the canvas goes.
    const ROBOT_DX = 0;
    const ROBOT_DX_1 = 0;
    const VW = window.innerWidth || 2000;
    const fx = (visualPx, scale) => `${((visualPx - ROBOT_DX * scale) / VW) * 100}%`;
    const fx1 = (visualPx, scale) => `${((visualPx - ROBOT_DX_1 * scale) / VW) * 100}%`;

    // Scale progression 2.8 -> 2.4 -> 2.0 -> 1.6 -> 1.5: always some retreat
    // between beats, and the closing comes back in rather than pulling further.
    //
    // The phone gets its own progression: 2.0 -> 1.8 -> 1.6 -> 1.4, even
    // steps of 0.2 instead of a 0.9 drop out of the story followed by three
    // small ones, and the head swings right / left / right / left so each
    // card arrives against a changed frame.
    //
    // The ceiling is not taste, it is geometry: the story panel and the
    // callouts own the lower two thirds of a phone, so the head has to live
    // in the top ~350px. It is 178px of native render, so anything past ~2.0
    // pushes the face behind the panel. Each y below pins the crown near 40px
    // from the solved form Y = (40 + 292*S - 422) / 844.
    const c2pre = isMobile
      ? { scale: 2.2, x: "22%", y: "31%" }
      : { scale: 3.0, x: fx(0, 3.0), y: "53%" };
    // STEP 1 (story) — closest, and centred. The text sits to the right.
    // STEP 1 (story) — a tight head shot, so the difference between the two
    // robots reads at a glance instead of being a detail on a torso.
    //
    // Solved from the projection, not guessed. A point at native-canvas
    // fraction p lands at (p*H - H/2)*S + H/2 + Y*H. At the old 2.8/47% the
    // crown sat on the top edge and the chin at ~500, which puts the head at
    // p 0.154..0.33 — 178px of native render. Filling ~70% of a 1014 frame
    // needs S = 710/178 ≈ 4.0, and centring the head's midpoint (p 0.242)
    // then solves to Y = 103%. It steps left so the story column stays clear.
    const c2close = isMobile
      ? { scale: 2.0, x: "22%", y: "23%" }
      : { scale: 4.0, x: fx(-350, 4.0), y: "103%" };
    // STEP 2 (card 01, at the LEFT) — the body now sits OPPOSITE its card
    // instead of leaning into it. Leaning left put the figure and the card on
    // the same side and vacated the whole right half; that read as
    // atmospheric when the ground was black, but on white it is just a hole.
    // Card left + body right balances the frame and gives the connector a
    // span to cross.
    const c2s2 = isMobile
      ? { scale: 1.8, x: "-22%", y: "17%" }
      : { scale: 2.75, x: fx(150, 2.75), y: "49.1%" };   // L .48 — above the elbow
    // STEP 3 (card 02, at the RIGHT) — leans right toward its card. -520 put
    // the body hard against the left edge with a 285px void before the card;
    // it still crops, just less.
    const c2s3 = isMobile
      ? { scale: 1.6, x: "22%", y: "10%" }
      : { scale: 2.15, x: fx(-200, 2.15), y: "28.3%" }; // L .57 — past the elbow
    // STEP 4 (card 03) — body centred; stays here
    const c2far = isMobile
      ? { scale: 1.4, x: "-14%", y: "3%" }
      : { scale: 1.65, x: fx(0, 1.65), y: "11.0%" };    // L .70 — the waist
    // CLOSING — comes back in slightly, same centred position
    const c2end = isMobile
      ? { scale: 1.6, x: "-11%", y: "12.5%" }
      : { scale: 1.25, x: fx(0, 1.25), y: "-2.8%" };    // L .875 — down the legs
    const BODY_STEPS = [c2pre, c2close, c2s2, c2s3, c2far, c2end];

    // Gaze poses, radians, capped at ±0.35. +y turns the face to the viewer's
    // right, +x tips it down. Each one points at where its card actually sits.
    const GAZE = {
      text: { x: 0.26, y: 0.32 },       // story block, right — and down
      card01: { x: -0.18, y: -0.30 },   // card 01: left, upper
      card02: { x: 0.02, y: 0.32 },     // card 02: right, middle
      card03: { x: 0.24, y: -0.26 },    // card 03: left, lower
      front: { x: 0.0, y: 0.0 },        // released at the end
      closeMobile: { x: 0.24, y: -0.28 }, // phone close: chin down, to the left
    };


    // A phone has no pointer, so the parallax that gives the scenes their
    // depth on desktop never fires there — which is why they felt flatter.
    // Scroll is the only continuous input a phone has, so it drives the same
    // two offsets instead: a slow sway across the pinned sequence. It writes
    // the same refs as the mouse path and costs one assignment per tick.
    const touchParallax = (p) => {
      if (reduce || isMobile || !parallax1Ref.current) return;
      const sway = Math.sin(p * Math.PI * 2.2);
      const rise = Math.cos(p * Math.PI * 1.6);
      gsap.set(parallax1Ref.current, { x: sway * 14, y: rise * 9 });
      if (parallax2Ref.current) gsap.set(parallax2Ref.current, { x: sway * -16, y: rise * 10 });
    };

    // mouse parallax on both scenes (outside gsap.context to avoid TDZ on ctx)
    let removeMouse = null;
    if (!reduce) {
      const px1 = gsap.quickTo(parallax1Ref.current, "x", { duration: 0.9, ease: "power2.out" });
      const py1 = gsap.quickTo(parallax1Ref.current, "y", { duration: 0.9, ease: "power2.out" });
      const px2 = gsap.quickTo(parallax2Ref.current, "x", { duration: 0.9, ease: "power2.out" });
      const py2 = gsap.quickTo(parallax2Ref.current, "y", { duration: 0.9, ease: "power2.out" });
      const onMouse = (e) => {
        const r = sectionRef.current.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        px1(nx * 12); py1(ny * 8);
        px2(nx * 12); py2(ny * 8);
        // cursor takes priority over the directed gaze for 1.2s after it moves
        lastMouseRef.current = Date.now();
        mouseGazeRef.current = { x: ny * 0.7, y: nx * 0.7 }; // ±0.35 rad
      };
      sectionRef.current.addEventListener("mousemove", onMouse);
      removeMouse = () => sectionRef.current?.removeEventListener("mousemove", onMouse);
    }

    const ctx = gsap.context(() => {
      gsap.set(canvasWrapRef.current, {
        scale: startScale,
        x: fx1(isMobile ? (darkMode ? 46 : -46) : 0, startScale),
        y: startY,
        transformOrigin: "50% 50%",
      });
      gsap.set(canvas2WrapRef.current, { ...c2close, transformOrigin: "50% 50%" });
      // The hero loads as white as CSS allows and only settles into the grey
      // once the scroll starts. Two of the three greys are ours: the wall is
      // #EDEDED (237) and the edge vignette is on at full strength from the
      // first paint. The third is not — the Spline canvas composites with
      // mix-blend-multiply over its own light-grey backdrop, which costs a
      // flat ~27 levels everywhere and cannot come off without losing the
      // occlusion that makes the robot read against the wall.
      // ---- tone ------------------------------------------------------------
      // Dark mode runs the same sequence against the opposite tone. The two
      // models trade slots (see slot1Url/slot2Url), so the robot you see is
      // always the real material — silver opening on black, black closing on
      // white — never a negative of the other one.
      const tone = darkMode
        ? {
            wallStart: "#000000",
            wallSettle: "#121212",
            wmStart: "#121212",
            wmSettle: "#000000",
            overlay: "#000000",
            backdrop: "#000000",
            railOn: "#FFFFFF",
            vignette: "0 0 0",
            drainTo: { b: 0.02, c: 1.15 },
            liftFrom: 0.25,
          }
        : {
            wallStart: "#FFFFFF",
            wallSettle: "#EDEDED",
            wmStart: "#EDEDED",
            wmSettle: "#FFFFFF",
            overlay: "#FFFFFF",
            backdrop: "#FFFFFF",
            railOn: "#000000",
            vignette: "0 0 0",
            // white mode dips through WHITE, not black: the wash rises into
            // the veil instead of falling into it
            drainTo: { b: 1.25, c: 0.9 },
            liftFrom: 1.6,
          };

      // The backdrop scene 2 composites against — its canvas is transparent, so
      // this is the colour the robot is actually seen on.
      gsap.set(sectionRef.current, { backgroundColor: tone.backdrop });
      gsap.set(overlayRef.current, { backgroundColor: tone.overlay });
      vignetteRef.current.style.setProperty("--vignette", tone.vignette);

      gsap.set(wallRef.current, { backgroundColor: tone.wallStart });
      // The wordmark is mix-blend-difference, so what you see is |wall - text|.
      // Against a pure white wall, white text differences to exactly zero and
      // the wordmark disappears (measured: 0 levels of spread, vs 6 at
      // #EDEDED). Load it at #EDEDED so the delta is the same 18 levels the
      // approved treatment has, and let the two swap as the wall darkens.
      // The wordmark is painted on the wall, which lives INSIDE the wrap that
      // slot 1 translates to centre its robot. Without this it slides off with
      // the wall. The offset is in the wrap's local px, so the wrap's own scale
      // cancels it exactly and the mark stays centred in the viewport.
      gsap.set(wm1Ref.current, { x: ROBOT_DX_1 });
      if (isMobile) {
        [parallax1Ref.current, parallax2Ref.current, idle1Ref.current, idle2Ref.current].forEach(
          (el) => el && gsap.set(el, { x: 0, y: 0, rotation: 0, scale: 1 })
        );
      }
      gsap.set(vignetteRef.current, { opacity: 0 });
      gsap.set(layer2Ref.current, { opacity: 0 });
      gsap.set(layer2InnerRef.current, { filter: `brightness(${tone.liftFrom})` });
      gsap.set(featuresHeaderRef.current, { opacity: 0, y: 24 });
      gsap.set(overlayRef.current, { opacity: 0 });
      storyRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0, y: 28 }));
      gsap.set(storyTitleRef.current, { opacity: 0, y: 28 });
      // The panel that carries the mobile backdrop fades as one with the text
      // it sits behind; without this its translucent ground is painted over
      // the robot from the first frame.
      gsap.set(storyPanelRef.current, { opacity: 0 });
      calloutRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0, y: 36 }));
      lineRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0 }));
      dotRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0 }));

      // continuous idle motion: slow float (~6s loop) + subtle tilt, both
      // scenes. Desktop only — see the note on touchParallax above.
      if (!reduce && !isMobile) {
        [idle1Ref.current, idle2Ref.current].forEach((el) => {
          if (!el) return;
          gsap.set(el, { y: -3, rotation: -0.2 });
          gsap.to(el, { y: 3, duration: 5, yoyo: true, repeat: -1, ease: "sine.inOut" });
          gsap.to(el, { rotation: 0.2, duration: 6.3, yoyo: true, repeat: -1, ease: "sine.inOut" });
        });
        // A slow lateral drift and a shallow breath on scene 1. Both are
        // transform-only and run on periods that do not divide into the float
        // above, so the motion never settles into an obvious loop.
        if (idle1Ref.current) {
          gsap.fromTo(
            idle1Ref.current,
            { x: -4 },
            { x: 4, duration: 8.7, yoyo: true, repeat: -1, ease: "sine.inOut" }
          );
          gsap.fromTo(
            idle1Ref.current,
            { scale: 0.997 },
            { scale: 1.004, duration: 7.1, yoyo: true, repeat: -1, ease: "sine.inOut" }
          );
        }
      }

      // tonal drain proxy: light drains out of scene 1, no shapes
      const drain = { b: 1, c: 1 };
      const applyDrain = () => {
        canvasWrapRef.current.style.filter = `brightness(${drain.b}) contrast(${drain.c})`;
      };
      applyDrain();
      const lift = { b: tone.liftFrom };
      const applyLift = () => {
        layer2InnerRef.current.style.filter = `brightness(${lift.b})`;
      };

      // ---- phase 3 rig ------------------------------------------------------
      // `body.t` walks 0..3 across the four framings; anchors are re-projected
      // against whatever scale/offset that lands on, never against the final one.
      const lerp = (a, b, t) => a + (b - a) * t;

      // Anchors in the robot's OWN space (percent of the untransformed layer).
      // Re-derived by inverting the projection below against the closing
      // framing (scale 1.5, x -13.5%, y 8%) with the body parts measured off
      // the bare silhouette, because the previous set was authored for a
      // framing that no longer exists: "head" landed on the chest, "hands" on
      // the lower torso and "torso" below the robot entirely.
      //
      // The literal hands sit at py ~77.7. At card 02's scale of 2.0 that
      // projects to y ~128% — 288px BELOW the viewport — so card 02 anchors
      // to the forearm instead, which is the nearest point on the same limb
      // that stays on screen at every beat it appears in.
      // The anchor percentages below were calibrated against scene 2's robot,
      // whose body centre sits ROBOT_DX right of the layer centre. Swapping the
      // model moves that centre, so every anchor shifts by the same delta
      // expressed in layer percent. In white mode this evaluates to 0 and the
      // calibrated numbers are used untouched.
      // -9 = 180px at the 2000px reference the anchors were calibrated on.
      // Constant, not VW-derived: the body no longer moves with viewport width.
      const anchorShift = -9;
      const anchors = [
        { px: 58.5 + anchorShift, py: 26.4 },   // 01 HEAD   — visor centre
        { px: 73.3 + anchorShift, py: 56.7 },   // 02 HANDS  — right forearm (see note above)
        { px: 58.5 + anchorShift, py: 54.1 },   // 03 TORSO  — centre of the chest plate
      ].map((a, i) => ({
        ...a,
        fromX: systemFeatures[i].from.x,
        fromY: systemFeatures[i].from.y,
      }));

      const body = { t: 0 };
      const draw = systemFeatures.map(() => ({ p: 0 }));

      const applyPull = () => {
        // interpolate between the two framings `body.t` currently sits between
        const i = Math.min(Math.floor(body.t), BODY_STEPS.length - 2);
        const f = Math.min(Math.max(body.t - i, 0), 1);
        const A = BODY_STEPS[i], B = BODY_STEPS[i + 1];
        const sc = lerp(A.scale, B.scale, f);
        const tx = lerp(parseFloat(A.x), parseFloat(B.x), f);
        const ty = lerp(parseFloat(A.y), parseFloat(B.y), f);
        gsap.set(canvas2WrapRef.current, { scale: sc, x: `${tx}%`, y: `${ty}%` });

        // vector-effect="non-scaling-stroke" makes stroke-dasharray screen-space,
        // so the connector length must be measured in px, not in viewBox units
        const W = sectionRef.current ? sectionRef.current.clientWidth : 1;
        const H = sectionRef.current ? sectionRef.current.clientHeight : 1;

        // re-project every anchor against the live transform
        anchors.forEach((a, i) => {
          const x = 50 + (a.px - 50) * sc + tx;
          const y = 50 + (a.py - 50) * sc + ty;
          const line = lineRefs.current[i];
          if (line) {
            // dashed connector that grows from the card toward the body part:
            // the endpoint itself is interpolated, so the dash pattern stays put
            // instead of marching. Reversing draw[i].p erases it the same way.
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

      // ---- directed gaze, with the cursor taking over ------------------------
      const gaze = { x: 0, y: 0 };      // target written by the timeline
      const cur = { x: 0, y: 0 };       // what is actually applied, eased
      // While `lock` is 1 the head stays welded to the directed pose: the
      // cursor cannot pull it away and it never drifts back to centre. The
      // timeline releases it on the closing beat.
      const gazeLock = { on: 1 };
      const applyGaze = () => {
        const head = app2Ref.current && app2Ref.current.findObjectByName
          ? app2Ref.current.findObjectByName("Head")
          : null;
        if (!head) return;
        const fresh = !gazeLock.on && Date.now() - lastMouseRef.current < 1200;
        const tx = fresh ? mouseGazeRef.current.x : gaze.x;
        const ty = fresh ? mouseGazeRef.current.y : gaze.y;
        cur.x += (tx - cur.x) * 0.08;
        cur.y += (ty - cur.y) * 0.08;
        head.rotation.x = cur.x;
        head.rotation.y = cur.y;
      };
      // The feet are not in the render at the rig's default scale — the
      // camera crops at 3/4 and nothing in CSS can recover what was never
      // drawn. The only way to end on them is to shrink the object and lift
      // it, so the whole figure fits inside the frame the camera does draw.
      //
      // Solved, with the badge as the binding constraint. In native canvas px
      // at 1014 tall: feet = 812.3 + 875*s - 2.5*(y - 25.68), head is the
      // same with the sign flipped. Leaving a quarter of the canvas empty
      // below the feet is what keeps Spline's badge off screen once the
      // framing pans down, and that lands on s .40 / y 186.
      const botRig = { s: 0.8, y: BOT_HOME.y };
      const applyBotRig = () => {
        const bot = botRef.current;
        if (!bot) return;
        bot.scale.x = botRig.s;
        bot.scale.y = botRig.s;
        bot.scale.z = botRig.s;
        bot.position.y = botRig.y;
      };

      // Scene 1's head has no choreography of its own — the directed gaze
      // only ever drove slot 2 — so it just stared straight ahead. It now
      // holds a default direction and wanders a little around it, always
      // easing back: right in white mode, left in dark, so the figure is
      // turned toward the side its own theme opens on.
      //
      // Two sine terms on periods that do not divide into each other, so the
      // drift never settles into a visible loop, and a 0.05 ease so it always
      // returns rather than snapping.
      const HEAD1_BASE = { x: 0.05, y: darkMode ? -0.27 : 0.27 };
      const head1 = { x: HEAD1_BASE.x, y: HEAD1_BASE.y };
      let head1T = 0;
      const applyHead1 = () => {
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
        if (armsRef.current.length) applyPose(armsRef.current);
        applyBotRig();
        applyHead1();
      };
      applyGazeRef.current = applyGazeAndPose;
      gsap.ticker.add(applyGazeAndPose);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        // keeps dots/lines glued to the robot while it is still moving
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
            if (p > 0.15 && !mount2Ref.current) {
              mount2Ref.current = true;
              setMountScene2(true);
            }
            if (p > 0.45 && !stopped1Ref.current) {
              stopped1Ref.current = true;
              try { app1Ref.current?.stop(); } catch (e) { /* runtime without stop() */ }
            }
            // Latches once and never unlatches: the dock and the calls to
            // action appear when the sequence has been seen, and stay put.
            // Scrolling back to the top must not hide them again, or the
            // visitor has to sit through both scenes a second time to get
            // the nav back.
            if (p > 0.985 && !journeyRef.current) {
              journeyRef.current = true;
              setJourneyDone(true);
              onJourneyEndRef.current?.();
            }
            if (p < 0.25 && stopped1Ref.current) {
              stopped1Ref.current = false;
              try { app1Ref.current?.play(); } catch (e) { /* runtime without play() */ }
            }
          },
        },
      });

      // wordmarks drift slowly through their scenes
      tl.fromTo(wm1Ref.current, { y: 24 }, { y: -40, duration: 0.5 }, 0);

      // Grey settles in ahead of the drain, so the order reads white -> grey
      // -> black instead of white -> black.
      tl.to(vignetteRef.current, { opacity: 1, duration: 0.20 }, 0.02);
      tl.to(wallRef.current, { backgroundColor: tone.wallSettle, duration: 0.20 }, 0.02);

      // PHASE 1 exit: headline leaves, light drains to black, slight drift-in
      tl.to(headlineRef.current, { opacity: 0, y: -140, duration: 0.1 }, 0.06);
      tl.to(scrollCueRef.current, { opacity: 0, y: 20, duration: 0.06 }, 0.02);
      tl.to(drain, { ...tone.drainTo, duration: 0.3, onUpdate: applyDrain }, 0.1);
      tl.to(overlayRef.current, { opacity: 1, duration: 0.34 }, 0.1);
      tl.to(
        canvasWrapRef.current,
        {
          scale: startScale * 0.96,
          x: fx1(isMobile ? (darkMode ? 46 : -46) : 0, startScale * 0.96),
          y: endY,
          duration: 0.32,
          ease: "power1.inOut",
        },
        0.1
      );
      tl.to(pillsRef.current, { opacity: 0, y: 24, duration: 0.08 }, 0.2);

      // PHASE 2: crossfade in darkness — chrome robot rises in EXTREME CLOSE-UP
      tl.to(splineLayerRef.current, { opacity: 0, duration: 0.12 }, 0.5);
      tl.to(layer2Ref.current, { opacity: 1, duration: 0.12 }, 0.5);
      tl.to(lift, { b: 1, duration: 0.16, onUpdate: applyLift }, 0.5);

      // story paragraphs fade in one after another during the close-up hold
      // (long scroll lock: only the tiny idle breathing moves the robot here)
      tl.to(storyPanelRef.current, { opacity: 1, duration: 0.07, ease: "power1.out" }, 0.54);
      tl.to(storyTitleRef.current, { opacity: 1, y: 0, duration: 0.07, ease: "power1.out" }, 0.56);
      if (storyRefs.current[0])
        tl.to(storyRefs.current[0], { opacity: 1, y: 0, duration: 0.07, ease: "power1.out" }, 0.62);
      if (storyRefs.current[1])
        tl.to(storyRefs.current[1], { opacity: 1, y: 0, duration: 0.07, ease: "power1.out" }, 0.78);

      // PHASE 3 — the robot is ALREADY moving when the crossfade reveals it,
      // then four evenly spaced steps and a closing beat. Each card gets the
      // same slice of scroll so none of them feels rushed against the others.
      const storyEls = storyRefs.current.filter(Boolean);

      // ENTRY: starts at 0.40, under the crossfade (0.50), so the scene is
      // never revealed frozen. One continuous eased move into the story framing.
      tl.to(body, { t: 1, duration: 0.38, ease: "power2.out" }, 0.40);
      tl.to(gaze, { ...GAZE.text, duration: 0.10, ease: "power2.out" }, 0.46);

      const STEP_AT = [1.10, 1.70, 2.30];  // evenly spaced, 0.60 apart
      const CARD_IN = [1.32, 1.92, 2.52];  // card lands after the body settles
      const POSES = [GAZE.card01, GAZE.card02, GAZE.card03];

      if (storyEls.length)
        tl.to(storyEls, { opacity: 0, y: -24, duration: 0.10, ease: "power1.in" }, 1.02);
      tl.to(storyTitleRef.current, { opacity: 0, y: -24, duration: 0.10, ease: "power1.in" }, 1.02);
      tl.to(storyPanelRef.current, { opacity: 0, duration: 0.10, ease: "power1.in" }, 1.04);
      tl.to(featuresHeaderRef.current, { opacity: 1, y: 0, duration: 0.10 }, 1.10);

      systemFeatures.forEach((f, i) => {
        const at = STEP_AT[i];
        const cardAt = CARD_IN[i];
        // head turns FIRST, and holds there for the whole step
        tl.to(gaze, { ...POSES[i], duration: 0.14, ease: "power2.inOut" }, at);
        tl.to(body, { t: i + 2, duration: 0.30, ease: "power1.inOut" }, at + 0.06);

        // the previous card and its connector are erased with the same motion
        if (i > 0) {
          tl.to(dotRefs.current[i - 1], { opacity: 0, duration: 0.04 }, at);
          tl.to(draw[i - 1], { p: 0, duration: 0.12, ease: "power1.inOut" }, at);
          tl.to(calloutRefs.current[i - 1], { opacity: 0, y: -20, duration: 0.10 }, at + 0.02);
          tl.set(lineRefs.current[i - 1], { opacity: 0 }, at + 0.14);
        }

        tl.to(calloutRefs.current[i], { opacity: 1, y: 0, duration: 0.12, ease: "power1.out" }, cardAt);
        tl.set(lineRefs.current[i], { opacity: 1 }, cardAt);
        tl.to(draw[i], { p: 1, duration: 0.14, ease: "power1.inOut" }, cardAt);
        tl.to(dotRefs.current[i], { opacity: 1, duration: 0.05 }, cardAt + 0.14);
        tl.to(railRefs.current[i], { color: tone.railOn, duration: 0.05 }, cardAt);
      });

      // CLOSING: robot centres in the viewport, the head is released, and the
      // three cards come back together with their three dashed connectors.
      const closeAt = isMobile ? 2.72 : 2.92;
      tl.to(body, { t: 5, duration: 0.30, ease: "power1.inOut" }, closeAt);
      tl.to(gaze, { ...(isMobile ? GAZE.closeMobile : GAZE.front), duration: 0.16, ease: "power2.inOut" }, closeAt);
      tl.set(gazeLock, { on: 0 }, closeAt + 0.18);
      if (!isMobile) {
        [0, 1].forEach((i) => {
          tl.to(calloutRefs.current[i], { opacity: 1, y: 0, duration: 0.12, ease: "power1.out" }, 3.16);
          tl.set(lineRefs.current[i], { opacity: 1 }, 3.16);
          tl.to(draw[i], { p: 1, duration: 0.14, ease: "power1.inOut" }, 3.16);
          tl.to(dotRefs.current[i], { opacity: 1, duration: 0.05 }, 3.30);
          tl.to(railRefs.current[i], { color: tone.railOn, duration: 0.05 }, 3.16);
        });
      }



      // hold before release. Short on a phone: there is no three-card payoff
      // to read there, so a long one just feels like the page has jammed.
      tl.to({}, { duration: isMobile ? 0.12 : 0.45 });

      if (tl.scrollTrigger) heroEndRef.current = tl.scrollTrigger.end;

      // first projection, so nothing is stale before the first scroll tick
      applyPull();
    }, sectionRef);

    // Put the visitor back where they were. refresh() first so the pin spacer
    // has re-established the page height — without it the scroll target is
    // still clamped to the collapsed document.
    let restoreRaf = null;
    if (restoreScrollRef.current != null) {
      const y = restoreScrollRef.current;
      restoreScrollRef.current = null;
      ScrollTrigger.refresh();
      let tries = 0;
      const put = () => {
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
        // Give up once it holds, or after a handful of frames; the spacer can
        // take a beat to settle and every frame before that clamps the value.
        if (++tries < 12 && Math.abs(window.scrollY - y) > 2) {
          restoreRaf = requestAnimationFrame(put);
        }
      };
      put();
    }

    // Scene 1 was already stopped past 45% of the sequence, but scene 2 was
    // never stopped at all: once the visitor scrolled past the hero into the
    // text sections, a WebGL context went on rendering at full rate, off
    // screen, for the rest of the session. That is the expensive thing here —
    // not the cards, which are plain DOM.
    //
    // Both runtimes now idle whenever the hero is out of view. Coming back,
    // scene 2 always resumes; scene 1 only if the sequence has not already
    // parked it, so the two rules do not fight.
    const heroVisibility = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        try {
          if (visible) {
            app2Ref.current?.play?.();
            if (!stopped1Ref.current) app1Ref.current?.play?.();
          } else {
            app1Ref.current?.stop?.();
            app2Ref.current?.stop?.();
          }
        } catch (e) {
          /* runtime without play/stop */
        }
      },
      { rootMargin: "120px" }
    );
    if (sectionRef.current) heroVisibility.observe(sectionRef.current);

    const lenis = window.__lenis;
    const onScroll = () => ScrollTrigger.update();
    if (lenis) lenis.on("scroll", onScroll);
    const refresh = setTimeout(() => ScrollTrigger.refresh(), 900);

    return () => {
      restoreScrollRef.current = window.scrollY;
      // Never keep writing rotations into an Application that is being torn
      // down: the ticker below is removed, but these refs outlive the effect.
      armsRef.current = [];
      botRef.current = null;
      head1Ref.current = null;
      if (restoreRaf) cancelAnimationFrame(restoreRaf);
      clearTimeout(refresh);
      if (removeMouse) removeMouse();
      heroVisibility.disconnect();
      if (lenis) lenis.off("scroll", onScroll);
      gsap.ticker.remove(applyGazeRef.current);
      ctx.revert();
    };
    // darkMode rebuilds the timeline: every tonal value above is baked into it
    // at construction, and the GSAP context below reverts cleanly on change.
  }, [isMobile, darkMode]);

  // The hero is a fixed cinematic: it opens on a light wall and drains into
  // darkness on its own schedule, identically in either page theme. The
  // data-theme="dark" below is what keeps that true — every token inside
  // resolves back to the value it had before the site became themeable
  // (ink/65 -> #A6A6A6 over black, ink/[0.13] -> #222, surface -> #000), so the
  // sequence is untouched while the page around it flips.
  return (
    <section
      id="hero"
      ref={sectionRef}
      data-testid="scene-section"
      data-theme="dark"
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-surface"
    >
      {/* Layer A — live dark scene + painted wordmark + silhouette occluder */}
      <div ref={splineLayerRef} className="absolute inset-0">
        <div
          ref={canvasWrapRef}
          data-testid="hero-canvas-zoom"
          className="absolute inset-0 will-change-transform"
        >
          {/* The wall sits OUTSIDE the drift wrappers on purpose. It used to
              live inside them, so the idle float and the mouse parallax moved
              the painted wordmark along with the robot and the whole backdrop
              swam. Only the canvas should drift.

              The blend stays on the OUTER canvas element, with the transforms
              nested inside it, because an element that GSAP gives a transform
              becomes a stacking context — putting the blend under the drift
              wrappers would isolate it from the wall and the occlusion that
              makes the robot read against the wordmark would vanish. */}
          <div ref={wallRef} className="absolute inset-0 bg-[#EDEDED]">
            <div
              ref={wm1Ref}
              data-testid="bg-wordmark"
              className="pointer-events-none absolute inset-x-0 top-[47%] hidden text-center sm:block"
            >
              <span className="wordmark-grad whitespace-nowrap font-display text-[clamp(2rem,11vw,22rem)] font-bold uppercase leading-none tracking-[-0.01em] opacity-50">
                {WORDMARK}
              </span>
            </div>
          </div>

          {!failed && (
            <div
              className="absolute inset-0"
              data-testid="spline-canvas-wrap"
            >
              <div ref={parallax1Ref} className="absolute inset-0">
                <div ref={idle1Ref} className="absolute inset-0">
                  <Spline
                    key={slot1Url}
                    scene={slot1Url}
                    onLoad={handleLoad}
                    onError={() => {
                      setFailed(true);
                      onReady?.();
                    }}
                  />
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

      {/* soft black overlay deepening with the drain (scene 1 only) */}
      <div ref={overlayRef} className="pointer-events-none absolute inset-0 bg-surface" />

      {/* Layer C — chrome scene, lazily mounted, rising out of darkness */}
      <div ref={layer2Ref} className="pointer-events-none absolute inset-0">
        <div ref={layer2InnerRef} className="absolute inset-0">
          {/* Same decoupling as scene 1: the glow and the fallback stay put
              while only the canvas drifts. The blend wrapper keeps its place
              inside layer2Inner (whose filter is the stacking context the
              blend resolves against), with the drift transforms nested inside
              it rather than wrapping the whole layer. */}
          <div className="absolute left-1/2 top-1/2 h-[90vh] w-[90vh] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgb(var(--ink) / 0.07),transparent_62%)]" />

          {/* fallback static render until/if the live scene fails */}
          {(!scene2Ready || scene2Failed) && (
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
            {mountScene2 && !scene2Failed && (
                <div className="absolute inset-0">
                <div ref={parallax2Ref} className="absolute inset-0">
                  <div ref={idle2Ref} className="absolute inset-0">
                   <div
                    className="absolute left-1/2 top-1/2"
                    style={
                      isMobile
                        ? { position: "absolute", inset: 0 }
                        : {
                            width: `${OVERSAMPLE * 100}%`,
                            height: `${OVERSAMPLE * 100}%`,
                            transform: `translate(-50%, -50%) scale(${1 / OVERSAMPLE})`,
                          }
                    }
                   >
                    <Spline
                      key={slot2Url}
                      scene={slot2Url}
                      onLoad={(app) => {
                        // kept: the directed gaze writes Head.rotation on it.
                        // Both scenes expose an identical rig (same 7 objects,
                        // Head in both), so the gaze ports across the swap.
                        app2Ref.current = app;
                        placeBot(app);
                        armsRef.current = collectArms(app);
                        botRef.current = findBot(app);
                        glCanvasRefs.current.slot2 = canvas2WrapRef.current
                          ? canvas2WrapRef.current.querySelector("canvas")
                          : null;
                        // Transparent here too: chapter 2's backdrop is the
                        // section's own colour, which already follows the
                        // theme, so the scene does not need to paint one.
                        try {
                          app.setBackgroundColor("rgba(0,0,0,0)");
                        } catch (e) {
                          /* older runtime without setBackgroundColor */
                        }
                        setScene2Ready(true);
                      }}
                      onError={() => setScene2Failed(true)}
                    />
                   </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* gentle edge vignette — faded in by the timeline, not on at load */}
      <div
        ref={vignetteRef}
        data-testid="hero-vignette"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(var(--vignette,0_0_0) / 0.55)_100%)]"
      />

      {/* Layer C2 — the kinetic headline lives OUTSIDE the z-indexed UI layer on
          purpose. Its mix-blend-difference must blend against the 3D scene below
          (letters go dark over the light wall, white over the robot), and any
          z-index on an ancestor would create a stacking context that isolates the
          blend and flattens the text to plain white. DOM order already paints it
          above the scenes. */}
      {/* Features header (phase 3). Lives OUTSIDE the z-10 UI layer for the same
          reason the kinetic headline does: mix-blend-difference has to blend
          against the scene below it, and any z-index on an ancestor makes a
          stacking context that isolates the blend and flattens the text to a
          flat colour. DOM order already paints it above the scenes.

          The blend is what makes it readable where it crosses the robot: the
          letters go white over the dark body and dark over the light ground,
          instead of matching whatever is behind them. The engraved shadow is
          dropped here — its offsets blend too and come out muddy. */}
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

      {/* kinetic headline (phase 1) — sits just above the nav dock, difference blend */}
      <div
        ref={headlineRef}
        className="pointer-events-none absolute inset-x-0 bottom-44 text-center mix-blend-difference sm:bottom-44"
      >
        <div className="overflow-hidden px-4">
          <motion.h1
            variants={lineReveal}
            custom={0}
            initial="hidden"
            animate={revealed ? "show" : "hidden"}
            data-testid="hero-headline-1"
            className="font-inter text-[clamp(1.4rem,3.3vw,3.1rem)] font-extralight uppercase leading-none tracking-[0.12em] text-ink sm:tracking-[0.3em]"
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
            className="font-inter text-[clamp(0.8rem,1.81vw,1.6rem)] font-extralight uppercase leading-none tracking-[0.2em] text-ink/40 sm:tracking-[0.42em]"
          >
            one system at a time
          </motion.p>
        </div>
      </div>

      {/* Brand and status sit OUTSIDE the z-10 UI layer. They carry
          mix-blend-difference, and a z-index on an ancestor makes a stacking
          context that isolates the blend — which is exactly why they used to
          render flat white and vanish against the light wall in white mode.
          Out here the blend resolves against the scene: |backdrop - white| is
          dark over the wall and white over the robot, so they read on both
          without a single per-theme conditional. */}
      <motion.div
        variants={uiFade} custom={0} initial="hidden"
        animate={revealed ? "show" : "hidden"}
        className="absolute left-6 top-6 sm:left-10 sm:top-8"
      >
        <span
          data-testid="hero-brand"
          className="font-orbitron text-xs font-bold tracking-[0.12em] text-white mix-blend-difference sm:text-sm sm:tracking-[0.3em]"
        >
          {profile.shortMark}
          <span className="hidden text-white/65 sm:inline"> {profile.markSuffix}</span>
        </span>
      </motion.div>

      <motion.div
        variants={uiFade} custom={1} initial="hidden"
        animate={revealed ? "show" : "hidden"}
        className="absolute right-6 top-6 sm:right-10 sm:top-8 flex items-center gap-2"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot" />
        <span data-testid="hero-status" className="font-display text-[13px] uppercase tracking-[0.02em] text-white/[0.83] mix-blend-difference">
          STATUS: {profile.status}
        </span>
      </motion.div>


      {/* Skip intro. Only before the sequence has been seen once — after
          that the dock owns this spot and the visitor already has every
          section a click away. Lands just past the pin rather than at a
          section id, so the marquee is not skipped along with the hero. */}
      {!journeyDone && (
        <button
          data-testid="skip-intro"
          onClick={() => {
            const y = heroEndRef.current || window.innerHeight * 10;
            if (window.__lenis) window.__lenis.scrollTo(y + 4, { duration: 1.1 });
            else window.scrollTo({ top: y + 4, behavior: "smooth" });
          }}
          className="pointer-events-auto absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2 px-4 py-2 font-display text-[11px] uppercase tracking-[0.24em] text-white/70 mix-blend-difference transition-opacity duration-300 hover:text-white sm:bottom-10"
        >
          Skip intro
        </button>
      )}

      {/* Scroll cue. The hero IS the scroll — a visitor who lands, clicks a
          project and leaves never sees either scene, so it has to say so. It
          fades on the first beat, once the message has landed. Difference
          blend for the same reason the headline uses one: it has to stay
          legible over the wall, over the robot and in both themes. */}
      <div
        ref={scrollCueRef}
        data-testid="scroll-cue"
        className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 mix-blend-difference sm:right-10 sm:top-auto sm:bottom-10 sm:translate-y-0 sm:gap-3"
      >
        <span className="font-display text-[9px] uppercase tracking-[0.28em] text-white/75 [writing-mode:vertical-rl] sm:text-[11px] sm:tracking-[0.34em]">
          Scroll
        </span>
        <span className="relative block h-7 w-px overflow-hidden bg-white/25 sm:h-12">
          <span className="absolute inset-x-0 top-0 block h-4 animate-scroll-cue bg-white" />
        </span>
      </div>

      {/* Layer D — UI. The z-10 is what keeps the cards and the rail from
          blending into the scene; the marks that DO need to blend (brand,
          status, headline, features header, scroll cue) live outside it. */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* top-right status */}
        {/* bottom-left pill buttons */}
        <motion.div
          variants={uiFade} custom={2} initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className="absolute bottom-24 left-6 sm:bottom-28 sm:left-10"
        >
          <div
            className={`hidden transition-opacity duration-700 sm:block ${
              journeyDone ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
          <div ref={pillsRef} className="pointer-events-auto flex flex-wrap gap-3">
            <button
              data-testid="hero-cta-projects"
              onClick={() => scrollToId("projects")}
              className="flex items-center gap-2 bg-ink px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.02em] text-surface transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_26px_rgb(var(--ink) / 0.4)]"
            >
              <FolderOpen size={13} />
              Projects
            </button>
            <button
              data-testid="hero-cta-contact"
              onClick={() => scrollToId("contact")}
              className="flex items-center gap-2 border border-ink/25 bg-surface/40 px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.02em] text-ink backdrop-blur-md transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-ink/60 hover:bg-ink/10"
            >
              <Send size={13} />
              Contact
            </button>
          </div>
          </div>
        </motion.div>

        {/* story paragraphs (phase 2) — beside the close-up robot, below it on mobile */}
        {/* At the story framing (scale 2.8) the head centres near 31% of the
            viewport; dead-centring this block left it a head below that. */}
        <div
          ref={storyPanelRef}
          data-theme={ch2Theme}
          className="absolute inset-x-5 bottom-28 cut-corner bg-surface/[0.70] p-5 backdrop-blur-md sm:inset-x-auto sm:bottom-auto sm:right-[6%] sm:top-[40%] sm:w-[24rem] sm:-translate-y-1/2 sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:right-[9%]"
        >
          {/* story heading — section-title type, sized so it never pushes the
              paragraphs out of the viewport */}
          <div ref={storyTitleRef} className="mb-6" data-testid="story-title">
            <h2 className="font-display text-xl font-light uppercase leading-tight tracking-[0.02em] text-ink sm:text-[1.75rem]">
              {storyTitle.name}
            </h2>
            <p className="mt-1.5 font-display text-[13px] uppercase tracking-[0.02em] text-ink/65">
              {storyTitle.role}
            </p>
          </div>
          {story.map((para, i) => (
            <p
              key={i}
              ref={(el) => (storyRefs.current[i] = el)}
              data-testid={`story-paragraph-${i + 1}`}
              className={`font-inter text-sm leading-relaxed text-ink/[0.83] sm:text-base ${
                i > 0 ? "mt-6" : ""
              }`}
            >
              {para}
            </p>
          ))}
        </div>

        {/* connector lines + dots (desktop) */}
        {!isMobile &&
          systemFeatures.map((f, i) => (
            <svg
              key={`line-${f.num}`}
              data-testid={`feature-line-${f.num}`}
              data-theme={ch2Theme}
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line
                ref={(el) => (lineRefs.current[i] = el)}
                x1={f.from.x}
                y1={f.from.y}
                x2={f.from.x}
                y2={f.from.y}
                stroke="rgb(var(--ink) / 0.45)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ))}
        {!isMobile &&
          systemFeatures.map((f, i) => (
            <span
              key={`dot-${f.num}`}
              ref={(el) => (dotRefs.current[i] = el)}
              style={{ left: `${f.to.x}%`, top: `${f.to.y}%` }}
              data-theme={ch2Theme}
              className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
            />
          ))}

        {/* callout cards */}
        {systemFeatures.map((f, i) => (
          <div
            key={f.num}
            ref={(el) => (calloutRefs.current[i] = el)}
            data-testid={`feature-callout-${f.num}`}
            data-theme={ch2Theme}
            style={isMobile ? { bottom: "6rem" } : { top: f.top }}
            className={`absolute ${
              isMobile
                ? "left-4 right-4 w-auto"
                : `w-[27rem] max-w-[46vw] ${f.side === "left" ? "left-[5%]" : "right-[5%]"}`
            }`}
          >
            <div className="corner-frame cut-corner relative border border-ink/[0.13] bg-surface/[0.70] p-6 pt-5 backdrop-blur-md sm:bg-surface/70 sm:p-9 sm:pt-6">
              <div className="select-none font-display text-[7rem] font-light leading-[0.85] text-outline-grey">
                {f.num}
              </div>
              <div className="mt-7 flex items-baseline gap-3">
                <span className="font-display text-[13px] uppercase tracking-[0.02em] text-ink/[0.83]">
                  {f.part}
                </span>
              </div>
              <h3 className="mt-2.5 font-display text-2xl font-light uppercase tracking-[0.01em] text-ink">
                {f.title}
              </h3>
              <p className="mt-4 font-inter text-[15px] leading-[1.65] text-ink/[0.83]">
                {f.text}
              </p>
            </div>
          </div>
        ))}

        {/* progress rail (desktop) */}
        {!isMobile && (
          <div
            data-testid="features-rail"
            data-theme={ch2Theme}
            className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 lg:right-10"
          >
            {systemFeatures.map((f, i) => (
              <div key={f.num} className="flex flex-col items-center gap-3">
                <span
                  ref={(el) => (railRefs.current[i] = el)}
                  className="font-display text-[13px] tracking-[0.02em] text-ink/65"
                >
                  {f.num}
                </span>
                {i < systemFeatures.length - 1 && <span className="h-6 w-px bg-ink/20" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loader — dark, thin line, slow fill */}
      <AnimatePresence>
        {!revealed && (
          <motion.div
            data-testid="hero-loader"
            exit={{ opacity: 0, transition: { duration: 0.9 } }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface"
          >
            <p className="font-display text-[13px] font-light uppercase tracking-[0.02em] text-ink/65">
              System boot
            </p>
            <div className="mt-6 h-px w-56 bg-ink/[0.13]">
              <motion.div
                className="h-px bg-ink/[0.83]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
              />
            </div>
            <p className="mt-4 font-display text-[13px] tracking-[0.02em] text-ink/65">
              {Math.round(progress)}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
