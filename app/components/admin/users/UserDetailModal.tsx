"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { Tables } from "../../../../database.types";

type User = Tables<"users">;
type Booking = Tables<"bookings">;

// ---------------------------------------------------------------------------
// Delete Confirm Modal
// ---------------------------------------------------------------------------

interface DeleteConfirmModalProps {
  user: User | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  user,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
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
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-red-600"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Delete User?
          </h3>
          <p className="text-sm text-gray-600">This action cannot be undone</p>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="text-sm">
            <p className="font-medium text-gray-900">{user.full_name || "N/A"}</p>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1">Role: {user.role}</p>
            <p className="text-xs text-gray-500">ID: {user.id}</p>
          </div>
        </div>

        {/* Booking Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2 mb-3">
            <svg
              className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
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
              <p className="text-sm font-medium text-blue-800">
                User Booking Information
              </p>
              {bookingInfo.loading ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                  <span className="text-xs text-blue-700">
                    Checking bookings...
                  </span>
                </div>
              ) : bookingInfo.error ? (
                <p className="text-xs text-red-600 mt-1">{bookingInfo.error}</p>
              ) : (
                <div className="mt-2 space-y-1">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Bookings:</span>
                      <span className="font-medium text-blue-800">
                        {bookingInfo.total}
                      </span>
                    </div>
                    {bookingInfo.active > 0 && (
                      <div className="flex justify-between text-red-700">
                        <span>Active:</span>
                        <span className="font-medium">
                          {bookingInfo.active}
                        </span>
                      </div>
                    )}
                    {bookingInfo.upcoming > 0 && (
                      <div className="flex justify-between text-orange-700">
                        <span>Upcoming:</span>
                        <span className="font-medium">
                          {bookingInfo.upcoming}
                        </span>
                      </div>
                    )}
                    {bookingInfo.recent > 0 && (
                      <div className="flex justify-between text-yellow-700">
                        <span>Recent (30d):</span>
                        <span className="font-medium">
                          {bookingInfo.recent}
                        </span>
                      </div>
                    )}
                  </div>

                  {bookingInfo.total === 0 && (
                    <p className="text-xs text-green-700 mt-2">
                      ✅ No bookings found - safe to delete
                    </p>
                  )}

                  {(bookingInfo.active > 0 ||
                    bookingInfo.upcoming > 0 ||
                    bookingInfo.recent > 0) && (
                    <p className="text-xs text-amber-700 mt-2 font-medium">
                      ⚠️ User has active/upcoming/recent bookings
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Override Warning */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-6">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0"
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
              <p className="text-xs font-medium text-amber-800">
                Admin Override
              </p>
              <p className="text-xs text-amber-700 mt-1">
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
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Bookings Modal
// ---------------------------------------------------------------------------

interface UserBookingsModalProps {
  user: User;
  onClose: () => void;
}

export function UserBookingsModal({ user, onClose }: UserBookingsModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false); // ✅ Start false for instant modal

  // Toast helpers removed as we handle errors silently in modal

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
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return badges[status as keyof typeof badges] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 w-full max-w-5xl max-h-[85vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Bookings for {user.full_name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {user.email} • User ID: {user.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
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
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <span className="text-gray-600 font-medium">
                Loading bookings...
              </span>
              <span className="text-gray-400 text-sm mt-1">
                Please wait while we fetch the data
              </span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Bookings Found
              </h3>
              <p className="text-gray-500">
                This user hasn&apos;t made any bookings yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  Booking Summary
                </h3>
                <p className="text-sm text-blue-700">
                  Total bookings:{" "}
                  <span className="font-semibold">{bookings.length}</span>
                </p>
              </div>

              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Booking #{booking.id}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
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
                        className="w-4 h-4 text-gray-400 mr-2"
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
                        <p className="text-xs text-gray-500">Guests</p>
                        <p className="font-medium text-gray-900">
                          {booking.number_of_guests}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2"
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
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="font-semibold text-green-600">
                          ₱{booking.total_amount?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2"
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
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="font-medium text-gray-700">
                          {booking.created_at
                            ? formatDate(booking.created_at)
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2"
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
                        <p className="text-xs text-gray-500">Booking ID</p>
                        <p className="font-mono text-sm text-gray-600">
                          #{booking.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {booking.special_requests && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <svg
                          className="w-4 h-4 text-yellow-600 mr-2 mt-0.5"
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
                          <p className="text-xs font-medium text-yellow-800 mb-1">
                            Special Requests
                          </p>
                          <p className="text-sm text-yellow-700">
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

// ---------------------------------------------------------------------------
// Add User Modal
// ---------------------------------------------------------------------------

import {
  UserPlus,
  Check,
  Copy,
  AlertTriangle,
} from "lucide-react";
import {
  validatePhilippinePhone,
  formatPhoneForDisplay,
} from "../../../utils/phoneUtils";

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: (tempPassword: string, userName: string, userEmail: string) => void;
  canCreateAdmin: boolean;
}

export function AddUserModal({ onClose, onSuccess, canCreateAdmin }: AddUserModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("staff");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setGeneralError("");
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    else if (firstName.trim().length > 50)
      newErrors.firstName = "Must be 50 characters or less";

    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    else if (lastName.trim().length > 50)
      newErrors.lastName = "Must be 50 characters or less";

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!email.includes("@") || !email.includes("."))
      newErrors.email = "Please enter a valid email address";

    if (phone.trim() && !validatePhilippinePhone(phone))
      newErrors.phone = "Invalid format. Use 09XX-XXX-XXXX";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError("");

    try {
      const { getFreshSession } = await import("../../../utils/apiTimeout");
      const session = await getFreshSession(supabase);

      if (!session) {
        setGeneralError("Session expired. Please log in again.");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        setGeneralError("Server returned an unexpected response");
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        setGeneralError(result.error || "Failed to create user");
        setIsSubmitting(false);
        return;
      }

      onSuccess(result.tempPassword, result.user.fullName, result.user.email);
    } catch {
      setGeneralError("Network error. Please check your connection.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-emerald-100 rounded-full">
            <UserPlus className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
        </div>

        {generalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {generalError}
          </div>
        )}

        <div className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFieldError("firstName");
              }}
              placeholder="Enter first name"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 ${
                errors.firstName ? "border-red-400" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearFieldError("lastName");
              }}
              placeholder="Enter last name"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 ${
                errors.lastName ? "border-red-400" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              placeholder="user@example.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 ${
                errors.email ? "border-red-400" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const formatted = formatPhoneForDisplay(e.target.value);
                setPhone(formatted);
                clearFieldError("phone");
              }}
              placeholder="09XX-XXX-XXXX"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 ${
                errors.phone ? "border-red-400" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
              disabled={isSubmitting}
            >
              <option value="staff">Staff — Admin panel access</option>
              {canCreateAdmin && (
                <option value="admin">Admin — Full system access</option>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {role === "staff"
                ? "Staff can view the admin panel and manage bookings"
                : "Admins have full system access and all permissions"}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              "Create User"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Password Reveal Modal (shown once after user creation)
// ---------------------------------------------------------------------------

interface PasswordRevealModalProps {
  userName: string;
  userEmail: string;
  tempPassword: string;
  onClose: () => void;
}

export function PasswordRevealModal({
  userName,
  userEmail,
  tempPassword,
  onClose,
}: PasswordRevealModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
      const el = document.getElementById("temp-password-display");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 rounded-full">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            User Created Successfully
          </h2>
        </div>

        {/* User info card */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-sm text-gray-600">{userEmail}</p>
        </div>

        {/* Temporary password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temporary Password
          </label>
          <div className="flex items-center gap-2">
            <code
              id="temp-password-display"
              className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm text-gray-900 select-all"
            >
              {tempPassword}
            </code>
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                copied
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-5 rounded-r-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              This password will only be shown once. Please share it securely
              with the new user. They can change it later via password reset.
            </p>
          </div>
        </div>

        {/* Done button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
