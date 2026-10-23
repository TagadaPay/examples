import { AlertCircle } from 'lucide-react';

export function TestingNotes() {
  return (
    <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Testing Notes
      </h3>
      <ul className="text-blue-800 space-y-2 text-sm">
        <li><strong>Apple Pay:</strong> Works in Safari or Edge. Can show QR code to scan with iPhone on any device</li>
        <li><strong>Google Pay:</strong> Works on Chrome/Android with a configured payment method</li>
        <li><strong>Server Integration:</strong> Apple Pay requires server-side merchant validation</li>
        <li><strong>Test Mode:</strong> Google Pay is configured in TEST environment</li>
      </ul>
    </div>
  );
}
