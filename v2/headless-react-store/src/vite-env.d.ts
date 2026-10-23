/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORE_ID?: string;
  readonly VITE_ENVIRONMENT?: 'production' | 'development';
  readonly VITE_GOOGLE_AUTOCOMPLETE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
