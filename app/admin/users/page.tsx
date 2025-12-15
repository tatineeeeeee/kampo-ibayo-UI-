"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { useToastHelpers } from "../../components/Toast";
import { Tables } from "../../../database.types";
import {
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { exportUsersCSV } from "../../utils/csvExport";
import { exportUsersPDF } from "../../utils/pdfExport";

type User = Tables<"users">;
type Booking = Tables<"bookings">;

interface UserBookingsModalProps {
  user: User;
  onClose: () => void;
}

interface DeleteConfirmModalProps {
  user: User | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({
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
            <p className="font-medium text-gray-900">{user.name || "N/A"}</p>
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

function UserBookingsModal({ user, onClose }: UserBookingsModalProps) {
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
              Bookings for {user.name}
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false); // ✅ Start false for instant UI
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRole, setEditRole] = useState("");
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedUserBookings, setSelectedUserBookings] = useState<User | null>(
    null
  );
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  // 🔐 Enhanced role-based access control
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);

  // Standardized toast helpers
  const { success, error: showError, warning } = useToastHelpers();

  // Staff can access this page but with view-only permissions (handled in canEditUserRole and canDeleteUser)

  const fetchUsers = useCallback(async () => {
    try {
      console.log("🔍 Fetching users...");

      // Get current user role first
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: currentUserData, error: userError } = await supabase
          .from("users")
          .select("role, id")
          .eq("auth_id", session.user.id)
          .single();

        if (userError) {
          console.error("❌ Error fetching current user:", userError);
        } else {
          console.log("✅ Current user data:", currentUserData);
          const isAdmin = currentUserData?.role === "admin";
          setIsCurrentUserAdmin(isAdmin);
          setCurrentUserRole(currentUserData?.role || null);
          // For now, treat all admins as having full admin powers until super admin column is added
          setIsCurrentUserSuperAdmin(isAdmin);
          setCurrentUserId(currentUserData?.id || null);
          console.log("🔐 Admin status set:", {
            isAdmin,
            role: currentUserData?.role,
            id: currentUserData?.id,
          });
        }
      }

      // Then fetch all users
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching users:", error);
        showError("Failed to fetch users");
      } else {
        console.log("✅ Successfully fetched users:", data?.length || 0);
        setUsers(data || []);
      }
    } catch (error) {
      console.error("❌ Error in fetchUsers:", error);
      showError("An error occurred while fetching users");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // ✅ OPTIMIZED: Delayed fetch to not block navigation
  // Staff can now see users list (but with view-only permissions)
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 100);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Filter users based on search term and role filter
  useEffect(() => {
    let filtered = users;

    // First filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Then filter by search term (removed role search)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (user) =>
          // Search by name
          user.name?.toLowerCase().includes(searchLower) ||
          // Search by email
          user.email?.toLowerCase().includes(searchLower) ||
          // Search by ID
          user.id?.toString().includes(searchTerm.trim())
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredUsers]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
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

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!userId || !newRole) {
      warning("Invalid user data");
      return;
    }

    if (selectedUser?.role === newRole) {
      warning("User already has this role");
      return;
    }

    try {
      const updateData = { role: newRole };

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;

      success(`User role updated to ${newRole}!`);
      setShowEditModal(false);
      setSelectedUser(null);
      setEditRole("");
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error updating user role:", error);
      showError("Failed to update user role");
    }
  };

  // 🔐 Permission check: Can current user delete the target user?
  const canDeleteUser = (targetUser: User): boolean => {
    // Staff cannot delete anyone
    if (currentUserRole === "staff") return false;

    // Cannot delete yourself
    if (targetUser.id === currentUserId) return false;

    // Super Admin cannot be deleted by anyone
    if (targetUser.is_super_admin) return false;

    // Only Super Admin can delete other admins
    if (targetUser.role === "admin" && !isCurrentUserSuperAdmin) return false;

    // Admins and Super Admins can delete users and staff
    return isCurrentUserAdmin || isCurrentUserSuperAdmin;
  };

  // 🔐 Permission check: Can current user edit the target user's role?
  const canEditUserRole = (targetUser: User): boolean => {
    // Staff cannot edit roles
    if (currentUserRole === "staff") return false;

    // Cannot edit your own role (must be done by another admin)
    if (targetUser.id === currentUserId) return false;

    // Super Admin's role cannot be changed
    if (targetUser.is_super_admin) return false;

    // Only Super Admin can change other admin's roles
    if (targetUser.role === "admin" && !isCurrentUserSuperAdmin) return false;

    // Admins and Super Admins can edit users and staff roles
    return isCurrentUserAdmin || isCurrentUserSuperAdmin;
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!userId) {
      warning("Invalid user data");
      return;
    }

    try {
      // Find the user to get their auth_id
      const userToDeleteData = users.find((u) => u.id === userId);
      if (!userToDeleteData) {
        showError("User not found");
        return;
      }

      // 🔒 CLIENT-SIDE AUDIT LOG: Admin initiating user deletion
      console.log("🔒 ADMIN AUDIT: Initiating user deletion from admin panel", {
        timestamp: new Date().toISOString(),
        adminAction: "DELETE_USER_INITIATED",
        targetUser: {
          id: userToDeleteData.id,
          email: userToDeleteData.email,
          name: userToDeleteData.name,
          role: userToDeleteData.role,
        },
        adminPanelLocation: "/admin/users",
        userAgent: navigator.userAgent,
      });

      console.log("Attempting to delete user:", {
        userId,
        hasAuthId: !!userToDeleteData.auth_id,
      });

      // Use the hard delete API to remove from both database and auth
      const response = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          authId: userToDeleteData.auth_id,
        }),
      });

      console.log("Delete API response status:", response.status);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response received:", textResponse);
        throw new Error("Server returned invalid response format");
      }

      const result = await response.json();
      console.log("Delete API result:", result);

      if (!response.ok) {
        const errorMsg =
          result.error || result.message || "Failed to delete user";
        throw new Error(errorMsg);
      }

      // Handle successful response
      if (result.success) {
        // 🔒 CLIENT-SIDE AUDIT LOG: Admin user deletion completed
        console.log("🔒 ADMIN AUDIT: User deletion completed successfully", {
          timestamp: new Date().toISOString(),
          adminAction: "DELETE_USER_COMPLETED",
          targetUser: {
            id: userToDeleteData.id,
            email: userToDeleteData.email,
            name: userToDeleteData.name,
            role: userToDeleteData.role,
          },
          result: {
            success: true,
            hasAuthError: !!result.authError,
          },
          adminPanelLocation: "/admin/users",
        });

        const message =
          result.message ||
          "User completely deleted! They can now re-register with the same email if needed.";
        success(message);

        // Show warning if auth deletion failed
        if (result.authError) {
          warning("Note: Authentication cleanup may be incomplete");
        }
      } else {
        throw new Error("Deletion was not successful");
      }

      fetchUsers(); // Refresh the list

      // Close the modal
      setUserToDelete(null);
      setShowDeleteModal(false);
    } catch (error) {
      // Find the user data for audit logging (since userToDeleteData might be out of scope)
      const userForAudit = users.find((u) => u.id === userId);

      // 🔒 CLIENT-SIDE AUDIT LOG: Admin user deletion failed
      console.error("🔒 ADMIN AUDIT: User deletion failed", {
        timestamp: new Date().toISOString(),
        adminAction: "DELETE_USER_FAILED",
        targetUser: {
          id: userForAudit?.id || userId,
          email: userForAudit?.email || "unknown",
          name: userForAudit?.name || "unknown",
          role: userForAudit?.role || "unknown",
        },
        error: error instanceof Error ? error.message : "Unknown error",
        adminPanelLocation: "/admin/users",
      });

      console.error("Error deleting user:", error);

      if (error instanceof Error) {
        if (error.message.includes("configuration")) {
          showError("Server configuration error. Please contact support.");
        } else if (error.message.includes("invalid response format")) {
          showError("Server error. Please try again or contact support.");
        } else {
          showError(`Failed to delete user: ${error.message}`);
        }
      } else {
        showError("Failed to delete user - unknown error occurred");
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeClass = (role: string, isSuperAdmin?: boolean) => {
    if (isSuperAdmin) {
      return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-300 shadow-sm";
    }
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border border-red-200";
      case "staff":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "user":
      default:
        return "bg-green-100 text-green-800 border border-green-200";
    }
  };

  // Get role display with icon for super admin
  const getRoleDisplay = (user: User) => {
    if (user.is_super_admin) {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(
            user.role || "admin",
            true
          )}`}
        >
          <Crown className="w-3 h-3" />
          Super Admin
        </span>
      );
    }
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(
          user.role || "user"
        )}`}
      >
        {user.role || "user"}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400 text-sm sm:text-base"
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
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Found {filteredUsers.length} user
              {filteredUsers.length !== 1 ? "s" : ""} matching &quot;
              {searchTerm}&quot;
            </p>
          )}
        </div>

        {/* Role Filter Buttons */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                roleFilter === "all"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter("admin")}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                roleFilter === "admin"
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              Admin ({users.filter((u) => u.role === "admin").length})
            </button>
            <button
              onClick={() => setRoleFilter("staff")}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                roleFilter === "staff"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              Staff ({users.filter((u) => u.role === "staff").length})
            </button>
            <button
              onClick={() => setRoleFilter("user")}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                roleFilter === "user"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              Users ({users.filter((u) => u.role === "user").length})
            </button>
          </div>
          {(roleFilter !== "all" || searchTerm) && (
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Showing {filteredUsers.length} of {users.length} users
              {roleFilter !== "all" && ` with role "${roleFilter}"`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              User Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {loading
                ? "Loading users..."
                : `Manage user accounts and roles (${filteredUsers.length}${
                    searchTerm ? ` of ${users.length}` : ""
                  } users)`}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Export CSV Button */}
            <button
              onClick={() => {
                try {
                  exportUsersCSV(
                    filteredUsers as unknown as {
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
                    `${filteredUsers.length} users exported to CSV successfully!`
                  );
                } catch (error) {
                  console.error("Export error:", error);
                  showError("Failed to export CSV");
                }
              }}
              disabled={filteredUsers.length === 0}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                filteredUsers.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              title="Export filtered users to CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={async () => {
                try {
                  await exportUsersPDF(
                    filteredUsers as unknown as {
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
                    `${filteredUsers.length} users exported to PDF successfully!`
                  );
                } catch (error) {
                  console.error("Export error:", error);
                  showError("Failed to export PDF");
                }
              }}
              disabled={filteredUsers.length === 0}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                filteredUsers.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              title="Export filtered users to PDF"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={fetchUsers}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <span className="hidden sm:inline">Refresh Users</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm sm:text-base">Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm ? (
              <div>
                <p className="text-gray-500 text-sm sm:text-base">
                  No users found matching &quot;{searchTerm}&quot;
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <p className="text-gray-500">No users found.</p>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className={`bg-gray-50 rounded-lg p-4 border ${
                    user.is_super_admin
                      ? "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {user.name}
                        {user.is_super_admin && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">ID: {user.id}</div>
                    </div>
                    {getRoleDisplay(user)}
                  </div>
                  <div className="text-sm text-gray-700 mb-1">{user.email}</div>
                  <div className="text-xs text-gray-500 mb-3">
                    {user.phone || "No phone"}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    Joined:{" "}
                    {user.created_at ? formatDate(user.created_at) : "N/A"}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedUserBookings(user);
                        setShowBookingsModal(true);
                      }}
                      className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      View Bookings
                    </button>
                    {canEditUserRole(user) && (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setEditRole(user.role || "user");
                          setShowEditModal(true);
                        }}
                        className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                      >
                        Edit Role
                      </button>
                    )}
                    {canDeleteUser(user) && (
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        Delete
                      </button>
                    )}
                    {/* Show protected badge for super admin */}
                    {user.is_super_admin && (
                      <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-md border border-amber-200 shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Protected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          {user.is_super_admin && (
                            <Crown className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getRoleDisplay(user)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? formatDate(user.created_at) : "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUserBookings(user);
                            setShowBookingsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Bookings
                        </button>
                        {canEditUserRole(user) && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setEditRole(user.role || "user");
                              setShowEditModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit Role
                          </button>
                        )}
                        {canDeleteUser(user) && (
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                        {/* Show protected badge for super admin */}
                        {user.is_super_admin && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-md border border-amber-200">
                            <ShieldCheck className="w-3 h-3" />
                            Protected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {filteredUsers.length > 0 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-gray-50 px-3 sm:px-4 py-3 rounded-lg">
            {/* Items per page and info */}
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="itemsPerPage"
                  className="text-xs sm:text-sm text-gray-800 font-medium"
                >
                  Show:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm text-gray-800 font-medium bg-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <span className="text-xs sm:text-sm text-gray-800 font-medium">
                {Math.min(startIndex + 1, filteredUsers.length)}-
                {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{" "}
                {filteredUsers.length}
              </span>
            </div>

            {/* Page info and controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="hidden sm:inline text-xs sm:text-sm text-gray-800 font-medium mr-2 sm:mr-4">
                  Page {currentPage} of {totalPages}
                </span>
                {/* Navigation buttons */}
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  {/* Page numbers - hide on very small screens */}
                  <div className="hidden xs:flex items-center gap-0.5 sm:gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 2) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNumber = totalPages - 2 + i;
                      } else {
                        pageNumber = currentPage - 1 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => goToPage(pageNumber)}
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded border ${
                            currentPage === pageNumber
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  {/* Mobile page indicator */}
                  <span className="xs:hidden px-2 py-1.5 text-xs text-gray-700">
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Edit User Role
            </h2>
            <p className="text-gray-700 mb-4">
              Change role for:{" "}
              <span className="font-medium text-gray-900">
                {selectedUser.name}
              </span>
            </p>

            <div className="space-y-3">
              {[
                {
                  value: "user",
                  label: "User",
                  description: "Regular customer access",
                },
                {
                  value: "staff",
                  label: "Staff",
                  description: "Admin panel access + user management",
                },
                {
                  value: "admin",
                  label: "Admin",
                  description: "Full system access + all permissions",
                },
              ].map((role) => (
                <label
                  key={role.value}
                  className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={editRole === role.value}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">
                      {role.label}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {role.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setEditRole("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateUserRole(selectedUser.id, editRole)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!editRole}
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Bookings Modal */}
      {showBookingsModal && selectedUserBookings && (
        <UserBookingsModal
          user={selectedUserBookings}
          onClose={() => {
            setShowBookingsModal(false);
            setSelectedUserBookings(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <DeleteConfirmModal
          user={userToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
