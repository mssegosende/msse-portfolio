import type { RuntimeCamera, SplineApp, Vec3, ViewTransform } from "./types";

// Camera control for the Spline scenes: desktop framing through the
// projection (zoom and pan) and cameras pinned against each file's intro.

// Desktop framing is done by the camera, not by scaling the canvas in CSS,
// which rendered fewer pixels than it displayed. The wrapper stays at
// VIEW_CSS_SCALE and the camera applies zoom and a 2D pan through the
// projection's off-axis terms. 1.3, not 1: the "Built with Spline" badge is
// drawn inside the canvas and enters the frame below ~1.2.
export const VIEW_CSS_SCALE = 1.3;
const CAM_BASE_ZOOM = 2;
// Scene 1 renders at the wrapper's scale, so it ends up 1:1 on screen.
export const OVERSAMPLE_1 = VIEW_CSS_SCALE;

// Chapter 2's buffer is 1.7x its box (desktop).
export const OVERSAMPLE = 1.7;

/**
 * Apply a CSS-equivalent zoom (scale about the centre) and pan (x/y in % of
 * the frame) to a scene's camera. The values live on the camera and are
 * re-applied inside updateProjectionMatrix: the runtime recomputes the
 * projection on resize and during its intro, and a once-per-frame write lost
 * that race in Safari (the robot showed unframed for a few seconds).
 */
export const applyView = (app: SplineApp | null, v: ViewTransform): void => {
  const cam = app?._camera;
  if (!cam || !cam.projectionMatrix || typeof cam.updateProjectionMatrix !== "function") return;
  try {
    // NDC runs -1..1 across the canvas, y up: a pan of f of the canvas is 2f.
    cam.__view = {
      zoom: (CAM_BASE_ZOOM * v.scale) / VIEW_CSS_SCALE,
      ox: (-2 * parseFloat(v.x)) / 100 / VIEW_CSS_SCALE,
      oy: (2 * parseFloat(v.y)) / 100 / VIEW_CSS_SCALE,
    };
    if (!cam.__viewHooked) {
      const update = cam.updateProjectionMatrix;
      cam.updateProjectionMatrix = function (this: RuntimeCamera, ...args: unknown[]) {
        const w = this.__view;
        if (w) this.zoom = w.zoom;
        const out = update.apply(this, args);
        if (w) {
          const e = this.projectionMatrix.elements;
          e[8] = w.ox;
          e[9] = w.oy;
        }
        return out;
      };
      cam.__viewHooked = true;
    }
    cam.updateProjectionMatrix();
  } catch {
    /* runtime without an inspectable camera */
  }
};

// Each scene file ships a Start event that animates its camera (position and
// a slight tilt) to a final pose, and play() replays it. Both scenes start
// from different cameras, so framing depended on the theme, on load time and
// on HOME. Pinning position and rotation removes the intro entirely.
//
// Phone hero: a point on the black robot's intro path, slightly pulled back
// from the reference framing.
export const HERO_CAM_MOBILE: Vec3 = { x: 0, y: 208.2, z: 616 };
// Desktop hero: closer and higher than the final camera, which lowers the
// robot in frame without moving the canvas.
export const HERO_CAM_DESKTOP: Vec3 = { x: 0, y: 178.2, z: 660 };

// Chapter 2: the intro's final pose, which every chapter 2 framing was
// measured against.
export const CAM_FINAL: Vec3 = { x: 0, y: 146.98, z: 1000 };
// The intro's settled rotation (identical in every scene and layout).
const CAM_EULER_X = 0.006996317664543058;
const CAM_QUAT = { x: 0.003498151697713782, y: 0, z: 0, w: 0.9999938814486315 };

/** Pin a scene's camera so its own Start transition cannot move or tilt it. */
export const pinCamera = (app: SplineApp | null, pos: Vec3): void => {
  const pin = (obj: object, key: string, value: number) =>
    Object.defineProperty(obj, key, { get: () => value, set: () => {}, configurable: true });
  try {
    const cam = app?._camera;
    if (!cam?.position) return;
    (["x", "y", "z"] as const).forEach((ax) =>
      Object.defineProperty(cam.position, ax, {
        get: () => pos[ax],
        set: () => {},
        configurable: true,
      }),
    );
    // The matrix is composed from the quaternion's backing fields, and the
    // Euler keeps its own copy in sync from them: pin both, so neither path
    // can bring the intro's tilt back.
    const q = cam.quaternion;
    if (q)
      (["x", "y", "z", "w"] as const).forEach((k) =>
        pin(q, "_" + k in q ? "_" + k : k, CAM_QUAT[k]),
      );
    const r = cam.rotation;
    if (r)
      (
        [
          ["x", CAM_EULER_X],
          ["y", 0],
          ["z", 0],
        ] as const
      ).forEach(([k, v]) => pin(r, "_" + k in r ? "_" + k : k, v));
  } catch {
    /* runtime without an inspectable camera */
  }
};
