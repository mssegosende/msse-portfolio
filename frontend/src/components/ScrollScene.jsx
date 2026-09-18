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
  systemFeatures,
} from "../data/portfolioData";
import { scrollToId } from "../hooks/useLenis";

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

const WORDMARK = "MSGCENGINEER";

// Where each callout lands. The gaze turns toward these in order, so the
// positions and the head poses in GAZE must stay in sync.
// No translate utilities here: GSAP animates `y` on these nodes and would
// wipe a Tailwind transform, so card 03 centres with mx-auto instead.

export const ScrollScene = ({ onReady }) => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mountScene2, setMountScene2] = useState(false);
  const [scene2Ready, setScene2Ready] = useState(false);
  const [scene2Failed, setScene2Failed] = useState(false);
  const readyRef = useRef(false);
  const mount2Ref = useRef(false);
  const stopped1Ref = useRef(false);
  const app1Ref = useRef(null);
  const app2Ref = useRef(null);
  const lastMouseRef = useRef(0);
  const mouseGazeRef = useRef({ x: 0, y: 0 });
  const applyGazeRef = useRef(null);

  const sectionRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const canvas2WrapRef = useRef(null);
  const parallax1Ref = useRef(null);
  const parallax2Ref = useRef(null);
  const idle1Ref = useRef(null);
  const idle2Ref = useRef(null);
  const splineLayerRef = useRef(null);
  const overlayRef = useRef(null);
  const wm1Ref = useRef(null);
  const wm2Ref = useRef(null);
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

  const [isMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

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

  // TEMP PROBE — dumps what the scene 2 runtime exposes, to find a Look At target
  const probeScene2 = (app) => {
    const P = "SPLINE2::";
    window.__spline2 = app; // TEMP: para la prueba de rotacion
    try {
      const objs = typeof app.getAllObjects === "function" ? app.getAllObjects() : null;
      console.log(`${P}api`, JSON.stringify({
        getAllObjects: typeof app.getAllObjects,
        findObjectByName: typeof app.findObjectByName,
        findObjectById: typeof app.findObjectById,
        setVariable: typeof app.setVariable,
        getVariable: typeof app.getVariable,
        getVariables: typeof app.getVariables,
        emitEvent: typeof app.emitEvent,
        getSplineEvents: typeof app.getSplineEvents,
        objectCount: objs ? objs.length : null,
      }));
      if (objs) {
        objs.forEach((o, i) => {
          const pos = o.position ? `${o.position.x?.toFixed(1)},${o.position.y?.toFixed(1)},${o.position.z?.toFixed(1)}` : "-";
          console.log(`${P}obj ${i} name="${o.name}" type=${o.type || "?"} pos=[${pos}] visible=${o.visible}`);
        });
      }
      if (typeof app.getVariables === "function")
        console.log(`${P}vars`, JSON.stringify(app.getVariables()));
      if (typeof app.getSplineEvents === "function")
        console.log(`${P}events`, JSON.stringify(Object.keys(app.getSplineEvents() || {})));
    } catch (e) {
      console.log(`${P}error`, String(e));
    }
  };

  const handleLoad = (app) => {
    app1Ref.current = app;
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

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // middle ground: camera closer, robot vertically centered, little air above the head
    const startScale = reduce ? 1 : isMobile ? 1.3 : 1.45;
    const startY = reduce ? "4%" : isMobile ? "7%" : "10%";
    const endY = reduce ? "5%" : isMobile ? "8.5%" : "11.5%";
    // phase 2 (story): extreme close-up — head + upper chest fill the frame;
    // mobile sits higher/smaller so the story paragraphs fit below the head
    // STEP 1 (story) — the closest framing of the whole sequence: head fills the
    // upper frame, neck and shoulder tops visible, cut at the upper torso.
    // Calibrated against the reference screenshot at 2000x1014.
    const c2close = isMobile
      ? { scale: 1.5, x: "-48%", y: "14%" }
      : { scale: 2.1, x: "-16%", y: "26%" };
    // STEP 4 (cards) — the farthest framing, centred
    const c2far = isMobile
      ? { scale: 1.05, x: "-48%", y: "10%" }
      : { scale: 1.2, x: "0%", y: "-3.5%" };
    // STEP 2 — swings to the opposite side and pulls back
    const c2s2 = isMobile
      ? { scale: 1.3, x: "-48%", y: "12%" }
      : { scale: 1.6, x: "16%", y: "14%" };
    // STEP 3 — grows slightly again and re-centres
    const c2s3 = isMobile
      ? { scale: 1.4, x: "-48%", y: "11%" }
      : { scale: 1.75, x: "0%", y: "8%" };
    const BODY_STEPS = [c2close, c2s2, c2s3, c2far];

    // gaze poses, radians, capped at ±0.35. three.js convention:
    // +y turns the face to the viewer's right, +x tips it down.
    const GAZE = {
      text: { x: 0.0, y: 0.32 },   // step 1: at the story block on the right
      upLeft: { x: -0.22, y: -0.26 },  // step 2: card 01, top-left
      downRight: { x: 0.22, y: 0.26 }, // step 3: card 02, bottom-right
      downCenter: { x: 0.3, y: 0.0 },  // step 4: card 03, bottom-centre
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
        y: startY,
        transformOrigin: "50% 50%",
      });
      gsap.set(canvas2WrapRef.current, { ...c2close, transformOrigin: "50% 50%" });
      gsap.set(layer2Ref.current, { opacity: 0 });
      gsap.set(layer2InnerRef.current, { filter: "brightness(0.25)" });
      gsap.set(featuresHeaderRef.current, { opacity: 0, y: 24 });
      gsap.set(overlayRef.current, { opacity: 0 });
      storyRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0, y: 28 }));
      calloutRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0, y: 36 }));
      lineRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0 }));
      dotRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0 }));

      // continuous idle motion: slow float (~6s loop) + subtle tilt, both scenes
      if (!reduce) {
        [idle1Ref.current, idle2Ref.current].forEach((el) => {
          if (!el) return;
          gsap.set(el, { y: -3, rotation: -0.2 });
          gsap.to(el, { y: 3, duration: 5, yoyo: true, repeat: -1, ease: "sine.inOut" });
          gsap.to(el, { rotation: 0.2, duration: 6.3, yoyo: true, repeat: -1, ease: "sine.inOut" });
        });
      }

      // tonal drain proxy: light drains out of scene 1, no shapes
      const drain = { b: 1, c: 1 };
      const applyDrain = () => {
        canvasWrapRef.current.style.filter = `brightness(${drain.b}) contrast(${drain.c})`;
      };
      applyDrain();
      const lift = { b: 0.25 };
      const applyLift = () => {
        layer2InnerRef.current.style.filter = `brightness(${lift.b})`;
      };

      // ---- phase 3 rig ------------------------------------------------------
      // `body.t` walks 0..3 across the four framings; anchors are re-projected
      // against whatever scale/offset that lands on, never against the final one.
      const lerp = (a, b, t) => a + (b - a) * t;

      // Anchors in the robot's OWN space (percent of the untransformed layer),
      // derived once from the framing the original `to` points were authored at
      // (scale 1.2, x -10%, y -3.5%). Chosen high on the body on purpose: the
      // hands sit at py 83, which projects below the viewport at the closer
      // steps, so a connector to them would point off-screen.
      const anchors = [
        { px: 58.33, py: 42.9 },  // 01 — visor / head
        { px: 58.33, py: 62.0 },  // 02 — upper chest
        { px: 58.33, py: 75.4 },  // 03 — torso
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
      const applyGaze = () => {
        const head = app2Ref.current && app2Ref.current.findObjectByName
          ? app2Ref.current.findObjectByName("Head")
          : null;
        if (!head) return;
        const fresh = Date.now() - lastMouseRef.current < 1200;
        const tx = fresh ? mouseGazeRef.current.x : gaze.x;
        const ty = fresh ? mouseGazeRef.current.y : gaze.y;
        cur.x += (tx - cur.x) * 0.08;
        cur.y += (ty - cur.y) * 0.08;
        head.rotation.x = cur.x;
        head.rotation.y = cur.y;
      };
      applyGazeRef.current = applyGaze;
      gsap.ticker.add(applyGaze);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        // keeps dots/lines glued to the robot while it is still moving
        onUpdate: applyPull,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=620%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            if (p > 0.15 && !mount2Ref.current) {
              mount2Ref.current = true;
              setMountScene2(true);
            }
            if (p > 0.45 && !stopped1Ref.current) {
              stopped1Ref.current = true;
              try { app1Ref.current?.stop(); } catch (e) { /* runtime without stop() */ }
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
      tl.fromTo(wm2Ref.current, { y: 30 }, { y: -30, duration: 0.6 }, 0.5);

      // PHASE 1 exit: headline leaves, light drains to black, slight drift-in
      tl.to(headlineRef.current, { opacity: 0, y: -140, duration: 0.1 }, 0.06);
      tl.to(drain, { b: 0.02, c: 1.15, duration: 0.3, onUpdate: applyDrain }, 0.1);
      tl.to(overlayRef.current, { opacity: 0.35, duration: 0.3 }, 0.1);
      tl.to(
        canvasWrapRef.current,
        { scale: startScale * 0.96, y: endY, duration: 0.32, ease: "power1.inOut" },
        0.1
      );
      tl.to(pillsRef.current, { opacity: 0, y: 24, duration: 0.08 }, 0.2);

      // PHASE 2: crossfade in darkness — chrome robot rises in EXTREME CLOSE-UP
      tl.to(splineLayerRef.current, { opacity: 0, duration: 0.12 }, 0.5);
      tl.to(layer2Ref.current, { opacity: 1, duration: 0.12 }, 0.5);
      tl.to(lift, { b: 1, duration: 0.16, onUpdate: applyLift }, 0.5);

      // story paragraphs fade in one after another during the close-up hold
      // (long scroll lock: only the tiny idle breathing moves the robot here)
      if (storyRefs.current[0])
        tl.to(storyRefs.current[0], { opacity: 1, y: 0, duration: 0.07, ease: "power1.out" }, 0.62);
      if (storyRefs.current[1])
        tl.to(storyRefs.current[1], { opacity: 1, y: 0, duration: 0.07, ease: "power1.out" }, 0.78);

      // PHASE 3 — four steps, then a closing beat. The head ALWAYS turns first
      // and the card lands where it is looking; only one card/line is on screen
      // at a time until the closing beat shows all three together.
      const storyEls = storyRefs.current.filter(Boolean);

      // STEP 1: the head holds on the story block at the right for the whole
      // close-up. Set as scene 2 fades in, well before the first body move.
      tl.to(gaze, { ...GAZE.text, duration: 0.05, ease: "power2.out" }, 0.52);

      // STEP 1 -> 2: swings to the opposite side, pulls back. Gaze: up-left.
      tl.to(gaze, { ...GAZE.upLeft, duration: 0.06, ease: "power2.inOut" }, 1.00);
      if (storyEls.length)
        tl.to(storyEls, { opacity: 0, y: -24, duration: 0.06, ease: "power1.in" }, 1.00);
      tl.to(body, { t: 1, duration: 0.14, ease: "power1.inOut" }, 1.04);
      tl.to(featuresHeaderRef.current, { opacity: 1, y: 0, duration: 0.06 }, 1.06);
      tl.to(calloutRefs.current[0], { opacity: 1, y: 0, duration: 0.06, ease: "power1.out" }, 1.12);
      tl.set(lineRefs.current[0], { opacity: 1 }, 1.12);
      tl.to(draw[0], { p: 1, duration: 0.07, ease: "power1.inOut" }, 1.12);
      tl.to(dotRefs.current[0], { opacity: 1, duration: 0.03 }, 1.19);
      tl.to(railRefs.current[0], { color: "#FFFFFF", duration: 0.03 }, 1.12);

      // STEP 2 -> 3: grows slightly, re-centres. Gaze: down-right.
      tl.to(gaze, { ...GAZE.downRight, duration: 0.06, ease: "power2.inOut" }, 1.24);
      tl.to(body, { t: 2, duration: 0.14, ease: "power1.inOut" }, 1.28);
      // card 01 and its line are erased with the same animation, reversed
      tl.to(dotRefs.current[0], { opacity: 0, duration: 0.02 }, 1.26);
      tl.to(draw[0], { p: 0, duration: 0.06, ease: "power1.inOut" }, 1.26);
      tl.to(calloutRefs.current[0], { opacity: 0, y: -20, duration: 0.05 }, 1.28);
      tl.set(lineRefs.current[0], { opacity: 0 }, 1.33);
      tl.to(calloutRefs.current[1], { opacity: 1, y: 0, duration: 0.06, ease: "power1.out" }, 1.36);
      tl.set(lineRefs.current[1], { opacity: 1 }, 1.36);
      tl.to(draw[1], { p: 1, duration: 0.07, ease: "power1.inOut" }, 1.36);
      tl.to(dotRefs.current[1], { opacity: 1, duration: 0.03 }, 1.43);
      tl.to(railRefs.current[1], { color: "#FFFFFF", duration: 0.03 }, 1.36);

      // STEP 3 -> 4: lands on c2far, the farthest framing. Gaze: down-centre,
      // the last head move of the sequence.
      tl.to(gaze, { ...GAZE.downCenter, duration: 0.06, ease: "power2.inOut" }, 1.48);
      tl.to(body, { t: 3, duration: 0.14, ease: "power1.inOut" }, 1.52);
      tl.to(dotRefs.current[1], { opacity: 0, duration: 0.02 }, 1.50);
      tl.to(draw[1], { p: 0, duration: 0.06, ease: "power1.inOut" }, 1.50);
      tl.to(calloutRefs.current[1], { opacity: 0, y: -20, duration: 0.05 }, 1.52);
      tl.set(lineRefs.current[1], { opacity: 0 }, 1.57);
      tl.to(calloutRefs.current[2], { opacity: 1, y: 0, duration: 0.06, ease: "power1.out" }, 1.60);
      tl.set(lineRefs.current[2], { opacity: 1 }, 1.60);
      tl.to(draw[2], { p: 1, duration: 0.07, ease: "power1.inOut" }, 1.60);
      tl.to(dotRefs.current[2], { opacity: 1, duration: 0.03 }, 1.67);
      tl.to(railRefs.current[2], { color: "#FFFFFF", duration: 0.03 }, 1.60);

      // CLOSING: gaze returns to the right, then all three cards and all three
      // dashed connectors come in together and stay for the hold.
      tl.to(gaze, { ...GAZE.text, duration: 0.07, ease: "power2.inOut" }, 1.74);
      [0, 1].forEach((i) => {
        tl.to(calloutRefs.current[i], { opacity: 1, y: 0, duration: 0.06, ease: "power1.out" }, 1.82);
        tl.set(lineRefs.current[i], { opacity: 1 }, 1.82);
        tl.to(draw[i], { p: 1, duration: 0.07, ease: "power1.inOut" }, 1.82);
        tl.to(dotRefs.current[i], { opacity: 1, duration: 0.03 }, 1.89);
        tl.to(railRefs.current[i], { color: "#FFFFFF", duration: 0.03 }, 1.82);
      });

      // hold: extra scroll distance with the three cards up before release
      tl.to({}, { duration: 0.3 });

      // first projection, so nothing is stale before the first scroll tick
      applyPull();
    }, sectionRef);

    const lenis = window.__lenis;
    const onScroll = () => ScrollTrigger.update();
    if (lenis) lenis.on("scroll", onScroll);
    const refresh = setTimeout(() => ScrollTrigger.refresh(), 900);

    return () => {
      clearTimeout(refresh);
      if (removeMouse) removeMouse();
      if (lenis) lenis.off("scroll", onScroll);
      gsap.ticker.remove(applyGazeRef.current);
      ctx.revert();
    };
  }, [isMobile]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      data-testid="scene-section"
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-black"
    >
      {/* Layer A — live dark scene + painted wordmark + silhouette occluder */}
      <div ref={splineLayerRef} className="absolute inset-0">
        <div
          ref={canvasWrapRef}
          data-testid="hero-canvas-zoom"
          className="absolute inset-0 will-change-transform"
        >
          <div ref={parallax1Ref} className="absolute inset-0">
            <div ref={idle1Ref} className="absolute inset-0">
              {/* the wall — MSSGOSENDE painted on it; multiply canvas occludes it */}
              <div className="absolute inset-0 bg-[#EDEDED]">
                <div
                  ref={wm1Ref}
                  data-testid="bg-wordmark"
                  className="pointer-events-none absolute inset-x-0 top-[47%] text-center"
                >
                  <span className="whitespace-nowrap font-display text-[clamp(2rem,11vw,22rem)] font-bold uppercase leading-none tracking-[-0.01em] text-white opacity-[0.35] mix-blend-difference">
                    {WORDMARK}
                  </span>
                </div>
              </div>

              {!failed && (
                <div
                  className="absolute inset-0 mix-blend-multiply"
                  data-testid="spline-canvas-wrap"
                >
                  <Spline
                    scene={SPLINE_SCENE_URL}
                    onLoad={handleLoad}
                    onError={() => {
                      setFailed(true);
                      onReady?.();
                    }}
                  />
                </div>
              )}
              {failed && (
                <div className="absolute inset-0" data-testid="hero-fallback">
                  <div className="absolute inset-0 bg-[#050505]" />
                  <div className="absolute inset-0 bg-grid opacity-50" />
                  <div className="absolute inset-0 scanline-overlay" />
                  <div
                    data-testid="hero-fallback-badge"
                    className="absolute right-6 top-24 border border-[#222] bg-black/60 px-4 py-2 font-display text-[13px] uppercase tracking-[0.02em] text-[#A6A6A6] backdrop-blur-md"
                  >
                    3D OFFLINE // STATIC RENDER
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* soft black overlay deepening with the drain (scene 1 only) */}
      <div ref={overlayRef} className="pointer-events-none absolute inset-0 bg-black" />

      {/* Layer C — chrome scene, lazily mounted, rising out of darkness */}
      <div ref={layer2Ref} className="pointer-events-none absolute inset-0">
        <div ref={parallax2Ref} className="absolute inset-0">
          <div ref={idle2Ref} className="absolute inset-0">
            <div ref={layer2InnerRef} className="absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-[90vh] w-[90vh] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_62%)]" />

              {/* wordmark behind the canvas — screen blend gives real occlusion */}
              <div
                ref={wm2Ref}
                data-testid="bg-wordmark-2"
                className="pointer-events-none absolute inset-x-0 top-[34%] text-center sm:top-[76%]"
              >
                <span className="whitespace-nowrap font-display text-[clamp(2rem,11vw,22rem)] font-bold uppercase leading-none tracking-[-0.01em] text-[#1E1E1E]">
                  {WORDMARK}
                </span>
              </div>

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
                  <div className="absolute inset-0 mix-blend-screen">
                    <Spline
                      scene={SPLINE_SCENE_2_URL}
                      onLoad={(app) => {
                        app2Ref.current = app;
                        probeScene2(app);
                        setScene2Ready(true);
                      }}
                      onError={() => setScene2Failed(true)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* gentle edge vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />

      {/* Layer C2 — the kinetic headline lives OUTSIDE the z-indexed UI layer on
          purpose. Its mix-blend-difference must blend against the 3D scene below
          (letters go dark over the light wall, white over the robot), and any
          z-index on an ancestor would create a stacking context that isolates the
          blend and flattens the text to plain white. DOM order already paints it
          above the scenes. */}
      {/* kinetic headline (phase 1) — sits just above the nav dock, difference blend */}
      <div
        ref={headlineRef}
        className="pointer-events-none absolute inset-x-0 bottom-40 text-center mix-blend-difference sm:bottom-24"
      >
        <div className="overflow-hidden px-4">
          <motion.h1
            variants={lineReveal}
            custom={0}
            initial="hidden"
            animate={revealed ? "show" : "hidden"}
            data-testid="hero-headline-1"
            className="font-inter text-[clamp(1.2rem,4.1vw,3.9rem)] font-extralight uppercase leading-none tracking-[0.3em] text-white"
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
            className="font-inter text-[clamp(0.7rem,2.25vw,2rem)] font-extralight uppercase leading-none tracking-[0.42em] text-white/40"
          >
            one system at a time
          </motion.p>
        </div>
      </div>

      {/* Layer D — UI. Keeps z-10: these marks must NOT invert against the
          scene, or the brand, status and rail numbers wash out on the light wall. */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* top-left brand */}
        <motion.div
          variants={uiFade} custom={0} initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className="absolute left-6 top-6 sm:left-10 sm:top-8"
        >
          <span data-testid="hero-brand" className="font-orbitron text-sm font-bold tracking-[0.3em] text-white mix-blend-difference">
            {profile.shortMark}
            <span className="text-[#A6A6A6]">AI</span>
          </span>
        </motion.div>

        {/* top-right status */}
        <motion.div
          variants={uiFade} custom={1} initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className="absolute right-6 top-6 sm:right-10 sm:top-8 flex items-center gap-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot" />
          <span data-testid="hero-status" className="font-display text-[13px] uppercase tracking-[0.02em] text-[#D3D3D3] mix-blend-difference">
            STATUS: {profile.status}
          </span>
        </motion.div>

        {/* bottom-left pill buttons */}
        <motion.div
          variants={uiFade} custom={2} initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className="absolute bottom-24 left-6 sm:bottom-28 sm:left-10"
        >
          <div ref={pillsRef} className="pointer-events-auto flex flex-wrap gap-3">
            <button
              data-testid="hero-cta-projects"
              onClick={() => scrollToId("projects")}
              className="flex items-center gap-2 bg-white px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.02em] text-black transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_26px_rgba(255,255,255,0.4)]"
            >
              <FolderOpen size={13} />
              Projects
            </button>
            <button
              data-testid="hero-cta-contact"
              onClick={() => scrollToId("contact")}
              className="flex items-center gap-2 border border-white/25 bg-black/40 px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.02em] text-white backdrop-blur-md transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
            >
              <Send size={13} />
              Contact
            </button>
          </div>
        </motion.div>

        {/* story paragraphs (phase 2) — beside the close-up robot, below it on mobile */}
        <div className="absolute inset-x-5 bottom-28 sm:inset-x-auto sm:bottom-auto sm:right-[6%] sm:top-1/2 sm:w-[24rem] sm:-translate-y-1/2 lg:right-[9%]">
          {story.map((para, i) => (
            <p
              key={i}
              ref={(el) => (storyRefs.current[i] = el)}
              data-testid={`story-paragraph-${i + 1}`}
              className={`font-inter text-sm leading-relaxed text-[#D3D3D3] sm:text-base ${
                i > 0 ? "mt-6" : ""
              }`}
            >
              {para}
            </p>
          ))}
        </div>

        {/* features header (phase 3) */}
        <div
          ref={featuresHeaderRef}
          className="pointer-events-none absolute inset-x-0 top-8 text-center sm:top-12"
        >
          <p className="font-display text-[13px] uppercase tracking-[0.02em] text-[#D3D3D3]">
            01 // system features
          </p>
          <h2
            data-testid="features-headline"
            className="text-engraved mt-4 font-display text-3xl font-light uppercase text-white sm:text-5xl"
          >
            System Features
          </h2>
          <p className="mt-3 font-display text-[13px] uppercase tracking-[0.02em] text-[#A6A6A6]">
            based on the msg·01 core
          </p>
        </div>

        {/* connector lines + dots (desktop) */}
        {!isMobile &&
          systemFeatures.map((f, i) => (
            <svg
              key={`line-${f.num}`}
              data-testid={`feature-line-${f.num}`}
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
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1"
                strokeDasharray="5 7"
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
              className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            />
          ))}

        {/* callout cards */}
        {systemFeatures.map((f, i) => (
          <div
            key={f.num}
            ref={(el) => (calloutRefs.current[i] = el)}
            data-testid={`feature-callout-${f.num}`}
            style={isMobile ? { bottom: "6rem" } : { top: f.top }}
            className={`absolute ${
              isMobile
                ? "left-4 right-4 w-auto"
                : `w-72 max-w-[42vw] ${f.side === "left" ? "left-[5%]" : "right-[5%]"}`
            }`}
          >
            <div className="corner-frame cut-corner relative border border-[#222] bg-black/70 p-6 pt-3 backdrop-blur-md">
              <div className="select-none font-display text-7xl font-light leading-none text-outline-grey">
                {f.num}
              </div>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-display text-[13px] uppercase tracking-[0.02em] text-[#D3D3D3]">
                  {f.part}
                </span>
              </div>
              <h3 className="mt-2 font-display text-xl font-light uppercase text-white">
                {f.title}
              </h3>
              <p className="mt-3 font-inter text-sm leading-relaxed text-[#D3D3D3]">
                {f.text}
              </p>
            </div>
          </div>
        ))}

        {/* progress rail (desktop) */}
        {!isMobile && (
          <div
            data-testid="features-rail"
            className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 lg:right-10"
          >
            {systemFeatures.map((f, i) => (
              <div key={f.num} className="flex flex-col items-center gap-3">
                <span
                  ref={(el) => (railRefs.current[i] = el)}
                  className="font-display text-[13px] tracking-[0.02em] text-[#A6A6A6]"
                >
                  {f.num}
                </span>
                {i < systemFeatures.length - 1 && <span className="h-6 w-px bg-[#333]" />}
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
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black"
          >
            <p className="font-display text-[13px] font-light uppercase tracking-[0.02em] text-[#A6A6A6]">
              System boot
            </p>
            <div className="mt-6 h-px w-56 bg-[#222]">
              <motion.div
                className="h-px bg-[#D3D3D3]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
              />
            </div>
            <p className="mt-4 font-display text-[13px] tracking-[0.02em] text-[#A6A6A6]">
              {Math.round(progress)}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
