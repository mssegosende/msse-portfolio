import { createContext, useContext } from "react";

export const DEFAULT_THEME = "light";

export const ThemeContext = createContext({ theme: DEFAULT_THEME, toggle: () => {} });

/** The current theme ("light" | "dark") and its toggle (see ThemeProvider). */
export const useTheme = () => useContext(ThemeContext);
