import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { pendingThemeReload, reloadWithTheme, themeNeedsReload } from "@/lib/themeReload";

/**
 * Every page load starts in light, always: the light treatment is the
 * designed default and dark is the opt-in. The toggle works for the rest of
 * the session, but the choice is not persisted — neither the OS preference
 * nor a previous visit's choice is consulted.
 *
 * Unica excepcion: en celular el toggle recarga la pagina (lib/themeReload.js)
 * y esa recarga, y solo esa, arranca en el tema pedido.
 */
const DEFAULT_THEME = "light";
const INITIAL_THEME = pendingThemeReload?.theme || DEFAULT_THEME;

const ThemeContext = createContext({ theme: DEFAULT_THEME, toggle: () => {} });

/**
 * The attribute goes on <html>, which is what index.css and the Tailwind
 * `dark:` selector both key off. It is written synchronously on mount so the
 * first paint already carries the right palette.
 */
const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
};

// La recarga hacia oscuro no puede pintar primero en claro: el efecto de abajo
// corre despues del primer pintado.
if (typeof document !== "undefined" && INITIAL_THEME !== DEFAULT_THEME) applyTheme(INITIAL_THEME);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(INITIAL_THEME);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    if (themeNeedsReload() && reloadWithTheme(theme === "dark" ? "light" : "dark")) return;
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, [theme]);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
