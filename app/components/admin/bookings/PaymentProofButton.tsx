"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import type { Booking, PaymentProof } from "../../../lib/types";

// Smart Payment Proof Action Button
export function PaymentProofButton({
  bookingId,
  onViewProof,
  variant = "table",
  refreshKey,
  booking,
}: {
  bookingId: number;
  onViewProof: (proof: PaymentProof) => void;
  variant?: "table" | "modal";
  refreshKey?: number;
  booking?: Booking; // Add booking prop to check cancellation status
}) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        setLoading(true);

        // Small delay for database consistency on refreshes
        if (refreshKey && refreshKey > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Fetch ALL payment proofs and prioritize them correctly
        const { data, error } = await supabase
          .from("payment_proofs")
          .select("*")
          .eq("booking_id", bookingId)
          .order("uploaded_at", { ascending: false });

        if (error) throw error;

        let selectedProof = null;

        if (data && data.length > 0) {
          // Priority: pending > verified > rejected > cancelled
          const pendingProof = data.find((proof) => proof.status === "pending");
          const verifiedProof = data.find(
            (proof) => proof.status === "verified",
          );
          const rejectedProof = data.find(
            (proof) => proof.status === "rejected",
          );
          const cancelledProof = data.find(
            (proof) => proof.status === "cancelled",
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

    // Set up real-time subscription for this specific booking's payment proofs
    const subscription = supabase
      .channel(`payment_proof_button_${bookingId}_${refreshKey || 0}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          // Immediately refresh payment proof data when changes occur
          fetchPaymentProof();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [bookingId, refreshKey]);

  // ✅ CRITICAL FIX: Check if booking is cancelled and prevent review actions
  const isBookingCancelled = booking?.status === "cancelled";

  if (loading) {
    if (variant === "modal") {
      return (
        <button
          disabled
          className="w-full px-3 py-2 bg-muted text-muted-foreground rounded-md text-xs cursor-not-allowed text-center"
        >
          Loading...
        </button>
      );
    }

    return (
      <button
        disabled
        className="h-7 w-full px-2 py-1 bg-muted text-muted-foreground rounded text-xs cursor-not-allowed text-center flex items-center justify-center"
      >
        Loading...
      </button>
    );
  }

  // ✅ If booking is cancelled, show cancelled status instead of review action
  if (isBookingCancelled) {
    return (
      <button
        disabled
        className={
          variant === "modal"
            ? "w-full px-3 py-2 bg-muted-foreground text-white rounded-md text-xs cursor-not-allowed text-center"
            : "h-7 w-full px-2 py-1 bg-muted-foreground text-white rounded text-xs cursor-not-allowed text-center flex items-center justify-center"
        }
        title="Booking cancelled - no review needed"
      >
        Cancelled
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
            user_id: "",
            proof_image_url: "",
            reference_number: null,
            payment_method: "",
            amount: 0,
            status: "none",
            admin_notes: null,
            uploaded_at: "",
            verified_at: null,
          };
          onViewProof(dummyProof);
        }}
        className={
          variant === "modal"
            ? "w-full px-3 py-2 bg-muted-foreground text-white rounded-md text-xs hover:bg-muted-foreground/90 text-center"
            : "h-7 w-full px-2 py-1 bg-muted-foreground text-white rounded text-xs hover:bg-muted-foreground/90 text-center flex items-center justify-center"
        }
        title="Check for payment proof"
      >
        No Proof
      </button>
    );
  }

  const getButtonStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning hover:bg-warning/90";
      case "verified":
        return "bg-success hover:bg-success/90";
      case "rejected":
        return "bg-muted-foreground hover:bg-muted-foreground/90";
      case "cancelled":
        return "bg-muted-foreground hover:bg-muted-foreground/90";
      default:
        return "bg-chart-4 hover:bg-chart-4/90";
    }
  };

  const getButtonText = (status: string) => {
    switch (status) {
      case "pending":
        return "Review";
      case "verified":
        return "View Proof";
      case "rejected":
        return "View Proof";
      case "cancelled":
        return "Cancelled";
      default:
        return "View Proof";
    }
  };

  const buttonClasses =
    variant === "modal"
      ? `w-full px-3 py-2 text-white rounded-md text-xs transition text-center ${getButtonStyle(
          paymentProof.status,
        )}`
      : `h-7 w-full px-2 py-1 text-white rounded text-xs transition text-center flex items-center justify-center ${getButtonStyle(
          paymentProof.status,
        )}`;

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
