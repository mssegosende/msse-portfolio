import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOBILE_LAYOUT_QUERY } from "./layout";

// CELULAR: el cambio de tema RECARGA la pagina. En iPhone las escenas de Spline
// descartadas no se liberan nunca (medido en produccion con ?debug=1: muere
// en el segundo cambio, aun con 25s entre los dos y con 0 escenas vivas),
// asi que cualquier cambio en el lugar junta basura hasta que iOS mata el
// proceso. Recargar es lo unico que garantiza memoria limpia. Ver HANDOFF.
//
// El tema y la posicion viajan en sessionStorage, de un solo uso. La posicion
// va como progreso del pin (o distancia pasado su final), no en px: el largo
// del pin es +=780% del alto de ventana, y en iOS ese alto cambia con la
// barra de URL entre una carga y la otra.

const KEY = "theme-reload";

// Un pedido mas viejo que esto no es de esta recarga (p. ej. volver a abrir la
// pestana mas tarde): se ignora.
const MAX_AGE_MS = 30000;

// El unico pin de la pagina es la secuencia de ScrollScene.
const pinTrigger = () => ScrollTrigger.getAll().find((st) => st.pin);

// Se lee UNA vez, al importar el modulo: StrictMode corre los inicializadores
// dos veces y la segunda ya no encontraria la clave.
const take = () => {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || Date.now() - data.t > MAX_AGE_MS) return null;
    if (data.theme !== "dark" && data.theme !== "light") return null;
    return data;
  } catch (e) {
    return null;
  }
};

export const pendingThemeReload = typeof window !== "undefined" ? take() : null;

export const themeNeedsReload = () =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_LAYOUT_QUERY).matches;

// Guarda el tema nuevo y donde esta el visitante, y recarga. Si no hay
// sessionStorage (modo privado viejo, bloqueado) devuelve false y el que
// llama cambia el tema en el lugar, como antes.
export const reloadWithTheme = (theme) => {
  const y = window.scrollY;
  const st = pinTrigger();
  const pos = !st
    ? { y }
    : y <= st.end
      ? { pin: Math.max(0, Math.min(1, (y - st.start) / Math.max(1, st.end - st.start))) }
      : { after: y - st.end };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ theme, ...pos, t: Date.now() }));
  } catch (e) {
    return false;
  }
  window.__memProbeLog?.(`THEME -> ${theme} (reload)`);
  window.location.reload();
  return true;
};

// La posicion guardada, en px de ESTA carga. Se llama con el pin ya armado.
export const restoredScrollY = () => {
  const d = pendingThemeReload;
  if (!d) return null;
  if (d.pin == null && d.after == null) return typeof d.y === "number" ? d.y : null;
  const st = pinTrigger();
  if (!st) return null;
  return d.pin != null ? st.start + d.pin * (st.end - st.start) : st.end + d.after;
};
