/**
 * The tab icon follows the browser's light or dark mode (María Sol, 13 Nov):
 * navy on a light tab, white on a dark one. favicon.svg carries the same rule
 * as a media query, but inside a favicon Chrome answers it from the system's
 * setting, not from its own mode; the page's matchMedia follows the browser,
 * so the icon is swapped here, and again whenever the mode changes.
 */
export const FAVICON = { dark: "/favicon-dark.svg", light: "/favicon-light.svg" } as const;

export function followBrowserScheme(doc: Document = document, win: Window = window): void {
  const link = doc.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
  if (!link || typeof win.matchMedia !== "function") return;
  const dark = win.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    const href = dark.matches ? FAVICON.dark : FAVICON.light;
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
  };
  apply();
  dark.addEventListener("change", apply);
}
