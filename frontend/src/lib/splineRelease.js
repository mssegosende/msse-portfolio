// SOLTAR DE VERDAD UNA ESCENA DE SPLINE DESPUES DEL DISPOSE.
//
// BUG DEL RUNTIME DE SPLINE (@splinetool/runtime 2.0.54): Application.dispose()
// no alcanza para que el GC junte la escena. Medido con heap snapshots (build
// de produccion, camino de celular, 5 cambios de tema): cada escena que se
// cargo queda viva para siempre, por dos registros a nivel de modulo del
// runtime que nunca se vacian:
//
//   1. Solo WebGPU: caches globales del pipeline de nodos de three.js (la
//      textura compartida DFG_LUT, con un listener "dispose" por renderer
//      que no se saca nunca; un WeakMap de luces/sombras; el cache de render
//      targets de AO) retienen cada renderer, y el renderer retiene su
//      Application por el closure de onBackgroundWorkReady.
//   2. Los dos backends: el modulo de video (runtime-video-*.js) mete cada
//      reproductor en un Map global que solo crece. El reproductor guarda
//      `object` (el Object3D del video -> parent -> la escena entera) y el
//      <video> en loop, que ademas retiene los assets compartidos por su
//      onloadeddata.
//
// Esos registros no se pueden alcanzar desde afuera, asi que se vacia lo que
// retienen: antes de desmontar se toma (captureScene) el renderer, su backend,
// el gestor de assets compartidos, los reproductores/videos y TODOS los
// objetos del grafo de la escena; despues del dispose, releaseVideos para los
// videos y scrubScene para el resto. Vaciar el grafo es lo que corta de raiz:
// cualquier cache que todavia apunte a un objeto (una luz, el Object3D de un
// reproductor que no se encontro) se queda con una cascara aislada, no con la
// escena entera. En WebGPU hace falta ademas vaciar materiales, geometrias y
// texturas: un closure de nodo cacheado retiene el ultimo NodeBuilder de cada
// renderer, y el builder apunta al material y la geometria que compilaba.
//
// Cuidado con lo COMPARTIDO: el pipeline tiene objetos de modulo que usan
// todas las escenas (p. ej. la textura DFG_LUT); vaciar uno romperia las
// escenas que vengan. Por eso excludeShared compara las capturas del hero y
// de la capa 2 -- el mismo archivo cargado en dos Application --: lo que
// aparece en las dos es compartido y no se toca nunca. Hasta que no hubo una
// comparacion asi, materiales/geometrias/texturas no se vacian.
//
// TOCA INTERNOS PRIVADOS DEL RUNTIME (_renderer, backend, isPlayVideoAction,
// videoElement, object). Hay que volver a verificarlo -- el test de heap con
// 5 cambios de tema, ver HANDOFF -- cada vez que se actualice
// @splinetool/runtime o @splinetool/react-spline. Si los nombres cambian, esto
// deja de encontrar cosas y no rompe nada: la fuga vuelve.

// Tope de objetos a recorrer al buscar reproductores de video: una escena de
// Spline tiene unos miles; el tope solo evita un recorrido sin fin.
const WALK_BUDGET = 200000;

const plainTags = new Set(["[object Object]", "[object Array]", "[object Map]", "[object Set]"]);

/**
 * Walk an Application's object graph (own data properties, Maps, Sets,
 * arrays) and collect its video players and <video> elements. Skips DOM nodes,
 * typed arrays and host objects (GPU, WebGL, window...). Getters are never
 * called: only data descriptors are followed.
 */
const findVideos = (root) => {
  const players = new Set();
  const videos = new Set();
  const seen = new WeakSet();
  const queue = [root];
  let head = 0;
  const push = (v) => {
    if (!v || typeof v !== "object") return;
    if (seen.has(v)) return;
    seen.add(v);
    if (typeof HTMLVideoElement !== "undefined" && v instanceof HTMLVideoElement) {
      videos.add(v);
      return;
    }
    if (typeof Node !== "undefined" && v instanceof Node) return;
    if (ArrayBuffer.isView(v) || v instanceof ArrayBuffer) return;
    if (!plainTags.has(Object.prototype.toString.call(v))) return;
    queue.push(v);
  };
  while (head < queue.length && head < WALK_BUDGET) {
    const o = queue[head++];
    try {
      if (o.isPlayVideoAction === true) players.add(o);
      if (o instanceof Map) {
        o.forEach((val, key) => {
          push(key);
          push(val);
        });
        continue;
      }
      if (o instanceof Set) {
        o.forEach(push);
        continue;
      }
      for (const k of Object.keys(o)) {
        const d = Object.getOwnPropertyDescriptor(o, k);
        if (d && "value" in d) push(d.value);
      }
    } catch (e) {
      /* exotic object (proxy, revoked...) */
    }
  }
  players.forEach((p) => p.videoElement && videos.add(p.videoElement));
  return { players: [...players], videos: [...videos] };
};

/** Every object in a three.js graph, by `children`, before anything cuts it. */
const collectGraph = (root) => {
  const out = [];
  const seen = new Set();
  const stack = root ? [root] : [];
  while (stack.length && out.length < WALK_BUDGET) {
    const o = stack.pop();
    if (!o || typeof o !== "object" || seen.has(o)) continue;
    seen.add(o);
    out.push(o);
    if (Array.isArray(o.children)) for (const c of o.children) stack.push(c);
  }
  return out;
};

/**
 * Materials, geometries and textures hanging off the graph objects. Textures
 * are found with a short walk of each material (its layers keep them a few
 * levels down); the walk never descends into a texture.
 */
const collectOwned = (objects) => {
  const out = new Set();
  const addTextures = (root) => {
    const seen = new Set();
    const stack = [[root, 0]];
    while (stack.length && seen.size < 5000) {
      const [o, depth] = stack.pop();
      if (!o || typeof o !== "object" || seen.has(o)) continue;
      seen.add(o);
      if (o !== root && o.isTexture === true) {
        out.add(o);
        continue;
      }
      if (depth >= 5 || ArrayBuffer.isView(o) || (typeof Node !== "undefined" && o instanceof Node)) continue;
      if (!plainTags.has(Object.prototype.toString.call(o))) continue;
      for (const k of Object.keys(o)) {
        const d = Object.getOwnPropertyDescriptor(o, k);
        if (d && "value" in d) stack.push([d.value, depth + 1]);
      }
    }
  };
  objects.forEach((o) => {
    [].concat(o.material || []).forEach((m) => {
      if (m && typeof m === "object") {
        out.add(m);
        addTextures(m);
      }
    });
    if (o.geometry && typeof o.geometry === "object") out.add(o.geometry);
  });
  return [...out];
};

/** Before unmount: everything dispose() is about to drop but the runtime keeps. */
export const captureScene = (app) => {
  if (!app) return null;
  let renderer = null;
  let backend = null;
  let assets = null;
  let objects = [];
  let owned = [];
  try {
    renderer = app._renderer || null;
    backend = renderer?.backend || null;
    assets = app._sharedAssetsManager || null;
    objects = collectGraph(app._scene);
    owned = collectOwned(objects);
  } catch (e) {
    /* runtime without inspectable internals */
  }
  const { players, videos } = findVideos(app);
  return { app, renderer, backend, assets, objects, owned, players, videos };
};

// Objetos vistos en dos escenas a la vez: compartidos por el runtime. Nunca se
// vacian (ver arriba).
const sharedObjects = new WeakSet();
let sharedKnown = false;

/**
 * Drop from the captures anything two scenes share. With only one scene
 * captured and no earlier comparison, skip materials/geometries/textures
 * entirely: there is nothing to tell a shared one apart.
 */
export const excludeShared = (captures) => {
  const live = captures.filter(Boolean);
  if (live.length >= 2) {
    const count = new Map();
    live.forEach((c) =>
      new Set([...c.objects, ...c.owned, c.assets].filter(Boolean)).forEach((o) =>
        count.set(o, (count.get(o) || 0) + 1)
      )
    );
    count.forEach((n, o) => n > 1 && sharedObjects.add(o));
    sharedKnown = true;
  }
  live.forEach((c) => {
    c.objects = c.objects.filter((o) => !sharedObjects.has(o));
    c.owned = sharedKnown ? c.owned.filter((o) => !sharedObjects.has(o)) : [];
    if (c.assets && sharedObjects.has(c.assets)) c.assets = null;
  });
};

/** Stop a <video> for good: no playback, no decoder, no handler closures. */
const stopVideo = (v) => {
  try {
    v.pause();
    v.onloadeddata = null;
    v.removeAttribute("src");
    v.load();
  } catch (e) {
    /* already gone */
  }
};

/** After dispose: cut the video players loose and stop their videos. */
export const releaseVideos = (held) => {
  if (!held) return;
  held.players.forEach((p) => {
    try {
      p.clearDelay?.();
      p.videoElement = undefined;
      p.object = null;
      p.data = null;
    } catch (e) {
      /* frozen or exotic */
    }
  });
  held.videos.forEach(stopVideo);
  held.players = [];
  held.videos = [];
};

const scrub = (o) => {
  if (!o) return;
  for (const k of Object.keys(o)) {
    try {
      const d = Object.getOwnPropertyDescriptor(o, k);
      if (d && "value" in d && d.writable) o[k] = undefined;
    } catch (e) {
      /* non-configurable */
    }
  }
};

/**
 * After dispose, once the runtime's own async work has settled: empty the
 * disposed Application, its renderer and the renderer's backend, so the
 * module-level caches that still point at them hold shells, not the scene.
 */
export const scrubScene = (held) => {
  if (!held) return;
  releaseVideos(held);
  held.owned.forEach(scrub);
  held.objects.forEach(scrub);
  scrub(held.assets);
  scrub(held.backend);
  scrub(held.renderer);
  scrub(held.app);
  held.objects = [];
  held.owned = [];
  held.assets = null;
  held.app = null;
  held.renderer = null;
  held.backend = null;
};
