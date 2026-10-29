import type { SceneNode, SplineApp, SplineObject } from "./types";

// The robot rig (`Bot` and the arm joints), shared by both scenes.

// The scenes ship the rig in different poses (scene 2 holds its arms higher
// and bends them further). Scene 1's pose is canonical. It is reapplied every
// frame because each scene animates its own pose back.
const POSE_HOME = { arm: -0.306, elbowY: -0.018, forearm: -0.471 };

// The scenes also place `Bot` differently (x -2.75 vs +68.25). Normalizing it
// in scene units lands the robot in the same spot in both themes at any width;
// offsetting the canvas in CSS only held at one viewport width.
export const BOT_HOME = { x: -2.75477817251231, y: 25.67686585695104 };

/** Collect the arm joints once; looking them up by name every frame is wasteful. */
export const findBot = (app: SplineApp | null): SplineObject | null => {
  try {
    return app?.findObjectByName?.("Bot") || null;
  } catch {
    return null;
  }
};

export const collectArms = (app: SplineApp | null): SceneNode[] => {
  const out: SceneNode[] = [];
  try {
    const walk = (o: SceneNode | undefined, d: number): void => {
      if (!o || d > 9) return;
      if (o.name === "arm" || o.name === "elbow" || o.name === "forearm") out.push(o);
      (o.children || []).forEach((ch) => walk(ch, d + 1));
    };
    walk(app?._scene || app?.scene, 0);
  } catch {
    /* runtime without an inspectable graph */
  }
  return out;
};

export const applyPose = (joints: SceneNode[]): void => {
  for (const j of joints) {
    if (j.name === "arm") j.rotation.x = POSE_HOME.arm;
    else if (j.name === "elbow") j.rotation.y = POSE_HOME.elbowY;
    else j.rotation.x = POSE_HOME.forearm;
  }
};

/** Place a scene's rig at a known spot. */
export const placeBot = (
  app: SplineApp | null,
  { scale, y }: { scale?: number; y?: number } = {},
): void => {
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
  } catch {
    /* older runtime, or a scene without the named rig */
  }
};
