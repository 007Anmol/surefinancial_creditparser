// app/page.tsx
'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import StatementResults from '@/components/StatementResults';
import TransactionTable from '@/components/TransactionTable';
import { StatementData } from '@/types/statement';

export default function Home() {
  const [parsedData, setParsedData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setParsedData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add user_id if available (implement your auth logic)
      const userId = getUserId(); // Placeholder function
      if (userId) {
        formData.append('user_id', userId);
      }

      const response = await fetch('http://localhost:8000/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to parse statement');
      }

      const data: StatementData = await response.json();
      setParsedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getUserId = (): string | null => {
    // Implement your authentication logic here
    // For demo purposes, using a dummy user ID
    return 'demo_user_123';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Credit Card Statement Parser
          </h1>
          <p className="text-slate-600 text-lg">
            Extract standardized data from Chase, Amex, Citi, Capital One, and Discover statements
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <a
            href="/"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Upload Statement
          </a>
          <a
            href="/history"
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
          >
            View History
          </a>
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
          <FileUpload onFileSelect={handleFileUpload} loading={loading} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">Parsing your statement...</p>
          </div>
        )}

        {/* Results Display */}
        {parsedData && !loading && (
          <div className="space-y-8">
            <StatementResults data={parsedData} />
            {parsedData.transactions && parsedData.transactions.length > 0 && (
              <TransactionTable transactions={parsedData.transactions} />
            )}
          </div>
        )}

        {/* Instructions */}
        {!parsedData && !loading && !error && (
          <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              How It Works
            </h2>
            <div className="space-y-4 text-slate-600">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-4">
                  1
                </span>
                <p>Upload your PDF credit card statement from a supported issuer</p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-4">
                  2
                </span>
                <p>Our system automatically detects the issuer and extracts key information</p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-4">
                  3
                </span>
                <p>View standardized data including balance, dates, and transaction details</p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-4">
                  4
                </span>
                <p>Access your parsing history anytime from the History page</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Supported Issuers:</strong> Chase, American Express, Citibank, Capital One, Discover
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}