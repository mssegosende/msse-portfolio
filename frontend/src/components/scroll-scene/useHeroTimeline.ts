import { createRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "../../hooks/useLenis";
import { VIEW_CSS_SCALE, applyView } from "../../lib/spline/camera";
import { BOT_HOME, applyPose } from "../../lib/spline/rig";
import { noteRenderedFrame } from "../../lib/spline/quality";
import { isProjectsInView } from "../../lib/sceneFocus";
import type { SplineApp, ViewTransform } from "../../lib/spline/types";
import {
  hasThemeReloadPosition,
  pendingThemeReload,
  takeThemeReloadScrollY,
} from "../../lib/themeReload";
import {
  SCENE1,
  SCENE2,
  XFADE_AT,
  XFADE_DURATION,
  cardIndexAt,
  giantHeadFraming,
  cursorAttention,
  headLook,
  headSway,
  heroFraming,
  phoneApproachFrom,
  pinLength,
  snapStops,
  vwOf,
} from "./choreography";
import type { HeroSceneRefs } from "./useHeroScenes";

gsap.registerPlugin(ScrollTrigger);
// Without 3D the scene wrappers never mount, so part of the timeline has no target.
gsap.config({ nullTargetWarn: false });

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
    bg1Ref: createRef<HTMLDivElement>(),
    wordmarkRef: createRef<HTMLDivElement>(),
    topBarRef: createRef<HTMLDivElement>(),
    introRef: createRef<HTMLDivElement>(),
    checkRef: createRef<HTMLDivElement>(),
    scrollCueRef: createRef<HTMLDivElement>(),
    headlineRef: createRef<HTMLDivElement>(),
    skipRef: createRef<HTMLButtonElement>(),
    layer2Ref: createRef<HTMLDivElement>(),
    title2Ref: createRef<HTMLDivElement>(),
    // Scene 2's card stack (phones place it above the dock).
    cardsRef: createRef<HTMLDivElement>(),
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
 *
 * Scene 1: the robot near full width, its HUD steps (Ø1.1-Ø1.3), SCROLL.
 * Scene 2: the giant head (layer 2) under the CAPABILITIES title, one card per
 * step (Ø2.1-Ø2.3); after that the dock appears and the cards rotate.
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
  // Scene 2's card on screen (-1 before the first), and whether the pin is at its end.
  const [cardIndex, setCardIndex] = useState(-1);
  const cardIndexRef = useRef(-1);
  const [atEnd, setAtEnd] = useState(false);
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
  // Normalized cursor over the hero (-0.5..0.5), for the heads.
  const mouseNRef = useRef({ x: 0, y: 0 });
  // When the cursor last moved (performance.now()): scene 2's head follows it
  // for a while, then goes back to looking around.
  const mouseAtRef = useRef(-Infinity);
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
    // Phones frame against the section (the canvas), which is 100vh: on iOS the
    // large viewport, taller than innerHeight while the browser bars show.
    const viewport = {
      width: window.innerWidth || 2000,
      height: (isMobile ? sectionRef.current?.clientHeight : 0) || window.innerHeight || 900,
    };
    const vw = vwOf(viewport.width);
    const { startScale, startY, heroDx } = heroFraming(isMobile, reduce, viewport);
    const giant = giantHeadFraming(isMobile, viewport);
    const cardsEl = cardsRef.current;

    // Touch devices on the desktop layout (tablets) have no pointer, so the scroll
    // drives the parallax offsets instead.
    const touchParallax = (p: number) => {
      if (reduce || isMobile || !parallax1Ref.current) return;
      const sway = Math.sin(p * Math.PI * 2.2);
      const rise = Math.cos(p * Math.PI * 1.6);
      gsap.set(parallax1Ref.current, { x: sway * 14, y: rise * 9 });
      if (parallax2Ref.current) gsap.set(parallax2Ref.current, { x: sway * -16, y: rise * 10 });
    };

    // Mouse parallax on both scenes (set up outside gsap.context). The cursor also
    // turns the heads (applyHeadDesktop, headSway).
    let removeMouse: (() => void) | null = null;
    if (!reduce && !isMobile) {
      // quickTo throws on a missing target (the static fallback has no wrappers).
      const quick = (el: HTMLElement | null, prop: "x" | "y") =>
        el ? gsap.quickTo(el, prop, { duration: 0.9, ease: "power2.out" }) : () => {};
      const px1 = quick(parallax1Ref.current, "x");
      const py1 = quick(parallax1Ref.current, "y");
      const px2 = quick(parallax2Ref.current, "x");
      const py2 = quick(parallax2Ref.current, "y");
      const onMouse = (e: MouseEvent) => {
        const sec = sectionRef.current;
        if (!sec) return;
        const r = sec.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        px1(nx * 12);
        py1(ny * 8);
        px2(nx * -28);
        py2(ny * -16);
        mouseNRef.current = { x: nx, y: ny };
        mouseAtRef.current = performance.now();
      };
      sectionRef.current?.addEventListener("mousemove", onMouse);
      removeMouse = () => sectionRef.current?.removeEventListener("mousemove", onMouse);
    }

    // Desktop framing lives in these proxies and the cameras apply it (applyView).
    const heroView: ViewTransform = { scale: startScale, x: vw(heroDx), y: startY };
    const scene2View: ViewTransform = { scale: giant.scale, x: giant.x, y: giant.y };

    const ctx = gsap.context(() => {
      if (isMobile) {
        // Both scenes are framed by their cameras (applyView); the wrappers stay untransformed.
        gsap.set([canvasWrapRef.current, canvas2WrapRef.current], { clearProps: "transform" });
      } else {
        [canvasWrapRef.current, canvas2WrapRef.current].forEach((el) =>
          gsap.set(el, { scale: VIEW_CSS_SCALE, x: 0, y: 0, transformOrigin: "50% 50%" }),
        );
      }

      // Initial state. Colours come from page-theme CSS variables, so nothing here
      // depends on the theme.
      // Phones have no intro tile or SYSTEM CHECK: GSAP throws on a null inside an array.
      const hud1 = [
        introRef.current,
        checkRef.current,
        headlineRef.current,
        scrollCueRef.current,
      ].filter((el): el is HTMLDivElement => !!el);
      // Phones show their bottom stack (Ø1 / Ø5, headline, SCROLL) from the start;
      // desktop reveals each window on its own step.
      if (!isMobile) gsap.set(hud1, { autoAlpha: 0, y: 12 });
      if (isMobile) {
        [parallax1Ref.current, parallax2Ref.current, idle1Ref.current, idle2Ref.current].forEach(
          (el) => el && gsap.set(el, { x: 0, y: 0, rotation: 0, scale: 1 }),
        );
      }
      gsap.set(layer2Ref.current, { opacity: 0 });
      gsap.set(title2Ref.current, { autoAlpha: 0, y: 16 });
      gsap.set(cardsEl, { autoAlpha: 0 });

      // Idle motion, desktop only. Scene 1: a float and tilt in px inside the 1.3x
      // wrap, alive without reading as floating, on periods that don't divide each
      // other. Scene 2's is bigger: the giant head always moves.
      if (!reduce && !isMobile) {
        const loop = { yoyo: true, repeat: -1, ease: "sine.inOut" };
        if (idle1Ref.current) {
          const el = idle1Ref.current;
          gsap.set(el, { y: -1.2, rotation: -0.08 });
          gsap.to(el, { y: 1.2, duration: 5, ...loop });
          gsap.to(el, { rotation: 0.08, duration: 6.3, ...loop });
          gsap.fromTo(el, { x: -1.6 }, { x: 1.6, duration: 8.7, ...loop });
          gsap.fromTo(el, { scale: 0.9988 }, { scale: 1.0012, duration: 7.1, ...loop });
        }
        if (idle2Ref.current) {
          const el = idle2Ref.current;
          gsap.set(el, { x: -6, y: -8, rotation: -0.5 });
          gsap.to(el, { y: 6, duration: 4.1, ...loop });
          gsap.to(el, { x: 6, duration: 5.3, ...loop });
          gsap.to(el, { rotation: 0.5, duration: 6.7, ...loop });
        }
      }

      // Desktop layer 2 mounts currently loaded (both models).
      const l2Desktop = () =>
        Object.entries(l2Ref.current)
          .filter(([k]) => k.startsWith("d:"))
          .map(([, e]) => e);

      // ---- scene 2 head, eased: desktop looks around and follows the cursor
      // (headLook); phones sway (headSway). Still with reduced motion.
      const cur = { x: 0, y: 0 };
      let swayT = 0;
      // Real seconds, so the look-around keeps its pace on 120 Hz screens; a
      // hidden tab's long gap counts as one frame.
      let lastGaze = performance.now();
      const applyGaze = () => {
        const heads = isMobile
          ? [app2Ref.current?.findObjectByName("Head") ?? null]
          : l2Desktop().map((e) => e.head);
        const now = performance.now();
        const dt = (now - lastGaze) / 1000;
        lastGaze = now;
        if (!reduce) swayT += dt > 0.1 ? 1 / 60 : dt;
        const target = reduce
          ? { x: 0, y: 0 }
          : isMobile
            ? headSway(swayT, { x: 0, y: 0 })
            : headLook(swayT, mouseNRef.current, cursorAttention(now - mouseAtRef.current));
        cur.x += (target.x - cur.x) * 0.06;
        cur.y += (target.y - cur.y) * 0.06;
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
        ? { s: 1.2, x: BOT_HOME.x + (giant.rx ?? 0), y: -83.56 }
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

      // Phones: the scroll settles on the hero, on each card, or on the end, and
      // one gesture moves one stop from where the last snap settled, whatever its
      // length. ScrollTrigger can ask again mid-snap, so the settled stop only
      // changes when a snap completes. A position far from it (a jump: the footer
      // logo, a restore) takes the next stop in the scroll's direction.
      const STOPS = snapStops();
      let settled = 0;
      const nearestStop = (value: number) =>
        STOPS.reduce(
          (best, s, i) => (Math.abs(s - value) < Math.abs((STOPS[best] ?? 0) - value) ? i : best),
          0,
        );
      const stepSnap = (value: number, self?: ScrollTrigger): number => {
        // Already on a stop (a snap that just landed asks again): stay.
        const near = nearestStop(value);
        if (Math.abs((STOPS[near] ?? 0) - value) < 0.004) return STOPS[near] ?? value;
        const down = (self?.direction ?? 1) > 0;
        let ahead = down
          ? STOPS.findIndex((s) => s > value + 0.002)
          : STOPS.findLastIndex((s) => s < value - 0.002);
        if (ahead < 0) ahead = nearestStop(value);
        const target =
          Math.abs(ahead - settled) > 2
            ? ahead
            : Math.min(settled + 1, Math.max(settled - 1, ahead));
        return STOPS[target] ?? value;
      };

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
        if (isMobile) {
          applyView(app1Ref.current, heroView, 1);
          applyView(app2Ref.current, scene2View, 1);
        } else {
          applyView(app1Ref.current, heroView);
          applyView(appAltRef.current, heroView);
          l2Desktop().forEach((e) => applyView(e.app, scene2View));
        }
      };
      applyGazeRef.current = applyGazeAndPose;
      gsap.ticker.add(applyGazeAndPose);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        // The card on screen follows the scrubbed time.
        onUpdate: () => {
          // SKIP INTRO turns dark over scene 2's light ground (scene 1 keeps it light).
          if (skipRef.current) skipRef.current.dataset.scene = tl.time() >= XFADE_AT ? "2" : "1";
          const idx = cardIndexAt(tl.time());
          if (idx !== cardIndexRef.current) {
            cardIndexRef.current = idx;
            setCardIndex(idx);
          }
        },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: pinLength(isMobile),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          // Phones: one card per gesture (stepSnap). Off with reduced motion.
          snap:
            isMobile && !reduce
              ? {
                  snapTo: stepSnap,
                  // The real position, not one projected from the velocity: a
                  // quick short gesture must not read as a jump.
                  inertia: false,
                  onComplete: (self: ScrollTrigger) => {
                    settled = nearestStop(self.progress);
                  },
                  delay: 0.05,
                  duration: { min: 0.25, max: 0.7 },
                  ease: "power1.inOut",
                }
              : undefined,
          onUpdate: (self) => {
            const p = self.progress;
            if (isTouchDevice && !isMobile) touchParallax(p);
            setAtEnd(p > 0.985);
            // Latches once: the dock stays even if the visitor scrolls back up.
            if (p > 0.985 && !journeyRef.current) {
              journeyRef.current = true;
              setJourneyDone(true);
              onJourneyEndRef.current?.();
            }
          },
        },
      });

      // ---- scene 1: each HUD window on its own step, then SCROLL; it holds ------
      const rise = { autoAlpha: 1, y: 0, duration: 0.06, ease: "power1.out" };
      if (!isMobile) {
        tl.to(introRef.current, rise, SCENE1.video);
        tl.to(checkRef.current, rise, SCENE1.check);
        tl.to(headlineRef.current, rise, SCENE1.headline);
        tl.to(scrollCueRef.current, rise, SCENE1.scroll);
      }

      // ---- scene 1 -> 2: the HUD, MSSE:// and STATUS leave; the grounds and the
      // robots crossfade while the giant head comes in -----------------------------
      tl.to(
        [...hud1, topBarRef.current, wordmarkRef.current].filter(Boolean),
        { autoAlpha: 0, duration: 0.06 },
        XFADE_AT,
      );
      tl.to(bg1Ref.current, { opacity: 0, duration: XFADE_DURATION }, XFADE_AT);
      tl.to(splineLayerRef.current, { opacity: 0, duration: XFADE_DURATION }, XFADE_AT);
      tl.to(layer2Ref.current, { opacity: 1, duration: XFADE_DURATION }, XFADE_AT);
      if (isMobile && !reduce) {
        // Phones: the robot approaches from further back and to the side.
        const from = phoneApproachFrom(giant, viewport);
        tl.fromTo(
          scene2View,
          { scale: from.scale, x: from.x, y: from.y },
          {
            scale: giant.scale,
            x: giant.x,
            y: giant.y,
            duration: (SCENE2.cards[0] ?? 1) - XFADE_AT,
            ease: "power2.out",
            immediateRender: false,
          },
          XFADE_AT,
        );
      }
      if (!isMobile && !reduce) {
        tl.fromTo(
          scene2View,
          { scale: giant.scale * 0.88 },
          {
            scale: giant.scale,
            duration: XFADE_DURATION + 0.1,
            ease: "power2.out",
            immediateRender: false,
          },
          XFADE_AT,
        );
      }
      tl.to(
        title2Ref.current,
        { autoAlpha: 1, y: 0, duration: 0.08, ease: "power1.out" },
        SCENE2.title,
      );

      // ---- scene 2: the cards; which one shows comes from onUpdate --------------
      const firstCard = SCENE2.cards[0] ?? 1;
      tl.to(cardsEl, { autoAlpha: 1, duration: 0.02 }, firstCard - 0.02);
      // Phones: SKIP INTRO shares the card's spot, so it leaves when the cards come.
      if (isMobile && skipRef.current) {
        tl.to(skipRef.current, { autoAlpha: 0, duration: 0.04 }, firstCard - 0.05);
      }
      // Hold, so the last card reads before the pin releases.
      tl.to({}, { duration: Math.max(0.01, SCENE2.end - tl.duration()) });

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
        // Scene 3 in view: its clips get the frames, every scene idles.
        const visible = heroVisibleRef.current && !isProjectsInView();
        const hero = visible && Math.min(shown, scrolled) < XFADE_AT + XFADE_DURATION;
        const layer2 = visible && Math.max(shown, scrolled) > XFADE_AT * 0.9;
        setRunning(app1Ref.current, hero && !showAltRef.current);
        setRunning(appAltRef.current, hero && showAltRef.current);
        setRunning(app2Ref.current, layer2);
        Object.entries(l2Ref.current).forEach(([key, entry]) => {
          if (key.startsWith("d:"))
            setRunning(entry.app, layer2 && key === "d:" + l2VisibleRef.current);
        });
        if ((hero || layer2) && scenesLoadedRef.current) noteRenderedFrame();
      };

      if (tl.scrollTrigger) heroEndRef.current = tl.scrollTrigger.end;
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
      heroVisibility.disconnect();
      if (lenis) lenis.off("scroll", onScroll);
      if (applyGazeRef.current) gsap.ticker.remove(applyGazeRef.current);
      ctx.revert();
    };
    // Depends on sceneUrl, not darkMode: a theme change rebuilds nothing. els and
    // scenes are stable objects.
  }, [isMobile, sceneUrl, els, scenes]);

  // Lands just past the pin, at the top of the projects.
  const skipIntro = () => {
    const y = heroEndRef.current || window.innerHeight * 7;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y + 4, { duration: 1.1 });
    else window.scrollTo({ top: y + 4, behavior: "smooth" });
  };

  return { journeyDone, skipIntro, cardIndex, atEnd };
};
