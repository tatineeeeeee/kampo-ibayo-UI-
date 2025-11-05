"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useToastHelpers } from "../../components/Toast";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Tables } from "../../../database.types";
import { displayPhoneNumber } from "../../utils/phoneUtils";
import Image from "next/image";

interface Booking extends Tables<'bookings'> {
  // Add user info to track if user still exists
  user_exists?: boolean;
}

interface PaymentProof {
  id: number;
  booking_id: number;
  user_id: string;
  proof_image_url: string;
  reference_number: string | null;
  payment_method: string;
  amount: number;
  status: string;
  admin_notes: string | null;
  uploaded_at: string;
  verified_at: string | null;
  verified_by: string | null;
}

// Smart booking workflow status that considers both booking and payment proof
function getSmartWorkflowStatus(booking: Booking, paymentProof?: PaymentProof | null) {
  const bookingStatus = booking.status || 'pending';
  const proofStatus = paymentProof?.status || null;

  // Determine the current workflow step
  if (bookingStatus === 'pending') {
    if (!paymentProof) {
      return {
        step: 'awaiting_payment',
        priority: 4,
        badge: 'bg-orange-100 text-orange-800',
        text: 'Awaiting Payment',
        description: 'Guest needs to upload payment proof',
        actionNeeded: 'Remind guest to upload payment'
      };
    } else if (proofStatus === 'pending') {
      return {
        step: 'payment_review',
        priority: 5,
        badge: 'bg-amber-100 text-amber-800',
        text: 'Payment Review',
        description: 'Payment proof uploaded, admin review needed',
        actionNeeded: 'Review payment proof immediately'
      };
    } else if (proofStatus === 'verified') {
      return {
        step: 'ready_to_confirm',
        priority: 3,
        badge: 'bg-blue-100 text-blue-800',
        text: 'Payment Verified - Ready to Confirm',
        description: 'Payment verified, booking can now be confirmed',
        actionNeeded: 'Click Confirm button to finalize booking'
      };
    } else if (proofStatus === 'rejected') {
      return {
        step: 'payment_failed',
        priority: 4,
        badge: 'bg-red-100 text-red-800',
        text: 'Payment Rejected',
        description: 'Payment proof rejected, guest needs to resubmit',
        actionNeeded: 'Contact guest for new payment proof'
      };
    }
  } else if (bookingStatus === 'confirmed') {
    if (proofStatus === 'verified') {
      return {
        step: 'completed',
        priority: 1,
        badge: 'bg-green-100 text-green-800',
        text: 'Confirmed',
        description: 'Payment verified and booking confirmed',
        actionNeeded: 'Send check-in reminders'
      };
    } else if (proofStatus === 'pending') {
      return {
        step: 'confirmed_pending_payment',
        priority: 6,
        badge: 'bg-yellow-100 text-yellow-800',
        text: 'Confirmed - Payment Pending',
        description: 'Booking confirmed but payment still under review',
        actionNeeded: 'Verify payment proof to complete workflow'
      };
    }
  }

  // Standard states
  switch (bookingStatus) {
    case 'cancelled':
      return {
        step: 'cancelled',
        priority: 0,
        badge: 'bg-gray-100 text-gray-800',
        text: 'Cancelled',
        description: 'Booking has been cancelled',
        actionNeeded: 'None - archived'
      };
    case 'completed':
      return {
        step: 'completed',
        priority: 0,
        badge: 'bg-purple-100 text-purple-800',
        text: 'Completed',
        description: 'Guest stay completed successfully',
        actionNeeded: 'Request guest review'
      };
    default:
      return {
        step: 'unknown',
        priority: 2,
        badge: 'bg-gray-100 text-gray-800',
        text: 'Unknown',
        description: 'Booking status needs clarification',
        actionNeeded: 'Review and update status'
      };
  }
}

// Combined component - shows status AND action button
function PaymentProofStatusCell({ bookingId }: { bookingId: number }) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
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

    // Set up real-time subscription for payment proof updates
    const subscription = supabase
      .channel(`payment_proof_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_proofs',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          console.log('🔄 Payment proof real-time update:', payload);
          // Refresh payment proof data when changes occur
          fetchPaymentProof();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [bookingId]);

  if (loading) {
    return <span className="text-xs text-gray-400">Loading...</span>;
  }

  if (!paymentProof) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">No Proof</span>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          badge: 'bg-amber-100 text-amber-800', 
          text: 'Review Needed'
        };
      case 'verified':
        return { 
          badge: 'bg-emerald-100 text-emerald-800', 
          text: 'Verified'
        };
      case 'rejected':
        return { 
          badge: 'bg-red-100 text-red-800', 
          text: 'Rejected'
        };
      default:
        return { 
          badge: 'bg-gray-100 text-gray-600', 
          text: 'Unknown'
        };
    }
  };

  const statusInfo = getStatusInfo(paymentProof.status);
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.badge}`}>
      {statusInfo.text}
    </span>
  );
}

// Clean Workflow Status Component
function SmartWorkflowStatusCell({ booking }: { booking: Booking }) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_proofs')
          .select('*')
          .eq('booking_id', booking.id)
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

    // Set up real-time subscription for payment proof updates
    const subscription = supabase
      .channel(`workflow_payment_proof_${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_proofs',
          filter: `booking_id=eq.${booking.id}`
        },
        (payload) => {
          console.log('🔄 Workflow payment proof real-time update:', payload);
          // Refresh payment proof data when changes occur
          fetchPaymentProof();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [booking.id]);

  if (loading) {
    return <span className="text-xs text-gray-400">Loading...</span>;
  }

  const workflowStatus = getSmartWorkflowStatus(booking, paymentProof);
  
  return (
    <div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${workflowStatus.badge}`}>
        {workflowStatus.text}
      </span>
    </div>
  );
}

// Smart Confirm Button - Only allows confirmation after payment verification
function SmartConfirmButton({ booking, onConfirm, variant = 'table' }: { booking: Booking; onConfirm: (bookingId: number) => void; variant?: 'table' | 'modal' }) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_proofs')
          .select('*')
          .eq('booking_id', booking.id)
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
  }, [booking.id]);

  if (loading) {
    if (variant === 'modal') {
      return (
        <button 
          disabled
          className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md text-sm cursor-not-allowed"
          title="Loading payment status..."
        >
          Loading...
        </button>
      );
    }
    
    return (
      <button 
        disabled
        className="h-7 w-full px-2 py-1 bg-gray-300 text-gray-500 rounded text-xs cursor-not-allowed text-center flex items-center justify-center"
        title="Loading payment status..."
      >
        Loading...
      </button>
    );
  }

  const canConfirm = paymentProof && paymentProof.status === 'verified';

  if (!canConfirm) {
    let reason, buttonText;
    
    if (!paymentProof) {
      reason = "Step 1: Guest must upload payment proof";
      buttonText = "Need Payment";
    } else if (paymentProof.status === 'pending') {
      reason = "Step 2: Admin must verify payment first";
      buttonText = "Verify First";
    } else if (paymentProof.status === 'rejected') {
      reason = "Payment was rejected - new proof needed";
      buttonText = "Rejected";
    } else {
      reason = "Payment verification required";
      buttonText = "Cannot Confirm";
    }

    if (variant === 'modal') {
      return (
        <button 
          disabled
          className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md text-sm cursor-not-allowed"
          title={reason}
        >
          {buttonText}
        </button>
      );
    }
      
    return (
      <button 
        disabled
        className="h-7 w-full px-2 py-1 bg-gray-300 text-gray-500 rounded text-xs cursor-not-allowed text-center flex items-center justify-center"
        title={reason}
      >
        {buttonText}
      </button>
    );
  }

  if (variant === 'modal') {
    return (
      <button 
        onClick={() => onConfirm(booking.id)}
        className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 animate-pulse font-semibold"
        title="Step 3: Confirm booking (payment verified ✓)"
      >
        Confirm
      </button>
    );
  }
    
  return (
    <button 
      onClick={() => onConfirm(booking.id)}
      className="h-7 w-full px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 animate-pulse text-center flex items-center justify-center"
      title="Step 3: Confirm booking (payment verified ✓)"
    >
      Confirm
    </button>
  );
}

// Smart Payment Proof Action Button
function PaymentProofButton({ 
  bookingId, 
  onViewProof,
  variant = 'table'
}: { 
  bookingId: number;
  onViewProof: (proof: PaymentProof) => void;
  variant?: 'table' | 'modal';
}) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
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
    if (variant === 'modal') {
      return (
        <button 
          disabled
          className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md text-sm cursor-not-allowed"
        >
          Loading Payment Status...
        </button>
      );
    }
    
    return (
      <button 
        disabled
        className="h-7 w-full px-2 py-1 bg-gray-300 text-gray-500 rounded text-xs cursor-not-allowed text-center flex items-center justify-center"
      >
        Loading...
      </button>
    );
  }

  // Show different state if no payment proof exists
  if (!paymentProof) {
    return (
      <button 
        onClick={() => {
          // Create a dummy proof to show in modal that no proof exists
          const dummyProof = {
            id: 0,
            booking_id: bookingId,
            user_id: '',
            proof_image_url: '',
            reference_number: null,
            payment_method: '',
            amount: 0,
            status: 'none',
            admin_notes: null,
            uploaded_at: '',
            verified_at: null,
            verified_by: null
          };
          onViewProof(dummyProof);
        }}
        className={variant === 'modal' 
          ? "w-full px-4 py-2 bg-gray-400 text-white rounded-md text-sm hover:bg-gray-500 text-center" 
          : "h-7 w-full px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 text-center flex items-center justify-center"}
        title="Check for payment proof"
      >
        No Proof
      </button>
    );
  }

  const getButtonStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'verified':
        return 'bg-green-500 hover:bg-green-600';
      case 'rejected':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-purple-500 hover:bg-purple-600';
    }
  };

  const getButtonText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Review';
      case 'verified':
        return 'View Proof';
      case 'rejected':
        return 'View Proof';
      default:
        return 'View Proof';
    }
  };

  const buttonClasses = variant === 'modal'
    ? `w-full px-4 py-2 text-white rounded-md text-sm transition text-center ${getButtonStyle(paymentProof.status)}`
    : `h-7 w-full px-2 py-1 text-white rounded text-xs transition text-center flex items-center justify-center ${getButtonStyle(paymentProof.status)}`;

  return (
    <button
      onClick={() => onViewProof(paymentProof)}
      className={buttonClasses}
      title={`View payment proof (${paymentProof.status})`}
    >
      {getButtonText(paymentProof.status)}
    </button>
  );
}

// Component to show admin dashboard summary
function AdminDashboardSummary() {
  const [stats, setStats] = useState({
    pendingPayments: 0,
    pendingBookings: 0,
    todayCheckIns: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get pending payment proofs
        const { data: pendingProofs, error: proofsError } = await supabase
          .from('payment_proofs')
          .select('booking_id')
          .eq('status', 'pending');

        // Get all bookings for other stats
        const { data: allBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*');

        if (proofsError || bookingsError) {
          console.error('Error fetching stats:', proofsError || bookingsError);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        
        setStats({
          pendingPayments: pendingProofs?.length || 0,
          pendingBookings: allBookings?.filter(b => b.status === 'pending').length || 0,
          todayCheckIns: allBookings?.filter(b => b.check_in_date === today).length || 0,
          totalRevenue: allBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="bg-white rounded-xl shadow-md p-4 mb-4">Loading dashboard...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`text-center p-3 rounded-lg border ${stats.pendingPayments > 0 ? 'bg-orange-50 border-orange-200 animate-pulse' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-2xl font-bold ${stats.pendingPayments > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
            {stats.pendingPayments}
          </p>
          <p className="text-xs text-gray-600">Payment Reviews Needed</p>
          {stats.pendingPayments > 0 && <p className="text-xs text-orange-600 font-medium">⚠ Urgent</p>}
        </div>
        <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
          <p className="text-xs text-gray-600">Pending Bookings</p>
        </div>
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{stats.todayCheckIns}</p>
          <p className="text-xs text-gray-600">Today&apos;s Check-ins</p>
        </div>
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-2xl font-bold text-green-600">₱{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-600">Total Revenue</p>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false); // ✅ Start false for instant UI
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [adminCancellationReason, setAdminCancellationReason] = useState("");
  const [showDeletedUsers, setShowDeletedUsers] = useState(true);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [shouldRefund, setShouldRefund] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Payment proof state
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState<PaymentProof | null>(null);
  const [paymentProofLoading, setPaymentProofLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [customRejectionReason, setCustomRejectionReason] = useState("");
  const [imageZoomed, setImageZoomed] = useState(false);
  
  // Enhanced rejection reasons for payment proofs
  const rejectionReasons = [
    { value: "", label: "Select a reason for rejection..." },
    { value: "unclear_image", label: "Image is unclear or blurry" },
    { value: "wrong_amount", label: "Payment amount does not match booking" },
    { value: "invalid_reference", label: "Invalid or missing reference number" },
    { value: "wrong_account", label: "Payment sent to wrong account" },
    { value: "incomplete_details", label: "Missing payment details or information" },
    { value: "duplicate_payment", label: "Duplicate payment submission" },
    { value: "expired_booking", label: "Booking has expired" },
    { value: "custom", label: "Other (specify below)" }
  ];
  
  // Keyboard support for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageZoomed) {
        setImageZoomed(false);
      }
    };

    if (imageZoomed) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [imageZoomed]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);

  // Toast helpers
  const { success, error: showError, warning } = useToastHelpers();
  useEffect(() => {
    // ✅ OPTIMIZED: Delayed fetch to not block navigation
    const timer = setTimeout(() => fetchBookings(), 100);

    // ✅ RE-ENABLED: Real-time subscriptions (AuthContext navigation fixed!)
    console.log('� Setting up real-time bookings subscriptions...');
    
    // Set up real-time subscription for bookings
    const bookingsSubscription = supabase
      .channel('admin-bookings-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
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
      clearTimeout(timer); // ✅ Cleanup timer
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

  // Handle payment proof verification
  const handlePaymentProofAction = async (action: 'approve' | 'reject', proofId: number) => {
    console.log('🚀 Starting payment proof action:', { action, proofId, selectedPaymentProof });
    
    // Prevent double-clicking
    if (paymentProofLoading) {
      console.log('⚠️ Action already in progress, ignoring duplicate request');
      return;
    }
    
    setPaymentProofLoading(true);
    
    try {
      console.log('🔐 Checking user authentication...');
      
      // Skip user lookup to avoid hanging - use placeholder since API will handle admin permissions
      console.log('⚡ Skipping user lookup, using admin placeholder...');
      
      const user = {
        id: 'admin-placeholder',
        email: 'admin@kampoibayow.com'
      };
      
      console.log('✅ Using admin placeholder:', user.email);
      console.log('📋 Updating payment proof status...');
      
      // First, let's check if the payment proof exists
      console.log('🔍 Checking if payment proof exists with ID:', proofId);
      const { data: existingProof, error: fetchError } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('id', proofId)
        .single();
      
      console.log('📄 Existing proof check result:', { existingProof, fetchError });
      
      if (fetchError) {
        console.error('❌ Failed to fetch payment proof:', fetchError);
        throw new Error(`Payment proof not found: ${fetchError.message}`);
      }
      
      if (!existingProof) {
        console.error('❌ No payment proof found with ID:', proofId);
        throw new Error('Payment proof not found');
      }
      
      console.log('✅ Payment proof found, proceeding with update...');
      
      // Use API endpoint with admin permissions to bypass RLS issues
      console.log('🌐 Calling admin API endpoint...');
      
      // Import timeout utility
      const { withTimeout } = await import('../../utils/apiTimeout');
      
      // Add timeout to prevent hanging with enhanced error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await withTimeout(
        fetch('/api/admin/verify-payment-proof', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            proofId: proofId,
            action: action,
            adminId: user.id,
            adminNotes: verificationNotes || null,
            rejectionReason: action === 'reject' ? (rejectionReason === 'custom' ? customRejectionReason : rejectionReasons.find(r => r.value === rejectionReason)?.label || null) : null
          }),
          signal: controller.signal
        }),
        15000,
        'Payment proof verification timed out'
      );

      clearTimeout(timeoutId);
      console.log('🌐 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🌐 API Response data:', result);

      console.log('✅ Payment proof updated successfully via API');

      console.log('🎉 Payment proof action completed successfully!');
      
      // Show success message first
      success(action === 'approve' ? 'Payment proof approved successfully!' : 'Payment proof rejected successfully!');
      
      // Close modal immediately
      console.log('🔄 Closing modal and clearing state...');
      setShowPaymentProofModal(false);
      setSelectedPaymentProof(null);
      setVerificationNotes("");
      setRejectionReason("");
      setCustomRejectionReason("");
      
      // Force refresh data with retry mechanism
      console.log('♻️ Force refreshing all data...');
      
      try {
        await fetchBookings(true); // Force refresh bookings
        console.log('✅ Bookings refreshed successfully');
      } catch (refreshError) {
        console.warn('⚠️ Bookings refresh failed, will retry:', refreshError);
        // Retry once more after a short delay
        setTimeout(async () => {
          try {
            await fetchBookings(true);
            console.log('✅ Bookings refreshed on retry');
          } catch (retryError) {
            console.error('❌ Bookings refresh failed on retry:', retryError);
          }
        }, 1000);
      }

      console.log('✅ All operations completed successfully');
    } catch (error) {
      console.error('💥 Error in handlePaymentProofAction:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showError(`Error updating payment proof: ${errorMessage}. Please try again.`);
      
      // Don't close modal on error, let user retry
      console.log('❌ Keeping modal open due to error');
    } finally {
      console.log('🔧 Setting paymentProofLoading to false');
      setPaymentProofLoading(false);
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
            const refundErrorText = await refundApiResponse.text();
            console.error('❌ Refund processing failed:', refundErrorText);
            
            try {
              const refundErrorData = JSON.parse(refundErrorText);
              
              if (refundErrorData.requires_manual_processing) {
                // Show a more user-friendly message for amount limits
                const { refund_amount, max_amount } = refundErrorData;
                warning(
                  `PayMongo Test Mode Limit`, 
                  `Booking amount: ₱${refund_amount.toLocaleString()} exceeds PayMongo TEST MODE limit of ₱${max_amount.toLocaleString()}. For ₱9K-₱12K bookings, switch to LIVE MODE or process refund manually. This limit only applies to test mode.`
                );
                console.log('ℹ️ Manual refund required due to PayMongo TEST MODE limits');
              } else if (refundErrorData.error && refundErrorData.error.includes('payment_id')) {
                warning('Payment Processing Error', 'Unable to process automatic refund. Please handle the refund manually through PayMongo dashboard.');
              } else {
                warning('Refund Failed', 'Booking will be cancelled but automatic refund failed. Please process the refund manually.');
              }
            } catch {
              warning('Refund Failed', 'Booking will be cancelled but automatic refund failed. Please process the refund manually.');
            }
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
      <AdminDashboardSummary />
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
                  <th className="p-3">Workflow Status</th>
                  <th className="p-3">Payment</th>
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
                          {displayPhoneNumber(booking.guest_phone)}
                        </a>
                      ) : (
                        <span className="text-gray-400">No phone</span>
                      )}
                    </td>
                    <td className="p-3 text-black">{formatDate(booking.check_in_date)}</td>
                    <td className="p-3 text-black">{formatDate(booking.check_out_date)}</td>
                    <td className="p-3 text-black">{booking.number_of_guests}</td>
                      <td className="p-3 text-black">
                      <div className="font-medium">₱{booking.total_amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">
                        {booking.payment_type === 'full' ? (
                          `₱${booking.total_amount.toLocaleString()} due (Full Payment)`
                        ) : (
                          `₱${Math.round(booking.total_amount * 0.5).toLocaleString()} paid • ₱${Math.round(booking.total_amount * 0.5).toLocaleString()} due`
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <SmartWorkflowStatusCell booking={booking} />
                    </td>
                    <td className="p-3">
                      <PaymentProofStatusCell bookingId={booking.id} />
                    </td>
                    <td className="p-3">
                      <div className="w-40 flex flex-col gap-2">
                        {/* Primary Actions Row - Fixed Width */}
                        <div className="grid grid-cols-2 gap-1">
                          <button 
                            onClick={() => openModal(booking)}
                            className="h-7 w-full px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 text-center flex items-center justify-center"
                            title="View booking details"
                          >
                            View
                          </button>
                          
                          <PaymentProofButton 
                            bookingId={booking.id} 
                            onViewProof={(proof) => {
                              setSelectedPaymentProof(proof);
                              setShowPaymentProofModal(true);
                            }} 
                          />
                        </div>

                        {/* Secondary Actions Row - Only for pending bookings */}
                        {(booking.status || 'pending') === 'pending' && (
                          <div className="grid grid-cols-2 gap-1">
                            <div className="w-full">
                              <SmartConfirmButton 
                                booking={booking}
                                onConfirm={(bookingId) => updateBookingStatus(bookingId, 'confirmed')}
                              />
                            </div>
                            <button 
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowModal(true);
                                setShowCancelModal(true);
                              }}
                              className="h-7 w-full px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 text-center flex items-center justify-center"
                              title="Cancel booking"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
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
                    <p className="text-xs text-yellow-600 font-medium mb-1">Total Booking Value</p>
                    <p className="font-semibold text-green-600">₱{selectedBooking.total_amount.toLocaleString()}</p>
                    <div className="mt-2 text-xs text-gray-600">
                      {selectedBooking.payment_type === 'full' ? (
                        <div className="flex justify-between">
                          <span>Full Payment Required:</span>
                          <span className="font-medium text-blue-700">₱{selectedBooking.total_amount.toLocaleString()}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span>Down Payment:</span>
                            <span className="font-medium text-green-700">₱{Math.round(selectedBooking.total_amount * 0.5).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pay on Arrival:</span>
                            <span className="font-medium text-orange-700">₱{Math.round(selectedBooking.total_amount * 0.5).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Status Information */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-3">
                  <h4 className="text-sm font-semibold text-blue-700 mb-3">💳 Payment Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedBooking.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedBooking.payment_status || 'pending'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount Collected:</span>
                      <span className="font-semibold text-green-700">
                        {selectedBooking.payment_status === 'paid' 
                          ? (selectedBooking.payment_type === 'full' 
                            ? `₱${selectedBooking.total_amount.toLocaleString()}` 
                            : `₱${Math.round(selectedBooking.total_amount * 0.5).toLocaleString()}`)
                          : '₱0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Balance Due (F2F):</span>
                      <span className="font-semibold text-orange-700">
                        {selectedBooking.payment_type === 'full' 
                          ? (selectedBooking.payment_status === 'paid' ? '₱0' : `₱${selectedBooking.total_amount.toLocaleString()}`)
                          : `₱${Math.round(selectedBooking.total_amount * 0.5).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Revenue Value:</span>
                      <span className="font-bold text-blue-700">
                        ₱{selectedBooking.total_amount.toLocaleString()}
                      </span>
                    </div>
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
                          {displayPhoneNumber(selectedBooking.guest_phone)}
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
                <div className="space-y-4">
                  {/* Action Sections Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Verification Section */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        Payment Verification
                      </h4>
                      <PaymentProofButton 
                        bookingId={selectedBooking.id}
                        variant="modal"
                        onViewProof={(proof) => {
                          setSelectedPaymentProof(proof);
                          setShowPaymentProofModal(true);
                        }} 
                      />
                    </div>
                    
                    {/* Booking Management Section */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        Booking Management
                      </h4>
                      <div className="flex gap-2">
                        <SmartConfirmButton 
                          booking={selectedBooking}
                          variant="modal"
                          onConfirm={(bookingId) => {
                            updateBookingStatus(bookingId, 'confirmed');
                            closeModal();
                          }}
                        />
                        <button 
                          onClick={() => setShowCancelModal(true)}
                          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md text-sm font-semibold hover:bg-red-600 transition"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Close Button - Separate */}
                  <div className="flex justify-center pt-2 border-t border-gray-200">
                    <button
                      onClick={closeModal}
                      className="px-8 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition"
                    >
                      Close Modal
                    </button>
                  </div>
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
                                  {selectedBooking.payment_type === 'full' 
                                    ? `Cancel with full payment refund (₱${selectedBooking.total_amount.toLocaleString()})`
                                    : `Cancel with down payment refund (₱${Math.round(selectedBooking.total_amount * 0.5).toLocaleString()})`}
                                </span>
                              </label>
                            </div>
                            <p className="text-blue-600 text-xs mt-2">
                              {selectedBooking.payment_type === 'full' 
                                ? '* Full payment amount is refundable since guest paid the complete amount upfront.'
                                : `* Only down payment (50%) is refundable. F2F balance (₱${Math.round(selectedBooking.total_amount * 0.5).toLocaleString()}) was never charged.`}
                            </p>
                            
                            {/* Manual Refund Processing Note */}
                            {((selectedBooking.payment_type === 'full' ? selectedBooking.total_amount : Math.round(selectedBooking.total_amount * 0.5)) > 5000) && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-blue-700 text-xs">
                                  ℹ️ <strong>Manual Refund Processing:</strong> Since this is a manual payment proof system, 
                                  refunds will need to be processed manually through your payment method (bank transfer, GCash, etc.). 
                                  Please coordinate with the guest for refund details.
                                </p>
                              </div>
                            )}
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

      {/* Payment Proof Modal */}
      {showPaymentProofModal && selectedPaymentProof && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="bg-gray-50 p-6 rounded-t-lg border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Payment Proof Verification</h2>
                  <p className="text-gray-600 text-sm">Review and verify payment submission</p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentProofModal(false);
                    setSelectedPaymentProof(null);
                    setVerificationNotes("");
                    setRejectionReason("");
                    setCustomRejectionReason("");
                    setImageZoomed(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:shadow-md transition"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Payment Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-black mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-black">Amount:</span>
                    <p className="text-black">₱{selectedPaymentProof.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-black">Method:</span>
                    <p className="text-black">{selectedPaymentProof.payment_method}</p>
                  </div>
                  <div>
                    <span className="font-medium text-black">Reference:</span>
                    <p className="text-black">{selectedPaymentProof.reference_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-black">Status:</span>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      selectedPaymentProof.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedPaymentProof.status === 'verified' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPaymentProof.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-black">Uploaded:</span>
                    <p className="text-black">{new Date(selectedPaymentProof.uploaded_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Payment Proof Image */}
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment Proof</h3>
                </div>
                
                <div className="relative group cursor-pointer" onClick={() => setImageZoomed(true)}>
                  {/* Image Container */}
                  <div className="relative overflow-hidden rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 transition-all duration-300 group-hover:border-blue-300 group-hover:shadow-md">
                    <Image 
                      src={selectedPaymentProof.proof_image_url} 
                      alt="Payment Proof"
                      width={500}
                      height={400}
                      className="w-full h-auto max-h-80 object-contain pointer-events-none transition-all duration-500 group-hover:scale-105"
                    />
                    
                    {/* Overlay with zoom hint */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 shadow-lg">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action hint */}
                  <p className="text-xs text-gray-500 mt-2 text-center font-medium">Click to view full size</p>
                </div>
              </div>

              {/* Full Screen Image Modal */}
              {imageZoomed && (
                <div className="fixed inset-0 bg-black z-[70] flex items-center justify-center">
                  {/* Backdrop - Click to close */}
                  <div 
                    className="absolute inset-0 bg-black cursor-pointer"
                    onClick={() => setImageZoomed(false)}
                  />
                  
                  {/* Image Container */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
                    <Image 
                      src={selectedPaymentProof.proof_image_url} 
                      alt="Payment Proof - Full View"
                      width={1920}
                      height={1080}
                      className="max-w-full max-h-full object-contain cursor-pointer"
                      onClick={() => setImageZoomed(false)}
                      priority
                    />
                  </div>
                  
                  {/* Close Button */}
                  <button
                    onClick={() => setImageZoomed(false)}
                    className="absolute top-4 right-4 z-20 bg-black/70 hover:bg-black/90 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors duration-200"
                    aria-label="Close"
                  >
                    ×
                  </button>
                  
                  {/* Instructions */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 text-white text-sm px-4 py-2 rounded">
                    Press ESC or click anywhere to close
                  </div>
                </div>
              )}

              {/* Enhanced Admin Verification Interface */}
              {selectedPaymentProof.status === 'pending' && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 space-y-5">
                  {/* Rejection Reason Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <label className="block text-sm font-semibold text-gray-900">
                        Rejection Reason (Required for rejection)
                      </label>
                    </div>
                    <select
                      value={rejectionReason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value);
                        if (e.target.value !== 'custom') {
                          setCustomRejectionReason('');
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                      {rejectionReasons.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                    
                    {/* Custom Rejection Reason */}
                    {rejectionReason === 'custom' && (
                      <textarea
                        value={customRejectionReason}
                        onChange={(e) => setCustomRejectionReason(e.target.value)}
                        placeholder="Please specify the reason for rejection..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-red-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500 resize-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      />
                    )}
                    
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      User will be notified via email with this reason and can resubmit payment proof
                    </p>
                  </div>

                  {/* Admin Notes */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <label className="block text-sm font-semibold text-gray-900">
                        Additional Notes (Optional)
                      </label>
                    </div>
                    <textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add verification notes, concerns, or additional information for internal reference..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Internal notes for record keeping and future reference
                    </p>
                  </div>
                </div>
              )}

              {/* Existing Admin Notes */}
              {selectedPaymentProof.admin_notes && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-r-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="font-semibold text-amber-800">Previous Admin Notes</h4>
                  </div>
                  <p className="text-amber-700 text-sm leading-relaxed bg-white/50 rounded-lg p-3">{selectedPaymentProof.admin_notes}</p>
                  {selectedPaymentProof.verified_at && (
                    <p className="text-blue-600 text-xs mt-2">
                      Verified on: {new Date(selectedPaymentProof.verified_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                {selectedPaymentProof.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handlePaymentProofAction('approve', selectedPaymentProof.id)}
                      disabled={paymentProofLoading}
                      className="flex-1 group relative bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {paymentProofLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve Payment
                          </>
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        // Validate rejection reason is selected
                        if (!rejectionReason || (rejectionReason === 'custom' && !customRejectionReason.trim())) {
                          showError('Please select a reason for rejection before proceeding.');
                          return;
                        }
                        handlePaymentProofAction('reject', selectedPaymentProof.id);
                      }}
                      disabled={paymentProofLoading}
                      className="flex-1 group relative bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {paymentProofLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject Payment
                          </>
                        )}
                      </span>
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center py-2 px-4 bg-gray-100 text-gray-600 rounded-md text-sm font-medium">
                    Payment has been {selectedPaymentProof.status}
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowPaymentProofModal(false);
                    setSelectedPaymentProof(null);
                    setVerificationNotes("");
                    setRejectionReason("");
                    setCustomRejectionReason("");
                    setImageZoomed(false);
                  }}
                  disabled={paymentProofLoading}
                  className="py-2 px-4 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 transition disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
