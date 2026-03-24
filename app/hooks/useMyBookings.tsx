"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { isMaintenanceMode } from "../utils/maintenanceMode";
import {
  checkAndExpirePendingBookings,
  getUserBookingStats,
  BookingStats,
} from "../utils/bookingUtils";
import { useToast } from "../components/Toast";
import { Tables } from "../../database.types";
import {
  CheckCircle,
  XCircle,
  Clock,
  HourglassIcon,
} from "lucide-react";

type Booking = Tables<"bookings">;

export function useMyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [maintenanceActive, setMaintenanceActive] = useState(false);

  // Track bookings with pending payment proofs (block reschedule)
  const [bookingsWithPendingProofs, setBookingsWithPendingProofs] = useState<Set<number>>(new Set());

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newCheckInDate, setNewCheckInDate] = useState("");
  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true); // Default to calendar view

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 bookings per page
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);

  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Handle payment upload success message callback
  const handlePaymentUploaded = () => {
    showToast({
      type: "success",
      title: "Payment Proof Uploaded!",
      message:
        "Your payment proof has been submitted successfully. We'll verify it within 24 hours.",
      duration: 5000,
    });
    setRefreshTrigger((prev) => prev + 1); // Force refresh bookings data
  };

  // Note: Removed window focus refresh to prevent loading states when Alt+Tabbing
  // Real-time subscriptions handle updates automatically, so manual refresh on focus is not needed

  // Load maintenance mode settings
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const isActive = await isMaintenanceMode();
        setMaintenanceActive(isActive);
      } catch (error) {
        console.error("Error checking maintenance mode:", error);
        setMaintenanceActive(false);
      }
    };

    checkMaintenanceMode();

    // Listen for settings changes from admin panel
    const handleSettingsChange = () => {
      checkMaintenanceMode();
    };

    // Check every 5 seconds for maintenance mode changes
    const interval = setInterval(checkMaintenanceMode, 5000);

    // Listen for custom events from admin settings
    window.addEventListener("maintenanceSettingsChanged", handleSettingsChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "maintenanceSettingsChanged",
        handleSettingsChange
      );
    };
  }, []);

  // ⚡ ENHANCED: Real-time subscriptions for instant user booking updates
  useEffect(() => {
    if (!user) return;


    // Set up real-time subscription for user's bookings
    const userBookingsSubscription = supabase
      .channel(`user-bookings-${user.id}`, {
        config: {
          broadcast: { self: true },
          presence: { key: `user-${user.id}` },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {

          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "UPDATE" && newRecord) {

            // Update booking in state instantly and re-sort by status priority
            const statusPriority: Record<string, number> = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
            setBookings((prevBookings) => {
              const updated = prevBookings.map((booking) =>
                booking.id === newRecord.id
                  ? { ...booking, ...newRecord }
                  : booking
              );
              return updated.sort((a, b) => {
                const aPriority = statusPriority[a.status ?? ""] ?? 1;
                const bPriority = statusPriority[b.status ?? ""] ?? 1;
                if (aPriority !== bPriority) return aPriority - bPriority;
                return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
              });
            });

            // Handle payment_status changes (verified/rejected by admin)
            // Check newRecord directly — oldRecord may not include payment_status depending on REPLICA IDENTITY
            const paymentStatus = newRecord.payment_status as string;
            if (paymentStatus === "verified" || paymentStatus === "rejected") {
              // Staged refreshes to ensure payment proof components pick up the change
              setRefreshTrigger((prev) => prev + 1);
              setTimeout(() => setRefreshTrigger((prev) => prev + 1), 500);
              setTimeout(() => setRefreshTrigger((prev) => prev + 1), 1500);

              const paymentStatusMessages: Record<string, { title: string; message: string; type: "success" | "error" | "info" }> = {
                verified: {
                  title: "Payment Verified!",
                  message: "Your payment proof has been approved by admin",
                  type: "success",
                },
                rejected: {
                  title: "Payment Rejected",
                  message: "Your payment proof was rejected. Please check details and resubmit.",
                  type: "error",
                },
              };

              const statusInfo = paymentStatusMessages[paymentStatus];
              if (statusInfo) {
                showToast({
                  type: statusInfo.type,
                  title: statusInfo.title,
                  message: statusInfo.message,
                  duration: 5000,
                });
              }
            }

            // Update stats instantly when status changes
            if (oldRecord && oldRecord.status !== newRecord.status) {
              setBookingStats((prevStats) => {
                if (!prevStats) return prevStats;

                let pendingDelta = 0;
                let confirmedDelta = 0;
                let cancelledDelta = 0;

                // Calculate deltas based on status change
                if (
                  oldRecord.status === "pending" &&
                  newRecord.status !== "pending"
                ) {
                  pendingDelta = -1;
                }
                if (
                  oldRecord.status !== "pending" &&
                  newRecord.status === "pending"
                ) {
                  pendingDelta = 1;
                }
                if (
                  oldRecord.status === "confirmed" &&
                  newRecord.status !== "confirmed"
                ) {
                  confirmedDelta = -1;
                }
                if (
                  oldRecord.status !== "confirmed" &&
                  newRecord.status === "confirmed"
                ) {
                  confirmedDelta = 1;
                }
                if (
                  oldRecord.status === "cancelled" &&
                  newRecord.status !== "cancelled"
                ) {
                  cancelledDelta = -1;
                }
                if (
                  oldRecord.status !== "cancelled" &&
                  newRecord.status === "cancelled"
                ) {
                  cancelledDelta = 1;
                }

                const updatedStats = {
                  ...prevStats,
                  pendingCount: Math.max(
                    0,
                    prevStats.pendingCount + pendingDelta
                  ),
                  confirmedCount: Math.max(
                    0,
                    prevStats.confirmedCount + confirmedDelta
                  ),
                  cancelledCount: Math.max(
                    0,
                    prevStats.cancelledCount + cancelledDelta
                  ),
                };

                updatedStats.canCreatePending = updatedStats.pendingCount < 3;

                return updatedStats;
              });

              const statusMessages = {
                confirmed: {
                  title: "Booking Confirmed!",
                  message: "Your booking has been confirmed by admin",
                },
                cancelled: {
                  title: "Booking Cancelled",
                  message: "Your booking has been cancelled by admin",
                },
                pending: {
                  title: "Booking Pending",
                  message: "Your booking is now pending review",
                },
              };

              const statusInfo =
                statusMessages[newRecord.status as keyof typeof statusMessages];
              if (statusInfo) {
                showToast({
                  type: newRecord.status === "confirmed" ? "success" : "info",
                  title: statusInfo.title,
                  message: statusInfo.message,
                  duration: 4000,
                });
              }
            }
          }

          if (eventType === "DELETE" && oldRecord) {
            setBookings((prevBookings) =>
              prevBookings.filter((booking) => booking.id !== oldRecord.id)
            );

            // Update stats when booking is deleted
            setBookingStats((prevStats) => {
              if (!prevStats) return prevStats;

              let pendingDelta = 0;
              let confirmedDelta = 0;
              let cancelledDelta = 0;

              if (oldRecord.status === "pending") pendingDelta = -1;
              if (oldRecord.status === "confirmed") confirmedDelta = -1;
              if (oldRecord.status === "cancelled") cancelledDelta = -1;

              const updatedStats = {
                ...prevStats,
                pendingCount: Math.max(
                  0,
                  prevStats.pendingCount + pendingDelta
                ),
                confirmedCount: Math.max(
                  0,
                  prevStats.confirmedCount + confirmedDelta
                ),
                cancelledCount: Math.max(
                  0,
                  prevStats.cancelledCount + cancelledDelta
                ),
              };

              updatedStats.canCreatePending = updatedStats.pendingCount < 3;

              return updatedStats;
            });

            showToast({
              type: "warning",
              title: "Booking Removed",
              message: "A booking was removed by admin",
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    // ✨ NEW: Real-time subscription for user's payment proofs - INSTANT verification/rejection updates
    const userPaymentProofsSubscription = supabase
      .channel(`user-payment-proofs-${user.id}`, {
        config: {
          broadcast: { self: true },
          presence: { key: `user-payment-${user.id}` },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {

          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "UPDATE" && newRecord && oldRecord) {
            // Check if status changed (admin verified/rejected payment)
            if (oldRecord.status !== newRecord.status) {

              // ⚡ FORCE COMPONENT REFRESH - Critical for real-time UI updates
              setRefreshTrigger((prev) => prev + 1);

              // Show instant status change notification
              const statusMessages = {
                verified: {
                  title: "Payment Verified!",
                  message: "Your payment proof has been approved by admin",
                },
                rejected: {
                  title: "Payment Rejected",
                  message:
                    "Your payment proof was rejected. Please check details and resubmit.",
                },
                cancelled: {
                  title: "Payment Cancelled",
                  message: "Your payment proof was cancelled",
                },
              };

              const statusInfo =
                statusMessages[newRecord.status as keyof typeof statusMessages];
              if (statusInfo) {
                showToast({
                  type:
                    newRecord.status === "verified"
                      ? "success"
                      : newRecord.status === "rejected"
                      ? "error"
                      : "info",
                  title: statusInfo.title,
                  message: statusInfo.message,
                  duration: 5000,
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      userBookingsSubscription.unsubscribe();
      userPaymentProofsSubscription.unsubscribe();
    };
  }, [user, showToast, setRefreshTrigger]);

  // Broadcast listener for instant booking updates (reschedule, etc.)
  const bookingIds = bookings.map((b) => b.id).join(",");
  useEffect(() => {
    if (!user || bookings.length === 0) return;

    const channels = bookings.map((booking) =>
      supabase
        .channel(`booking-update-${booking.id}`)
        .on("broadcast", { event: "booking-changed" }, async () => {
          // Re-fetch this specific booking
          const { data } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", booking.id)
            .single();
          if (data) {
            const statusPri: Record<string, number> = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
            setBookings((prev) => {
              const updated = prev.map((b) => (b.id === data.id ? (data as Booking) : b));
              return updated.sort((a, b) => {
                const ap = statusPri[a.status ?? ""] ?? 1;
                const bp = statusPri[b.status ?? ""] ?? 1;
                if (ap !== bp) return ap - bp;
                return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
              });
            });
            setRefreshTrigger((prev) => prev + 1);
          }
        })
        .subscribe()
    );

    return () => {
      channels.forEach((ch) => ch.unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, bookingIds]);

  useEffect(() => {
    async function loadBookings() {
      if (!user) return;

      setIsRefreshing(true);

      // First, check and auto-cancel any pending bookings older than 7 days
      try {
        await checkAndExpirePendingBookings();
      } catch (error) {
        console.error("Error checking pending bookings:", error);
      }

      // Note: Auto-complete and cleanup are handled server-side via cron jobs

      // Load booking stats
      try {
        const stats = await getUserBookingStats(user.id);
        setBookingStats(stats);
      } catch (error) {
        console.error("Error loading booking stats:", error);
      }

      // Then load all bookings (including any newly auto-cancelled ones)
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading bookings:", error);
      } else {
        // Sort by status priority: confirmed first, then pending, then cancelled
        const statusPriority: Record<string, number> = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
        const sorted = ((data as Booking[]) || []).sort((a, b) => {
          const aPriority = statusPriority[a.status ?? ""] ?? 1;
          const bPriority = statusPriority[b.status ?? ""] ?? 1;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        });
        setBookings(sorted);

        // Check which bookings have pending payment proofs (to block reschedule)
        const bookingIds = (data || []).map((b: Booking) => b.id);
        if (bookingIds.length > 0) {
          const { data: pendingProofs } = await supabase
            .from('payment_proofs')
            .select('booking_id')
            .in('booking_id', bookingIds)
            .eq('status', 'pending');

          const pendingSet = new Set((pendingProofs || []).map((p: { booking_id: number }) => p.booking_id));
          setBookingsWithPendingProofs(pendingSet);
        }
      }
      setLoading(false);
      setIsRefreshing(false);
    }

    if (user) {
      loadBookings();
    }
  }, [user, refreshTrigger]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBookings(bookings.slice(startIndex, endIndex));
  }, [bookings, currentPage, itemsPerPage]);

  // Reset to first page when bookings change
  useEffect(() => {
    setCurrentPage(1);
  }, [bookings]);

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    setShowCancelModal(false);
    setCancellationReason("");
    setShowRescheduleModal(false);
    setNewCheckInDate("");
    setNewCheckOutDate("");
    setShowCalendar(false);
  };

  // Pagination helpers
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, bookings.length);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () =>
    setCurrentPage(Math.min(totalPages, currentPage + 1));

  const canCancelBooking = (booking: Booking) => {
    if (!booking.status || booking.status.toLowerCase() === "cancelled") {
      return false;
    }

    // Always allow cancellation if booking is pending
    if (booking.status.toLowerCase() === "pending") {
      return true;
    }

    // For confirmed bookings, check if it's at least 3 days before check-in
    if (booking.status.toLowerCase() === "confirmed") {
      const checkInDate = new Date(booking.check_in_date);
      const now = new Date();
      const timeDifference = checkInDate.getTime() - now.getTime();
      const daysDifference = timeDifference / (1000 * 3600 * 24);

      return daysDifference >= 3;
    }

    return false;
  };

  const canRescheduleBooking = (booking: Booking) => {
    // Only confirmed bookings with verified payment can reschedule
    if (booking.status?.toLowerCase() !== "confirmed") {
      return false;
    }
    if (booking.payment_status !== "paid" && booking.payment_status !== "verified") {
      return false;
    }
    // Can't reschedule if has pending payment proofs (wait for admin to verify/reject first)
    if (bookingsWithPendingProofs.has(booking.id)) {
      return false;
    }
    // Max 2 reschedules per booking
    if ((booking.reschedule_count || 0) >= 2) {
      return false;
    }
    // Check if it's at least 3 days before check-in
    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const daysDifference = (checkInDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return daysDifference >= 3;
  };

  const getCancellationMessage = (booking: Booking) => {
    if (booking.status?.toLowerCase() === "pending") {
      return "Cancel this pending booking";
    }

    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const timeDifference = checkInDate.getTime() - now.getTime();
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    if (daysDifference < 3) {
      return `Cannot cancel: Less than 3 days until check-in (${Math.floor(
        daysDifference
      )} day${Math.floor(daysDifference) !== 1 ? "s" : ""} remaining)`;
    }

    return `Cancel booking (${Math.floor(
      daysDifference
    )} days until check-in)`;
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!cancellationReason.trim()) {
      showToast({
        type: "warning",
        title: "Cancellation Reason Required",
        message: "Please provide a reason for cancellation before proceeding.",
        duration: 4000,
      });
      return;
    }

    // ⚡ ULTRA-FAST cancellation with proper data capture

    // Capture reason before clearing (prevent stale closure)
    const reasonForServer = cancellationReason.trim();

    // Store original booking state for potential revert
    const originalBooking = bookings.find((b) => b.id === bookingId);

    // 1. INSTANT UI UPDATE - User sees immediate response
    const instantUpdatedBookings = bookings.map((booking) =>
      booking.id === bookingId
        ? {
            ...booking,
            status: "cancelled",
            cancelled_by: "user",
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reasonForServer,
          }
        : booking
    );
    setBookings(instantUpdatedBookings);

    // 2. INSTANT STATS UPDATE - Update booking stats immediately
    if (bookingStats && originalBooking?.status === "pending") {
      const updatedStats = {
        ...bookingStats,
        pendingCount: Math.max(0, bookingStats.pendingCount - 1),
        cancelledCount: bookingStats.cancelledCount + 1,
        canCreatePending: bookingStats.pendingCount - 1 < 3,
      };
      setBookingStats(updatedStats);
    }

    // 3. INSTANT modal close and cleanup
    setShowCancelModal(false);
    setCancellationReason("");

    // 4. INSTANT success feedback - No waiting for server!
    showToast({
      type: "success",
      title: "Booking Cancelled Successfully!",
      message: "Confirmation email will be sent to your inbox",
      duration: 4000,
    });

    // 5. Background server sync - User doesn't wait for this
    processServerCancellation(bookingId, reasonForServer, originalBooking);
  };

  // ⚡ Enhanced background server sync - Non-blocking and safe
  const processServerCancellation = async (
    bookingId: number,
    reason: string,
    originalBooking: Booking | undefined
  ) => {

    try {
      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        console.error("Authentication required for cancellation");
        return;
      }

      const response = await fetch("/api/user/cancel-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId,
          userId: user?.id,
          cancellationReason: reason,
        }),
      });

      const result = await response.json();

      if (result.success) {

        // Only show notifications for email issues, not for successful delivery
        if (result.warning) {
          showToast({
            type: "warning",
            title: "Email Issue",
            message: result.warning,
            duration: 4000,
          });
        } else if (!result.guestEmailSent && !result.adminEmailSent) {
          showToast({
            type: "warning",
            title: "Email Issue",
            message:
              "Booking cancelled but confirmation email may not have been sent",
            duration: 4000,
          });
        } else if (!result.guestEmailSent || !result.adminEmailSent) {
          showToast({
            type: "info",
            title: "Email Status",
            message: "Booking cancelled - some emails may have failed",
            duration: 3000,
          });
        }
        // For successful email delivery, we don't show additional toast (user already got instant confirmation)

        // Refresh data silently to ensure full sync (including updated stats)
        refreshBookingsInBackground();
      } else {
        console.error("❌ Server sync failed:", result.error);

        // SAFE REVERT: Restore original booking state AND stats
        if (originalBooking) {
          const revertedBookings = bookings.map((booking) =>
            booking.id === bookingId ? originalBooking : booking
          );
          setBookings(revertedBookings);

          // Revert stats if it was a pending booking
          if (bookingStats && originalBooking.status === "pending") {
            const revertedStats = {
              ...bookingStats,
              pendingCount: bookingStats.pendingCount + 1,
              cancelledCount: Math.max(0, bookingStats.cancelledCount - 1),
              canCreatePending: bookingStats.pendingCount + 1 < 3,
            };
            setBookingStats(revertedStats);
          }

          showToast({
            type: "error",
            title: "Cancellation Issue",
            message: "Server sync failed. Your booking is still active.",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("🔥 Network error during server sync:", error);

      // SAFE REVERT: Network issue - restore original state AND stats
      if (originalBooking) {
        const revertedBookings = bookings.map((booking) =>
          booking.id === bookingId ? originalBooking : booking
        );
        setBookings(revertedBookings);

        // Revert stats if it was a pending booking
        if (bookingStats && originalBooking.status === "pending") {
          const revertedStats = {
            ...bookingStats,
            pendingCount: bookingStats.pendingCount + 1,
            cancelledCount: Math.max(0, bookingStats.cancelledCount - 1),
            canCreatePending: bookingStats.pendingCount + 1 < 3,
          };
          setBookingStats(revertedStats);
        }

        showToast({
          type: "error",
          title: "Connection Issue",
          message:
            "Network error - your booking is still active. Please try again.",
          duration: 5000,
        });
      }
    }
  };

  // Reschedule handlers
  const handleOpenReschedule = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewCheckInDate(""); // Reset dates
    setNewCheckOutDate("");
    setShowRescheduleModal(true);
  };

  const handleCalendarDateSelect = (checkIn: string, checkOut: string) => {
    setNewCheckInDate(checkIn);
    setNewCheckOutDate(checkOut);
  };

  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !newCheckInDate || !newCheckOutDate) {
      showToast({
        type: "warning",
        title: "Missing Information",
        message: "Please select both check-in and check-out dates",
        duration: 4000,
      });
      return;
    }

    // Validate dates
    const checkIn = new Date(newCheckInDate);
    const checkOut = new Date(newCheckOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if the new dates are the same as current booking dates
    const currentCheckIn = new Date(
      selectedBooking.check_in_date
    ).toDateString();
    const currentCheckOut = new Date(
      selectedBooking.check_out_date
    ).toDateString();
    const newCheckInString = checkIn.toDateString();
    const newCheckOutString = checkOut.toDateString();

    if (
      currentCheckIn === newCheckInString &&
      currentCheckOut === newCheckOutString
    ) {
      showToast({
        type: "warning",
        title: "Same Dates Selected",
        message:
          "The new dates are the same as your current booking. Please select different dates to reschedule.",
        duration: 5000,
      });
      return;
    }

    if (checkIn < today) {
      showToast({
        type: "warning",
        title: "Invalid Date",
        message: "Check-in date cannot be in the past",
        duration: 4000,
      });
      return;
    }

    if (checkOut <= checkIn) {
      showToast({
        type: "warning",
        title: "Invalid Date",
        message: "Check-out date must be after check-in date",
        duration: 4000,
      });
      return;
    }

    setRescheduleLoading(true);

    try {
      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showToast({
          type: "error",
          title: "Authentication Error",
          message: "You must be logged in to reschedule a booking.",
          duration: 5000,
        });
        setRescheduleLoading(false);
        return;
      }

      // Call backend API to reschedule
      const response = await fetch("/api/user/reschedule-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          newCheckIn: newCheckInDate,
          newCheckOut: newCheckOutDate,
          userId: user?.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state with actual payment status from API
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === selectedBooking.id
              ? {
                  ...booking,
                  check_in_date: newCheckInDate,
                  check_out_date: newCheckOutDate,
                  total_amount: result.booking.total_amount,
                  payment_status: result.booking.payment_status,
                  status: result.booking.status,
                  reschedule_count: result.booking.reschedule_count,
                }
              : booking
          )
        );

        // Close the reschedule modal first
        setShowRescheduleModal(false);
        setNewCheckInDate("");
        setNewCheckOutDate("");

        // Only redirect to upload page if user needs to pay more
        const alreadyFullyPaid = result.booking.payment_status === "verified";

        if (!alreadyFullyPaid && result.pricing) {
          const { newAmount, nightsCount } = result.pricing;

          showToast({
            type: "success",
            title: "Booking Rescheduled!",
            message: `Dates updated! New amount: ₱${newAmount.toLocaleString()} (${nightsCount} nights). Please upload payment for the remaining balance.`,
            duration: 5000,
          });

          // Redirect to payment upload only if they need to pay more
          setTimeout(() => {
            router.push(
              `/upload-payment-proof?bookingId=${selectedBooking.id}`
            );
          }, 1000);
        } else {
          showToast({
            type: "success",
            title: "Booking Rescheduled!",
            message: "Dates updated! Your previous payment already covers the new amount.",
            duration: 4000,
          });
        }
      } else {
        showToast({
          type: "error",
          title: "Reschedule Failed",
          message:
            result.error || "Could not reschedule booking. Please try again.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Reschedule error:", error);
      showToast({
        type: "error",
        title: "Network Error",
        message: "Please check your connection and try again",
        duration: 4000,
      });
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Background refresh function - non-blocking
  const refreshBookingsInBackground = async () => {
    try {
      if (user) {
        // Refresh both bookings and stats
        const [bookingsResult, statsResult] = await Promise.all([
          supabase
            .from("bookings")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          getUserBookingStats(user.id),
        ]);

        if (!bookingsResult.error && bookingsResult.data) {
          setBookings(bookingsResult.data as Booking[]);
        }

        if (statsResult) {
          setBookingStats(statsResult);
        }
      }
    } catch (error) {
      console.error("Background refresh error:", error);
      // Silent fail - don't show error to user
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "pending":
        return <HourglassIcon className="w-5 h-5 text-warning" />;
      case "cancelling":
        return (
          <div className="w-5 h-5 border-2 border-warning/30 border-t-warning rounded-full animate-spin"></div>
        );
      case "cancelled":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-success";
      case "pending":
        return "bg-warning";
      case "cancelling":
        return "bg-warning";
      case "cancelled":
        return "bg-destructive";
      case "completed":
        return "bg-primary";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status.toLowerCase()) {
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return {
    bookings, setBookings,
    user, authLoading,
    loading, setLoading,
    selectedBooking, setSelectedBooking,
    showModal, setShowModal,
    showCancelModal, setShowCancelModal,
    cancellationReason, setCancellationReason,
    bookingStats, setBookingStats,
    maintenanceActive, setMaintenanceActive,
    bookingsWithPendingProofs,
    showRescheduleModal, setShowRescheduleModal,
    newCheckInDate, setNewCheckInDate,
    newCheckOutDate, setNewCheckOutDate,
    rescheduleLoading, setRescheduleLoading,
    showCalendar, setShowCalendar,
    currentPage, setCurrentPage,
    itemsPerPage,
    paginatedBookings,
    refreshTrigger, setRefreshTrigger,
    isRefreshing,
    handlePaymentUploaded,
    openModal, closeModal,
    totalPages, startIndex, endIndex,
    goToPage, goToPreviousPage, goToNextPage,
    canCancelBooking, canRescheduleBooking, getCancellationMessage,
    handleCancelBooking,
    handleOpenReschedule, handleCalendarDateSelect, handleRescheduleBooking,
    refreshBookingsInBackground,
    getStatusIcon, getStatusColor, getStatusDisplayName,
  };
}
