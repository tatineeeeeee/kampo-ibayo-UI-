"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

// Shows paid/remaining in admin booking table — only when partially paid
export function AdminPaymentBreakdown({ bookingId, totalAmount, paymentStatus, paymentType }: { bookingId: number; totalAmount: number; paymentStatus: string; paymentType?: string }) {
  const [paidAmount, setPaidAmount] = useState<number | null>(null);

  useEffect(() => {
    // For full payment bookings that are paid/verified, assume fully paid
    if ((paymentStatus === "paid" || paymentStatus === "verified") && paymentType !== "half") {
      setPaidAmount(totalAmount);
      return;
    }
    // Always fetch actual proofs for half payment or non-paid bookings
    const fetchPaid = async () => {
      const { data } = await supabase
        .from("payment_proofs")
        .select("amount")
        .eq("booking_id", bookingId)
        .eq("status", "verified");
      if (data) {
        setPaidAmount(data.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0));
      }
    };
    fetchPaid();
  }, [bookingId, totalAmount, paymentStatus, paymentType]);

  if (paidAmount === null || paidAmount === 0 || paidAmount >= totalAmount) return null;

  const remaining = totalAmount - paidAmount;
  return (
    <div className="text-[11px] mt-0.5">
      <span className="text-success font-medium">₱{paidAmount.toLocaleString()}</span>
      <span className="text-muted-foreground"> paid · </span>
      <span className="text-warning font-medium">₱{remaining.toLocaleString()}</span>
      <span className="text-muted-foreground"> due</span>
    </div>
  );
}
