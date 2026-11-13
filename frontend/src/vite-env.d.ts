/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional override for the contact service's base URL, without a trailing
   * slash. Unset: same origin in production, http://localhost:8000 in dev.
   */
  readonly VITE_BACKEND_URL?: string;
  /**
   * Cloudflare Turnstile's site key (public). Unset: Turnstile is off. Read at
   * build time, so setting it in Vercel takes a redeploy.
   */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
