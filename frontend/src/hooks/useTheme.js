import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Every page load starts in light, always: the light treatment is the
 * designed default and dark is the opt-in. The toggle works for the rest of
 * the session, but the choice is not persisted — neither the OS preference
 * nor a previous visit's choice is consulted.
 */
const DEFAULT_THEME = "light";

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

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
