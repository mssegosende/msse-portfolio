/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the contact service, without a trailing slash. */
  readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
