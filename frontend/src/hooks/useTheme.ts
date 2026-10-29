import { createContext, useContext } from "react";
import type { Theme } from "@/lib/themeReload";

export const DEFAULT_THEME: Theme = "light";

export interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  toggle: () => {},
});

/** The current theme and its toggle (see ThemeProvider). */
export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
