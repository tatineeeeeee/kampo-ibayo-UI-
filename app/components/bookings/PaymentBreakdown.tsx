"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

// Component to show amount with paid/remaining on booking card
export function PaymentBreakdownAmount({ bookingId, totalAmount, paymentStatus, paymentType }: { bookingId: number; totalAmount: number; paymentStatus?: string; paymentType?: string }) {
  const [paidAmount, setPaidAmount] = useState<number | null>(null);

  useEffect(() => {
    const fetchPaid = async () => {
      const { data } = await supabase
        .from("payment_proofs")
        .select("amount")
        .eq("booking_id", bookingId)
        .eq("status", "verified");
      if (data) {
        const total = data.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
        setPaidAmount(total);
      }
    };
    fetchPaid();
  }, [bookingId, paymentStatus]);

  // Still loading or fully paid — show total
  if (paidAmount === null || paidAmount >= totalAmount) {
    return (
      <p className="font-semibold text-green-400 text-xs">
        ₱{(totalAmount / 1000).toFixed(1)}k
      </p>
    );
  }

  // No payment yet
  if (paidAmount === 0) {
    return (
      <p className="font-semibold text-yellow-400 text-xs">
        ₱{(totalAmount / 1000).toFixed(1)}k
      </p>
    );
  }

  // Partial payment — show breakdown
  const remaining = totalAmount - paidAmount;
  return (
    <div>
      <p className="font-bold text-amber-400 text-sm">
        ₱{(totalAmount / 1000).toFixed(1)}k
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="text-green-400">₱{(paidAmount / 1000).toFixed(1)}k</span> paid · <span className="text-amber-400">₱{(remaining / 1000).toFixed(1)}k</span> {paymentType === "half" ? "due at check-in" : "due"}
      </p>
    </div>
  );
}

// Component to show paid/remaining detail in booking details modal
export function PaymentBreakdownDetail({ bookingId, totalAmount }: { bookingId: number; totalAmount: number }) {
  const [paidAmount, setPaidAmount] = useState<number | null>(null);

  useEffect(() => {
    const fetchPaid = async () => {
      const { data } = await supabase
        .from("payment_proofs")
        .select("amount")
        .eq("booking_id", bookingId)
        .eq("status", "verified");
      if (data) {
        const total = data.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
        setPaidAmount(total);
      }
    };
    fetchPaid();
  }, [bookingId]);

  if (paidAmount === null) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const remaining = Math.max(0, totalAmount - paidAmount);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground dark:text-muted-foreground">Paid</span>
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">₱{paidAmount.toLocaleString()}</span>
      </div>
      {remaining > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground dark:text-muted-foreground">Remaining</span>
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">₱{remaining.toLocaleString()}</span>
        </div>
      )}
      {remaining === 0 && paidAmount > 0 && (
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Fully Paid</p>
      )}
    </div>
  );
}

// Component to show dynamic payment amount info based on booking payment type
export function PaymentAmountInfo({ bookingId }: { bookingId: number }) {
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
