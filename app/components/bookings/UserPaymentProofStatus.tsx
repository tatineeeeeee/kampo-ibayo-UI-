"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "../../supabaseClient";
import { Tables } from "../../../database.types";
import { PaymentAmountInfo } from "./PaymentBreakdown";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  HourglassIcon,
  Upload,
  XCircle,
  MessageSquare,
} from "lucide-react";

// Payment proof status component for user bookings
export function UserPaymentProofStatus({ bookingId }: { bookingId: number }) {
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
          // Use most recent proof (sorted by uploaded_at DESC)
          // This ensures the latest action is always shown to the user
          selectedProof = data[0];
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

          // Force immediate refresh with debugging
          fetchPaymentProof();

          // Also force a small delay refresh as backup
          setTimeout(() => {
            fetchPaymentProof();
          }, 1000);
        }
      )
      .subscribe();

    // Broadcast channel — instant updates from API (bypasses postgres_changes)
    const broadcastChannel = supabase
      .channel(`payment-update-${bookingId}`)
      .on("broadcast", { event: "payment-status-changed" }, () => {
        fetchPaymentProof();
        setTimeout(() => fetchPaymentProof(), 500);
      })
      .subscribe();

    // Background polling as safety net (broadcast handles instant updates)
    const pollingInterval = setInterval(() => {
      fetchPaymentProof();
    }, 15000);

    return () => {
      clearInterval(pollingInterval);
      subscription.unsubscribe();
      broadcastChannel.unsubscribe();
    };
  }, [bookingId]);

  if (loading) {
    return (
      <span className="text-xs text-muted-foreground">Loading payment status...</span>
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
            "bg-gray-100 dark:bg-card border border-gray-300 dark:border-border text-gray-700 dark:text-muted-foreground",
          icon: <Ban className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />,
          title: "Payment Cancelled",
          message: "This payment proof has been cancelled",
          messageColor: "text-muted-foreground dark:text-muted-foreground",
        };
      default:
        return {
          color:
            "bg-gray-100 dark:bg-card border border-gray-300 dark:border-border text-gray-700 dark:text-muted-foreground",
          icon: (
            <AlertTriangle className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
          ),
          title: "Unknown Status",
          message: "Please contact support for assistance",
          messageColor: "text-muted-foreground dark:text-muted-foreground",
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
              <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 active:bg-primary/80 text-foreground px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transform min-h-[44px]">
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
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-primary/5 dark:to-primary/10 border border-primary/20/60 dark:border-blue-800/30 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 dark:bg-blue-900/60 rounded-xl flex items-center justify-center shadow-sm">
                          <MessageSquare className="w-5 h-5 text-primary dark:text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                              Additional Notes
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-blue-900/40 dark:text-primary/80">
                              From Admin
                            </span>
                          </div>
                          <p className="text-sm text-primary dark:text-blue-200 leading-relaxed">
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
          <div className="mt-3 bg-primary/5/90 dark:bg-blue-950/30 border border-primary/20 dark:border-blue-800/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary dark:text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-primary dark:text-blue-200 mb-1">
                  Admin Notes
                </h4>
                <p className="text-sm text-primary dark:text-primary/80 leading-relaxed">
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
