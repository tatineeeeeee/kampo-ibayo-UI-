"use client";

import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  Clock,
  PhilippinePeso,
} from "lucide-react";
import { exportPaymentsCSV } from "../../utils/csvExport";
import { exportPaymentsPDF } from "../../utils/pdfExport";
import { useToastHelpers } from "../../components/Toast";
import { formatBookingNumber } from "../../utils/bookingNumber";

interface Payment {
  id: number;
  user: string;
  guest_name?: string; // Alias for user in new structure
  email: string;
  amount: number;
  date: string;
  check_in_date?: string; // Check-in date for bookings
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
  verified_by: string | null;
  admin_notes: string | null;
  has_payment_proof: boolean;
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

export default function PaymentsPage() {
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

  // Function to debug specific payment
  const debugPayment = (payment: Payment) => {
    console.group(`🔍 Payment Debug Analysis - ID: ${payment.id}`);
    console.log("Basic Info:", {
      id: payment.id,
      bookingId: payment.booking_id,
      user: payment.user,
      status: payment.status,
    });
    console.log("Amount Analysis:", {
      amount: payment.amount,
      totalAmount: payment.total_amount,
      paymentType: payment.payment_type,
      difference: payment.total_amount
        ? payment.total_amount - payment.amount
        : "N/A",
      isFullyPaid: payment.amount >= (payment.total_amount || 0),
    });
    console.log("Eligibility Check:", {
      isHalfPayment: payment.payment_type === "half",
      isVerified:
        payment.status?.toLowerCase() === "paid" ||
        payment.status?.toLowerCase() === "verified",
      hasValidAmounts:
        payment.total_amount &&
        payment.amount &&
        payment.total_amount > 0 &&
        payment.amount > 0,
      hasRemainingBalance:
        payment.total_amount &&
        payment.amount &&
        payment.amount < payment.total_amount,
      canMarkBalance: canMarkBalanceAsPaid(payment),
    });
    console.groupEnd();
  };

  // Function to test API connectivity
  const testApiConnectivity = async () => {
    try {
      console.log("🧪 Testing mark-balance-paid API connectivity...");

      // Test 1: GET on mark-balance-paid
      console.log("1️⃣ Testing GET /api/admin/mark-balance-paid");
      const getResponse = await fetch("/api/admin/mark-balance-paid", {
        method: "GET",
      });
      console.log("GET Response:", getResponse.status, getResponse.statusText);

      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log("GET Data:", getData);
      } else {
        console.error("❌ GET test failed");
        showError("GET method test failed");
        return;
      }

      // Test 2: POST with real-world test data
      console.log(
        "2️⃣ Testing POST /api/admin/mark-balance-paid with realistic data"
      );
      const testBookingId = 1; // Use a small number that should exist
      const testPaymentId = 1; // Use a small number that should exist
      const postResponse = await fetch("/api/admin/mark-balance-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: testBookingId,
          originalPaymentId: testPaymentId,
          balanceAmount: 4500, // Half of 9000
          totalAmount: 9000,
          paymentMethod: "cash_on_arrival",
        }),
      });
      console.log(
        "POST Response:",
        postResponse.status,
        postResponse.statusText
      );

      if (postResponse.ok) {
        const postData = await postResponse.json();
        console.log("POST Data:", postData);
        success("🎉 API endpoint is working! Test was successful.");
      } else {
        try {
          const errorText = await postResponse.text();
          console.log("POST Error Response:", errorText);

          // Parse the error if it's JSON
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }

          if (postResponse.status === 404 && errorText.includes("not found")) {
            console.log(
              "✅ POST method reached API but returned expected validation error (test records not found)"
            );
            success(
              "🎉 API endpoint is working correctly! Ready for real data."
            );
          } else if (postResponse.status === 400) {
            console.log(
              "✅ POST method working - returned validation error as expected:",
              errorData.error
            );
            success(
              "🎉 API endpoint is working correctly! Validation is functioning."
            );
          } else {
            console.error("❌ Unexpected POST error:", errorData);
            showError(
              `API test failed: ${postResponse.status} - ${
                errorData.error || errorText
              }`
            );
          }
        } catch (parseError) {
          console.error("❌ Could not parse error response:", parseError);
          showError(
            `API test failed: ${postResponse.status} - Could not parse response`
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
      const response = await fetch("/api/admin/fix-payment-types", {
        method: "POST",
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
      console.log("🔄 Marking balance as paid:", {
        bookingId: payment.booking_id,
        balanceAmount,
        totalAmount: payment.total_amount,
        originalAmount: payment.original_amount,
      });

      const requestBody = {
        bookingId: Number(payment.booking_id),
        balanceAmount: Number(balanceAmount),
        totalAmount: Number(payment.total_amount),
        paymentMethod: "cash_on_arrival",
      };

      console.log("📤 Sending request:", requestBody);

      const response = await fetch("/api/admin/mark-balance-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Response:", response.status, response.statusText);

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
      console.log("✅ Success:", result);

      success(
        `Balance of ₱${balanceAmount.toLocaleString()} marked as paid on arrival!`
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
  const canMarkBalanceAsPaid = (payment: Payment) => {
    // Only allow for half payments that are verified and have remaining balance
    const isHalfPayment = payment.payment_type === "half";
    const isOriginalVerified = payment.original_status === "verified";
    const hasValidAmounts =
      payment.total_amount &&
      payment.original_amount &&
      payment.total_amount > 0 &&
      payment.original_amount > 0;
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

    // NEW: Check if there's already a balance payment
    const hasExistingBalancePayment =
      payment.balance_reference !== null &&
      payment.balance_status === "verified";

    // NEW: Check if the booking is cancelled
    const isBookingCancelled =
      payment.booking_status?.toLowerCase() === "cancelled";

    // Don't allow if balance payment already exists or booking is cancelled
    if (hasExistingBalancePayment || isBookingCancelled) {
      return false;
    }

    // Only log debug info if conditions aren't met to reduce console spam
    if (isHalfPayment && !hasRemainingBalance && payment.id) {
      console.log(
        `🔍 Payment ${payment.id} (Booking: ${payment.booking_id}) cannot be marked:`,
        {
          paymentType: payment.payment_type,
          originalAmount: payment.original_amount,
          totalAmount: payment.total_amount,
          balanceAmount,
          isOriginalVerified,
          hasValidAmounts,
          isOverpaid,
          hasExistingBalancePayment,
          isBookingCancelled,
          reason: isBookingCancelled
            ? "Booking is cancelled"
            : hasExistingBalancePayment
            ? "Balance payment already exists"
            : isOverpaid
            ? "OVERPAID - Customer paid more than total amount"
            : (payment.original_amount || 0) === payment.total_amount
            ? "Already paid in full"
            : (payment.original_amount || 0) > (payment.total_amount || 0)
            ? "Overpaid"
            : "Invalid amounts or missing data",
        }
      );
    }

    // Don't allow marking balance as paid for overpaid bookings, if balance already exists, or if booking is cancelled
    return (
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

    // Then filter by search term (removed status search)
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
          payment.amount?.toString().includes(searchTerm.trim())
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
      const response = await fetch("/api/admin/payments");
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
        return "bg-green-100 text-green-600";
      case "pending":
      case "pending_verification":
        return "bg-yellow-100 text-yellow-600";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Payments</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading payments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Payments</h3>
        <div className="text-red-600 text-center py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by guest name, email, reference number, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-1">
            Found {filteredPayments.length} payment
            {filteredPayments.length !== 1 ? "s" : ""} matching &quot;
            {searchTerm}&quot;
          </p>
        )}
      </div>
      {/* Status Filter Buttons */}
      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <span className="sm:hidden">All</span>
            <span className="hidden sm:inline">All</span>
            <span className="ml-1">({payments.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "paid"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <span className="sm:hidden">Paid</span>
            <span className="hidden sm:inline">Paid</span>
            <span className="ml-1">
              (
              {
                payments.filter(
                  (p) =>
                    p.booking_status?.toLowerCase() !== "cancelled" &&
                    (p.status?.toLowerCase() === "paid" ||
                      p.status?.toLowerCase() === "verified")
                ).length
              }
              )
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "pending"
                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <span className="sm:hidden">Pend</span>
            <span className="hidden sm:inline">Pending</span>
            <span className="ml-1">
              (
              {
                payments.filter(
                  (p) =>
                    p.booking_status?.toLowerCase() !== "cancelled" &&
                    (p.status?.toLowerCase() === "pending" ||
                      p.status?.toLowerCase() === "pending_verification")
                ).length
              }
              )
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "cancelled"
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <span className="sm:hidden">Canc</span>
            <span className="hidden sm:inline">Cancelled</span>
            <span className="ml-1">
              (
              {
                payments.filter(
                  (p) =>
                    p.booking_status?.toLowerCase() === "cancelled" ||
                    p.status?.toLowerCase() === "cancelled" ||
                    p.status?.toLowerCase() === "rejected"
                ).length
              }
              )
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("half")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "half"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <span className="sm:hidden">50%</span>
            <span className="hidden sm:inline">Down Payments</span>
            <span className="ml-1">
              ({payments.filter((p) => p.payment_type === "half").length})
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("full")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "full"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <span className="sm:hidden">Full</span>
            <span className="hidden sm:inline">Full Payments</span>
            <span className="ml-1">
              ({payments.filter((p) => p.payment_type === "full").length})
            </span>
          </button>
        </div>
        {(statusFilter !== "all" || searchTerm) && (
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Showing {filteredPayments.length} of {payments.length} payments
            {statusFilter !== "all" && ` with status "${statusFilter}"`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        )}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <PhilippinePeso className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Total Revenue{searchTerm && " (filtered)"}
              </p>
              <p className="text-xl font-bold text-gray-900">
                {filteredPayments
                  .filter(
                    (p) =>
                      p.status?.toLowerCase() === "paid" ||
                      p.status?.toLowerCase() === "verified"
                  )
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Down Payments{searchTerm && " (filtered)"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {
                  filteredPayments.filter((p) => p.payment_type === "half")
                    .length
                }
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">
                ₱
                {filteredPayments
                  .filter(
                    (p) =>
                      p.payment_type === "half" &&
                      (p.status?.toLowerCase() === "paid" ||
                        p.status?.toLowerCase() === "verified")
                  )
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}{" "}
                paid
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Full Payments{searchTerm && " (filtered)"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {
                  filteredPayments.filter((p) => p.payment_type === "full")
                    .length
                }
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">
                ₱
                {filteredPayments
                  .filter(
                    (p) =>
                      p.payment_type === "full" &&
                      (p.status?.toLowerCase() === "paid" ||
                        p.status?.toLowerCase() === "verified")
                  )
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}{" "}
                paid
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Pending{searchTerm && " (filtered)"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {
                  filteredPayments.filter(
                    (p) =>
                      p.status?.toLowerCase() === "pending" ||
                      p.status?.toLowerCase() === "pending_verification"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Payment Transactions ({filteredPayments.length}
              {searchTerm ? ` filtered` : ` total`})
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 sm:space-x-2">
              {/* Export CSV Button */}
              <button
                onClick={() => {
                  try {
                    exportPaymentsCSV(
                      filteredPayments as unknown as {
                        [key: string]:
                          | string
                          | number
                          | boolean
                          | null
                          | undefined
                          | object;
                      }[]
                    );
                    success(
                      `${filteredPayments.length} payment${
                        filteredPayments.length !== 1 ? "s" : ""
                      } exported to CSV successfully!`
                    );
                  } catch (error) {
                    console.error("Export error:", error);
                    showError("Failed to export CSV. Please try again.");
                  }
                }}
                disabled={filteredPayments.length === 0}
                className={`inline-flex items-center px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  filteredPayments.length === 0
                    ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                    : "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                }`}
                title="Export payments to CSV"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </button>

              {/* Export PDF Button */}
              <button
                onClick={async () => {
                  try {
                    await exportPaymentsPDF(
                      filteredPayments as unknown as {
                        [key: string]:
                          | string
                          | number
                          | boolean
                          | null
                          | undefined
                          | object;
                      }[]
                    );
                    success(
                      `${filteredPayments.length} payment${
                        filteredPayments.length !== 1 ? "s" : ""
                      } exported to PDF successfully!`
                    );
                  } catch (error) {
                    console.error("Export error:", error);
                    showError("Failed to export PDF. Please try again.");
                  }
                }}
                disabled={filteredPayments.length === 0}
                className={`inline-flex items-center px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  filteredPayments.length === 0
                    ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                    : "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                }`}
                title="Export payments to PDF"
              >
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </button>

              {/* Fix Payment Types Button */}
              <button
                onClick={fixMissingPaymentTypes}
                className="inline-flex items-center px-3 py-1 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
                title="Fix missing payment types"
              >
                🔧 Fix Types
              </button>

              {/* Test API Connectivity Button */}
              <button
                onClick={testApiConnectivity}
                className="inline-flex items-center px-3 py-1 border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md text-sm font-medium transition-colors"
                title="Test API connectivity"
              >
                🧪 Test API
              </button>
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">💳</div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? `No payments match "${searchTerm}"`
                : "No payments found"}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchTerm
                ? "Try adjusting your search terms or clear the search to see all payments."
                : "Payment transactions will appear here once guests make bookings."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-gray-200">
              {paginatedPayments.map((payment) => (
                <div
                  key={`mobile-${payment.booking_id}`}
                  className="p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {payment.guest_name || payment.user}
                      </p>
                      <p className="text-xs text-gray-500">{payment.email}</p>
                      <p className="text-xs text-gray-400">
                        {formatBookingNumber(payment.booking_id)}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ₱{(payment.original_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          payment.payment_type === "half"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {payment.payment_type === "half" ? "50% Down" : "Full"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          payment.booking_status?.toLowerCase() === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : payment.original_status === "verified"
                            ? "bg-green-100 text-green-800"
                            : payment.original_status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {payment.booking_status?.toLowerCase() === "cancelled"
                          ? "cancelled"
                          : payment.original_status || "pending"}
                      </span>
                    </div>
                  </div>
                  {payment.original_reference && (
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="text-gray-500">Ref:</span>{" "}
                      <span className="font-mono">
                        {payment.original_reference}
                      </span>
                    </p>
                  )}
                  {canMarkBalanceAsPaid(payment) && (
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowBalanceModal(true);
                      }}
                      className="w-full mt-2 px-3 py-2 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md text-xs font-medium"
                    >
                      Mark Balance Paid
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Original Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Balance Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPayments.map((payment) => (
                    <tr
                      key={`booking-${payment.booking_id}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.guest_name || payment.user}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatBookingNumber(payment.booking_id)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600">
                          ₱{(payment.original_amount || 0).toLocaleString()}
                        </span>
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
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    Balance Payment (50%)
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">
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
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    50% Down Payment
                                  </span>
                                  {totalAmount && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Total: ₱{totalAmount.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              );
                            } else if (paymentType === "full") {
                              return (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Full Payment (100%)
                                </span>
                              );
                            }

                            // Try to infer from amounts if payment_type is missing
                            if (totalAmount && amount) {
                              const percentage = (amount / totalAmount) * 100;
                              if (percentage >= 45 && percentage <= 55) {
                                return (
                                  <div>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      50% Down Payment (inferred)
                                    </span>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Total: ₱{totalAmount.toLocaleString()}
                                    </div>
                                  </div>
                                );
                              } else if (percentage >= 95) {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Full Payment (100%)
                                  </span>
                                );
                              }
                            }

                            // Fallback for unknown cases
                            return (
                              <div>
                                <span className="text-gray-400 italic text-xs">
                                  Type not specified
                                </span>
                                {totalAmount && (
                                  <div className="text-xs text-gray-500 mt-1">
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
                            <div className="font-mono text-gray-700 bg-blue-50 px-2 py-1 rounded text-xs">
                              💳 {payment.original_reference}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              No reference provided
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {payment.balance_reference ? (
                            <div className="font-mono text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs">
                              🏨 {payment.balance_reference}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              Not specified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.booking_status?.toLowerCase() ===
                            "cancelled"
                              ? "bg-red-100 text-red-800"
                              : payment.original_status === "verified" &&
                                (payment.payment_type === "full" ||
                                  payment.balance_status === "verified")
                              ? "bg-green-100 text-green-800"
                              : payment.original_status === "verified" &&
                                payment.payment_type === "half"
                              ? "bg-yellow-100 text-yellow-800"
                              : payment.original_status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {payment.booking_status?.toLowerCase() === "cancelled"
                            ? "cancelled"
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
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  BALANCE PAID
                                </span>
                                <span className="text-xs text-gray-500">
                                  Cash on arrival
                                </span>
                              </div>
                            );
                          }

                          if (canMarkBalanceAsPaid(payment)) {
                            return (
                              <button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowBalanceModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md text-xs font-medium transition-colors shadow-sm"
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
                              p.reference_number?.startsWith("ARRIVAL-")
                          );

                          if (
                            payment.payment_type === "half" &&
                            hasBalancePayment
                          ) {
                            return (
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  FULLY PAID
                                </span>
                                <span className="text-xs text-gray-500">
                                  50% + Balance
                                </span>
                              </div>
                            );
                          }

                          if (payment.payment_type === "half" && isOverpaid) {
                            return (
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  OVERPAID
                                </span>
                                <button
                                  onClick={() => debugPayment(payment)}
                                  className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                  title="Debug this payment"
                                >
                                  🔍
                                </button>
                              </div>
                            );
                          }

                          if (payment.payment_type === "half") {
                            const balanceAmount = totalAmount
                              ? totalAmount - amount
                              : 0;
                            if (balanceAmount <= 0) {
                              return (
                                <div className="flex items-center gap-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    PAID IN FULL
                                  </span>
                                  <button
                                    onClick={() => debugPayment(payment)}
                                    className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                    title="Debug this payment"
                                  >
                                    🔍
                                  </button>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-400">
                                    Balance: ₱{balanceAmount.toLocaleString()}
                                  </span>
                                  <button
                                    onClick={() => debugPayment(payment)}
                                    className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                    title="Debug this payment"
                                  >
                                    🔍
                                  </button>
                                </div>
                              );
                            }
                          }

                          return (
                            <span className="text-xs text-gray-400">-</span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredPayments.length > 0 && (
              <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4 bg-gray-50 px-3 sm:px-4 py-3 rounded-lg">
                {/* Mobile: Simple pagination */}
                <div className="flex sm:hidden justify-between items-center">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded border border-gray-300 bg-white disabled:opacity-50 text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded border border-gray-300 bg-white disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                </div>

                {/* Desktop: Full pagination */}
                <div className="hidden sm:flex flex-col sm:flex-row justify-between items-center gap-4">
                  {/* Items per page and info */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="itemsPerPage"
                        className="text-sm text-gray-800 font-medium"
                      >
                        Show:
                      </label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) =>
                          setItemsPerPage(Number(e.target.value))
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 font-medium bg-white"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <span className="text-sm text-gray-800 font-medium">
                      Showing{" "}
                      {Math.min(startIndex + 1, filteredPayments.length)} to{" "}
                      {Math.min(
                        startIndex + itemsPerPage,
                        filteredPayments.length
                      )}{" "}
                      of {filteredPayments.length} payments
                    </span>
                  </div>

                  {/* Page info and controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-800 font-medium mr-4">
                        Page {currentPage} of {totalPages}
                      </span>

                      {/* Navigation buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={goToFirstPage}
                          disabled={currentPage === 1}
                          className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </button>

                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        {/* Page numbers */}
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNumber}
                                onClick={() => goToPage(pageNumber)}
                                className={`px-3 py-2 text-sm font-medium rounded border ${
                                  currentPage === pageNumber
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          }
                        )}

                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        <button
                          onClick={goToLastPage}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Balance Payment Confirmation Modal */}
      {showBalanceModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-200 max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-t-lg border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    Mark Balance as Paid
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Confirm on-arrival payment
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBalanceModal(false);
                    setSelectedPayment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-white hover:shadow-md transition"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Payment Details */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">
                  Payment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guest:</span>
                    <span className="font-medium text-gray-900">
                      {selectedPayment.user}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking:</span>
                    <span className="font-medium text-gray-900">
                      {formatBookingNumber(selectedPayment.booking_id)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-gray-900">
                      ₱{selectedPayment.total_amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Already Paid (50%):</span>
                    <span className="font-medium text-green-600">
                      ₱{selectedPayment.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                    <span className="text-gray-600">Balance Due:</span>
                    <span className="font-bold text-orange-600">
                      ₱
                      {selectedPayment.total_amount
                        ? (
                            selectedPayment.total_amount -
                            selectedPayment.amount
                          ).toLocaleString()
                        : "0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    !
                  </div>
                  <h4 className="font-semibold text-amber-800">
                    Confirm On-Arrival Payment
                  </h4>
                </div>
                <p className="text-amber-700 text-sm leading-relaxed">
                  This will mark the remaining 50% balance as{" "}
                  <strong>&quot;Paid on Arrival&quot;</strong>. Only confirm
                  this action if the guest has physically paid the balance
                  amount at check-in.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-6 rounded-b-lg border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => markBalanceAsPaid(selectedPayment)}
                  disabled={processingBalance}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition shadow-sm ${
                    processingBalance
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  } text-white`}
                >
                  {processingBalance ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    `Mark ₱${
                      selectedPayment.total_amount
                        ? (
                            selectedPayment.total_amount -
                            selectedPayment.amount
                          ).toLocaleString()
                        : "0"
                    } as Paid`
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowBalanceModal(false);
                    setSelectedPayment(null);
                  }}
                  disabled={processingBalance}
                  className="py-2 px-4 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Payment History Modal */}
      {showPaymentHistoryModal && selectedPaymentHistory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full border border-gray-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gray-50 p-6 rounded-t-lg border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Payment History
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {selectedPaymentHistory.user} -{" "}
                    {formatBookingNumber(selectedPaymentHistory.booking_id)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentHistoryModal(false);
                    setSelectedPaymentHistory(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:shadow-md transition"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Summary Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">
                  Booking Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-gray-900 ml-2">
                      ₱{selectedPaymentHistory.total_amount?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-bold text-green-600 ml-2">
                      ₱{selectedPaymentHistory.amount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Type:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {selectedPaymentHistory.payment_type === "half"
                        ? "50% Down Payment"
                        : "Full Payment"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Submissions:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {selectedPaymentHistory.total_proofs}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Proofs Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  All Payment Proofs
                </h3>

                {selectedPaymentHistory.all_payment_proofs &&
                selectedPaymentHistory.all_payment_proofs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Sequence
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Reference
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedPaymentHistory.all_payment_proofs.map(
                          (proof) => (
                            <tr
                              key={`proof-${proof.id}`}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  #{proof.sequence}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                ₱{proof.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {proof.reference_number ? (
                                  <div
                                    className={`font-mono px-2 py-1 rounded text-xs ${
                                      proof.reference_number.startsWith(
                                        "ARRIVAL-"
                                      )
                                        ? "text-amber-700 bg-amber-50"
                                        : "text-blue-700 bg-blue-50"
                                    }`}
                                  >
                                    {proof.reference_number.startsWith(
                                      "ARRIVAL-"
                                    )
                                      ? "🏨"
                                      : "💳"}{" "}
                                    {proof.reference_number}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">
                                    No reference
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                                {proof.payment_method?.replace("_", " ")}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    proof.status
                                  )}`}
                                >
                                  {proof.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {new Date(proof.uploaded_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {proof.admin_notes && (
                                  <div
                                    className="max-w-xs truncate"
                                    title={proof.admin_notes}
                                  >
                                    {proof.admin_notes}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>No payment proofs uploaded yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 rounded-b-lg border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowPaymentHistoryModal(false);
                    setSelectedPaymentHistory(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
