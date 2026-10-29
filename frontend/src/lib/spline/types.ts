import type { Application, SPEObject } from "@splinetool/runtime";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** A CSS-equivalent view: scale about the centre, pan as % of the frame. */
export interface ViewTransform {
  scale: number;
  x: string;
  y: string;
}

/** The runtime's three.js camera, as far as this project touches it. */
export interface RuntimeCamera {
  position: Vec3;
  quaternion?: object;
  rotation?: object;
  zoom: number;
  projectionMatrix: { elements: number[] };
  updateProjectionMatrix: (...args: unknown[]) => unknown;
  /** Set by applyView: the view re-applied on every projection update. */
  __view?: { zoom: number; ox: number; oy: number };
  __viewHooked?: boolean;
}

/** A node of the runtime's three.js scene graph. */
export interface SceneNode {
  name?: string;
  rotation: Vec3;
  children?: SceneNode[];
}

/** An Application plus the private fields this project relies on. */
export type SplineApp = Application & {
  _camera?: RuntimeCamera;
  _scene?: SceneNode;
  scene?: SceneNode;
};

export type SplineObject = SPEObject;
