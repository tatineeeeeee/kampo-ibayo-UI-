"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  Calendar,
  Star,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type:
    | "cancellation"
    | "flagged_review"
    | "pending_booking"
    | "payment_proof"
    | "payment_failed"
    | "approved_review";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link: string;
  data?: Record<string, unknown>;
}

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async (isSilent = false) => {
    try {
      // Only show loading spinner for manual refreshes, not auto-refresh
      if (!isSilent) {
        setLoading(true);
      }
      const notifs: Notification[] = [];

      // Only get notifications from last 7 days (more relevant)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 1. Get cancelled bookings (last 7 days)
      const { data: cancelledBookings } = await supabase
        .from("bookings")
        .select("id, guest_name, check_in_date, updated_at")
        .eq("status", "cancelled")
        .gte("updated_at", sevenDaysAgo.toISOString())
        .order("updated_at", { ascending: false })
        .limit(10);

      if (cancelledBookings) {
        cancelledBookings.forEach((booking) => {
          notifs.push({
            id: `cancel-${booking.id}`,
            type: "cancellation",
            title: "Booking Cancelled",
            message: `${
              booking.guest_name
            } cancelled their booking for ${new Date(
              booking.check_in_date
            ).toLocaleDateString()}`,
            timestamp: new Date(booking.updated_at || new Date()),
            read: false,
            link: "/admin/bookings",
            data: { bookingId: booking.id },
          });
        });
      }

      // 2. Get flagged reviews (all, but prioritize recent)
      const { data: flaggedReviews } = await supabase
        .from("guest_reviews")
        .select("id, guest_name, created_at")
        .eq("approved", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (flaggedReviews) {
        flaggedReviews.forEach((review) => {
          notifs.push({
            id: `review-${review.id}`,
            type: "flagged_review",
            title: "Flagged Review",
            message: `Review from ${review.guest_name} needs approval`,
            timestamp: new Date(review.created_at),
            read: false,
            link: "/admin/reviews",
            data: { reviewId: review.id },
          });
        });
      }

      // 3. Get pending bookings (last 7 days)
      const { data: pendingBookings } = await supabase
        .from("bookings")
        .select("id, guest_name, check_in_date, created_at")
        .eq("status", "pending")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (pendingBookings) {
        pendingBookings.forEach((booking) => {
          notifs.push({
            id: `pending-${booking.id}`,
            type: "pending_booking",
            title: "Pending Booking",
            message: `${booking.guest_name} - ${new Date(
              booking.check_in_date
            ).toLocaleDateString()}`,
            timestamp: new Date(booking.created_at || new Date()),
            read: false,
            link: "/admin/bookings",
            data: { bookingId: booking.id },
          });
        });
      }

      // 4. Get payments needing verification (last 7 days)
      const { data: paymentProofs } = await supabase
        .from("bookings")
        .select("id, guest_name, updated_at")
        .eq("payment_status", "payment_review")
        .gte("updated_at", sevenDaysAgo.toISOString())
        .order("updated_at", { ascending: false })
        .limit(10);

      if (paymentProofs) {
        paymentProofs.forEach((booking) => {
          notifs.push({
            id: `payment-${booking.id}`,
            type: "payment_proof",
            title: "Payment Proof Uploaded",
            message: `${booking.guest_name} uploaded payment proof`,
            timestamp: new Date(booking.updated_at || new Date()),
            read: false,
            link: "/admin/payments",
            data: { bookingId: booking.id },
          });
        });
      }

      // 5. Get failed payments (last 7 days)
      const { data: failedPayments } = await supabase
        .from("bookings")
        .select("id, guest_name, updated_at")
        .eq("payment_status", "failed")
        .gte("updated_at", sevenDaysAgo.toISOString())
        .order("updated_at", { ascending: false })
        .limit(10);

      if (failedPayments) {
        failedPayments.forEach((booking) => {
          notifs.push({
            id: `failed-payment-${booking.id}`,
            type: "payment_failed",
            title: "Payment Failed",
            message: `${booking.guest_name}'s payment was rejected`,
            timestamp: new Date(booking.updated_at || new Date()),
            read: false,
            link: "/admin/payments",
            data: { bookingId: booking.id },
          });
        });
      }

      // 6. Get newly approved reviews (last 7 days)
      const { data: approvedReviews } = await supabase
        .from("guest_reviews")
        .select("id, guest_name, rating, created_at")
        .eq("approved", true)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (approvedReviews) {
        approvedReviews.forEach((review) => {
          notifs.push({
            id: `approved-review-${review.id}`,
            type: "approved_review",
            title: "New Review Published",
            message: `${review.guest_name} left a ${review.rating}⭐ review`,
            timestamp: new Date(review.created_at),
            read: false,
            link: "/admin/reviews",
            data: { reviewId: review.id },
          });
        });
      }

      // Sort by timestamp (newest first) and limit to top 15
      notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Load read status from localStorage
      const readNotifs = JSON.parse(
        localStorage.getItem("adminReadNotifications") || "[]"
      );
      notifs.forEach((n) => {
        if (readNotifs.includes(n.id)) {
          n.read = true;
        }
      });

      setNotifications(notifs.slice(0, 15));
      setLastUpdated(new Date()); // Update timestamp
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(); // Initial load with loading spinner

    // Refresh every 30 seconds SILENTLY (isSilent = true)
    const interval = setInterval(() => fetchNotifications(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    const readNotifs = JSON.parse(
      localStorage.getItem("adminReadNotifications") || "[]"
    );
    if (!readNotifs.includes(id)) {
      readNotifs.push(id);
      localStorage.setItem(
        "adminReadNotifications",
        JSON.stringify(readNotifs)
      );
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem("adminReadNotifications", JSON.stringify(allIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    router.push(notification.link);
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "cancellation":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "flagged_review":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "pending_booking":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "payment_proof":
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case "payment_failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "approved_review":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchNotifications(false)} // Manual refresh shows loading
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                title="Refresh notifications"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            !notification.read
                              ? "text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-red-100 rounded-lg">
                  <div className="font-bold text-red-700">
                    {
                      notifications.filter((n) => n.type === "cancellation")
                        .length
                    }
                  </div>
                  <div className="text-red-600 text-xs">Cancelled</div>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <div className="font-bold text-yellow-700">
                    {
                      notifications.filter((n) => n.type === "flagged_review")
                        .length
                    }
                  </div>
                  <div className="text-yellow-600 text-xs">Flagged</div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <div className="font-bold text-blue-700">
                    {
                      notifications.filter((n) => n.type === "pending_booking")
                        .length
                    }
                  </div>
                  <div className="text-blue-600 text-xs">Pending</div>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="font-bold text-green-700">
                    {
                      notifications.filter((n) => n.type === "payment_proof")
                        .length
                    }
                  </div>
                  <div className="text-green-600 text-xs">Payment</div>
                </div>
                <div className="p-2 bg-red-200 rounded-lg">
                  <div className="font-bold text-red-800">
                    {
                      notifications.filter((n) => n.type === "payment_failed")
                        .length
                    }
                  </div>
                  <div className="text-red-700 text-xs">Failed</div>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <div className="font-bold text-emerald-700">
                    {
                      notifications.filter((n) => n.type === "approved_review")
                        .length
                    }
                  </div>
                  <div className="text-emerald-600 text-xs">Approved</div>
                </div>
              </div>
              {/* Last Updated Timestamp */}
              <div className="text-center mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    Last updated: {getTimeAgo(lastUpdated)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
