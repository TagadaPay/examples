/**
 * Format a price stored in minor units (cents) for display.
 *
 *   formatPrice(3900, 'USD') → "$39.00"
 *   formatPrice(3500, 'EUR') → "€35.00"
 */
export function formatPrice(minorAmount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(minorAmount / 100);
}

/** Truncate a long ID for display: "ord_abcdef…1234" */
export function shortId(id: string | null | undefined, head = 6, tail = 4): string {
  if (!id) return '';
  if (id.length <= head + tail + 1) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}
