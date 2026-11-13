import { useCallback, useEffect, useRef, useState } from "react";

// Cloudflare Turnstile on the contact form, ready but off until its site key
// is set (VITE_TURNSTILE_SITE_KEY at build time, with TURNSTILE_SECRET_KEY on
// the server). Off: no script, no widget, no token; the server sends every
// message as [REVIEW]. On: the widget runs with appearance "interaction-only",
// invisible unless Cloudflare needs a click, and its token goes with the form.

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      appearance?: "always" | "execute" | "interaction-only";
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** The site key, or "" when Turnstile is off. */
export const turnstileSiteKey = (): string => import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

let loading: Promise<TurnstileApi> | null = null;
const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("no turnstile"));
    script.onerror = () => {
      loading = null;
      reject(new Error("turnstile script failed"));
    };
    document.head.appendChild(script);
  });
  return loading;
};

/**
 * Renders the widget into `el` (a callback ref's element, so a remounted form
 * gets a new widget) when the site key is set. `token` is the
 * current one (null until Cloudflare issues it); `reset` asks for a new one
 * after a submit (each token is single-use).
 */
export const useTurnstile = (el: HTMLElement | null) => {
  const sitekey = turnstileSiteKey();
  const [token, setToken] = useState<string | null>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    if (!sitekey || !el) return undefined;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widget.current = api.render(el, {
          sitekey,
          appearance: "interaction-only",
          callback: setToken,
          "expired-callback": () => setToken(null),
          "error-callback": () => setToken(null),
        });
      })
      // Script blocked or offline: no token, and the server refuses the
      // message with a clear error; nothing to do here.
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [el, sitekey]);

  const reset = useCallback(() => {
    setToken(null);
    if (widget.current) window.turnstile?.reset(widget.current);
  }, []);

  return { enabled: !!sitekey, token, reset };
};
