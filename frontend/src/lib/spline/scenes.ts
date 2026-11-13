import { SPLINE_SCENE_URL, SPLINE_SCENE_2_URL } from "../../data/portfolioData";

/** The two robot models: the black one (scene 1's file) and the silver one. */
export const BLACK_ROBOT = SPLINE_SCENE_URL;
export const SILVER_ROBOT = SPLINE_SCENE_2_URL;

/**
 * Which robot each theme shows. María Sol, 13 Nov (an experiment): dark, the
 * main version, shows the black robot under the phosphor tint and light the
 * silver one. false switches back to the silver robot in dark and the black
 * one in light.
 */
export const BLACK_ROBOT_IN_DARK = true;

/** The theme's robot model. */
export const themeModel = (dark: boolean): string =>
  dark === BLACK_ROBOT_IN_DARK ? BLACK_ROBOT : SILVER_ROBOT;

// Desktop chapter 2 mounts both models; the theme only picks which one shows.
export const L2_DESKTOP_URLS: readonly string[] = [SILVER_ROBOT, BLACK_ROBOT];
