import type { Environment } from '@tagadapay/headless-sdk';

/** Written by `pnpm seed`. Restart `pnpm dev` after seeding. */
export const STORE_ID = import.meta.env.VITE_STORE_ID ?? '';

export const ENVIRONMENT: Environment =
  (import.meta.env.VITE_ENVIRONMENT as Environment | undefined) ?? 'production';

export const TEE_VARIANT_ID = import.meta.env.VITE_TEE_VARIANT_ID ?? '';
export const CAP_OFFER_ID = import.meta.env.VITE_CAP_OFFER_ID ?? '';
export const CAP_DOWNSELL_OFFER_ID = import.meta.env.VITE_CAP_DOWNSELL_OFFER_ID ?? '';
export const TOTE_OFFER_ID = import.meta.env.VITE_TOTE_OFFER_ID ?? '';

export const TUTORIAL_URL =
  'https://docs.tagada.io/developer-tools/funnel-demos/basic-post-purchase';

export const EXAMPLE_REPO_URL =
  'https://github.com/TagadaPay/examples/tree/main/basic-post-purchase';
