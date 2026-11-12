import type { SplineApp } from "./types";

// Where the robot's head is on screen (María Sol, 12 Nov: scene 1's crosshair
// tracks it). The runtime's scene graph is three.js: the `Head` group's mesh
// has a bounding box; its 8 corners go through the mesh's world matrix and
// the scene camera (view, then projection, which carries applyView's framing)
// to normalised device coordinates, then onto the canvas's box on screen.

interface Vec3Like {
  x: number;
  y: number;
  z: number;
  set: (x: number, y: number, z: number) => Vec3Like;
  applyMatrix4: (m: unknown) => Vec3Like;
  clone: () => Vec3Like;
}
interface Node3 {
  name?: string;
  isMesh?: boolean;
  children?: Node3[];
  matrixWorld?: unknown;
  position?: Vec3Like;
  geometry?: {
    boundingBox?: { min: Vec3Like; max: Vec3Like } | null;
    computeBoundingBox?: () => void;
  };
}
interface Camera3 {
  matrixWorldInverse?: unknown;
  projectionMatrix?: unknown;
}

const heads = new WeakMap<object, { mesh: Node3; v: Vec3Like } | null>();

const findHeadMesh = (app: SplineApp): { mesh: Node3; v: Vec3Like } | null => {
  if (heads.has(app)) return heads.get(app) ?? null;
  let found: { mesh: Node3; v: Vec3Like } | null = null;
  try {
    const walk = (o: Node3 | undefined, inHead: boolean, d: number): void => {
      if (!o || found || d > 16) return;
      const here = inHead || o.name === "Head";
      if (here && o.isMesh && o.geometry && o.position) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox?.();
        if (o.geometry.boundingBox) found = { mesh: o, v: o.position.clone() };
        return;
      }
      (o.children || []).forEach((c) => walk(c, here, d + 1));
    };
    walk((app._scene || app.scene) as Node3 | undefined, false, 0);
  } catch {
    found = null;
  }
  heads.set(app, found);
  return found;
};

export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The head's box on screen (client px), or null when it can't be read. */
export const headScreenRect = (app: SplineApp | null | undefined): ScreenRect | null => {
  if (!app?.canvas) return null;
  const cam = app._camera as Camera3 | undefined;
  const head = findHeadMesh(app);
  if (!head || !cam?.matrixWorldInverse || !cam.projectionMatrix) return null;
  const box = head.mesh.geometry?.boundingBox;
  if (!box) return null;
  const rect = app.canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const v = head.v;
  for (let c = 0; c < 8; c++) {
    v.set(
      c & 1 ? box.max.x : box.min.x,
      c & 2 ? box.max.y : box.min.y,
      c & 4 ? box.max.z : box.min.z,
    )
      .applyMatrix4(head.mesh.matrixWorld)
      .applyMatrix4(cam.matrixWorldInverse)
      .applyMatrix4(cam.projectionMatrix);
    const sx = rect.left + ((v.x + 1) / 2) * rect.width;
    const sy = rect.top + ((1 - v.y) / 2) * rect.height;
    x0 = Math.min(x0, sx);
    x1 = Math.max(x1, sx);
    y0 = Math.min(y0, sy);
    y1 = Math.max(y1, sy);
  }
  if (!Number.isFinite(x0 + y0 + x1 + y1)) return null;
  return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
};
