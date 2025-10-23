// ============================================================================
// FILE: app/history/page.tsx
// ============================================================================
'use client';

import { useState, useEffect } from 'react';
import { StatementData } from '@/types/statement';

export default function HistoryPage() {
  const [statements, setStatements] = useState<StatementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<StatementData | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`http://localhost:8000/api/history/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setStatements(data.statements || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getUserId = (): string | null => {
    // Implement your authentication logic here
    return 'demo_user_123';
  };

  const handleDelete = async (statementId: string) => {
    if (!confirm('Are you sure you want to delete this statement?')) return;

    try {
      const userId = getUserId();
      const response = await fetch(
        `http://localhost:8000/api/history/${userId}/${statementId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete statement');
      }

      setStatements(statements.filter((s) => s.id !== statementId));
      if (selectedStatement?.id === statementId) setSelectedStatement(null);
    } catch (err) {
      alert('Error deleting statement: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Statement History</h1>
            <p className="text-slate-600">View and manage your parsed credit card statements</p>
          </div>
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Upload New Statement
          </a>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">Loading your statements...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && statements.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-slate-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No statements yet</h3>
            <p className="text-slate-600 mb-6">
              Upload your first credit card statement to get started
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Upload Statement
            </a>
          </div>
        )}

        {/* Statements Grid */}
        {!loading && !error && statements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statements.map((statement) => (
              <div
                key={statement.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedStatement(statement)}
              >
                <div className="p-6">
                  {/* Issuer Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
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
                        <p className="font-semibold text-slate-900">
                          {statement.issuer_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          •••• {statement.card_variant_last4}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(statement.id!);
                      }}
                      className="text-slate-400 hover:text-red-500 transition"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Balance */}
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-1">Balance</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(statement.total_new_balance)}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Due Date:</span>
                      <span className="text-slate-900 font-medium">
                        {formatDate(statement.payment_due_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transactions:</span>
                      <span className="text-slate-900 font-medium">
                        {statement.transactions?.length || 0}
                      </span>
                    </div>
                    {statement.uploaded_at && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Uploaded:</span>
                        <span className="text-slate-900 font-medium">
                          {formatDate(statement.uploaded_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 rounded-b-lg">
                  <p className="text-xs text-slate-600 truncate">
                    {statement.filename || 'Statement'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statement Detail Modal */}
        {selectedStatement && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedStatement(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">Statement Details</h3>
                <button
                  onClick={() => setSelectedStatement(null)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Issuer</p>
                    <p className="font-semibold text-slate-900">
                      {selectedStatement.issuer_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Card</p>
                    <p className="font-semibold text-slate-900">
                      •••• {selectedStatement.card_variant_last4}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Billing Cycle</p>
                    <p className="font-semibold text-slate-900">
                      {selectedStatement.billing_cycle_dates}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Due Date</p>
                    <p className="font-semibold text-slate-900">
                      {formatDate(selectedStatement.payment_due_date)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500 mb-1">Balance</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {formatCurrency(selectedStatement.total_new_balance)}
                    </p>
                  </div>
                </div>

                {selectedStatement.transactions &&
                  selectedStatement.transactions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">
                        Transactions ({selectedStatement.transactions.length})
                      </h4>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                          <table className="w-full">
                            <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">
                                  Date
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">
                                  Merchant
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-700">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {selectedStatement.transactions.map((t, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="px-4 py-2 text-sm text-slate-900">
                                    {formatDate(t.date)}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-slate-900">
                                    {t.merchant}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right font-medium">
                                    <span
                                      className={
                                        t.amount < 0
                                          ? 'text-green-600'
                                          : 'text-slate-900'
                                      }
                                    >
                                      {formatCurrency(t.amount)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
