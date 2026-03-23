"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { Tables } from "../../../../database.types";

type User = Tables<"users">;
type Booking = Tables<"bookings">;

interface UserBookingsSectionProps {
  user: User;
  onClose: () => void;
}

export function UserBookingsSection({ user, onClose }: UserBookingsSectionProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false); // Start false for instant modal

  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user.auth_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.auth_id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching user bookings:", error);
        } else {
          setBookings(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch once when user.auth_id is available
    if (user.auth_id) {
      fetchUserBookings();
    }
  }, [user.auth_id]); // Remove showError dependency to prevent infinite loop

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-warning/10 text-warning",
      confirmed: "bg-success/10 text-success",
      cancelled: "bg-destructive/10 text-destructive",
      completed: "bg-info/10 text-primary",
    };
    return badges[status as keyof typeof badges] || "bg-muted text-foreground";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 w-full max-w-5xl max-h-[85vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-border bg-gradient-to-r from-primary/10 to-info/10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Bookings for {user.full_name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user.email} • User ID: {user.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-full p-2 transition-all duration-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-info/20 border-t-primary mb-4"></div>
              <span className="text-muted-foreground font-medium">
                Loading bookings...
              </span>
              <span className="text-muted-foreground text-sm mt-1">
                Please wait while we fetch the data
              </span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Bookings Found
              </h3>
              <p className="text-muted-foreground">
                This user hasn&apos;t made any bookings yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-info/20 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-primary mb-1">
                  Booking Summary
                </h3>
                <p className="text-sm text-primary">
                  Total bookings:{" "}
                  <span className="font-semibold">{bookings.length}</span>
                </p>
              </div>

              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-gradient-to-r from-card to-muted border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Booking #{booking.id}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDate(booking.check_in_date)} -{" "}
                        {formatDate(booking.check_out_date)}
                      </div>
                    </div>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(
                        booking.status || "pending"
                      )}`}
                    >
                      {booking.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-muted-foreground mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs text-muted-foreground">Guests</p>
                        <p className="font-medium text-foreground">
                          {booking.number_of_guests}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-muted-foreground mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="font-semibold text-success">
                          ₱{booking.total_amount?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-muted-foreground mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="font-medium text-foreground">
                          {booking.created_at
                            ? formatDate(booking.created_at)
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-muted-foreground mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs text-muted-foreground">Booking ID</p>
                        <p className="font-mono text-sm text-muted-foreground">
                          #{booking.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {booking.special_requests && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                      <div className="flex items-start">
                        <svg
                          className="w-4 h-4 text-warning mr-2 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                        <div>
                          <p className="text-xs font-medium text-warning mb-1">
                            Special Requests
                          </p>
                          <p className="text-sm text-warning">
                            {booking.special_requests}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
