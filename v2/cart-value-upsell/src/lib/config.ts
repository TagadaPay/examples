import type { Environment } from '@tagadapay/headless-sdk';

/** Written by `pnpm seed`. Restart `pnpm dev` after seeding. */
export const STORE_ID = import.meta.env.VITE_STORE_ID ?? '';

export const ENVIRONMENT: Environment =
  (import.meta.env.VITE_ENVIRONMENT as Environment | undefined) ?? 'production';

export const TEE_VARIANT_ID = import.meta.env.VITE_TEE_VARIANT_ID ?? '';
export const HOODIE_OFFER_ID = import.meta.env.VITE_HOODIE_OFFER_ID ?? '';
export const SOCKS_OFFER_ID = import.meta.env.VITE_SOCKS_OFFER_ID ?? '';

/** Orders at or above this (cents) get the premium upsell. */
export const PREMIUM_THRESHOLD = 5000;

export const TUTORIAL_URL = 'https://docs.tagada.io/developer-tools/funnel-demos/cart-value-upsell';

export const EXAMPLE_REPO_URL = 'https://github.com/TagadaPay/examples/tree/main/cart-value-upsell';
