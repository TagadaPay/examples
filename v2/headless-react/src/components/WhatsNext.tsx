import { useState } from 'react';

interface Card {
  icon: React.ReactNode;
  title: string;
  description: string;
  code?: string;
  link: { label: string; url: string };
}

const CARDS: Card[] = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: 'Listen to webhooks',
    description: 'Get notified in real-time when orders are paid, refunded, or when subscriptions renew.',
    code: `import Tagada from '@tagadapay/node-sdk';

const tagada = new Tagada({ apiKey: 'tgd_...' });

// In your Express/Next.js API route:
export async function POST(req) {
  const event = tagada.webhooks.verify(
    await req.text(),
    req.headers
  );

  switch (event.topic) {
    case 'order/paid':
      // Fulfill the order
      break;
    case 'subscription/rebill-succeeded':
      // Extend access
      break;
  }
}`,
    link: {
      label: 'Webhook docs',
      url: 'https://docs.tagadapay.com/developer-tools/node-sdk/webhooks-events',
    },
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
    title: 'Order confirmation emails',
    description: 'Set up automatic transactional emails — order paid, subscription renewed, refund processed, and more.',
    link: {
      label: 'Email template docs',
      url: 'https://docs.tagadapay.com/knowledge-center/emails',
    },
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
      </svg>
    ),
    title: 'Add subscriptions',
    description: 'Create recurring products with trial periods, rebill cycles, and automatic dunning for failed payments.',
    code: `// Products with subscription pricing are handled
// automatically — just set up the price with a
// recurring interval in your Tagada dashboard.
//
// The SDK handles rebills, retries, and cancellations.
// Listen to these webhook events:
//   - subscription/rebill-succeeded
//   - subscription/past-due
//   - subscription/canceled`,
    link: {
      label: 'Subscription docs',
      url: 'https://docs.tagadapay.com/developer-tools/node-sdk/subscriptions',
    },
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: 'Explore the API',
    description: 'Full REST API reference with examples for products, orders, customers, subscriptions, and more.',
    link: {
      label: 'API reference',
      url: 'https://docs.tagadapay.com/api-reference/introduction',
    },
  },
];

function WhatsNextCard({ card }: { card: Card }) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!card.code) return;
    navigator.clipboard.writeText(card.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-dark overflow-hidden transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]">
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
            {card.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white/90">{card.title}</h4>
            <p className="mt-1 text-xs leading-relaxed text-white/40">{card.description}</p>
          </div>
        </div>

        {card.code && (
          <button
            onClick={() => setCodeOpen(!codeOpen)}
            className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-brand-400/70 hover:text-brand-300 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
            {codeOpen ? 'Hide code' : 'Show code'}
          </button>
        )}

        {card.code && codeOpen && (
          <div className="relative mt-3">
            <pre className="code-block overflow-x-auto rounded-lg border border-white/[0.06] bg-surface-950/80 px-4 py-3 font-mono text-[11px] leading-relaxed text-white/60">
              {card.code}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-2 top-2 rounded-md border border-white/10 bg-surface-950/80 p-1.5 text-white/30 transition-all hover:bg-white/10 hover:text-white/50"
              title="Copy code"
            >
              {copied ? (
                <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
              )}
            </button>
          </div>
        )}

        <a
          href={card.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          {card.link.label}
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export function WhatsNext() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-white/25">What&apos;s Next?</h3>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((card) => (
          <WhatsNextCard key={card.title} card={card} />
        ))}
      </div>
    </div>
  );
}
