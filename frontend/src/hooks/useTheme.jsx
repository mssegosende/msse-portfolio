import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { pendingThemeReload, reloadWithTheme, themeNeedsReload } from "@/lib/themeReload";

/**
 * Every load starts in light, the designed default; the toggle lasts for the
 * session and is not persisted. Exception: on phones the toggle reloads the
 * page (lib/themeReload.js), and that reload starts in the chosen theme.
 */
const DEFAULT_THEME = "light";
const INITIAL_THEME = pendingThemeReload?.theme || DEFAULT_THEME;

const ThemeContext = createContext({ theme: DEFAULT_THEME, toggle: () => {} });

/** The attribute on <html> drives both index.css and Tailwind's `dark:`. */
const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
};

// Apply before the first paint, so a reload into dark never flashes light.
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
