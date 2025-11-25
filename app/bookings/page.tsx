"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { isMaintenanceMode } from "../utils/maintenanceMode";
import { displayPhoneNumber } from "../utils/phoneUtils";
import { formatBookingNumber } from "../utils/bookingNumber";
import {
  checkAndExpirePendingBookings,
  autoCompleteFinishedBookings,
  getDaysPending,
  shouldShowExpirationWarning,
  getExpirationWarningMessage,
  getUserBookingStats,
  cleanupOldCompletedBookings,
  BookingStats,
} from "../utils/bookingUtils";
import { useToast } from "../components/Toast";
import { Tables } from "../../database.types";
import { ReceiptManager } from "../components/ReceiptManager";

import {
  CheckCircle,
  XCircle,
  PawPrint,
  MessageCircle,
  Clock,
  AlertTriangle,
  Ban,
  HourglassIcon,
  CheckCircle2,
  PhilippinePeso,
  Calendar,
  Users,
  Phone,
  Upload,
  Lightbulb,
  CreditCard,
  Smartphone,
  Home,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import AvailabilityCalendar from "../components/AvailabilityCalendar";

type Booking = Tables<"bookings">;

// Component that handles search params logic (wrapped in Suspense)
function SearchParamsHandler({
  onPaymentUploaded,
}: {
  onPaymentUploaded: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasShownSuccessRef = useRef(false);

  useEffect(() => {
    const paymentUploaded = searchParams.get("payment_uploaded");
    if (paymentUploaded === "true" && !hasShownSuccessRef.current) {
      hasShownSuccessRef.current = true;
      onPaymentUploaded();

      // Clean up the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("payment_uploaded");
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, onPaymentUploaded, router]);

  return null;
}

// Component to show upload button based on payment proof status
function PaymentProofUploadButton({ bookingId }: { bookingId: number }) {
  const [proofStatus, setProofStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkPaymentProof = async () => {
      try {
        // Fetch ALL payment proofs and prioritize them correctly (same logic as admin)
        const { data, error } = await supabase
          .from("payment_proofs")
          .select("status")
          .eq("booking_id", bookingId)
          .order("uploaded_at", { ascending: false });

        if (error) throw error;

        let selectedStatus = null;

        if (data && data.length > 0) {
          // Priority: pending > verified > rejected > cancelled
          // This ensures new pending proofs take priority over old rejected ones
          const pendingProof = data.find((proof) => proof.status === "pending");
          const verifiedProof = data.find(
            (proof) => proof.status === "verified"
          );
          const rejectedProof = data.find(
            (proof) => proof.status === "rejected"
          );
          const cancelledProof = data.find(
            (proof) => proof.status === "cancelled"
          );

          const selectedProof =
            pendingProof ||
            verifiedProof ||
            rejectedProof ||
            cancelledProof ||
            data[0];
          selectedStatus = selectedProof?.status || null;
        }

        setProofStatus(selectedStatus);
      } catch (error) {
        console.error("Error checking payment proof:", error);
        setProofStatus(null);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentProof();

    // ✨ ENHANCED Real-time subscription for instant updates when admin verifies/rejects
    const subscription = supabase
      .channel(`user_payment_button_${bookingId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: `button-${bookingId}` },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          console.log(
            `🚨 CRITICAL: Payment button real-time update for booking ${bookingId}:`,
            payload
          );

          const oldStatus =
            payload.old &&
            typeof payload.old === "object" &&
            "status" in payload.old
              ? payload.old.status
              : "unknown";
          const newStatus =
            payload.new &&
            typeof payload.new === "object" &&
            "status" in payload.new
              ? payload.new.status
              : "unknown";
          console.log(
            `📝 Event: ${payload.eventType}, Old status: ${oldStatus}, New status: ${newStatus}`
          );

          // Force immediate refresh with debugging
          console.log(
            `🔄 Triggering immediate button refresh for booking ${bookingId}...`
          );
          checkPaymentProof();

          // Also force a small delay refresh as backup
          setTimeout(() => {
            console.log(`🔄 Backup button refresh for booking ${bookingId}...`);
            checkPaymentProof();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log(
          `🔗 User payment button subscription for booking ${bookingId}:`,
          status
        );
        if (status === "SUBSCRIBED") {
          console.log(
            `✅ Real-time payment button updates ACTIVE for booking ${bookingId}`
          );
        } else if (status === "CHANNEL_ERROR") {
          console.warn(
            `⚠️ Real-time button subscription connection issue for booking ${bookingId} - falling back to manual refresh`
          );
          // Fallback: Set up a simple polling mechanism if real-time fails
          fallbackIntervalRef.current = setInterval(() => {
            checkPaymentProof();
          }, 10000); // Check every 10 seconds
        }
      });

    return () => {
      console.log(
        `🔌 Unsubscribing payment button real-time for booking ${bookingId}`
      );
      // Clean up fallback interval if it exists
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      subscription.unsubscribe();
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="bg-gray-700 text-gray-400 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 min-h-[44px]">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
        Checking...
      </div>
    );
  }

  // Show upload button only if no proof exists (rejected proofs handled by UserPaymentProofStatus)
  if (!proofStatus) {
    return (
      <Link href={`/upload-payment-proof?bookingId=${bookingId}`}>
        <button className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1 min-h-[44px] w-full sm:w-auto">
          Upload Payment Proof
        </button>
      </Link>
    );
  }

  // For rejected proofs, don't show button here (UserPaymentProofStatus will handle it)
  if (proofStatus === "rejected") {
    return null; // No button, the rejection status will show the resubmit button
  }

  // For cancelled proofs, show cancelled status
  if (proofStatus === "cancelled") {
    return (
      <div className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 min-h-[44px]">
        <Ban className="w-3 h-3" /> Cancelled
      </div>
    );
  }

  // Show status for pending or verified proofs
  if (proofStatus === "pending") {
    return (
      <div className="bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 min-h-[44px]">
        <HourglassIcon className="w-3 h-3" /> Under Review
      </div>
    );
  }

  if (proofStatus === "verified") {
    return (
      <div className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 min-h-[44px]">
        <CheckCircle2 className="w-3 h-3" /> Payment Verified
      </div>
    );
  }

  // Fallback for unknown status
  return (
    <Link href={`/upload-payment-proof?bookingId=${bookingId}`}>
      <button className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-1 min-h-[44px] w-full sm:w-auto">
        Upload Payment Proof
      </button>
    </Link>
  );
}

// Component to show dynamic payment amount info based on booking payment type
function PaymentAmountInfo({ bookingId }: { bookingId: number }) {
  const [paymentInfo, setPaymentInfo] = useState<{
    payment_type: string | null;
    total_amount: number;
    payment_amount: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("payment_type, total_amount, payment_amount")
          .eq("id", bookingId)
          .single();

        if (error) throw error;
        setPaymentInfo(data);
      } catch (error) {
        console.error("Error fetching booking payment info:", error);
        setPaymentInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <p className="text-xs text-orange-200 mb-3">
        Loading payment information...
      </p>
    );
  }

  if (!paymentInfo) {
    return (
      <p className="text-xs text-orange-200 mb-3">
        Upload your payment proof to confirm this booking.
      </p>
    );
  }

  const paymentAmount =
    paymentInfo.payment_amount || paymentInfo.total_amount * 0.5;
  const isFullPayment = paymentInfo.payment_type === "full";
  const paymentPercentage = isFullPayment ? "100%" : "50%";

  return (
    <div className="text-xs text-orange-200 mb-3 space-y-1">
      <p>Upload your payment proof to confirm this booking.</p>
      <p>
        <span className="font-medium">Required payment:</span>{" "}
        {paymentPercentage} ({isFullPayment ? "Full" : "Down"} Payment) ={" "}
        {paymentAmount.toLocaleString()}
      </p>
      <p className="text-orange-300">
        Take a screenshot/photo of your payment receipt and upload it below.
      </p>
    </div>
  );
}

// Payment proof status component for user bookings
function UserPaymentProofStatus({ bookingId }: { bookingId: number }) {
  const [paymentProof, setPaymentProof] =
    useState<Tables<"payment_proofs"> | null>(null);
  const [loading, setLoading] = useState(true);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        // Fetch ALL payment proofs and prioritize them correctly (same logic as admin)
        const { data, error } = await supabase
          .from("payment_proofs")
          .select("*")
          .eq("booking_id", bookingId)
          .order("uploaded_at", { ascending: false });

        if (error) throw error;

        let selectedProof = null;

        if (data && data.length > 0) {
          // Priority: pending > verified > rejected > cancelled
          // This ensures new pending proofs take priority over old rejected ones
          const pendingProof = data.find((proof) => proof.status === "pending");
          const verifiedProof = data.find(
            (proof) => proof.status === "verified"
          );
          const rejectedProof = data.find(
            (proof) => proof.status === "rejected"
          );
          const cancelledProof = data.find(
            (proof) => proof.status === "cancelled"
          );

          selectedProof =
            pendingProof ||
            verifiedProof ||
            rejectedProof ||
            cancelledProof ||
            data[0];
        }

        setPaymentProof(selectedProof);
      } catch (error) {
        console.error("Error fetching payment proof:", error);
        setPaymentProof(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentProof();

    // ✨ ENHANCED Real-time subscription for instant updates when admin verifies/rejects
    const subscription = supabase
      .channel(`user_payment_status_${bookingId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: `payment-${bookingId}` },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          console.log(
            `🚨 CRITICAL: Payment proof real-time update for booking ${bookingId}:`,
            payload
          );
          console.log(
            `📝 Event type: ${payload.eventType}, Old: ${JSON.stringify(
              payload.old
            )}, New: ${JSON.stringify(payload.new)}`
          );

          // Force immediate refresh with debugging
          console.log(
            `🔄 Triggering immediate refresh for booking ${bookingId} payment status...`
          );
          fetchPaymentProof();

          // Also force a small delay refresh as backup
          setTimeout(() => {
            console.log(
              `🔄 Backup refresh for booking ${bookingId} payment status...`
            );
            fetchPaymentProof();
          }, 1000);
        }
      )
      .subscribe((status) => {
        console.log(
          `🔗 User payment status subscription for booking ${bookingId}:`,
          status
        );
        if (status === "SUBSCRIBED") {
          console.log(
            `✅ Real-time payment updates ACTIVE for booking ${bookingId}`
          );
        } else if (status === "CHANNEL_ERROR") {
          console.warn(
            `⚠️ Real-time payment status connection issue for booking ${bookingId} - falling back to manual refresh`
          );
          // Fallback: Set up a simple polling mechanism if real-time fails
          fallbackIntervalRef.current = setInterval(() => {
            fetchPaymentProof();
          }, 15000); // Check every 15 seconds
        }
      });

    return () => {
      console.log(
        `🔌 Unsubscribing payment status real-time for booking ${bookingId}`
      );
      // Clean up fallback interval if it exists
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      subscription.unsubscribe();
    };
  }, [bookingId]);

  if (loading) {
    return (
      <span className="text-xs text-gray-400">Loading payment status...</span>
    );
  }

  if (!paymentProof) {
    return (
      <div className="bg-orange-900/30 border border-orange-600/50 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-300">
            Payment Proof Required
          </span>
        </div>
        <PaymentAmountInfo bookingId={bookingId} />
        {/* Upload button moved to main actions section to avoid duplication */}
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color:
            "bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200",
          icon: (
            <HourglassIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          ),
          title: "Payment Under Review",
          message: "We are reviewing your payment proof",
          messageColor: "text-amber-600 dark:text-amber-300",
        };
      case "approved":
      case "verified":
        return {
          color:
            "bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200",
          icon: (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          ),
          title: "Payment Verified",
          message: "Your payment has been approved successfully",
          messageColor: "text-green-600 dark:text-green-300",
        };
      case "rejected":
        return {
          color:
            "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
          icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
          title: "Payment Rejected",
          message: "Your payment proof needs correction",
          messageColor: "text-red-600 dark:text-red-300",
        };
      case "cancelled":
        return {
          color:
            "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
          icon: <Ban className="w-5 h-5 text-gray-500 dark:text-gray-400" />,
          title: "Payment Cancelled",
          message: "This payment proof has been cancelled",
          messageColor: "text-gray-500 dark:text-gray-400",
        };
      default:
        return {
          color:
            "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
          icon: (
            <AlertTriangle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ),
          title: "Unknown Status",
          message: "Please contact support for assistance",
          messageColor: "text-gray-500 dark:text-gray-400",
        };
    }
  };

  const statusInfo = getStatusInfo(paymentProof.status);

  return (
    <>
      <div className={`rounded-xl p-4 mb-4 shadow-sm ${statusInfo.color}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <div>
              <h3 className="text-sm font-semibold">{statusInfo.title}</h3>
              <p className="text-xs opacity-75 mt-0.5">{statusInfo.message}</p>
            </div>
          </div>
          {paymentProof.status === "rejected" && (
            <Link href={`/upload-payment-proof?bookingId=${bookingId}`}>
              <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform min-h-[44px]">
                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                Upload New Proof
              </button>
            </Link>
          )}
        </div>

        {paymentProof.admin_notes && paymentProof.status === "rejected" && (
          <div className="text-xs text-red-200 space-y-1">
            {(() => {
              const notes = paymentProof.admin_notes;
              let rejectionReason = null;
              let adminNotes = null;

              if (notes.includes("REJECTION REASON:")) {
                const parts = notes.split("\n\nADMIN NOTES:");
                rejectionReason = parts[0].replace("REJECTION REASON: ", "");
                adminNotes = parts[1] ? parts[1].trim() : null;
              } else {
                rejectionReason = notes;
              }

              return (
                <div className="space-y-3 mt-3">
                  {/* Rejection Reason Card */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/30 border border-red-200/60 dark:border-red-800/30 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/60 rounded-xl flex items-center justify-center shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-bold text-red-900 dark:text-red-100">
                            Rejection Reason
                          </h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            Action Required
                          </span>
                        </div>
                        <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed font-medium">
                          {rejectionReason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes Card */}
                  {adminNotes && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 border border-blue-200/60 dark:border-blue-800/30 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/60 rounded-xl flex items-center justify-center shadow-sm">
                          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                              Additional Notes
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              From Admin
                            </span>
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                            {adminNotes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {paymentProof.admin_notes && paymentProof.status !== "rejected" && (
          <div className="mt-3 bg-blue-50/90 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  Admin Notes
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  {paymentProof.admin_notes}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function BookingsPageContent() {
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

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newCheckInDate, setNewCheckInDate] = useState("");
  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true); // Default to calendar view

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 bookings per page
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);

  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Handle payment upload success message callback
  const handlePaymentUploaded = () => {
    showToast({
      type: "success",
      title: "Payment Proof Uploaded!",
      message:
        "Your payment proof has been submitted successfully. We'll verify it within 24 hours.",
      duration: 5000,
    });
    setRefreshTrigger((prev) => prev + 1); // Force refresh bookings data
  };

  // Note: Removed window focus refresh to prevent loading states when Alt+Tabbing
  // Real-time subscriptions handle updates automatically, so manual refresh on focus is not needed

  // Load maintenance mode settings
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const isActive = await isMaintenanceMode();
        setMaintenanceActive(isActive);
      } catch (error) {
        console.error("Error checking maintenance mode:", error);
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
    window.addEventListener("maintenanceSettingsChanged", handleSettingsChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "maintenanceSettingsChanged",
        handleSettingsChange
      );
    };
  }, []);

  // ⚡ ENHANCED: Real-time subscriptions for instant user booking updates
  useEffect(() => {
    if (!user) return;

    console.log("🚀 Setting up INSTANT real-time user bookings system...");
    console.log(
      "⚡ User will see instant updates when admin changes booking status"
    );

    // Set up real-time subscription for user's bookings
    const userBookingsSubscription = supabase
      .channel(`user-bookings-${user.id}`, {
        config: {
          broadcast: { self: true },
          presence: { key: `user-${user.id}` },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔄 Real-time user booking update received:", payload);

          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "UPDATE" && newRecord) {
            console.log("⚡ INSTANT booking status update for user");

            // Update booking in state instantly
            setBookings((prevBookings) =>
              prevBookings.map((booking) =>
                booking.id === newRecord.id
                  ? { ...booking, ...newRecord }
                  : booking
              )
            );

            // Update stats instantly when status changes
            if (oldRecord && oldRecord.status !== newRecord.status) {
              setBookingStats((prevStats) => {
                if (!prevStats) return prevStats;

                let pendingDelta = 0;
                let confirmedDelta = 0;
                let cancelledDelta = 0;

                // Calculate deltas based on status change
                if (
                  oldRecord.status === "pending" &&
                  newRecord.status !== "pending"
                ) {
                  pendingDelta = -1;
                }
                if (
                  oldRecord.status !== "pending" &&
                  newRecord.status === "pending"
                ) {
                  pendingDelta = 1;
                }
                if (
                  oldRecord.status === "confirmed" &&
                  newRecord.status !== "confirmed"
                ) {
                  confirmedDelta = -1;
                }
                if (
                  oldRecord.status !== "confirmed" &&
                  newRecord.status === "confirmed"
                ) {
                  confirmedDelta = 1;
                }
                if (
                  oldRecord.status === "cancelled" &&
                  newRecord.status !== "cancelled"
                ) {
                  cancelledDelta = -1;
                }
                if (
                  oldRecord.status !== "cancelled" &&
                  newRecord.status === "cancelled"
                ) {
                  cancelledDelta = 1;
                }

                const updatedStats = {
                  ...prevStats,
                  pendingCount: Math.max(
                    0,
                    prevStats.pendingCount + pendingDelta
                  ),
                  confirmedCount: Math.max(
                    0,
                    prevStats.confirmedCount + confirmedDelta
                  ),
                  cancelledCount: Math.max(
                    0,
                    prevStats.cancelledCount + cancelledDelta
                  ),
                };

                updatedStats.canCreatePending = updatedStats.pendingCount < 3;

                console.log(
                  `📊 Stats updated instantly: pending ${prevStats.pendingCount} → ${updatedStats.pendingCount}`
                );
                return updatedStats;
              });

              const statusMessages = {
                confirmed: {
                  title: "Booking Confirmed!",
                  message: "Your booking has been confirmed by admin",
                },
                cancelled: {
                  title: "Booking Cancelled",
                  message: "Your booking has been cancelled by admin",
                },
                pending: {
                  title: "Booking Pending",
                  message: "Your booking is now pending review",
                },
              };

              const statusInfo =
                statusMessages[newRecord.status as keyof typeof statusMessages];
              if (statusInfo) {
                showToast({
                  type: newRecord.status === "confirmed" ? "success" : "info",
                  title: statusInfo.title,
                  message: statusInfo.message,
                  duration: 4000,
                });
              }
            }
          }

          if (eventType === "INSERT" && newRecord) {
            console.log(
              "📝 New booking created - should not happen here for user view"
            );
          }

          if (eventType === "DELETE" && oldRecord) {
            console.log("🗑️ Booking deleted by admin");
            setBookings((prevBookings) =>
              prevBookings.filter((booking) => booking.id !== oldRecord.id)
            );

            // Update stats when booking is deleted
            setBookingStats((prevStats) => {
              if (!prevStats) return prevStats;

              let pendingDelta = 0;
              let confirmedDelta = 0;
              let cancelledDelta = 0;

              if (oldRecord.status === "pending") pendingDelta = -1;
              if (oldRecord.status === "confirmed") confirmedDelta = -1;
              if (oldRecord.status === "cancelled") cancelledDelta = -1;

              const updatedStats = {
                ...prevStats,
                pendingCount: Math.max(
                  0,
                  prevStats.pendingCount + pendingDelta
                ),
                confirmedCount: Math.max(
                  0,
                  prevStats.confirmedCount + confirmedDelta
                ),
                cancelledCount: Math.max(
                  0,
                  prevStats.cancelledCount + cancelledDelta
                ),
              };

              updatedStats.canCreatePending = updatedStats.pendingCount < 3;

              console.log(
                `📊 Stats updated after deletion: pending ${prevStats.pendingCount} → ${updatedStats.pendingCount}`
              );
              return updatedStats;
            });

            showToast({
              type: "warning",
              title: "Booking Removed",
              message: "A booking was removed by admin",
              duration: 3000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("🔗 User bookings real-time subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log(
            "✅ User bookings real-time system active - instant updates enabled"
          );
        }
      });

    // ✨ NEW: Real-time subscription for user's payment proofs - INSTANT verification/rejection updates
    const userPaymentProofsSubscription = supabase
      .channel(`user-payment-proofs-${user.id}`, {
        config: {
          broadcast: { self: true },
          presence: { key: `user-payment-${user.id}` },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log(
            "� Real-time user payment proof update received:",
            payload
          );

          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "UPDATE" && newRecord && oldRecord) {
            // Check if status changed (admin verified/rejected payment)
            if (oldRecord.status !== newRecord.status) {
              console.log(
                `⚡ Payment proof ${newRecord.id} status changed: ${oldRecord.status} → ${newRecord.status}`
              );

              // ⚡ FORCE COMPONENT REFRESH - Critical for real-time UI updates
              console.log(
                `🚨 FORCING component refresh due to payment status change: ${oldRecord.status} → ${newRecord.status}`
              );
              setRefreshTrigger((prev) => prev + 1);

              // Show instant status change notification
              const statusMessages = {
                verified: {
                  title: "Payment Verified!",
                  message: "Your payment proof has been approved by admin",
                },
                rejected: {
                  title: "Payment Rejected",
                  message:
                    "Your payment proof was rejected. Please check details and resubmit.",
                },
                cancelled: {
                  title: "Payment Cancelled",
                  message: "Your payment proof was cancelled",
                },
              };

              const statusInfo =
                statusMessages[newRecord.status as keyof typeof statusMessages];
              if (statusInfo) {
                showToast({
                  type:
                    newRecord.status === "verified"
                      ? "success"
                      : newRecord.status === "rejected"
                      ? "error"
                      : "info",
                  title: statusInfo.title,
                  message: statusInfo.message,
                  duration: 5000,
                });
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(
          "🔗 User payment proofs real-time subscription status:",
          status
        );
        if (status === "SUBSCRIBED") {
          console.log(
            "✅ User payment proof real-time system active - instant verification/rejection updates"
          );
        }
      });

    return () => {
      console.log("🔌 Cleaning up user real-time subscriptions");
      userBookingsSubscription.unsubscribe();
      userPaymentProofsSubscription.unsubscribe();
    };
  }, [user, showToast, setRefreshTrigger]);

  useEffect(() => {
    async function loadBookings() {
      if (!user) return;

      setIsRefreshing(true);

      // First, check and auto-cancel any pending bookings older than 7 days
      try {
        const cancelledBookings = await checkAndExpirePendingBookings();
        if (cancelledBookings.length > 0) {
          console.log(
            `Auto-cancelled ${cancelledBookings.length} booking(s) that were pending for 7+ days`
          );
        }
      } catch (error) {
        console.error("Error checking pending bookings:", error);
      }

      // Auto-complete confirmed bookings that have passed their checkout date
      try {
        const completedCount = await autoCompleteFinishedBookings();
        if (completedCount > 0) {
          console.log(
            `Auto-completed ${completedCount} booking(s) past checkout date`
          );
        }
      } catch (error) {
        console.error("Error auto-completing bookings:", error);
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
        setBookings((data as Booking[]) || []);
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
    setShowRescheduleModal(false);
    setNewCheckInDate("");
    setNewCheckOutDate("");
    setShowCalendar(false);
  };

  // Pagination helpers
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, bookings.length);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () =>
    setCurrentPage(Math.min(totalPages, currentPage + 1));

  const canCancelBooking = (booking: Booking) => {
    if (!booking.status || booking.status.toLowerCase() === "cancelled") {
      return false;
    }

    // Always allow cancellation if booking is pending
    if (booking.status.toLowerCase() === "pending") {
      return true;
    }

    // For confirmed bookings, check if it's at least 24 hours before check-in
    if (booking.status.toLowerCase() === "confirmed") {
      const checkInDate = new Date(booking.check_in_date);
      const now = new Date();
      const timeDifference = checkInDate.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 3600);

      return hoursDifference >= 24;
    }

    return false;
  };

  const canRescheduleBooking = (booking: Booking) => {
    // Same rules as cancellation - can reschedule if can cancel
    return canCancelBooking(booking);
  };

  const getCancellationMessage = (booking: Booking) => {
    if (booking.status?.toLowerCase() === "pending") {
      return "Cancel this pending booking";
    }

    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const timeDifference = checkInDate.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 3600);

    if (hoursDifference < 24) {
      return `Cannot cancel: Less than 24 hours until check-in (${Math.floor(
        hoursDifference
      )} hours remaining)`;
    }

    return `Cancel booking (${Math.floor(
      hoursDifference
    )} hours until check-in)`;
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!cancellationReason.trim()) {
      showToast({
        type: "warning",
        title: "Cancellation Reason Required",
        message: "Please provide a reason for cancellation before proceeding.",
        duration: 4000,
      });
      return;
    }

    // ⚡ ULTRA-FAST cancellation with proper data capture
    console.log("🚀 INSTANT user cancellation started for booking:", bookingId);

    // Capture reason before clearing (prevent stale closure)
    const reasonForServer = cancellationReason.trim();

    // Store original booking state for potential revert
    const originalBooking = bookings.find((b) => b.id === bookingId);

    // 1. INSTANT UI UPDATE - User sees immediate response
    const instantUpdatedBookings = bookings.map((booking) =>
      booking.id === bookingId
        ? {
            ...booking,
            status: "cancelled",
            cancelled_by: "user",
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reasonForServer,
          }
        : booking
    );
    setBookings(instantUpdatedBookings);
    console.log(
      "⚡ UI updated INSTANTLY - booking shows as cancelled immediately"
    );

    // 2. INSTANT STATS UPDATE - Update booking stats immediately
    if (bookingStats && originalBooking?.status === "pending") {
      const updatedStats = {
        ...bookingStats,
        pendingCount: Math.max(0, bookingStats.pendingCount - 1),
        cancelledCount: bookingStats.cancelledCount + 1,
        canCreatePending: bookingStats.pendingCount - 1 < 3,
      };
      setBookingStats(updatedStats);
      console.log(
        "⚡ STATS updated INSTANTLY - pending count decremented immediately"
      );
    }

    // 3. INSTANT modal close and cleanup
    setShowCancelModal(false);
    setCancellationReason("");

    // 4. INSTANT success feedback - No waiting for server!
    showToast({
      type: "success",
      title: "Booking Cancelled Successfully!",
      message: "Confirmation email will be sent to your inbox",
      duration: 4000,
    });

    // 5. Background server sync - User doesn't wait for this
    console.log(
      "🔄 Starting background server sync (user already sees success)..."
    );
    processServerCancellation(bookingId, reasonForServer, originalBooking);
  };

  // ⚡ Enhanced background server sync - Non-blocking and safe
  const processServerCancellation = async (
    bookingId: number,
    reason: string,
    originalBooking: Booking | undefined
  ) => {
    console.log(
      "🚀 Background server sync for booking:",
      bookingId,
      "with reason:",
      reason
    );

    try {
      const response = await fetch("/api/user/cancel-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          userId: user?.id,
          cancellationReason: reason,
        }),
      });

      const result = await response.json();
      console.log("✅ Server sync response:", result);

      if (result.success) {
        console.log("🎉 Server confirmed cancellation - all systems in sync");

        // Only show notifications for email issues, not for successful delivery
        if (result.warning) {
          showToast({
            type: "warning",
            title: "Email Issue",
            message: result.warning,
            duration: 4000,
          });
        } else if (!result.guestEmailSent && !result.adminEmailSent) {
          showToast({
            type: "warning",
            title: "Email Issue",
            message:
              "Booking cancelled but confirmation email may not have been sent",
            duration: 4000,
          });
        } else if (!result.guestEmailSent || !result.adminEmailSent) {
          showToast({
            type: "info",
            title: "Email Status",
            message: "Booking cancelled - some emails may have failed",
            duration: 3000,
          });
        }
        // For successful email delivery, we don't show additional toast (user already got instant confirmation)

        // Refresh data silently to ensure full sync (including updated stats)
        refreshBookingsInBackground();
      } else {
        console.error("❌ Server sync failed:", result.error);

        // SAFE REVERT: Restore original booking state AND stats
        if (originalBooking) {
          const revertedBookings = bookings.map((booking) =>
            booking.id === bookingId ? originalBooking : booking
          );
          setBookings(revertedBookings);

          // Revert stats if it was a pending booking
          if (bookingStats && originalBooking.status === "pending") {
            const revertedStats = {
              ...bookingStats,
              pendingCount: bookingStats.pendingCount + 1,
              cancelledCount: Math.max(0, bookingStats.cancelledCount - 1),
              canCreatePending: bookingStats.pendingCount + 1 < 3,
            };
            setBookingStats(revertedStats);
            console.log("🔄 Stats reverted due to server sync failure");
          }

          showToast({
            type: "error",
            title: "Cancellation Issue",
            message: "Server sync failed. Your booking is still active.",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("🔥 Network error during server sync:", error);

      // SAFE REVERT: Network issue - restore original state AND stats
      if (originalBooking) {
        const revertedBookings = bookings.map((booking) =>
          booking.id === bookingId ? originalBooking : booking
        );
        setBookings(revertedBookings);

        // Revert stats if it was a pending booking
        if (bookingStats && originalBooking.status === "pending") {
          const revertedStats = {
            ...bookingStats,
            pendingCount: bookingStats.pendingCount + 1,
            cancelledCount: Math.max(0, bookingStats.cancelledCount - 1),
            canCreatePending: bookingStats.pendingCount + 1 < 3,
          };
          setBookingStats(revertedStats);
          console.log("🔄 Stats reverted due to network error");
        }

        showToast({
          type: "error",
          title: "Connection Issue",
          message:
            "Network error - your booking is still active. Please try again.",
          duration: 5000,
        });
      }
    }
  };

  // Reschedule handlers
  const handleOpenReschedule = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewCheckInDate(""); // Reset dates
    setNewCheckOutDate("");
    setShowRescheduleModal(true);
  };

  const handleCalendarDateSelect = (checkIn: string, checkOut: string) => {
    setNewCheckInDate(checkIn);
    setNewCheckOutDate(checkOut);
  };

  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !newCheckInDate || !newCheckOutDate) {
      showToast({
        type: "warning",
        title: "Missing Information",
        message: "Please select both check-in and check-out dates",
        duration: 4000,
      });
      return;
    }

    // Validate dates
    const checkIn = new Date(newCheckInDate);
    const checkOut = new Date(newCheckOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if the new dates are the same as current booking dates
    const currentCheckIn = new Date(
      selectedBooking.check_in_date
    ).toDateString();
    const currentCheckOut = new Date(
      selectedBooking.check_out_date
    ).toDateString();
    const newCheckInString = checkIn.toDateString();
    const newCheckOutString = checkOut.toDateString();

    if (
      currentCheckIn === newCheckInString &&
      currentCheckOut === newCheckOutString
    ) {
      showToast({
        type: "warning",
        title: "Same Dates Selected",
        message:
          "The new dates are the same as your current booking. Please select different dates to reschedule.",
        duration: 5000,
      });
      return;
    }

    if (checkIn < today) {
      showToast({
        type: "warning",
        title: "Invalid Date",
        message: "Check-in date cannot be in the past",
        duration: 4000,
      });
      return;
    }

    if (checkOut <= checkIn) {
      showToast({
        type: "warning",
        title: "Invalid Date",
        message: "Check-out date must be after check-in date",
        duration: 4000,
      });
      return;
    }

    setRescheduleLoading(true);

    try {
      // Call backend API to reschedule
      const response = await fetch("/api/user/reschedule-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          newCheckIn: newCheckInDate,
          newCheckOut: newCheckOutDate,
          userId: user?.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state with new booking details including payment status
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === selectedBooking.id
              ? {
                  ...booking,
                  check_in_date: newCheckInDate,
                  check_out_date: newCheckOutDate,
                  total_amount: result.booking.total_amount,
                  payment_status: "pending", // Reset to pending since amount changed
                }
              : booking
          )
        );

        // Close the reschedule modal first
        setShowRescheduleModal(false);
        setNewCheckInDate("");
        setNewCheckOutDate("");

        // Show payment information if amount changed
        if (result.requiresNewPayment && result.pricing) {
          const { newAmount, nightsCount } = result.pricing;

          showToast({
            type: "success",
            title: "Booking Rescheduled!",
            message: `Dates updated successfully! New amount: ₱${newAmount.toLocaleString()} (${nightsCount} nights). Click "Upload Payment Proof" button or wait for redirect.`,
            duration: 5000,
          });

          // Redirect to payment upload using Next.js router
          setTimeout(() => {
            console.log(
              "🔄 Redirecting to payment upload for booking ID:",
              selectedBooking.id
            );
            router.push(
              `/upload-payment-proof?bookingId=${selectedBooking.id}`
            );
          }, 1000); // 1 second delay
        } else {
          showToast({
            type: "success",
            title: "Booking Rescheduled!",
            message: "Your booking dates have been updated successfully",
            duration: 4000,
          });
        }
      } else {
        showToast({
          type: "error",
          title: "Reschedule Failed",
          message:
            result.error || "Could not reschedule booking. Please try again.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Reschedule error:", error);
      showToast({
        type: "error",
        title: "Network Error",
        message: "Please check your connection and try again",
        duration: 4000,
      });
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Background refresh function - non-blocking
  const refreshBookingsInBackground = async () => {
    try {
      if (user) {
        // Refresh both bookings and stats
        const [bookingsResult, statsResult] = await Promise.all([
          supabase
            .from("bookings")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          getUserBookingStats(user.id),
        ]);

        if (!bookingsResult.error && bookingsResult.data) {
          setBookings(bookingsResult.data as Booking[]);
          console.log("📊 Background bookings refresh completed");
        }

        if (statsResult) {
          setBookingStats(statsResult);
          console.log("📊 Background stats refresh completed");
        }
      }
    } catch (error) {
      console.error("Background refresh error:", error);
      // Silent fail - don't show error to user
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <HourglassIcon className="w-5 h-5 text-yellow-500" />;
      case "cancelling":
        return (
          <div className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
        );
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
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
      case "completed":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status.toLowerCase()) {
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold mb-2">
            Loading your bookings...
          </div>
          <div className="text-gray-400 text-sm">
            {authLoading ? "Authenticating..." : "Fetching booking data..."}
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
      {/* Search params handler */}
      <Suspense fallback={null}>
        <SearchParamsHandler onPaymentUploaded={handlePaymentUploaded} />
      </Suspense>
      {/* Mobile-First Sticky Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </Link>
              <div className="text-white">
                <h1 className="text-lg sm:text-xl font-bold">My Bookings</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                  Manage your reservations
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isRefreshing) {
                    // Extra safety: don't allow click while already refreshing
                    console.log("🔄 Manual refresh triggered");
                    setRefreshTrigger((prev) => prev + 1);
                  }
                }}
                disabled={isRefreshing}
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors ml-2 ${
                  isRefreshing ? "opacity-50" : ""
                }`}
                title="Refresh Bookings"
              >
                {isRefreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-gray-300"></div>
                ) : (
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
                )}
              </button>
            </div>
            {maintenanceActive ? (
              <div className="flex-shrink-0">
                <div className="flex items-center gap-1 sm:gap-2 bg-gray-500 text-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New </span>Book
                  <span className="text-xs">(Disabled)</span>
                </div>
              </div>
            ) : (
              <Link href="/book" className="flex-shrink-0" prefetch={true}>
                <button className="flex items-center gap-1 sm:gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
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
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white mb-3 sm:mb-4">
                Booking Summary
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
                <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <HourglassIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-yellow-400 font-medium text-xs sm:text-sm">
                      Pending
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {bookingStats.pendingCount}/3
                  </p>
                  <p className="text-xs text-yellow-300 truncate">
                    {bookingStats.canCreatePending
                      ? `${3 - bookingStats.pendingCount} slots left`
                      : "Limit reached"}
                  </p>
                </div>

                <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    <span className="text-green-400 font-medium text-xs sm:text-sm">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {bookingStats.confirmedCount}
                  </p>
                  <p className="text-xs text-green-300">Active bookings</p>
                </div>

                <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-blue-400 font-medium text-xs sm:text-sm">
                      Completed
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {bookingStats.completedCount}/5
                  </p>
                  <p className="text-xs text-blue-300 truncate">
                    {bookingStats.completedCount >= 5
                      ? "Auto-archived"
                      : "Recent ones"}
                  </p>
                </div>

                <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                    <span className="text-red-400 font-medium text-xs sm:text-sm">
                      Cancelled
                    </span>
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
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
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
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-gray-400" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 lg:mb-4">
              No bookings yet
            </h2>
            <p className="text-gray-400 mb-4 sm:mb-6 lg:mb-8 max-w-md mx-auto text-xs sm:text-sm lg:text-base px-2">
              You haven&apos;t made any reservations yet. Start planning your
              perfect getaway at Kampo Ibayo!
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
                  Resort is temporarily closed for maintenance. Call{" "}
                  <a
                    href="tel:+639662815123"
                    className="text-orange-400 hover:text-orange-300"
                  >
                    +63 966 281 5123
                  </a>{" "}
                  for assistance.
                </p>
              )}
              <div className="text-center">
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition text-xs sm:text-sm"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Bookings List - Mobile Optimized
          <div className="space-y-3 sm:space-y-4">
            {/* Payment Process Info - Show if user has pending bookings */}
            {bookings.some((b) => b.status === "pending") && (
              <div className="bg-blue-800/50 border border-blue-600/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-300" />
                  Complete Your Booking
                </h3>
                <p className="text-blue-200 text-xs sm:text-sm mb-2">
                  Your bookings are <strong>pending</strong> until you upload
                  payment proof. Here&apos;s how:
                </p>
                <div className="space-y-1 text-blue-100 text-xs">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3 h-3 text-blue-200 flex-shrink-0" />
                    <p>
                      Pay 50% down payment via GCash, Bank Transfer, or other
                      methods
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-3 h-3 text-blue-200 flex-shrink-0" />
                    <p>Take a screenshot/photo of your payment receipt</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="w-3 h-3 text-blue-200 flex-shrink-0" />
                    <p>
                      Click &quot;Upload Payment Proof&quot; on your booking
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-blue-200 flex-shrink-0" />
                    <p>
                      Admin will review and confirm your booking within 24 hours
                    </p>
                  </div>
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
                    <>
                      Showing {startIndex + 1} to {endIndex} of{" "}
                      {bookings.length}
                    </>
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
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white truncate">
                              {formatBookingNumber(booking.id)}
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          {getStatusIcon(booking.status || "pending")}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(
                              booking.status || "pending"
                            )}`}
                          >
                            {getStatusDisplayName(booking.status || "pending")}
                          </span>
                        </div>
                      </div>
                      <div className="px-2 sm:px-3">
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {booking.guest_name} •{" "}
                          {booking.guest_email || "No email"}
                        </p>
                      </div>
                    </div>

                    {/* Expiration Warning - Mobile Optimized */}
                    {shouldShowExpirationWarning(
                      booking.created_at,
                      booking.status || "pending"
                    ) && (
                      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-orange-900/30 border border-orange-600/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-orange-400 text-xs sm:text-sm font-medium">
                              {getExpirationWarningMessage(booking.created_at)}
                            </p>
                            <p className="text-orange-300 text-xs mt-1">
                              Pending for {getDaysPending(booking.created_at)}{" "}
                              day(s). Contact admin or complete payment to
                              confirm.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Details Grid - Mobile Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 text-gray-300 p-2 bg-gray-600/30 rounded">
                        <Calendar className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">Check-in</p>
                          <p className="font-semibold text-xs truncate">
                            {booking.check_in_date
                              ? new Date(
                                  booking.check_in_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 p-2 bg-gray-600/30 rounded">
                        <Calendar className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">Check-out</p>
                          <p className="font-semibold text-xs truncate">
                            {booking.check_out_date
                              ? new Date(
                                  booking.check_out_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 p-2 bg-gray-600/30 rounded">
                        <Users className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">Guests</p>
                          <p className="font-semibold text-xs">
                            {booking.number_of_guests} guest(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 p-2 bg-gray-600/30 rounded">
                        <PhilippinePeso className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">
                            {booking.payment_type === "full"
                              ? "Payment Required"
                              : "Down Payment (50%)"}
                          </p>
                          <p className="font-semibold text-green-400 text-xs">
                            ₱
                            {(
                              booking.payment_amount ||
                              (booking.payment_type === "full"
                                ? booking.total_amount
                                : booking.total_amount * 0.5)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info - Mobile Optimized */}
                    {booking.guest_phone && (
                      <div className="mb-3 sm:mb-4 p-2 bg-gray-600/30 rounded">
                        <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-500" />
                          Contact:{" "}
                          <a
                            href={`tel:${booking.guest_phone}`}
                            className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                          >
                            {displayPhoneNumber(booking.guest_phone)}
                          </a>
                        </p>
                      </div>
                    )}

                    {/* Special Requests - Mobile Optimized */}
                    {booking.special_requests && (
                      <div className="bg-gray-600/50 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">
                        <p className="text-xs text-gray-400 mb-1">
                          💬 Special Request:
                        </p>
                        <p className="text-gray-200 text-xs sm:text-sm">
                          {booking.special_requests}
                        </p>
                      </div>
                    )}

                    {/* Payment Proof Status - Show for pending bookings only */}
                    {booking.status === "pending" && (
                      <UserPaymentProofStatus
                        key={`payment-status-${booking.id}-${refreshTrigger}`}
                        bookingId={booking.id}
                      />
                    )}

                    {/* Actions Section - Mobile First */}
                    <div className="flex flex-col gap-2 sm:gap-3 pt-3 border-t border-gray-600">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          {booking.created_at
                            ? new Date(booking.created_at).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => openModal(booking)}
                          className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-500 transition flex items-center justify-center gap-1 min-h-[44px] w-full sm:w-auto"
                        >
                          View Details
                        </button>

                        {/* Receipt Buttons - Show only for confirmed bookings with verified payment */}
                        {booking.status === "confirmed" && (
                          <ReceiptManager
                            booking={booking}
                            userEmail={user?.email || ""}
                            userName={
                              user?.user_metadata?.full_name ||
                              user?.email?.split("@")[0] ||
                              "Guest"
                            }
                            hasVerifiedPayment={true}
                            key={`receipt-${booking.id}-${
                              booking.updated_at || booking.created_at
                            }`}
                          />
                        )}

                        {/* Upload Payment Proof Button - Only show if pending */}
                        {booking.status === "pending" && (
                          <PaymentProofUploadButton
                            key={`upload-button-${booking.id}-${refreshTrigger}`}
                            bookingId={booking.id}
                          />
                        )}

                        {/* Reschedule Button */}
                        {canRescheduleBooking(booking) && (
                          <button
                            onClick={() => handleOpenReschedule(booking)}
                            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1 min-h-[44px] w-full sm:w-auto"
                          >
                            <Calendar className="w-3 h-3" />
                            Reschedule
                          </button>
                        )}

                        {canCancelBooking(booking) ? (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancelModal(true); // Skip booking details modal, go straight to cancellation
                            }}
                            className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-1 min-h-[44px] w-full sm:w-auto"
                            title={getCancellationMessage(booking)}
                          >
                            Cancel
                          </button>
                        ) : (
                          booking.status?.toLowerCase() !== "cancelled" && (
                            <button
                              disabled
                              className="bg-gray-500 text-gray-300 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-1 min-h-[44px] w-full sm:w-auto"
                              title={getCancellationMessage(booking)}
                            >
                              <Ban className="w-3 h-3" />
                              Cannot Cancel
                            </button>
                          )
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
                      <ChevronLeft className="w-3 h-3" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>

                    {/* Page Numbers - Centered */}
                    <div className="flex items-center gap-1 flex-1 justify-center">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
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
                                  ? "bg-red-600 text-white"
                                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        }
                      )}
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
                      <ChevronRight className="w-3 h-3" />
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
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cancel Booking
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatBookingNumber(selectedBooking.id)}
                  </p>
                </div>
              </div>

              {/* Booking Summary Card */}
              <div className="mx-5 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Guest
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      {selectedBooking.guest_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Check-in
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {selectedBooking.check_in_date
                        ? new Date(
                            selectedBooking.check_in_date
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Amount
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {selectedBooking.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Refund Information - Compact Policy Integration */}
              <div className="mx-5 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Your Refund
                  </h4>
                  {(() => {
                    const checkIn = new Date(selectedBooking.check_in_date);
                    const now = new Date();
                    const hoursUntilCheckIn =
                      (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
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

                    const refundAmount = Math.round(
                      downPayment * (percentage / 100)
                    );

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
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            Down Payment
                          </span>
                          <span className="font-medium text-blue-800 dark:text-blue-300">
                            {downPayment.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            Refund Amount ({percentage}%)
                          </span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {refundAmount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Time until check-in: {Math.floor(hoursUntilCheckIn)}{" "}
                          hours
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {cancellationReason.length}/200 characters
                  </p>
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
                  const hoursUntilCheckIn =
                    (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
                  const canCancel = hoursUntilCheckIn >= 24;

                  if (!canCancel) {
                    return (
                      <button
                        disabled
                        className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-4 py-3 rounded-xl text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
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
                          ? "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-red-600/25"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Booking
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Reschedule Booking
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatBookingNumber(selectedBooking.id)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  ×
                </button>
              </div>

              {/* Current Dates Display */}
              <div className="mx-6 mt-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Current Dates
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Check-in
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(
                          selectedBooking.check_in_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Check-out
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(
                          selectedBooking.check_out_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar or Date Inputs Toggle */}
              <div className="mx-6 mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showCalendar
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    📅 Calendar View
                  </button>
                  <button
                    onClick={() => setShowCalendar(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !showCalendar
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    📝 Date Input
                  </button>
                </div>
              </div>

              {/* Calendar or Date Inputs */}
              <div className="mx-6 mb-4">
                {showCalendar ? (
                  <div className="border rounded-lg overflow-hidden">
                    <AvailabilityCalendar
                      selectedCheckIn={
                        selectedBooking.check_in_date.split("T")[0]
                      }
                      selectedCheckOut={
                        selectedBooking.check_out_date.split("T")[0]
                      }
                      onDateSelect={handleCalendarDateSelect}
                      excludeBookingId={selectedBooking.id}
                      minDate={new Date().toISOString().split("T")[0]}
                      isRescheduling={true}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Check-in Date
                      </label>
                      <input
                        type="date"
                        value={newCheckInDate}
                        onChange={(e) => setNewCheckInDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Check-out Date
                      </label>
                      <input
                        type="date"
                        value={newCheckOutDate}
                        onChange={(e) => setNewCheckOutDate(e.target.value)}
                        min={
                          newCheckInDate ||
                          new Date().toISOString().split("T")[0]
                        }
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Policy Info */}
              <div className="mx-6 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    📅 Rescheduling is free if done 24+ hours before your
                    current check-in date. Your original dates will be released
                    when new dates are confirmed.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 p-6 pt-0 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleBooking}
                  disabled={
                    !newCheckInDate || !newCheckOutDate || rescheduleLoading
                  }
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  {rescheduleLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                      Rescheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Confirm Reschedule
                    </>
                  )}
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
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                        Booking Details
                      </h2>
                      <p className="text-white/90 text-xs sm:text-sm">
                        Your reservation information
                      </p>
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
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {formatBookingNumber(selectedBooking.id)}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate">
                          {selectedBooking.guest_name} •{" "}
                          {selectedBooking.guest_email || "No email"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusIcon(selectedBooking.status || "pending")}
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(
                          selectedBooking.status || "pending"
                        )}`}
                      >
                        {getStatusDisplayName(
                          selectedBooking.status || "pending"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Dates and Guest Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">Check-in Date</p>
                          <p className="font-semibold text-sm sm:text-base truncate">
                            {selectedBooking.check_in_date
                              ? new Date(
                                  selectedBooking.check_in_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">
                            Number of Guests
                          </p>
                          <p className="font-semibold text-sm sm:text-base">
                            {selectedBooking.number_of_guests} guest(s)
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">
                            Check-out Date
                          </p>
                          <p className="font-semibold text-sm sm:text-base truncate">
                            {selectedBooking.check_out_date
                              ? new Date(
                                  selectedBooking.check_out_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                        <PhilippinePeso className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">
                            {selectedBooking.payment_type === "full"
                              ? "Payment Required"
                              : "Down Payment (50%)"}
                          </p>
                          <p className="font-semibold text-green-400 text-sm sm:text-base">
                            ₱
                            {(
                              selectedBooking.payment_amount ||
                              (selectedBooking.payment_type === "full"
                                ? selectedBooking.total_amount
                                : selectedBooking.total_amount * 0.5)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  {selectedBooking.guest_phone && (
                    <div className="border-t border-gray-600 pt-3 sm:pt-4">
                      <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                        <span>Phone:</span>
                        <a
                          href={`tel:${selectedBooking.guest_phone}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                        >
                          {displayPhoneNumber(selectedBooking.guest_phone)}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Information Section */}
                <div className="bg-gradient-to-br from-green-50/90 to-emerald-50/90 dark:from-gray-700/90 dark:to-gray-600/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-green-200/50 dark:border-gray-600/50">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4">
                    <div className="bg-green-600/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-full flex-shrink-0">
                      <PhilippinePeso className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Payment Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* Payment Type */}
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-green-200/30 dark:border-gray-500/30">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Payment Type
                      </p>
                      <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white capitalize">
                        {selectedBooking.payment_type === "full"
                          ? "Full Payment"
                          : "Half Payment (50% Downpayment)"}
                      </p>
                    </div>

                    {/* Required Amount */}
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-green-200/30 dark:border-gray-500/30">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {selectedBooking.payment_type === "full"
                          ? "Total Amount"
                          : "Required Downpayment"}
                      </p>
                      <p className="font-bold text-lg text-green-600 dark:text-green-400">
                        {selectedBooking.payment_type === "full"
                          ? selectedBooking.total_amount.toLocaleString()
                          : (
                              selectedBooking.total_amount * 0.5
                            ).toLocaleString()}
                      </p>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-blue-200/30 dark:border-gray-500/30">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Payment Status
                      </p>
                      <div className="flex items-center gap-2">
                        {selectedBooking.status === "confirmed" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Payment Verified
                            </span>
                          </>
                        ) : selectedBooking.status === "pending" ? (
                          <>
                            <HourglassIcon className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                              Awaiting Payment
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              Payment Required
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Row for Half Payment - Remaining Balance */}
                  {selectedBooking.payment_type === "half" && (
                    <div className="mt-3 sm:mt-4">
                      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-orange-200/30 dark:border-gray-500/30">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Remaining Balance
                            </p>
                            <p className="font-semibold text-sm sm:text-base text-orange-600 dark:text-orange-400">
                              {(
                                selectedBooking.total_amount * 0.5
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              Due on check-in
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Timeline or Notes */}
                  {selectedBooking.payment_type === "half" && (
                    <div className="mt-4 p-3 bg-blue-50/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg border border-blue-200/30 dark:border-gray-500/30">
                      <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                        <strong>Payment Schedule:</strong> 50% paid as
                        downpayment, remaining 50% due upon check-in at the
                        resort.
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
                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
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
                        <PawPrint className="w-4 h-4 text-amber-500" />
                        Pet Policy
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                        {selectedBooking.brings_pet ? (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Pet-friendly
                            booking
                          </span>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> No pets for this
                            booking
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Booking Date */}
                  <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                    <h4 className="text-white font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                      Booking Timeline
                    </h4>
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-gray-300 text-xs sm:text-sm">
                        <span className="text-gray-400">Created:</span>{" "}
                        {selectedBooking.created_at
                          ? new Date(
                              selectedBooking.created_at
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                      {selectedBooking.status?.toLowerCase() === "cancelled" &&
                        selectedBooking.cancelled_by && (
                          <div className="border-t border-gray-600 pt-2 mt-2">
                            <p className="text-red-400 text-xs sm:text-sm font-medium flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Cancelled by{" "}
                              {selectedBooking.cancelled_by === "user"
                                ? "Guest"
                                : "Admin"}
                            </p>
                            {selectedBooking.cancelled_at && (
                              <p className="text-gray-400 text-xs">
                                <span className="text-gray-500">When:</span>{" "}
                                {new Date(
                                  selectedBooking.cancelled_at
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  selectedBooking.cancelled_at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </p>
                            )}
                            {selectedBooking.cancellation_reason && (
                              <p className="text-gray-400 text-xs break-words">
                                <span className="text-gray-500">Reason:</span>{" "}
                                {selectedBooking.cancellation_reason}
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
                      <h4 className="text-white font-medium mb-2 text-sm sm:text-base">
                        Why are you cancelling this booking?
                      </h4>
                      <textarea
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Please provide a reason for cancellation (required)"
                        className="w-full p-3 rounded-lg bg-gray-600 text-white placeholder-gray-400 border border-gray-500 focus:border-red-500 focus:outline-none resize-none text-sm"
                        rows={3}
                        maxLength={200}
                      />
                      <p className="text-gray-400 text-xs mt-1">
                        {cancellationReason.length}/200 characters
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                      <button
                        onClick={() => handleCancelBooking(selectedBooking.id)}
                        disabled={!cancellationReason.trim()}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition order-2 sm:order-1 ${
                          cancellationReason.trim()
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-500 text-gray-300 cursor-not-allowed"
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
                    {!canCancelBooking(selectedBooking) &&
                      selectedBooking.status?.toLowerCase() !== "cancelled" && (
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
      </div>{" "}
      {/* Close main content container */}
    </div>
  );
}

// Main export with Suspense boundary
export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <div className="text-white text-xl font-semibold">Loading...</div>
          </div>
        </div>
      }
    >
      <BookingsPageContent />
    </Suspense>
  );
}
