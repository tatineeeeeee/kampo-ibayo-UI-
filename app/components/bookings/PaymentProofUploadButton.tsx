"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "../../supabaseClient";
import {
  Upload,
  HourglassIcon,
  CheckCircle2,
  Ban,
} from "lucide-react";

// Component to show upload button based on payment proof status
export function PaymentProofUploadButton({ bookingId, bookingPaymentStatus }: { bookingId: number; bookingPaymentStatus?: string }) {
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
          // Use most recent proof (sorted by uploaded_at DESC)
          // This ensures the latest action is always shown to the user
          selectedStatus = data[0]?.status || null;
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

          // Force immediate refresh with debugging
          checkPaymentProof();

          // Also force a small delay refresh as backup
          setTimeout(() => {
            checkPaymentProof();
          }, 500);
        }
      )
      .subscribe();

    // Broadcast channel — instant updates from API (bypasses postgres_changes)
    const broadcastChannel = supabase
      .channel(`payment-update-btn-${bookingId}`)
      .on("broadcast", { event: "payment-status-changed" }, () => {
        checkPaymentProof();
        setTimeout(() => checkPaymentProof(), 500);
      })
      .subscribe();

    // Background polling as safety net (broadcast handles instant updates)
    const pollingInterval = setInterval(() => {
      checkPaymentProof();
    }, 15000);

    return () => {
      clearInterval(pollingInterval);
      subscription.unsubscribe();
      broadcastChannel.unsubscribe();
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="bg-muted text-muted-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 min-h-[44px]">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
        Loading
      </div>
    );
  }

  // Show upload button only if no proof exists (rejected proofs handled by UserPaymentProofStatus)
  if (!proofStatus) {
    return (
      <Link href={`/upload-payment-proof?bookingId=${bookingId}`}>
        <button className="bg-teal-600 hover:bg-teal-700 text-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1 min-h-[44px] w-full sm:w-auto touch-manipulation">
          <Upload className="w-3 h-3" />
          Upload
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
      <div className="bg-gray-500 text-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 min-h-[44px]">
        <Ban className="w-3 h-3" />
        Cancelled
      </div>
    );
  }

  // Show status for pending or verified proofs
  if (proofStatus === "pending") {
    return (
      <div className="bg-yellow-600 text-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 min-h-[44px]">
        <HourglassIcon className="w-3 h-3" />
        Pending
      </div>
    );
  }

  if (proofStatus === "verified") {
    // If there's a verified proof but booking payment is pending (balance due after reschedule)
    if (bookingPaymentStatus === "pending") {
      return (
        <Link href={`/upload-payment-proof?bookingId=${bookingId}`}>
          <button className="bg-teal-600 hover:bg-teal-700 text-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1 min-h-[44px] w-full sm:w-auto touch-manipulation">
            <Upload className="w-3 h-3" />
            Upload Balance
          </button>
        </Link>
      );
    }
    return (
      <div className="bg-green-600 text-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 min-h-[44px]">
        <CheckCircle2 className="w-3 h-3" />
        Verified
      </div>
    );
  }

  // Fallback for unknown status
  return (
    <Link href={`/upload-payment-proof?bookingId=${bookingId}`}>
      <button className="bg-teal-600 hover:bg-teal-700 text-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1 min-h-[44px] w-full sm:w-auto touch-manipulation">
        <Upload className="w-3 h-3" />
        Upload
      </button>
    </Link>
  );
}
