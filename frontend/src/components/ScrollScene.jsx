import { Component, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Spline from "@splinetool/react-spline";
import {
  SPLINE_SCENE_URL,
  SPLINE_SCENE_2_URL,
  profile,
  story,
  storyTitle,
  systemFeatures,
} from "../data/portfolioData";
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

// NITIDEZ EN ESCRITORIO. El zoom y el paneo de cada beat ya no los hace el
// CSS: estirar el canvas 1.9-4x por CSS dejaba 0.43-0.86 pixeles renderizados
// por pixel mostrado (medido, igual en DPR 1 y 2), o sea un render ablandado.
// Ahora el wrap va SIEMPRE a VIEW_CSS_SCALE, sin traslado, y el resto lo hace
// la camara: zoom = CAM_BASE_ZOOM * S / VIEW_CSS_SCALE, y el paneo va en los
// terminos fuera de eje de la proyeccion (elementos 8 y 9), que desplazan la
// imagen en 2D igual que un translate. Es la MISMA transformacion que antes
// -- escala alrededor del centro y traslado --, asi que encuadres, anclas y
// L quedan identicos; solo cambia donde se hace. Spline recalcula la
// proyeccion al redimensionar, por eso se reaplica en cada frame.
// 1.3 y no 1: el badge "Built with Spline" se dibuja DENTRO del canvas y por
// debajo de ~1.2 entra en cuadro.
const VIEW_CSS_SCALE = 1.3;
// Escritorio, capa 2: los dos modelos montados a la vez, key fija.
const L2_DESKTOP_URLS = [SPLINE_SCENE_2_URL, SPLINE_SCENE_URL];
const CAM_BASE_ZOOM = 2;
// La escena 1 se renderiza a VIEW_CSS_SCALE para que, estirada 1.3x por el
// wrap, quede 1:1. La 2 ya tiene OVERSAMPLE (1.7): queda en 1.31:1.
const OVERSAMPLE_1 = VIEW_CSS_SCALE;

/** Apply a CSS-equivalent zoom (scale S about the centre) and pan (x/y in %
 *  of the frame) to a scene's camera. */
const applyView = (app, v) => {
  const cam = app?._camera;
  if (!cam || !cam.projectionMatrix) return;
  try {
    cam.zoom = (CAM_BASE_ZOOM * v.scale) / VIEW_CSS_SCALE;
    cam.updateProjectionMatrix?.();
    const e = cam.projectionMatrix.elements;
    // NDC runs -1..1 across the canvas, y up: a pan of f of the canvas is 2f.
    e[8] = (-2 * parseFloat(v.x)) / 100 / VIEW_CSS_SCALE;
    e[9] = (2 * parseFloat(v.y)) / 100 / VIEW_CSS_SCALE;
  } catch (err) {
    /* runtime without an inspectable camera */
  }
};

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

// CAMARAS (los dos anchos). Cada escena trae su propia intro de camara: un evento
// Start de Spline que la lleva desde la posicion guardada en el archivo hasta
// (0, 147, 1000) en ~2.5s. Los dos archivos arrancan de camaras distintas --
// el robot negro de (0, 249, 360), mucho mas cerca, el plateado de
// (-7.5, 262, 588) -- y el hero se revela con la intro todavia corriendo. Asi
// el mismo beat salia encuadrado distinto segun el tema (negro grande y con la
// cabeza baja, plateado chico y alto), y segun cuanto tardara en cargar; y
// HOME, que no repite la intro, aterrizaba en la camara final. El rig y la
// camara final son iguales en los dos: lo unico que divergia era esa intro.
//
// La salida es sacarle la camara a la intro: se clavan la posicion Y la
// rotacion. La intro tambien inclina la camara -- de 0.014 a 0.007 rad en su
// ultimo tramo --, y play() la REPITE: despues de home la escena, que estaba
// en pausa, vuelve a disparar el Start, la inclinacion salta a 0.014 y baja a
// 0.007 en ~2.5s, y el robot aparece ~28px mas abajo y sube hasta asentarse.
// Clavada en el valor asentado, que es el mismo en las dos escenas y en los
// dos anchos, el cuadro es identico en carga fresca, despues de home y en
// los dos temas.
//
// HERO: sobre la propia linea de la intro del robot negro, en t = .4 (de 0,
// la guardada, a 1, la final). t ~ .3 es el encuadre de referencia -- corona
// en el borde, visor a ~37%, titular bajo el menton --; .4 se aleja apenas:
// visor a ~32%, corona todavia rozando el borde. Mas atras (.5-.6) la corona
// entra entera con aire arriba; subir t es la unica perilla.
const HERO_CAM_MOBILE = { x: 0, y: 208.2, z: 616 };
// HERO ESCRITORIO: 1.52x mas cerca que la final (z 1000 -> 660) y mas alta
// (y 146.98 -> 177.6), que es lo que baja el robot en el cuadro sin correr el
// canvas. El acercamiento sale de la camara y no del scale CSS: el canvas ya
// va estirado 1.9x, y subirlo lo ablandaria. Ver heroY / heroDx.
const HERO_CAM_DESKTOP = { x: 0, y: 178.2, z: 660 };

// CAPITULO 2: la final de la intro, la misma en los dos archivos. Todo el
// encuadre del capitulo 2 (L, cintura, anclas) se midio con esta camara; se
// clava solo para que la intro no la barra en el crossfade.
const CAM_FINAL = { x: 0, y: 146.98, z: 1000 };
// La rotacion asentada de la intro, leida en vivo: igual en las tres
// camaras, los dos temas y los dos anchos.
const CAM_EULER_X = 0.006996317664543058;
const CAM_QUAT = { x: 0.003498151697713782, y: 0, z: 0, w: 0.9999938814486315 };

/** Pin a scene's camera so its own Start transition cannot move or tilt it. */
const pinCamera = (app, pos) => {
  const pin = (obj, key, value) =>
    Object.defineProperty(obj, key, { get: () => value, set: () => {}, configurable: true });
  try {
    const cam = app?._camera;
    if (!cam?.position) return;
    ["x", "y", "z"].forEach((ax) =>
      Object.defineProperty(cam.position, ax, { get: () => pos[ax], set: () => {}, configurable: true })
    );
    // The matrix is composed from the quaternion's backing fields, and the
    // Euler keeps its own copy in sync from them: pin both, so neither path
    // can bring the intro's tilt back.
    const q = cam.quaternion;
    if (q) ["x", "y", "z", "w"].forEach((k) => pin(q, "_" + k in q ? "_" + k : k, CAM_QUAT[k]));
    const r = cam.rotation;
    if (r) [["x", CAM_EULER_X], ["y", 0], ["z", 0]].forEach(([k, v]) => pin(r, "_" + k in r ? "_" + k : k, v));
  } catch (e) {
    /* runtime without an inspectable camera */
  }
};

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

/**
 * A box for one Spline mount that reports when it really goes away. The GPU
 * context is released by the caller from the canvas it recorded at LOAD, not
 * from whatever canvas is in the box: under StrictMode the dev build mounts,
 * unmounts and remounts every component once, and releasing on that first
 * pretend-unmount handed react-spline an already-lost context -- the scene
 * then failed to load and took the whole app down with it.
 */
const ReleasingBox = ({ onGone, children, ...rest }) => {
  const goneRef = useRef(onGone);
  goneRef.current = onGone;
  useLayoutEffect(() => () => goneRef.current?.(), []);
  return <div {...rest}>{children}</div>;
};

/**
 * One per Spline mount. react-spline has no onError: a failed load is
 * rethrown from its render (`if (i) throw i`), and without a boundary that
 * takes the whole page down. This catches it, renders nothing in that
 * scene's place and tells the owner which one died. No GPU context is
 * released here: react-spline disposes its own Application on unmount, and
 * ours are only ever released from canvases registered at LOAD (see
 * ReleasingBox) -- a scene that failed never registered one.
 */
class SceneBoundary extends Component {
  state = { dead: false };

  static getDerivedStateFromError() {
    return { dead: true };
  }

  componentDidCatch(error) {
    console.warn(`Spline scene failed to load (${this.props.name}):`, error);
    this.props.onFail?.();
  }

  render() {
    return this.state.dead ? null : this.props.children;
  }
}

// TEMPORAL, solo dev -- sacar antes del deploy. Diagnostico del fantasma
// plateado: window.__canvasProbe() imprime cada <canvas> con su capa y su
// escena, visibility propia, opacidad efectiva (producto de los ancestros) y
// rect. __canvasProbe.hide(i) / .show(i) le ponen display:none a uno solo,
// para ver en la maquina real cual dibuja que.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const label = (c) => {
    const a = c.closest('[data-testid="spline-canvas-wrap"]');
    const l2 = c.closest('[data-testid="spline2-canvas-wrap"]');
    if (a) return [...a.querySelectorAll("canvas")].indexOf(c) === 0 ? "A slot1 SILVER" : "A alt BLACK";
    if (l2) return [...l2.querySelectorAll("canvas")].indexOf(c) === 0 ? "L2 SILVER" : "L2 BLACK";
    return "grid (2D)";
  };
  const probe = () => {
    const rows = [...document.querySelectorAll("canvas")].map((c, i) => {
      const r = c.getBoundingClientRect();
      let op = 1;
      for (let el = c; el; el = el.parentElement) op *= parseFloat(getComputedStyle(el).opacity);
      const s = getComputedStyle(c);
      return { i, layer: label(c), visibility: s.visibility, ownVisibility: c.style.visibility || "-",
               display: s.display, opacity: op.toFixed(2),
               x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
    console.table(rows);
    // El tamano del robot en pixeles del dispositivo es proporcional a
    // S * alto * DPR; zoom 100% en 2560x1305 con S 2.15 (card 02) = 1.000.
    const v = window.__view2;
    console.log(`viewport ${innerWidth}x${innerHeight} @ DPR ${devicePixelRatio}` +
      (v ? `, capa 2 S ${(+v.scale).toFixed(3)}, robot ${((v.scale * innerHeight * devicePixelRatio) / (2.15 * 1305)).toFixed(3)} x card02@2560x1305` : ""));
    const live = rows.filter((r) => r.layer !== "grid (2D)" && r.visibility === "visible" &&
      +r.opacity > 0 && r.w > 0 && r.h > 0);
    if (live.length > 1) console.warn("more than one robot canvas live:", live.map((r) => r.layer).join(", "));
    return rows;
  };
  probe.hide = (i) => { document.querySelectorAll("canvas")[i].style.display = "none"; };
  probe.show = (i) => { document.querySelectorAll("canvas")[i].style.display = ""; };
  window.__canvasProbe = probe;
}

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
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mountScene2, setMountScene2] = useState(false);
  const [scene2Ready, setScene2Ready] = useState(false);
  const [scene2Failed, setScene2Failed] = useState(false);
  // Montajes cuya carga fallo (lo reporta su SceneBoundary): "alt" y "d:" +
  // url. El ref es para los onLoad, que react-spline captura al montar.
  const [deadScenes, setDeadScenes] = useState({});
  const deadScenesRef = useRef(deadScenes);
  deadScenesRef.current = deadScenes;
  const markDead = (key) => setDeadScenes((d) => (d[key] ? d : { ...d, [key]: true }));
  const [journeyDone, setJourneyDone] = useState(false);
  const readyRef = useRef(false);
  // Escena 2 renderiza solo cuando la capa 2 esta por aparecer; antes de eso
  // su loop queda en pausa. Lo decide el onUpdate del pin, lo lee el onLoad.
  const awake2Ref = useRef(false);
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
  const applyGazeRef = useRef(null);
  const armsRef = useRef([]);
  const botRef = useRef(null);
  const head1Ref = useRef(null);
  const heroEndRef = useRef(0);
  // CELULAR: la capa A monta DOS escenas a la vez con key fija y el tema solo
  // decide cual se VE, por clase. Asi el toggle no remonta nada -- que es lo
  // que reconstruia la timeline y devolvia el salto. La capa 2 y el crossfade
  // no se tocan: siguen exactamente como estaban.
  //
  // El segundo montaje tiene sus propios refs porque es OTRO modelo: la
  // cabeza, los brazos y la app son distintos objetos, y el ticker tiene que
  // escribir sobre el que se esta viendo, no sobre el que esta en opacity-0.
  const appAltRef = useRef(null);
  const armsAltRef = useRef([]);
  const headAltRef = useRef(null);
  const altCanvasRef = useRef(null);
  // Capa 2: registro de montajes cargados, por "m:"/"d:" + url. En escritorio
  // hay dos (negro y plateado) y todo lo que el ticker escribe -- camara,
  // rig, pose, mirada -- va a los DOS, asi el oculto esta siempre en la pose
  // y el beat actuales y el cambio de tema es solo de visibilidad.
  const l2Ref = useRef({});
  const loaded2Ref = useRef(0);
  // Cursor normalizado sobre el hero (-0.5..0.5), para la cabeza en escritorio.
  const mouseNRef = useRef({ x: 0, y: 0 });
  // Direccion por defecto de la cabeza del hero, SOLO en celular: una sola,
  // la del robot negro (derecha, +0.27), en los dos temas. En escritorio la
  // cabeza sigue al mouse con el look-at propio de la escena (ver applyHead1).
  const head1BaseRef = useRef({ x: 0.05, y: 0.27 });
  // Mismo motivo para el tema entero: el ticker necesita saber cual de las dos
  // escenas de la capa A esta visible, y meter darkMode en el efecto que arma
  // la timeline la haria reconstruirse en cada cambio.
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
  // Cada montaje de la capa A tiene su propia caja: con dos canvas adentro,
  // un querySelector sobre canvasWrapRef devuelve el primero que este en el
  // DOM, no el que cargo, y el efecto que libera contextos terminaria
  // matando el equivocado.
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
  const featuresHeaderRef = useRef(null);
  const storyRefs = useRef([]);
  const calloutRefs = useRef([]);
  const lineRefs = useRef([]);
  const dotRefs = useRef([]);
  const railRefs = useRef([]);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  // El telefono NO cambia de escena con el tema. Cambiarla remonta los dos
  // <Spline> (llevan key por url) y eso destruye y recrea los dos contextos
  // WebGL: medido, cada toggle pasa de 2 contextos creados a 4, con 2
  // perdidos en el medio. iOS Safari tiene un techo bajo y recupera la
  // memoria GPU de forma asincrona, asi que pide los nuevos mientras los
  // viejos siguen tomados, mata la pestana y recarga -- de ahi el salto
  // arriba (el tema ya no persiste entre recargas: siempre arranca en claro).
  //
  // Las URLs no dependen del tema en celular, y eso no cambia: son lo que
  // alimenta las keys, el efecto que libera contextos y las dependencias de la
  // timeline. Lo que da el robot negro en claro es OTRO montaje, con su propia
  // key fija, que convive con este dentro de la capa A -- ver HERO_ALT_URL.
  // ESCRITORIO TAMBIEN: la capa A monta las dos escenas en los dos anchos y
  // el tema solo elige cual se ve. Antes, en escritorio, sceneUrl seguia al
  // tema: cambiarlo remontaba la escena, que cargaba de cero con su transform
  // de fabrica, y reconstruia la timeline (depende de sceneUrl) -- el robot
  // saltaba y volvia viajando a su lugar.
  const sceneUrl = SPLINE_SCENE_2_URL;
  const slot1Url = sceneUrl;
  // La capa 2 sigue al TEMA, no a sceneUrl. En celular sceneUrl esta clavado
  // en la escena 2 para que el toggle no remonte el hero, y la capa 2 heredaba
  // ese clavo: en claro el hero mostraba el robot negro y el capitulo 2 seguia
  // plateado, dentro del mismo tema. En escritorio sceneUrl ya seguia al tema,
  // asi que ahi esto no cambia nada.
  //
  // El costo es acotado a proposito: la capa 2 recien se monta pasado el 15%
  // del pin, asi que un toggle en el hero -- que es donde se toca -- no tiene
  // nada que remontar. Solo cambiar de tema YA dentro del capitulo 2 rehace
  // este montaje, y es uno solo: el conteo de contextos en reposo no sube.
  // Solo el montaje de CELULAR usa esta url. En escritorio la capa 2 monta
  // las dos escenas con key fija (ver L2_DESKTOP_URLS) y el tema elige.
  const slot2Url = darkMode ? SPLINE_SCENE_2_URL : SPLINE_SCENE_URL;
  // Si el modelo del tema no cargo, se ve el otro: otro color, pero robot.
  const l2Alive = L2_DESKTOP_URLS.filter((u) => !deadScenes["d:" + u]);
  const l2Preferred = darkMode ? SPLINE_SCENE_2_URL : SPLINE_SCENE_URL;
  const l2VisibleUrl = l2Alive.includes(l2Preferred) ? l2Preferred : l2Alive[0];

  // El robot de la escena 1 es NEGRO y el de la 2 PLATEADO. En celular la capa
  // A monta los dos y el tema elige por clase: negro sobre el fondo claro,
  // plateado sobre el oscuro. La capa 2 llega al mismo robot por otro camino
  // -- su url sigue al tema, ver slot2Url -- asi que el modelo es UNO POR
  // TEMA de punta a punta: negro todo el recorrido en claro, plateado todo el
  // recorrido en oscuro.
  //
  // Cuesta un tercer contexto WebGL en el telefono. Es deliberado y esta a
  // prueba: si iOS Safari recarga, la salida es volver a plateado en los dos
  // temas borrando este montaje -- nada mas depende de el.
  const HERO_ALT_URL = SPLINE_SCENE_URL;
  const showAlt = !darkMode && !deadScenes.alt;
  // Lo que NO se ve, en escritorio, va visibility:hidden ademas de opacity 0:
  // fuera del compositing, y fuera del hit-testing del mouse. Solo un robot
  // visible por capa, siempre. En celular queda como estaba (solo opacity).
  const hiddenCls = isMobile ? "opacity-0" : "invisible opacity-0";

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
    pinCamera(app, isMobile ? HERO_CAM_MOBILE : HERO_CAM_DESKTOP);
    armsRef.current = collectArms(app);
    head1Ref.current = app?.findObjectByName?.("Head") || null;
    // Scene 1 ships an OPAQUE background, and an opaque canvas can only show
    // the wall underneath through a blend mode. The runtime accepts a
    // transparent one, so the scene stops being a sheet of colour and becomes
    // what scene 2 already was: a figure with alpha. Composited normally, the
    // robot's own pixels cover the wall and its empty ones reveal it.
    try {
      app.setBackgroundColor("rgba(0,0,0,0)");
    } catch (e) {
      /* older runtime */
    }
    glCanvasRefs.current.slot1 = slot1BoxRef.current
      ? slot1BoxRef.current.querySelector("canvas")
      : canvasWrapRef.current
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

  // El montaje alterno de la capa A (celular, tema claro). NO toca app1Ref ni
  // head1Ref ni armsRef: es otro modelo, con su propia cabeza y sus propios
  // brazos, y el ticker elige a cual escribirle segun el tema. Tampoco marca
  // `loaded`: el hero ya se considera listo con slot1, asi que si esta escena
  // tarda o falla no bloquea la entrada.
  const handleAltLoad = (app) => {
    appAltRef.current = app;
    placeBot(app);
    pinCamera(app, isMobile ? HERO_CAM_MOBILE : HERO_CAM_DESKTOP);
    armsAltRef.current = collectArms(app);
    headAltRef.current = app?.findObjectByName?.("Head") || null;
    // Misma razon que en slot 1: un fondo opaco solo deja ver la pared por
    // blend, y el blend se cuela por dentro del cuerpo.
    try {
      app.setBackgroundColor("rgba(0,0,0,0)");
    } catch (e) {
      /* runtime viejo */
    }
    altCanvasRef.current = altBoxRef.current
      ? altBoxRef.current.querySelector("canvas")
      : null;
  };

  // Carga de un montaje de la capa 2. "m:" es el de celular (uno, sigue al
  // tema por url); "d:" son los dos de escritorio (key fija, el tema elige).
  const onScene2Load = (key) => (app) => {
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
    } catch (e) {
      /* older runtime without setBackgroundColor */
    }
    loaded2Ref.current += 1;
    const need = key.startsWith("m:")
      ? 1
      : L2_DESKTOP_URLS.filter((u) => !deadScenesRef.current["d:" + u]).length;
    // Ready once it has DRAWN: two frames, so placeBot and the rig from the
    // ticker are in the picture before the wrap can fade in -- on desktop,
    // once BOTH models are in, so a theme change never waits on a load. Then
    // back to sleep if the visitor is still in the hero.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (key.startsWith("m:") || loaded2Ref.current >= need) setScene2Ready(true);
        if (!awake2Ref.current) {
          try { app.stop(); } catch (e) { /* runtime without stop() */ }
        }
      })
    );
  };

  // Un modelo de escritorio de la capa 2 que falla ya no se espera: si el otro
  // habia cargado, la capa queda lista con ese; si fallaron los dos, va el
  // PNG de respaldo.
  const l2AliveCount = l2Alive.length;
  useEffect(() => {
    if (isMobile || !mountScene2 || scene2Ready || scene2Failed) return;
    if (l2AliveCount === 0) setScene2Failed(true);
    else if (loaded2Ref.current >= l2AliveCount) setScene2Ready(true);
  }, [isMobile, mountScene2, scene2Ready, scene2Failed, l2AliveCount]);

  // scene 2: lazy load watchdog -> fallback render if it never comes up
  useEffect(() => {
    if (!mountScene2 || scene2Ready || scene2Failed) return;
    const t = setTimeout(() => setScene2Failed(true), 25000);
    return () => clearTimeout(t);
  }, [mountScene2, scene2Ready, scene2Failed]);

  const revealed = loaded || failed;

  // Escena 2 se monta en cuanto el hero termino de cargar, NO por scroll. El
  // umbral viejo (p > .15) era progreso de scroll y el crossfade esta puesto
  // en SEGUNDOS de timeline (XFADE_AT / duracion ~ p .149 en escritorio):
  // cada beat agregado al final de la timeline lo fue adelantando hasta
  // quedar antes del montaje, y la capa 2 aparecia sin escena -- mostrando el
  // PNG de respaldo, negro, sin encuadre y cortado en la cadera. Desde el
  // arranque hasta el crossfade hay poco mas de un viewport de scroll, que un
  // flick cubre en medio segundo: no hay umbral de scroll que llegue a
  // tiempo. Montada al cargar, su loop queda en pausa hasta acercarse (ver
  // awake2Ref), asi que durante el hero no le cuesta GPU al telefono.
  useEffect(() => {
    if (revealed) setMountScene2(true);
  }, [revealed]);

  // Keyed on the scene urls: when a theme flip swaps them, React unmounts the
  // old canvases, and this cleanup runs in the mutation phase — while they are
  // still in the DOM and can still be asked to release their context.
  // Each slot records the canvas its scene actually took, at load. Sweeping
  // the DOM in the cleanup does not work: React runs destroy functions during
  // the mutation phase, by which point the REPLACEMENT canvas is already in
  // the tree, and the sweep kills the context that was just created.
  const glCanvasRefs = useRef({});
  // Un efecto POR SLOT, cada uno atado a su propia url. Juntos en uno solo
  // compartian las dependencias, asi que cambiar la url de la capa 2 corria
  // una limpieza que tambien soltaba el contexto de slot1 -- y slot1 no se
  // remonta en ese cambio, porque su key no cambio. Resultado: el hero se
  // quedaba sin contexto y en negro. Ahora cada slot suelta solo el suyo, y
  // solo cuando su escena se va de verdad.
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
    return () => {
      releaseGlContext(held.slot2);
      held.slot2 = null;
      delete l2Ref.current["m:" + url];
    };
  }, [slot2Url]);

  // El montaje alterno no sigue a ninguna url -- su key es fija -- asi que lo
  // unico que lo desmonta es salir de celular, o irse de la pagina. Su
  // contexto se libera ahi y en ningun otro lado: meterlo en el efecto de
  // arriba mataria los canvas de slot1/slot2, que React NO remonta cuando
  // cambia el breakpoint.
  useLayoutEffect(() => {
    return () => {
      releaseGlContext(altCanvasRef.current);
      altCanvasRef.current = null;
      appAltRef.current = null;
      headAltRef.current = null;
      armsAltRef.current = [];
    };
  }, []);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    // middle ground: camera closer, robot vertically centered, little air above the head
    // Back to the approved close-up. The wide full-body framing read as too
    // distant. Note the overscale also keeps Spline's "Built with Spline"
    // badge out of frame — it is drawn INSIDE the WebGL canvas, not the DOM,
    // so CSS cannot reach it; anything at or below ~1.2 brings it into view.
    // La MISMA regla de cintura que el capitulo 2, aplicada al hero. Medido en
    // la apertura, antes de tocar nada:
    //
    //   celular     S 1.7  / y 11%    =>  L .729   la cintura esta en p .717:
    //                                     se veian los montantes y el arranque
    //                                     de la pelvis, unos 19px de 844
    //   escritorio  S 1.78 / y 12.6%  =>  L .710   justo SOBRE la cintura
    //                                     (p .709), y el float del idle mas el
    //                                     parallax (13px juntos = .008 nativo)
    //                                     lo empujan del otro lado
    //
    // Se corrige acercando, no bajando: subir la y sola habria abierto aire
    // muerto arriba de la cabeza, que es lo que estos numeros venian de sacar.
    // La corona queda donde estaba y el borde de abajo sube a L .675 / .680.
    const startScale = reduce ? 1 : isMobile ? 1.86 : 1.9;
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
    // Acercar sube la corona fuera de cuadro, asi que la y compensa. Un punto
    // a la fraccion nativa p cae en (p*H - H/2)*S + H/2 + Y*H; con la corona
    // en p .154 sobre 844, sostenerla a y 21 con S 2.3 despeja Y = 32%.
    // ESCRITORIO: la corona a HERO_CROWN_TOP px del borde superior, en
    // cualquier alto de ventana.
    //
    // La y NO puede pasar de ~39%: el canvas y la pared van escalados 1.9x
    // alrededor del centro, asi que su borde superior cae en (y - 45%) * alto.
    // Con y 48% (2c2ca10) quedaba +27px ADENTRO del cuadro: la corona salia
    // cortada en ese borde y arriba asomaba el fondo -- la franja negra. Y el
    // tiron del drain (scale x.96, +1.3%) pide y <= 39.9% para no destaparlo.
    // Por eso el robot se baja con la CAMARA (HERO_CAM_DESKTOP.y), y la y solo
    // hace el ajuste fino por alto de ventana alrededor de 38%, con tope 39%.
    // Con el wrap sin traslado (ver VIEW_CSS_SCALE), la y es un paneo de camara
    // y ya no tiene tope. HERO_CROWN_FRAC_AT_BASE sale de medir: con la camara
    // en 178.2 y el paneo en 38%, la corona con el cursor al centro cae al
    // 5.0% del alto.
    //
    // La cabeza sigue al mouse y eso mueve la corona. En reposo (antes del
    // primer movimiento: cabeza derecha) queda ~23px MAS ARRIBA que mirando al
    // cursor centrado; con el cursor abajo, ~20px mas arriba; con el cursor
    // arriba, ~30px mas abajo. La distancia reposo -> centro escala con el
    // alto (~3.1%: 21 / 26 / 33px a 720 / 900 / 1080), asi que el objetivo
    // al centro es 16px + 3.1% del alto: el reposo -- lo primero que se ve --
    // conserva ~16px en cualquier ventana, y al centro da ~38 / 44 / 50px.
    const HERO_Y_BASE = 38;
    const HERO_CROWN_FRAC_AT_BASE = 0.05;
    const heroVH = window.innerHeight || 900;
    const HERO_CROWN_TOP = 16 + 0.031 * heroVH;
    const heroY = HERO_Y_BASE + (HERO_CROWN_TOP / heroVH - HERO_CROWN_FRAC_AT_BASE) * 100;
    const startY = reduce ? "2%" : isMobile ? "16.5%" : `${heroY}%`;
    const endY = reduce ? "3%" : isMobile ? "17.9%" : `${heroY + 1.3}%`;
    // Centrado sobre la silueta: el rig (BOT_HOME.x) deja la cabeza a la
    // izquierda de la camara, y en pantalla eso escala con el alto -- y con
    // la cercania de la camara. Se compensa en el x del hero; celular no.
    const heroDx = 0.0148 * heroVH;
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

    // El ritmo no cambia: siempre algo de retroceso entre pasos, y un cierre
    // que vuelve a acercarse en vez de seguir abriendo. Lo que cambia es el
    // rango, y quien lo fija.
    //
    //   escritorio  4.0 -> 2.75 -> 2.15 -> 1.835 -> 2.03
    //   celular     1.833 -> 1.667 -> 1.5 -> 1.333 -> 1.167 -> 1.333
    //
    // Los numeros del celular son MAS CHICOS que los de antes (2.2 .. 1.4) y
    // sin embargo el robot se ve mas grande: el tamano ahora sale del rig, y
    // el scale del canvas solo recorta. Bajarlo es justamente lo que se
    // buscaba -- ver botRig mas abajo.
    //
    // ---- donde corta el cuadro -------------------------------------------
    // Cada paso se eligio por su L: la fraccion NATIVA del canvas que queda
    // sobre el borde INFERIOR del cuadro, L = 0.5 + (0.5 - Y) / S. Medida, no
    // estimada: con el wrap en scale(1) se fotografia la silueta y se leen los
    // puntos del cuerpo directo del perfil de anchos por fila.
    //
    //   escritorio, rig s .8      celular, rig s 1.2 (ver botRig)
    //   corona     p .138         corona   p .05
    //   CINTURA    p .709         CINTURA  p .936
    //   pelvis     p .73 - .79    badge de Spline  p .92+
    //   piernas    p .80+
    //
    // La regla es una sola y vale para los dos anchos: L por ENCIMA de la
    // cintura en TODOS los pasos, y tambien en la interpolacion entre pasos
    // -- applyPull mezcla scale/x/y linealmente y L no es lineal en esa
    // mezcla, asi que los intermedios se verificaron aparte.
    const c2pre = isMobile
      ? { scale: 1.833, x: "0%", y: "35.0%", rx: 13.3 }   // L .582
      : { scale: 3.0, x: fx(0, 3.0), y: "53%" };          // L .490
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
      ? { scale: 1.667, x: "0%", y: "27.5%", rx: 14.6 }   // L .635
      : { scale: 4.0, x: fx(-350, 4.0), y: "103%" };      // L .368
    // STEP 2 (card 01, at the LEFT) — the body now sits OPPOSITE its card
    // instead of leaning into it. Leaning left put the figure and the card on
    // the same side and vacated the whole right half; that read as
    // atmospheric when the ground was black, but on white it is just a hole.
    // Card left + body right balances the frame and gives the connector a
    // span to cross.
    const c2s2 = isMobile
      ? { scale: 1.5, x: "0%", y: "20.0%", rx: -16.3 }    // L .700
      : { scale: 2.75, x: fx(150, 2.75), y: "49.1%" };   // L .503 — above the elbow
    // STEP 3 (card 02, at the RIGHT) — leans right toward its card. -520 put
    // the body hard against the left edge with a 285px void before the card;
    // it still crops, just less.
    const c2s3 = isMobile
      ? { scale: 1.333, x: "0%", y: "12.5%", rx: 18.3 }  // L .781
      : { scale: 2.15, x: fx(-200, 2.15), y: "28.3%" }; // L .601 — past the elbow
    // STEP 4 (card 03) — the WIDEST beat of the sequence, so it is the one the
    // cintura rule binds on. Escritorio venia en 1.65/11% => L .736, que cae
    // JUSTO sobre la cintura (.709) y por eso se veia; 1.835/17.9% lo sube a
    // L .675, un margen de .034 nativo = 62px de pantalla a 900 de alto, que
    // aguanta el float del idle y el parallax (±13px juntos).
    const c2far = isMobile
      ? { scale: 1.167, x: "0%", y: "5.0%", rx: -13.7 }   // L .885
      : { scale: 1.835, x: fx(0, 1.835), y: "17.9%" };   // L .675 — sobre la cintura
    // CLOSING — vuelve a acercarse, centrado. El comentario decia "comes back
    // in slightly" pero el numero hacia lo contrario: 1.25 era el paso MAS
    // abierto de toda la secuencia, mas que card 03, y a L .922 mostraba
    // pelvis y medio muslo. Ahora el cierre es de verdad un regreso.
    //
    // Escritorio: 2.28, con la cabeza ENTERA y la corona justo debajo del
    // titulo de la seccion ("System Features"), sin tocarlo. El titulo esta
    // en px fijos (termina en 163px en cualquier alto) y el encuadre va en %,
    // asi que la y se calcula con el alto de la ventana, igual que fx() usa el
    // ancho: la corona (p .133, medida en este cuadro; la tabla dice .138 y
    // quedaba 10px alta) cae 14px debajo del borde inferior del titulo,
    // leido del DOM. A 900 da y 52.2%; a 720, 57.1%; a 1080, 48.9%.
    //
    // A esta cercania el antebrazo (py 56.7) y el centro del pecho (54.1)
    // quedan debajo del cuadro, asi que en el cierre las tarjetas 02 y 03 se
    // anclan mas arriba en la misma parte del cuerpo -- brazo alto y pecho
    // alto, ver closeAnchors -- y los puntos se deslizan hasta ahi durante el
    // acercamiento. El techo lo pone la ventana mas baja: a 720 el borde
    // inferior cae en p .44, y los dos puntos nuevos estan en ~.39-.41.
    //
    // Cintura: L = .469 (720) / .490 (900) / .505 (1080), lejos de .709; de
    // c2far a aca L baja monotono desde .675.
    const CROWN_P = 13.3;
    const headEl = featuresHeaderRef.current;
    const headBottomPx = headEl ? headEl.offsetTop + headEl.offsetHeight : 163;
    const VH = window.innerHeight || 900;
    const crownAtPct = ((headBottomPx + 14) / VH) * 100;
    const endScale = 2.28;
    const closeY = crownAtPct - 50 - (CROWN_P - 50) * endScale;
    // Centrado horizontal, medido sobre la silueta del casco y no sobre el
    // transform. x 0 centra el canvas, y el rig no deja el cuerpo en el eje:
    // BOT_HOME.x (-2.755) con la camara en x 0 deja la cabeza a la izquierda,
    // igual en los dos modelos. Como es un corrimiento en el MUNDO, en pantalla
    // escala con el alto: -11.4 / -14.2 / -16.9px a 720 / 900 / 1080, un
    // 1.58% del alto constante. Se compensa solo en este paso -- mover
    // bot.position.x correria el cuerpo en todos los beats y descalibraria
    // las anclas --, y los puntos lo siguen por la proyeccion.
    const closeDx = 0.0158 * VH;
    const c2end = isMobile
      ? { scale: 1.333, x: "0%", y: "12.5%", rx: -9.1 } // L .781
      : { scale: endScale, x: fx(closeDx, endScale), y: `${closeY}%` };
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

    // mouse parallax on scene 1 only (outside gsap.context to avoid TDZ on ctx).
    // Escena 2 no escucha al cursor: el robot solo se mueve por la timeline y
    // la cabeza solo mira la tarjeta activa. Su canvas ya es pointer-events-none
    // (hereda de layer2Ref) y el runtime de Spline solo escucha pointermove
    // sobre su propio canvas, asi que del lado de la escena no hay nada que
    // apagar.
    let removeMouse = null;
    if (!reduce) {
      const px1 = gsap.quickTo(parallax1Ref.current, "x", { duration: 0.9, ease: "power2.out" });
      const py1 = gsap.quickTo(parallax1Ref.current, "y", { duration: 0.9, ease: "power2.out" });
      const onMouse = (e) => {
        const r = sectionRef.current.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        px1(nx * 12); py1(ny * 8);
        mouseNRef.current = { x: nx, y: ny };
      };
      sectionRef.current.addEventListener("mousemove", onMouse);
      removeMouse = () => sectionRef.current?.removeEventListener("mousemove", onMouse);
    }

    // En escritorio el encuadre del hero vive en este proxy y lo aplica la
    // camara (ver applyView); el wrap queda fijo en VIEW_CSS_SCALE.
    const heroView = { scale: startScale, x: fx1(heroDx, startScale), y: startY };
    const scene2View = { scale: 1, x: "0%", y: "0%" };
    // TEMPORAL, solo dev (va con __canvasProbe): el encuadre vivo de la capa 2.
    if (process.env.NODE_ENV !== "production") window.__view2 = scene2View;

    const ctx = gsap.context(() => {
      if (isMobile) {
        gsap.set(canvasWrapRef.current, {
          scale: startScale,
          x: fx1(-58, startScale),
          y: startY,
          transformOrigin: "50% 50%",
        });
        gsap.set(canvas2WrapRef.current, { ...c2close, transformOrigin: "50% 50%" });
      } else {
        [canvasWrapRef.current, canvas2WrapRef.current].forEach((el) =>
          gsap.set(el, { scale: VIEW_CSS_SCALE, x: 0, y: 0, transformOrigin: "50% 50%" })
        );
        Object.assign(scene2View, { scale: c2close.scale, x: c2close.x, y: c2close.y });
      }
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
      // tone ya no existe: el fondo, la pared, el drain y el lift salen de
      // variables CSS del tema de la pagina, y el rail se atenua por opacidad
      // en vez de por color. Nada de esto depende de darkMode, que es lo que
      // permite sacar el tema de las dependencias del efecto y no reconstruir
      // la timeline -- ni los contextos WebGL -- al cambiarlo.

      // The backdrop scene 2 composites against — its canvas is transparent, so
      // this is the colour the robot is actually seen on.
      vignetteRef.current.style.setProperty("--vignette", "0 0 0");

      gsap.set(wallTopRef.current, { opacity: 0 });
      if (isMobile) {
        [parallax1Ref.current, parallax2Ref.current, idle1Ref.current, idle2Ref.current].forEach(
          (el) => el && gsap.set(el, { x: 0, y: 0, rotation: 0, scale: 1 })
        );
      }
      gsap.set(vignetteRef.current, { opacity: 0 });
      gsap.set(layer2Ref.current, { opacity: 0 });
      layer2InnerRef.current.style.setProperty("--lift-t", 0);
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
      // Amplitudes are CSS px INSIDE the wrap, so on screen they are x1.3
      // (VIEW_CSS_SCALE). Before, they rode each beat's whole CSS zoom -- x1.9
      // in the hero, up to x4 in the story beat -- and read as floating: y
      // +-5.7px in the hero, up to +-12px in scene 2. Now y +-1.6px and x
      // +-2.1px on screen: still alive, no longer noticeable as motion.
      if (!reduce && !isMobile) {
        [idle1Ref.current, idle2Ref.current].forEach((el) => {
          if (!el) return;
          gsap.set(el, { y: -1.2, rotation: -0.08 });
          gsap.to(el, { y: 1.2, duration: 5, yoyo: true, repeat: -1, ease: "sine.inOut" });
          gsap.to(el, { rotation: 0.08, duration: 6.3, yoyo: true, repeat: -1, ease: "sine.inOut" });
        });
        // A slow lateral drift and a shallow breath on scene 1. Both are
        // transform-only and run on periods that do not divide into the float
        // above, so the motion never settles into an obvious loop.
        if (idle1Ref.current) {
          gsap.fromTo(
            idle1Ref.current,
            { x: -1.6 },
            { x: 1.6, duration: 8.7, yoyo: true, repeat: -1, ease: "sine.inOut" }
          );
          gsap.fromTo(
            idle1Ref.current,
            { scale: 0.9988 },
            { scale: 1.0012, duration: 7.1, yoyo: true, repeat: -1, ease: "sine.inOut" }
          );
        }
      }

      // tonal drain proxy: light drains out of scene 1, no shapes
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
      // Closing beat, desktop only: the close-up puts the forearm and the chest
      // plate below the frame, so cards 02 and 03 move up the SAME body part --
      // upper arm, upper chest -- and the dots glide there during the move in.
      // Read off the closing frame at 2.28 (1440x900): upper arm at screen
      // (1065, 470), upper chest at (703, 500).
      const closeAnchors = isMobile
        ? []
        : [
            null,
            { px: 69.5 + anchorShift, py: 39.4 },  // 02 HANDS -> upper arm
            { px: 58.5 + anchorShift, py: 40.9 },  // 03 TORSO -> upper chest
          ];
      const anchors = [
        { px: 58.5 + anchorShift, py: 26.4 },   // 01 HEAD   — visor centre
        { px: 73.3 + anchorShift, py: 56.7 },   // 02 HANDS  — right forearm (see note above)
        { px: 58.5 + anchorShift, py: 54.1 },   // 03 TORSO  — centre of the chest plate
      ].map((a, i) => ({
        ...a,
        close: closeAnchors[i],
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
        if (isMobile) {
          gsap.set(canvas2WrapRef.current, { scale: sc, x: `${tx}%`, y: `${ty}%` });
        } else {
          scene2View.scale = sc;
          scene2View.x = `${tx}%`;
          scene2View.y = `${ty}%`;
        }
        // El corrimiento lateral del celular va en el RIG, no en el transform.
        // Con el canvas cerca de scale 1 un x en CSS lo corre hasta destapar
        // su propio borde -- deja de cubrir el cuadro y aparece una franja
        // transparente del lado contrario. El limite es |x| <= (S-1)/2, y a
        // S 1.167 eso da 8%: menos que el 14% que el paso necesita. En el rig
        // el canvas no se mueve y el limite desaparece.
        //
        // Las amplitudes bajaron a ~0.6 de las viejas: el mismo corrimiento en
        // pixeles que servia con el robot chico lo saca de cuadro ahora que es
        // un 30% mas grande. Se conserva el LADO de cada paso -- derecha,
        // derecha, izquierda, derecha, izquierda, izquierda -- que es lo que
        // da el vaiven entre tarjetas. En escritorio no hay rx y esto no corre.
        if (A.rx !== undefined && B.rx !== undefined) {
          botRig.x = BOT_HOME.x + lerp(A.rx, B.rx, f);
        }

        // vector-effect="non-scaling-stroke" makes stroke-dasharray screen-space,
        // so the connector length must be measured in px, not in viewBox units
        const W = sectionRef.current ? sectionRef.current.clientWidth : 1;
        const H = sectionRef.current ? sectionRef.current.clientHeight : 1;

        // re-project every anchor against the live transform
        // 0 through card 03's beat, 1 at the closing framing, and the glide in
        // between follows the same move the body is making.
        const kClose = i === BODY_STEPS.length - 2 ? f : 0;
        anchors.forEach((a, i) => {
          const apx = a.close ? lerp(a.px, a.close.px, kClose) : a.px;
          const apy = a.close ? lerp(a.py, a.close.py, kClose) : a.py;
          const x = 50 + (apx - 50) * sc + tx;
          const y = 50 + (apy - 50) * sc + ty;
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

      // Desktop chapter-2 mounts currently loaded (both models).
      const l2Desktop = () =>
        Object.keys(l2Ref.current)
          .filter((k) => k.startsWith("d:"))
          .map((k) => l2Ref.current[k]);

      // ---- directed gaze -----------------------------------------------------
      // Only the timeline steers the head; the cursor never does.
      const gaze = { x: 0, y: 0 };      // target written by the timeline
      const cur = { x: 0, y: 0 };       // what is actually applied, eased
      const applyGaze = () => {
        const heads = isMobile
          ? [app2Ref.current && app2Ref.current.findObjectByName
              ? app2Ref.current.findObjectByName("Head")
              : null]
          : l2Desktop().map((e) => e.head);
        cur.x += (gaze.x - cur.x) * 0.08;
        cur.y += (gaze.y - cur.y) * 0.08;
        heads.forEach((head) => {
          if (!head) return;
          head.rotation.x = cur.x;
          head.rotation.y = cur.y;
        });
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
      // CELULAR: el acercamiento sale del RIG, no de un transform sobre el
      // canvas. El runtime dimensiona el buffer con devicePixelRatio *
      // clientWidth y no ve los transforms, asi que subir el scale del canvas
      // agranda pixeles ya renderizados; agrandar el rig los RINDE. Medido en
      // un iPhone de 390x844 a DPR 2: el buffer es 780x1688 en los dos casos,
      // pero con rig 1.2 el cuerpo ocupa un 50% mas de ese buffer.
      //
      // La y baja con el rig a proposito. El rig escala alrededor de su origen
      // -- la cadera -- asi que agrandarlo solo empuja la corona fuera del
      // canvas por arriba; -83.56 la devuelve a p .05, y de paso manda la
      // CINTURA a p .936, donde ningun encuadre de la secuencia llega. No es
      // que los pasos la eviten: a este rig no se puede mostrar.
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

      // Scene 1's head has no choreography of its own — the directed gaze
      // only ever drove slot 2 — so it just stared straight ahead. It now
      // holds a default direction and wanders a little around it, always
      // easing back: right in white mode, left in dark, so the figure is
      // turned toward the side its own theme opens on.
      //
      // Two sine terms on periods that do not divide into each other, so the
      // drift never settles into a visible loop, and a 0.05 ease so it always
      // returns rather than snapping.
      const HEAD1_BASE = head1BaseRef.current;
      const head1 = { x: HEAD1_BASE.x, y: HEAD1_BASE.y };
      let head1T = 0;
      // ESCRITORIO: la cabeza sigue al mouse, escrita por nosotros en las DOS
      // escenas de la capa A. El look-at propio de la escena solo recibe los
      // eventos del canvas visible, asi que el oculto quedaba con la cabeza en
      // otra pose y el cambio de tema la hacia saltar. Mismo rango que el
      // look-at, medido: yaw -0.27 / +0.30 con el cursor a izquierda /
      // derecha; pitch -0.02 arriba, 0.087 al centro, 0.30 abajo. Sin cursor
      // todavia, la pose es la del centro.
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
        // En celular la capa A tiene dos escenas montadas y el tema decide
        // cual se ve: la cabeza que hay que mover es la de esa, no la de la
        // que esta en opacity-0.
        // Sin alterno cargado (fallo), el que se ve en claro es slot1.
        const h = isMobile && !darkModeRef.current && headAltRef.current ? headAltRef.current : head1Ref.current;
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
        // Mismo criterio que applyHead1: los brazos del montaje visible.
        if (isMobile) {
          const arms = !darkModeRef.current && armsAltRef.current.length ? armsAltRef.current : armsRef.current;
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

      // Where layer 2 fades in, in timeline seconds. Scene 2 wakes a little
      // before it (at 60% of the way there, in scroll progress) so its loop
      // has been drawing the framed robot for a while by the time it shows.
      const XFADE_AT = 0.5;
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
            const wake2 = p > (XFADE_AT / tl.duration()) * 0.6;
            if (wake2 !== awake2Ref.current) {
              awake2Ref.current = wake2;
              const apps = isMobile ? [app2Ref.current] : l2Desktop().map((e) => e.app);
              apps.forEach((a) => {
                try {
                  if (wake2) a?.play();
                  else a?.stop();
                } catch (e) { /* runtime without play()/stop() */ }
              });
            }
            if (p > 0.45 && !stopped1Ref.current) {
              stopped1Ref.current = true;
              // Los dos montajes de la capa A, no solo el de slot1: el
              // alterno renderiza igual aunque este en opacity-0.
              try { app1Ref.current?.stop(); } catch (e) { /* runtime without stop() */ }
              try { appAltRef.current?.stop(); } catch (e) { /* runtime without stop() */ }
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
              try { appAltRef.current?.play(); } catch (e) { /* runtime without play() */ }
            }
          },
        },
      });

      // Grey settles in ahead of the drain, so the order reads white -> grey
      // -> black instead of white -> black.
      tl.to(vignetteRef.current, { opacity: 1, duration: 0.20 }, 0.02);
      tl.to(wallTopRef.current, { opacity: 1, duration: 0.20 }, 0.02);

      // PHASE 1 exit: headline leaves, light drains to black, slight drift-in
      tl.to(headlineRef.current, { opacity: 0, y: -140, duration: 0.1 }, 0.06);
      tl.to(scrollCueRef.current, { opacity: 0, y: 20, duration: 0.06 }, 0.02);
      tl.to(drain, { t: 1, duration: 0.3, onUpdate: applyDrain }, 0.1);
      tl.to(overlayRef.current, { opacity: 1, duration: 0.34 }, 0.1);
      tl.to(
        isMobile ? canvasWrapRef.current : heroView,
        {
          scale: startScale * 0.96,
          x: fx1(isMobile ? -58 : heroDx, startScale * 0.96),
          y: endY,
          duration: 0.32,
          ease: "power1.inOut",
        },
        0.1
      );

      // PHASE 2: crossfade in darkness — chrome robot rises in EXTREME CLOSE-UP
      tl.to(splineLayerRef.current, { opacity: 0, duration: 0.12 }, XFADE_AT);
      tl.to(layer2Ref.current, { opacity: 1, duration: 0.12 }, XFADE_AT);
      tl.to(lift, { t: 1, duration: 0.16, onUpdate: applyLift }, XFADE_AT);

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
        tl.to(railRefs.current[i], { opacity: 1, duration: 0.05 }, cardAt);
      });

      // CLOSING: robot centres in the viewport, the head turns front, and the
      // three cards come back together with their three dashed connectors.
      const closeAt = isMobile ? 2.72 : 2.92;
      tl.to(body, { t: 5, duration: 0.30, ease: "power1.inOut" }, closeAt);
      tl.to(gaze, { ...(isMobile ? GAZE.closeMobile : GAZE.front), duration: 0.16, ease: "power2.inOut" }, closeAt);
      if (!isMobile) {
        [0, 1].forEach((i) => {
          tl.to(calloutRefs.current[i], { opacity: 1, y: 0, duration: 0.12, ease: "power1.out" }, 3.16);
          tl.set(lineRefs.current[i], { opacity: 1 }, 3.16);
          tl.to(draw[i], { p: 1, duration: 0.14, ease: "power1.inOut" }, 3.16);
          tl.to(dotRefs.current[i], { opacity: 1, duration: 0.05 }, 3.30);
          tl.to(railRefs.current[i], { opacity: 1, duration: 0.05 }, 3.16);
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
      // Se insiste por rAF. Probe hacerlo sincrono y NO alcanza: el spacer
      // del pin tarda en asentarse y una sola pasada deja la pagina en 132.
      // Medido, sin el loop el desvio es permanente en vez de ~250ms.
      let tries = 0;
      const put = () => {
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
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
          const l2Apps = isMobile
            ? [app2Ref.current]
            : Object.keys(l2Ref.current)
                .filter((k) => k.startsWith("d:"))
                .map((k) => l2Ref.current[k].app);
          if (visible) {
            l2Apps.forEach((a) => a?.play?.());
            // El montaje alterno de la capa A sigue la misma regla que slot1:
            // es la otra mitad del mismo capitulo, no una escena aparte.
            if (!stopped1Ref.current) {
              app1Ref.current?.play?.();
              appAltRef.current?.play?.();
            }
          } else {
            app1Ref.current?.stop?.();
            appAltRef.current?.stop?.();
            l2Apps.forEach((a) => a?.stop?.());
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
      if (restoreRaf) cancelAnimationFrame(restoreRaf);
      // Never keep writing rotations into an Application that is being torn
      // down: the ticker below is removed, but these refs outlive the effect.
      armsRef.current = [];
      botRef.current = null;
      head1Ref.current = null;
      clearTimeout(refresh);
      if (removeMouse) removeMouse();
      heroVisibility.disconnect();
      if (lenis) lenis.off("scroll", onScroll);
      gsap.ticker.remove(applyGazeRef.current);
      ctx.revert();
    };
    // Depende de sceneUrl, NO de darkMode, y sceneUrl ya no cambia con el
    // tema en ningun ancho: cambiarlo no reconstruye nada -- ni la timeline,
    // ni el pin, ni los contextos WebGL.
  }, [isMobile, sceneUrl]);

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
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[rgb(var(--page-surface))]"
    >
      {/* Layer A — live dark scene over the painted wall */}
      <div ref={splineLayerRef} className="absolute inset-0">
        <div
          ref={canvasWrapRef}
          data-testid="hero-canvas-zoom"
          className="hero-drain absolute inset-0 will-change-transform"
        >
          {/* The wall sits OUTSIDE the drift wrappers on purpose: it is the
              backdrop, not part of the scene, so the idle float and the mouse
              parallax must not move it. Only the canvas should drift. */}
          <div ref={wallRef} className="absolute inset-0 bg-[rgb(var(--wall-a))]">
            <div
              ref={wallTopRef}
              className="pointer-events-none absolute inset-0 bg-[rgb(var(--wall-b))]"
            />
          </div>

          {!failed && (
            <div
              className="absolute inset-0"
              data-testid="spline-canvas-wrap"
            >
              <div ref={parallax1Ref} className="absolute inset-0">
                <div ref={idle1Ref} className="absolute inset-0">
                  {/* Las dos escenas viven montadas a la vez y la visibilidad
                      se decide por CLASE, no desmontando: las keys son fijas,
                      asi que el toggle no remonta nada ni pide un contexto
                      WebGL nuevo. Desmontar la que no se ve devolveria
                      exactamente el bug que esto evita. */}
                  <div
                    ref={slot1BoxRef}
                    className={`absolute inset-0 ${showAlt ? hiddenCls : "opacity-100"}`}
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
                      {/* slot1 es el hero: la timeline, la vista y el loader
                          cuelgan de el. Si no carga, el hero pasa al render
                          estatico, como si hubiera vencido el watchdog. */}
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
                    </div>
                  </div>
                  <div
                    ref={altBoxRef}
                    className={`absolute inset-0 ${showAlt ? "opacity-100" : hiddenCls}`}
                  >
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
                      {/* La capa A sigue teniendo la escena de slot1 abajo,
                          asi que perder esta no deja el hero sin robot:
                          showAlt se apaga y en claro se ve el plateado. */}
                      <SceneBoundary key={HERO_ALT_URL} name="hero alt" onFail={() => markDead("alt")}>
                        <Spline scene={HERO_ALT_URL} onLoad={handleAltLoad} />
                      </SceneBoundary>
                    </div>
                  </div>
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
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 bg-[rgb(var(--page-surface))]"
      />

      {/* Layer C — chrome scene, lazily mounted, rising out of darkness */}
      <div ref={layer2Ref} className="pointer-events-none absolute inset-0">
        <div ref={layer2InnerRef} className="hero-lift absolute inset-0">
          {/* Same decoupling as scene 1: the glow and the fallback stay put
              while only the canvas drifts. The blend wrapper keeps its place
              inside layer2Inner (whose filter is the stacking context the
              blend resolves against), with the drift transforms nested inside
              it rather than wrapping the whole layer. */}
          <div className="absolute left-1/2 top-1/2 h-[90vh] w-[90vh] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgb(var(--ink) / 0.07),transparent_62%)]" />

          {/* Static render ONLY if the live scene fails. It used to stand in
              while the scene was loading too, and that is what showed up in
              the crossfade: a black, unframed robot cut at the hip, dimmed by
              the lift filter into something that reads as a negative. While
              loading, the layer shows its own darkness and nothing else. */}
          {scene2Failed && (
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
                   {isMobile ? (
                   <div className="absolute inset-0">
                    <SceneBoundary key={slot2Url} name="layer 2 mobile" onFail={() => setScene2Failed(true)}>
                      <Spline scene={slot2Url} onLoad={onScene2Load("m:" + slot2Url)} />
                    </SceneBoundary>
                   </div>
                   ) : (
                     L2_DESKTOP_URLS.map((url) => (
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
                         {/* Si falla uno, se ve el otro (ver l2VisibleUrl);
                             si fallan los dos, el PNG. */}
                         <SceneBoundary name={"layer 2 " + url} onFail={() => markDead("d:" + url)}>
                           <Spline scene={url} onLoad={onScene2Load("d:" + url)} />
                         </SceneBoundary>
                       </ReleasingBox>
                     ))
                   )}
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

      {/* kinetic headline (phase 1) — sits just above the nav dock.

          EL TRATAMIENTO LO DECIDE QUE ROBOT HAY DETRAS, no el breakpoint. Y
          eso sale del tema en los dos anchos: claro carga el robot NEGRO
          (escena 1) y oscuro el PLATEADO (escena 2), tanto en escritorio
          -- donde sceneUrl sigue al tema -- como en celular, donde la capa A
          monta las dos y el tema elige cual se ve.

          Sobre el NEGRO, difference funciona: el texto se invierte contra la
          pared clara y queda blanco sobre el cuerpo, asi que cruza el borde
          de la silueta sin perderse de ningun lado.

          Sobre el PLATEADO no puede funcionar, y no es cuestion de ajustar el
          valor: difference contra un gris medio DEVUELVE gris medio. El
          subtitulo desaparecia entero y el medio del titular se lavaba, que
          es justo donde cruza el torso. Ahi va blanco solido, sin blend y sin
          sombras. */}
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

      {/* Brand and status sit OUTSIDE the z-10 UI layer: a z-index on an
          ancestor makes a stacking context that isolates any blend.

          The brand takes the headline's treatment, decided by WHICH ROBOT is
          behind, i.e. by the theme, at both widths. Light (black robot on
          white): white ink with mix-blend-difference, so it goes black over
          the wall and page and white over the body. Dark (silver robot on
          black): solid white, no blend -- difference against mid-grey metal
          returns mid-grey. No halo either way: the old one came from
          data-theme="light" here resolving text-halo to a white glow. */}
      <motion.div
        variants={uiFade} custom={0} initial="hidden"
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
        variants={uiFade} custom={1} initial="hidden"
        animate={revealed ? "show" : "hidden"}
        data-theme={ch2Theme}
        className="absolute right-6 top-6 sm:right-10 sm:top-8 flex items-center gap-2"
      >
        <span data-testid="hero-status-dot" className="h-1.5 w-1.5 rounded-full bg-[#2E6FF2] animate-pulse-dot" />
        <span data-testid="hero-status" className="font-display text-[13px] uppercase tracking-[0.02em] text-ink/[0.83] text-halo">
          STATUS: {profile.status}
        </span>
      </motion.div>


      {/* Skip intro. Only before the sequence has been seen once — after
          that the dock owns this spot and the visitor already has every
          section a click away. Lands just past the pin rather than at a
          section id, so the marquee is not skipped along with the hero.

          Mismo criterio que el titular, y por el mismo motivo: cae sobre el
          robot, y cual robot lo decide el tema en los dos anchos. Sobre el
          NEGRO (claro) difference funciona; sobre el PLATEADO (oscuro) devuelve
          gris medio y el boton se lava contra el torso. Ahi va blanco solido
          -- solido de verdad, no el /70 de escritorio, que era la otra mitad
          del lavado. */}
      {!journeyDone && (
        <button
          data-testid="skip-intro"
          onClick={() => {
            const y = heroEndRef.current || window.innerHeight * 10;
            if (window.__lenis) window.__lenis.scrollTo(y + 4, { duration: 1.1 });
            else window.scrollTo({ top: y + 4, behavior: "smooth" });
          }}
          className={`pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] left-1/2 flex -translate-x-1/2 items-center gap-2 px-4 py-2 font-display text-[11px] uppercase tracking-[0.24em] transition-opacity duration-300 sm:bottom-10 ${
            isMobile || darkMode
              ? "text-white"
              : "text-ink hover:text-ink sm:text-white/70 sm:hover:text-white"
          } ${darkMode ? "" : "mix-blend-difference"}`}
        >
          Skip intro
        </button>
      )}

      {/* Scroll cue. The hero IS the scroll — a visitor who lands, clicks a
          project and leaves never sees either scene, so it has to say so. It
          fades on the first beat, once the message has landed. Difference
          blend for the same reason the headline uses one: it has to stay
          legible over the wall, over the robot and in both themes. On a
          phone it sits on the RIGHT: the robot is framed to the left there,
          so that is the side with free wall. */}
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

      {/* Layer D — UI. The z-10 is what keeps the cards and the rail from
          blending into the scene; the marks that DO need to blend (brand,
          status, headline, features header, scroll cue) live outside it. */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* top-right status */}
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
            {/* Panel SOLIDO. Con bg-surface/70 + backdrop-blur el brazo que
                pasaba por detras se veia a traves, gris y corrido: era el
                "fantasma plateado". Sobre el fondo liso no cambia nada
                (--surface es el mismo color que --page-surface). */}
            <div className="corner-frame cut-corner relative border border-ink/[0.13] bg-surface p-6 pt-5 sm:p-9 sm:pt-6">
              <div className="select-none font-display text-[7rem] font-light leading-[0.85] text-outline-grey">
                {f.num}
              </div>
              <div className="mt-7 flex items-baseline gap-3">
                <span className="font-display text-[13px] uppercase tracking-[0.02em] text-ink/[0.83] text-halo">
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
                  className="font-display text-[13px] tracking-[0.02em] text-ink opacity-[0.45]"
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
