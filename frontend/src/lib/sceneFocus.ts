// Which heavy thing owns the screen. Scene 3's clips play while it is in view,
// and the Spline scenes (useHeroTimeline's playback sync) stay paused then, so
// the 3D renderer and the video decoder never compete for the same frames.

let projectsInView = false;

export const setProjectsInView = (on: boolean) => {
  projectsInView = on;
};

export const isProjectsInView = () => projectsInView;
