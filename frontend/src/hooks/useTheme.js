import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "msgc-theme";

/**
 * White is the default: a first-time visitor with no stored choice gets the
 * light site regardless of what their OS prefers. The system preference is
 * deliberately NOT consulted — the light treatment is the designed default,
 * and dark is the opt-in.
 */
const DEFAULT_THEME = "light";

const ThemeContext = createContext({ theme: DEFAULT_THEME, toggle: () => {} });

const readStored = () => {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch (e) {
    // private mode / blocked site data — fall through to the default
    return null;
  }
};

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
  const [theme, setTheme] = useState(() => readStored() || DEFAULT_THEME);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // nothing to do — the choice just will not survive a reload
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
