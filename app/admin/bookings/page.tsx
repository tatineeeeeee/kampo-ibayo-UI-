"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useToastHelpers } from "../../components/Toast";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Tables } from "../../../database.types";

interface Booking extends Tables<'bookings'> {
  // Add user info to track if user still exists
  user_exists?: boolean;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [adminCancellationReason, setAdminCancellationReason] = useState("");
  const [showDeletedUsers, setShowDeletedUsers] = useState(true);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [shouldRefund, setShouldRefund] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);

  // Toast helpers
  const { success, error: showError, warning } = useToastHelpers();
  useEffect(() => {
    // Initial fetch
    fetchBookings();

    // Set up real-time subscription for bookings
    const bookingsSubscription = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('🔄 Real-time booking change detected:', payload.eventType, payload);
          
          // Optimistic update for faster UI response
          if (payload.eventType === 'UPDATE' && payload.new) {
            console.log('🔄 Real-time booking update received:', payload.new.id, 'Status:', payload.new.status);
            setBookings(prevBookings => 
              prevBookings.map(booking => 
                booking.id === payload.new.id 
                  ? { ...booking, ...payload.new }
                  : booking
              )
            );
          } else if (payload.eventType === 'INSERT' && payload.new) {
            // For new bookings, do a refresh to get user status
            fetchBookings(true);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Remove deleted booking immediately
            setBookings(prevBookings => 
              prevBookings.filter(booking => booking.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Bookings subscription status:', status);
      });

    // Set up real-time subscription for users (to detect user deletions)
    const usersSubscription = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('🔄 Real-time user change detected:', payload.eventType, payload);
          
          // When users are added/deleted, refresh bookings to update user_exists status
          setTimeout(() => {
            fetchBookings(true);
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('📡 Users subscription status:', status);
      });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions...');
      supabase.removeChannel(bookingsSubscription);
      supabase.removeChannel(usersSubscription);
    };
  }, []);

  // Filter bookings based on user preference
  useEffect(() => {
    if (showDeletedUsers) {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => booking.user_exists));
    }
  }, [bookings, showDeletedUsers]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBookings(filteredBookings.slice(startIndex, endIndex));
  }, [filteredBookings, currentPage, itemsPerPage]);

  // Reset to first page when filtered bookings change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredBookings]);

  const fetchBookings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('🔍 Fetching bookings with optimized queries...');
      
      // Step 1: Get all bookings (same as before)
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching bookings:', error);
        return;
      }

      console.log('📊 Database response:', { data: bookingsData, error });
      console.log('📈 Number of bookings found:', bookingsData?.length || 0);

      // If no bookings, return early
      if (!bookingsData || bookingsData.length === 0) {
        console.log('✅ No bookings found');
        setBookings([]);
        return;
      }

      // Step 2: Get all unique user IDs from bookings
      const userIds = [...new Set(bookingsData.map(booking => booking.user_id))];
      console.log('👥 Checking existence for', userIds.length, 'unique users');
      
      // Step 3: Single query to check which users exist (MUCH faster than N queries)
      const { data: existingUsers, error: usersError } = await supabase
        .from('users')
        .select('auth_id')
        .in('auth_id', userIds);

      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
        // Continue anyway, just mark all as existing to preserve functionality
        const bookingsWithUserStatus = bookingsData.map(booking => ({
          ...booking,
          user_exists: true
        }));
        setBookings(bookingsWithUserStatus as Booking[]);
        return;
      }

      // Step 4: Create a Set of existing user IDs for O(1) lookup performance
      const existingUserIds = new Set(existingUsers?.map(user => user.auth_id) || []);
      
      // Step 5: Add user_exists flag efficiently (same result as before, much faster)
      const bookingsWithUserStatus = bookingsData.map(booking => ({
        ...booking,
        user_exists: existingUserIds.has(booking.user_id)
      }));

      console.log('✅ Successfully fetched bookings with user status');
      console.log('📈 Performance: Checked', userIds.length, 'users in 2 queries instead of', bookingsData.length + 1, 'queries');
      setBookings(bookingsWithUserStatus as Booking[]);
    } catch (error) {
      console.error('💥 Unexpected error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    // Optimistic update - immediately update UI for instant feedback
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      )
    );

    try {
      if (newStatus === 'confirmed') {
        // Use the new API route that sends email notifications
        const response = await fetch('/api/admin/confirm-booking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookingId }),
        });

        const result = await response.json();

        if (result.success) {
          success('Booking confirmed and guest notified via email');
        } else {
          throw new Error(result.error || 'Failed to confirm booking');
        }
      } else {
        // For other status updates, use the original method
        const updateData: {
          status: string;
          cancelled_by?: string;
          cancelled_at?: string;
          cancellation_reason?: string;
        } = { status: newStatus };
        
        // If cancelling, add cancellation tracking
        if (newStatus === 'cancelled') {
          // Store Philippines time (UTC+8) correctly
          const now = new Date();
          const utcTime = now.getTime();
          const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
          const philippinesTime = new Date(utcTime + philippinesOffset);
          
          updateData.cancelled_by = 'admin';
          updateData.cancelled_at = philippinesTime.toISOString();
          updateData.cancellation_reason = 'Cancelled by administrator';
        }

        const { error } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', bookingId);

        if (error) {
          throw new Error(error.message);
        }
        
        success('Booking status updated successfully');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      showError(`Error updating booking status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Revert optimistic update on error
      fetchBookings(true);
    }
  };

  const handleAdminCancelBooking = async (bookingId: number, shouldRefund: boolean = false) => {
    if (!adminCancellationReason.trim()) {
      warning('Please provide a reason for cancellation');
      return;
    }

    // Show confirmation state instead of browser confirm
    if (!showConfirmCancel) {
      setShowConfirmCancel(true);
      return;
    }

    setIsProcessing(true);
    try {
      // Process refund first if requested and payment exists
      let refundResponse = null;
      const booking = bookings.find(b => b.id === bookingId);
      
      if (shouldRefund && booking?.payment_status === 'paid' && booking?.payment_intent_id) {
        console.log('💰 Processing admin-initiated refund');
        
        try {
          const refundApiResponse = await fetch('/api/paymongo/process-refund', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookingId: booking.id,
              reason: adminCancellationReason || 'Cancelled by administrator',
              refundType: 'full', // Admin can give full refund
              processedBy: 'admin'
            }),
          });

          if (refundApiResponse.ok) {
            refundResponse = await refundApiResponse.json();
            console.log('✅ Admin refund processed successfully:', refundResponse.refund_amount);
          } else {
            const refundError = await refundApiResponse.text();
            console.error('❌ Refund processing failed:', refundError);
            warning('Booking will be cancelled but refund failed. Please process manually.');
          }
        } catch (refundError) {
          console.error('❌ Refund API error:', refundError);
          warning('Booking will be cancelled but refund failed. Please process manually.');
        }
      }

      // Cancel the booking
      const response = await fetch('/api/admin/cancel-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bookingId,
          refundProcessed: refundResponse ? true : false,
          refundAmount: refundResponse?.refund_amount || 0
        }),
      });

      const result = await response.json();

      if (result.success) {
        const message = refundResponse 
          ? `Booking cancelled and ₱${refundResponse.refund_amount.toLocaleString()} refund processed. Guest notified via email.`
          : 'Booking cancelled and guest notified via email';
        success(message);
        fetchBookings(); // Refresh the list
        closeModal();
      } else {
        throw new Error(result.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error:', error);
      showError(`Error cancelling booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    setShowCancelModal(false);
    setAdminCancellationReason("");
    setShowConfirmCancel(false);
    setShouldRefund(false);
    setIsProcessing(false);
  };

  // Pagination helpers
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredBookings.length);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            All Bookings ({filteredBookings.length})
            {!showDeletedUsers && bookings.length > filteredBookings.length && (
              <span className="text-sm text-gray-500 ml-2">
                ({bookings.length - filteredBookings.length} hidden from deleted users)
              </span>
            )}
          </h3>
          <div className="flex gap-2">
            <label className="flex items-center text-sm text-black">
              <input
                type="checkbox"
                checked={showDeletedUsers}
                onChange={(e) => setShowDeletedUsers(e.target.checked)}
                className="mr-2"
              />
              Show deleted user bookings
            </label>
            <button 
              onClick={() => fetchBookings(true)}
              disabled={refreshing}
              className={`px-3 py-1 text-white rounded-md text-sm transition ${
                refreshing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {refreshing ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  Refreshing...
                </span>
              ) : (
                'Refresh'
              )}
            </button>
          </div>
        </div>

        {/* Pagination Info */}
        {filteredBookings.length > 0 && (
          <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
            <div>
              Showing {startIndex + 1} to {endIndex} of {filteredBookings.length} bookings
            </div>
            <div>
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
        
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No bookings found</p>
            {!showDeletedUsers && bookings.length > 0 && (
              <p className="text-sm mt-2">
                All bookings are from deleted users. Check &quot;Show deleted user bookings&quot; to see them.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 text-sm">
                  <th className="p-3">Guest</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Check-in</th>
                  <th className="p-3">Check-out</th>
                  <th className="p-3">Guests</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id} className={`border-t hover:bg-gray-50 ${!booking.user_exists ? 'bg-red-50' : ''}`}>
                    <td className="p-3 text-black">
                      <div className="font-medium">
                        {booking.guest_name}
                        {!booking.user_exists && (
                          <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                            User Deleted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-black text-sm">
                      {booking.guest_email ? (
                        <a 
                          href={`mailto:${booking.guest_email}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {booking.guest_email}
                        </a>
                      ) : (
                        <span className="text-gray-400">No email</span>
                      )}
                    </td>
                    <td className="p-3 text-black text-sm">
                      {booking.guest_phone ? (
                        <a
                          href={`tel:${booking.guest_phone}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {booking.guest_phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">No phone</span>
                      )}
                    </td>
                    <td className="p-3 text-black">{formatDate(booking.check_in_date)}</td>
                    <td className="p-3 text-black">{formatDate(booking.check_out_date)}</td>
                    <td className="p-3 text-black">{booking.number_of_guests}</td>
                    <td className="p-3 text-black font-medium">₱{booking.total_amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-md text-xs text-white ${getStatusColor(booking.status || 'pending')}`}>
                        {booking.status || 'pending'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {(booking.status || 'pending') === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowModal(true);
                                setShowCancelModal(true);
                              }}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => openModal(booking)}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredBookings.length > itemsPerPage && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
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
                    className={`px-3 py-2 text-sm rounded-md border ${
                      currentPage === pageNumber
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Overlay - Perfect Light Theme */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header - Clean Light */}
            <div className="bg-gray-50 p-6 rounded-t-lg border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Booking Management</h2>
                  <p className="text-gray-600 text-sm">Complete reservation details</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:shadow-md transition"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Booking Header Card - Clean Light Style */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Booking #{selectedBooking.id}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {selectedBooking.guest_name}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Booked on {selectedBooking.created_at ? formatDate(selectedBooking.created_at) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold text-white ${getStatusColor(selectedBooking.status || 'pending')}`}>
                      {(selectedBooking.status || 'pending').charAt(0).toUpperCase() + (selectedBooking.status || 'pending').slice(1)}
                    </span>
                  </div>
                </div>

                {/* Quick Info Grid - Simple Clean Layout */}
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-1">Check-in</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(selectedBooking.check_in_date)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-600 font-medium mb-1">Check-out</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(selectedBooking.check_out_date)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-1">Guests</p>
                    <p className="font-semibold text-gray-800">{selectedBooking.number_of_guests} people</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-600 font-medium mb-1">Total Amount</p>
                    <p className="font-semibold text-green-600">₱{selectedBooking.total_amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Guest Name</p>
                      <p className="text-gray-800 font-medium">{selectedBooking.guest_name}</p>
                    </div>
                    {selectedBooking.guest_email && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <a href={`mailto:${selectedBooking.guest_email}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                          {selectedBooking.guest_email}
                        </a>
                      </div>
                    )}
                    {selectedBooking.guest_phone && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <a href={`tel:${selectedBooking.guest_phone}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                          {selectedBooking.guest_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.special_requests && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-3">
                    <h4 className="text-sm font-semibold text-orange-700 mb-2">Special Requests</h4>
                    <p className="text-gray-700 text-sm">{selectedBooking.special_requests}</p>
                  </div>
                )}

                {/* Pet Information - Remove since field doesn't exist */}
                
                {/* Cancellation Information - Remove since fields don't exist */}
              </div>
            </div>

            {/* Modal Footer - Clean Action Buttons */}
            <div className="bg-gray-50 p-6 rounded-b-lg border-t border-gray-200">
              {(selectedBooking.status || 'pending') === 'pending' && !showCancelModal ? (
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, 'confirmed');
                      closeModal();
                    }}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-green-600 transition"
                  >
                    ✅ Confirm
                  </button>
                  <button 
                    onClick={() => setShowCancelModal(true)}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-red-600 transition"
                  >
                    ❌ Cancel
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-gray-500 text-white py-2 px-6 rounded-md text-sm font-semibold hover:bg-gray-600 transition"
                  >
                    Close
                  </button>
                </div>
              ) : showCancelModal ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-gray-800 font-medium mb-2">Reason for cancellation</h4>
                    <textarea
                      value={adminCancellationReason}
                      onChange={(e) => setAdminCancellationReason(e.target.value)}
                      placeholder="Please provide a reason for cancelling this booking"
                      className="w-full p-3 border border-gray-300 rounded-md resize-none text-gray-700 focus:border-red-500 focus:outline-none"
                      rows={3}
                      maxLength={200}
                      disabled={isProcessing}
                    />
                    <p className="text-gray-500 text-sm mt-1">{adminCancellationReason.length}/200 characters</p>
                  </div>
                  {!showConfirmCancel ? (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleAdminCancelBooking(selectedBooking.id)}
                        disabled={!adminCancellationReason.trim() || isProcessing}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                          adminCancellationReason.trim() && !isProcessing
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isProcessing ? 'Processing...' : 'Continue'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCancelModal(false);
                          setAdminCancellationReason("");
                          setShowConfirmCancel(false);
                        }}
                        disabled={isProcessing}
                        className="bg-gray-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-600 transition disabled:opacity-50"
                      >
                        Back
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-red-500">⚠️</span>
                          <h4 className="text-red-800 font-medium">Confirm Cancellation</h4>
                        </div>
                        <p className="text-red-700 text-sm mb-3">
                          This will permanently cancel the booking for <strong>{selectedBooking.guest_name}</strong>. 
                          The guest will be notified via email.
                        </p>
                        
                        {/* Refund Option - Only show if payment was made */}
                        {selectedBooking.payment_status === 'paid' && selectedBooking.payment_intent_id && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-blue-500">💰</span>
                              <h5 className="text-blue-800 font-medium text-sm">Refund Options</h5>
                            </div>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="refundOption"
                                  value="none"
                                  checked={!shouldRefund}
                                  onChange={() => setShouldRefund(false)}
                                  className="text-blue-600"
                                />
                                <span className="text-blue-700 text-sm">Cancel without refund</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="refundOption"
                                  value="full"
                                  checked={shouldRefund}
                                  onChange={() => setShouldRefund(true)}
                                  className="text-blue-600"
                                />
                                <span className="text-blue-700 text-sm">
                                  Cancel with full refund (₱{Math.round(selectedBooking.total_amount * 0.5).toLocaleString()})
                                </span>
                              </label>
                            </div>
                            <p className="text-blue-600 text-xs mt-2">
                              * Refund amount is based on down payment (50% of total booking)
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleAdminCancelBooking(selectedBooking.id, shouldRefund)}
                          disabled={isProcessing}
                          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                            isProcessing 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700'
                          } text-white`}
                        >
                          {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              {shouldRefund ? 'Cancelling & Refunding...' : 'Cancelling...'}
                            </span>
                          ) : (
                            shouldRefund ? 'Cancel & Process Refund' : 'Cancel Booking Only'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowConfirmCancel(false);
                            setShouldRefund(false);
                            warning('Cancellation cancelled');
                          }}
                          disabled={isProcessing}
                          className="bg-gray-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-600 transition disabled:opacity-50"
                        >
                          No, Keep Booking
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="bg-gray-500 text-white py-2 px-6 rounded-md text-sm font-semibold hover:bg-gray-600 transition"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
