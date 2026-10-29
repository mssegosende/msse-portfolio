import { SPLINE_SCENE_URL, SPLINE_SCENE_2_URL } from "../../data/portfolioData";

// El modelo de cada tema: negro (escena 1) en claro, plateado (escena 2) en
// oscuro.
export const themeModel = (dark) => (dark ? SPLINE_SCENE_2_URL : SPLINE_SCENE_URL);

// Escritorio, capa 2: los dos modelos montados a la vez, key fija.
export const L2_DESKTOP_URLS = [SPLINE_SCENE_2_URL, SPLINE_SCENE_URL];
