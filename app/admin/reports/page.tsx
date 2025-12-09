"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminOnly } from "../../hooks/useRoleAccess";
import {
  Calendar,
  Download,
  TrendingUp,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  PhilippinePeso,
  Clock,
  Phone,
  Users,
} from "lucide-react";
import { supabase } from "@/app/supabaseClient";
import { Tables } from "@/database.types";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { useToast } from "../../components/Toast";

// Use the proper database type for bookings
type BookingRow = Tables<"bookings">;

const REPORT_TYPES = [
  {
    id: "daily-operations",
    name: "Daily Operations",
    description:
      "Today's check-ins, check-outs & current guests (staff planning)",
    icon: Clock,
    color: "blue",
  },
  {
    id: "guest-database",
    name: "Guest Database",
    description:
      "Customer list with contact info, visits & spending (for marketing)",
    icon: Users,
    color: "purple",
  },
  {
    id: "booking-status",
    name: "Booking Status Report",
    description:
      "All bookings by status - Paid, Pending, Cancelled (financial tracking)",
    icon: FileText,
    color: "green",
  },
];

export default function ReportsPage() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 10;

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("bookings")
        .select(
          "id, user_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, number_of_guests, total_amount, special_requests, brings_pet, status, created_at, updated_at, cancelled_by, cancelled_at, cancellation_reason, payment_intent_id, payment_status, payment_type, payment_amount, refund_id, refund_amount, refund_status, refund_reason, refund_processed_by, refund_processed_at"
        )
        .gte("check_in_date", startDate)
        .lte("check_in_date", endDate)
        .order("check_in_date", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (paymentStatusFilter !== "all") {
        query = query.eq("payment_status", paymentStatusFilter);
      }

      if (paymentMethodFilter !== "all") {
        query = query.eq("payment_type", paymentMethodFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setBookings(data || []);
      console.log(
        `📊 Filtered bookings: ${
          data?.length || 0
        } bookings from ${startDate} to ${endDate}`
      );
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    startDate,
    endDate,
    statusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
  ]);

  useEffect(() => {
    fetchBookings();
  }, [
    startDate,
    endDate,
    statusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    fetchBookings,
  ]);

  // 🎯 FILTERED BOOKINGS FOR CHARTS (respects date filters)
  const filteredBookings = bookings.filter((booking) => {
    const checkInDate = booking.check_in_date;
    const isInDateRange = checkInDate >= startDate && checkInDate <= endDate;
    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;
    const matchesPaymentStatus =
      paymentStatusFilter === "all" ||
      booking.payment_status === paymentStatusFilter;
    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      booking.payment_type === paymentMethodFilter;

    return (
      isInDateRange &&
      matchesStatus &&
      matchesPaymentStatus &&
      matchesPaymentMethod
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const confirmedBookings = filteredBookings.filter(
    (b) => b.status === "confirmed"
  );
  const totalRevenue = confirmedBookings.reduce(
    (sum, b) => sum + b.total_amount,
    0
  );

  // Pagination calculations using filtered bookings
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, statusFilter]);

  const exportReport = async () => {
    setIsExporting(true);
    try {
      if (filteredBookings.length === 0) {
        showToast({
          type: "warning",
          title: "No Data to Export",
          message:
            "Please adjust your date range or filters to include bookings.",
        });
        return;
      }

      // Add small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      let headers: string[] = [];
      let rows: string[][] = [];
      let filename = "";

      switch (selectedReport.id) {
        case "daily-operations":
          // Daily operational checklist - current and upcoming activities
          const today = new Date().toISOString().split("T")[0];
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

          // Include today's activities plus current guests and near-future arrivals
          console.log(`🏨 Daily Checklist Debug - Today: ${today}`);
          console.log(
            `📋 Total filtered bookings to check: ${filteredBookings.length}`
          );

          const operationalActivity = filteredBookings.filter((b) => {
            const checkIn = b.check_in_date;
            const checkOut = b.check_out_date;

            console.log(
              `🔍 Checking booking ${b.id}: ${b.guest_name} - Check-in: ${checkIn}, Check-out: ${checkOut}, Status: ${b.status}`
            );

            // REAL RESORT LOGIC: Current guests must be confirmed AND paid
            const isCurrentGuest =
              checkIn <= today &&
              checkOut > today &&
              b.status === "confirmed" &&
              (b.payment_status === "paid" || b.payment_status === "confirmed");

            // For operational planning, show confirmed + pending (but mark pending clearly)
            const isTodayCheckIn = checkIn === today;
            const isTodayCheckOut = checkOut === today;
            const isTomorrowCheckIn = checkIn === tomorrow;
            const isRecentCheckOut =
              checkOut === yesterday && b.status === "confirmed";

            const isOperationallyRelevant =
              isTodayCheckIn ||
              isTodayCheckOut ||
              isTomorrowCheckIn ||
              isCurrentGuest ||
              isRecentCheckOut;

            if (isOperationallyRelevant) {
              console.log(
                `✅ Including in daily checklist: ${b.guest_name} - Reason: ${
                  isTodayCheckIn
                    ? "Today Check-in"
                    : isTodayCheckOut
                    ? "Today Check-out"
                    : isTomorrowCheckIn
                    ? "Tomorrow Check-in"
                    : isCurrentGuest
                    ? "Current Guest"
                    : "Recent Check-out"
                }`
              );
            }

            return isOperationallyRelevant;
          });

          console.log(
            `📊 Daily checklist activities found: ${operationalActivity.length}`
          );

          if (operationalActivity.length === 0) {
            const nextBooking = filteredBookings.find(
              (b) => b.check_in_date > today
            );
            const daysUntilNext = nextBooking
              ? Math.ceil(
                  (new Date(nextBooking.check_in_date).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0;

            showToast({
              type: "info",
              title: `📋 Quiet Day - No Activities for ${today}`,
              message: nextBooking
                ? `Your next booking "${nextBooking.guest_name}" checks in on ${nextBooking.check_in_date} (${daysUntilNext} days from now). Use "Booking Schedule" to see future bookings.`
                : 'No upcoming bookings found. Use "Booking Schedule" report to see all future reservations.',
              duration: 6000,
            });
            return;
          }

          headers = [
            "Date",
            "Time",
            "Guest Name",
            "Phone",
            "Email",
            "Action Required",
            "Status",
            "Payment Status",
            "Amount",
            "Guests",
            "Special Requests",
            "Pet",
            "Booking ID",
            "Priority",
          ];
          rows = operationalActivity
            .map((booking) => {
              let actionDate, actionTime, action, priority;
              const isConfirmed = booking.status === "confirmed";
              const isPending = booking.status === "pending";

              if (booking.check_in_date === today) {
                actionDate = today;
                actionTime = "3:00 PM";
                if (isConfirmed) {
                  action = "🏨 GUEST ARRIVAL - Welcome & Check-in";
                  priority = "HIGH";
                } else if (isPending) {
                  action = "⚠️ PENDING ARRIVAL - Confirm Status";
                  priority = "HIGH";
                } else {
                  action = "❓ UNCERTAIN ARRIVAL - Check Status";
                  priority = "MEDIUM";
                }
              } else if (booking.check_out_date === today) {
                actionDate = today;
                actionTime = "1:00 PM";
                if (isConfirmed) {
                  action = "👋 GUEST DEPARTURE - Check-out & Farewell";
                  priority = "HIGH";
                } else {
                  action = "❓ UNCLEAR DEPARTURE - Verify Status";
                  priority = "MEDIUM";
                }
              } else if (booking.check_in_date === tomorrow) {
                actionDate = tomorrow;
                actionTime = "3:00 PM";
                if (isConfirmed) {
                  action = "📋 CONFIRMED ARRIVAL Tomorrow - Prepare Resort";
                  priority = "MEDIUM";
                } else if (isPending) {
                  action = "🕰️ PENDING ARRIVAL Tomorrow - Await Confirmation";
                  priority = "LOW";
                } else {
                  action = "❓ UNCERTAIN BOOKING Tomorrow - Check Status";
                  priority = "LOW";
                }
              } else if (
                booking.check_in_date <= today &&
                booking.check_out_date > today
              ) {
                actionDate = "Current";
                actionTime = "Ongoing";

                // REAL RESORT VALIDATION
                if (
                  isConfirmed &&
                  (booking.payment_status === "paid" ||
                    booking.payment_status === "confirmed")
                ) {
                  action = "🏖️ CURRENT GUEST - Monitor & Assist";
                  priority = "LOW";
                } else if (isConfirmed && booking.payment_status !== "paid") {
                  action = "⚠️ CURRENT GUEST - PAYMENT ISSUE! Collect payment";
                  priority = "HIGH";
                } else if (isPending) {
                  action =
                    "🚨 IMPOSSIBLE! Pending guest cannot be current - Fix booking status";
                  priority = "HIGH";
                } else {
                  action =
                    "🚨 STATUS ERROR - Guest at resort but booking unclear";
                  priority = "HIGH";
                }
              } else if (booking.check_out_date === yesterday && isConfirmed) {
                actionDate = yesterday;
                actionTime = "1:00 PM";
                action = "✅ RECENT DEPARTURE - Follow-up & Review";
                priority = "LOW";
              } else {
                actionDate = booking.check_in_date || booking.check_out_date;
                actionTime = "TBD";
                action = `📅 ${
                  booking.status?.toUpperCase() || "UNKNOWN"
                } BOOKING - Monitor`;
                priority = "LOW";
              }

              return [
                actionDate,
                actionTime,
                booking.guest_name,
                booking.guest_phone
                  ? String(booking.guest_phone)
                      .replace(/e\+/gi, "")
                      .replace(/^(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3")
                  : "No phone",
                booking.guest_email || "No email",
                action,
                booking.status || "pending",
                booking.payment_status || "unknown",
                `₱${
                  (booking.payment_amount || booking.total_amount)?.toFixed(
                    2
                  ) || "0.00"
                }`,
                (() => {
                  const guests = booking.number_of_guests || 0;
                  const warning = guests > 15 ? " ⚠️ HIGH CAPACITY" : "";
                  return `${guests} ${
                    guests === 1 ? "guest" : "guests"
                  }${warning}`;
                })(),
                booking.special_requests || "None",
                booking.brings_pet ? "Pet Friendly" : "No Pets",
                `KB-${String(booking.id).padStart(4, "0")}`,
                priority,
              ];
            })
            .sort((a, b) => {
              // Sort by priority: HIGH -> MEDIUM -> LOW
              const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
              return (
                priorityOrder[a[13] as keyof typeof priorityOrder] -
                priorityOrder[b[13] as keyof typeof priorityOrder]
              );
            });
          filename = `daily-checklist-${startDate}-to-${endDate}.csv`;
          break;

        case "guest-database":
          // Simple guest database for marketing and customer service
          const guestDatabase = new Map();

          // Build simple guest list
          filteredBookings.forEach((booking) => {
            if (booking.guest_name) {
              const key = booking.guest_email || booking.guest_name;
              if (!guestDatabase.has(key)) {
                guestDatabase.set(key, {
                  name: booking.guest_name,
                  email: booking.guest_email || "No email",
                  phone: booking.guest_phone || "No phone",
                  visits: 0,
                  spent: 0,
                });
              }
              const guest = guestDatabase.get(key);
              guest.visits += 1;
              guest.spent += booking.total_amount || 0;
            }
          });

          headers = [
            "Guest Name",
            "Email",
            "Phone",
            "Total Visits",
            "Total Spent",
            "Customer Type",
          ];
          rows = Array.from(guestDatabase.values()).map((guest) => {
            let type = "New";
            if (guest.visits >= 3) type = "VIP";
            else if (guest.visits >= 2) type = "Regular";

            return [
              guest.name,
              guest.email,
              `"${guest.phone}"`, // Wrap phone in quotes to prevent scientific notation
              guest.visits.toString(),
              `₱${guest.spent.toLocaleString()}`,
              type,
            ];
          });

          filename = `guest-database-${startDate}-to-${endDate}.csv`;
          break;

        case "unused-legacy-resort-performance":
          const todayPerf = new Date().toISOString().split("T")[0];
          const thisMonth = new Date().toISOString().slice(0, 7);
          const lastMonth = new Date(
            new Date().setMonth(new Date().getMonth() - 1)
          )
            .toISOString()
            .slice(0, 7);

          // Calculate key performance metrics
          const confirmedThisMonth = filteredBookings.filter(
            (b) =>
              b.created_at?.startsWith(thisMonth) && b.status === "confirmed"
          ).length;
          const confirmedLastMonth = bookings.filter(
            (b) =>
              b.created_at?.startsWith(lastMonth) && b.status === "confirmed"
          ).length;

          const currentGuests = filteredBookings.filter(
            (b) =>
              b.check_in_date <= todayPerf &&
              b.check_out_date > todayPerf &&
              b.status === "confirmed"
          ).length;

          const totalNights = filteredBookings.reduce((sum, b) => {
            if (b.status !== "confirmed") return sum;
            const nights = Math.ceil(
              (new Date(b.check_out_date).getTime() -
                new Date(b.check_in_date).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + nights;
          }, 0);

          // Estimate occupancy (assuming 15 is max capacity)
          const maxCapacityPerDay = 15;
          const daysInPeriod = Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const occupancyRate = (
            (totalNights / (maxCapacityPerDay * daysInPeriod)) *
            100
          ).toFixed(1);

          const repeatGuestMap = new Map();

          filteredBookings.forEach((b) => {
            const email = b.guest_email || "unknown";
            repeatGuestMap.set(email, (repeatGuestMap.get(email) || 0) + 1);
          });
          const repeatCustomers = Array.from(repeatGuestMap.values()).filter(
            (count) => count > 1
          ).length;

          headers = [
            "Metric",
            "This Period",
            "Comparison",
            "Status",
            "Staff Notes",
          ];

          console.log(
            `📊 Generating resort performance metrics for ${filteredBookings.length} bookings`
          );

          rows = [
            [
              "📊 Total Bookings This Period",
              `${filteredBookings.length} bookings`,
              confirmedLastMonth > 0
                ? `${confirmedThisMonth > confirmedLastMonth ? "+" : ""}${(
                    ((confirmedThisMonth - confirmedLastMonth) /
                      confirmedLastMonth) *
                    100
                  ).toFixed(1)}% vs last month`
                : "No comparison data",
              confirmedThisMonth > confirmedLastMonth
                ? "📈 Growing"
                : confirmedThisMonth < confirmedLastMonth
                ? "📉 Declining"
                : "➡️ Stable",
              confirmedThisMonth > confirmedLastMonth
                ? "Keep up the good work!"
                : "Consider marketing efforts",
            ],
            [
              "🏖️ Current Occupancy Rate",
              `${occupancyRate}% occupied`,
              `${totalNights} nights sold`,
              parseFloat(occupancyRate) > 70
                ? "🟢 Excellent"
                : parseFloat(occupancyRate) > 50
                ? "🟡 Good"
                : "🔴 Low",
              parseFloat(occupancyRate) > 70
                ? "Resort is busy - ensure quality service"
                : "Room for more bookings",
            ],
            [
              "👥 Current Guests at Resort",
              `${currentGuests} ${currentGuests === 1 ? "guest" : "guests"}`,
              "Currently checked in",
              currentGuests > 0 ? "🏨 Active" : "🏝️ Empty",
              currentGuests > 10
                ? "High capacity - monitor service quality"
                : currentGuests > 0
                ? "Moderate occupancy"
                : "No guests currently",
            ],
            [
              "🔄 Repeat Customers",
              `${repeatCustomers} returning guests`,
              `${(
                (repeatCustomers / Math.max(filteredBookings.length, 1)) *
                100
              ).toFixed(1)}% repeat rate`,
              repeatCustomers > filteredBookings.length * 0.3
                ? "🟢 Excellent loyalty"
                : repeatCustomers > filteredBookings.length * 0.2
                ? "🟡 Good retention"
                : "🔴 Need improvement",
              repeatCustomers > filteredBookings.length * 0.3
                ? "Great customer satisfaction!"
                : "Focus on guest experience",
            ],
            [
              "💰 Average Booking Value",
              `₱${(
                filteredBookings.reduce(
                  (sum, b) => sum + (b.total_amount || 0),
                  0
                ) / Math.max(filteredBookings.length, 1)
              ).toFixed(0)}`,
              "Per booking average",
              "📊 Tracking",
              "Monitor pricing effectiveness",
            ],
          ];

          filename = `resort-performance-${startDate}-to-${endDate}.csv`;
          break;

        case "booking-status":
          // Simple booking status report for financial tracking
          headers = [
            "Booking ID",
            "Guest Name",
            "Email",
            "Phone",
            "Check-in",
            "Check-out",
            "Amount",
            "Payment Method",
            "Payment Type",
            "Payment Status",
            "Booking Status",
          ];

          rows = filteredBookings.map((booking) => {
            // Enhanced payment status display
            let paymentStatusDisplay = "Unknown";
            const paymentStatus = booking.payment_status;

            // Check if booking is in the future or past
            const today = new Date().toISOString().split("T")[0];
            const checkInDate = booking.check_in_date;
            const isFutureBooking = checkInDate > today;

            // Handle payment status - 'paid' means fully completed payment
            if (paymentStatus === "verified" || paymentStatus === "paid") {
              if (isFutureBooking) {
                paymentStatusDisplay = "✅ Fully Paid (Future Stay)";
              } else {
                paymentStatusDisplay = "✅ Paid & Completed";
              }
            } else if (paymentStatus === "payment_review") {
              paymentStatusDisplay = "🔍 Under Review";
            } else if (paymentStatus === "pending") {
              paymentStatusDisplay = "⏳ Awaiting Payment";
            } else if (paymentStatus === "partial") {
              paymentStatusDisplay = "💰 Partial Payment";
            } else if (paymentStatus === null || paymentStatus === "") {
              paymentStatusDisplay = "📝 New Booking";
            } else if (
              paymentStatus === "cancelled" ||
              paymentStatus === "failed"
            ) {
              paymentStatusDisplay = "❌ Cancelled/Failed";
            }

            // Enhanced booking status display
            let bookingStatusDisplay = "Unknown";
            const bookingStatus = booking.status;

            if (bookingStatus === "confirmed") {
              bookingStatusDisplay = "✅ Confirmed";
            } else if (bookingStatus === "pending") {
              bookingStatusDisplay = "⏳ Pending Approval";
            } else if (bookingStatus === "cancelled") {
              bookingStatusDisplay = "❌ Cancelled";
            } else if (bookingStatus === "completed") {
              bookingStatusDisplay = "🏁 Completed";
            }

            // Determine payment method and type
            // Show payment type (half/full) instead of payment method since we don't have payment method in bookings table
            const paymentMethod = booking.payment_type
              ? booking.payment_type.toUpperCase()
              : "❓ Not Set";

            // Determine payment type - use payment_type field as primary indicator
            let paymentType = "N/A";
            const totalAmount = booking.total_amount || 0;
            const paidAmount = booking.payment_amount || 0;

            if (
              booking.payment_status === "paid" ||
              booking.payment_status === "verified"
            ) {
              // Use payment_type field to determine if it's a 50% downpayment
              if (booking.payment_type === "half") {
                paymentType = "🕐 50% Downpayment";
              } else if (booking.payment_type === "full") {
                paymentType = "💰 Full Payment";
              } else if (paidAmount >= totalAmount * 0.95) {
                // Fallback: Full payment (within 5% tolerance for fees)
                paymentType = "💰 Full Payment";
              } else if (
                paidAmount >= totalAmount * 0.4 &&
                paidAmount <= totalAmount * 0.6
              ) {
                // Fallback: 50% downpayment range
                paymentType = "🕐 50% Downpayment";
              } else if (paidAmount > 0) {
                // Other partial amount
                const percentage = Math.round((paidAmount / totalAmount) * 100);
                paymentType = `💵 ${percentage}% Partial`;
              } else {
                paymentType = "💰 Full Payment"; // Default for paid status
              }
            } else if (booking.payment_status === "payment_review") {
              paymentType = "🔍 Under Review";
            } else if (
              booking.payment_status === "pending" ||
              booking.payment_status === null
            ) {
              paymentType = "⏳ Not Paid";
            } else {
              paymentType = "❓ Unknown";
            }

            return [
              booking.id?.toString() || "N/A",
              booking.guest_name || "No name",
              booking.guest_email || "No email",
              `"${booking.guest_phone || "No phone"}"`, // Fix phone format
              booking.check_in_date || "No date",
              booking.check_out_date || "No date",
              `₱${(booking.total_amount || 0).toLocaleString()}`,
              paymentMethod,
              paymentType,
              paymentStatusDisplay,
              bookingStatusDisplay,
            ];
          });

          // Add payment breakdown summary
          const paymentSummary = {
            totalBookings: filteredBookings.length,
            confirmedPaid: 0,
            pending: 0,
            cancelled: 0,
            totalRevenue: 0,
            pendingRevenue: 0,
          };

          filteredBookings.forEach((booking) => {
            const amount = booking.total_amount || 0;
            const paidAmount = booking.payment_amount || amount;
            const paymentStatus = booking.payment_status;
            const bookingStatus = booking.status;
            const today = new Date().toISOString().split("T")[0];
            const isFutureBooking = booking.check_in_date > today;

            // Handle payments based on actual status and booking timing
            if (
              (paymentStatus === "paid" || paymentStatus === "verified") &&
              bookingStatus === "confirmed"
            ) {
              if (isFutureBooking && paidAmount < amount) {
                // Future booking with partial payment
                paymentSummary.confirmedPaid++;
                paymentSummary.totalRevenue += paidAmount; // Only count what's actually received
                paymentSummary.pending++;
                paymentSummary.pendingRevenue += amount - paidAmount; // Remaining balance
              } else {
                // Completed booking or full payment
                paymentSummary.confirmedPaid++;
                paymentSummary.totalRevenue += amount;
              }
            } else if (
              paymentStatus === "pending" ||
              bookingStatus === "pending"
            ) {
              paymentSummary.pending++;
              paymentSummary.pendingRevenue += amount;
            } else if (bookingStatus === "cancelled") {
              paymentSummary.cancelled++;
            }
          });

          // Add summary rows
          rows.push(
            ["", "", "", "", "", "", "", "", ""], // Empty row
            ["PAYMENT SUMMARY", "", "", "", "", "", "", "", ""],
            [
              "Total Bookings:",
              paymentSummary.totalBookings.toString(),
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ],
            [
              "Confirmed & Paid:",
              paymentSummary.confirmedPaid.toString(),
              "",
              "",
              "",
              "",
              `₱${paymentSummary.totalRevenue.toLocaleString()}`,
              "✅ Revenue",
              "",
            ],
            [
              "Pending (Payment/Approval):",
              paymentSummary.pending.toString(),
              "",
              "",
              "",
              "",
              `₱${paymentSummary.pendingRevenue.toLocaleString()}`,
              "⏳ Potential",
              "",
            ],
            [
              "Cancelled:",
              paymentSummary.cancelled.toString(),
              "",
              "",
              "",
              "",
              "₱0",
              "❌ Lost",
              "",
            ],
            ["", "", "", "", "", "", "", "", ""],
            ["PAYMENT STRUCTURE BREAKDOWN", "", "", "", "", "", "", "", ""],
            [
              "50% Downpayment Bookings:",
              filteredBookings
                .filter(
                  (b) =>
                    (b.payment_status === "paid" ||
                      b.payment_status === "verified") &&
                    b.payment_type === "half"
                )
                .length.toString(),
              "",
              "",
              "",
              "",
              `₱${filteredBookings
                .filter(
                  (b) =>
                    (b.payment_status === "paid" ||
                      b.payment_status === "verified") &&
                    b.payment_type === "half"
                )
                .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                .toLocaleString()}`,
              "🕐 50% Down",
              "",
            ],
            [
              "Full Payment Bookings:",
              filteredBookings
                .filter(
                  (b) =>
                    (b.payment_status === "paid" ||
                      b.payment_status === "verified") &&
                    b.payment_type === "full"
                )
                .length.toString(),
              "",
              "",
              "",
              "",
              `₱${filteredBookings
                .filter(
                  (b) =>
                    (b.payment_status === "paid" ||
                      b.payment_status === "verified") &&
                    b.payment_type === "full"
                )
                .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                .toLocaleString()}`,
              "💰 Full Pay",
              "",
            ],
            ["", "", "", "", "", "", "", "", ""],
            ["PAYMENT COLLECTIONS BREAKDOWN", "", "", "", "", "", "", "", ""],
            [
              "Awaiting Payment:",
              filteredBookings
                .filter((b) => b.payment_status === "pending")
                .length.toString(),
              "",
              "",
              "",
              "",
              `₱${filteredBookings
                .filter((b) => b.payment_status === "pending")
                .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                .toLocaleString()}`,
              "⏳ To Collect",
              "",
            ],
            ["", "", "", "", "", "", "", "", ""],
            ["50% DOWNPAYMENT BOOKINGS", "", "", "", "", "", "", "", ""],
            [
              "Future F2F Collections:",
              filteredBookings
                .filter((b) => {
                  const today = new Date().toISOString().split("T")[0];
                  const isFutureBooking = b.check_in_date > today;
                  const paidAmount = b.payment_amount || 0;
                  const totalAmount = b.total_amount || 0;
                  const isVerified =
                    b.payment_status === "paid" ||
                    b.payment_status === "verified";
                  const is50Percent =
                    paidAmount > 0 &&
                    paidAmount >= totalAmount * 0.4 &&
                    paidAmount <= totalAmount * 0.6;
                  const hasBalance = paidAmount < totalAmount;
                  return (
                    isVerified && is50Percent && hasBalance && isFutureBooking
                  );
                })
                .length.toString(),
              "",
              "",
              "",
              "",
              `₱${filteredBookings
                .filter((b) => {
                  const today = new Date().toISOString().split("T")[0];
                  const isFutureBooking = b.check_in_date > today;
                  const paidAmount = b.payment_amount || 0;
                  const totalAmount = b.total_amount || 0;
                  const isVerified =
                    b.payment_status === "paid" ||
                    b.payment_status === "verified";
                  const is50Percent =
                    paidAmount > 0 &&
                    paidAmount >= totalAmount * 0.4 &&
                    paidAmount <= totalAmount * 0.6;
                  const hasBalance = paidAmount < totalAmount;
                  return (
                    isVerified && is50Percent && hasBalance && isFutureBooking
                  );
                })
                .reduce((sum, b) => {
                  const paidAmount = b.payment_amount || 0;
                  const totalAmount = b.total_amount || 0;
                  return sum + (totalAmount - paidAmount);
                }, 0)
                .toLocaleString()}`,
              "🏨 Future F2F",
              "",
            ],
            [
              "Completed F2F Payments:",
              filteredBookings
                .filter((b) => {
                  const today = new Date().toISOString().split("T")[0];
                  const isPastBooking = b.check_in_date <= today;
                  const isVerified =
                    b.payment_status === "paid" ||
                    b.payment_status === "verified";
                  // Use payment_type field to identify 50% downpayments
                  const is50Percent = b.payment_type === "half";
                  return isVerified && is50Percent && isPastBooking;
                })
                .length.toString(),
              "",
              "",
              "",
              "",
              `₱${filteredBookings
                .filter((b) => {
                  const today = new Date().toISOString().split("T")[0];
                  const isPastBooking = b.check_in_date <= today;
                  const isVerified =
                    b.payment_status === "paid" ||
                    b.payment_status === "verified";
                  const is50Percent = b.payment_type === "half";
                  return isVerified && is50Percent && isPastBooking;
                })
                .reduce((sum, b) => {
                  // For 50% downpayments, F2F portion is always 50% of total
                  const totalAmount = b.total_amount || 0;
                  return sum + totalAmount * 0.5; // 50% F2F portion
                }, 0)
                .toLocaleString()}`,
              "✅ F2F Done",
              "",
            ],
            ["", "", "", "", "", "", "", "", ""],
            [
              "TOTAL TO COLLECT:",
              "",
              "",
              "",
              "",
              "",
              `₱${(
                filteredBookings
                  .filter((b) => b.payment_status === "pending")
                  .reduce((sum, b) => sum + (b.total_amount || 0), 0) +
                filteredBookings
                  .filter((b) => {
                    const paidAmount = b.payment_amount || 0;
                    const totalAmount = b.total_amount || 0;
                    const hasRemainingBalance =
                      paidAmount > 0 && paidAmount < totalAmount;
                    const isVerified =
                      b.payment_status === "paid" ||
                      b.payment_status === "verified";
                    return isVerified && hasRemainingBalance;
                  })
                  .reduce((sum, b) => {
                    const paidAmount = b.payment_amount || 0;
                    const totalAmount = b.total_amount || 0;
                    return sum + (totalAmount - paidAmount);
                  }, 0)
              ).toLocaleString()}`,
              "💵 CASH NEEDED",
              "",
            ]
          );

          filename = `booking-status-${startDate}-to-${endDate}.csv`;
          break;

        case "money-summary-unused":
          // Simple financial overview for staff and management
          const todayMoney = new Date().toISOString().split("T")[0];

          // Calculate money metrics
          const paidBookings = filteredBookings.filter(
            (b) =>
              b.payment_status === "paid" || b.payment_status === "verified"
          );

          const pendingPayments = filteredBookings.filter(
            (b) =>
              b.payment_status === "pending" || b.payment_status === "partial"
          );

          const upcomingCheckouts = filteredBookings.filter((b) => {
            const checkOut = new Date(b.check_out_date);
            const today = new Date(todayMoney);
            const nextWeek = new Date(
              today.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            return (
              checkOut >= today &&
              checkOut <= nextWeek &&
              (b.payment_status === "paid" || b.payment_status === "verified")
            );
          });

          // Calculate totals
          const totalEarned = paidBookings.reduce(
            (sum, b) => sum + (b.total_amount || 0),
            0
          );
          const totalPending = pendingPayments.reduce(
            (sum, b) => sum + (b.total_amount || 0),
            0
          );
          const weeklyExpected = upcomingCheckouts.reduce(
            (sum, b) => sum + (b.total_amount || 0),
            0
          );

          // Payment method breakdown
          const paymentMethods: Record<
            string,
            { count: number; amount: number }
          > = {};
          paidBookings.forEach((booking) => {
            const method = booking.payment_type || "cash";
            const methodMap: Record<string, string> = {
              stripe: "Credit Card",
              gcash: "GCash",
              maya: "Maya/PayMaya",
              cash: "Cash Payment",
              full: "Full Payment",
              half: "Downpayment/Partial",
              partial: "Downpayment/Partial",
              downpayment: "Downpayment",
              bank: "Bank Transfer",
              other: "Other Method",
            };
            const displayMethod = methodMap[method] || method || "Other";
            if (!paymentMethods[displayMethod]) {
              paymentMethods[displayMethod] = { count: 0, amount: 0 };
            }
            paymentMethods[displayMethod].count += 1;
            paymentMethods[displayMethod].amount += booking.total_amount || 0;
          });

          headers = [
            "Money Category",
            "Amount (₱)",
            "Count",
            "Average (₱)",
            "Status",
            "Staff Action Needed",
          ];

          const avgEarned =
            paidBookings.length > 0 ? totalEarned / paidBookings.length : 0;
          const avgPending =
            pendingPayments.length > 0
              ? totalPending / pendingPayments.length
              : 0;

          rows = [
            [
              "💰 MONEY EARNED (Paid Bookings)",
              `₱${totalEarned.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              `${paidBookings.length} bookings`,
              `₱${avgEarned.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              totalEarned > 100000
                ? "🟢 Excellent"
                : totalEarned > 50000
                ? "🟡 Good"
                : "🔴 Low",
              "Money secured - track daily deposits",
            ],
            [
              "⏳ MONEY PENDING (Awaiting Payment)",
              `₱${totalPending.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              `${pendingPayments.length} bookings`,
              `₱${avgPending.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              pendingPayments.length === 0
                ? "🟢 All paid"
                : pendingPayments.length < 5
                ? "🟡 Few pending"
                : "🔴 Many pending",
              pendingPayments.length > 0
                ? "Follow up on pending payments ASAP"
                : "All payments current",
            ],
            [
              "📅 MONEY THIS WEEK (Expected from checkouts)",
              `₱${weeklyExpected.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              `${upcomingCheckouts.length} checkouts`,
              upcomingCheckouts.length > 0
                ? `₱${(
                    weeklyExpected / upcomingCheckouts.length
                  ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                : "₱0.00",
              upcomingCheckouts.length > 0
                ? "💼 Expected income"
                : "🏖️ No checkouts",
              upcomingCheckouts.length > 0
                ? "Prepare for guest departures this week"
                : "No scheduled checkouts",
            ],
          ];

          // Add payment method breakdown
          Object.entries(paymentMethods).forEach(([method, data]) => {
            const avg = data.count > 0 ? data.amount / data.count : 0;
            rows.push([
              `💳 ${method} Payments`,
              `₱${data.amount.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              `${data.count} transactions`,
              `₱${avg.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
              "💰 Payment method",
              method === "Cash Payment"
                ? "Count cash daily, deposit safely"
                : "Digital payment - verify receipts",
            ]);
          });

          // Add summary row
          const totalRevenue = totalEarned + totalPending;

          rows.push([
            "📊 TOTAL REVENUE (All bookings this period)",
            `₱${totalRevenue.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}`,
            `${filteredBookings.length} total bookings`,
            `₱${(
              totalRevenue / Math.max(filteredBookings.length, 1)
            ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            "📈 Period total",
            "Review daily revenue goals vs actual performance",
          ]);

          filename = `money-summary-${startDate}-to-${endDate}.csv`;
          break;

        default:
          headers = ["Error"];
          rows = [["Unknown report type"]];
          filename = "error.csv";
      }

      if (rows.length === 0) {
        alert(
          `No ${selectedReport.name.toLowerCase()} data found for the selected period.`
        );
        return;
      }

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => {
              // Handle null/undefined
              if (cell === null || cell === undefined) return '""';

              let value = String(cell).trim();

              // For numeric values that might show asterisks in Excel
              if (!isNaN(Number(cell)) && cell !== "" && cell !== null) {
                const num = Number(cell);
                // Format currency/decimal values with proper precision
                if (
                  headers.some(
                    (h) =>
                      h.toLowerCase().includes("amount") ||
                      h.toLowerCase().includes("revenue") ||
                      h.toLowerCase().includes("value") ||
                      h.toLowerCase().includes("spent")
                  )
                ) {
                  value = num.toFixed(2);
                } else {
                  value = num.toString();
                }
              }

              // Escape quotes and wrap in quotes if contains special characters
              if (
                value.includes(",") ||
                value.includes('"') ||
                value.includes("\n") ||
                value.includes(";")
              ) {
                return `"${value.replace(/"/g, '""')}"`;
              }

              return `"${value}"`;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log(
        `✅ ${selectedReport.name} exported successfully: ${filename}`
      );
      console.log(
        `📊 Exported ${rows.length} records with ${headers.length} columns`
      );

      showToast({
        type: "success",
        title: "Export Completed",
        message: `${selectedReport.name} exported successfully! Downloaded ${rows.length} records.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      showToast({
        type: "error",
        title: "Export Failed",
        message:
          "Failed to export report. Please try again or contact support.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Business Reports
            </h1>
            <p className="text-gray-800 mt-1 text-sm sm:text-base">
              Real-world reports for resort operations
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              📅 Filtering by check-in date (when guests will arrive)
            </p>
          </div>
          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh Data
          </button>
        </div>

        {/* Report Type Selection */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
            Choose Your Report
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {REPORT_TYPES.map((report) => {
              const IconComponent = report.icon;
              const isSelected = selectedReport.id === report.id;

              // Define specific colors for each type
              const getCardStyles = () => {
                if (!isSelected) {
                  return {
                    card: "border-gray-200 hover:border-gray-300 bg-white",
                    icon: "text-gray-600",
                    title: "text-gray-900",
                  };
                }

                switch (report.color) {
                  case "blue":
                    return {
                      card: "border-blue-500 bg-blue-50",
                      icon: "text-blue-600",
                      title: "text-blue-900",
                    };
                  case "green":
                    return {
                      card: "border-green-500 bg-green-50",
                      icon: "text-green-600",
                      title: "text-green-900",
                    };
                  case "purple":
                    return {
                      card: "border-purple-500 bg-purple-50",
                      icon: "text-purple-600",
                      title: "text-purple-900",
                    };
                  case "orange":
                    return {
                      card: "border-orange-500 bg-orange-50",
                      icon: "text-orange-600",
                      title: "text-orange-900",
                    };
                  case "red":
                    return {
                      card: "border-red-500 bg-red-50",
                      icon: "text-red-600",
                      title: "text-red-900",
                    };
                  default:
                    return {
                      card: "border-gray-500 bg-gray-50",
                      icon: "text-gray-600",
                      title: "text-gray-900",
                    };
                }
              };

              const styles = getCardStyles();

              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-all ${styles.card}`}
                >
                  <IconComponent
                    className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2 ${styles.icon}`}
                  />
                  <h4
                    className={`font-semibold text-xs sm:text-sm ${styles.title}`}
                  >
                    {report.name}
                  </h4>
                  <p className="text-xs text-gray-800 mt-1">
                    {report.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Simple Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-in Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-in End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Payment Status</option>
              <option value="verified">Verified</option>
              <option value="paid">Paid</option>
              <option value="payment_review">Under Review</option>
              <option value="pending">Pending Payment</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Payment Types</option>
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
              <option value="cash">Cash (Walk-in)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Export
            </label>
            <button
              onClick={exportReport}
              disabled={isLoading || bookings.length === 0 || isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? "Exporting..." : `Export ${selectedReport.name}`}
            </button>
          </div>
        </div>
      </div>

      {/* 📊 DYNAMIC CHARTS BASED ON REPORT TYPE */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-black flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          {selectedReport.name} Analytics
        </h2>

        {/* 📊 EXPLANATION PANEL */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">
              Chart Data Explanation
            </h3>
          </div>
          <div className="text-sm text-blue-700">
            <p>
              <strong>📅 Date Range:</strong> All charts show bookings with
              check-in dates from <strong>{startDate}</strong> to{" "}
              <strong>{endDate}</strong>
            </p>
            <p>
              <strong>🎯 Status Filter:</strong>{" "}
              {statusFilter === "all"
                ? "All booking statuses included"
                : `Only ${statusFilter} bookings shown`}
            </p>
            <p>
              <strong>💳 Payment Status:</strong>{" "}
              {paymentStatusFilter === "all"
                ? "All payment statuses included"
                : `Only ${paymentStatusFilter} payments shown`}
            </p>
            <p>
              <strong>💰 Payment Type:</strong>{" "}
              {paymentMethodFilter === "all"
                ? "All payment types included"
                : `Only ${paymentMethodFilter} payments shown`}
            </p>
            <p>
              <strong>📊 Total Filtered Bookings:</strong>{" "}
              {filteredBookings.length} bookings match your criteria
            </p>
            {selectedReport.id === "daily-checklist" && (
              <div>
                <p>
                  <strong>🏖️ Daily Operations:</strong> Shows current guests
                  (confirmed) + pending arrivals for preparation
                </p>
                <p>
                  <strong>⚠️ Status Logic:</strong> Current guests must be
                  confirmed | Arrivals show confirmed + pending
                </p>
              </div>
            )}
            {selectedReport.id === "revenue-summary" && (
              <p>
                <strong>💰 Revenue Data:</strong> CONFIRMED & PAID bookings only
                (excludes pending for financial accuracy)
              </p>
            )}
            {selectedReport.id === "guest-registry" && (
              <p>
                <strong>👥 Guest Database:</strong> COMPLETED stays only - Real
                customer profiles for marketing, loyalty programs, and
                personalized service
              </p>
            )}
            {selectedReport.id === "booking-calendar" && (
              <p>
                <strong>📋 Planning Data:</strong> Includes confirmed + pending
                bookings for operational planning
              </p>
            )}
          </div>
        </div>

        {/* Daily Operations Report Description */}
        {selectedReport.id === "daily-operations" && (
          <div className="text-center py-12 max-w-2xl mx-auto">
            <Clock className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-black mb-2">
              Daily Operations Report
            </h3>
            <p className="text-gray-600 mb-4">
              This report shows today&apos;s check-ins, check-outs, and current
              guests for staff planning and operational management.
            </p>
            <p className="text-sm text-gray-500">
              Click the <strong>Export</strong> button above to download the
              complete daily operations report as CSV.
            </p>
          </div>
        )}

        {/* Daily Operations Charts */}
        {selectedReport.id === "daily-operations" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Daily Check-ins vs Check-outs
              </h3>
              {isLoading ? (
                <div className="h-48 sm:h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={(() => {
                      // 📅 REAL CHECK-IN/OUT DATA from filtered date range
                      const dailyData = [];

                      // Create date range from startDate to endDate
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      const daysDiff = Math.ceil(
                        (end.getTime() - start.getTime()) /
                          (1000 * 60 * 60 * 24)
                      );

                      // Show up to 14 days to keep chart readable
                      const daysToShow = Math.min(daysDiff, 14);

                      for (let i = 0; i < daysToShow; i++) {
                        const date = new Date(start);
                        date.setDate(date.getDate() + i);
                        const dateStr = date.toISOString().split("T")[0];

                        const checkIns = filteredBookings.filter(
                          (b) => b.check_in_date === dateStr
                        ).length;
                        const checkOuts = filteredBookings.filter(
                          (b) => b.check_out_date === dateStr
                        ).length;

                        dailyData.push({
                          date: date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          }),
                          checkIns,
                          checkOuts,
                        });
                      }
                      return dailyData;
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#000000", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Legend wrapperStyle={{ color: "#000000" }} />
                    <Bar dataKey="checkIns" fill="#10b981" name="Check-ins" />
                    <Bar dataKey="checkOuts" fill="#f59e0b" name="Check-outs" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                Guest Count by Day
              </h3>
              {isLoading ? (
                <div className="h-48 sm:h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={(() => {
                      const dailyData = [];
                      for (let i = 0; i < 7; i++) {
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        const dateStr = date.toISOString().split("T")[0];

                        const totalGuests = filteredBookings
                          .filter((b) => b.check_in_date === dateStr)
                          .reduce(
                            (sum, b) => sum + (b.number_of_guests || 0),
                            0
                          );

                        dailyData.push({
                          date: date.toLocaleDateString("en-US", {
                            weekday: "short",
                          }),
                          guests: totalGuests,
                        });
                      }
                      return dailyData;
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#000000", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="guests"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Total Guests"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Guest Registry Charts */}
        {selectedReport.id === "guest-registry" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Guest Group Sizes
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const guestSizes = filteredBookings.reduce(
                          (acc, booking) => {
                            const size = booking.number_of_guests || 1;
                            const category =
                              size <= 2
                                ? "1-2 People"
                                : size <= 5
                                ? "3-5 People"
                                : size <= 10
                                ? "6-10 People"
                                : "11+ People";
                            acc[category] = (acc[category] || 0) + 1;
                            return acc;
                          },
                          {} as Record<string, number>
                        );

                        const colors = [
                          "#3b82f6",
                          "#10b981",
                          "#f59e0b",
                          "#ef4444",
                        ];
                        return Object.entries(guestSizes).map(
                          ([name, value], index) => ({
                            name,
                            value,
                            color: colors[index % colors.length],
                          })
                        );
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {filteredBookings.length > 0 &&
                        Object.entries(
                          filteredBookings.reduce((acc, booking) => {
                            const size = booking.number_of_guests || 1;
                            const category =
                              size <= 2
                                ? "1-2 People"
                                : size <= 5
                                ? "3-5 People"
                                : size <= 10
                                ? "6-10 People"
                                : "11+ People";
                            acc[category] = (acc[category] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map((_, index) => {
                          const colors = [
                            "#3b82f6",
                            "#10b981",
                            "#f59e0b",
                            "#ef4444",
                          ];
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={colors[index % colors.length]}
                            />
                          );
                        })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Legend wrapperStyle={{ color: "#000000" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Monthly Guest Registrations
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={(() => {
                      const months = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ];
                      const monthlyGuests = new Map();

                      months.forEach((month) => monthlyGuests.set(month, 0));

                      filteredBookings.forEach((booking) => {
                        if (booking.created_at) {
                          const month =
                            months[new Date(booking.created_at).getMonth()];
                          monthlyGuests.set(
                            month,
                            monthlyGuests.get(month) +
                              (booking.number_of_guests || 1)
                          );
                        }
                      });

                      return months.map((month) => ({
                        month,
                        guests: monthlyGuests.get(month),
                      }));
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#000000", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Bar dataKey="guests" fill="#10b981" name="Total Guests" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Revenue Summary Charts */}
        {selectedReport.id === "revenue-summary" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <PhilippinePeso className="w-5 h-5 text-green-600" />
                Monthly Revenue Breakdown
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={(() => {
                      const months = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ];
                      const monthlyRevenue = new Map();

                      months.forEach((month) =>
                        monthlyRevenue.set(month, { confirmed: 0, pending: 0 })
                      );

                      filteredBookings.forEach((booking) => {
                        if (booking.created_at) {
                          const month =
                            months[new Date(booking.created_at).getMonth()];
                          const current = monthlyRevenue.get(month);
                          const amount =
                            booking.payment_amount || booking.total_amount || 0;

                          if (
                            booking.status === "confirmed" ||
                            booking.payment_status === "paid"
                          )
                            current.confirmed += amount;
                          else if (booking.status === "pending")
                            current.pending += amount;
                        }
                      });

                      return months.map((month) => ({
                        month,
                        confirmed: monthlyRevenue.get(month).confirmed,
                        pending: monthlyRevenue.get(month).pending,
                      }));
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#000000", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [
                        `₱${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Legend wrapperStyle={{ color: "#000000" }} />
                    <Bar
                      dataKey="confirmed"
                      fill="#10b981"
                      name="Confirmed Revenue"
                    />
                    <Bar
                      dataKey="pending"
                      fill="#f59e0b"
                      name="Pending Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Revenue Trend Analysis
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart
                    data={(() => {
                      const last12Months = [];
                      for (let i = 11; i >= 0; i--) {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const monthKey = date.toLocaleDateString("en-US", {
                          month: "short",
                        });

                        const monthRevenue = bookings
                          .filter((b) => {
                            if (!b.created_at || b.status !== "confirmed")
                              return false;
                            const bookingMonth = new Date(
                              b.created_at
                            ).getMonth();
                            return bookingMonth === date.getMonth();
                          })
                          .reduce((sum, b) => sum + (b.total_amount || 0), 0);

                        last12Months.push({
                          month: monthKey,
                          revenue: monthRevenue,
                        });
                      }
                      return last12Months;
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#000000", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [
                        `₱${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      name="Monthly Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Guest Database Report Description */}
        {selectedReport.id === "guest-database" && (
          <div className="text-center py-12 max-w-2xl mx-auto">
            <Users className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h3 className="text-lg font-semibold text-black mb-2">
              Guest Database Report
            </h3>
            <p className="text-gray-600 mb-4">
              This report shows your complete guest database with contact
              information, visit history, and spending patterns for marketing
              and customer service.
            </p>
            <p className="text-sm text-gray-500">
              Click the <strong>Export</strong> button above to download the
              complete guest database report as CSV.
            </p>
          </div>
        )}

        {/* Guest Database Charts */}
        {selectedReport.id === "guest-database" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Guest Visit Frequency
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const visitCounts: { [key: string]: number } = {};

                        // Count visits per guest (by email)
                        filteredBookings.forEach((booking) => {
                          const email = booking.guest_email || "Unknown";
                          visitCounts[email] = (visitCounts[email] || 0) + 1;
                        });

                        // Categorize by visit frequency
                        const categories = {
                          "First Time (1 visit)": 0,
                          "Returning (2-3 visits)": 0,
                          "Frequent (4-6 visits)": 0,
                          "VIP (7+ visits)": 0,
                        };

                        Object.values(visitCounts).forEach((count: number) => {
                          if (count === 1) categories["First Time (1 visit)"]++;
                          else if (count <= 3)
                            categories["Returning (2-3 visits)"]++;
                          else if (count <= 6)
                            categories["Frequent (4-6 visits)"]++;
                          else categories["VIP (7+ visits)"]++;
                        });

                        return Object.entries(categories).map(
                          ([name, value]) => ({
                            name,
                            value,
                            fill: name.includes("First")
                              ? "#ef4444"
                              : name.includes("Returning")
                              ? "#f59e0b"
                              : name.includes("Frequent")
                              ? "#10b981"
                              : "#8b5cf6",
                          })
                        );
                      })()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label
                      labelLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Legend wrapperStyle={{ color: "#000000" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Customer Growth Over Time
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart
                    data={(() => {
                      const months = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ];

                      // Get unique customers by month
                      const monthlyCustomers = new Map();
                      const uniqueCustomers = new Set();

                      // Initialize months with 0
                      months.forEach((month) => monthlyCustomers.set(month, 0));

                      // Count cumulative unique customers by month
                      filteredBookings
                        .sort(
                          (a, b) =>
                            new Date(a.created_at || "").getTime() -
                            new Date(b.created_at || "").getTime()
                        )
                        .forEach((booking) => {
                          if (booking.created_at && booking.guest_email) {
                            const monthIndex = new Date(
                              booking.created_at
                            ).getMonth();
                            const monthName = months[monthIndex];

                            // Add to unique customers set
                            if (!uniqueCustomers.has(booking.guest_email)) {
                              uniqueCustomers.add(booking.guest_email);
                              monthlyCustomers.set(
                                monthName,
                                monthlyCustomers.get(monthName) + 1
                              );
                            }
                          }
                        });

                      // Convert to cumulative count
                      let runningTotal = 0;
                      return months
                        .map((month) => {
                          runningTotal += monthlyCustomers.get(month);
                          return {
                            month,
                            customers: runningTotal,
                            newCustomers: monthlyCustomers.get(month),
                          };
                        })
                        .filter(
                          (item) => item.customers > 0 || item.newCustomers > 0
                        );
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#000000", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Legend wrapperStyle={{ color: "#000000" }} />
                    <Area
                      type="monotone"
                      dataKey="customers"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Total Customers"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Legacy Monthly Booking Trends - unused */}
        {selectedReport.id === "unused-legacy" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Monthly Booking Trends
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={(() => {
                      const months = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ];
                      const monthlyBookings = new Map();

                      // Initialize all months with 0
                      months.forEach((month) => monthlyBookings.set(month, 0));

                      // Count real bookings by month
                      filteredBookings.forEach((booking) => {
                        if (booking.created_at) {
                          const monthIndex = new Date(
                            booking.created_at
                          ).getMonth();
                          const monthName = months[monthIndex];
                          monthlyBookings.set(
                            monthName,
                            monthlyBookings.get(monthName) + 1
                          );
                        }
                      });

                      // Return only months with data, or last 6 months if no data
                      const currentMonth = new Date().getMonth();
                      const relevantMonths = [];
                      for (let i = 5; i >= 0; i--) {
                        const monthIndex = (currentMonth - i + 12) % 12;
                        const monthName = months[monthIndex];
                        relevantMonths.push({
                          month: monthName,
                          bookings: monthlyBookings.get(monthName),
                        });
                      }
                      return relevantMonths;
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#000000", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Guest Types
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const emailCounts = new Map();

                        // Count how many times each email appears
                        filteredBookings.forEach((booking) => {
                          if (booking.guest_email) {
                            const count =
                              emailCounts.get(booking.guest_email) || 0;
                            emailCounts.set(booking.guest_email, count + 1);
                          }
                        });

                        let newGuests = 0;
                        let returningGuests = 0;

                        // Count unique guests
                        emailCounts.forEach((count) => {
                          if (count === 1) {
                            newGuests += 1;
                          } else {
                            returningGuests += 1;
                          }
                        });

                        // Handle guests without email
                        const guestsWithoutEmail = filteredBookings.filter(
                          (b) => !b.guest_email
                        ).length;
                        newGuests += guestsWithoutEmail;

                        return [
                          { name: "New Guests", value: newGuests },
                          { name: "Returning Guests", value: returningGuests },
                        ];
                      })()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Legend wrapperStyle={{ color: "#000000" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Booking Status - Simple Display */}
        {selectedReport.id === "booking-status" && (
          <div className="bg-white p-6 rounded-xl shadow-md text-center py-8">
            <FileText className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-black mb-2">
              Booking Status Report
            </h3>
            <p className="text-gray-600 mb-4">
              This report shows all bookings organized by payment status (Paid,
              Pending, Cancelled) and booking status.
            </p>
            <p className="text-sm text-gray-500">
              Click the <strong>Export</strong> button above to download the
              complete booking status report as CSV.
            </p>
          </div>
        )}

        {/* Legacy Guest Spending Analysis - unused */}
        {selectedReport.id === "unused-legacy-guest" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Guest Spending Analysis
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={(() => {
                      const guestSpending = new Map();

                      // Group bookings by guest email and calculate total spending
                      filteredBookings.forEach((booking) => {
                        if (
                          booking.guest_email &&
                          booking.status === "confirmed"
                        ) {
                          const email = booking.guest_email;
                          const current = guestSpending.get(email) || {
                            totalSpent: 0,
                            visits: 0,
                          };
                          current.totalSpent += booking.total_amount || 0;
                          current.visits += 1;
                          guestSpending.set(email, current);
                        }
                      });

                      let vipGuests = 0;
                      let regularGuests = 0;
                      let budgetGuests = 0;

                      guestSpending.forEach((guest) => {
                        const avgSpend = guest.totalSpent / guest.visits;
                        if (guest.visits >= 3 || avgSpend >= 15000) {
                          vipGuests++;
                        } else if (avgSpend >= 8000 || guest.visits >= 2) {
                          regularGuests++;
                        } else {
                          budgetGuests++;
                        }
                      });

                      return [
                        {
                          category: "VIP Guests (3+ visits or ₱15k+ avg)",
                          count: vipGuests,
                        },
                        {
                          category: "Regular Guests (2+ visits or ₱8k+ avg)",
                          count: regularGuests,
                        },
                        {
                          category: "First-time/Budget Guests",
                          count: budgetGuests,
                        },
                      ];
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: "#000000", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#8b5cf6"
                      name="Number of Guests"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Guest Preferences
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Brings Pets",
                          value: filteredBookings.filter((b) => b.brings_pet)
                            .length,
                        },
                        {
                          name: "Special Requests",
                          value: filteredBookings.filter(
                            (b) =>
                              b.special_requests && b.special_requests.trim()
                          ).length,
                        },
                        {
                          name: "Standard Stay",
                          value: filteredBookings.filter(
                            (b) =>
                              !b.brings_pet &&
                              (!b.special_requests ||
                                !b.special_requests.trim())
                          ).length,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                      <Cell fill="#6b7280" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Legend wrapperStyle={{ color: "#000000" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Booking Status Charts - Simple table view only */}
        {selectedReport.id === "booking-status" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <PhilippinePeso className="w-5 h-5 text-green-600" />
                Payment Status Overview
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const statusBreakdown: Record<string, number> = {};

                        filteredBookings.forEach((booking) => {
                          const status = booking.payment_status || "unknown";
                          const amount = booking.total_amount || 0;

                          // Group similar statuses
                          let displayStatus;
                          if (status === "paid" || status === "verified") {
                            displayStatus = "Paid/Verified";
                          } else if (
                            status === "pending" ||
                            status === "partial"
                          ) {
                            displayStatus = "Pending/Partial";
                          } else {
                            displayStatus = "Other/Failed";
                          }

                          if (!statusBreakdown[displayStatus]) {
                            statusBreakdown[displayStatus] = 0;
                          }
                          statusBreakdown[displayStatus] += amount;
                        });

                        return Object.entries(statusBreakdown)
                          .map(([name, value]) => ({ name, value }))
                          .filter(
                            (item: { name: string; value: number }) =>
                              item.value > 0
                          );
                      })()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#6b7280" />
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `₱${value.toLocaleString()}`,
                        "Amount",
                      ]}
                    />
                    <Legend wrapperStyle={{ color: "#000000" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Payment Methods
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={(() => {
                      const methodRevenue: Record<string, number> = {};

                      filteredBookings
                        .filter(
                          (b) =>
                            b.payment_status === "paid" ||
                            b.payment_status === "verified"
                        )
                        .forEach((booking) => {
                          const method = booking.payment_type || "cash";
                          const methodMap: Record<string, string> = {
                            stripe: "Credit Card",
                            gcash: "GCash",
                            maya: "Maya/PayMaya",
                            cash: "Cash Payment",
                            full: "Full Payment",
                            half: "Downpayment/Partial",
                            partial: "Downpayment/Partial",
                            downpayment: "Downpayment",
                            bank: "Bank Transfer",
                            other: "Other Method",
                          };

                          const displayMethod =
                            methodMap[method] || method || "Other";
                          if (!methodRevenue[displayMethod]) {
                            methodRevenue[displayMethod] = 0;
                          }
                          methodRevenue[displayMethod] +=
                            booking.total_amount || 0;
                        });

                      return Object.entries(methodRevenue)
                        .map(([method, revenue]) => ({ method, revenue }))
                        .filter(
                          (item: { method: string; revenue: number }) =>
                            item.revenue > 0
                        )
                        .sort(
                          (
                            a: { method: string; revenue: number },
                            b: { method: string; revenue: number }
                          ) => b.revenue - a.revenue
                        );
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="method"
                      tick={{ fill: "#000000", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [
                        `₱${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₱)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Booking Calendar Charts */}
        {selectedReport.id === "booking-calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Upcoming Bookings Timeline
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={(() => {
                      const next30Days = [];
                      for (let i = 0; i < 30; i += 5) {
                        // Show every 5 days
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        const dateStr = date.toISOString().split("T")[0];

                        const dayBookings = filteredBookings.filter(
                          (b) =>
                            b.check_in_date >= dateStr &&
                            b.check_in_date <
                              new Date(date.getTime() + 5 * 24 * 60 * 60 * 1000)
                                .toISOString()
                                .split("T")[0]
                        ).length;

                        next30Days.push({
                          period: date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          }),
                          bookings: dayBookings,
                        });
                      }
                      return next30Days;
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="period"
                      tick={{ fill: "#000000", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Booking Status Distribution
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const statusCounts = filteredBookings.reduce(
                          (acc, booking) => {
                            const status = booking.status || "unknown";
                            acc[status] = (acc[status] || 0) + 1;
                            return acc;
                          },
                          {} as Record<string, number>
                        );

                        const colors = {
                          confirmed: "#10b981",
                          pending: "#f59e0b",
                          cancelled: "#ef4444",
                          unknown: "#6b7280",
                        };
                        return Object.entries(statusCounts).map(
                          ([status, count]) => ({
                            name:
                              status.charAt(0).toUpperCase() + status.slice(1),
                            value: count,
                            color:
                              colors[status as keyof typeof colors] ||
                              "#6b7280",
                          })
                        );
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {filteredBookings.length > 0 &&
                        Object.entries(
                          filteredBookings.reduce((acc, booking) => {
                            const status = booking.status || "unknown";
                            acc[status] = (acc[status] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map((_, index) => {
                          const colors = [
                            "#10b981",
                            "#f59e0b",
                            "#ef4444",
                            "#6b7280",
                          ];
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={colors[index % colors.length]}
                            />
                          );
                        })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        color: "#000000",
                      }}
                      labelStyle={{ color: "#000000" }}
                    />
                    <Legend wrapperStyle={{ color: "#000000" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report-Specific Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {selectedReport.id === "daily-checklist" && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Today&apos;s Arrivals
                  </h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const today = new Date().toISOString().split("T")[0];
                          const todayArrivals = filteredBookings.filter(
                            (b) => b.check_in_date === today
                          ).length;
                          return todayArrivals > 0 ? todayArrivals : "None";
                        })()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(() => {
                      const tomorrow = new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                      )
                        .toISOString()
                        .split("T")[0];
                      const tomorrowCount = filteredBookings.filter(
                        (b) => b.check_in_date === tomorrow
                      ).length;
                      return tomorrowCount > 0
                        ? `${tomorrowCount} tomorrow`
                        : "None tomorrow";
                    })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Today&apos;s Departures
                  </h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const today = new Date().toISOString().split("T")[0];
                          const todayDepartures = filteredBookings.filter(
                            (b) => b.check_out_date === today
                          ).length;
                          return todayDepartures > 0 ? todayDepartures : "None";
                        })()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Check-out by 1:00 PM
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Current Guests
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const today = new Date().toISOString().split("T")[0];
                          const currentGuests = filteredBookings.filter(
                            (b) =>
                              b.check_in_date <= today &&
                              b.check_out_date > today &&
                              b.status === "confirmed"
                          ).length;
                          return currentGuests > 0 ? currentGuests : "None";
                        })()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Currently at resort
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Next 7 Days
                  </h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const today = new Date();
                          const next7Days = new Date(
                            today.getTime() + 7 * 24 * 60 * 60 * 1000
                          )
                            .toISOString()
                            .split("T")[0];
                          const todayStr = today.toISOString().split("T")[0];

                          const upcomingBookings = filteredBookings.filter(
                            (b) =>
                              b.check_in_date >= todayStr &&
                              b.check_in_date <= next7Days
                          ).length;
                          return upcomingBookings > 0
                            ? upcomingBookings
                            : "None";
                        })()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Upcoming arrivals
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </>
        )}

        {selectedReport.id === "guest-registry" && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Total Guests
                  </h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const uniqueEmails = new Set(
                            filteredBookings.map(
                              (b) => b.guest_email || "No email"
                            )
                          );
                          return uniqueEmails.size;
                        })()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Return Guests
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const guestCounts = new Map();
                          bookings.forEach((b) => {
                            guestCounts.set(
                              b.guest_email,
                              (guestCounts.get(b.guest_email) || 0) + 1
                            );
                          });
                          return Array.from(guestCounts.values()).filter(
                            (count) => count > 1
                          ).length;
                        })()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Contact Info Available
                  </h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const withPhone = new Set();
                          bookings.forEach((b) => {
                            if (b.guest_phone && b.guest_phone.trim()) {
                              withPhone.add(b.guest_email);
                            }
                          });
                          return withPhone.size;
                        })()}
                  </p>
                </div>
                <Phone className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    VIP Guests (3+ visits)
                  </h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const guestCounts = new Map();
                          bookings.forEach((b) => {
                            guestCounts.set(
                              b.guest_email,
                              (guestCounts.get(b.guest_email) || 0) + 1
                            );
                          });
                          return Array.from(guestCounts.values()).filter(
                            (count) => count >= 3
                          ).length;
                        })()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </>
        )}

        {selectedReport.id === "revenue-summary" && (
          <AdminOnly action="View financial reports">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Total Revenue
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    {isLoading ? "..." : formatCurrency(totalRevenue)}
                  </p>
                </div>
                <PhilippinePeso className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Paid Bookings
                  </h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {isLoading ? "..." : confirmedBookings.length}
                  </p>
                </div>
                <PhilippinePeso className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Average/Booking
                  </h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {isLoading
                      ? "..."
                      : formatCurrency(
                          confirmedBookings.length > 0
                            ? totalRevenue / confirmedBookings.length
                            : 0
                        )}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Nights Sold
                  </h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          return confirmedBookings.reduce((sum, b) => {
                            const checkIn = new Date(b.check_in_date);
                            const checkOut = new Date(b.check_out_date);
                            return (
                              sum +
                              Math.ceil(
                                (checkOut.getTime() - checkIn.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            );
                          }, 0);
                        })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </AdminOnly>
        )}

        {selectedReport.id === "booking-calendar" && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Future Bookings
                  </h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const today = new Date();
                          return filteredBookings.filter(
                            (b) => new Date(b.check_in_date) >= today
                          ).length;
                        })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Next Month
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const today = new Date();
                          const next30 = new Date(
                            today.getTime() + 30 * 24 * 60 * 60 * 1000
                          );
                          return filteredBookings.filter((b) => {
                            const checkIn = new Date(b.check_in_date);
                            return checkIn >= today && checkIn <= next30;
                          }).length;
                        })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Confirmed Guests
                  </h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const today = new Date();
                          return filteredBookings.filter(
                            (b) =>
                              new Date(b.check_in_date) >= today &&
                              b.status === "confirmed"
                          ).length;
                        })()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">
                    Pending Bookings
                  </h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {isLoading
                      ? "..."
                      : (() => {
                          const today = new Date();
                          return filteredBookings.filter(
                            (b) =>
                              new Date(b.check_in_date) >= today &&
                              b.status === "pending"
                          ).length;
                        })()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">
            Booking Results
          </h3>
          <span className="text-xs sm:text-sm text-gray-700">
            {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}{" "}
            found
            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-700">Loading bookings...</span>
          </div>
        ) : bookings.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {currentBookings.map((booking) => (
                <div
                  key={`mobile-${booking.id}`}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">
                        {booking.guest_name}
                      </h4>
                      <p className="text-xs text-gray-600 truncate max-w-[180px]">
                        {booking.guest_email || "No email"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.status || "Unknown"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Check-in</p>
                      <p className="text-gray-900">
                        {new Date(booking.check_in_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Check-out</p>
                      <p className="text-gray-900">
                        {new Date(booking.check_out_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="text-gray-900 font-medium">
                        {formatCurrency(booking.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Booked</p>
                      <p className="text-gray-900">
                        {booking.created_at
                          ? new Date(booking.created_at).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                  {booking.status === "cancelled" && booking.cancelled_by && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Cancelled by:{" "}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          booking.cancelled_by === "user"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {booking.cancelled_by === "user" ? "Guest" : "Admin"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Check In
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Check Out
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Cancelled By
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Booked
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {booking.guest_name}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {booking.guest_email || "No email"}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {new Date(booking.check_in_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {new Date(booking.check_out_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatCurrency(booking.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {booking.status === "cancelled" &&
                        booking.cancelled_by ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              booking.cancelled_by === "user"
                                ? "bg-orange-100 text-orange-800"
                                : booking.cancelled_by === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {booking.cancelled_by === "user"
                              ? "Guest"
                              : booking.cancelled_by === "admin"
                              ? "Admin"
                              : booking.cancelled_by}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {booking.created_at
                          ? new Date(booking.created_at).toLocaleDateString()
                          : "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 gap-3">
                  <div className="text-xs sm:text-sm text-gray-900 font-medium">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, bookings.length)} of {bookings.length}{" "}
                    bookings
                  </div>

                  {/* Mobile Pagination */}
                  <div className="flex sm:hidden w-full justify-between items-center">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-700">
                      Page {currentPage}/{totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>

                  {/* Desktop Pagination */}
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm rounded-lg font-medium ${
                              currentPage === page
                                ? "bg-green-600 text-white"
                                : "border border-gray-300 text-gray-900 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-700">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-60" />
            <p>No bookings found for the selected filters</p>
            <p className="text-sm mt-1">
              Try adjusting your date range or status filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
