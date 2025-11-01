"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { isMaintenanceMode } from "../utils/maintenanceMode";
import { displayPhoneNumber } from "../utils/phoneUtils";
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

type Booking = Tables<'bookings'>;

// Component to show upload button based on payment proof status
function PaymentProofUploadButton({ bookingId }: { bookingId: number }) {
  const [proofStatus, setProofStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPaymentProof = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_proofs')
          .select('status')
          .eq('booking_id', bookingId)
          .order('uploaded_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        setProofStatus(data && data.length > 0 ? data[0].status : null);
      } catch (error) {
        console.error('Error checking payment proof:', error);
        setProofStatus(null);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentProof();

    // Refresh every 10 seconds to catch new uploads
    const interval = setInterval(checkPaymentProof, 10000);
    return () => clearInterval(interval);
  }, [bookingId]);

  if (loading) {
    return (
      <div className="bg-gray-700 text-gray-400 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
        Checking...
      </div>
    );
  }

  // Show upload button only if no proof exists (rejected proofs handled by UserPaymentProofStatus)
  if (!proofStatus) {
    return (
      <Link href={`/upload-payment-proof?bookingId=${bookingId}`}>
        <button className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1">
          📤 Upload Payment Proof
        </button>
      </Link>
    );
  }

  // For rejected proofs, don't show button here (UserPaymentProofStatus will handle it)
  if (proofStatus === 'rejected') {
    return null; // No button, the rejection status will show the resubmit button
  }

  // Show status for pending or verified proofs
  if (proofStatus === 'pending') {
    return (
      <div className="bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1">
        ⏳ Under Review
      </div>
    );
  }

  if (proofStatus === 'verified') {
    return (
      <div className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1">
        ✅ Payment Verified
      </div>
    );
  }

  // Fallback for unknown status
  return (
    <Link href={`/upload-payment-proof?bookingId=${bookingId}`}>
      <button className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-1">
        Upload Payment Proof
      </button>
    </Link>
  );
}

// Payment proof status component for user bookings
function UserPaymentProofStatus({ bookingId }: { bookingId: number }) {
  const [paymentProof, setPaymentProof] = useState<Tables<'payment_proofs'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_proofs')
          .select('*')
          .eq('booking_id', bookingId)
          .order('uploaded_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        setPaymentProof(data && data.length > 0 ? data[0] : null);
      } catch (error) {
        console.error('Error fetching payment proof:', error);
        setPaymentProof(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentProof();
  }, [bookingId]);

  if (loading) {
    return <span className="text-xs text-gray-400">Loading payment status...</span>;
  }

  if (!paymentProof) {
    return (
      <div className="bg-orange-900/30 border border-orange-600/50 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-orange-500">⚠️</span>
          <span className="text-sm font-medium text-orange-300">Payment Proof Required</span>
        </div>
        <p className="text-xs text-orange-200 mb-3">
          Upload your payment proof to confirm this booking. Pay 50% down payment first, then upload the receipt.
        </p>
        <div className="flex gap-2">
          <Link href={`/upload-payment-proof?bookingId=${bookingId}`}>
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-xs font-medium transition">
              Upload Now
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-900/30 border-yellow-600/50 text-yellow-300',
          icon: '⏳',
          title: 'Payment Under Review',
          message: 'Admin is reviewing your payment proof',
          messageColor: 'text-yellow-200'
        };
      case 'approved':
      case 'verified':
        return {
          color: 'bg-green-900/30 border-green-600/50 text-green-300',
          icon: '✅',
          title: 'Payment Verified',
          message: 'Your payment has been verified! Waiting for final booking confirmation.',
          messageColor: 'text-green-200'
        };
      case 'rejected':
        return {
          color: 'bg-red-900/20 border-red-500/30 text-red-400',
          icon: '❌',
          title: 'Payment Rejected',
          message: 'Upload a corrected payment proof',
          messageColor: 'text-red-300'
        };
      default:
        return {
          color: 'bg-gray-800/50 border-gray-600/50 text-gray-300',
          icon: '❓',
          title: 'Unknown Status',
          message: 'Contact admin for assistance',
          messageColor: 'text-gray-400'
        };
    }
  };

  const statusInfo = getStatusInfo(paymentProof.status);

  return (
    <div className={`border rounded-lg p-3 mb-3 ${statusInfo.color}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{statusInfo.icon}</span>
          <span className="text-sm font-medium">{statusInfo.title}</span>
        </div>
        {paymentProof.status === 'rejected' && (
          <Link href={`/upload-payment-proof?bookingId=${bookingId}`}>
            <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium transition">
              Upload New
            </button>
          </Link>
        )}
      </div>
      
      {paymentProof.admin_notes && paymentProof.status === 'rejected' && (
        <div className="text-xs text-red-200 space-y-1">
          {(() => {
            const notes = paymentProof.admin_notes;
            let rejectionReason = null;
            let adminNotes = null;
            
            if (notes.includes('REJECTION REASON:')) {
              const parts = notes.split('\n\nADMIN NOTES:');
              rejectionReason = parts[0].replace('REJECTION REASON: ', '');
              adminNotes = parts[1] ? parts[1].trim() : null;
            } else {
              rejectionReason = notes;
            }
            
            return (
              <>
                <div className="bg-red-900/20 p-2 rounded">
                  {rejectionReason}
                </div>
                {adminNotes && (
                  <div className="bg-gray-800/30 p-2 rounded text-gray-400">
                    <span className="font-medium">Admin notes: </span>{adminNotes}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      
      {paymentProof.admin_notes && paymentProof.status !== 'rejected' && (
        <div className="text-xs text-gray-400 bg-gray-800/30 p-2 rounded mb-2">
          {paymentProof.admin_notes}
        </div>
      )}
    </div>
  );
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
  const searchParams = useSearchParams();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Handle payment upload success message - use ref to avoid infinite loop
  const hasShownSuccessRef = useRef(false);
  
  useEffect(() => {
    const paymentUploaded = searchParams.get('payment_uploaded');
    if (paymentUploaded === 'true' && !hasShownSuccessRef.current) {
      hasShownSuccessRef.current = true;
      
      showToast({
        type: 'success',
        title: '🎉 Payment Proof Uploaded!',
        message: 'Your payment proof has been submitted successfully. We\'ll verify it within 24 hours.',
        duration: 5000
      });
      
      // Clean up the URL parameter and trigger refresh
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment_uploaded');
      window.history.replaceState({}, '', newUrl.toString());
      setRefreshTrigger(prev => prev + 1); // Force refresh bookings data
    }
  }, [searchParams, showToast]);

  // Add window focus listener to refresh data when user returns to the page
  useEffect(() => {
    let lastFocusTime = 0;
    
    const handleFocus = () => {
      const now = Date.now();
      // Throttle focus events to prevent rapid refreshes (min 2 seconds between refreshes)
      if (now - lastFocusTime > 2000) {
        console.log('🔄 Page focused - refreshing bookings...');
        lastFocusTime = now;
        setRefreshTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

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
      
      setIsRefreshing(true);
      
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
      setIsRefreshing(false);
    }
    
    if (user) {
      loadBookings();
    }
  }, [user, refreshTrigger]);

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
      case "pending_confirmation":
        return <FaCheckCircle className="w-5 h-5 text-blue-500" />;
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
      case "pending_confirmation":
        return "bg-blue-600";
      case "cancelling":
        return "bg-orange-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending_confirmation":
        return "Payment Verified";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold mb-2">Loading your bookings...</div>
          <div className="text-gray-400 text-sm">
            {authLoading ? 'Authenticating...' : 'Fetching booking data...'}
          </div>
        </div>
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
              <button
                onClick={() => {
                  if (!isRefreshing) { // Extra safety: don't allow click while already refreshing
                    console.log('🔄 Manual refresh triggered');
                    setRefreshTrigger(prev => prev + 1);
                  }
                }}
                disabled={isRefreshing}
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors ml-2 ${isRefreshing ? 'opacity-50' : ''}`}
                title="Refresh Bookings"
              >
                {isRefreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-gray-300"></div>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
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
            {/* Payment Process Info - Show if user has pending bookings */}
            {bookings.some(b => b.status === 'pending') && (
              <div className="bg-blue-800/50 border border-blue-600/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  💡 Complete Your Booking
                </h3>
                <p className="text-blue-200 text-xs sm:text-sm mb-2">
                  Your bookings are <strong>pending</strong> until you upload payment proof. Here&apos;s how:
                </p>
                <div className="space-y-1 text-blue-100 text-xs">
                  <p>1. 💳 Pay 50% down payment via GCash, Bank Transfer, or other methods</p>
                  <p>2. 📱 Take a screenshot/photo of your payment receipt</p>
                  <p>3. Click &quot;Upload Payment Proof&quot; on your booking</p>
                  <p>4. ✅ Admin will review and confirm your booking within 24 hours</p>
                </div>
              </div>
            )}
            
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
                            {getStatusDisplayName(booking.status || 'pending')}
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
                          📞 Contact: <a href={`tel:${booking.guest_phone}`} className="text-blue-400 hover:text-blue-300 hover:underline font-medium">{displayPhoneNumber(booking.guest_phone)}</a>
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

                    {/* Payment Proof Status - Show for pending and pending_confirmation */}
                    {(booking.status === 'pending' || booking.status === 'pending_confirmation') && (
                      <UserPaymentProofStatus bookingId={booking.id} />
                    )}

                    {/* Pending Confirmation Message */}
                    {booking.status === 'pending_confirmation' && (
                      <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-3 mb-3 sm:mb-4">
                        <div className="flex items-start gap-2">
                          <FaCheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-blue-300 font-medium text-sm">Payment Verified! ✅</h4>
                            <p className="text-blue-200 text-xs mt-1">
                              Your payment has been verified by our admin team. 
                              Your booking will be confirmed shortly and you&apos;ll receive a confirmation email.
                            </p>
                            <p className="text-blue-300 text-xs mt-2 font-medium">
                              📧 Check your email for updates • 📞 Contact us if you have questions
                            </p>
                          </div>
                        </div>
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
                          View Details
                        </button>
                        
                        {/* Upload Payment Proof Button - Only show if pending (not pending_confirmation) */}
                        {booking.status === 'pending' && (
                          <PaymentProofUploadButton bookingId={booking.id} />
                        )}

                        {canCancelBooking(booking) ? (
                          <button 
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancelModal(true); // Skip booking details modal, go straight to cancellation
                            }}
                            className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-1"
                            title={getCancellationMessage(booking)}
                          >
                            Cancel
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

      {/* Enhanced Cancellation Modal - Familiar Design + Policy Info */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-start justify-center pt-20 z-[60] p-4">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/50 dark:border-gray-700/50 transform animate-in slide-in-from-top-4 fade-in duration-300 max-h-[90vh] overflow-y-auto">
            
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
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Amount</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ₱{selectedBooking.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Refund Information - Compact Policy Integration */}
            <div className="mx-5 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Your Refund</h4>
                {(() => {
                  const checkIn = new Date(selectedBooking.check_in_date);
                  const now = new Date();
                  const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
                  const downPayment = selectedBooking.total_amount * 0.5;
                  
                  let percentage: number;
                  let canCancel = true;
                  
                  if (hoursUntilCheckIn >= 48) {
                    percentage = 100;
                  } else if (hoursUntilCheckIn >= 24) {
                    percentage = 50;
                  } else {
                    percentage = 0;
                    canCancel = false;
                  }
                  
                  const refundAmount = Math.round(downPayment * (percentage / 100));
                  
                  if (!canCancel) {
                    return (
                      <div className="text-center">
                        <p className="text-red-600 dark:text-red-400 font-medium text-sm">
                          Cancellation not allowed within 24 hours
                        </p>
                        <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                          Please contact resort directly for assistance
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-blue-600 dark:text-blue-400">Down Payment</span>
                        <span className="font-medium text-blue-800 dark:text-blue-300">₱{downPayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-blue-600 dark:text-blue-400">Refund Amount ({percentage}%)</span>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">₱{refundAmount.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Time until check-in: {Math.floor(hoursUntilCheckIn)} hours
                      </p>
                    </div>
                  );
                })()}
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
              {(() => {
                const checkIn = new Date(selectedBooking.check_in_date);
                const now = new Date();
                const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
                const canCancel = hoursUntilCheckIn >= 24;
                
                if (!canCancel) {
                  return (
                    <button
                      disabled
                      className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-4 py-3 rounded-xl text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <FaTimesCircle className="w-4 h-4" />
                      Cannot Cancel
                    </button>
                  );
                }
                
                return (
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
                );
              })()}
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
                      {getStatusDisplayName(selectedBooking.status || 'pending')}
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
                      Phone: <a href={`tel:${selectedBooking.guest_phone}`} className="text-blue-400 hover:text-blue-300 hover:underline font-medium">{displayPhoneNumber(selectedBooking.guest_phone)}</a>
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
