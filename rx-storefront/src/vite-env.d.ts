/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORE_ID?: string;
  readonly VITE_ENVIRONMENT?: 'production' | 'development';
  readonly VITE_PRODUCT_ID?: string;
  readonly VITE_VARIANT_ID?: string;
  readonly VITE_FUNNEL_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
