import { tagada } from './client.js';
import { formatPrice } from './cart.js';

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Step 0: handle 3DS / processor return for an upsell.
// `maybeResumeFromUrl()` polls the payment, cleans the URL, and returns
// the resolved status. We re-render the upsells either way so accepted
// offers reflect the new state.
// ---------------------------------------------------------------------------
const params = new URLSearchParams(window.location.search);
let orderId = params.get('orderId') ?? '';

const resumed = await tagada.payment.maybeResumeFromUrl();
if (resumed) {
  if (resumed.status === 'succeeded' && resumed.order?.id) {
    // The resumed order is the upsell order, not the main one. The
    // original `orderId` query param is still our parent.
  } else if (resumed.status === 'failed') {
    showUpsellError(resumed.error);
  }
}

if (orderId) {
  $('order-id').innerHTML = `Order <strong>${escape(orderId.slice(0, 6))}…${escape(orderId.slice(-6))}</strong>`;
}

// ---------------------------------------------------------------------------
// List upsells.
// ---------------------------------------------------------------------------
async function loadUpsells() {
  if (!orderId) return;
  let offers;
  try {
    offers = await tagada.offers.listOffers({ type: 'upsell' });
  } catch (err) {
    showUpsellError(err.message ?? String(err));
    return;
  }
  if (!offers.length) return;

  $('upsells-section').hidden = false;
  $('upsells').innerHTML = offers
    .map((o) => {
      const item = o.lineItems?.[0];
      const amount = o.pricing?.amount ?? item?.unitAmount;
      const compareAt = o.pricing?.compareAtAmount;
      const currency = o.pricing?.currency ?? item?.currency ?? 'USD';
      return /* html */ `
        <article class="card" data-offer-id="${escape(o.id)}">
          ${item?.imageUrl ? `<div class="thumb"><img src="${item.imageUrl}" alt=""></div>` : '<div class="thumb"></div>'}
          <h3>${escape(o.title)}</h3>
          ${o.description ? `<p class="muted small">${escape(o.description)}</p>` : ''}
          ${amount !== undefined ? `<p class="price">
            ${formatPrice(amount, currency)}
            ${compareAt && compareAt > amount ? `<small class="strike">${formatPrice(compareAt, currency)}</small>` : ''}
          </p>` : ''}
          <button class="btn-primary accept-btn">Add to my order</button>
        </article>`;
    })
    .join('');

  $('upsells').querySelectorAll('article[data-offer-id]').forEach((article) => {
    const offerId = article.dataset.offerId;
    article.querySelector('.accept-btn').addEventListener('click', () => acceptOffer(offerId, article));
  });
}

async function acceptOffer(offerId, article) {
  const button = article.querySelector('.accept-btn');
  button.disabled = true;
  button.textContent = 'Adding…';
  hideUpsellError();
  try {
    // Re-validate pricing right before charging.
    await tagada.offers.previewOffer({ offerId });

    // One-click MIT charge. processOfferPayment handles 3DS challenges
    // and bank redirects automatically — if a redirect is needed the
    // browser navigates and the top-of-page maybeResumeFromUrl picks
    // up the return.
    const result = await tagada.offers.processOfferPayment({
      offerId,
      mainOrderId: orderId,
    });

    if (result.status === 'succeeded') {
      markAccepted(article);
    } else if (result.status === 'requires_redirect') {
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
    } else if (result.status === 'failed') {
      showUpsellError(result.error);
      resetButton(button);
    } else {
      showUpsellError(`Unexpected status: ${result.status}`);
      resetButton(button);
    }
  } catch (err) {
    showUpsellError(err?.message ?? String(err));
    resetButton(button);
  }
}

function markAccepted(article) {
  const button = article.querySelector('.accept-btn');
  button.replaceWith(Object.assign(document.createElement('span'), {
    className: 'pill pill-success',
    textContent: '✓ Added to your order',
  }));
}

function resetButton(button) {
  button.disabled = false;
  button.textContent = 'Add to my order';
}

function showUpsellError(msg) {
  const el = $('upsell-error');
  el.hidden = false;
  el.textContent = msg;
}

function hideUpsellError() {
  $('upsell-error').hidden = true;
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

loadUpsells();
