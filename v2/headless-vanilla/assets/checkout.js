import { tagada, CheckoutModule } from './client.js';
import { clearCart, formatPrice } from './cart.js';

const $ = (id) => document.getElementById(id);
const banner = $('resume-banner');
const loadingEl = $('loading');
const formEl = $('checkout-form');
const summaryEl = $('summary');
const errorEl = $('error');
const submitBtn = $('submit-btn');

// ---------------------------------------------------------------------------
// Step 0: handle 3DS / processor return.
// `maybeResumeFromUrl()` reads ?paymentAction=requireAction&paymentId=...
// from the URL, polls until terminal, cleans the URL, and returns the
// resolved result. If we're not returning from a redirect, it returns null
// and the page renders normally.
// ---------------------------------------------------------------------------
const resumed = await tagada.payment.maybeResumeFromUrl();
if (resumed) {
  if (resumed.status === 'succeeded') {
    clearCart();
    const orderId = resumed.order?.id ?? resumed.payment?.id ?? '';
    window.location.replace(`./thank-you.html?orderId=${encodeURIComponent(orderId)}`);
    throw new Error('navigating'); // stop further script execution
  } else if (resumed.status === 'failed') {
    banner.hidden = false;
    banner.className = 'banner banner-error';
    banner.textContent = `Payment failed: ${resumed.error}`;
  }
}

// ---------------------------------------------------------------------------
// Step 1: read tokens from URL.
// `parseTokensFromUrl()` understands both `?sessionToken=` (SDK
// convention) and `?token=` (Tagada-hosted convention).
// ---------------------------------------------------------------------------
const tokens = CheckoutModule.parseTokensFromUrl();
if (!tokens) {
  loadingEl.innerHTML = `<p class="error">Missing checkout token. <a href="./index.html">Back to cart →</a></p>`;
  throw new Error('missing tokens');
}

// ---------------------------------------------------------------------------
// Step 2: load the session and render the summary.
// ---------------------------------------------------------------------------
let session;
try {
  session = await tagada.checkout.loadSession(tokens.checkoutToken, tokens.sessionToken);
} catch (err) {
  loadingEl.innerHTML = `<p class="error">${err.message ?? err}</p>`;
  throw err;
}

renderSummary(session);
loadingEl.hidden = true;
formEl.hidden = false;

// Pre-fill known customer fields if any.
if (session.customer) {
  $('email').value = session.customer.email ?? '';
  $('firstName').value = session.customer.firstName ?? '';
  $('lastName').value = session.customer.lastName ?? '';
}

function renderSummary(s) {
  const items = s.items
    .map(
      (i) => `
        <li class="summary-line">
          <div class="thumb sm">${i.imageUrl ? `<img src="${i.imageUrl}">` : ''}</div>
          <div class="grow">
            <strong>${escape(i.productName)}</strong>
            <small class="muted">${escape(i.variantName)} × ${i.quantity}</small>
          </div>
          <span>${formatPrice(i.totalAmount, i.currency)}</span>
        </li>`,
    )
    .join('');
  summaryEl.innerHTML = `
    <ul class="summary-list">${items}</ul>
    <dl>
      <dt>Subtotal</dt><dd>${formatPrice(s.totals.subtotal, s.totals.currency)}</dd>
      <dt>Shipping</dt><dd>${formatPrice(s.totals.shipping, s.totals.currency)}</dd>
      <dt>Tax</dt><dd>${formatPrice(s.totals.tax, s.totals.currency)}</dd>
      <dt class="strong">Total</dt><dd class="strong">${formatPrice(s.totals.total, s.totals.currency)}</dd>
    </dl>`;
}

// ---------------------------------------------------------------------------
// Step 3: submit — collect data, tokenize card, processPayment.
// ---------------------------------------------------------------------------
formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Paying…';

  try {
    const customer = {
      email: $('email').value.trim(),
      firstName: $('firstName').value.trim(),
      lastName: $('lastName').value.trim(),
    };
    const address = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      line1: $('line1').value.trim(),
      line2: $('line2').value.trim() || undefined,
      city: $('city').value.trim(),
      state: $('state').value.trim(),
      postalCode: $('postalCode').value.trim(),
      country: $('country').value,
    };

    // Step 3a: persist customer + addresses on the session.
    await tagada.checkout.updateCustomerAndAddress(session.id, {
      customer,
      shippingAddress: address,
    });

    // Step 3b: pick a shipping rate (if rates exist for this address).
    const rates = await tagada.checkout.getShippingRates(session.id);
    if (rates.length) {
      await tagada.checkout.selectShippingRate(session.id, rates[0].id);
    }

    // Step 3c: tokenize the card. The SDK calls Basis Theory directly —
    // raw card data never reaches your servers.
    const { tagadaToken } = await tagada.payment.tokenizeCard({
      cardNumber: $('cardNumber').value.replace(/\s+/g, ''),
      expiryDate: $('cardExp').value,
      cvc: $('cardCvc').value,
      cardholderName: $('cardName').value,
    });

    // Step 3d: charge. processPayment handles 3DS / processor redirects
    // automatically — on a redirect it navigates the browser and the
    // top-of-page maybeResumeFromUrl() picks up the return.
    const result = await tagada.payment.processPayment({
      checkoutSessionId: session.id,
      tagadaToken,
      paymentMethod: 'credit-card',
    });

    if (result.status === 'succeeded') {
      clearCart();
      const orderId = result.order?.id ?? result.payment?.id ?? '';
      window.location.replace(`./thank-you.html?orderId=${encodeURIComponent(orderId)}`);
      return;
    }
    if (result.status === 'requires_redirect') {
      // The SDK will navigate to result.redirectUrl from inside the
      // hook in React, but in vanilla we redirect ourselves.
      if (result.method === 'POST' && result.postData) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = result.redirectUrl;
        for (const [k, v] of Object.entries(result.postData)) {
          const i = document.createElement('input');
          i.type = 'hidden';
          i.name = k;
          i.value = v;
          form.appendChild(i);
        }
        document.body.appendChild(form);
        form.submit();
      } else {
        window.location.href = result.redirectUrl;
      }
      return;
    }

    showError(result.error ?? `Unexpected status: ${result.status}`);
  } catch (err) {
    showError(err?.message ?? String(err));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Pay';
  }
});

function showError(msg) {
  errorEl.hidden = false;
  errorEl.textContent = msg;
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
