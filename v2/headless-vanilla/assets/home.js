import { tagada } from './client.js';
import { BRAND } from './config.js';
import { addToCart, getCart, setQuantity, removeLine, formatPrice } from './cart.js';

document.getElementById('brand').textContent = BRAND.name;
document.getElementById('brand-tagline').textContent = BRAND.tagline;

const productsEl = document.getElementById('products');
const cartLinesEl = document.getElementById('cart-lines');
const cartCountEl = document.getElementById('cart-count');
const subtotalEl = document.getElementById('cart-subtotal');
const checkoutBtn = document.getElementById('checkout-btn');
const errorEl = document.getElementById('checkout-error');

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
async function loadProducts() {
  try {
    const products = await tagada.catalog.listProducts();
    if (!products.length) {
      productsEl.innerHTML = `<p class="muted">No products found. Run <code>tagada-init</code> to seed your store.</p>`;
      return;
    }
    productsEl.innerHTML = products
      .flatMap((p) =>
        (p.variants ?? [p]).map((v) => {
          const price = v.prices?.[0]?.currencyOptions ?? v.currencyOptions ?? {};
          const firstCurrency = Object.keys(price)[0] ?? 'USD';
          const cents = price[firstCurrency]?.amount ?? 0;
          const variant = {
            variantId: v.id ?? p.id,
            priceId: v.prices?.[0]?.id ?? p.prices?.[0]?.id,
            productName: p.name,
            variantName: v.name ?? p.name,
            unitAmount: cents,
            currency: firstCurrency,
            imageUrl: v.imageUrl ?? p.imageUrl ?? '',
            quantity: 1,
          };
          return /* html */ `
            <article class="card">
              ${variant.imageUrl
                ? `<div class="thumb"><img src="${variant.imageUrl}" alt=""></div>`
                : '<div class="thumb"></div>'}
              <h3>${escape(variant.productName)}</h3>
              ${variant.variantName !== variant.productName
                ? `<p class="muted small">${escape(variant.variantName)}</p>`
                : ''}
              <p class="price">${formatPrice(variant.unitAmount, variant.currency)}</p>
              <button class="btn-secondary" data-add='${JSON.stringify(variant)}'>
                Add to cart
              </button>
            </article>`;
        }),
      )
      .join('');

    productsEl.querySelectorAll('button[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        addToCart(JSON.parse(btn.dataset.add));
        renderCart();
      });
    });
  } catch (err) {
    productsEl.innerHTML = `<p class="error">Could not load catalog: ${escape(err.message)}</p>`;
  }
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
function renderCart() {
  const state = getCart();
  cartCountEl.textContent = String(state.itemCount);
  subtotalEl.textContent = formatPrice(state.subtotal, state.currency);
  checkoutBtn.disabled = state.lines.length === 0;

  if (!state.lines.length) {
    cartLinesEl.innerHTML = '<p class="muted">Your cart is empty.</p>';
    return;
  }

  cartLinesEl.innerHTML = state.lines
    .map(
      (l) => /* html */ `
        <div class="line">
          <div class="thumb sm">${l.imageUrl ? `<img src="${l.imageUrl}" alt="">` : ''}</div>
          <div class="line-body">
            <strong>${escape(l.productName)}</strong>
            <small class="muted">${escape(l.variantName)}</small>
          </div>
          <div class="qty">
            <button data-dec="${l.variantId}">−</button>
            <span>${l.quantity}</span>
            <button data-inc="${l.variantId}">+</button>
          </div>
          <strong>${formatPrice(l.unitAmount * l.quantity, l.currency)}</strong>
          <button class="link" data-remove="${l.variantId}">Remove</button>
        </div>`,
    )
    .join('');

  cartLinesEl.querySelectorAll('[data-inc]').forEach((b) =>
    b.addEventListener('click', () => {
      const line = state.lines.find((l) => l.variantId === b.dataset.inc);
      setQuantity(b.dataset.inc, (line?.quantity ?? 0) + 1);
      renderCart();
    }),
  );
  cartLinesEl.querySelectorAll('[data-dec]').forEach((b) =>
    b.addEventListener('click', () => {
      const line = state.lines.find((l) => l.variantId === b.dataset.dec);
      setQuantity(b.dataset.dec, Math.max(0, (line?.quantity ?? 0) - 1));
      renderCart();
    }),
  );
  cartLinesEl.querySelectorAll('[data-remove]').forEach((b) =>
    b.addEventListener('click', () => {
      removeLine(b.dataset.remove);
      renderCart();
    }),
  );
}

// ---------------------------------------------------------------------------
// Checkout — createSessionUrl handles session creation + URL building.
// ---------------------------------------------------------------------------
checkoutBtn.addEventListener('click', async () => {
  errorEl.textContent = '';
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Starting secure checkout…';
  try {
    const state = getCart();
    const items = state.lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      ...(l.priceId ? { priceId: l.priceId } : {}),
    }));

    const { url } = await tagada.checkout.createSessionUrl({
      items,
      currency: state.currency,
      checkoutPath: '/checkout.html',
    });

    window.location.href = url;
  } catch (err) {
    errorEl.textContent = err?.message ?? String(err);
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Checkout';
  }
});

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

renderCart();
loadProducts();
