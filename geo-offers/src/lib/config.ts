import type { Environment } from '@tagadapay/headless-sdk';

/** Written by `pnpm seed`. Restart `pnpm dev` after seeding. */
export const STORE_ID = import.meta.env.VITE_STORE_ID ?? '';

export const ENVIRONMENT: Environment =
  (import.meta.env.VITE_ENVIRONMENT as Environment | undefined) ?? 'production';

export const TEE_VARIANT_ID = import.meta.env.VITE_TEE_VARIANT_ID ?? '';
export const US_OFFER_ID = import.meta.env.VITE_US_OFFER_ID ?? '';
export const EU_OFFER_ID = import.meta.env.VITE_EU_OFFER_ID ?? '';
export const ROW_OFFER_ID = import.meta.env.VITE_ROW_OFFER_ID ?? '';

export const TUTORIAL_URL = 'https://docs.tagada.io/developer-tools/funnel-demos/geo-offers';

export const EXAMPLE_REPO_URL = 'https://github.com/TagadaPay/examples/tree/main/geo-offers';
