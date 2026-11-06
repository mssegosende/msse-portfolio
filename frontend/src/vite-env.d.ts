/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional override for the contact service's base URL, without a trailing
   * slash. Unset: same origin in production, http://localhost:8000 in dev.
   */
  readonly VITE_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
