"use client";

import { formatBookingNumber } from "../../../utils/bookingNumber";
import { BookingInfoSection } from "./BookingInfoSection";
import { BookingPaymentSection } from "./BookingPaymentSection";
import { BookingStatusActions } from "./BookingStatusActions";
import { BookingRescheduleForm } from "./BookingRescheduleForm";
import { BookingCancelForm } from "./BookingCancelForm";
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
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-border">
        {/* Modal Header - Clean Light */}
        <div className="bg-muted p-4 sm:p-6 rounded-t-lg border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Booking Management
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Complete reservation details •{" "}
                {selectedBooking
                  ? formatBookingNumber(selectedBooking.id)
                  : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-muted-foreground text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-card hover:shadow-md transition"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Booking Info Section */}
          <BookingInfoSection
            selectedBooking={selectedBooking}
            paymentSummary={paymentSummary}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
          />

          {/* Payment Section */}
          <BookingPaymentSection
            selectedBooking={selectedBooking}
            paymentSummary={paymentSummary}
          />
        </div>

        {/* Modal Footer - Unified Action Buttons */}
        <div className="bg-muted p-6 rounded-b-lg border-t border-border">
          {/* ACTIVE BOOKINGS (Pending or Confirmed) - Show actions */}
          {(selectedBooking.status === "pending" ||
            selectedBooking.status === "confirmed") &&
          !showCancelModal &&
          !showRescheduleModal ? (
            <BookingStatusActions
              selectedBooking={selectedBooking}
              refreshTrigger={refreshTrigger}
              onClose={onClose}
              onSetShowCancelModal={onSetShowCancelModal}
              onSetShowRescheduleModal={onSetShowRescheduleModal}
              onSetRescheduleCheckIn={onSetRescheduleCheckIn}
              onSetRescheduleCheckOut={onSetRescheduleCheckOut}
              onSetRescheduleReason={onSetRescheduleReason}
              onUpdateBookingStatus={onUpdateBookingStatus}
              onViewPaymentProof={onViewPaymentProof}
              fetchPaymentHistory={fetchPaymentHistory}
            />
          ) : showRescheduleModal ? (
            <BookingRescheduleForm
              selectedBooking={selectedBooking}
              rescheduleCheckIn={rescheduleCheckIn}
              rescheduleCheckOut={rescheduleCheckOut}
              rescheduleReason={rescheduleReason}
              rescheduleLoading={rescheduleLoading}
              onSetRescheduleCheckIn={onSetRescheduleCheckIn}
              onSetRescheduleCheckOut={onSetRescheduleCheckOut}
              onSetRescheduleReason={onSetRescheduleReason}
              onSetShowRescheduleModal={onSetShowRescheduleModal}
              onAdminReschedule={onAdminReschedule}
            />
          ) : showCancelModal ? (
            <BookingCancelForm
              selectedBooking={selectedBooking}
              showConfirmCancel={showConfirmCancel}
              shouldRefund={shouldRefund}
              isProcessing={isProcessing}
              adminCancellationReason={adminCancellationReason}
              paymentSummary={paymentSummary}
              onSetShowCancelModal={onSetShowCancelModal}
              onSetShowConfirmCancel={onSetShowConfirmCancel}
              onSetShouldRefund={onSetShouldRefund}
              onSetAdminCancellationReason={onSetAdminCancellationReason}
              onAdminCancelBooking={onAdminCancelBooking}
            />
          ) : (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-muted0 text-white py-2 px-6 rounded-md text-sm font-semibold hover:bg-muted-foreground transition"
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
