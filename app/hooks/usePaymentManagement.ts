"use client";

import { useState, useEffect } from "react";
import { useToastHelpers } from "../components/Toast";
import { supabase } from "../supabaseClient";

export interface Payment {
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

  // Original payment info
  original_reference: string | null;
  original_method: string | null;
  original_amount: number | null;
  original_status: string | null;

  // Balance payment info
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

  // Legacy properties for backwards compatibility
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

export function usePaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedPayments, setPaginatedPayments] = useState<Payment[]>([]);

  // Toast helpers
  const { success, error: showError } = useToastHelpers();

  // Balance payment modal state
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [processingBalance, setProcessingBalance] = useState(false);

  // Payment history modal state
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedPaymentHistory, setSelectedPaymentHistory] =
    useState<Payment | null>(null);

  // Function to test API connectivity
  const testApiConnectivity = async () => {
    try {
      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      // Test 1: GET on mark-balance-paid
      const getResponse = await fetch("/api/admin/mark-balance-paid", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!getResponse.ok) {
        console.error("❌ GET test failed");
        showError("GET method test failed");
        return;
      }

      // Test 2: POST with real-world test data
      const testBookingId = 1;
      const testPaymentId = 1;
      const postResponse = await fetch("/api/admin/mark-balance-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId: testBookingId,
          originalPaymentId: testPaymentId,
          balanceAmount: 4500,
          totalAmount: 9000,
          paymentMethod: "cash_on_arrival",
        }),
      });

      if (postResponse.ok) {
        success("API endpoint is working! Test was successful.");
      } else {
        try {
          const errorText = await postResponse.text();

          // Parse the error if it's JSON
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }

          if (postResponse.status === 404 && errorText.includes("not found")) {
            success(
              "🎉 API endpoint is working correctly! Ready for real data.",
            );
          } else if (postResponse.status === 400) {
            success(
              "🎉 API endpoint is working correctly! Validation is functioning.",
            );
          } else {
            console.error("❌ Unexpected POST error:", errorData);
            showError(
              `API test failed: ${postResponse.status} - ${
                errorData.error || errorText
              }`,
            );
          }
        } catch (parseError) {
          console.error("❌ Could not parse error response:", parseError);
          showError(
            `API test failed: ${postResponse.status} - Could not parse response`,
          );
        }
      }
    } catch (error) {
      console.error("🧪 Test API error:", error);
      showError("API connectivity test failed - network or connection error");
    }
  };

  // Function to fix missing payment types
  const fixMissingPaymentTypes = async () => {
    try {
      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch("/api/admin/fix-payment-types", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        success(`Fixed ${data.updated} payments with missing types!`);
        fetchPayments(); // Refresh the data
      } else {
        showError("Failed to fix payment types");
      }
    } catch (error) {
      console.error("Error fixing payment types:", error);
      showError("Failed to fix payment types");
    }
  };

  // Function to mark remaining balance as paid (for half payments)
  const markBalanceAsPaid = async (payment: Payment) => {
    // Enhanced validation for safety
    if (!payment.total_amount || payment.payment_type !== "half") {
      showError("This feature is only available for half payments");
      return;
    }

    if (!canMarkBalanceAsPaid(payment)) {
      showError("Payment is not eligible for balance marking");
      return;
    }

    const balanceAmount = payment.total_amount - (payment.original_amount || 0);
    if (balanceAmount <= 0) {
      showError("No remaining balance to mark as paid");
      return;
    }

    // Additional validation to prevent API errors
    if (!payment.booking_id) {
      showError("Invalid payment data - missing booking ID");
      return;
    }

    setProcessingBalance(true);

    try {
      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showError("Authentication required. Please log in again.");
        setProcessingBalance(false);
        return;
      }

      const requestBody = {
        bookingId: Number(payment.booking_id),
        balanceAmount: Number(balanceAmount),
        totalAmount: Number(payment.total_amount),
        paymentMethod: "cash_on_arrival",
      };

      const response = await fetch("/api/admin/mark-balance-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = "Failed to mark balance as paid";

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("❌ API Error:", errorData);
        } catch (parseError) {
          console.error("❌ Response parse error:", parseError);
          errorMessage = `Server error (${response.status})`;
        }

        showError(errorMessage);
        return;
      }

      // Parse successful response
      const result = await response.json();

      success(
        `Balance of ₱${balanceAmount.toLocaleString()} marked as paid on arrival!`,
      );
      fetchPayments(); // Refresh the data
      setShowBalanceModal(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error("💥 Network error:", error);
      showError("Network error. Please check your connection and try again.");
    } finally {
      setProcessingBalance(false);
    }
  };

  // Function to check if balance can be marked as paid
  const canMarkBalanceAsPaid = (payment: Payment): boolean => {
    // Only allow for half payments that are verified and have remaining balance
    const isHalfPayment = payment.payment_type === "half";
    const isOriginalVerified = payment.original_status === "verified";
    const hasValidAmounts = !!(
      payment.total_amount &&
      payment.original_amount &&
      payment.total_amount > 0 &&
      payment.original_amount > 0);
    const hasRemainingBalance =
      hasValidAmounts &&
      (payment.original_amount || 0) < (payment.total_amount || 0);
    const balanceAmount =
      hasValidAmounts && payment.total_amount
        ? payment.total_amount - (payment.original_amount || 0)
        : 0;

    // Check for overpayment
    const isOverpaid =
      hasValidAmounts &&
      (payment.original_amount || 0) > (payment.total_amount || 0);

    // Check if there's already a balance payment
    const hasExistingBalancePayment =
      payment.balance_reference !== null &&
      payment.balance_status === "verified";

    // Check if the booking is cancelled
    const isBookingCancelled =
      payment.booking_status?.toLowerCase() === "cancelled";

    // Don't allow if balance payment already exists or booking is cancelled
    if (hasExistingBalancePayment || isBookingCancelled) {
      return false;
    }

    // Don't allow marking balance as paid for overpaid bookings, if balance already exists, or if booking is cancelled
    return !!(
      isHalfPayment &&
      isOriginalVerified &&
      hasRemainingBalance &&
      balanceAmount > 0 &&
      !isOverpaid &&
      !hasExistingBalancePayment &&
      !isBookingCancelled
    );
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter payments based on search term and status filter
  useEffect(() => {
    let filtered = payments;

    // First filter by status with grouped logic
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => {
        // For consolidated payments, check both original and balance statuses
        const originalStatus = payment.original_status?.toLowerCase();
        const balanceStatus = payment.balance_status?.toLowerCase();

        if (statusFilter === "paid") {
          // Both payments verified or completed (and booking not cancelled)
          return (
            payment.booking_status?.toLowerCase() !== "cancelled" &&
            originalStatus === "verified" &&
            (payment.payment_type === "full" || balanceStatus === "verified")
          );
        } else if (statusFilter === "pending") {
          // Either payment is pending (and booking not cancelled)
          return (
            payment.booking_status?.toLowerCase() !== "cancelled" &&
            (originalStatus === "pending" ||
              originalStatus === "pending_verification" ||
              (payment.balance_reference &&
                (balanceStatus === "pending" ||
                  balanceStatus === "pending_verification")))
          );
        } else if (statusFilter === "cancelled") {
          // Booking is cancelled OR payment is cancelled/rejected
          return (
            payment.booking_status?.toLowerCase() === "cancelled" ||
            originalStatus === "cancelled" ||
            originalStatus === "rejected" ||
            balanceStatus === "cancelled" ||
            balanceStatus === "rejected"
          );
        } else if (statusFilter === "walk_in") {
          return payment.is_walk_in === true;
        } else if (statusFilter === "half") {
          return payment.payment_type === "half";
        } else if (statusFilter === "full") {
          return payment.payment_type === "full";
        }
        return (
          originalStatus === statusFilter.toLowerCase() ||
          balanceStatus === statusFilter.toLowerCase()
        );
      });
    }

    // Then filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (payment) =>
          // Search by guest name or user name
          payment.guest_name?.toLowerCase().includes(searchLower) ||
          payment.user?.toLowerCase().includes(searchLower) ||
          // Search by email
          payment.email?.toLowerCase().includes(searchLower) ||
          // Search by reference number (both original and balance)
          payment.original_reference?.toLowerCase().includes(searchLower) ||
          payment.balance_reference?.toLowerCase().includes(searchLower) ||
          payment.reference_number?.toLowerCase().includes(searchLower) ||
          // Search by booking ID
          payment.booking_id?.toString().includes(searchTerm.trim()) ||
          // Search by amounts
          payment.total_amount?.toString().includes(searchTerm.trim()) ||
          payment.original_amount?.toString().includes(searchTerm.trim()) ||
          payment.amount?.toString().includes(searchTerm.trim()),
      );
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, statusFilter]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPayments(filteredPayments.slice(startIndex, endIndex));
  }, [filteredPayments, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPayments]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () =>
    setCurrentPage(Math.min(totalPages, currentPage + 1));

  const fetchPayments = async () => {
    try {
      const { fetchWithAuth } = await import("../utils/apiTimeout");
      const response = await fetchWithAuth(supabase, "/api/admin/payments");
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "verified":
        return "bg-success/10 text-success";
      case "pending":
      case "pending_verification":
        return "bg-warning/10 text-warning";
      case "cancelled":
      case "rejected":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return {
    // Data
    payments,
    filteredPayments,
    paginatedPayments,
    loading,
    error,

    // Search & filters
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,

    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    setItemsPerPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage,
    goToNextPage,

    // Balance modal
    showBalanceModal,
    setShowBalanceModal,
    selectedPayment,
    setSelectedPayment,
    processingBalance,
    markBalanceAsPaid,
    canMarkBalanceAsPaid,

    // Payment history modal
    showPaymentHistoryModal,
    setShowPaymentHistoryModal,
    selectedPaymentHistory,
    setSelectedPaymentHistory,

    // Actions
    fetchPayments,
    testApiConnectivity,
    fixMissingPaymentTypes,
    getStatusColor,

    // Toast helpers (exposed for child components)
    success,
    showError,
  };
}
