import { CardPaymentPage } from '@/pages/CardPaymentPage';
import { TestReturnPage } from '@/pages/TestReturnPage';

const params = new URLSearchParams(window.location.search);
const isReturnPage = params.has('payment_return');
const returnPaymentId = params.get('paymentId');

export default function App() {
  if (isReturnPage && returnPaymentId) {
    return <TestReturnPage paymentId={returnPaymentId} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-6 shadow-sm">
        <span className="text-lg font-bold tracking-tight">
          <span className="text-blue-600">Tagada</span>
          <span className="text-slate-800">Pay</span>
        </span>
        <span className="ml-3 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Card Payment Example
        </span>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <CardPaymentPage />
      </main>
    </div>
  );
}
