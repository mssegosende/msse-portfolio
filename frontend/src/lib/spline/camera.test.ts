import { describe, expect, it, vi } from "vitest";
import { applyView, pinCamera, VIEW_CSS_SCALE } from "./camera";
import type { RuntimeCamera, SplineApp } from "./types";

// A stand-in for the runtime camera: recomputing the projection resets the
// off-axis terms, as three.js does.
const makeCamera = () => {
  const recompute = vi.fn(function (this: RuntimeCamera) {
    this.projectionMatrix.elements[8] = 0;
    this.projectionMatrix.elements[9] = 0;
  });
  const cam = {
    position: { x: 0, y: 0, z: 0 },
    quaternion: { _x: 0, _y: 0, _z: 0, _w: 1 },
    rotation: { _x: 0.2, _y: 0.1, _z: 0 },
    zoom: 1,
    projectionMatrix: { elements: new Array<number>(16).fill(0) },
    updateProjectionMatrix: recompute,
  } as RuntimeCamera & {
    quaternion: Record<string, number>;
    rotation: Record<string, number>;
  };
  return { cam, recompute, app: { _camera: cam } as unknown as SplineApp };
};

describe("applyView", () => {
  it("turns a CSS scale and pan into camera zoom and off-axis terms", () => {
    const { cam, app } = makeCamera();
    applyView(app, { scale: VIEW_CSS_SCALE, x: "10%", y: "-20%" });
    expect(cam.zoom).toBeCloseTo(2);
    expect(cam.projectionMatrix.elements[8]).toBeCloseTo(-0.2 / VIEW_CSS_SCALE);
    expect(cam.projectionMatrix.elements[9]).toBeCloseTo(-0.4 / VIEW_CSS_SCALE);
  });

  it("survives the runtime recomputing the projection", () => {
    const { cam, app } = makeCamera();
    applyView(app, { scale: 2.6, x: "5%", y: "5%" });
    // The runtime's own resize or intro: resets zoom, then recomputes.
    cam.zoom = 1;
    cam.updateProjectionMatrix();
    expect(cam.zoom).toBeCloseTo(4);
    expect(cam.projectionMatrix.elements[8]).toBeCloseTo(-0.1 / VIEW_CSS_SCALE);
  });

  it("wraps updateProjectionMatrix only once", () => {
    const { cam, recompute, app } = makeCamera();
    applyView(app, { scale: 1, x: "0%", y: "0%" });
    applyView(app, { scale: 2, x: "0%", y: "0%" });
    recompute.mockClear();
    cam.updateProjectionMatrix();
    expect(recompute).toHaveBeenCalledTimes(1);
  });

  it("ignores an app without an inspectable camera", () => {
    expect(() => applyView(null, { scale: 1, x: "0%", y: "0%" })).not.toThrow();
    expect(() => applyView({} as SplineApp, { scale: 1, x: "0%", y: "0%" })).not.toThrow();
  });
});

describe("pinCamera", () => {
  it("holds position and rotation against later writes", () => {
    const { cam, app } = makeCamera();
    pinCamera(app, { x: 1, y: 2, z: 3 });
    cam.position.x = 99;
    cam.quaternion._x = 0.5;
    cam.rotation._y = 0.5;
    expect(cam.position).toMatchObject({ x: 1, y: 2, z: 3 });
    expect(cam.quaternion._x).toBeCloseTo(0.0035);
    expect(cam.rotation._y).toBe(0);
  });
});
