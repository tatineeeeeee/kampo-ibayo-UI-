"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { Tables } from "../../../../database.types";

type User = Tables<"users">;

interface UserDeleteConfirmProps {
  user: User | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UserDeleteConfirm({
  user,
  onConfirm,
  onCancel,
}: UserDeleteConfirmProps) {
  const [bookingInfo, setBookingInfo] = useState<{
    loading: boolean;
    total: number;
    active: number;
    upcoming: number;
    recent: number;
    error: string | null;
  }>({
    loading: true,
    total: 0,
    active: 0,
    upcoming: 0,
    recent: 0,
    error: null,
  });

  useEffect(() => {
    const fetchBookingInfo = async () => {
      if (!user?.auth_id) {
        setBookingInfo((prev) => ({
          ...prev,
          loading: false,
          error: "No user ID found",
        }));
        return;
      }

      try {
        const { data: bookings, error } = await supabase
          .from("bookings")
          .select("id, status, check_in_date, check_out_date")
          .eq("user_id", user.auth_id);

        if (error) {
          setBookingInfo((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to load bookings",
          }));
          return;
        }

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeBookings =
          bookings?.filter(
            (b) =>
              b.status === "pending" ||
              b.status === "confirmed" ||
              b.status === "paid"
          ).length || 0;

        const upcomingBookings =
          bookings?.filter((b) => {
            const checkInDate = new Date(b.check_in_date);
            return checkInDate > today;
          }).length || 0;

        const recentBookings =
          bookings?.filter((b) => {
            const checkOutDate = new Date(b.check_out_date);
            return checkOutDate > thirtyDaysAgo;
          }).length || 0;

        setBookingInfo({
          loading: false,
          total: bookings?.length || 0,
          active: activeBookings,
          upcoming: upcomingBookings,
          recent: recentBookings,
          error: null,
        });
      } catch (err) {
        console.error("Error fetching booking info:", err);
        setBookingInfo((prev) => ({
          ...prev,
          loading: false,
          error: "Error checking bookings",
        }));
      }
    };

    fetchBookingInfo();
  }, [user?.auth_id]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Delete User?
          </h3>
          <p className="text-sm text-muted-foreground">This action cannot be undone</p>
        </div>

        {/* User Info Card */}
        <div className="bg-muted rounded-lg p-3 mb-4">
          <div className="text-sm">
            <p className="font-medium text-foreground">{user.full_name || "N/A"}</p>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">Role: {user.role}</p>
            <p className="text-xs text-muted-foreground">ID: {user.id}</p>
          </div>
        </div>

        {/* Booking Information */}
        <div className="bg-primary/10 border border-info/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2 mb-3">
            <svg
              className="w-4 h-4 text-primary mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-primary">
                User Booking Information
              </p>
              {bookingInfo.loading ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent"></div>
                  <span className="text-xs text-primary">
                    Checking bookings...
                  </span>
                </div>
              ) : bookingInfo.error ? (
                <p className="text-xs text-destructive mt-1">{bookingInfo.error}</p>
              ) : (
                <div className="mt-2 space-y-1">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-primary">Total Bookings:</span>
                      <span className="font-medium text-primary">
                        {bookingInfo.total}
                      </span>
                    </div>
                    {bookingInfo.active > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Active:</span>
                        <span className="font-medium">
                          {bookingInfo.active}
                        </span>
                      </div>
                    )}
                    {bookingInfo.upcoming > 0 && (
                      <div className="flex justify-between text-warning">
                        <span>Upcoming:</span>
                        <span className="font-medium">
                          {bookingInfo.upcoming}
                        </span>
                      </div>
                    )}
                    {bookingInfo.recent > 0 && (
                      <div className="flex justify-between text-warning">
                        <span>Recent (30d):</span>
                        <span className="font-medium">
                          {bookingInfo.recent}
                        </span>
                      </div>
                    )}
                  </div>

                  {bookingInfo.total === 0 && (
                    <p className="text-xs text-success mt-2">
                      ✅ No bookings found - safe to delete
                    </p>
                  )}

                  {(bookingInfo.active > 0 ||
                    bookingInfo.upcoming > 0 ||
                    bookingInfo.recent > 0) && (
                    <p className="text-xs text-warning mt-2 font-medium">
                      ⚠️ User has active/upcoming/recent bookings
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Override Warning */}
        <div className="bg-warning/10 border-l-4 border-warning p-3 mb-6">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-warning mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <p className="text-xs font-medium text-warning">
                Admin Override
              </p>
              <p className="text-xs text-warning mt-1">
                As an admin, you can delete users regardless of booking status.
                This bypasses all user safety restrictions.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-destructive rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}
