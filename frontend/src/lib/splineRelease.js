// Free a Spline scene for real after dispose().
//
// @splinetool/runtime 2.0.54 keeps every disposed scene alive through two
// module-level registries that are never emptied:
//   1. WebGPU only: three.js node-pipeline caches retain each renderer, and
//      the renderer retains its Application.
//   2. Both backends: the video module keeps every video player (and through
//      it the whole scene) in a global Map.
// Those registries are out of reach, so this empties what they point to:
// captureScene() before unmount, then releaseVideos() and scrubScene() after
// dispose. Emptying the graph leaves any surviving reference holding a shell.
//
// Objects shared by every scene (e.g. the DFG_LUT texture) must never be
// emptied; excludeShared() detects them by comparing two loaded scenes.
//
// Relies on private runtime internals. Whenever @splinetool/runtime or
// @splinetool/react-spline changes, re-check with a heap test (phone layout,
// five theme swaps, forced GC between them: heap and ArrayBuffers must stay
// flat). If the names change this finds nothing and the leak returns.

// Safety cap for the player search; a scene has a few thousand objects.
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

// Objects seen in two scenes at once: shared by the runtime, never emptied.
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
