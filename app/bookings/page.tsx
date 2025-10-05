"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { isMaintenanceMode } from "../utils/maintenanceMode";
import { 
  checkAndExpirePendingBookings, 
  getDaysPending, 
  shouldShowExpirationWarning, 
  getExpirationWarningMessage,
  getUserBookingStats,
  cleanupOldCompletedBookings,
  BookingStats
} from "../utils/bookingUtils";
import { useToast } from "../components/Toast";
import { Tables } from '../../database.types';
import { FaHome, FaCalendarAlt, FaUsers, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPlus, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaCommentDots } from "react-icons/fa";

type DatabaseBooking = Tables<'bookings'>;

interface Booking extends DatabaseBooking {
  // Add any additional properties that might exist in the local interface
  brings_pet?: boolean | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 bookings per page
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);
  
  const router = useRouter();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Load maintenance mode settings
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const isActive = await isMaintenanceMode();
        setMaintenanceActive(isActive);
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
        setMaintenanceActive(false);
      }
    };

    checkMaintenanceMode();
    
    // Listen for settings changes from admin panel
    const handleSettingsChange = () => {
      checkMaintenanceMode();
    };
    
    // Check every 5 seconds for maintenance mode changes
    const interval = setInterval(checkMaintenanceMode, 5000);
    
    // Listen for custom events from admin settings
    window.addEventListener('maintenanceSettingsChanged', handleSettingsChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('maintenanceSettingsChanged', handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    async function loadBookings() {
      if (!user) return;
      
      // First, check and auto-cancel any pending bookings older than 7 days
      try {
        const cancelledBookings = await checkAndExpirePendingBookings();
        if (cancelledBookings.length > 0) {
          console.log(`Auto-cancelled ${cancelledBookings.length} booking(s) that were pending for 7+ days`);
        }
      } catch (error) {
        console.error("Error checking pending bookings:", error);
      }

      // Clean up old completed bookings (keep only 5 most recent)
      try {
        await cleanupOldCompletedBookings(user.id);
      } catch (error) {
        console.error("Error cleaning up old completed bookings:", error);
      }
      
      // Load booking stats
      try {
        const stats = await getUserBookingStats(user.id);
        setBookingStats(stats);
      } catch (error) {
        console.error("Error loading booking stats:", error);
      }
      
      // Then load all bookings (including any newly auto-cancelled ones)
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error loading bookings:", error);
      } else {
        setBookings(data as Booking[] || []);
      }
      setLoading(false);
    }
    
    if (user) {
      loadBookings();
    }
  }, [user]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBookings(bookings.slice(startIndex, endIndex));
  }, [bookings, currentPage, itemsPerPage]);

  // Reset to first page when bookings change
  useEffect(() => {
    setCurrentPage(1);
  }, [bookings]);

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    setShowCancelModal(false);
    setCancellationReason("");
  };

  // Pagination helpers
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, bookings.length);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  const canCancelBooking = (booking: Booking) => {
    if (!booking.status || booking.status.toLowerCase() === 'cancelled') {
      return false;
    }
    
    // Always allow cancellation if booking is pending
    if (booking.status.toLowerCase() === 'pending') {
      return true;
    }
    
    // For confirmed bookings, check if it's at least 24 hours before check-in
    if (booking.status.toLowerCase() === 'confirmed') {
      const checkInDate = new Date(booking.check_in_date);
      const now = new Date();
      const timeDifference = checkInDate.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 3600);
      
      return hoursDifference >= 24;
    }
    
    return false;
  };

  const getCancellationMessage = (booking: Booking) => {
    if (booking.status?.toLowerCase() === 'pending') {
      return 'Cancel this pending booking';
    }
    
    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const timeDifference = checkInDate.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 3600);
    
    if (hoursDifference < 24) {
      return `Cannot cancel: Less than 24 hours until check-in (${Math.floor(hoursDifference)} hours remaining)`;
    }
    
    return `Cancel booking (${Math.floor(hoursDifference)} hours until check-in)`;
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!cancellationReason.trim()) {
      showToast({
        type: 'warning',
        title: 'Cancellation Reason Required',
        message: 'Please provide a reason for cancellation before proceeding.',
        duration: 4000
      });
      return;
    }

    // INSTANT cancellation - no confirmation needed
    console.log('⚡ INSTANT cancellation started for booking:', bookingId);
    
    // Close modal immediately
    setShowCancelModal(false);
    
    // Immediately update booking to cancelled state
    const instantUpdatedBookings = bookings.map(booking => 
      booking.id === bookingId 
        ? { 
            ...booking, 
            status: 'cancelled',
            cancelled_by: 'user',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: cancellationReason.trim()
          } 
        : booking
    );
    setBookings(instantUpdatedBookings);
    console.log('✨ UI updated instantly - booking now shows as cancelled');

    // Show immediate success toast
    showToast({
      type: 'success',
      title: 'Booking Cancelled!',
      message: 'Your booking has been cancelled successfully',
      duration: 3000
    });

    // Clear cancellation reason
    setCancellationReason("");

    // Background server processing - user doesn't wait for this
    console.log('🔄 Starting background server processing...');
    processServerCancellation(bookingId);
  };

  // Background server processing function
  const processServerCancellation = async (bookingId: number) => {
    console.log('🚀 Starting background cancellation for booking:', bookingId);
    
    try {
      const response = await fetch('/api/user/cancel-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bookingId,
          userId: user?.id,
          cancellationReason: cancellationReason.trim()
        }),
      });

      const result = await response.json();
      console.log('✅ Server response:', result);

      if (result.success) {
        console.log('🎉 Cancellation confirmed by server');
        
        // Server confirmed - show additional info if needed
        if (result.warning) {
          showToast({
            type: 'info',
            title: 'Email Notification',
            message: result.warning,
            duration: 4000
          });
        } else {
          // Optional: Show email confirmation toast
          showToast({
            type: 'info',
            title: 'Email Sent',
            message: 'Cancellation confirmation email sent',
            duration: 2000
          });
        }

        // Refresh data silently in background
        refreshBookingsInBackground();
      } else {
        console.error('❌ Server cancellation failed:', result.error);
        
        // Server failed - revert the optimistic update
        const revertedBookings = bookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'pending' } // Revert to previous state
            : booking
        );
        setBookings(revertedBookings);

        showToast({
          type: 'error',
          title: 'Cancellation Failed',
          message: 'There was an issue. Your booking is still active.',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('🔥 Network error during cancellation:', error);
      
      // Revert optimistic update on network error
      const revertedBookings = bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'pending' }
          : booking
      );
      setBookings(revertedBookings);

      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Please check your connection and try again',
        duration: 5000
      });
    }
  };

  // Background refresh function - non-blocking
  const refreshBookingsInBackground = async () => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        if (!error && data) {
          setBookings(data as Booking[]);
        }
      }
    } catch (error) {
      console.error('Background refresh error:', error);
      // Silent fail - don't show error to user
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <FaCheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <FaHourglassHalf className="w-5 h-5 text-yellow-500" />;
      case "cancelling":
        return <div className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>;
      case "cancelled":
        return <FaTimesCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FaClock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-600";
      case "pending":
        return "bg-yellow-600";
      case "cancelling":
        return "bg-orange-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading your bookings...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Mobile-First Sticky Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaHome className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </Link>
              <div className="text-white">
                <h1 className="text-lg sm:text-xl font-bold">My Bookings</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Manage your reservations</p>
              </div>
            </div>
            {maintenanceActive ? (
              <div className="flex-shrink-0">
                <div className="flex items-center gap-1 sm:gap-2 bg-gray-500 text-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed">
                  <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New </span>Book
                  <span className="text-xs">(Disabled)</span>
                </div>
              </div>
            ) : (
              <Link href="/book" className="flex-shrink-0" prefetch={true}>
                <button className="flex items-center gap-1 sm:gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition">
                  <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New </span>Book
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">

        {/* Booking Stats - Mobile Optimized */}
        {bookingStats && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white mb-3 sm:mb-4">Booking Summary</h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
                <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <FaHourglassHalf className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-yellow-400 font-medium text-xs sm:text-sm">Pending</span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {bookingStats.pendingCount}/3
                  </p>
                  <p className="text-xs text-yellow-300 truncate">
                    {bookingStats.canCreatePending ? 
                      `${3 - bookingStats.pendingCount} slots left` : 
                      'Limit reached'
                    }
                  </p>
                </div>
                
                <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <FaCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    <span className="text-green-400 font-medium text-xs sm:text-sm">Confirmed</span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {bookingStats.confirmedCount}
                  </p>
                  <p className="text-xs text-green-300">Active bookings</p>
                </div>
                
                <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-blue-400 font-medium text-xs sm:text-sm">Completed</span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {bookingStats.completedCount}/5
                  </p>
                  <p className="text-xs text-blue-300 truncate">
                    {bookingStats.completedCount >= 5 ? 
                      'Auto-archived' : 
                      'Recent ones'
                    }
                  </p>
                </div>
                
                <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <FaTimesCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                    <span className="text-red-400 font-medium text-xs sm:text-sm">Cancelled</span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {bookingStats.cancelledCount}
                  </p>
                  <p className="text-xs text-red-300">Total cancelled</p>
                </div>
              </div>
              
              {!bookingStats.canCreatePending && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                    <p className="text-yellow-400 text-xs sm:text-sm font-medium">
                      {bookingStats.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content - Mobile First */}
        {bookings.length === 0 ? (
          // Empty State - Mobile Optimized
          <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-12 text-center">
            <div className="bg-gray-700 p-3 sm:p-4 lg:p-6 rounded-full w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 lg:mb-6 flex items-center justify-center">
              <FaCalendarAlt className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-gray-400" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 lg:mb-4">No bookings yet</h2>
            <p className="text-gray-400 mb-4 sm:mb-6 lg:mb-8 max-w-md mx-auto text-xs sm:text-sm lg:text-base px-2">
              You haven&apos;t made any reservations yet. Start planning your perfect getaway at Kampo Ibayo!
            </p>
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              {maintenanceActive ? (
                <div className="bg-gray-500 text-gray-300 px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 rounded-lg text-sm sm:text-base font-semibold cursor-not-allowed w-full sm:w-auto text-center">
                  Booking Temporarily Disabled
                </div>
              ) : (
                <Link href="/book">
                  <button className="bg-red-600 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-700 transition w-full sm:w-auto">
                    Make Your First Booking
                  </button>
                </Link>
              )}
              {maintenanceActive && (
                <p className="text-gray-400 text-xs sm:text-sm text-center">
                  Resort is temporarily closed for maintenance. Call <a href="tel:+639452779541" className="text-orange-400 hover:text-orange-300">+63 945 277 9541</a> for assistance.
                </p>
              )}
              <div className="text-center">
                <Link href="/" className="text-gray-400 hover:text-white transition text-xs sm:text-sm">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Bookings List - Mobile Optimized
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-2">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">
                  Your Reservations ({bookings.length})
                </h2>
                <div className="text-xs sm:text-sm text-gray-400">
                  {bookings.length > 6 ? (
                    <>Showing {startIndex + 1} to {endIndex} of {bookings.length}</>
                  ) : (
                    <>Showing all bookings</>
                  )}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {paginatedBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="bg-gray-700 rounded-lg p-3 sm:p-4 lg:p-6 hover:bg-gray-650 transition border border-gray-600/50"
                  >
                    {/* Header Section - Mobile Stack */}
                    <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="bg-red-600 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                            <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white truncate">
                              Booking #{booking.id}
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          {getStatusIcon(booking.status || 'pending')}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(booking.status || 'pending')}`}>
                            {(booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="px-2 sm:px-3">
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {booking.guest_name} • {booking.guest_email || 'No email'}
                        </p>
                      </div>
                    </div>

                    {/* Expiration Warning - Mobile Optimized */}
                    {shouldShowExpirationWarning(booking.created_at, booking.status || 'pending') && (
                      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-orange-900/30 border border-orange-600/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FaExclamationTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-orange-400 text-xs sm:text-sm font-medium">
                              {getExpirationWarningMessage(booking.created_at)}
                            </p>
                            <p className="text-orange-300 text-xs mt-1">
                              Pending for {getDaysPending(booking.created_at)} day(s). Contact admin or complete payment to confirm.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Details Grid - Mobile Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 text-gray-300 p-2 bg-gray-600/30 rounded">
                        <FaCalendarAlt className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">Check-in</p>
                          <p className="font-semibold text-xs truncate">
                            {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 p-2 bg-gray-600/30 rounded">
                        <FaCalendarAlt className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">Check-out</p>
                          <p className="font-semibold text-xs truncate">
                            {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 p-2 bg-gray-600/30 rounded">
                        <FaUsers className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">Guests</p>
                          <p className="font-semibold text-xs">{booking.number_of_guests} guest(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 p-2 bg-gray-600/30 rounded">
                        <FaClock className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">Total Amount</p>
                          <p className="font-semibold text-green-400 text-xs">₱{booking.total_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info - Mobile Optimized */}
                    {booking.guest_phone && (
                      <div className="mb-3 sm:mb-4 p-2 bg-gray-600/30 rounded">
                        <p className="text-gray-400 text-xs sm:text-sm">
                          📞 Contact: <a href={`tel:${booking.guest_phone}`} className="text-blue-400 hover:text-blue-300 hover:underline font-medium">{booking.guest_phone}</a>
                        </p>
                      </div>
                    )}

                    {/* Special Requests - Mobile Optimized */}
                    {booking.special_requests && (
                      <div className="bg-gray-600/50 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">
                        <p className="text-xs text-gray-400 mb-1">💬 Special Request:</p>
                        <p className="text-gray-200 text-xs sm:text-sm">{booking.special_requests}</p>
                      </div>
                    )}

                    {/* Actions Section - Mobile First */}
                    <div className="flex flex-col gap-2 sm:gap-3 pt-3 border-t border-gray-600">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-xs">
                          📅 {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          onClick={() => openModal(booking)}
                          className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-500 transition flex items-center justify-center gap-1"
                        >
                          👁️ View Details
                        </button>
                        {canCancelBooking(booking) ? (
                          <button 
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancelModal(true); // Skip booking details modal, go straight to cancellation
                            }}
                            className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-1"
                            title={getCancellationMessage(booking)}
                          >
                            ❌ Cancel
                          </button>
                        ) : booking.status?.toLowerCase() !== 'cancelled' && (
                          <button 
                            disabled
                            className="bg-gray-500 text-gray-300 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-1"
                            title={getCancellationMessage(booking)}
                          >
                            🚫 Cannot Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls - Mobile First Layout */}
              {bookings.length > 6 && (
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-700">
                  {/* Mobile: Single row with Prev | Numbers | Next */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    {/* Previous Button */}
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs sm:text-sm flex-shrink-0"
                      title="Previous page"
                    >
                      <FaChevronLeft className="w-3 h-3" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>

                    {/* Page Numbers - Centered */}
                    <div className="flex items-center gap-1 flex-1 justify-center">
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
                            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg transition min-w-[28px] sm:min-w-[32px] ${
                              currentPage === pageNumber
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs sm:text-sm flex-shrink-0"
                      title="Next page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span className="sm:hidden">Next</span>
                      <FaChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Modern Cancellation Modal - Matches Confirmation Design */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-start justify-center pt-20 z-[60] p-4">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/50 dark:border-gray-700/50 transform animate-in slide-in-from-top-4 fade-in duration-300">
            
            {/* Header with Icon */}
            <div className="flex items-center gap-3 p-5 pb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <FaTimesCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancel Booking</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Booking #{selectedBooking.id}</p>
              </div>
            </div>

            {/* Booking Summary Card */}
            <div className="mx-5 mb-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Guest</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {selectedBooking.guest_name}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Check-in</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {selectedBooking.check_in_date ? new Date(selectedBooking.check_in_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Check-out</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {selectedBooking.check_out_date ? new Date(selectedBooking.check_out_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Amount</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ₱{selectedBooking.total_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Guests</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {selectedBooking.number_of_guests} guest(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Reason Input */}
            <div className="mx-5 mb-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                Reason for cancellation
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please tell us why you're cancelling (required)"
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700/50 focus:border-red-500 dark:focus:border-red-400 focus:outline-none resize-none text-sm backdrop-blur-sm"
                rows={3}
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">{cancellationReason.length}/200 characters</p>
                {!cancellationReason.trim() && (
                  <p className="text-xs text-red-500">Required</p>
                )}
              </div>
            </div>

            {/* Warning Notice */}
            <div className="mx-5 mb-5">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full"></div>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                    This action cannot be undone. Your reservation will be permanently cancelled and you&apos;ll receive a confirmation email.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason("");
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelBooking(selectedBooking.id)}
                disabled={!cancellationReason.trim()}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                  cancellationReason.trim()
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-red-600/25'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <FaTimesCircle className="w-4 h-4" />
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal - Keep for "View Details" button */}
      {showModal && selectedBooking && !showCancelModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50">
            {/* Modal Header */}
            <div className="bg-red-600/90 backdrop-blur-sm p-4 sm:p-6 rounded-t-2xl border-b border-gray-200/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="bg-white/20 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                    <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">Booking Details</h2>
                    <p className="text-white/90 text-xs sm:text-sm">Your reservation information</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white/80 hover:text-white text-xl sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              {/* Booking Info Section */}
              <div className="bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200/50 dark:border-gray-600/50">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-6 gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="bg-red-600/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-full flex-shrink-0">
                      <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                        Booking #{selectedBooking.id}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate">
                        {selectedBooking.guest_name} • {selectedBooking.guest_email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusIcon(selectedBooking.status || 'pending')}
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(selectedBooking.status || 'pending')}`}>
                      {(selectedBooking.status || 'pending').charAt(0).toUpperCase() + (selectedBooking.status || 'pending').slice(1)}
                    </span>
                  </div>
                </div>

                {/* Dates and Guest Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                      <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400">Check-in Date</p>
                        <p className="font-semibold text-sm sm:text-base truncate">
                          {selectedBooking.check_in_date ? new Date(selectedBooking.check_in_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                      <FaUsers className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400">Number of Guests</p>
                        <p className="font-semibold text-sm sm:text-base">{selectedBooking.number_of_guests} guest(s)</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                      <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400">Check-out Date</p>
                        <p className="font-semibold text-sm sm:text-base truncate">
                          {selectedBooking.check_out_date ? new Date(selectedBooking.check_out_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                      <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400">Total Amount</p>
                        <p className="font-semibold text-green-400 text-sm sm:text-base">₱{selectedBooking.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                {selectedBooking.guest_phone && (
                  <div className="border-t border-gray-600 pt-3 sm:pt-4">
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Phone: <a href={`tel:${selectedBooking.guest_phone}`} className="text-blue-400 hover:text-blue-300 hover:underline font-medium">{selectedBooking.guest_phone}</a>
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Information - Modern Design */}
              <div className="space-y-3 sm:space-y-4">
                {/* Special Requests */}
                {selectedBooking.special_requests && (
                  <div className="bg-blue-50/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-200/50 dark:border-gray-600/50">
                    <h4 className="text-gray-900 dark:text-white font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
                      <FaCommentDots className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                      Special Requests
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm bg-white/50 dark:bg-gray-600/50 backdrop-blur-sm p-2 sm:p-3 rounded-lg break-words">
                      {selectedBooking.special_requests}
                    </p>
                  </div>
                )}

                {/* Pet Information */}
                {selectedBooking.brings_pet !== null && (
                  <div className="bg-green-50/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-green-200/50 dark:border-gray-600/50">
                    <h4 className="text-gray-900 dark:text-white font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
                      <span className="text-lg">🐾</span>
                      Pet Policy
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                      {selectedBooking.brings_pet ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          <span>✅</span> Pet-friendly booking
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-1">
                          <span>🚫</span> No pets for this booking
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Booking Date */}
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <h4 className="text-white font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
                    <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                    Booking Timeline
                  </h4>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-gray-300 text-xs sm:text-sm">
                      <span className="text-gray-400">Created:</span> {selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleDateString() : "N/A"}
                    </p>
                    {selectedBooking.status?.toLowerCase() === 'cancelled' && selectedBooking.cancelled_by && (
                      <div className="border-t border-gray-600 pt-2 mt-2">
                        <p className="text-red-400 text-xs sm:text-sm font-medium flex items-center gap-1">
                          <span>❌</span> Cancelled by {selectedBooking.cancelled_by === 'user' ? 'Guest' : 'Admin'}
                        </p>
                        {selectedBooking.cancelled_at && (
                          <p className="text-gray-400 text-xs">
                            <span className="text-gray-500">When:</span> {new Date(selectedBooking.cancelled_at).toLocaleDateString()} at {new Date(selectedBooking.cancelled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
                          </p>
                        )}
                        {selectedBooking.cancellation_reason && (
                          <p className="text-gray-400 text-xs break-words">
                            <span className="text-gray-500">Reason:</span> {selectedBooking.cancellation_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Modern Design */}
            <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm p-4 sm:p-6 rounded-b-2xl border-t border-gray-200/50 dark:border-gray-600/50">
              {canCancelBooking(selectedBooking) && !showCancelModal ? (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                  <button 
                    onClick={() => setShowCancelModal(true)}
                    className="bg-red-600 text-white px-4 py-2 sm:py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition order-2 sm:order-1"
                    title={getCancellationMessage(selectedBooking)}
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-gray-600 text-white px-4 py-2 sm:py-2 rounded-lg text-sm font-semibold hover:bg-gray-500 transition order-1 sm:order-2"
                  >
                    Close
                  </button>
                </div>
              ) : showCancelModal ? (
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Why are you cancelling this booking?</h4>
                    <textarea
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Please provide a reason for cancellation (required)"
                      className="w-full p-3 rounded-lg bg-gray-600 text-white placeholder-gray-400 border border-gray-500 focus:border-red-500 focus:outline-none resize-none text-sm"
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-gray-400 text-xs mt-1">{cancellationReason.length}/200 characters</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                    <button 
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      disabled={!cancellationReason.trim()}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition order-2 sm:order-1 ${
                        cancellationReason.trim() 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Confirm Cancellation
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelModal(false);
                        setCancellationReason("");
                      }}
                      className="bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-gray-500 transition order-1 sm:order-2"
                    >
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                  {!canCancelBooking(selectedBooking) && selectedBooking.status?.toLowerCase() !== 'cancelled' && (
                    <button 
                      disabled
                      className="bg-gray-500 text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed"
                      title={getCancellationMessage(selectedBooking)}
                    >
                      Cannot Cancel
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-500 transition flex-1"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      </div> {/* Close main content container */}
    </div>
  );
}
