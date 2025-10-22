// components/StatementResults.tsx
'use client';

import { StatementData } from '@/components/types/statement';

interface StatementResultsProps {
  data: StatementData;
}

export default function StatementResults({ data }: StatementResultsProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">Statement Summary</h2>
        <p className="text-blue-100 text-sm mt-1">
          Parsed data from your {data.issuer_name} statement
        </p>
      </div>

      {/* Content Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Issuer */}
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Issuer</p>
            <p className="text-lg font-semibold text-slate-900">
              {data.issuer_name}
            </p>
          </div>
        </div>

        {/* Card Last 4 */}
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Card Ending In</p>
            <p className="text-lg font-semibold text-slate-900 tracking-wider">
              •••• {data.card_variant_last4}
            </p>
          </div>
        </div>

        {/* Billing Cycle */}
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Billing Cycle</p>
            <p className="text-lg font-semibold text-slate-900">
              {data.billing_cycle_dates}
            </p>
          </div>
        </div>

        {/* Payment Due Date */}
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
            <svg
              className="w-6 h-6 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Payment Due</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatDate(data.payment_due_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Balance - Featured Section */}
      <div className="bg-slate-50 px-6 py-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 font-medium mb-1">
              Total New Balance
            </p>
            <p className="text-4xl font-bold text-slate-900">
              {formatCurrency(data.total_new_balance)}
            </p>
          </div>
          <div className="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v1"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Transaction Summary */}
      {data.transactions && data.transactions.length > 0 && (
        <div className="px-6 py-4 bg-white border-t border-slate-200">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {data.transactions.length}
            </span>{' '}
            transactions extracted
          </p>
        </div>
      )}
    </div>
  );
}