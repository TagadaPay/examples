import type { PaymentInstrumentResult } from '../../types';

interface PaymentInstrumentResultProps {
  result: PaymentInstrumentResult;
}

export function PaymentInstrumentResult({ result }: PaymentInstrumentResultProps) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-lg">
      <div className="mb-4 text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-bold text-green-800">
          🎉 Payment Instrument Created!
        </h3>
        <p className="text-sm text-green-600">Successfully created via TagadaPay API</p>
      </div>

      <div className="rounded-lg bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-semibold text-gray-800">Payment Instrument</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <strong>ID:</strong> {result.paymentInstrument.id}
              </p>
              <p>
                <strong>Type:</strong> {result.paymentInstrument.type}
              </p>
              <p>
                <strong>Card:</strong> **** **** **** {result.paymentInstrument.card.last4}
              </p>
              <p>
                <strong>Brand:</strong> {result.paymentInstrument.card.brand}
              </p>
              <p>
                <strong>Expires:</strong> {result.paymentInstrument.card.expMonth}/{result.paymentInstrument.card.expYear}
              </p>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-gray-800">Customer</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <strong>ID:</strong> {result.customer.id}
              </p>
              <p>
                <strong>Email:</strong> {result.customer.email}
              </p>
              <p>
                <strong>Name:</strong> {result.customer.firstName} {result.customer.lastName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
