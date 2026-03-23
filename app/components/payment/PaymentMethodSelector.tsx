"use client";

import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Check,
  Info,
} from "lucide-react";
import type { BookingWithPayment, PaymentValidation, PaymentSummary } from "../../lib/types";

interface PaymentMethodSelectorProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  referenceNumber: string;
  setReferenceNumber: (ref: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  ocrResult: { amount?: number | null } | null;
  setIsManualAmountSet: (manual: boolean) => void;
  paymentValidation: PaymentValidation;
  remainingAmount: number;
  confirmUnusualAmount: boolean;
  setConfirmUnusualAmount: (confirm: boolean) => void;
  paymentSummary: PaymentSummary;
  booking: BookingWithPayment | null;
}

export default function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  referenceNumber,
  setReferenceNumber,
  amount,
  setAmount,
  ocrResult,
  setIsManualAmountSet,
  paymentValidation,
  remainingAmount,
  confirmUnusualAmount,
  setConfirmUnusualAmount,
  paymentSummary,
  booking,
}: PaymentMethodSelectorProps) {
  return (
    <>
      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Payment Method <span className="text-red-400">*</span>
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
          required
        >
          <option value="" className="bg-muted">
            Select Payment Method
          </option>
          <option value="gcash" className="bg-muted">
            GCash
          </option>
          <option value="maya" className="bg-muted">
            Maya/PayMaya
          </option>
        </select>
      </div>

      {/* Reference Number */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Reference/Transaction Number
          {(paymentMethod === "gcash" || paymentMethod === "maya") && (
            <span className="text-red-400">*</span>
          )}
        </label>
        <input
          type="text"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          autoComplete="off"
          placeholder={
            paymentMethod === "gcash"
              ? "Enter GCash reference number (e.g., 1234567890)"
              : paymentMethod === "maya"
              ? "Enter Maya reference number"
              : "Enter transaction reference (if available)"
          }
          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
          required={paymentMethod === "gcash" || paymentMethod === "maya"}
        />
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Amount Paid <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            // Only mark as manual if user is actually typing (not auto-population)
            if (
              e.target.value !== (ocrResult?.amount?.toString() || "")
            ) {
              setIsManualAmountSet(true);
            }
          }}
          autoComplete="off"
          min="0"
          step="0.01"
          placeholder="Upload receipt to auto-detect amount"
          className={`w-full px-3 py-2 bg-muted border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
            paymentValidation.level === "error"
              ? "border-red-500 focus:ring-red-500"
              : paymentValidation.level === "warning"
              ? "border-yellow-500 focus:ring-yellow-500"
              : "border-border focus:ring-ring focus:border-primary"
          }`}
          required
        />

        {/* Payment Validation Messages */}
        {paymentValidation.level !== "none" && (
          <div
            className={`mt-4 rounded-xl overflow-hidden ${
              paymentValidation.level === "error"
                ? "bg-red-950/40 border-2 border-red-500/60"
                : "bg-gradient-to-b from-amber-950/40 to-amber-950/20 border border-amber-500/40"
            }`}
          >
            {/* Error State */}
            {paymentValidation.level === "error" && (
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-red-500/20 flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-sm text-red-200 font-medium leading-relaxed pt-1.5">
                    {paymentValidation.message}
                  </p>
                </div>
              </div>
            )}

            {/* Warning State - Amount Mismatch */}
            {paymentValidation.level === "warning" && (
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-100">
                      Amount Mismatch
                    </h4>
                    <p className="text-xs text-amber-300/70">
                      Please verify your payment amount
                    </p>
                  </div>
                </div>

                {/* Amount comparison bar */}
                <div className="relative bg-card/60 rounded-lg p-1">
                  <div className="flex items-stretch">
                    <div className="flex-1 bg-muted/50 rounded-l-md p-3 text-center border-r border-border">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                        Required
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        ₱{remainingAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-1 bg-amber-900/40 rounded-r-md p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-amber-400 mb-0.5">
                        Entered
                      </p>
                      <p className="text-xl font-bold text-amber-300">
                        ₱{parseFloat(amount || "0").toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {/* Difference badge */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-600 rounded-full text-xs font-bold text-foreground shadow-lg">
                    −₱
                    {(
                      remainingAmount - parseFloat(amount || "0")
                    ).toLocaleString()}
                  </div>
                </div>

                {/* Spacer for badge */}
                <div className="h-1"></div>

                {/* Previous payment context */}
                {paymentSummary.totalPaid > 0 && (
                  <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-300">
                      ₱{paymentSummary.totalPaid.toLocaleString()} already verified — only ₱{remainingAmount.toLocaleString()} remaining
                    </p>
                  </div>
                )}

                {/* Quick fix button */}
                <button
                  type="button"
                  onClick={() => {
                    setAmount(remainingAmount.toString());
                    setIsManualAmountSet(true);
                  }}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 rounded-lg text-foreground font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/30"
                >
                  <Check className="w-4 h-4" />
                  Use Correct Amount: ₱{remainingAmount.toLocaleString()}
                </button>

                {/* Confirmation checkbox - more subtle */}
                <div className="pt-2 border-t border-border">
                  <label
                    htmlFor="confirm-unusual-amount"
                    className="flex items-center gap-3 cursor-pointer group py-2"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        confirmUnusualAmount
                          ? "bg-amber-500 border-amber-500"
                          : "border-border group-hover:border-amber-400"
                      }`}
                    >
                      {confirmUnusualAmount && (
                        <Check className="w-3 h-3 text-foreground" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      id="confirm-unusual-amount"
                      checked={confirmUnusualAmount}
                      onChange={(e) =>
                        setConfirmUnusualAmount(e.target.checked)
                      }
                      className="sr-only"
                    />
                    <span
                      className={`text-sm transition-colors ${
                        confirmUnusualAmount
                          ? "text-amber-200"
                          : "text-muted-foreground group-hover:text-muted-foreground"
                      }`}
                    >
                      This amount matches my receipt exactly
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Simple Payment Notice - Only show when amount field is empty */}
        {remainingAmount > 0 &&
          paymentValidation.level === "none" &&
          !amount && (
            <div className="mt-2 p-2 bg-primary/10 border border-blue-600/50 rounded">
              <p className="text-blue-200 text-xs">
                <strong>Required payment:</strong> ₱
                {remainingAmount.toLocaleString()}
                {booking?.payment_type === "half"
                  ? " (50% down payment)"
                  : " (remaining balance)"}
              </p>
            </div>
          )}

        {/* Payment Status - Clean single indicator */}
        {remainingAmount > 0 &&
          amount &&
          parseFloat(amount) > 0 &&
          paymentValidation.level === "none" &&
          (() => {
            const enteredAmount = parseFloat(amount);
            const overpayment = enteredAmount - remainingAmount;

            if (enteredAmount === remainingAmount) {
              // Exact match
              return (
                <div className="mt-3 p-2.5 rounded-lg flex items-center justify-center gap-2 bg-green-900/30 border border-green-600/40">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">
                    Amount matches perfectly
                  </span>
                </div>
              );
            } else if (enteredAmount > remainingAmount) {
              // Overpayment
              return (
                <div className="mt-3 p-2.5 rounded-lg flex items-center justify-center gap-2 bg-primary/10 border border-primary/40">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="text-primary/80 text-sm">
                    Overpayment of{" "}
                    <span className="font-semibold text-blue-200">
                      ₱{overpayment.toLocaleString()}
                    </span>{" "}
                    — that&apos;s okay!
                  </span>
                </div>
              );
            }
            return null;
          })()}
      </div>
    </>
  );
}
