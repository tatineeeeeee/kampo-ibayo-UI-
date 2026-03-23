"use client";

import { Footprints } from "lucide-react";
import { formatBookingNumber } from "../../../utils/bookingNumber";

interface Payment {
  id: number;
  user: string;
  guest_name?: string;
  email: string;
  amount: number;
  date: string;
  check_in_date?: string;
  status: string;
  payment_intent_id: string | null;
  booking_status: string | null;
  payment_status: string | null;
  original_reference: string | null;
  original_method: string | null;
  original_amount: number | null;
  original_status: string | null;
  balance_reference: string | null;
  balance_method: string | null;
  balance_amount: number | null;
  balance_status: string | null;
  booking_id: number;
  verified_at: string | null;
  admin_notes: string | null;
  has_payment_proof: boolean;
  is_walk_in?: boolean;
  payment_type: string | null;
  total_amount: number | null;
  payment_proof_id: number | null;
  total_proofs: number;
  reference_number?: string;
  payment_method?: string;
  all_payment_proofs: Array<{
    id: number;
    amount: number;
    reference_number: string | null;
    payment_method: string;
    status: string;
    uploaded_at: string;
    verified_at: string | null;
    admin_notes: string | null;
    sequence: number;
  }>;
}

interface PaymentTableRowProps {
  payment: Payment;
  payments: Payment[];
  variant: "mobile" | "desktop";
  canMarkBalanceAsPaid: (payment: Payment) => boolean;
  onMarkBalancePaid: (payment: Payment) => void;
}

export default function PaymentTableRow({
  payment,
  payments,
  variant,
  canMarkBalanceAsPaid,
  onMarkBalancePaid,
}: PaymentTableRowProps) {
  if (variant === "mobile") {
    return (
      <div
        className="p-4 hover:bg-muted"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-medium text-foreground text-sm">
              {payment.guest_name || payment.user}
            </p>
            <p className="text-xs text-muted-foreground">{payment.email}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">
                {formatBookingNumber(payment.booking_id)}
              </p>
              {payment.is_walk_in && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/10 text-warning">
                  <Footprints className="w-2.5 h-2.5" />
                  Walk-in
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-success">
              ₱{(payment.amount || 0).toLocaleString()}
            </span>
            {payment.total_amount && payment.amount < payment.total_amount && payment.amount > 0 && (
              <div className="text-[10px]">
                <span className="text-warning font-medium">₱{(payment.total_amount - payment.amount).toLocaleString()}</span>
                <span className="text-muted-foreground"> due</span>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                payment.payment_type === "half"
                  ? "bg-info/10 text-primary"
                  : "bg-success/10 text-success"
              }`}
            >
              {payment.payment_type === "half" ? "50% Down" : "Full"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                payment.booking_status?.toLowerCase() === "cancelled"
                  ? "bg-destructive/10 text-destructive"
                  : payment.original_status === "verified"
                    ? "bg-success/10 text-success"
                    : payment.original_status === "rejected"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-foreground"
              }`}
            >
              {payment.booking_status?.toLowerCase() === "cancelled"
                ? "cancelled"
                : payment.original_status || "pending"}
            </span>
          </div>
        </div>
        {payment.original_reference && (
          <p className="text-xs text-muted-foreground mb-1">
            <span className="text-muted-foreground">Ref:</span>{" "}
            <span className="font-mono">
              {payment.original_reference}
            </span>
          </p>
        )}
        {canMarkBalanceAsPaid(payment) && (
          <button
            onClick={() => onMarkBalancePaid(payment)}
            className="w-full mt-2 px-3 py-2 border border-success/20 text-success bg-success/10 hover:bg-success/10 rounded-md text-xs font-medium"
          >
            Mark Balance Paid
          </button>
        )}
      </div>
    );
  }

  // Desktop table row
  return (
    <tr
      className="hover:bg-muted transition-colors"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-foreground">
            {payment.guest_name || payment.user}
          </div>
          <div className="text-xs text-muted-foreground">
            {payment.email}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {formatBookingNumber(payment.booking_id)}
            </span>
            {payment.is_walk_in && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/10 text-warning">
                <Footprints className="w-2.5 h-2.5" />
                Walk-in
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-lg font-bold text-success">
          ₱{(payment.amount || 0).toLocaleString()}
        </span>
        {payment.total_amount && payment.amount < payment.total_amount && payment.amount > 0 && (
          <div className="text-xs mt-0.5">
            <span className="text-warning font-medium">₱{(payment.total_amount - payment.amount).toLocaleString()}</span>
            <span className="text-muted-foreground"> due</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          {(() => {
            // Check if this is a balance payment first
            if (
              payment.reference_number?.startsWith("ARRIVAL-")
            ) {
              return (
                <div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                    Balance Payment (50%)
                  </span>
                  <div className="text-xs text-muted-foreground mt-1">
                    Cash on arrival
                  </div>
                </div>
              );
            }

            // Smart payment type detection for original payments
            const paymentType = payment.payment_type;
            const amount = payment.amount;
            const totalAmount = payment.total_amount;

            // If payment_type is explicitly set, use it
            if (paymentType === "half") {
              return (
                <div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-primary">
                    50% Down Payment
                  </span>
                  {totalAmount && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Total: ₱{totalAmount.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            } else if (paymentType === "full") {
              const paidAmt = amount || 0;
              const bookingTotal = totalAmount || 0;
              if (bookingTotal > 0 && paidAmt < bookingTotal && paidAmt > 0) {
                return (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                    Rescheduled
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                  Full Payment
                </span>
              );
            }

            // Try to infer from amounts if payment_type is missing
            if (totalAmount && amount) {
              const percentage = (amount / totalAmount) * 100;
              if (percentage >= 45 && percentage <= 55) {
                return (
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-primary">
                      50% Down Payment (inferred)
                    </span>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total: ₱{totalAmount.toLocaleString()}
                    </div>
                  </div>
                );
              } else if (percentage >= 95) {
                return (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                    Full Payment (100%)
                  </span>
                );
              }
            }

            // Fallback for unknown cases
            return (
              <div>
                <span className="text-muted-foreground italic text-xs">
                  Type not specified
                </span>
                {totalAmount && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Total: ₱{totalAmount.toLocaleString()}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          {payment.original_reference ? (
            <div className="font-mono text-foreground bg-primary/10 px-2 py-1 rounded text-xs">
              {payment.original_reference}
            </div>
          ) : (
            <span className="text-muted-foreground italic text-xs">
              No reference provided
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          {payment.balance_reference ? (
            <div className="font-mono text-warning bg-warning/10 px-2 py-1 rounded text-xs">
              {payment.balance_reference}
            </div>
          ) : (
            <span className="text-muted-foreground italic text-xs">
              Not specified
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            payment.booking_status?.toLowerCase() === "cancelled"
              ? "bg-destructive/10 text-destructive"
              : payment.is_walk_in && (payment.booking_status === "confirmed" || payment.booking_status === "completed")
                ? "bg-success/10 text-success"
                : payment.original_status === "verified" &&
                    (payment.payment_type === "full" ||
                      payment.balance_status === "verified")
                  ? "bg-success/10 text-success"
                  : payment.original_status === "verified" &&
                      payment.payment_type === "half"
                    ? "bg-warning/10 text-warning"
                    : payment.original_status === "rejected"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-foreground"
          }`}
        >
          {payment.booking_status?.toLowerCase() === "cancelled"
            ? "cancelled"
            : payment.is_walk_in && (payment.booking_status === "confirmed" || payment.booking_status === "completed")
              ? "paid (cash)"
              : payment.payment_type === "full" &&
                  payment.original_status === "verified"
                ? "paid"
                : payment.payment_type === "half" &&
                    payment.original_status === "verified" &&
                    payment.balance_status === "verified"
                  ? "paid"
                  : payment.payment_type === "half" &&
                      payment.original_status === "verified"
                    ? "partially_paid"
                    : payment.original_status || "pending"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {(() => {
          // Check if booking is cancelled first
          if (
            payment.booking_status?.toLowerCase() ===
            "cancelled"
          ) {
            return (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                BOOKING CANCELLED
              </span>
            );
          }

          const amount = payment.amount;
          const totalAmount = payment.total_amount;
          const isOverpaid =
            totalAmount && amount > totalAmount;

          // Check if this is a balance payment
          if (
            payment.reference_number?.startsWith("ARRIVAL-")
          ) {
            return (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                  BALANCE PAID
                </span>
                <span className="text-xs text-muted-foreground">
                  Cash on arrival
                </span>
              </div>
            );
          }

          if (canMarkBalanceAsPaid(payment)) {
            return (
              <button
                onClick={() => onMarkBalancePaid(payment)}
                className="inline-flex items-center px-3 py-1 border border-success/20 text-success bg-success/10 hover:bg-success/10 rounded-md text-xs font-medium transition-colors shadow-sm"
                title="Mark remaining 50% balance as paid on arrival"
              >
                Mark Balance Paid
              </button>
            );
          }

          // Check if balance payment already exists for this booking
          const hasBalancePayment = payments.some(
            (p) =>
              p.booking_id === payment.booking_id &&
              p.reference_number?.startsWith("ARRIVAL-"),
          );

          if (
            payment.payment_type === "half" &&
            hasBalancePayment
          ) {
            return (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                  FULLY PAID
                </span>
                <span className="text-xs text-muted-foreground">
                  50% + Balance
                </span>
              </div>
            );
          }

          if (payment.payment_type === "half" && isOverpaid) {
            return (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                  OVERPAID
                </span>
              </div>
            );
          }

          if (payment.payment_type === "half") {
            const balanceAmount = totalAmount
              ? totalAmount - amount
              : 0;
            if (balanceAmount <= 0) {
              return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                  PAID IN FULL
                </span>
              );
            } else {
              return (
                <span className="text-xs text-muted-foreground">
                  Balance: ₱{balanceAmount.toLocaleString()}
                </span>
              );
            }
          }

          return (
            <span className="text-xs text-muted-foreground">-</span>
          );
        })()}
      </td>
    </tr>
  );
}
