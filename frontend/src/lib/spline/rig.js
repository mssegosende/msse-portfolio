// El rig del robot (objeto `Bot` y articulaciones de los brazos), el mismo en
// las dos escenas.

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
export const BOT_HOME = { x: -2.75477817251231, y: 25.67686585695104 };

/** Collect every arm joint once; findObjectByName per frame would be silly. */
export const findBot = (app) => {
  try {
    return app?.findObjectByName?.("Bot") || null;
  } catch (e) {
    return null;
  }
};

export const collectArms = (app) => {
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

export const applyPose = (joints) => {
  for (let i = 0; i < joints.length; i++) {
    const j = joints[i];
    if (j.name === "arm") j.rotation.x = POSE_HOME.arm;
    else if (j.name === "elbow") j.rotation.y = POSE_HOME.elbowY;
    else j.rotation.x = POSE_HOME.forearm;
  }
};

/** Place a scene's rig at a known spot. Both scenes share the same rig. */
export const placeBot = (app, { scale, y } = {}) => {
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
