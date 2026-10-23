import type { Environment } from '@tagadapay/headless-sdk';

/** Written by `pnpm seed`. Restart `pnpm dev` after seeding. */
export const STORE_ID = import.meta.env.VITE_STORE_ID ?? '';

export const ENVIRONMENT: Environment =
  (import.meta.env.VITE_ENVIRONMENT as Environment | undefined) ?? 'production';

export const PRODUCT_ID = import.meta.env.VITE_PRODUCT_ID ?? '';
export const VARIANT_ID = import.meta.env.VITE_VARIANT_ID ?? '';
export const FUNNEL_ID = import.meta.env.VITE_FUNNEL_ID ?? '';

export const DOCS_URL = 'https://docs.tagada.io/developer-tools/rx/headless-sdk';

export const EXAMPLE_REPO_URL = 'https://github.com/TagadaPay/examples/tree/main/rx-storefront';
