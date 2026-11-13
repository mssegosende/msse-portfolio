// Which heavy thing owns the screen. Scene 3's clips play while it is in view,
// and the Spline scenes (useHeroTimeline's playback sync) stay paused then, so
// the 3D renderer and the video decoder never compete for the same frames.

let projectsInView = false;

export const setProjectsInView = (on: boolean) => {
  projectsInView = on;
};

// The video gallery covers the page: every scene idles while it is open.
let galleryOpen = false;

export const setGalleryOpen = (on: boolean) => {
  galleryOpen = on;
};

/** Whether the Spline scenes should idle: scene 3's clips or the gallery own the frames. */
export const scenesIdle = () => projectsInView || galleryOpen;
