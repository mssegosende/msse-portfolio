import { SPLINE_SCENE_URL, SPLINE_SCENE_2_URL } from "../../data/portfolioData";

// One model per theme: the black robot (scene 1) in light, the silver one in dark.
export const themeModel = (dark: boolean): string => (dark ? SPLINE_SCENE_2_URL : SPLINE_SCENE_URL);

// Desktop chapter 2 mounts both models; the theme only picks which one shows.
export const L2_DESKTOP_URLS: readonly string[] = [SPLINE_SCENE_2_URL, SPLINE_SCENE_URL];
