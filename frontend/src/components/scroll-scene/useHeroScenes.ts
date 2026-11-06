import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { SPLINE_SCENE_URL, SPLINE_SCENE_2_URL } from "../../data/portfolioData";
import { CAM_FINAL, HERO_CAM_DESKTOP, HERO_CAM_MOBILE, pinCamera } from "../../lib/spline/camera";
import { collectArms, findBot, placeBot } from "../../lib/spline/rig";
import { trackRenderQuality } from "../../lib/spline/quality";
import { canRender3D, releaseGlContext, watchContextLoss } from "../../lib/spline/runtime";
import { L2_DESKTOP_URLS, themeModel } from "../../lib/spline/scenes";
import type { SceneNode, SplineApp, SplineObject } from "../../lib/spline/types";

/** A loaded layer 2 mount and the parts of it the ticker writes to. */
export interface L2Entry {
  app: SplineApp;
  arms: SceneNode[];
  bot: SplineObject | null;
  head: SplineObject | null;
  canvas: HTMLCanvasElement | null;
}

/** The boxes the scenes mount into; their canvases are released from here. */
interface SceneBoxes {
  canvasWrapRef: RefObject<HTMLDivElement | null>;
  slot1BoxRef: RefObject<HTMLDivElement | null>;
  altBoxRef: RefObject<HTMLDivElement | null>;
  canvas2WrapRef: RefObject<HTMLDivElement | null>;
}

/**
 * The hero's Spline mounts: which scene mounts where, loading and failure,
 * the loader's progress, and releasing GPU contexts. The refs it returns are
 * what the timeline drives.
 */
export const useHeroScenes = (
  isMobile: boolean,
  darkMode: boolean,
  { canvasWrapRef, slot1BoxRef, altBoxRef, canvas2WrapRef }: SceneBoxes,
) => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // Without WebGL (blocked, or the GPU was reset) nothing mounts: straight to the
  // static robot, with no loader to wait through.
  const [failed, setFailed] = useState(() => !canRender3D());
  const [scene2Failed, setScene2Failed] = useState(failed);
  // Layer 2 mounts that have drawn their first frames, by "m:"/"d:" + url.
  const [drawn2, setDrawn2] = useState<Record<string, boolean>>({});
  // Mounts whose load failed (reported by SceneBoundary): "alt" and "d:" + url.
  const [deadScenes, setDeadScenes] = useState<Record<string, boolean>>({});
  const markDead = (key: string) => setDeadScenes((d) => (d[key] ? d : { ...d, [key]: true }));
  const readyRef = useRef(false);
  // Scenes that have drawn their first frames. Only these get paused: the
  // timeline's playback sync leaves the others alone.
  const settledRef = useRef(new WeakSet<SplineApp>());
  const app1Ref = useRef<SplineApp | null>(null);
  const app2Ref = useRef<SplineApp | null>(null);
  const armsRef = useRef<SceneNode[]>([]);
  const botRef = useRef<SplineObject | null>(null);
  const head1Ref = useRef<SplineObject | null>(null);
  // Desktop layer A mounts both models with fixed keys and the theme only picks
  // which one shows. The second mount has its own refs: a different model, with
  // its own head, arms and app.
  const appAltRef = useRef<SplineApp | null>(null);
  const armsAltRef = useRef<SceneNode[]>([]);
  const headAltRef = useRef<SplineObject | null>(null);
  const altCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Layer 2 mounts by "m:"/"d:" + url. On desktop the ticker writes camera, rig,
  // pose and gaze to both, so the hidden one is always in the current beat and a
  // theme change is visibility only.
  const l2Ref = useRef<Record<string, L2Entry>>({});
  // Phones: the hero's arms (on phones armsRef holds layer 2's).
  const heroArmsRef = useRef<SceneNode[]>([]);
  // Kept by the hero IntersectionObserver.
  const heroVisibleRef = useRef(true);
  // One model per theme throughout: the black robot (scene 1) in light, the
  // silver one (scene 2) in dark.
  //
  // Desktop: layers A and 2 mount both models with fixed keys and the theme only
  // picks which shows, so a toggle never reloads or rebuilds anything.
  //
  // Phones: only the theme's model is mounted, two scenes in total; more made iOS
  // kill the page. Theme changes reload the page (lib/themeReload); only
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
  const heroAltUrl = SPLINE_SCENE_URL;
  const showAlt = !isMobile && !darkMode && !deadScenes.alt;

  // The playback sync runs on the ticker and needs what is visible right now.
  const showAltRef = useRef(showAlt);
  const l2VisibleRef = useRef(l2VisibleUrl);
  useLayoutEffect(() => {
    showAltRef.current = showAlt;
    l2VisibleRef.current = l2VisibleUrl;
  });

  // A hidden scene has to draw once, or the first frame it shows stalls compiling
  // its shaders.
  const afterFirstFrames = (fn: () => void) =>
    requestAnimationFrame(() => requestAnimationFrame(fn));

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
      if (!readyRef.current) setFailed(true);
    }, 22000);
    return () => clearTimeout(timeout);
  }, []);

  const handleLoad = (app: SplineApp) => {
    app1Ref.current = app;
    placeBot(app);
    pinCamera(app, isMobile ? HERO_CAM_MOBILE : HERO_CAM_DESKTOP);
    if (isMobile) heroArmsRef.current = collectArms(app);
    else armsRef.current = collectArms(app);
    head1Ref.current = app.findObjectByName("Head") || null;
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
    trackRenderQuality(app);
    watchContextLoss(app.canvas, () => setFailed(true));
    afterFirstFrames(() => settledRef.current.add(app));
    if (readyRef.current) return;
    readyRef.current = true;
    setProgress(100);
    setTimeout(() => setLoaded(true), 700);
  };

  // Desktop layer A's alternate mount (the black robot). It has its own head and
  // arms, and doesn't gate `loaded`: the hero is ready once slot1 is.
  const handleAltLoad = (app: SplineApp) => {
    appAltRef.current = app;
    placeBot(app);
    pinCamera(app, isMobile ? HERO_CAM_MOBILE : HERO_CAM_DESKTOP);
    armsAltRef.current = collectArms(app);
    headAltRef.current = app.findObjectByName("Head") || null;
    // Transparent for the same reason as slot1.
    try {
      app.setBackgroundColor("rgba(0,0,0,0)");
    } catch {
      /* older runtime */
    }
    altCanvasRef.current = altBoxRef.current ? altBoxRef.current.querySelector("canvas") : null;
    trackRenderQuality(app);
    watchContextLoss(app.canvas, () => markDead("alt"));
    afterFirstFrames(() => settledRef.current.add(app));
  };

  // Layer 2 load. "m:" is the phone mount (the theme's model); "d:" the two
  // desktop mounts.
  const onScene2Load = (key: string, app: SplineApp) => {
    placeBot(app);
    pinCamera(app, CAM_FINAL);
    const entry: L2Entry = {
      app,
      arms: collectArms(app),
      bot: findBot(app),
      head: app.findObjectByName("Head") || null,
      canvas: app.canvas || null,
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
    trackRenderQuality(app);
    watchContextLoss(app.canvas, () =>
      key.startsWith("m:") ? setScene2Failed(true) : markDead(key),
    );
    // Ready after two drawn frames, so the rig is in place before the fade; on
    // desktop, once both models are in.
    afterFirstFrames(() => {
      settledRef.current.add(app);
      setDrawn2((d) => (d[key] ? d : { ...d, [key]: true }));
    });
  };

  const revealed = loaded || failed;
  // Scene 2 mounts as soon as the hero has loaded, not on scroll: a flick reaches
  // the crossfade in half a second, faster than any scroll threshold. Its loop
  // stays paused until near the crossfade (the timeline's playback sync).
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
  const glCanvasRefs = useRef<{
    slot1?: HTMLCanvasElement | null;
    slot2?: HTMLCanvasElement | null;
  }>({});
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

  // Frame times mean nothing while scenes are still loading.
  const scenesLoadedRef = useRef(false);
  useLayoutEffect(() => {
    scenesLoadedRef.current = scene2Ready || scene2Dead;
  }, [scene2Ready, scene2Dead]);

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

  // What the timeline drives and the playback state it shares, as one object
  // that never changes.
  const [refs] = useState(() => ({
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
  }));

  const onLayer2Gone = (url: string) => {
    const e = l2Ref.current["d:" + url];
    if (e) releaseGlContext(e.canvas);
    delete l2Ref.current["d:" + url];
    setDrawn2((d) => {
      const rest = { ...d };
      delete rest["d:" + url];
      return rest;
    });
  };

  return {
    refs,
    // For the markup.
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
    onHeroLoad: handleLoad,
    onHeroFail: () => setFailed(true),
    onAltLoad: handleAltLoad,
    onAltFail: () => markDead("alt"),
    onLayer2Load: onScene2Load,
    onLayer2MobileFail: () => setScene2Failed(true),
    onLayer2DesktopFail: (url: string) => markDead("d:" + url),
    onLayer2Gone,
  };
};

export type HeroSceneRefs = ReturnType<typeof useHeroScenes>["refs"];
