"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface Booking {
  id: number;
  user_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  status: string | null;
  special_requests: string | null;
  brings_pet: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  cancelled_by: string | null; // 'user' or 'admin'
  cancelled_at: string | null;
  cancellation_reason: string | null;
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchBookings();
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

  const fetchBookings = async () => {
    try {
      console.log('🔍 Fetching bookings...');
      
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

      // Check which users still exist
      const bookingsWithUserStatus = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', booking.user_id)
            .single();
          
          return {
            ...booking,
            user_exists: !userError && userData !== null
          };
        })
      );

      console.log('✅ Successfully fetched bookings with user status');
      setBookings(bookingsWithUserStatus as Booking[]);
    } catch (error) {
      console.error('💥 Unexpected error:', error);
    } finally {
      setLoading(false);
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
    try {
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
        console.error('Error updating booking:', error);
        alert('Error updating booking status');
      } else {
        alert('Booking status updated successfully');
        fetchBookings(); // Refresh the list
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating booking status');
    }
  };

  const handleAdminCancelBooking = async (bookingId: number) => {
    if (!adminCancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      // Store Philippines time (UTC+8) correctly
      const now = new Date();
      const utcTime = now.getTime();
      const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      const philippinesTime = new Date(utcTime + philippinesOffset);
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancelled_by: 'admin',
          cancelled_at: philippinesTime.toISOString(),
          cancellation_reason: adminCancellationReason.trim()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        alert('Error cancelling booking');
      } else {
        alert('Booking cancelled successfully');
        fetchBookings(); // Refresh the list
        closeModal();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error cancelling booking');
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
              onClick={fetchBookings}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Refresh
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
                    <td className="p-3 text-black text-sm">{booking.guest_email}</td>
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
                      <span className={`px-2 py-1 rounded-md text-xs ${getStatusColor(booking.status || 'pending')}`}>
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
                      {selectedBooking.guest_name} • {selectedBooking.guest_email}
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-gray-800 font-medium">{selectedBooking.guest_email}</p>
                    </div>
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

                {/* Pet Information */}
                {selectedBooking.brings_pet !== null && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-3">
                    <h4 className="text-sm font-semibold text-purple-700 mb-2">Pet Policy</h4>
                    <p className="text-gray-700 text-sm">
                      {selectedBooking.brings_pet ? (
                        <span className="text-green-600 font-medium">✅ Guest is bringing a pet</span>
                      ) : (
                        <span className="text-gray-600">🚫 No pets for this booking</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Cancellation Information */}
                {selectedBooking.status?.toLowerCase() === 'cancelled' && selectedBooking.cancelled_by && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="text-sm font-semibold text-red-700 mb-2">Cancellation Information</h4>
                    <div className="space-y-1">
                      <p className="text-red-600 text-sm font-medium">
                        ❌ Cancelled by {selectedBooking.cancelled_by === 'user' ? 'Guest' : 'Administrator'}
                      </p>
                      {selectedBooking.cancelled_at && (
                        <p className="text-gray-600 text-xs">
                          Cancelled on: {new Date(selectedBooking.cancelled_at).toLocaleDateString('en-PH', {timeZone: 'Asia/Manila'})} at {new Date(selectedBooking.cancelled_at).toLocaleTimeString('en-PH', {timeZone: 'Asia/Manila', hour: '2-digit', minute:'2-digit', hour12: true})}
                        </p>
                      )}
                      {selectedBooking.cancellation_reason && (
                        <p className="text-gray-600 text-xs">
                          Reason: {selectedBooking.cancellation_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
                    <h4 className="text-gray-800 font-medium mb-2">Reason for cancelling this booking:</h4>
                    <textarea
                      value={adminCancellationReason}
                      onChange={(e) => setAdminCancellationReason(e.target.value)}
                      placeholder="Please provide a detailed reason for cancellation (required)"
                      className="w-full p-3 rounded-md border border-gray-300 focus:border-red-500 focus:outline-none resize-none"
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-gray-500 text-xs mt-1">{adminCancellationReason.length}/200 characters</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleAdminCancelBooking(selectedBooking.id)}
                      disabled={!adminCancellationReason.trim()}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition ${
                        adminCancellationReason.trim() 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Confirm Cancellation
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelModal(false);
                        setAdminCancellationReason("");
                      }}
                      className="bg-gray-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-gray-600 transition"
                    >
                      Back
                    </button>
                  </div>
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
