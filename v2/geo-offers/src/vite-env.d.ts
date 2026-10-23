/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORE_ID?: string;
  readonly VITE_ENVIRONMENT?: 'production' | 'development';
  readonly VITE_TEE_VARIANT_ID?: string;
  readonly VITE_CAP_OFFER_ID?: string;
  readonly VITE_CAP_DOWNSELL_OFFER_ID?: string;
  readonly VITE_TOTE_OFFER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
