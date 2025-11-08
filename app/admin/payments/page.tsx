"use client";

import { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DollarSign, BarChart3, Clock, X } from "lucide-react";
import { exportPaymentsCSV } from "../../utils/csvExport";
import { useToastHelpers } from "../../components/Toast";
import { formatBookingNumber } from "../../utils/bookingNumber";

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
  reference_number: string | null;
  payment_method: string | null;
  booking_id: number;
  verified_at: string | null;
  verified_by: string | null;
  admin_notes: string | null;
  has_payment_proof: boolean;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedPayments, setPaginatedPayments] = useState<Payment[]>([]);
  
  // Toast helpers
  const { success, error: showError } = useToastHelpers();

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter payments based on search term and status filter
  useEffect(() => {
    let filtered = payments;
    
    // First filter by status with grouped logic
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const status = payment.status?.toLowerCase();
        if (statusFilter === 'paid') {
          return status === 'paid' || status === 'verified';
        } else if (statusFilter === 'pending') {
          return status === 'pending' || status === 'pending_verification';
        } else if (statusFilter === 'cancelled') {
          return status === 'cancelled' || status === 'rejected';
        }
        return status === statusFilter.toLowerCase();
      });
    }
    
    // Then filter by search term (removed status search)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(payment => 
        // Search by user name
        payment.user?.toLowerCase().includes(searchLower) ||
        // Search by email
        payment.email?.toLowerCase().includes(searchLower) ||
        // Search by payment ID
        payment.id?.toString().includes(searchTerm.trim()) ||
        // Search by reference number
        payment.reference_number?.toLowerCase().includes(searchLower) ||
        // Search by booking ID
        payment.booking_id?.toString().includes(searchTerm.trim())
      );
    }
    
    setFilteredPayments(filtered);
  }, [payments, searchTerm, statusFilter]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPayments(filteredPayments.slice(startIndex, endIndex));
  }, [filteredPayments, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPayments]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

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
      case 'verified':
        return 'bg-green-100 text-green-600';
      case 'pending':
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-600';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
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
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by guest name, email, reference number, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-1">
              Found {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} matching &quot;{searchTerm}&quot;
            </p>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              All ({payments.length})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'paid'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Paid ({payments.filter(p => p.status?.toLowerCase() === 'paid' || p.status?.toLowerCase() === 'verified').length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Pending ({payments.filter(p => p.status?.toLowerCase() === 'pending' || p.status?.toLowerCase() === 'pending_verification').length})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Cancelled ({payments.filter(p => p.status?.toLowerCase() === 'cancelled' || p.status?.toLowerCase() === 'rejected').length})
            </button>
          </div>
          {(statusFilter !== 'all' || searchTerm) && (
            <p className="text-sm text-gray-600 mt-2">
              Showing {filteredPayments.length} of {payments.length} payments
              {statusFilter !== 'all' && ` with status "${statusFilter}"`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          )}
        </div>      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Revenue{searchTerm && ' (filtered)'}</p>
              <p className="text-xl font-bold text-gray-900">
                ₱{filteredPayments.filter(p => p.status?.toLowerCase() === 'paid' || p.status?.toLowerCase() === 'verified').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Transactions{searchTerm && ' (filtered)'}</p>
              <p className="text-xl font-bold text-gray-900">{filteredPayments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending{searchTerm && ' (filtered)'}</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredPayments.filter(p => p.status?.toLowerCase() === 'pending' || p.status?.toLowerCase() === 'pending_verification').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Cancelled{searchTerm && ' (filtered)'}</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredPayments.filter(p => p.status?.toLowerCase() === 'cancelled' || p.status?.toLowerCase() === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Transactions ({filteredPayments.length}{searchTerm ? ` filtered` : ` total`})
            </h3>
            <div className="flex items-center space-x-2">
              {/* Export CSV Button */}
              <button
                onClick={() => {
                  try {
                    exportPaymentsCSV(filteredPayments as unknown as { [key: string]: string | number | boolean | null | undefined | object }[]);
                    success(`${filteredPayments.length} payment${filteredPayments.length !== 1 ? 's' : ''} exported to CSV successfully!`);
                  } catch (error) {
                    console.error('Export error:', error);
                    showError('Failed to export CSV. Please try again.');
                  }
                }}
                disabled={filteredPayments.length === 0}
                className={`inline-flex items-center px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                  filteredPayments.length === 0
                    ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                }`}
                title="Export payments to CSV"
              >
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? `No payments match "${searchTerm}"` : 'No payments found'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms or clear the search to see all payments.' : 'Payment transactions will appear here once guests make bookings.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.user}</div>
                        <div className="text-xs text-gray-500">{payment.email}</div>
                        <div className="text-xs text-gray-400">{formatBookingNumber(payment.booking_id)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">₱{payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 font-mono">
                        {payment.reference_number || (
                          <span className="text-gray-400 italic">
                            {payment.has_payment_proof ? 'No reference provided' : 'Not uploaded yet'}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 capitalize">
                        {payment.payment_method ? (
                          payment.payment_method === 'PayMongo' ? (
                            <span className="text-blue-600 font-medium">PayMongo</span>
                          ) : (
                            <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span>
                          )
                        ) : (
                          <span className="text-gray-400 italic">
                            {payment.has_payment_proof ? 'Not specified' : 'Pending upload'}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{payment.date}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}
                      >
                        {payment.status === 'paid' ? 'Paid' :
                         payment.status === 'pending' ? 'Pending' :
                         payment.status === 'cancelled' ? 'Cancelled' :
                         payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredPayments.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 px-4 py-3 rounded-lg">
                {/* Items per page and info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPage" className="text-sm text-gray-800 font-medium">Show:</label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 font-medium bg-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <span className="text-sm text-gray-800 font-medium">
                    Showing {Math.min(startIndex + 1, filteredPayments.length)} to {Math.min(startIndex + itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
                  </span>
                </div>

                {/* Page info and controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800 font-medium mr-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    {/* Navigation buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            className={`px-3 py-2 text-sm font-medium rounded border ${
                              currentPage === pageNumber
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
