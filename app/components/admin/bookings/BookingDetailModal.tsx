"use client";

import { CalendarDays, Footprints } from "lucide-react";
import AvailabilityCalendar from "../../../components/AvailabilityCalendar";
import { displayPhoneNumber } from "../../../utils/phoneUtils";
import { formatBookingNumber } from "../../../utils/bookingNumber";
import { SmartConfirmButton } from "./SmartConfirmButton";
import { PaymentProofButton } from "./PaymentProofButton";
import { supabase } from "../../../supabaseClient";
import type { Booking, PaymentProof } from "../../../lib/types";

interface BookingDetailModalProps {
  selectedBooking: Booking;
  showCancelModal: boolean;
  showRescheduleModal: boolean;
  showConfirmCancel: boolean;
  shouldRefund: boolean;
  isProcessing: boolean;
  adminCancellationReason: string;
  rescheduleCheckIn: string;
  rescheduleCheckOut: string;
  rescheduleReason: string;
  rescheduleLoading: boolean;
  refreshTrigger: number;
  paymentSummary: {
    totalAmount: number;
    totalPaid: number;
    pendingAmount: number;
    remainingBalance: number;
  } | null;
  onClose: () => void;
  onSetShowCancelModal: (show: boolean) => void;
  onSetShowRescheduleModal: (show: boolean) => void;
  onSetShowConfirmCancel: (show: boolean) => void;
  onSetShouldRefund: (refund: boolean) => void;
  onSetAdminCancellationReason: (reason: string) => void;
  onSetRescheduleCheckIn: (date: string) => void;
  onSetRescheduleCheckOut: (date: string) => void;
  onSetRescheduleReason: (reason: string) => void;
  onUpdateBookingStatus: (bookingId: number, status: string) => void;
  onAdminCancelBooking: (bookingId: number, shouldRefund: boolean) => void;
  onAdminReschedule: () => void;
  onViewPaymentProof: (proof: PaymentProof) => void;
  fetchPaymentHistory: (bookingId: number) => Promise<void>;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

export function BookingDetailModal({
  selectedBooking,
  showCancelModal,
  showRescheduleModal,
  showConfirmCancel,
  shouldRefund,
  isProcessing,
  adminCancellationReason,
  rescheduleCheckIn,
  rescheduleCheckOut,
  rescheduleReason,
  rescheduleLoading,
  refreshTrigger,
  paymentSummary,
  onClose,
  onSetShowCancelModal,
  onSetShowRescheduleModal,
  onSetShowConfirmCancel,
  onSetShouldRefund,
  onSetAdminCancellationReason,
  onSetRescheduleCheckIn,
  onSetRescheduleCheckOut,
  onSetRescheduleReason,
  onUpdateBookingStatus,
  onAdminCancelBooking,
  onAdminReschedule,
  onViewPaymentProof,
  fetchPaymentHistory,
  formatDate,
  getStatusColor,
}: BookingDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Modal Header - Clean Light */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-t-lg border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                Booking Management
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                Complete reservation details •{" "}
                {selectedBooking
                  ? formatBookingNumber(selectedBooking.id)
                  : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-white hover:shadow-md transition"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Booking Header Card - Clean Light Style */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                  {formatBookingNumber(selectedBooking.id)}
                </h3>
                <p className="text-gray-600 text-sm">
                  {selectedBooking.guest_name}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Booked on{" "}
                  {selectedBooking.created_at
                    ? formatDate(selectedBooking.created_at)
                    : "N/A"}{" "}
                  • ID: {selectedBooking.id}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-md text-xs font-semibold text-white ${getStatusColor(
                    selectedBooking.status || "pending",
                  )}`}
                >
                  {(selectedBooking.status || "pending")
                    .charAt(0)
                    .toUpperCase() +
                    (selectedBooking.status || "pending").slice(1)}
                </span>
              </div>
            </div>

            {/* Quick Info Grid - Simple Clean Layout */}
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 font-medium mb-1">
                  Check-in
                </p>
                <p className="font-semibold text-gray-800">
                  {formatDate(selectedBooking.check_in_date)}
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-600 font-medium mb-1">
                  Check-out
                </p>
                <p className="font-semibold text-gray-800">
                  {formatDate(selectedBooking.check_out_date)}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  Guests
                </p>
                <p className="font-semibold text-gray-800">
                  {selectedBooking.number_of_guests} people
                </p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-600 font-medium mb-1">
                  Total Booking Value
                </p>
                <p className="font-semibold text-green-600">
                  ₱{selectedBooking.total_amount.toLocaleString()}
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  {selectedBooking.payment_type === "full" ? (
                    <div className="flex justify-between">
                      <span>Full Payment Required:</span>
                      <span className="font-medium text-blue-700">
                        ₱{selectedBooking.total_amount.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Down Payment:</span>
                        <span className="font-medium text-green-700">
                          ₱
                          {Math.round(
                            selectedBooking.total_amount * 0.5,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pay on Arrival:</span>
                        <span className="font-medium text-orange-700">
                          ₱
                          {Math.round(
                            selectedBooking.total_amount * 0.5,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Status Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">
                Payment Information
              </h4>

              {/* Payment Progress Bar */}
              {(() => {
                const requiredDownpayment =
                  selectedBooking.payment_type === "full"
                    ? selectedBooking.total_amount
                    : Math.round(selectedBooking.total_amount * 0.5);
                const amountPaid = paymentSummary?.totalPaid || 0;
                const progressPercent = Math.min(
                  100,
                  Math.round((amountPaid / requiredDownpayment) * 100),
                );
                const isComplete = amountPaid >= requiredDownpayment;

                return (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">
                        Payment Progress
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isComplete ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isComplete ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })()}

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column - Online Payment */}
                <div className="space-y-3">
                  <div className="pb-2 border-b border-gray-200">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Online Payment
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block">
                      Required
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      ₱
                      {selectedBooking.payment_type === "full"
                        ? selectedBooking.total_amount.toLocaleString()
                        : Math.round(
                            selectedBooking.total_amount * 0.5,
                          ).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block">
                      Paid
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      ₱
                      {paymentSummary
                        ? paymentSummary.totalPaid.toLocaleString()
                        : "0"}
                    </span>
                  </div>

                  {(() => {
                    const requiredDownpayment =
                      selectedBooking.payment_type === "full"
                        ? selectedBooking.total_amount
                        : Math.round(selectedBooking.total_amount * 0.5);
                    const amountPaid = paymentSummary?.totalPaid || 0;
                    const stillOwedOnline = Math.max(
                      0,
                      requiredDownpayment - amountPaid,
                    );

                    return stillOwedOnline > 0 ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <span className="text-xs text-red-500 block">
                          Remaining Balance
                        </span>
                        <span className="text-base font-bold text-red-600">
                          ₱{stillOwedOnline.toLocaleString()}
                        </span>
                        {(selectedBooking.reschedule_count || 0) > 0 && (
                          <p className="text-[10px] text-red-500 mt-0.5">
                            Balance due after reschedule
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-block">
                        <span className="text-xs font-medium text-green-700">
                          Fully Paid
                        </span>
                      </div>
                    );
                  })()}

                  {paymentSummary &&
                    (paymentSummary.pendingAmount ?? 0) > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Pending Review
                        </span>
                        <span className="text-sm font-medium text-yellow-600">
                          ₱
                          {(
                            paymentSummary.pendingAmount ?? 0
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                </div>

                {/* Right Column - On-site Payment */}
                <div className="space-y-3">
                  <div className="pb-2 border-b border-gray-200">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      On-site Payment
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block">
                      Due at Check-in
                    </span>
                    <span className="text-sm font-semibold text-orange-600">
                      ₱
                      {selectedBooking.payment_type === "full"
                        ? "0"
                        : Math.round(
                            selectedBooking.total_amount * 0.5,
                          ).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block">
                      Payment Type
                    </span>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {selectedBooking.payment_type === "full"
                        ? "Full Payment"
                        : "50% Downpayment"}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block">
                      Status
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        selectedBooking.payment_status === "paid" ||
                        selectedBooking.payment_status === "verified"
                          ? "bg-green-100 text-green-800"
                          : selectedBooking.payment_status === "payment_review"
                            ? "bg-blue-100 text-blue-800"
                            : selectedBooking.payment_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : selectedBooking.payment_status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedBooking.payment_status === "paid" || selectedBooking.payment_status === "verified"
                        ? "Paid"
                        : selectedBooking.payment_status === "payment_review"
                          ? "Under Review"
                          : selectedBooking.payment_status === "pending"
                            ? "Pending Payment"
                            : selectedBooking.payment_status === "rejected"
                              ? "Rejected"
                              : selectedBooking.payment_status || "Pending Payment"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Summary Bar */}
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Total Booking Value
                </span>
                <span className="text-lg font-bold text-gray-900">
                  ₱{selectedBooking.total_amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Contact Information
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Guest Name</p>
                  <p className="text-gray-800 font-medium">
                    {selectedBooking.guest_name}
                  </p>
                </div>
                {selectedBooking.guest_email && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <a
                      href={`mailto:${selectedBooking.guest_email}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {selectedBooking.guest_email}
                    </a>
                  </div>
                )}
                {selectedBooking.guest_phone && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <a
                      href={`tel:${selectedBooking.guest_phone}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {displayPhoneNumber(selectedBooking.guest_phone)}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Reschedule Count */}
            {(selectedBooking.reschedule_count || 0) > 0 && (
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                  Rescheduled {selectedBooking.reschedule_count}x
                </span>
              </div>
            )}

            {/* Special Requests */}
            {selectedBooking.special_requests && (() => {
              const cleanedText = selectedBooking.special_requests
                .replace(/^\[WALK-IN\]\s*/, '')
                .replace(/\[USER-RESCHEDULED\][^\n]*/g, '')
                .replace(/\[ADMIN-RESCHEDULED\][^\n]*/g, '')
                .trim();
              const isWalkIn = selectedBooking.special_requests.startsWith("[WALK-IN]");
              return (cleanedText || isWalkIn) ? (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-3">
                  <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                    Special Requests
                    {isWalkIn && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full inline-flex items-center gap-0.5">
                        <Footprints className="w-3 h-3" /> Walk-in Booking
                      </span>
                    )}
                  </h4>
                  {cleanedText && (
                    <p className="text-gray-700 text-sm">{cleanedText}</p>
                  )}
                </div>
              ) : null;
            })()}

            {/* Pet Information - Remove since field doesn't exist */}

            {/* Cancellation Information - Remove since fields don't exist */}
          </div>
        </div>

        {/* Modal Footer - Unified Action Buttons */}
        <div className="bg-gray-50 p-6 rounded-b-lg border-t border-gray-200">
          {/* ACTIVE BOOKINGS (Pending or Confirmed) - Show actions */}
          {(selectedBooking.status === "pending" ||
            selectedBooking.status === "confirmed") &&
          !showCancelModal &&
          !showRescheduleModal ? (
            <div className="space-y-4">
              {/* Status Banner - Adapts based on booking status */}
              {selectedBooking.status === "confirmed" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-lg">●</span>
                    <div>
                      <span className="text-green-800 font-semibold text-sm">
                        Booking Confirmed
                      </span>
                      <span className="text-green-600 text-xs ml-2">
                        Check-in:{" "}
                        {new Date(
                          selectedBooking.check_in_date,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Section */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedBooking.status === "confirmed"
                          ? "bg-green-400"
                          : "bg-orange-400"
                      }`}
                    ></span>
                    {selectedBooking.status === "confirmed"
                      ? "Payment Verified"
                      : "Payment Verification"}
                  </h4>
                  <PaymentProofButton
                    key={`modal-proof-${
                      selectedBooking.id
                    }-${refreshTrigger}-${
                      selectedBooking.payment_status || "none"
                    }`}
                    bookingId={selectedBooking.id}
                    booking={selectedBooking}
                    variant="modal"
                    onViewProof={async (proof) => {
                      onViewPaymentProof(proof);
                      if (proof.id > 0) {
                        await fetchPaymentHistory(selectedBooking.id);
                        try {
                          const { data: allProofs } = await supabase
                            .from("payment_proofs")
                            .select("*")
                            .eq("booking_id", selectedBooking.id)
                            .order("uploaded_at", { ascending: false });

                          if (allProofs && allProofs.length > 0) {
                            const pendingProof = allProofs.find(
                              (p) => p.status === "pending",
                            );
                            const verifiedProof = allProofs.find(
                              (p) => p.status === "verified",
                            );
                            const rejectedProof = allProofs.find(
                              (p) => p.status === "rejected",
                            );
                            const cancelledProof = allProofs.find(
                              (p) => p.status === "cancelled",
                            );
                            const prioritizedProof =
                              pendingProof ||
                              verifiedProof ||
                              rejectedProof ||
                              cancelledProof ||
                              allProofs[0];
                            onViewPaymentProof(prioritizedProof);
                          }
                        } catch (error) {
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
                    Booking Actions
                  </h4>
                  <div className="flex flex-col gap-2">
                    {/* Only show Confirm button for pending bookings */}
                    {selectedBooking.status === "pending" && (
                      <SmartConfirmButton
                        booking={selectedBooking}
                        variant="modal"
                        refreshKey={refreshTrigger}
                        onConfirm={(bookingId) => {
                          onUpdateBookingStatus(bookingId, "confirmed");
                          onClose();
                        }}
                      />
                    )}
                    {/* Reschedule button */}
                    <button
                      onClick={() => {
                        onSetShowRescheduleModal(true);
                        onSetRescheduleCheckIn("");
                        onSetRescheduleCheckOut("");
                        onSetRescheduleReason("");
                      }}
                      className="w-full px-4 py-2 rounded-md text-sm font-semibold transition flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    >
                      <CalendarDays className="w-4 h-4" />
                      Reschedule Booking
                    </button>
                    {/* Cancel button for all active bookings */}
                    <button
                      onClick={() => onSetShowCancelModal(true)}
                      className={`w-full px-4 py-2 rounded-md text-sm font-semibold transition flex items-center justify-center gap-2 ${
                        selectedBooking.status === "confirmed"
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-gray-100 text-red-600 hover:bg-red-50 border border-red-200"
                      }`}
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-center pt-3 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-8 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : showRescheduleModal ? (
            <div className="space-y-4">
              {/* Reschedule Header */}
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Reschedule Booking
                </h3>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <strong>Current dates:</strong>{" "}
                {new Date(selectedBooking.check_in_date).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" },
                )}
                {" → "}
                {new Date(
                  selectedBooking.check_out_date,
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              {/* Calendar */}
              <div>
                <AvailabilityCalendar
                  selectedCheckIn={rescheduleCheckIn}
                  selectedCheckOut={rescheduleCheckOut}
                  onDateSelect={(checkIn, checkOut) => {
                    onSetRescheduleCheckIn(checkIn);
                    onSetRescheduleCheckOut(checkOut);
                  }}
                  excludeBookingId={selectedBooking.id}
                  minDate={new Date().toISOString().split("T")[0]}
                  isRescheduling={true}
                  theme="light"
                />
              </div>

              {rescheduleCheckIn && rescheduleCheckOut && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  <strong>New dates:</strong>{" "}
                  {new Date(
                    rescheduleCheckIn + "T00:00:00",
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" → "}
                  {new Date(
                    rescheduleCheckOut + "T00:00:00",
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}

              {/* Reason (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => onSetRescheduleReason(e.target.value)}
                  placeholder="e.g. Guest requested date change"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onAdminReschedule}
                  disabled={
                    rescheduleLoading ||
                    !rescheduleCheckIn ||
                    !rescheduleCheckOut
                  }
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition shadow-sm text-white ${
                    rescheduleLoading ||
                    !rescheduleCheckIn ||
                    !rescheduleCheckOut
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {rescheduleLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    "Confirm Reschedule"
                  )}
                </button>
                <button
                  onClick={() => onSetShowRescheduleModal(false)}
                  disabled={rescheduleLoading}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
                >
                  ← Back
                </button>
              </div>
            </div>
          ) : showCancelModal ? (
            <div className="space-y-4">
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div
                  className={`flex items-center gap-2 ${
                    !showConfirmCancel ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      !showConfirmCancel
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    1
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    Reason
                  </span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200"></div>
                <div
                  className={`flex items-center gap-2 ${
                    showConfirmCancel ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      showConfirmCancel
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    Confirm
                  </span>
                </div>
              </div>

              {/* Warning Banner for Confirmed Bookings */}
              {selectedBooking.status === "confirmed" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-red-800 font-semibold text-sm">
                    Cancelling a Confirmed Booking
                  </h4>
                  <p className="text-red-600 text-xs mt-1">
                    Payment verified • User will be notified via email and
                    SMS • Refund may be required
                  </p>
                </div>
              )}

              {!showConfirmCancel ? (
                /* STEP 1: Enter Reason */
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      Why are you cancelling this booking?
                    </label>
                    <textarea
                      value={adminCancellationReason}
                      onChange={(e) =>
                        onSetAdminCancellationReason(e.target.value)
                      }
                      placeholder={
                        selectedBooking.status === "confirmed"
                          ? "e.g., User requested cancellation, Emergency situation, Overbooking..."
                          : "e.g., User no-show, Payment issue, User request..."
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none text-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition"
                      rows={3}
                      maxLength={200}
                      disabled={isProcessing}
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-gray-400 text-xs">
                        This reason will be shown to the user
                      </p>
                      <p className="text-gray-400 text-xs">
                        {adminCancellationReason.length}/200
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => onSetShowConfirmCancel(true)}
                      disabled={
                        !adminCancellationReason.trim() || isProcessing
                      }
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition ${
                        adminCancellationReason.trim() && !isProcessing
                          ? "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Continue to Confirmation →
                    </button>
                    <button
                      onClick={() => {
                        onSetShowCancelModal(false);
                        onSetAdminCancellationReason("");
                        onSetShowConfirmCancel(false);
                      }}
                      disabled={isProcessing}
                      className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                    >
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 2: Confirm & Choose Refund */
                <div className="space-y-4">
                  {/* Cancellation Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-gray-800 font-semibold text-sm mb-3">
                      Cancellation Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Guest</p>
                        <p className="text-gray-800 font-medium">
                          {selectedBooking.guest_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Booking</p>
                        <p className="text-gray-800 font-medium">
                          KB-
                          {selectedBooking.id.toString().padStart(4, "0")}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs">Reason</p>
                        <p className="text-gray-800 text-sm italic">
                          &ldquo;{adminCancellationReason}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Refund Options - Enhanced UI */}
                  {(selectedBooking.status === "confirmed" ||
                    selectedBooking.payment_status === "paid" ||
                    selectedBooking.payment_intent_id) && (
                    <div className="space-y-3">
                      <h4 className="text-gray-800 font-semibold text-sm">
                        Refund Decision
                      </h4>

                      {/* No Refund Option */}
                      <label
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                          !shouldRefund
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="refundOption"
                          checked={!shouldRefund}
                          onChange={() => onSetShouldRefund(false)}
                          className="mt-1 text-red-600 focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              !shouldRefund
                                ? "text-red-700"
                                : "text-gray-700"
                            }`}
                          >
                            Cancel without refund
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Guest will not receive any refund. Use for
                            policy violations or no-shows.
                          </p>
                        </div>
                        <span className="text-gray-400 font-semibold text-sm">
                          ₱0
                        </span>
                      </label>

                      {/* With Refund Option */}
                      <label
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                          shouldRefund
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="refundOption"
                          checked={shouldRefund}
                          onChange={() => onSetShouldRefund(true)}
                          className="mt-1 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              shouldRefund
                                ? "text-green-700"
                                : "text-gray-700"
                            }`}
                          >
                            Cancel with refund
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Refund the actual amount paid by the guest.
                          </p>
                        </div>
                        <span className="text-green-600 font-bold text-sm">
                          ₱
                          {(
                            paymentSummary?.totalPaid || 0
                          ).toLocaleString()}
                        </span>
                      </label>

                      {/* Refund Note */}
                      {shouldRefund &&
                        (paymentSummary?.totalPaid || 0) > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-blue-700 text-xs">
                              <strong>Manual Processing Required:</strong>{" "}
                              Process the refund via GCash or Maya, then
                              coordinate with the guest. The refund status
                              will be marked as &quot;pending&quot; and
                              shown in the guest&apos;s booking history.
                            </p>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() =>
                        onAdminCancelBooking(
                          selectedBooking.id,
                          shouldRefund,
                        )
                      }
                      disabled={isProcessing}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition shadow-sm ${
                        isProcessing
                          ? "bg-gray-400 cursor-not-allowed"
                          : shouldRefund
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                      } text-white`}
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : shouldRefund ? (
                        `Cancel & Refund ₱${(
                          paymentSummary?.totalPaid || 0
                        ).toLocaleString()}`
                      ) : (
                        "Cancel Without Refund"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        onSetShowConfirmCancel(false);
                        onSetShouldRefund(false);
                      }}
                      disabled={isProcessing}
                      className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      ← Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white py-2 px-6 rounded-md text-sm font-semibold hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
