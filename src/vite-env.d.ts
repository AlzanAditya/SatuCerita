/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Domain produksi tanpa trailing slash, mis. https://satucerita.zanxa.studio */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
