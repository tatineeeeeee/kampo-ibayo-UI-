"use client";

import { useState, useEffect } from 'react';
import { AdminOnly } from '../../hooks/useRoleAccess';

interface Payment {
  id: number;
  user: string;
  email: string;
  amount: number;
  date: string;
  status: string;
  payment_intent_id: string | null;
  booking_status: string | null;
  payment_status: string | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments');
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'processing':
        return 'bg-blue-100 text-blue-600';
      case 'failed':
        return 'bg-red-100 text-red-600';
      case 'refunded':
        return 'bg-purple-100 text-purple-600';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const refreshPayment = async (paymentIntentId: string) => {
    if (!paymentIntentId) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/paymongo/check-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Payment status updated:', result);
        // Refresh the payments list to show updated status
        await fetchPayments();
      } else {
        console.error('Failed to refresh payment status');
      }
    } catch (error) {
      console.error('Error refreshing payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllPayments = async () => {
    setLoading(true);
    try {
      // Refresh payments with PayMongo API for all that have payment_intent_id
      const paymentsToRefresh = payments.filter(p => p.payment_intent_id);
      
      for (const payment of paymentsToRefresh) {
        await refreshPayment(payment.payment_intent_id!);
      }
      
      // Final refresh of the list
      await fetchPayments();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Payments</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading payments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Payments</h3>
        <div className="text-red-600 text-center py-8">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 text-green-600">💰</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">
                ₱{payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <div className="w-6 h-6 text-blue-600">📊</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">{payments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 text-yellow-600">⏳</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {payments.filter(p => p.status === 'Pending' || p.status === 'Processing').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <div className="w-6 h-6 text-red-600">❌</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-xl font-bold text-gray-900">
                {payments.filter(p => p.status === 'Failed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Payment Transactions</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshAllPayments}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Syncing...' : '🔄 Sync All with PayMongo'}
              </button>
            </div>
          </div>
        </div>
        
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-500">Payment transactions will appear here once guests make bookings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <AdminOnly fallback={null} asFragment={true}>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">PayMongo ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </AdminOnly>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.user}</div>
                        <div className="text-xs text-gray-500">{payment.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">₱{payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{payment.date}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <AdminOnly fallback={null} asFragment={true}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded max-w-xs truncate">
                          {payment.payment_intent_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.payment_intent_id && (
                          <button
                            onClick={() => refreshPayment(payment.payment_intent_id!)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            title="Refresh payment status from PayMongo"
                          >
                            🔄 Sync
                          </button>
                        )}
                      </td>
                    </AdminOnly>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <AdminOnly fallback={null}>
          <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
            <div className="flex items-start space-x-2">
              <div className="text-blue-500 mt-0.5">💡</div>
              <div>
                <p className="text-sm font-medium text-blue-900">Admin Features & Limits</p>
                <p className="text-xs text-blue-700 mt-1">
                  PayMongo integration details and sync actions are visible to administrators only. 
                  Staff members can view payment information but cannot access PayMongo API functions.
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  <strong>⚠️ PayMongo Test Mode Limits:</strong> Maximum refund amount is ₱4,500 in TEST MODE only. 
                  For ₱9K-₱12K Kampo Ibayo bookings, switch to LIVE MODE which supports full amounts, 
                  or process refunds manually through PayMongo dashboard.
                </p>
              </div>
            </div>
          </div>
        </AdminOnly>
      </div>
    </div>
  );
}
