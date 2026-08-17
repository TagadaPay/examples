import type { Environment } from '@tagadapay/headless-sdk';

/** Written by `pnpm seed`. Restart `pnpm dev` after seeding. */
export const STORE_ID = import.meta.env.VITE_STORE_ID ?? '';

export const ENVIRONMENT: Environment =
  (import.meta.env.VITE_ENVIRONMENT as Environment | undefined) ?? 'production';

export const TEE_VARIANT_ID = import.meta.env.VITE_TEE_VARIANT_ID ?? '';
export const VIP_OFFER_ID = import.meta.env.VITE_VIP_OFFER_ID ?? '';
export const WELCOME_OFFER_ID = import.meta.env.VITE_WELCOME_OFFER_ID ?? '';

export const TUTORIAL_URL = 'https://docs.tagada.io/developer-tools/funnel-demos/vip-tag-offers';

export const EXAMPLE_REPO_URL = 'https://github.com/TagadaPay/examples/tree/main/vip-tag-offers';
