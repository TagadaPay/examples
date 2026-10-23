const KEY = 'vip-tag-offers.tags';

/**
 * Demo stand-in for CRM customer tags. Hosted funnels read real tags from
 * the customer record (`customer.hasTag`, `customer.hasAnyTag`); here the
 * landing toggle writes them to sessionStorage so you can walk both branches.
 */
export function getTags(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

export function setTags(tags: string[]) {
  sessionStorage.setItem(KEY, JSON.stringify(tags));
}

export function hasTag(tag: string): boolean {
  return getTags().includes(tag);
}
