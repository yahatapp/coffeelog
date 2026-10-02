/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALLOWED_HOSTS?: string;
  readonly VITE_LIFF_ID?: string;
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  readonly VITE_CLARITY_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
