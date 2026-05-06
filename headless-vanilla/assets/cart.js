/**
 * Tiny localStorage cart. Same shape as the React example so the two
 * are easy to compare.
 */
const KEY = 'tagada-vanilla-cart';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? { lines: [] };
  } catch {
    return { lines: [] };
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getCart() {
  const state = read();
  state.itemCount = state.lines.reduce((s, l) => s + l.quantity, 0);
  state.subtotal = state.lines.reduce((s, l) => s + l.unitAmount * l.quantity, 0);
  state.currency = state.lines[0]?.currency ?? 'USD';
  return state;
}

export function addToCart(line) {
  const state = read();
  const existing = state.lines.find((l) => l.variantId === line.variantId);
  if (existing) {
    existing.quantity += line.quantity;
  } else {
    state.lines.push(line);
  }
  write(state);
}

export function setQuantity(variantId, quantity) {
  const state = read();
  const line = state.lines.find((l) => l.variantId === variantId);
  if (!line) return;
  if (quantity <= 0) {
    state.lines = state.lines.filter((l) => l.variantId !== variantId);
  } else {
    line.quantity = quantity;
  }
  write(state);
}

export function removeLine(variantId) {
  const state = read();
  state.lines = state.lines.filter((l) => l.variantId !== variantId);
  write(state);
}

export function clearCart() {
  localStorage.removeItem(KEY);
}

export function formatPrice(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format((cents ?? 0) / 100);
}
