import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_THEME, ThemeContext } from "@/hooks/useTheme";
import {
  pendingThemeReload,
  reloadWithTheme,
  themeNeedsReload,
  type Theme,
} from "@/lib/themeReload";

/**
 * Every load starts in light, the designed default; the toggle lasts for the
 * session and is not persisted. Exception: on phones the toggle reloads the
 * page (lib/themeReload), and that reload starts in the chosen theme.
 */
const INITIAL_THEME = pendingThemeReload?.theme || DEFAULT_THEME;

/** The attribute on <html> drives both index.css and Tailwind's `dark:`. */
const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
};

// Apply before the first paint, so a reload into dark never flashes light.
if (typeof document !== "undefined" && INITIAL_THEME !== DEFAULT_THEME) applyTheme(INITIAL_THEME);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
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
