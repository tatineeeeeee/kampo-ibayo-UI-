"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useToastHelpers } from "../../components/Toast";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from "lucide-react";
import { Tables } from "../../../database.types";
import { displayPhoneNumber } from "../../utils/phoneUtils";
import { formatBookingNumber, parseBookingNumber } from "../../utils/bookingNumber";
import Image from "next/image";
import { exportBookingsCSV } from "../../utils/csvExport";

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

interface PaymentHistoryEntry {
  id: number;
  sequenceNumber: number;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  status: string;
  uploadedAt: string;
  verifiedAt: string | null;
  adminNotes: string | null;
  proofImageUrl: string;
  isLatest: boolean;
}



// Smart booking workflow status that considers both booking and payment proof
function getSmartWorkflowStatus(booking: Booking, paymentProof?: PaymentProof | null) {
  const bookingStatus = booking.status || 'pending';
  const paymentStatus = booking.payment_status || 'pending';
  const proofStatus = paymentProof?.status || null;

  // Handle USER cancellations FIRST - these should show as "Cancelled" and block payments
  if (bookingStatus === 'cancelled' && booking.cancelled_by === 'user') {
    return {
      step: 'user_cancelled',
      priority: 0,
      badge: 'bg-gray-100 text-gray-800',
      text: 'Cancelled',
      description: 'Booking cancelled by guest',
      actionNeeded: 'None - booking cancelled by guest'
    };
  }

  // Handle ADMIN cancellations - full booking cancellation by admin
  if (bookingStatus === 'cancelled' && booking.cancelled_by === 'admin') {
    return {
      step: 'admin_cancelled',
      priority: 6,
      badge: 'bg-red-100 text-red-800',
      text: 'Admin Cancelled',
      description: 'Booking cancelled by administrator',
      actionNeeded: 'None - booking cancelled by admin'
    };
  }

  // Handle active booking payment workflow
  if (bookingStatus === 'pending' || bookingStatus === 'pending_verification' || paymentStatus === 'payment_review' || paymentStatus === 'rejected') {
    // PRIORITY: Check if payment is under review (payment proof uploaded and pending) - THIS SHOULD BE FIRST
    if (paymentStatus === 'payment_review' || proofStatus === 'pending') {
      return {
        step: 'payment_review',
        priority: 5,
        badge: 'bg-amber-100 text-amber-800',
        text: 'Under Review',
        description: 'Payment proof uploaded, admin review needed',
        actionNeeded: 'Review payment proof immediately'
      };
    }
    // Check if payment proof was rejected BY ADMIN - only if no pending proof exists
    else if (proofStatus === 'rejected' || paymentStatus === 'rejected') {
      return {
        step: 'payment_rejected',
        priority: 6,
        badge: 'bg-red-100 text-red-800',
        text: 'Rejected',
        description: 'Payment proof was rejected by admin',
        actionNeeded: 'Guest needs to upload new payment proof or booking should be cancelled'
      };
    } 
    else if (proofStatus === 'verified') {
      return {
        step: 'ready_to_confirm',
        priority: 3,
        badge: 'bg-blue-100 text-blue-800',
        text: 'Ready to Confirm',
        description: 'Payment verified, booking can now be confirmed',
        actionNeeded: 'Click Confirm button to finalize booking'
      };
    }
    else if (!paymentProof) {
      return {
        step: 'awaiting_payment',
        priority: 4,
        badge: 'bg-orange-100 text-orange-800',
        text: 'Awaiting Payment',
        description: 'Guest needs to upload payment proof',
        actionNeeded: 'Remind guest to upload payment'
      };
    }
  }
  else if (bookingStatus === 'confirmed') {
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
        text: 'Pending Payment',
        description: 'Booking confirmed but payment still under review',
        actionNeeded: 'Verify payment proof to complete workflow'
      };
    }
  }

  // Handle any remaining cancelled bookings (fallback case)
  if (bookingStatus === 'cancelled') {
    return {
      step: 'cancelled',
      priority: 0,
      badge: 'bg-gray-100 text-gray-800',
      text: 'Cancelled',
      description: 'Booking has been cancelled',
      actionNeeded: 'None - booking cancelled'
    };
  }

  // Standard states
  switch (bookingStatus) {
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

// Payment Status Cell - Shows overall booking payment status
function PaymentStatusCell({ booking, refreshKey }: { booking: Booking; refreshKey?: number }) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        setLoading(true);
        
        // Fetch ALL payment proofs and prioritize them correctly
        const { data, error } = await supabase
          .from('payment_proofs')
          .select('*')
          .eq('booking_id', booking.id)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error(`❌ PaymentStatusCell: Error fetching payment proof for booking ${booking.id}:`, error);
          throw error;
        }
        
        let selectedProof = null;
        
        if (data && data.length > 0) {
          // Priority: pending > verified > rejected > cancelled
          // This ensures new pending proofs show "Payment Review" even if there are older rejected ones
          const pendingProof = data.find(proof => proof.status === 'pending');
          const verifiedProof = data.find(proof => proof.status === 'verified');
          const rejectedProof = data.find(proof => proof.status === 'rejected');
          const cancelledProof = data.find(proof => proof.status === 'cancelled');
          
          selectedProof = pendingProof || verifiedProof || rejectedProof || cancelledProof || data[0];
        }
        
        setPaymentProof(selectedProof);
      } catch (error) {
        console.error('Error fetching payment proof:', error);
        setPaymentProof(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentProof();

    // Enhanced real-time subscription with multiple event triggers
    const subscription = supabase
      .channel(`payment_status_realtime_${booking.id}_${refreshKey || 0}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_proofs',
          filter: `booking_id=eq.${booking.id}`
        },
        (payload) => {
          console.log(`🔥 Real-time payment proof update for booking ${booking.id}:`, payload);
          // Force immediate refresh on any payment proof change
          setTimeout(() => fetchPaymentProof(), 10); // Very short delay for database consistency
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [booking.id, booking.payment_status, booking.status, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <span className="text-xs text-gray-400">...</span>
      </div>
    );
  }

  // Determine the overall payment status based on booking status and payment proof
  const getPaymentStatusDisplay = () => {
    // If booking is cancelled, show cancelled
    if (booking.status === 'cancelled') {
      return {
        text: 'Cancelled',
        badge: 'bg-gray-500 text-white'
      };
    }

    // If there's a payment proof, use its status
    if (paymentProof) {
      switch (paymentProof.status) {
        case 'pending':
          return {
            text: 'Under Review',
            badge: 'bg-orange-500 text-white'
          };
        case 'verified':
          return {
            text: 'Verified',
            badge: 'bg-green-500 text-white'
          };
        case 'rejected':
          return {
            text: 'Rejected',
            badge: 'bg-red-500 text-white'
          };
        case 'cancelled':
          return {
            text: 'Cancelled',
            badge: 'bg-gray-500 text-white'
          };
        default:
          return {
            text: 'Unknown Status',
            badge: 'bg-gray-400 text-white'
          };
      }
    }

    // If no payment proof exists, check booking payment_status
    if (booking.payment_status === 'payment_review') {
      return {
        text: 'Under Review',
        badge: 'bg-orange-500 text-white'
      };
    } else if (booking.payment_status === 'rejected') {
      return {
        text: 'Rejected',
        badge: 'bg-red-500 text-white'
      };
    } else if (booking.payment_status === 'paid') {
      return {
        text: 'Verified',
        badge: 'bg-green-500 text-white'
      };
    } else {
      return {
        text: 'Awaiting Payment',
        badge: 'bg-gray-400 text-white'
      };
    }
  };

  const statusInfo = getPaymentStatusDisplay();
  
  return (
    <div className="flex items-center justify-center">
      <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusInfo.badge}`}>
        {statusInfo.text}
      </span>
    </div>
  );
}

// Clean Workflow Status Component
function SmartWorkflowStatusCell({ booking, refreshKey }: { booking: Booking; refreshKey?: number }) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        // Fetch ALL payment proofs and prioritize them correctly
        const { data, error } = await supabase
          .from('payment_proofs')
          .select('*')
          .eq('booking_id', booking.id)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error(`❌ SmartWorkflowStatusCell: Error fetching payment proof for booking ${booking.id}:`, error);
          throw error;
        }
        
        let selectedProof = null;
        
        if (data && data.length > 0) {
          // Priority: pending > verified > rejected > cancelled
          const pendingProof = data.find(proof => proof.status === 'pending');
          const verifiedProof = data.find(proof => proof.status === 'verified');
          const rejectedProof = data.find(proof => proof.status === 'rejected');
          const cancelledProof = data.find(proof => proof.status === 'cancelled');
          
          selectedProof = pendingProof || verifiedProof || rejectedProof || cancelledProof || data[0];
        }
        
        setPaymentProof(selectedProof);
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
      .channel(`workflow_payment_proof_${booking.id}_${refreshKey || 0}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_proofs',
          filter: `booking_id=eq.${booking.id}`
        },
        () => {
          // Refresh payment proof data immediately when changes occur
          fetchPaymentProof();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [booking.id, booking.status, refreshKey]);

  if (loading) {
    return <span className="text-xs text-gray-400">Loading...</span>;
  }

  const workflowStatus = getSmartWorkflowStatus(booking, paymentProof);
  
  return (
    <div>
      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${workflowStatus.badge}`}>
        {workflowStatus.text}
      </span>
    </div>
  );
}

// Smart Confirm Button - Only allows confirmation after payment verification
function SmartConfirmButton({ booking, onConfirm, variant = 'table', refreshKey }: { booking: Booking; onConfirm: (bookingId: number) => void; variant?: 'table' | 'modal'; refreshKey?: number }) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        // Fetch ALL payment proofs and prioritize them correctly
        const { data, error } = await supabase
          .from('payment_proofs')
          .select('*')
          .eq('booking_id', booking.id)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error(`❌ SmartConfirmButton: Error fetching payment proof for booking ${booking.id}:`, error);
          throw error;
        }
        
        let selectedProof = null;
        
        if (data && data.length > 0) {
          // Priority: pending > verified > rejected > cancelled
          const pendingProof = data.find(proof => proof.status === 'pending');
          const verifiedProof = data.find(proof => proof.status === 'verified');
          const rejectedProof = data.find(proof => proof.status === 'rejected');
          const cancelledProof = data.find(proof => proof.status === 'cancelled');
          
          selectedProof = pendingProof || verifiedProof || rejectedProof || cancelledProof || data[0];
        }
        
        setPaymentProof(selectedProof);
      } catch (error) {
        console.error('SmartConfirmButton: Error fetching payment proof:', error);
        setPaymentProof(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentProof();
  }, [booking.id, booking.payment_status, booking.status, refreshKey]);

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
        className="px-4 py-2 bg-teal-500 text-white rounded-md text-sm hover:bg-teal-600 font-semibold"
        title="Step 3: Confirm booking (payment verified)"
      >
        Confirm
      </button>
    );
  }
    
  return (
    <button 
      onClick={() => onConfirm(booking.id)}
      className="h-6 w-full px-2 py-1 bg-teal-500 text-white rounded text-xs hover:bg-teal-600 text-center flex items-center justify-center"
      title="Step 3: Confirm booking (payment verified)"
    >
      Confirm
    </button>
  );
}

// Smart Payment Proof Action Button
function PaymentProofButton({ 
  bookingId, 
  onViewProof,
  variant = 'table',
  refreshKey
}: { 
  bookingId: number;
  onViewProof: (proof: PaymentProof) => void;
  variant?: 'table' | 'modal';
  refreshKey?: number;
}) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        setLoading(true);
        
        // Small delay for database consistency on refreshes
        if (refreshKey && refreshKey > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Fetch ALL payment proofs and prioritize them correctly
        const { data, error } = await supabase
          .from('payment_proofs')
          .select('*')
          .eq('booking_id', bookingId)
          .order('uploaded_at', { ascending: false });

        if (error) throw error;
        
        let selectedProof = null;
        
        if (data && data.length > 0) {
          // Priority: pending > verified > rejected > cancelled
          const pendingProof = data.find(proof => proof.status === 'pending');
          const verifiedProof = data.find(proof => proof.status === 'verified');
          const rejectedProof = data.find(proof => proof.status === 'rejected');
          const cancelledProof = data.find(proof => proof.status === 'cancelled');
          
          selectedProof = pendingProof || verifiedProof || rejectedProof || cancelledProof || data[0];
        }
        
        setPaymentProof(selectedProof);
        
      } catch (error) {
        console.error('Error fetching payment proof:', error);
        setPaymentProof(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentProof();

    // Set up real-time subscription for this specific booking's payment proofs
    const subscription = supabase
      .channel(`payment_proof_button_${bookingId}_${refreshKey || 0}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_proofs',
          filter: `booking_id=eq.${bookingId}`
        },
        () => {
          // Immediately refresh payment proof data when changes occur
          fetchPaymentProof();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [bookingId, refreshKey]);

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
        return 'bg-amber-500 hover:bg-amber-600';
      case 'verified':
        return 'bg-emerald-500 hover:bg-emerald-600';
      case 'rejected':
        return 'bg-slate-500 hover:bg-slate-600';
      case 'cancelled':
        return 'bg-gray-400 hover:bg-gray-500';
      default:
        return 'bg-violet-500 hover:bg-violet-600';
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
      case 'cancelled':
        return 'Cancelled';
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
  
  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<{
    totalAmount: number;
    totalPaid: number;
    pendingAmount: number;
    remainingBalance: number;
  } | null>(null);
  const [newBookingAlert, setNewBookingAlert] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // ✨ For triggering component refreshes on payment proof updates
  const [lastRealTimeEvent, setLastRealTimeEvent] = useState<string | null>(null); // Track real-time events
  const [realTimeStatus, setRealTimeStatus] = useState<'connecting' | 'active' | 'degraded' | 'offline'>('connecting');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false); // Manual refresh state
  
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
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);

  // Toast helpers
  const { success, error: showError, warning } = useToastHelpers();
  useEffect(() => {
    // Delayed fetch to not block navigation
    const timer = setTimeout(() => fetchBookings(), 100);

    // Set up real-time subscriptions for instant updates
    setRealTimeStatus('connecting');
    
    // Set up real-time subscription for bookings with enhanced reliability
    const bookingsSubscription = supabase
      .channel('admin-bookings-realtime', { 
        config: { 
          broadcast: { self: true },
          presence: { key: 'admin-user' }
        } 
      })
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        },
        (payload) => {
          // Enhanced optimistic updates for instant UI response
          if (payload.eventType === 'UPDATE' && payload.new) {
            
            // ⚡ CRITICAL: Show alert for payment proof uploads (payment_status change to payment_review)
            if (payload.old?.payment_status !== 'payment_review' && payload.new.payment_status === 'payment_review') {
              if (!document.hidden) {
                success('💸 Payment Proof Uploaded!', `Booking ${payload.new.id} (${payload.new.guest_name}) uploaded payment proof - Ready for review!`);
                setRefreshTrigger(prev => prev + 1);
              }
            }
            
            // ⚡ CRITICAL: Handle ANY cancellation - auto-cancel payment proofs when booking is cancelled
            if (payload.old?.status !== 'cancelled' && payload.new.status === 'cancelled') {
              // Automatically cancel any pending payment proofs for this cancelled booking
              const cancelPaymentProofs = async () => {
                try {
                  const { error } = await supabase
                    .from('payment_proofs')
                    .update({
                      status: 'cancelled',
                      admin_notes: `Automatically cancelled - booking cancelled by ${payload.new.cancelled_by || 'system'}`,
                      verified_at: new Date().toISOString()
                    })
                    .eq('booking_id', payload.new.id)
                    .in('status', ['pending']);
                  
                  if (error) {
                    console.error('Failed to cancel payment proofs:', error);
                  } else {
                    console.log(`✅ Auto-cancelled payment proofs for booking ${payload.new.id}`);
                  }
                } catch (error) {
                  console.error('Error cancelling payment proofs:', error);
                }
              };
              
              // Cancel payment proofs in background
              cancelPaymentProofs();
              
              if (!document.hidden) {
                const cancelledBy = payload.new.cancelled_by === 'user' ? 'user' : 'admin';
                warning('🚫 Booking Cancelled', `Booking ${payload.new.id} (${payload.new.guest_name}) was cancelled by ${cancelledBy}`);
                setRefreshTrigger(prev => prev + 1);
                setTimeout(() => setRefreshTrigger(prev => prev + 1), 500);
              }
            }
            
            // Show alert for cancelled bookings
            if (payload.old?.status !== 'cancelled' && payload.new.status === 'cancelled') {
              if (!document.hidden && payload.new.cancelled_by === 'user') {
                setNewBookingAlert(`${payload.new.guest_name || 'Guest'} cancelled their booking 💔`);
                setTimeout(() => setNewBookingAlert(null), 5000);
              }
            }
            
            // Instantly update the booking with all new data
            setBookings(prevBookings => {
              return prevBookings.map(booking => {
                if (booking.id === payload.new.id) {
                  return { 
                    ...booking, 
                    ...payload.new, 
                    user_exists: booking.user_exists
                  };
                }
                return booking;
              });
            });
            
            // Force refresh of all payment proof components when booking status changes
            setRefreshTrigger(prev => prev + 1);
          } else if (payload.eventType === 'INSERT' && payload.new) {
            // Immediate UI response - Add booking instantly to admin list
            const newBookingWithStatus = {
              ...payload.new,
              user_exists: true // Optimistic user status for instant display
            } as Booking;
            
            setBookings(prevBookings => {
              // Prevent duplicates - check if booking already exists
              const existingIndex = prevBookings.findIndex(b => b.id === payload.new.id);
              
              if (existingIndex >= 0) {
                return prevBookings.map((booking, index) => 
                  index === existingIndex ? newBookingWithStatus : booking
                );
              } else {
                // Add new booking and maintain proper sort order (newest first by created_at)
                const updatedBookings = [newBookingWithStatus, ...prevBookings];
                return updatedBookings.sort((a, b) => 
                  new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
                );
              }
            });
            
            // Show instant visual alert for new bookings
            if (!document.hidden) {
              setNewBookingAlert(`New booking from ${payload.new.guest_name || 'Guest'}! 🎉`);
              setTimeout(() => setNewBookingAlert(null), 5000);
            }
            
            // Verify user status in background (non-blocking and safe)
            setTimeout(async () => {
              try {
                const { data: userData, error } = await supabase
                  .from('users')
                  .select('auth_id')
                  .eq('auth_id', payload.new.user_id)
                  .single();
                
                const userExists = !error && userData;
                
                // Update user_exists status if different
                if (!userExists) {
                  setBookings(prevBookings => 
                    prevBookings.map(booking => 
                      booking.id === payload.new.id 
                        ? { ...booking, user_exists: false }
                        : booking
                    )
                  );
                }
              } catch (error) {
                console.warn('Failed to verify user status for new booking:', error);
              }
            }, 1000);
            
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Remove deleted booking immediately from admin UI
            setBookings(prevBookings => {
              return prevBookings.filter(booking => booking.id !== payload.old.id);
            });
          }
        }
      )
      .subscribe((status) => {

        if (status === 'SUBSCRIBED') {
          setRealTimeStatus('active');
          setLastRealTimeEvent(new Date().toISOString());
        }
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
        () => {
          // When users are added/deleted, refresh bookings to update user_exists status
          setTimeout(() => {
            fetchBookings(false, true); // Silent sync - won't show loading state
          }, 500);
        }
      )
      .subscribe((status) => {

        if (status === 'SUBSCRIBED') {
          setRealTimeStatus('active');
          setLastRealTimeEvent(new Date().toISOString());
        }
      });

    // ✨ NEW: Real-time subscription for payment proofs - INSTANT verification/rejection updates
    const paymentProofsSubscription = supabase
      .channel('admin-payment-proofs-realtime', { 
        config: { 
          broadcast: { self: true },
          presence: { key: 'admin-payment-reviews' }
        } 
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_proofs'
        },
        (payload) => {

          
          if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            const { new: newProof, old: oldProof } = payload;
            
            // Check if status changed (verification/rejection)
            if (oldProof.status !== newProof.status) {
              // Show instant feedback for payment proof status changes
              const statusMessages = {
                verified: { type: 'success', title: '✅ Payment Verified!', message: `Payment proof for booking ${newProof.booking_id} approved` },
                rejected: { type: 'warning', title: '❌ Payment Rejected', message: `Payment proof for booking ${newProof.booking_id} rejected` },
                cancelled: { type: 'info', title: '🚫 Payment Cancelled', message: `Payment proof for booking ${newProof.booking_id} cancelled` }
              };
              
              const statusInfo = statusMessages[newProof.status as keyof typeof statusMessages];
              if (statusInfo) {
                // Show toast notification for instant feedback
                if (newProof.status === 'verified') {
                  success(statusInfo.title, statusInfo.message);
                } else if (newProof.status === 'rejected') {
                  warning(statusInfo.title, statusInfo.message);
                } else if (newProof.status === 'cancelled') {
                  warning(statusInfo.title, statusInfo.message); // Use warning for cancelled status
                } else {
                  showError(statusInfo.title, statusInfo.message);
                }
              }
            }
            
            // 🔥 CRITICAL: If modal is open for this booking, refresh it immediately with updated data
            if (showPaymentProofModal && selectedBooking && selectedBooking.id === newProof.booking_id) {
              console.log('🔄 Modal is open for updated proof - refreshing payment history');
              fetchPaymentHistory(newProof.booking_id);
              
              // Update the selected payment proof to reflect status change immediately
              if (selectedPaymentProof && selectedPaymentProof.id === newProof.id) {
                setSelectedPaymentProof(newProof as PaymentProof);
                console.log('✅ Modal updated with status change');
              }
              
              // Also fetch the latest payment proof to ensure we have the most current data
              (async () => {
                try {
                  const { data: latestProof } = await supabase
                    .from('payment_proofs')
                    .select('*')
                    .eq('booking_id', newProof.booking_id)
                    .order('uploaded_at', { ascending: false })
                    .limit(1)
                    .single();
                  
                  if (latestProof) {
                    setSelectedPaymentProof(latestProof);
                  }
                } catch (error) {
                  console.log('Error fetching latest proof:', error);
                }
              })();
            }
            
            // Immediate UI refresh for payment proof status changes
            setRefreshTrigger(prev => prev + 1);
            
            // Additional refresh for cancelled/rejected status
            if (newProof.status === 'cancelled' || newProof.status === 'rejected') {
              setTimeout(() => setRefreshTrigger(prev => prev + 1), 100);
            }
          }
          
          if (payload.eventType === 'INSERT' && payload.new) {
            setLastRealTimeEvent(new Date().toISOString());
            
            // Show immediate visual alert for new payment proof
            if (!document.hidden) {
              success('🎉 Payment Proof Uploaded!', `New payment proof received for booking ${payload.new.booking_id} - Ready for review!`);
              
              // Also show browser notification if permitted
              if (Notification.permission === 'granted') {
                new Notification('New Payment Proof Uploaded!', {
                  body: `Booking ${payload.new.booking_id} uploaded payment proof`,
                  icon: '/favicon.ico',
                  tag: `payment-proof-${payload.new.booking_id}`
                });
              }
            }
            
            // INSTANT UI updates - Update booking to show "Payment Review" status immediately
            setBookings(prevBookings => {
              return prevBookings.map(booking => {
                if (booking.id === payload.new.booking_id) {
                  return {
                    ...booking,
                    payment_status: 'payment_review', 
                    updated_at: new Date().toISOString()
                  };
                }
                return booking;
              });
            });
            
            // 🔥 CRITICAL: If modal is open for this booking, refresh it immediately
            if (showPaymentProofModal && selectedBooking && selectedBooking.id === payload.new.booking_id) {
              console.log('🔄 Modal is open for this booking - refreshing payment history and proof data');
              fetchPaymentHistory(payload.new.booking_id);
              
              // Update the selected payment proof to the new one IMMEDIATELY
              (async () => {
                try {
                  const { data: latestProof } = await supabase
                    .from('payment_proofs')
                    .select('*')
                    .eq('booking_id', payload.new.booking_id)
                    .order('uploaded_at', { ascending: false })
                    .limit(1)
                    .single();
                  
                  if (latestProof) {
                    setSelectedPaymentProof(latestProof);
                    console.log('✅ Modal updated with latest payment proof');
                  }
                } catch (error) {
                  console.error('Failed to update modal with latest proof:', error);
                }
              })();
            }
            
            // Immediate UI refresh for all payment proof components
            setRefreshTrigger(prev => prev + 1);
            
            // Multiple staged refreshes to ensure all components update
            setTimeout(() => setRefreshTrigger(prev => prev + 1), 100);
            setTimeout(() => setRefreshTrigger(prev => prev + 1), 300);
            setTimeout(() => setRefreshTrigger(prev => prev + 1), 1000);
            
            // Background sync to ensure database consistency
            setTimeout(() => {
              fetchBookings(false, true); // Silent refresh to sync with database
            }, 500);
          }
          
          if (payload.eventType === 'DELETE' && payload.old) {
            warning('🗑️ Payment Proof Deleted', `Payment proof for booking ${payload.old.booking_id} was deleted`);
            setRefreshTrigger(prev => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealTimeStatus('active');
          setLastRealTimeEvent(new Date().toISOString());
          
          // Request notification permission if not already granted
          if (Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }
      });

    // Backup sync system for reliability
    const syncInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRealTime = lastRealTimeEvent ? now - new Date(lastRealTimeEvent).getTime() : 0;
      
      // Only sync if page is active and no recent real-time activity (and we actually have a last event)
      if (!document.hidden && 
          document.hasFocus() && 
          !loading && 
          !refreshing && 
          !isProcessing &&
          !paymentProofLoading &&
          lastRealTimeEvent && 
          timeSinceLastRealTime > 60000) {
        setRealTimeStatus('degraded');
        fetchBookings(false, true);
      }
    }, 30000); // Every 30 seconds

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBookings(false, true);
      }
    };

    const handleFocus = () => {
      fetchBookings(false, true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup subscriptions on unmount
    return () => {
      clearTimeout(timer);
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      supabase.removeChannel(bookingsSubscription);
      supabase.removeChannel(usersSubscription);
      supabase.removeChannel(paymentProofsSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - setupRealtime should only run once

  // Filter bookings based on user preference AND search term
  useEffect(() => {
    let filtered = bookings;
    
    // First filter by deleted users preference
    if (!showDeletedUsers) {
      filtered = filtered.filter(booking => booking.user_exists);
    }
    
    // Then filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Then filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const searchUpper = searchTerm.toUpperCase().trim();
      
      filtered = filtered.filter(booking => {
        // Search by formatted booking number (KB-0001, KB-10000, etc.)
        const bookingNumber = formatBookingNumber(booking.id);
        const matchesBookingNumber = bookingNumber.includes(searchUpper);
        
        // Parse booking number if user typed KB-0001 format
        const parsedId = parseBookingNumber(searchUpper);
        const matchesParsedBookingNumber = parsedId === booking.id;
        
        return (
          // Search by booking number formats
          matchesBookingNumber ||
          matchesParsedBookingNumber ||
          // Search by guest name
          booking.guest_name?.toLowerCase().includes(searchLower) ||
          // Search by guest email
          booking.guest_email?.toLowerCase().includes(searchLower) ||
          // Search by guest phone (remove spaces and dashes for better matching)
          booking.guest_phone?.replace(/[\s-]/g, '').includes(searchTerm.replace(/[\s-]/g, '')) ||
          // Search by raw booking ID
          booking.id.toString().includes(searchTerm.trim())
        );
      });
    }
    
    // Special sorting for cancelled filter - show most recent cancellations first
    if (statusFilter === 'cancelled') {
      filtered = filtered.sort((a, b) => {
        // Sort cancelled bookings by created_at (newest first) regardless of who cancelled them
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      });
    }
    
    setFilteredBookings(filtered);
  }, [bookings, showDeletedUsers, searchTerm, statusFilter]);

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

  // ✨ Enhanced refresh trigger for instant updates when payment proofs change
  useEffect(() => {
    if (refreshTrigger > 0) { // Skip initial render
      // No need to fetch bookings here - the individual components will update via their own subscriptions
      // This just ensures all components re-render with fresh data
    }
  }, [refreshTrigger]);

  // Fetch payment history for a booking
  const fetchPaymentHistory = async (bookingId: number) => {
    setPaymentHistoryLoading(true);
    try {
      const response = await fetch(`/api/admin/payment-history/${bookingId}`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentHistory(data.paymentHistory || []);
        setPaymentSummary(data.paymentSummary || null);
      } else {
        console.error('Failed to fetch payment history:', data.error);
        setPaymentHistory([]);
        setPaymentSummary(null);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setPaymentHistory([]);
      setPaymentSummary(null);
    } finally {
      setPaymentHistoryLoading(false);
    }
  };

  const fetchBookings = async (isRefresh = false, silent = false) => {
    try {
      if (!silent) {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }
      // Step 1: Get all bookings
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching bookings:', error);
        return;
      }

      // If no bookings, return early
      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      // Step 2: Get all unique user IDs from bookings
      const userIds = Array.from(new Set(bookingsData.map(booking => booking.user_id)));
      
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

      // Step 6: Sort bookings by workflow priority to put active bookings at the top
      const sortedBookings = bookingsWithUserStatus.sort((a, b) => {
        // Get workflow statuses (we'll calculate them here for sorting)
        const statusA = a.status || 'pending';
        const statusB = b.status || 'pending';
        const paymentStatusA = a.payment_status || 'pending';
        const paymentStatusB = b.payment_status || 'pending';
        
        // Priority order: payment reviews > pending bookings > confirmed > completed > ALL cancelled (bottom)
        const getPriority = (status: string, paymentStatus: string, cancelledBy: string | null) => {
          // SPECIAL CASE: When viewing cancelled filter, all cancelled bookings get same priority for pure date sorting
          if (statusFilter === 'cancelled' && status === 'cancelled') {
            return 90; // Same priority for all cancelled bookings when filtered
          }
          
          // CRITICAL: ALL cancelled bookings go to BOTTOM - no exceptions
          if (status === 'cancelled') {
            if (cancelledBy === 'user') {
              return 99; // Bottom - user cancelled
            } else if (cancelledBy === 'admin') {
              return 98; // Bottom - admin cancelled (slightly above user cancelled)
            } else {
              return 97; // Bottom - other cancelled bookings
            }
          }
          
          // Payment reviews get TOP priority (only for non-cancelled bookings)
          if (status === 'pending_verification' || paymentStatus === 'payment_review') return 1; // Highest priority - needs review
          
          // Rejected payments need attention - second highest priority
          if (paymentStatus === 'rejected') return 2; // High priority - rejected payments need action
          
          if (status === 'pending') return 3; // Third priority - active bookings awaiting payment
          if (status === 'confirmed') return 4; // Fourth priority - confirmed bookings
          if (status === 'completed') return 5; // Fifth priority - completed stays
          
          return 6; // Other statuses
        };
        
        const priorityA = getPriority(statusA, paymentStatusA, a.cancelled_by);
        const priorityB = getPriority(statusB, paymentStatusB, b.cancelled_by);
        
        // If priorities are the same, sort by created_at (newest first)
        if (priorityA === priorityB) {
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        }
        
        return priorityA - priorityB;
      });

      setBookings(sortedBookings as Booking[]);
    } catch (error) {
      console.error('💥 Unexpected error:', error);
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Handle payment proof verification
  const handlePaymentProofAction = async (action: 'approve' | 'reject', proofId: number) => {
    // Prevent double-clicking
    if (paymentProofLoading) {
      return;
    }
    
    setPaymentProofLoading(true);
    
    try {
      // Skip user lookup to avoid hanging - use placeholder since API will handle admin permissions
      const user = {
        id: 'admin-placeholder',
        email: 'admin@kampoibayow.com'
      };
      
      // First, let's check if the payment proof exists
      const { data: existingProof, error: fetchError } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('id', proofId)
        .single();
      
      if (fetchError) {
        console.error('❌ Failed to fetch payment proof:', fetchError);
        throw new Error(`Payment proof not found: ${fetchError.message}`);
      }
      
      if (!existingProof) {
        console.error('❌ No payment proof found with ID:', proofId);
        throw new Error('Payment proof not found');
      }
      
      // Use API endpoint with admin permissions to bypass RLS issues
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
      
      // 🚀 CRITICAL: Trigger real-time component updates immediately BEFORE closing modal
      setRefreshTrigger(prev => prev + 1);
      
      // 🔄 Refresh payment history to show updated data in modal
      if (existingProof?.booking_id) {
        await fetchPaymentHistory(existingProof.booking_id);
      }
      
      // Close modal after refreshing data
      setShowPaymentProofModal(false);
      setSelectedPaymentProof(null);
      setVerificationNotes("");
      setRejectionReason("");
      setCustomRejectionReason("");
      
      // Force refresh data with retry mechanism
      try {
        await fetchBookings(true); // Force refresh bookings
        // Trigger another update after data refresh to ensure all components refresh
        setTimeout(() => setRefreshTrigger(prev => prev + 1), 500);
      } catch (refreshError) {
        console.warn('⚠️ Bookings refresh failed, will retry:', refreshError);
        // Retry once more after a short delay
        setTimeout(async () => {
          try {
            await fetchBookings(true);
            // Trigger refresh after retry
            setRefreshTrigger(prev => prev + 1);
          } catch (retryError) {
            console.error('❌ Bookings refresh failed on retry:', retryError);
          }
        }, 1000);
      }
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
    } finally {
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

  const handleManualRefresh = async () => {
    if (isManualRefreshing) return;
    
    setIsManualRefreshing(true);
    
    try {
      await fetchBookings(true);
      setLastRealTimeEvent(new Date().toISOString());
      success('Bookings refreshed successfully');
    } catch {
      showError('Failed to refresh bookings. Please try again.');
    } finally {
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 500);
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
      {/* Real-time Booking Alerts */}
      {newBookingAlert && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-pulse text-white ${
          newBookingAlert.includes('cancelled') ? 'bg-red-500' : 'bg-green-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{newBookingAlert.includes('cancelled') ? '💔' : '🎉'}</span>
            <span className="font-semibold">{newBookingAlert}</span>
          </div>
        </div>
      )}
      
      <AdminDashboardSummary />
      
      {/* Real-time Status Bar */}
      <div className="bg-white rounded-xl shadow-md mb-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Real-time Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                realTimeStatus === 'active' ? 'bg-green-500' : 
                realTimeStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              } ${realTimeStatus === 'active' ? 'animate-pulse' : ''}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {realTimeStatus === 'active' ? 'Real-time Active' : 
                 realTimeStatus === 'degraded' ? 'Sync Mode' : 
                 realTimeStatus === 'connecting' ? 'Connecting...' : 'Offline Mode'}
              </span>
            </div>
            
            {/* Last Update Indicator */}
            <div className="text-xs text-gray-500">
              {lastRealTimeEvent ? (
                <>Last update: {new Date(lastRealTimeEvent).toLocaleTimeString()}</>
              ) : (
                <>Awaiting updates...</>
              )}
            </div>
            
            {/* Smart Polling Indicator */}
            {realTimeStatus === 'degraded' && (
              <div className="flex items-center gap-1 text-xs text-yellow-600">
                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Auto-sync active</span>
              </div>
            )}
          </div>
          
          {/* Manual Refresh Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg 
                className={`w-4 h-4 ${isManualRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isManualRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            {/* System Status Info */}
            <div className="text-xs text-gray-400">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {/* Performance Metrics and Real-time Activity Log */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Subscriptions: {realTimeStatus === 'active' ? '✅ Active' : '❌ Inactive'}</span>
              <span>Polling: {realTimeStatus === 'degraded' ? '⚠️ Enabled' : '⏸️ Standby'}</span>
              <span>Events: {lastRealTimeEvent ? `🟢 ${new Date(lastRealTimeEvent).toLocaleTimeString()}` : '🔴 None'}</span>
              <span>Refresh Trigger: #{refreshTrigger}</span>
              <button
                onClick={() => {
                  console.log('🔄 MANUAL: Forcing refresh trigger increment');
                  setRefreshTrigger(prev => prev + 1);
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Force Refresh
              </button>
            </div>
          </div>
        )}
        
        {/* Real-time Activity Indicator */}
        {refreshTrigger > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time update #{refreshTrigger} - Payment proof components refreshed at {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-4">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by booking number (KB-0001), guest name, email, phone, or ID..."
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
              Found {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} matching &quot;{searchTerm}&quot;
            </p>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Pending ({bookings.filter(b => b.status?.toLowerCase() === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Confirmed ({bookings.filter(b => b.status?.toLowerCase() === 'confirmed').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Completed ({bookings.filter(b => b.status?.toLowerCase() === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Cancelled ({bookings.filter(b => b.status?.toLowerCase() === 'cancelled').length})
            </button>
          </div>
          {(statusFilter !== 'all' || searchTerm) && (
            <p className="text-sm text-gray-600 mt-2">
              Showing {filteredBookings.length} of {bookings.length} bookings
              {statusFilter !== 'all' && ` with status "${statusFilter}"`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            All Bookings ({filteredBookings.length})
            {!showDeletedUsers && bookings.length > filteredBookings.length && (
              <span className="text-sm text-gray-500 ml-2">
                ({bookings.length - filteredBookings.length} hidden from deleted users)
              </span>
            )}
            {searchTerm && (
              <span className="text-sm text-blue-600 ml-2">
                (filtered)
              </span>
            )}
          </h3>
          <div className="flex gap-2 items-center">
            <label className="flex items-center text-sm text-black">
              <input
                type="checkbox"
                checked={showDeletedUsers}
                onChange={(e) => setShowDeletedUsers(e.target.checked)}
                className="mr-2"
              />
              Show deleted user bookings
            </label>
            
            {/* Export CSV Button */}
            <button 
              onClick={() => {
                try {
                  exportBookingsCSV(filteredBookings as unknown as { [key: string]: string | number | boolean | null | undefined | object }[]);
                  success('Bookings exported to CSV successfully!');
                } catch (error) {
                  console.error('Export error:', error);
                  showError('Failed to export CSV');
                }
              }}
              disabled={filteredBookings.length === 0}
              className={`px-3 py-1 text-white rounded-md text-sm transition flex items-center gap-2 ${
                filteredBookings.length === 0
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
              title="Export current bookings to CSV"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            
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
          <div className="flex justify-between items-center mb-4 text-sm text-gray-800 font-medium">
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600 text-sm">
                    <th className="p-2 w-20 text-center">#</th>
                    <th className="p-3 min-w-[160px]">Guest</th>
                    <th className="p-3 min-w-[180px]">Email</th>
                    <th className="p-3 min-w-[120px]">Contact</th>
                    <th className="p-3 min-w-[90px]">Check-in</th>
                    <th className="p-3 min-w-[90px]">Check-out</th>
                    <th className="p-3 w-16 text-center">Guests</th>
                    <th className="p-3 min-w-[100px]">Amount</th>
                    <th className="p-3 min-w-[120px]">Status</th>
                    <th className="p-3 min-w-[110px]">Payment</th>
                    <th className="p-3 min-w-[140px]">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id} className={`border-t hover:bg-gray-50 ${!booking.user_exists ? 'bg-red-50' : ''}`}>
                    <td className="p-2 text-center">
                      <div className="font-mono font-bold text-blue-700 text-xs whitespace-nowrap">
                        {formatBookingNumber(booking.id)}
                      </div>
                    </td>
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
                    <td className="p-3 text-black text-sm">{formatDate(booking.check_in_date)}</td>
                    <td className="p-3 text-black text-sm">{formatDate(booking.check_out_date)}</td>
                    <td className="p-3 text-black text-center">{booking.number_of_guests}</td>
                      <td className="p-3 text-black">
                      <div className="font-medium text-sm">₱{booking.total_amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        {booking.payment_type === 'full' ? 'Full Pay' : '50% Down'}
                      </div>
                    </td>
                    <td className="p-3">
                      <SmartWorkflowStatusCell booking={booking} refreshKey={refreshTrigger} />
                    </td>
                    <td className="p-3">
                      <PaymentStatusCell 
                        key={`payment-status-${booking.id}-${refreshTrigger}-${booking.payment_status || 'none'}-${booking.status || 'pending'}-${booking.updated_at || 'none'}`}
                        booking={booking} 
                        refreshKey={refreshTrigger} 
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {/* Primary Actions Row */}
                        <div className="flex gap-1">
                          <button 
                            onClick={() => openModal(booking)}
                            className="h-6 px-2 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 flex items-center justify-center"
                            title="View booking details"
                          >
                            View
                          </button>
                          
                          <PaymentProofButton 
                            key={`proof-${booking.id}-${refreshTrigger}-${booking.payment_status || 'none'}`}
                            bookingId={booking.id}
                            onViewProof={async (proof) => {
                              setSelectedPaymentProof(proof);
                              setShowPaymentProofModal(true);
                              if (proof.id > 0) { // Only fetch history for real proofs, not dummy ones
                                await fetchPaymentHistory(booking.id);
                                
                                // Fetch the correct payment proof using priority logic
                                try {
                                  const { data: allProofs } = await supabase
                                    .from('payment_proofs')
                                    .select('*')
                                    .eq('booking_id', booking.id)
                                    .order('uploaded_at', { ascending: false });
                                  
                                  if (allProofs && allProofs.length > 0) {
                                    // Priority: pending > verified > rejected > cancelled
                                    const pendingProof = allProofs.find(p => p.status === 'pending');
                                    const verifiedProof = allProofs.find(p => p.status === 'verified');
                                    const rejectedProof = allProofs.find(p => p.status === 'rejected');
                                    const cancelledProof = allProofs.find(p => p.status === 'cancelled');
                                    
                                    const prioritizedProof = pendingProof || verifiedProof || rejectedProof || cancelledProof || allProofs[0];
                                    setSelectedPaymentProof(prioritizedProof);
                                  }
                                } catch (error) {
                                  console.log('No payment proof found or error:', error);
                                }
                              }
                            }}
                            refreshKey={refreshTrigger}
                          />
                        </div>

                        {/* Secondary Actions Row - Only for pending bookings */}
                        {(booking.status || 'pending') === 'pending' && (
                          <div className="flex gap-1">
                            <SmartConfirmButton 
                              booking={booking}
                              onConfirm={(bookingId) => updateBookingStatus(bookingId, 'confirmed')}
                              refreshKey={refreshTrigger}
                            />
                            <button 
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowModal(true);
                                setShowCancelModal(true);
                              }}
                              className="h-6 px-2 py-1 bg-rose-500 text-white rounded text-xs hover:bg-rose-600 flex items-center justify-center"
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
          </div>
        )}

        {/* Pagination Controls */}
        {filteredBookings.length > itemsPerPage && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className={`px-3 py-2 text-sm font-medium rounded-md border ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
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
                className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-gray-600 text-sm">Complete reservation details • {selectedBooking ? formatBookingNumber(selectedBooking.id) : ''}</p>
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
                      {formatBookingNumber(selectedBooking.id)}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {selectedBooking.guest_name}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Booked on {selectedBooking.created_at ? formatDate(selectedBooking.created_at) : 'N/A'} • ID: {selectedBooking.id}
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
                        key={`modal-proof-${selectedBooking.id}-${refreshTrigger}-${selectedBooking.payment_status || 'none'}`}
                        bookingId={selectedBooking.id}
                        variant="modal"
                        onViewProof={async (proof) => {
                          setSelectedPaymentProof(proof);
                          setShowPaymentProofModal(true);
                          if (proof.id > 0) { // Only fetch history for real proofs, not dummy ones
                            await fetchPaymentHistory(selectedBooking.id);
                            
                            // Fetch the correct payment proof using priority logic
                            try {
                              const { data: allProofs } = await supabase
                                .from('payment_proofs')
                                .select('*')
                                .eq('booking_id', selectedBooking.id)
                                .order('uploaded_at', { ascending: false });
                              
                              if (allProofs && allProofs.length > 0) {
                                // Priority: pending > verified > rejected > cancelled
                                const pendingProof = allProofs.find(p => p.status === 'pending');
                                const verifiedProof = allProofs.find(p => p.status === 'verified');
                                const rejectedProof = allProofs.find(p => p.status === 'rejected');
                                const cancelledProof = allProofs.find(p => p.status === 'cancelled');
                                
                                const prioritizedProof = pendingProof || verifiedProof || rejectedProof || cancelledProof || allProofs[0];
                                setSelectedPaymentProof(prioritizedProof);
                              }
                            } catch (error) {
                              console.log('No payment proof found or error:', error);
                            }
                          }
                        }}
                        refreshKey={refreshTrigger}
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
                          refreshKey={refreshTrigger}
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
                    setPaymentHistory([]);
                    setPaymentSummary(null);
                    setShowPaymentHistory(false);
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

              {/* Payment Summary Section */}
              {selectedPaymentProof.id > 0 && paymentSummary && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">Total Amount</div>
                      <div className="text-xl font-bold text-gray-900">₱{paymentSummary.totalAmount.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">Total Paid</div>
                      <div className="text-xl font-bold text-green-700">₱{paymentSummary.totalPaid.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">Pending</div>
                      <div className="text-xl font-bold text-yellow-600">₱{paymentSummary.pendingAmount.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">Remaining Balance</div>
                      <div className={`text-xl font-bold ${paymentSummary.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₱{paymentSummary.remainingBalance.toLocaleString()}
                      </div>
                      {paymentSummary.remainingBalance === 0 && (
                        <div className="text-xs text-green-600 font-medium mt-1">✓ Fully Paid</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History Section */}
              {selectedPaymentProof.id > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                      {paymentHistory.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {paymentHistory.length} submission{paymentHistory.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      {showPaymentHistory ? 'Hide History' : 'Show History'}
                    </button>
                  </div>
                  
                  {paymentHistoryLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading payment history...</span>
                    </div>
                  ) : showPaymentHistory && paymentHistory.length > 0 ? (
                    <div className="space-y-3">
                      {paymentHistory.map((entry) => (
                        <div key={entry.id} className={`border rounded-lg p-4 ${
                          entry.isLatest 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200 bg-white'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">
                                Submission #{entry.sequenceNumber}
                              </span>
                              {entry.isLatest && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  Current
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                entry.status === 'verified' ? 'bg-green-100 text-green-800' :
                                entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {entry.status}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.uploadedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Amount:</span>
                              <p className="text-gray-800">₱{entry.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Method:</span>
                              <p className="text-gray-800">{entry.paymentMethod}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Reference:</span>
                              <p className="text-gray-800">{entry.referenceNumber || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Status:</span>
                              <p className="text-gray-800">{entry.status}</p>
                            </div>
                          </div>
                          
                          {entry.adminNotes && (
                            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                              <span className="text-xs font-medium text-amber-800">Admin Notes:</span>
                              <p className="text-xs text-amber-700 mt-1">{entry.adminNotes}</p>
                            </div>
                          )}
                          
                          {entry.verifiedAt && (
                            <div className="mt-2 text-xs text-gray-500">
                              Verified on: {new Date(entry.verifiedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : showPaymentHistory && paymentHistory.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No payment history found for this booking.</p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Payment Proof Image */}
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Current Payment Proof</h3>
                </div>
                
                <div className="relative group cursor-pointer" onClick={() => selectedPaymentProof?.proof_image_url && setImageZoomed(true)}>
                  {/* Image Container */}
                  <div className="relative overflow-hidden rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 transition-all duration-300 group-hover:border-blue-300 group-hover:shadow-md">
                    {selectedPaymentProof?.proof_image_url ? (
                      <Image 
                        src={selectedPaymentProof.proof_image_url} 
                        alt="Payment Proof"
                        width={500}
                        height={400}
                        className="w-full h-auto max-h-80 object-contain pointer-events-none transition-all duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-80 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-2 text-gray-400">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500">No image available</p>
                        </div>
                      </div>
                    )}
                    
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
              {imageZoomed && selectedPaymentProof?.proof_image_url && (
                <div className="fixed inset-0 bg-black z-[70] flex items-center justify-center">
                  {/* Backdrop - Click to close */}
                  <div 
                    className="absolute inset-0 bg-black cursor-pointer"
                    onClick={() => setImageZoomed(false)}
                  />
                  
                  {/* Image Container */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
                    {selectedPaymentProof?.proof_image_url ? (
                      <Image 
                        src={selectedPaymentProof.proof_image_url} 
                        alt="Payment Proof - Full View"
                        width={1920}
                        height={1080}
                        className="max-w-full max-h-full object-contain cursor-pointer"
                        onClick={() => setImageZoomed(false)}
                        priority
                      />
                    ) : (
                      <div className="bg-gray-800 rounded-lg p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-white text-lg">No image available</p>
                        <p className="text-gray-400 text-sm mt-2">The payment proof image could not be loaded</p>
                        <button 
                          onClick={() => setImageZoomed(false)}
                          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    )}
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
                    setPaymentHistory([]);
                    setPaymentSummary(null);
                    setShowPaymentHistory(false);
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
