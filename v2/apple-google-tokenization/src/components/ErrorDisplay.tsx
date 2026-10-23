import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8 flex items-start gap-3">
      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-semibold text-red-900 mb-1">Error</h3>
        <p className="text-red-700">{message}</p>
      </div>
    </div>
  );
}
