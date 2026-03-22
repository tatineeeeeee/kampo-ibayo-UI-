"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useToastHelpers } from "../../components/Toast";
import { Footprints } from "lucide-react";
import {
  formatBookingNumber,
  parseBookingNumber,
} from "../../utils/bookingNumber";
import { displayPhoneNumber } from "../../utils/phoneUtils";
import { getFreshSession } from "../../utils/apiTimeout";
import type { Booking, PaymentProof, PaymentHistoryEntry } from "../../lib/types";
import { ITEMS_PER_PAGE } from "../../lib/constants";
import { SmartWorkflowStatusCell } from "../../components/admin/bookings/WorkflowStatus";
import { PaymentStatusCell } from "../../components/admin/bookings/PaymentStatusCell";
import { AdminPaymentBreakdown } from "../../components/admin/bookings/AdminPaymentBreakdown";
import { SmartConfirmButton } from "../../components/admin/bookings/SmartConfirmButton";
import { PaymentProofButton } from "../../components/admin/bookings/PaymentProofButton";
import { AdminDashboardSummary } from "../../components/admin/bookings/AdminDashboardSummary";
import { BookingDetailModal } from "../../components/admin/bookings/BookingDetailModal";
import { PaymentProofModal } from "../../components/admin/bookings/PaymentProofModal";
import { BookingFilters } from "../../components/admin/bookings/BookingFilters";
import { BookingPagination } from "../../components/admin/bookings/BookingPagination";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false); // ✅ Start false for instant UI
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [adminCancellationReason, setAdminCancellationReason] = useState("");
  const [showDeletedUsers, setShowDeletedUsers] = useState(true);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [shouldRefund, setShouldRefund] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>(
    [],
  );
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<{
    totalAmount: number;
    totalPaid: number;
    pendingAmount: number;
    remainingBalance: number;
  } | null>(null);
  const [newBookingAlert, setNewBookingAlert] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // ✨ For triggering component refreshes on payment proof updates
  const [lastRealTimeEvent, setLastRealTimeEvent] = useState<string | null>(
    null,
  ); // Track real-time events
  const [realTimeStatus, setRealTimeStatus] = useState<
    "connecting" | "active" | "degraded" | "offline"
  >("connecting");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false); // Manual refresh state

  // Enhanced rejection reasons for payment proofs
  const rejectionReasons = [
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
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [imageZoomed]);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(ITEMS_PER_PAGE); // You can make this configurable
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);

  // Toast helpers
  const { success, error: showError, warning } = useToastHelpers();
  useEffect(() => {
    // Delayed fetch to not block navigation
    const timer = setTimeout(() => {
      fetchBookings();
    }, 100);

    // Set up real-time subscriptions for instant updates
    setRealTimeStatus("connecting");

    // Set up real-time subscription for bookings with enhanced reliability
    const bookingsSubscription = supabase
      .channel("admin-bookings-realtime", {
        config: {
          broadcast: { self: true },
          presence: { key: "admin-user" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          // Enhanced optimistic updates for instant UI response
          if (payload.eventType === "UPDATE" && payload.new) {
            // ⚡ CRITICAL: Show alert for payment proof uploads (payment_status change to payment_review)
            if (
              payload.old?.payment_status !== "payment_review" &&
              payload.new.payment_status === "payment_review"
            ) {
              if (!document.hidden) {
                success(
                  "💸 Payment Proof Uploaded!",
                  `Booking ${payload.new.id} (${payload.new.guest_name}) uploaded payment proof - Ready for review!`,
                );
                setRefreshTrigger((prev) => prev + 1);
              }
            }

            // ⚡ CRITICAL: Handle ANY cancellation - auto-cancel payment proofs when booking is cancelled
            if (
              payload.old?.status !== "cancelled" &&
              payload.new.status === "cancelled"
            ) {
              // Automatically cancel ALL payment proofs (pending/verified/rejected) for this cancelled booking
              const cancelPaymentProofs = async () => {
                try {
                  const cancelledBy = payload.new.cancelled_by || "system";
                  const adminNote = `Booking cancelled by ${cancelledBy} - Payment proof automatically cancelled`;

                  const { error } = await supabase
                    .from("payment_proofs")
                    .update({
                      status: "cancelled",
                      admin_notes: `${adminNote} (by ${cancelledBy})`,
                      verified_at: new Date().toISOString(),
                    })
                    .eq("booking_id", payload.new.id)
                    .in("status", ["pending", "verified", "rejected"]); // Cancel ALL non-cancelled proofs

                  if (error) {
                    console.error("❌ Failed to cancel payment proofs:", error);
                  } else {
                  }
                } catch (error) {
                  console.error("💥 Error cancelling payment proofs:", error);
                }
              };

              // Cancel payment proofs in background
              cancelPaymentProofs();

              if (!document.hidden) {
                const cancelledBy =
                  payload.new.cancelled_by === "user" ? "user" : "admin";
                warning(
                  "🚫 Booking Cancelled",
                  `Booking ${payload.new.id} (${payload.new.guest_name}) was cancelled by ${cancelledBy}`,
                );
                setRefreshTrigger((prev) => prev + 1);
                setTimeout(() => setRefreshTrigger((prev) => prev + 1), 500);
              }
            }

            // Instantly update the booking with all new data
            setBookings((prevBookings) => {
              return prevBookings.map((booking) => {
                if (booking.id === payload.new.id) {
                  return {
                    ...booking,
                    ...payload.new,
                    user_exists: booking.user_exists,
                  };
                }
                return booking;
              });
            });

            // Force refresh of all payment proof components when booking status changes
            setRefreshTrigger((prev) => prev + 1);
          } else if (payload.eventType === "INSERT" && payload.new) {
            // Immediate UI response - Add booking instantly to admin list
            const newBookingWithStatus = {
              ...payload.new,
              user_exists: true, // Optimistic user status for instant display
            } as Booking;

            setBookings((prevBookings) => {
              // Prevent duplicates - check if booking already exists
              const existingIndex = prevBookings.findIndex(
                (b) => b.id === payload.new.id,
              );

              if (existingIndex >= 0) {
                return prevBookings.map((booking, index) =>
                  index === existingIndex ? newBookingWithStatus : booking,
                );
              } else {
                // Add new booking and maintain proper sort order (newest first by created_at)
                const updatedBookings = [newBookingWithStatus, ...prevBookings];
                return updatedBookings.sort(
                  (a, b) =>
                    new Date(b.created_at || "").getTime() -
                    new Date(a.created_at || "").getTime(),
                );
              }
            });

            // Show instant visual alert for new bookings
            if (!document.hidden) {
              setNewBookingAlert(
                `New booking from ${payload.new.guest_name || "Guest"}! 🎉`,
              );
              setTimeout(() => setNewBookingAlert(null), 5000);
            }

            // Verify user status in background (non-blocking and safe)
            setTimeout(async () => {
              try {
                const { data: userData, error } = await supabase
                  .from("users")
                  .select("auth_id")
                  .eq("auth_id", payload.new.user_id)
                  .single();

                const userExists = !error && userData;

                // Update user_exists status if different
                if (!userExists) {
                  setBookings((prevBookings) =>
                    prevBookings.map((booking) =>
                      booking.id === payload.new.id
                        ? { ...booking, user_exists: false }
                        : booking,
                    ),
                  );
                }
              } catch (error) {
                console.warn(
                  "Failed to verify user status for new booking:",
                  error,
                );
              }
            }, 1000);
          } else if (payload.eventType === "DELETE" && payload.old) {
            // Remove deleted booking immediately from admin UI
            setBookings((prevBookings) => {
              return prevBookings.filter(
                (booking) => booking.id !== payload.old.id,
              );
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealTimeStatus("active");
          setLastRealTimeEvent(new Date().toISOString());
        }
      });

    // Set up real-time subscription for users (to detect user deletions)
    const usersSubscription = supabase
      .channel("users_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        () => {
          // When users are added/deleted, refresh bookings to update user_exists status
          setTimeout(() => {
            fetchBookings(false, true); // Silent sync - won't show loading state
          }, 500);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealTimeStatus("active");
          setLastRealTimeEvent(new Date().toISOString());
        }
      });

    // ✨ NEW: Real-time subscription for payment proofs - INSTANT verification/rejection updates
    const paymentProofsSubscription = supabase
      .channel("admin-payment-proofs-realtime", {
        config: {
          broadcast: { self: true },
          presence: { key: "admin-payment-reviews" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
        },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new && payload.old) {
            const { new: newProof, old: oldProof } = payload;

            // Check if status changed (verification/rejection)
            if (oldProof.status !== newProof.status) {
              // Show instant feedback for payment proof status changes
              const statusMessages = {
                verified: {
                  type: "success",
                  title: "✅ Payment Verified!",
                  message: `Payment proof for booking ${newProof.booking_id} approved`,
                },
                rejected: {
                  type: "warning",
                  title: "❌ Payment Rejected",
                  message: `Payment proof for booking ${newProof.booking_id} rejected`,
                },
                cancelled: {
                  type: "info",
                  title: "🚫 Payment Cancelled",
                  message: `Payment proof for booking ${newProof.booking_id} cancelled`,
                },
              };

              const statusInfo =
                statusMessages[newProof.status as keyof typeof statusMessages];
              if (statusInfo) {
                // Show toast notification for instant feedback
                if (newProof.status === "verified") {
                  success(statusInfo.title, statusInfo.message);
                } else if (newProof.status === "rejected") {
                  warning(statusInfo.title, statusInfo.message);
                } else if (newProof.status === "cancelled") {
                  warning(statusInfo.title, statusInfo.message); // Use warning for cancelled status
                } else {
                  showError(statusInfo.title, statusInfo.message);
                }
              }
            }

            // 🔥 CRITICAL: If modal is open for this booking, refresh it immediately with updated data
            if (
              showPaymentProofModal &&
              selectedBooking &&
              selectedBooking.id === newProof.booking_id
            ) {
              fetchPaymentHistory(newProof.booking_id);

              // Update the selected payment proof to reflect status change immediately
              if (
                selectedPaymentProof &&
                selectedPaymentProof.id === newProof.id
              ) {
                setSelectedPaymentProof(newProof as PaymentProof);
              }

              // Also fetch the latest payment proof to ensure we have the most current data
              (async () => {
                try {
                  const { data: latestProof } = await supabase
                    .from("payment_proofs")
                    .select("*")
                    .eq("booking_id", newProof.booking_id)
                    .order("uploaded_at", { ascending: false })
                    .limit(1)
                    .single();

                  if (latestProof) {
                    setSelectedPaymentProof(latestProof);
                  }
                } catch (error) {
                }
              })();
            }

            // Immediate UI refresh for payment proof status changes
            setRefreshTrigger((prev) => prev + 1);

            // Additional refresh for cancelled/rejected status
            if (
              newProof.status === "cancelled" ||
              newProof.status === "rejected"
            ) {
              setTimeout(() => setRefreshTrigger((prev) => prev + 1), 100);
            }
          }

          if (payload.eventType === "INSERT" && payload.new) {
            setLastRealTimeEvent(new Date().toISOString());

            // Show immediate visual alert for new payment proof
            if (!document.hidden) {
              success(
                "🎉 Payment Proof Uploaded!",
                `New payment proof received for booking ${payload.new.booking_id} - Ready for review!`,
              );

              // Also show browser notification if permitted
              if (Notification.permission === "granted") {
                new Notification("New Payment Proof Uploaded!", {
                  body: `Booking ${payload.new.booking_id} uploaded payment proof`,
                  icon: "/favicon.ico",
                  tag: `payment-proof-${payload.new.booking_id}`,
                });
              }
            }

            // INSTANT UI updates - Update booking to show "Payment Review" status immediately
            setBookings((prevBookings) => {
              return prevBookings.map((booking) => {
                if (booking.id === payload.new.booking_id) {
                  return {
                    ...booking,
                    payment_status: "payment_review",
                    updated_at: new Date().toISOString(),
                  };
                }
                return booking;
              });
            });

            // 🔥 CRITICAL: If modal is open for this booking, refresh it immediately
            if (
              showPaymentProofModal &&
              selectedBooking &&
              selectedBooking.id === payload.new.booking_id
            ) {
              fetchPaymentHistory(payload.new.booking_id);

              // Update the selected payment proof to the new one IMMEDIATELY
              (async () => {
                try {
                  const { data: latestProof } = await supabase
                    .from("payment_proofs")
                    .select("*")
                    .eq("booking_id", payload.new.booking_id)
                    .order("uploaded_at", { ascending: false })
                    .limit(1)
                    .single();

                  if (latestProof) {
                    setSelectedPaymentProof(latestProof);
                  }
                } catch (error) {
                  console.error(
                    "Failed to update modal with latest proof:",
                    error,
                  );
                }
              })();
            }

            // Immediate UI refresh for all payment proof components
            setRefreshTrigger((prev) => prev + 1);

            // Multiple staged refreshes to ensure all components update
            setTimeout(() => setRefreshTrigger((prev) => prev + 1), 100);
            setTimeout(() => setRefreshTrigger((prev) => prev + 1), 300);
            setTimeout(() => setRefreshTrigger((prev) => prev + 1), 1000);

            // Background sync to ensure database consistency
            setTimeout(() => {
              fetchBookings(false, true); // Silent refresh to sync with database
            }, 500);
          }

          if (payload.eventType === "DELETE" && payload.old) {
            warning(
              "🗑️ Payment Proof Deleted",
              `Payment proof for booking ${payload.old.booking_id} was deleted`,
            );
            setRefreshTrigger((prev) => prev + 1);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealTimeStatus("active");
          setLastRealTimeEvent(new Date().toISOString());

          // Request notification permission if not already granted
          if (Notification.permission === "default") {
            Notification.requestPermission();
          }
        }
      });

    // Backup sync system for reliability
    const syncInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRealTime = lastRealTimeEvent
        ? now - new Date(lastRealTimeEvent).getTime()
        : 0;

      // Only sync if page is active and no recent real-time activity (and we actually have a last event)
      if (
        !document.hidden &&
        document.hasFocus() &&
        !loading &&
        !refreshing &&
        !isProcessing &&
        !paymentProofLoading &&
        lastRealTimeEvent &&
        timeSinceLastRealTime > 60000
      ) {
        setRealTimeStatus("degraded");
        fetchBookings(false, true);
      }
    }, 30000); // Every 30 seconds

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBookings(false, true);
      }
    };

    const handleFocus = () => {
      fetchBookings(false, true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Cleanup subscriptions on unmount
    return () => {
      clearTimeout(timer);
      clearInterval(syncInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      supabase.removeChannel(bookingsSubscription);
      supabase.removeChannel(usersSubscription);
      supabase.removeChannel(paymentProofsSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]); // Include statusFilter to avoid stale closure in fetchBookings sort function

  // Auto-complete confirmed bookings that have passed their checkout date
  useEffect(() => {
    const autoComplete = async () => {
      try {
        const session = await getFreshSession(supabase);
        if (!session?.access_token) return;

        const response = await fetch("/api/bookings/auto-complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.completedCount > 0) {
            fetchBookings(false, true);
          }
        }
      } catch {
        // Silent fail — auto-complete is non-critical
      }
    };

    const timer = setTimeout(autoComplete, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter bookings based on user preference AND search term
  useEffect(() => {
    let filtered = bookings;

    // First filter by deleted users preference
    if (!showDeletedUsers) {
      filtered = filtered.filter((booking) => booking.user_exists);
    }

    // Then filter by status or walk-in type
    if (statusFilter === "walk-in") {
      filtered = filtered.filter((booking) =>
        String(booking.special_requests || "").startsWith("[WALK-IN]"),
      );
    } else if (statusFilter !== "all") {
      filtered = filtered.filter(
        (booking) =>
          booking.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Then filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const searchUpper = searchTerm.toUpperCase().trim();

      filtered = filtered.filter((booking) => {
        // Search by formatted booking number (KB-0001, KB-10000, etc.)
        const bookingNumber = formatBookingNumber(booking.id);
        const matchesBookingNumber = bookingNumber.includes(searchUpper);

        // Parse booking number if user typed KB-0001 format
        const parsedId = parseBookingNumber(searchUpper);
        const matchesParsedBookingNumber = parsedId === booking.id;

        return (
          // Search by booking number formats
          matchesBookingNumber ||
          matchesParsedBookingNumber ||
          // Search by guest name
          booking.guest_name?.toLowerCase().includes(searchLower) ||
          // Search by guest email
          booking.guest_email?.toLowerCase().includes(searchLower) ||
          // Search by guest phone (remove spaces and dashes for better matching)
          booking.guest_phone
            ?.replace(/[\s-]/g, "")
            .includes(searchTerm.replace(/[\s-]/g, "")) ||
          // Search by raw booking ID
          booking.id.toString().includes(searchTerm.trim())
        );
      });
    }

    // Special sorting for cancelled filter - show most recent cancellations first
    if (statusFilter === "cancelled") {
      filtered = filtered.sort((a, b) => {
        // Sort cancelled bookings by created_at (newest first) regardless of who cancelled them
        return (
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime()
        );
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, showDeletedUsers, searchTerm, statusFilter]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBookings(filteredBookings.slice(startIndex, endIndex));
  }, [filteredBookings, currentPage, itemsPerPage]);

  // Reset to first page only when filter criteria change (not when data refreshes)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ✨ Enhanced refresh trigger for instant updates when payment proofs change
  useEffect(() => {
    if (refreshTrigger > 0) {
      // Skip initial render
      // No need to fetch bookings here - the individual components will update via their own subscriptions
      // This just ensures all components re-render with fresh data
    }
  }, [refreshTrigger]);

  // Fetch payment history for a booking
  const fetchPaymentHistory = async (bookingId: number) => {
    setPaymentHistoryLoading(true);
    try {
      const { getFreshSession } = await import("../../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        console.error("Authentication required for payment history");
        setPaymentHistory([]);
        setPaymentSummary(null);
        setPaymentHistoryLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/payment-history/${bookingId}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setPaymentHistory(data.paymentHistory || []);
        setPaymentSummary(data.paymentSummary || null);
      } else {
        console.error("Failed to fetch payment history:", data.error);
        setPaymentHistory([]);
        setPaymentSummary(null);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setPaymentHistory([]);
      setPaymentSummary(null);
    } finally {
      setPaymentHistoryLoading(false);
    }
  };

  const fetchBookings = async (isRefresh = false, silent = false) => {
    try {
      if (!silent) {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }

      // Step 1: Get all bookings with error handling
      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching bookings:", error);
        // Show user-friendly error message
        showError(
          `Failed to fetch bookings: ${error.message || "Unknown error"}`,
        );
        return;
      }

      // If no bookings, return early
      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      // Step 2: Get all unique user IDs from bookings
      const userIds = Array.from(
        new Set(bookingsData.map((booking) => booking.user_id).filter(Boolean)),
      );

      // Step 3: Single query to check which users exist (MUCH faster than N queries)
      let existingUserIds = new Set<string>();

      if (userIds.length > 0) {
        const { data: existingUsers, error: usersError } = await supabase
          .from("users")
          .select("auth_id")
          .in("auth_id", userIds);

        if (usersError) {
          console.warn(
            "⚠️ Error fetching users (continuing with default):",
            usersError,
          );
          // Continue with all users marked as existing
          existingUserIds = new Set(userIds);
        } else {
          existingUserIds = new Set(
            existingUsers
              ?.map((user) => user.auth_id)
              .filter((id): id is string => Boolean(id)) || [],
          );
        }
      }

      // Step 4: Add user_exists flag efficiently
      const bookingsWithUserStatus = bookingsData.map((booking) => ({
        ...booking,
        user_exists: existingUserIds.has(booking.user_id) || !booking.user_id, // Handle null user_id
      }));

      // Step 5: Sort bookings by workflow priority to put active bookings at the top
      // Get current filter to use in sorting (avoid stale closure)
      const currentStatusFilter = statusFilter;

      const sortedBookings = bookingsWithUserStatus.sort((a, b) => {
        // Get workflow statuses (we'll calculate them here for sorting)
        const statusA = a.status || "pending";
        const statusB = b.status || "pending";
        const paymentStatusA = a.payment_status || "pending";
        const paymentStatusB = b.payment_status || "pending";

        // Priority order: payment reviews > pending bookings > confirmed > completed > ALL cancelled (bottom)
        const getPriority = (
          status: string,
          paymentStatus: string,
          cancelledBy: string | null,
        ) => {
          // SPECIAL CASE: When viewing cancelled filter, all cancelled bookings get same priority for pure date sorting
          if (currentStatusFilter === "cancelled" && status === "cancelled") {
            return 90; // Same priority for all cancelled bookings when filtered
          }

          // CRITICAL: ALL cancelled bookings go to BOTTOM - no exceptions
          if (status === "cancelled") {
            if (cancelledBy === "user") {
              return 99; // Bottom - user cancelled
            } else if (cancelledBy === "admin") {
              return 98; // Bottom - admin cancelled (slightly above user cancelled)
            } else {
              return 97; // Bottom - other cancelled bookings
            }
          }

          // Payment reviews get TOP priority (only for non-cancelled bookings)
          if (
            status === "pending_verification" ||
            paymentStatus === "payment_review"
          )
            return 1; // Highest priority - needs review

          // Rejected payments need attention - second highest priority
          if (paymentStatus === "rejected") return 2; // High priority - rejected payments need action

          if (status === "pending") return 3; // Third priority - active bookings awaiting payment
          if (status === "confirmed") return 4; // Fourth priority - confirmed bookings
          if (status === "completed") return 5; // Fifth priority - completed stays

          return 6; // Other statuses
        };

        const priorityA = getPriority(statusA, paymentStatusA, a.cancelled_by);
        const priorityB = getPriority(statusB, paymentStatusB, b.cancelled_by);

        // If priorities are the same, sort by created_at (newest first)
        if (priorityA === priorityB) {
          const timeA = new Date(a.created_at || "").getTime();
          const timeB = new Date(b.created_at || "").getTime();
          return timeB - timeA; // Newest first
        }

        return priorityA - priorityB;
      });

      setBookings(sortedBookings as Booking[]);
    } catch (error) {
      console.error("💥 Unexpected error in fetchBookings:", error);
      // Enhanced error reporting
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      showError(`Failed to load bookings: ${errorMessage}`);
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Handle payment proof verification
  const handlePaymentProofAction = async (
    action: "approve" | "reject",
    proofId: number,
  ) => {
    // Prevent double-clicking
    if (paymentProofLoading) {
      return;
    }

    setPaymentProofLoading(true);

    try {
      // Skip user lookup to avoid hanging - use placeholder since API will handle admin permissions
      const user = {
        id: "admin-placeholder",
        email: "admin@kampoibayow.com",
      };

      // First, let's check if the payment proof exists
      const { data: existingProof, error: fetchError } = await supabase
        .from("payment_proofs")
        .select("*")
        .eq("id", proofId)
        .single();

      if (fetchError) {
        console.error("❌ Failed to fetch payment proof:", fetchError);
        throw new Error(`Payment proof not found: ${fetchError.message}`);
      }

      if (!existingProof) {
        console.error("❌ No payment proof found with ID:", proofId);
        throw new Error("Payment proof not found");
      }

      // Use API endpoint with admin permissions to bypass RLS issues
      // Import timeout utility
      const { withTimeout } = await import("../../utils/apiTimeout");

      // Add timeout to prevent hanging with enhanced error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Get fresh session — only refreshes if token is expired/expiring
      const { getFreshSession } = await import("../../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await withTimeout(
        fetch("/api/admin/verify-payment-proof", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            proofId: proofId,
            action: action,
            adminId: user.id,
            adminNotes: verificationNotes || null,
            rejectionReason:
              action === "reject"
                ? rejectionReason === "custom"
                  ? customRejectionReason
                  : rejectionReasons.find((r) => r.value === rejectionReason)
                      ?.label || null
                : null,
          }),
          signal: controller.signal,
        }),
        15000,
        "Payment proof verification timed out",
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();



      // Show success message first
      success(
        action === "approve"
          ? "Payment proof approved successfully!"
          : "Payment proof rejected successfully!",
      );

      // 🚀 CRITICAL: Trigger real-time component updates immediately BEFORE closing modal
      setRefreshTrigger((prev) => prev + 1);

      // 🔄 Refresh payment history to show updated data in modal
      if (existingProof?.booking_id) {
        await fetchPaymentHistory(existingProof.booking_id);
      }

      // Close modal after refreshing data
      setShowPaymentProofModal(false);
      setSelectedPaymentProof(null);
      setVerificationNotes("");
      setRejectionReason("");
      setCustomRejectionReason("");

      // Force refresh data with retry mechanism
      try {
        await fetchBookings(true); // Force refresh bookings
        // Trigger another update after data refresh to ensure all components refresh
        setTimeout(() => setRefreshTrigger((prev) => prev + 1), 500);
      } catch (refreshError) {
        console.warn("⚠️ Bookings refresh failed, will retry:", refreshError);
        // Retry once more after a short delay
        setTimeout(async () => {
          try {
            await fetchBookings(true);
            // Trigger refresh after retry
            setRefreshTrigger((prev) => prev + 1);
          } catch (retryError) {
            console.error("❌ Bookings refresh failed on retry:", retryError);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("💥 Error in handlePaymentProofAction:", error);

      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage =
            "Request timed out. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      showError(
        `Error updating payment proof: ${errorMessage}. Please try again.`,
      );

      // Don't close modal on error, let user retry
    } finally {
      setPaymentProofLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-600";
      case "pending":
        return "bg-yellow-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    // Optimistic update - immediately update UI for instant feedback
    setBookings((prevBookings) =>
      prevBookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking,
      ),
    );

    try {
      if (newStatus === "confirmed") {
        const { getFreshSession } = await import("../../utils/apiTimeout");
        const session = await getFreshSession(supabase);
        if (!session?.access_token) {
          throw new Error("Authentication required. Please log in again.");
        }

        // Use the new API route that sends email notifications
        const response = await fetch("/api/admin/confirm-booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ bookingId }),
        });

        const result = await response.json();

        if (result.success) {
          // Use API message which includes email/SMS notification status
          success(result.message || "Booking confirmed and user notified");
        } else {
          throw new Error(result.error || "Failed to confirm booking");
        }
      } else {
        // For other status updates, use the original method
        const updateData: {
          status: string;
          cancelled_by?: string;
          cancelled_at?: string;
          cancellation_reason?: string;
        } = { status: newStatus };

        // If cancelling, add cancellation tracking
        if (newStatus === "cancelled") {
          // Store Philippines time (UTC+8) correctly
          const now = new Date();
          const utcTime = now.getTime();
          const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
          const philippinesTime = new Date(utcTime + philippinesOffset);

          updateData.cancelled_by = "admin";
          updateData.cancelled_at = philippinesTime.toISOString();
          updateData.cancellation_reason = "Cancelled by administrator";
        }

        const { error } = await supabase
          .from("bookings")
          .update(updateData)
          .eq("id", bookingId);

        if (error) {
          throw new Error(error.message);
        }

        success("Booking status updated successfully");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      showError(
        `Error updating booking status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      // Revert optimistic update on error
      fetchBookings(true);
    }
  };

  const handleManualRefresh = async () => {
    if (isManualRefreshing) return;

    setIsManualRefreshing(true);

    try {
      await fetchBookings(true);
      setLastRealTimeEvent(new Date().toISOString());
      success("Bookings refreshed successfully");
    } catch {
      showError("Failed to refresh bookings. Please try again.");
    } finally {
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 500);
    }
  };

  const handleAdminCancelBooking = async (
    bookingId: number,
    shouldRefund: boolean = false,
  ) => {
    if (!adminCancellationReason.trim()) {
      warning("Please provide a reason for cancellation");
      return;
    }

    // Show confirmation state instead of browser confirm
    if (!showConfirmCancel) {
      setShowConfirmCancel(true);
      return;
    }

    setIsProcessing(true);
    try {
      // Process refund first if requested and payment exists
      let refundResponse = null;
      const booking = bookings.find((b) => b.id === bookingId);

      if (
        shouldRefund &&
        booking?.payment_status === "paid" &&
        booking?.payment_intent_id
      ) {

        try {
          const refundApiResponse = await fetch(
            "/api/paymongo/process-refund",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                bookingId: booking.id,
                reason: adminCancellationReason || "Cancelled by administrator",
                refundType: "full", // Admin can give full refund
                processedBy: "admin",
              }),
            },
          );

          if (refundApiResponse.ok) {
            refundResponse = await refundApiResponse.json();
          } else {
            const refundErrorText = await refundApiResponse.text();
            console.error("❌ Refund processing failed:", refundErrorText);

            try {
              const refundErrorData = JSON.parse(refundErrorText);

              if (refundErrorData.requires_manual_processing) {
                // Show a more user-friendly message for amount limits
                const { refund_amount, max_amount } = refundErrorData;
                warning(
                  `PayMongo Test Mode Limit`,
                  `Booking amount: ₱${refund_amount.toLocaleString()} exceeds PayMongo TEST MODE limit of ₱${max_amount.toLocaleString()}. For ₱9K-₱12K bookings, switch to LIVE MODE or process refund manually. This limit only applies to test mode.`,
                );
              } else if (
                refundErrorData.error &&
                refundErrorData.error.includes("payment_id")
              ) {
                warning(
                  "Payment Processing Error",
                  "Unable to process automatic refund. Please handle the refund manually through PayMongo dashboard.",
                );
              } else {
                warning(
                  "Refund Failed",
                  "Booking will be cancelled but automatic refund failed. Please process the refund manually.",
                );
              }
            } catch {
              warning(
                "Refund Failed",
                "Booking will be cancelled but automatic refund failed. Please process the refund manually.",
              );
            }
          }
        } catch (refundError) {
          console.error("❌ Refund API error:", refundError);
          warning(
            "Booking will be cancelled but refund failed. Please process manually.",
          );
        }
      }

      // Calculate refund amount based on actual amount paid
      const refundAmount = shouldRefund ? paymentSummary?.totalPaid || 0 : 0;

      const { getFreshSession } = await import("../../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showError("Authentication required. Please log in again.");
        setIsProcessing(false);
        return;
      }

      // Cancel the booking
      const response = await fetch("/api/admin/cancel-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId,
          refundProcessed: shouldRefund,
          refundAmount: refundAmount,
          cancellationReason: adminCancellationReason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Use API message which includes email/SMS notification status
        const message =
          result.message ||
          (shouldRefund
            ? `Booking cancelled and ₱${refundAmount.toLocaleString()} refund marked for processing. User notified.`
            : "Booking cancelled and user notified.");
        success(message);
        fetchBookings(); // Refresh the list
        closeModal();
      } else {
        throw new Error(result.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error:", error);
      showError(
        `Error cancelling booking: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = async (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
    // Fetch payment history to get actual paid amount
    await fetchPaymentHistory(booking.id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    setShowCancelModal(false);
    setAdminCancellationReason("");
    setShowConfirmCancel(false);
    setShouldRefund(false);
    setIsProcessing(false);
    setPaymentSummary(null); // Clear payment summary
    setPaymentHistory([]); // Clear payment history
    // Reset reschedule state
    setShowRescheduleModal(false);
    setRescheduleCheckIn("");
    setRescheduleCheckOut("");
    setRescheduleReason("");
    setRescheduleLoading(false);
  };

  // Admin reschedule handler
  const handleAdminReschedule = async () => {
    if (!selectedBooking || !rescheduleCheckIn || !rescheduleCheckOut) {
      warning("Please select both check-in and check-out dates");
      return;
    }

    // Validate not same dates
    const curIn = new Date(selectedBooking.check_in_date).toDateString();
    const curOut = new Date(selectedBooking.check_out_date).toDateString();
    if (
      new Date(rescheduleCheckIn).toDateString() === curIn &&
      new Date(rescheduleCheckOut).toDateString() === curOut
    ) {
      warning("New dates are the same as current dates");
      return;
    }

    setRescheduleLoading(true);
    try {
      const { getFreshSession } = await import("../../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showError("Authentication required. Please log in again.");
        setRescheduleLoading(false);
        return;
      }

      const response = await fetch("/api/admin/reschedule-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          newCheckIn: rescheduleCheckIn,
          newCheckOut: rescheduleCheckOut,
          adminId: session.user?.id || "admin",
          reason: rescheduleReason || "Rescheduled by admin",
        }),
      });

      const result = await response.json();

      if (result.success) {
        const pricingInfo = result.pricing;
        const msg = pricingInfo
          ? `Booking rescheduled! New amount: ₱${pricingInfo.newAmount.toLocaleString()} (${pricingInfo.nightsCount} night${pricingInfo.nightsCount > 1 ? "s" : ""})`
          : "Booking rescheduled successfully!";
        success(msg);
        fetchBookings();
        closeModal();
      } else {
        showError(result.error || "Failed to reschedule booking");
      }
    } catch (error) {
      console.error("Reschedule error:", error);
      showError("Network error — please try again");
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Pagination helpers
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredBookings.length);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () =>
    setCurrentPage(Math.min(totalPages, currentPage + 1));

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading bookings...</div>
      </div>
    );
  }

  const closePaymentProofModal = () => {
    setShowPaymentProofModal(false);
    setSelectedPaymentProof(null);
    setVerificationNotes("");
    setRejectionReason("");
    setCustomRejectionReason("");
    setImageZoomed(false);
    setPaymentHistory([]);
    setPaymentSummary(null);
    setShowPaymentHistory(false);
  };

  const handleViewPaymentProof = (proof: PaymentProof) => {
    setSelectedPaymentProof(proof);
    setShowPaymentProofModal(true);
  };

  return (
    <div>
      {/* Real-time Booking Alerts */}
      {newBookingAlert && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-pulse text-white ${
            newBookingAlert.includes("cancelled")
              ? "bg-red-500"
              : "bg-green-500"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {newBookingAlert.includes("cancelled") ? "💔" : "🎉"}
            </span>
            <span className="font-semibold">{newBookingAlert}</span>
          </div>
        </div>
      )}

      <AdminDashboardSummary />

      {/* Real-time Status Bar */}
      <div className="bg-white rounded-xl shadow-md mb-4 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Real-time Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  realTimeStatus === "active"
                    ? "bg-green-500"
                    : realTimeStatus === "degraded"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                } ${realTimeStatus === "active" ? "animate-pulse" : ""}`}
              ></div>
              <span className="text-sm font-medium text-gray-700">
                {realTimeStatus === "active"
                  ? "Real-time Active"
                  : realTimeStatus === "degraded"
                    ? "Sync Mode"
                    : realTimeStatus === "connecting"
                      ? "Connecting..."
                      : "Offline Mode"}
              </span>
            </div>

            {/* Last Update Indicator */}
            <div className="text-xs text-gray-500">
              {lastRealTimeEvent ? (
                <>
                  Last update:{" "}
                  {new Date(lastRealTimeEvent).toLocaleTimeString()}
                </>
              ) : (
                <>Awaiting updates...</>
              )}
            </div>

            {/* Smart Polling Indicator */}
            {realTimeStatus === "degraded" && (
              <div className="flex items-center gap-1 text-xs text-yellow-600">
                <svg
                  className="w-3 h-3 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Auto-sync active</span>
              </div>
            )}
          </div>

          {/* Manual Refresh Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className={`w-4 h-4 ${
                  isManualRefreshing ? "animate-spin" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isManualRefreshing ? "Refreshing..." : "Refresh"}
            </button>

            {/* System Status Info */}
            <div className="text-xs text-gray-400">
              {filteredBookings.length} booking
              {filteredBookings.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Performance Metrics and Real-time Activity Log */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>
                Subscriptions:{" "}
                {realTimeStatus === "active" ? "✅ Active" : "❌ Inactive"}
              </span>
              <span>
                Polling:{" "}
                {realTimeStatus === "degraded" ? "⚠️ Enabled" : "⏸️ Standby"}
              </span>
              <span>
                Events:{" "}
                {lastRealTimeEvent
                  ? `🟢 ${new Date(lastRealTimeEvent).toLocaleTimeString()}`
                  : "🔴 None"}
              </span>
              <span>Refresh Trigger: #{refreshTrigger}</span>
              <button
                onClick={() => {
                  setRefreshTrigger((prev) => prev + 1);
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Force Refresh
              </button>
            </div>
          </div>
        )}

        {/* Real-time Activity Indicator */}
        {refreshTrigger > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>
                Real-time update #{refreshTrigger} - Payment proof components
                refreshed at {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
        <BookingFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          showDeletedUsers={showDeletedUsers}
          bookings={bookings}
          filteredBookings={filteredBookings}
          refreshing={refreshing}
          onSearchTermChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onShowDeletedUsersChange={setShowDeletedUsers}
          onRefresh={() => fetchBookings(true)}
          onSuccess={success}
          onError={showError}
        />

        {/* Pagination Info */}
        {filteredBookings.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-800 font-medium">
            <div>
              Showing {startIndex + 1} to {endIndex} of{" "}
              {filteredBookings.length} bookings
            </div>
            <div>
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No bookings found</p>
            {!showDeletedUsers && bookings.length > 0 && (
              <p className="text-sm mt-2">
                All bookings are from deleted users. Check &quot;Show deleted
                user bookings&quot; to see them.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {paginatedBookings.map((booking) => (
                <div
                  key={`mobile-${booking.id}`}
                  className={`bg-white border rounded-lg p-4 shadow-sm ${
                    !booking.user_exists
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-700 text-xs">
                          {formatBookingNumber(booking.id)}
                        </span>
                        {booking.special_requests?.startsWith("[WALK-IN]") && (
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full inline-flex items-center gap-0.5">
                            <Footprints className="w-2.5 h-2.5" /> Walk-in
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 mt-1">
                        {booking.guest_name}
                      </h4>
                      {!booking.user_exists && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded">
                          User Deleted
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <SmartWorkflowStatusCell
                        booking={booking}
                        refreshKey={refreshTrigger}
                      />
                      <PaymentStatusCell
                        booking={booking}
                        refreshKey={refreshTrigger}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 text-xs">Check-in</p>
                      <p className="text-gray-900">
                        {formatDate(booking.check_in_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Check-out</p>
                      <p className="text-gray-900">
                        {formatDate(booking.check_out_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Guests</p>
                      <p className="text-gray-900">
                        {booking.number_of_guests}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Amount</p>
                      <p className="text-green-600 font-semibold">
                        ₱{booking.total_amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {booking.payment_status === "paid" || booking.payment_status === "verified"
                          ? "Paid"
                          : booking.payment_status === "payment_review"
                            ? "Under Review"
                            : booking.payment_type === "half"
                              ? "50% Down"
                              : "Pending"}
                      </p>
                    </div>
                  </div>

                  {booking.guest_email && (
                    <p className="text-xs text-gray-600 mb-2 truncate">
                      📧{" "}
                      <a
                        href={`mailto:${booking.guest_email}`}
                        className="text-blue-600"
                      >
                        {booking.guest_email}
                      </a>
                    </p>
                  )}
                  {booking.guest_phone && (
                    <p className="text-xs text-gray-600 mb-3">
                      📱{" "}
                      <a
                        href={`tel:${booking.guest_phone}`}
                        className="text-blue-600"
                      >
                        {displayPhoneNumber(booking.guest_phone)}
                      </a>
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openModal(booking)}
                      className="px-3 py-2 bg-indigo-500 text-white rounded-md text-xs hover:bg-indigo-600 text-center"
                    >
                      View Details
                    </button>
                    <PaymentProofButton
                      bookingId={booking.id}
                      booking={booking}
                      variant="modal"
                      onViewProof={async (proof) => {
                        setSelectedPaymentProof(proof);
                        setShowPaymentProofModal(true);
                        if (proof.id > 0) {
                          await fetchPaymentHistory(booking.id);
                        }
                      }}
                      refreshKey={refreshTrigger}
                    />
                    {(booking.status || "pending") === "pending" && (
                      <>
                        <SmartConfirmButton
                          booking={booking}
                          onConfirm={(bookingId) =>
                            updateBookingStatus(bookingId, "confirmed")
                          }
                          variant="modal"
                          refreshKey={refreshTrigger}
                        />
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowModal(true);
                            setShowCancelModal(true);
                          }}
                          className="px-3 py-2 bg-rose-500 text-white rounded-md text-xs hover:bg-rose-600 text-center"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600 text-sm">
                    <th className="p-2 w-20 text-center">#</th>
                    <th className="p-3 min-w-[160px]">Guest</th>
                    <th className="p-3 min-w-[180px]">Email</th>
                    <th className="p-3 min-w-[120px]">Contact</th>
                    <th className="p-3 min-w-[90px]">Check-in</th>
                    <th className="p-3 min-w-[90px]">Check-out</th>
                    <th className="p-3 w-16 text-center">Guests</th>
                    <th className="p-3 min-w-[100px]">Amount</th>
                    <th className="p-3 min-w-[120px]">Status</th>
                    <th className="p-3 min-w-[110px]">Payment</th>
                    <th className="p-3 min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className={`border-t hover:bg-gray-50 ${
                        !booking.user_exists ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="p-2 text-center">
                        <div className="font-mono font-bold text-blue-700 text-xs whitespace-nowrap">
                          {formatBookingNumber(booking.id)}
                          {booking.special_requests?.startsWith(
                            "[WALK-IN]",
                          ) && (
                            <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full inline-flex items-center gap-0.5">
                              <Footprints className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-black">
                        <div className="font-medium">
                          {booking.guest_name}
                          {!booking.user_exists && (
                            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                              User Deleted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-black text-sm">
                        {booking.guest_email ? (
                          <a
                            href={`mailto:${booking.guest_email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {booking.guest_email}
                          </a>
                        ) : (
                          <span className="text-gray-400">No email</span>
                        )}
                      </td>
                      <td className="p-3 text-black text-sm">
                        {booking.guest_phone ? (
                          <a
                            href={`tel:${booking.guest_phone}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {displayPhoneNumber(booking.guest_phone)}
                          </a>
                        ) : (
                          <span className="text-gray-400">No phone</span>
                        )}
                      </td>
                      <td className="p-3 text-black text-sm">
                        {formatDate(booking.check_in_date)}
                      </td>
                      <td className="p-3 text-black text-sm">
                        {formatDate(booking.check_out_date)}
                      </td>
                      <td className="p-3 text-black text-center">
                        {booking.number_of_guests}
                      </td>
                      <td className="p-3 text-black">
                        <div className="font-medium text-sm">
                          ₱{booking.total_amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.payment_status === "paid" || booking.payment_status === "verified"
                            ? booking.payment_type === "half" ? "50% Down" : "Paid"
                            : booking.payment_status === "payment_review"
                              ? "Under Review"
                              : booking.payment_type === "half"
                                ? "50% Down"
                                : "Pending"}
                        </div>
                        <AdminPaymentBreakdown bookingId={booking.id} totalAmount={booking.total_amount} paymentStatus={booking.payment_status || ""} paymentType={booking.payment_type ?? undefined} />
                      </td>
                      <td className="p-3">
                        <SmartWorkflowStatusCell
                          booking={booking}
                          refreshKey={refreshTrigger}
                        />
                      </td>
                      <td className="p-3">
                        <PaymentStatusCell
                          key={`payment-status-${
                            booking.id
                          }-${refreshTrigger}-${
                            booking.payment_status || "none"
                          }-${booking.status || "pending"}-${
                            booking.updated_at || "none"
                          }`}
                          booking={booking}
                          refreshKey={refreshTrigger}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          {/* Primary Actions Row */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => openModal(booking)}
                              className="h-6 px-2 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 flex items-center justify-center"
                              title="View booking details"
                            >
                              View
                            </button>

                            <PaymentProofButton
                              key={`proof-${booking.id}-${refreshTrigger}-${
                                booking.payment_status || "none"
                              }`}
                              bookingId={booking.id}
                              booking={booking}
                              onViewProof={async (proof) => {
                                setSelectedPaymentProof(proof);
                                setShowPaymentProofModal(true);
                                if (proof.id > 0) {
                                  // Only fetch history for real proofs, not dummy ones
                                  await fetchPaymentHistory(booking.id);

                                  // Fetch the correct payment proof using priority logic
                                  try {
                                    const { data: allProofs } = await supabase
                                      .from("payment_proofs")
                                      .select("*")
                                      .eq("booking_id", booking.id)
                                      .order("uploaded_at", {
                                        ascending: false,
                                      });

                                    if (allProofs && allProofs.length > 0) {
                                      // Priority: pending > verified > rejected > cancelled
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
                                      setSelectedPaymentProof(prioritizedProof);
                                    }
                                  } catch (error) {
                                  }
                                }
                              }}
                              refreshKey={refreshTrigger}
                            />
                          </div>

                          {/* Secondary Actions Row - Only for pending bookings */}
                          {(booking.status || "pending") === "pending" && (
                            <div className="flex gap-1">
                              <SmartConfirmButton
                                booking={booking}
                                onConfirm={(bookingId) =>
                                  updateBookingStatus(bookingId, "confirmed")
                                }
                                refreshKey={refreshTrigger}
                              />
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowModal(true);
                                  setShowCancelModal(true);
                                }}
                                className="h-6 px-2 py-1 bg-rose-500 text-white rounded text-xs hover:bg-rose-600 flex items-center justify-center"
                                title="Cancel booking"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Controls */}
        <BookingPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredBookings.length}
          onGoToPage={goToPage}
          onGoToFirstPage={goToFirstPage}
          onGoToLastPage={goToLastPage}
          onGoToPreviousPage={goToPreviousPage}
          onGoToNextPage={goToNextPage}
        />
      </div>

      {/* Booking Detail Modal */}
      {showModal && selectedBooking && (
        <BookingDetailModal
          selectedBooking={selectedBooking}
          showCancelModal={showCancelModal}
          showRescheduleModal={showRescheduleModal}
          showConfirmCancel={showConfirmCancel}
          shouldRefund={shouldRefund}
          isProcessing={isProcessing}
          adminCancellationReason={adminCancellationReason}
          rescheduleCheckIn={rescheduleCheckIn}
          rescheduleCheckOut={rescheduleCheckOut}
          rescheduleReason={rescheduleReason}
          rescheduleLoading={rescheduleLoading}
          refreshTrigger={refreshTrigger}
          paymentSummary={paymentSummary}
          onClose={closeModal}
          onSetShowCancelModal={setShowCancelModal}
          onSetShowRescheduleModal={setShowRescheduleModal}
          onSetShowConfirmCancel={setShowConfirmCancel}
          onSetShouldRefund={setShouldRefund}
          onSetAdminCancellationReason={setAdminCancellationReason}
          onSetRescheduleCheckIn={setRescheduleCheckIn}
          onSetRescheduleCheckOut={setRescheduleCheckOut}
          onSetRescheduleReason={setRescheduleReason}
          onUpdateBookingStatus={updateBookingStatus}
          onAdminCancelBooking={handleAdminCancelBooking}
          onAdminReschedule={handleAdminReschedule}
          onViewPaymentProof={handleViewPaymentProof}
          fetchPaymentHistory={fetchPaymentHistory}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Payment Proof Modal */}
      {showPaymentProofModal && selectedPaymentProof && (
        <PaymentProofModal
          selectedPaymentProof={selectedPaymentProof}
          selectedBooking={selectedBooking}
          paymentHistory={paymentHistory}
          paymentHistoryLoading={paymentHistoryLoading}
          showPaymentHistory={showPaymentHistory}
          paymentSummary={paymentSummary}
          paymentProofLoading={paymentProofLoading}
          imageZoomed={imageZoomed}
          verificationNotes={verificationNotes}
          rejectionReason={rejectionReason}
          customRejectionReason={customRejectionReason}
          rejectionReasons={rejectionReasons}
          onClose={closePaymentProofModal}
          onSetShowPaymentHistory={setShowPaymentHistory}
          onSetImageZoomed={setImageZoomed}
          onSetVerificationNotes={setVerificationNotes}
          onSetRejectionReason={setRejectionReason}
          onSetCustomRejectionReason={setCustomRejectionReason}
          onPaymentProofAction={handlePaymentProofAction}
          onShowError={showError}
        />
      )}
    </div>
  );
}
