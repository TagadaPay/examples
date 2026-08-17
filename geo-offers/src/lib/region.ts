export type Region = 'us' | 'eu' | 'row';

const KEY = 'geo-offers.region';

/**
 * Demo stand-in for real geo detection. Hosted funnels resolve the visitor's
 * country server-side (`customer.fromCountry`, `customer.fromEU`); here the
 * browser timezone gives a default and the landing chips let you override it.
 */
export function detectRegion(): Region {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  if (tz.startsWith('Europe/')) return 'eu';
  if (tz.startsWith('America/')) return 'us';
  return 'row';
}

export function getRegion(): Region {
  const saved = sessionStorage.getItem(KEY);
  if (saved === 'us' || saved === 'eu' || saved === 'row') return saved;
  return detectRegion();
}

export function setRegion(region: Region) {
  sessionStorage.setItem(KEY, region);
}
