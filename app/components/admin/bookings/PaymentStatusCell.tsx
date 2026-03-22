"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import type { Booking, PaymentProof } from "../../../lib/types";

// Payment Status Cell - Shows overall booking payment status
export function PaymentStatusCell({
  booking,
  refreshKey,
}: {
  booking: Booking;
  refreshKey?: number;
}) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        setLoading(true);

        // Fetch ALL payment proofs and prioritize them correctly
        const { data, error } = await supabase
          .from("payment_proofs")
          .select("*")
          .eq("booking_id", booking.id)
          .order("uploaded_at", { ascending: false });

        if (error) {
          console.error(
            `❌ PaymentStatusCell: Error fetching payment proof for booking ${booking.id}:`,
            error,
          );
          throw error;
        }

        let selectedProof = null;

        if (data && data.length > 0) {
          // Only pending proofs need priority (admin action needed NOW)
          // Otherwise use the most recent proof (already sorted by uploaded_at DESC)
          const pendingProof = data.find((proof) => proof.status === "pending");
          selectedProof = pendingProof || data[0];
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

    // Enhanced real-time subscription with multiple event triggers
    const subscription = supabase
      .channel(`payment_status_realtime_${booking.id}_${refreshKey || 0}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
          filter: `booking_id=eq.${booking.id}`,
        },
        (payload) => {
          // Force immediate refresh on any payment proof change
          setTimeout(() => fetchPaymentProof(), 10); // Very short delay for database consistency
        },
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
    // ✅ CRITICAL FIX: If booking is cancelled, always show cancelled regardless of payment proof status
    if (booking.status === "cancelled") {
      return {
        text: "Cancelled",
        badge: "bg-gray-500 text-white",
      };
    }

    // If there's a payment proof, use its status (only for non-cancelled bookings)
    if (paymentProof) {
      switch (paymentProof.status) {
        case "pending":
          return {
            text: "Under Review",
            badge: "bg-orange-500 text-white",
          };
        case "verified":
          return {
            text: "Verified",
            badge: "bg-green-500 text-white",
          };
        case "rejected":
          return {
            text: "Rejected",
            badge: "bg-red-500 text-white",
          };
        case "cancelled":
          return {
            text: "Cancelled",
            badge: "bg-gray-500 text-white",
          };
        default:
          return {
            text: "Unknown Status",
            badge: "bg-gray-400 text-white",
          };
      }
    }

    // If no payment proof exists, check booking payment_status
    if (booking.payment_status === "payment_review") {
      return {
        text: "Under Review",
        badge: "bg-orange-500 text-white",
      };
    } else if (booking.payment_status === "rejected") {
      return {
        text: "Rejected",
        badge: "bg-red-500 text-white",
      };
    } else if (booking.payment_status === "paid") {
      return {
        text: "Verified",
        badge: "bg-green-500 text-white",
      };
    } else {
      return {
        text: "Awaiting Payment",
        badge: "bg-gray-400 text-white",
      };
    }
  };

  const statusInfo = getPaymentStatusDisplay();

  return (
    <div className="flex items-center justify-center">
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusInfo.badge}`}
      >
        {statusInfo.text}
      </span>
    </div>
  );
}
