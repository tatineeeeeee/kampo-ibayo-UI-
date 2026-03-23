"use client";

import { useState, useEffect, useCallback } from "react";
import type { Booking, PaymentProof, PaymentHistoryEntry } from "../lib/types";
import type { PaymentSummaryData } from "./useBookingManagement";

export interface RejectionReasonOption {
  value: string;
  label: string;
}

export interface UseBookingModalsReturn {
  // Booking detail modal
  selectedBooking: Booking | null;
  setSelectedBooking: React.Dispatch<React.SetStateAction<Booking | null>>;
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;

  // Cancel modal
  showCancelModal: boolean;
  setShowCancelModal: React.Dispatch<React.SetStateAction<boolean>>;
  adminCancellationReason: string;
  setAdminCancellationReason: React.Dispatch<React.SetStateAction<string>>;
  showConfirmCancel: boolean;
  setShowConfirmCancel: React.Dispatch<React.SetStateAction<boolean>>;
  shouldRefund: boolean;
  setShouldRefund: React.Dispatch<React.SetStateAction<boolean>>;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;

  // Reschedule modal
  showRescheduleModal: boolean;
  setShowRescheduleModal: React.Dispatch<React.SetStateAction<boolean>>;
  rescheduleCheckIn: string;
  setRescheduleCheckIn: React.Dispatch<React.SetStateAction<string>>;
  rescheduleCheckOut: string;
  setRescheduleCheckOut: React.Dispatch<React.SetStateAction<string>>;
  rescheduleReason: string;
  setRescheduleReason: React.Dispatch<React.SetStateAction<string>>;
  rescheduleLoading: boolean;
  setRescheduleLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Payment proof modal
  showPaymentProofModal: boolean;
  setShowPaymentProofModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPaymentProof: PaymentProof | null;
  setSelectedPaymentProof: React.Dispatch<
    React.SetStateAction<PaymentProof | null>
  >;
  paymentProofLoading: boolean;
  setPaymentProofLoading: React.Dispatch<React.SetStateAction<boolean>>;
  verificationNotes: string;
  setVerificationNotes: React.Dispatch<React.SetStateAction<string>>;
  rejectionReason: string;
  setRejectionReason: React.Dispatch<React.SetStateAction<string>>;
  customRejectionReason: string;
  setCustomRejectionReason: React.Dispatch<React.SetStateAction<string>>;
  imageZoomed: boolean;
  setImageZoomed: React.Dispatch<React.SetStateAction<boolean>>;
  rejectionReasons: RejectionReasonOption[];

  // Functions
  openModal: (
    booking: Booking,
    fetchPaymentHistory: (bookingId: number) => Promise<void>,
  ) => Promise<void>;
  closeModal: (
    setPaymentSummary: React.Dispatch<
      React.SetStateAction<PaymentSummaryData | null>
    >,
    setPaymentHistory: React.Dispatch<
      React.SetStateAction<PaymentHistoryEntry[]>
    >,
  ) => void;
  closePaymentProofModal: (
    setPaymentHistory: React.Dispatch<
      React.SetStateAction<PaymentHistoryEntry[]>
    >,
    setPaymentSummary: React.Dispatch<
      React.SetStateAction<PaymentSummaryData | null>
    >,
    setShowPaymentHistory: React.Dispatch<React.SetStateAction<boolean>>,
  ) => void;
  handleViewPaymentProof: (proof: PaymentProof) => void;
}

export function useBookingModals(): UseBookingModalsReturn {
  // Booking detail modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [adminCancellationReason, setAdminCancellationReason] = useState("");
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [shouldRefund, setShouldRefund] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleCheckIn, setRescheduleCheckIn] = useState("");
  const [rescheduleCheckOut, setRescheduleCheckOut] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Payment proof state
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [selectedPaymentProof, setSelectedPaymentProof] =
    useState<PaymentProof | null>(null);
  const [paymentProofLoading, setPaymentProofLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [customRejectionReason, setCustomRejectionReason] = useState("");
  const [imageZoomed, setImageZoomed] = useState(false);

  // Enhanced rejection reasons for payment proofs
  const rejectionReasons: RejectionReasonOption[] = [
    { value: "", label: "Select a reason for rejection..." },
    { value: "unclear_image", label: "Image is unclear or blurry" },
    { value: "wrong_amount", label: "Payment amount does not match booking" },
    {
      value: "invalid_reference",
      label: "Invalid or missing reference number",
    },
    { value: "wrong_account", label: "Payment sent to wrong account" },
    {
      value: "incomplete_details",
      label: "Missing payment details or information",
    },
    { value: "duplicate_payment", label: "Duplicate payment submission" },
    { value: "expired_booking", label: "Booking has expired" },
    { value: "custom", label: "Other (specify below)" },
  ];

  // Keyboard support for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && imageZoomed) {
        setImageZoomed(false);
      }
    };

    if (imageZoomed) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [imageZoomed]);

  const openModal = useCallback(
    async (
      booking: Booking,
      fetchPaymentHistory: (bookingId: number) => Promise<void>,
    ) => {
      setSelectedBooking(booking);
      setShowModal(true);
      await fetchPaymentHistory(booking.id);
    },
    [],
  );

  const closeModal = useCallback(
    (
      setPaymentSummary: React.Dispatch<
        React.SetStateAction<PaymentSummaryData | null>
      >,
      setPaymentHistory: React.Dispatch<
        React.SetStateAction<PaymentHistoryEntry[]>
      >,
    ) => {
      setShowModal(false);
      setSelectedBooking(null);
      setShowCancelModal(false);
      setAdminCancellationReason("");
      setShowConfirmCancel(false);
      setShouldRefund(false);
      setIsProcessing(false);
      setPaymentSummary(null);
      setPaymentHistory([]);
      // Reset reschedule state
      setShowRescheduleModal(false);
      setRescheduleCheckIn("");
      setRescheduleCheckOut("");
      setRescheduleReason("");
      setRescheduleLoading(false);
    },
    [],
  );

  const closePaymentProofModal = useCallback(
    (
      setPaymentHistory: React.Dispatch<
        React.SetStateAction<PaymentHistoryEntry[]>
      >,
      setPaymentSummary: React.Dispatch<
        React.SetStateAction<PaymentSummaryData | null>
      >,
      setShowPaymentHistory: React.Dispatch<React.SetStateAction<boolean>>,
    ) => {
      setShowPaymentProofModal(false);
      setSelectedPaymentProof(null);
      setVerificationNotes("");
      setRejectionReason("");
      setCustomRejectionReason("");
      setImageZoomed(false);
      setPaymentHistory([]);
      setPaymentSummary(null);
      setShowPaymentHistory(false);
    },
    [],
  );

  const handleViewPaymentProof = useCallback((proof: PaymentProof) => {
    setSelectedPaymentProof(proof);
    setShowPaymentProofModal(true);
  }, []);

  return {
    // Booking detail modal
    selectedBooking,
    setSelectedBooking,
    showModal,
    setShowModal,

    // Cancel modal
    showCancelModal,
    setShowCancelModal,
    adminCancellationReason,
    setAdminCancellationReason,
    showConfirmCancel,
    setShowConfirmCancel,
    shouldRefund,
    setShouldRefund,
    isProcessing,
    setIsProcessing,

    // Reschedule modal
    showRescheduleModal,
    setShowRescheduleModal,
    rescheduleCheckIn,
    setRescheduleCheckIn,
    rescheduleCheckOut,
    setRescheduleCheckOut,
    rescheduleReason,
    setRescheduleReason,
    rescheduleLoading,
    setRescheduleLoading,

    // Payment proof modal
    showPaymentProofModal,
    setShowPaymentProofModal,
    selectedPaymentProof,
    setSelectedPaymentProof,
    paymentProofLoading,
    setPaymentProofLoading,
    verificationNotes,
    setVerificationNotes,
    rejectionReason,
    setRejectionReason,
    customRejectionReason,
    setCustomRejectionReason,
    imageZoomed,
    setImageZoomed,
    rejectionReasons,

    // Functions
    openModal,
    closeModal,
    closePaymentProofModal,
    handleViewPaymentProof,
  };
}
