import { STORE_ID, ENVIRONMENT } from './config.js';

/**
 * The IIFE bundle on the CDN exposes `window.TagadaHeadless` once
 * `<script src=".../tagada-headless.min.js">` has loaded.
 *
 * `window.TagadaHeadless.create(...)` is an alias for
 * `createHeadlessClient(...)` — the entry point we use everywhere.
 */
export const tagada = window.TagadaHeadless.create({
  storeId: STORE_ID,
  environment: ENVIRONMENT,
});

/** `CheckoutModule` exposes static helpers like `parseTokensFromUrl`. */
export const CheckoutModule = window.TagadaHeadless.CheckoutModule;
