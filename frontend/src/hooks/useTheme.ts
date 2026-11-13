import { createContext, useContext } from "react";
import type { Theme } from "@/lib/themeReload";

// The CRT redesign opens in phosphor (María Sol, 12 Nov), whatever the
// system preference.
export const DEFAULT_THEME: Theme = "dark";

/**
 * The live site is dark only (María Sol, 13 Nov): no theme toggle in the
 * menu, and a saved "light" preference is ignored. Light mode itself stays in
 * the code (it moves to its own branch); true brings the toggle back.
 */
export const THEME_TOGGLE = false;

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
