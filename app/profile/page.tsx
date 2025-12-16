"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import { useBookingStats } from "../hooks/useBookingStats";
import { useAuth } from "../contexts/AuthContext";
import { isMaintenanceMode } from "../utils/maintenanceMode";
import type { User } from "@supabase/supabase-js";
import {
  FaUser,
  FaEnvelope,
  FaUserTag,
  FaEdit,
  FaSignOutAlt,
  FaHome,
  FaCalendarAlt,
  FaClock,
  FaChartLine,
  FaStar,
  FaCalendarPlus,
  FaHistory,
  FaCog,
  FaSpinner,
  FaPhone,
} from "react-icons/fa";
import { useToastHelpers } from "../components/Toast";
import {
  formatPhoneForDisplay,
  validatePhilippinePhone,
  cleanPhoneForDatabase,
} from "../utils/phoneUtils";

// Robust session validation helper
const validateAndRefreshSession = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(`Session validation attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw error;
      }

      if (session && session.access_token) {
        // Verify the session is still valid by making a test request
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) {
          console.error(
            `User validation attempt ${attempt} failed:`,
            userError
          );
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw userError;
        }

        if (userData.user) {
          return { session, user: userData.user };
        }
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.error(`Session validation attempt ${attempt} error:`, err);
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error("No valid session found after multiple attempts");
};

function ProfilePageContent({ user }: { user: User }) {
  const { loading } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    phone: string;
    role: string;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Standardized toast helpers
  const { success, error: showError, warning, info } = useToastHelpers();

  // Use the booking stats hook
  const { stats: bookingStats, loading: statsLoading } = useBookingStats(user);

  // Phone number validation function
  const validatePhoneNumber = (phone: string): boolean => {
    return validatePhilippinePhone(phone);
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    return formatPhoneForDisplay(value);
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "");

    // Limit to 11 digits
    const limited = digitsOnly.slice(0, 11);

    // Format as 09XX-XXX-XXXX
    if (limited.length >= 8) {
      return `${limited.slice(0, 4)}-${limited.slice(4, 7)}-${limited.slice(
        7
      )}`;
    } else if (limited.length >= 4) {
      return `${limited.slice(0, 4)}-${limited.slice(4)}`;
    }
    return limited;
  };

  // Fetch user profile from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("name, email, phone, role")
          .eq("auth_id", user.id)
          .single();

        if (!error && data) {
          setUserProfile({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            role: data.role || "user",
          });
        } else {
          console.error("Error fetching user profile:", error);
          // Fallback to auth metadata
          setUserProfile({
            name: user.user_metadata?.name || "",
            email: user.email || "",
            phone: user.user_metadata?.phone || "",
            role: user.user_metadata?.role || "user",
          });
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
        // Fallback to auth metadata
        setUserProfile({
          name: user.user_metadata?.name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
          role: user.user_metadata?.role || "user",
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Maintenance mode checking
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const isActive = await isMaintenanceMode();
        setMaintenanceActive(isActive);
      } catch (error) {
        console.error("Error checking maintenance mode:", error);
      }
    };

    checkMaintenanceMode();

    // Check every 3 seconds for maintenance mode changes
    const interval = setInterval(checkMaintenanceMode, 3000);

    return () => clearInterval(interval);
  }, []);

  // Removed auth state listener - it was causing tab switching issues

  const handleSignOut = async () => {
    setSigningOut(true);
    warning("Signing out...");

    try {
      // Use safe logout utility to prevent hanging
      const { safeLogout } = await import("../utils/apiTimeout");
      await safeLogout(supabase, 3000);

      success("Successfully signed out!");

      // Use window.location for reliable redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      console.error("Unexpected error during sign out:", err);
      showError("An unexpected error occurred during sign out.");

      // Force cleanup and redirect
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
    // Don't set signingOut to false since we're redirecting
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) {
      warning("Please enter a valid name.");
      return;
    }

    setUpdating(true);
    info("Updating your name...");

    try {
      // Validate session with retry logic
      await validateAndRefreshSession();

      // Update both auth metadata and users table
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: newName.trim() },
      });

      if (authError) {
        console.error("Error updating auth name:", authError);
        showError("Failed to update name. Please try again.");
        return;
      }

      // Also update the users table so admin panel shows the change
      const { error: dbError } = await supabase
        .from("users")
        .update({ name: newName.trim() })
        .eq("auth_id", user.id);

      if (dbError) {
        console.error("Error updating database name:", dbError);
        warning("Name updated in profile but may not appear in admin panel.");
      } else {
        success("Name updated successfully!");
      }

      setEditingName(false);
      setNewName("");

      // Update local profile state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          name: newName.trim(),
        });
      }

      // Refresh user data
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        // User data updated - could trigger a re-render through auth state
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      showError("An unexpected error occurred. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNewName("");
    warning("Name edit cancelled.");
  };

  const handleStartEdit = () => {
    setNewName(userProfile?.name || user?.user_metadata?.name || "");
    setEditingName(true);
  };

  const handleUpdatePhone = async () => {
    if (!user || !newPhone.trim()) {
      warning("Please enter a valid phone number.");
      return;
    }

    if (!validatePhoneNumber(newPhone)) {
      showError("Phone number must be exactly 11 digits long!");
      return;
    }

    setUpdatingPhone(true);
    info("Updating your phone number...");

    try {
      // Validate session with retry logic
      await validateAndRefreshSession();

      // Clean phone number for database storage (convert to international format)
      const cleanedPhone = cleanPhoneForDatabase(newPhone.trim());

      // Update both auth metadata and users table
      const { error: authError } = await supabase.auth.updateUser({
        data: { phone: cleanedPhone },
      });

      if (authError) {
        console.error("Error updating auth phone:", authError);
        showError("Failed to update phone number. Please try again.");
        return;
      }

      // Also update the users table so admin panel shows the change
      const { error: dbError } = await supabase
        .from("users")
        .update({ phone: cleanedPhone })
        .eq("auth_id", user.id);

      if (dbError) {
        console.error("Error updating database phone:", dbError);
        warning("Phone updated in profile but may not appear in admin panel.");
      } else {
        success("Phone number updated successfully!");
      }

      setEditingPhone(false);
      setNewPhone("");

      // Update local profile state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          phone: newPhone.trim(),
        });
      }

      // Refresh user data
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        // User data updated - could trigger a re-render through auth state
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      showError("An unexpected error occurred. Please try again.");
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleCancelPhoneEdit = () => {
    setEditingPhone(false);
    setNewPhone("");
    warning("Phone edit cancelled.");
  };

  const handleStartPhoneEdit = () => {
    const currentPhone = userProfile?.phone || user?.user_metadata?.phone || "";
    const formatted = formatPhoneNumber(currentPhone);
    setNewPhone(formatted);
    setEditingPhone(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            Please log in to view your profile.
          </p>
          <div className="space-y-3">
            <Link href="/auth">
              <button className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition">
                Login
              </button>
            </Link>
            <Link href="/">
              <button className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Mobile-First Sticky Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaHome className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </Link>
              <div className="text-white">
                <h1 className="text-lg sm:text-xl font-bold">My Profile</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                  Manage your account
                </p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 text-right">
              {loading ? (
                <span className="inline-block bg-gray-600 text-gray-300 px-2 py-1 rounded-full text-xs font-medium">
                  ● Loading...
                </span>
              ) : user ? (
                <span className="inline-block bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  ● Signed In
                </span>
              ) : (
                <span className="inline-block bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  ● Guest
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile First */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {/* Profile Information Card */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-red-600 p-3 sm:p-4 rounded-full shadow-lg ring-4 ring-red-600/20 flex-shrink-0">
              <FaUser className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                {loadingProfile
                  ? "Loading..."
                  : userProfile?.name || user.user_metadata?.name || "User"}
              </h2>
              <p className="text-sm sm:text-base text-gray-400">
                Member since{" "}
                {bookingStats.memberSince ||
                  new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-700/70 rounded-lg border border-gray-600/30">
              <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                {editingName ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:border-red-500 focus:outline-none flex-1 text-sm sm:text-base"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateName();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={updating || !newName.trim()}
                      className="text-green-500 hover:text-green-400 disabled:text-gray-500 disabled:cursor-not-allowed min-w-[28px] h-7 flex items-center justify-center"
                    >
                      {updating ? (
                        <FaSpinner className="animate-spin w-3 h-3" />
                      ) : (
                        "✓"
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-red-500 hover:text-red-400 min-w-[28px] h-7 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold text-sm sm:text-base truncate">
                      {loadingProfile
                        ? "Loading..."
                        : userProfile?.name ||
                          user.user_metadata?.name ||
                          "Not provided"}
                    </p>
                    <button
                      onClick={handleStartEdit}
                      disabled={loadingProfile}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-700/70 rounded-lg border border-gray-600/30">
              <FaPhone className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                {editingPhone ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setNewPhone(formatted);
                      }}
                      placeholder="09XX-XXX-XXXX (11 digits)"
                      className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:border-red-500 focus:outline-none flex-1 text-sm sm:text-base"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdatePhone();
                        if (e.key === "Escape") handleCancelPhoneEdit();
                      }}
                    />
                    <button
                      onClick={handleUpdatePhone}
                      disabled={updatingPhone || !newPhone.trim()}
                      className="text-green-500 hover:text-green-400 disabled:text-gray-500 disabled:cursor-not-allowed min-w-[28px] h-7 flex items-center justify-center"
                    >
                      {updatingPhone ? (
                        <FaSpinner className="animate-spin w-3 h-3" />
                      ) : (
                        "✓"
                      )}
                    </button>
                    <button
                      onClick={handleCancelPhoneEdit}
                      className="text-red-500 hover:text-red-400 min-w-[28px] h-7 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold text-sm sm:text-base truncate">
                      {loadingProfile
                        ? "Loading..."
                        : userProfile?.phone || "Not provided"}
                    </p>
                    <button
                      onClick={handleStartPhoneEdit}
                      disabled={loadingProfile}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-700/70 rounded-lg border border-gray-600/30">
              <FaEnvelope className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <p className="text-white font-semibold text-sm sm:text-base truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-700/70 rounded-lg border border-gray-600/30">
              <FaUserTag className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Account Type
                </label>
                <span className="inline-block bg-red-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-md">
                  {loadingProfile
                    ? "Loading..."
                    : userProfile?.role || user.user_metadata?.role || "Guest"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Account Overview
            </h3>
            {statsLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
            )}
          </div>

          <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400">
              📊 Stats based on admin-confirmed completed stays only. Pending
              bookings await admin approval.
            </p>
          </div>

          {/* Stats Grid - Mobile First: 2 cols, Desktop: 4 cols */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
              <FaCalendarAlt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-white">
                {bookingStats.totalBookings}
              </div>
              <div className="text-xs text-gray-400">Resort Bookings</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
              <FaClock className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-white">
                {bookingStats.totalNights}
              </div>
              <div className="text-xs text-gray-400">Days at Resort</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
              <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold text-white">
                ₱{bookingStats.totalSpent.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Total Spent</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
              <FaStar className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mx-auto mb-2" />
              <div
                className={`text-lg sm:text-2xl font-bold ${
                  bookingStats.loyaltyStatus === "Elite"
                    ? "text-yellow-500"
                    : bookingStats.loyaltyStatus === "VIP"
                    ? "text-purple-500"
                    : bookingStats.loyaltyStatus === "Regular"
                    ? "text-blue-500"
                    : "text-green-500"
                }`}
              >
                {bookingStats.loyaltyStatus}
              </div>
              <div className="text-xs text-gray-400">Resort Status</div>
            </div>
          </div>

          {/* Status Alerts */}
          <div className="space-y-3 mb-6">
            {bookingStats.upcomingBookings > 0 && (
              <div className="p-3 bg-blue-600/20 border border-blue-600/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 text-sm">
                    Confirmed Upcoming
                  </span>
                  <span className="text-blue-300 font-semibold">
                    {bookingStats.upcomingBookings}
                  </span>
                </div>
              </div>
            )}

            {bookingStats.pendingBookings > 0 && (
              <div className="p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400 text-sm">
                    Awaiting Admin Approval
                  </span>
                  <span className="text-yellow-300 font-semibold">
                    {bookingStats.pendingBookings}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Breakdown section */}
          <div className="pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-4">
              Booking Status Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex justify-between items-center py-2 px-3 bg-gray-700/30 rounded">
                <span className="text-green-400 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Completed</span>
                </span>
                <span className="text-green-400 font-semibold">
                  {bookingStats.completedBookings}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-700/30 rounded">
                <span className="text-blue-400 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Upcoming</span>
                </span>
                <span className="text-blue-400 font-semibold">
                  {bookingStats.upcomingBookings}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-700/30 rounded">
                <span className="text-yellow-400 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Pending</span>
                </span>
                <span className="text-yellow-400 font-semibold">
                  {bookingStats.pendingBookings}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-700/30 rounded">
                <span className="text-red-400 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full flex-shrink-0"></div>
                  <span className="truncate">Cancelled</span>
                </span>
                <span className="text-red-400 font-semibold">
                  {bookingStats.cancelledBookings}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {maintenanceActive ? (
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-600/20 rounded-lg border border-gray-600/30 opacity-50 cursor-not-allowed">
                <FaCalendarPlus className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-gray-400 font-semibold text-sm sm:text-base">
                    New Booking
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    Temporarily disabled
                  </p>
                </div>
              </div>
            ) : (
              <Link
                href="/book"
                className="flex items-center gap-3 p-3 sm:p-4 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-all duration-200 border border-red-600/30 group"
              >
                <FaCalendarPlus className="w-5 h-5 text-red-400 group-hover:text-red-300 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm sm:text-base">
                    New Booking
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Reserve your stay
                  </p>
                </div>
              </Link>
            )}
            <Link
              href="/bookings"
              className="flex items-center gap-3 p-3 sm:p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-all duration-200 border border-blue-600/30 group"
            >
              <FaHistory className="w-5 h-5 text-blue-400 group-hover:text-blue-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm sm:text-base">
                  Booking History
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  View all reservations
                </p>
              </div>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 p-3 sm:p-4 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-all duration-200 border border-purple-600/30 group"
            >
              <FaCog className="w-5 h-5 text-purple-400 group-hover:text-purple-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm sm:text-base">
                  Account Settings
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Manage preferences
                </p>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 p-3 sm:p-4 bg-gray-600/20 hover:bg-gray-600/30 rounded-lg transition-all duration-200 border border-gray-600/30 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingOut ? (
                <FaSpinner className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
              ) : (
                <FaSignOutAlt className="w-5 h-5 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
              )}
              <div className="text-left min-w-0">
                <p className="text-white font-semibold text-sm sm:text-base">
                  {signingOut ? "Signing out..." : "Sign Out"}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {signingOut ? "Please wait..." : "Secure logout"}
                </p>
              </div>
            </button>
          </div>
        </div>
        {/* Recent Bookings */}
        {bookingStats.recentBookings.length > 0 && (
          <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Recent Bookings
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Latest {bookingStats.recentBookings.length} booking
                  {bookingStats.recentBookings.length > 1 ? "s" : ""}
                </p>
              </div>
              <Link
                href="/bookings"
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 border border-red-600/30"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {bookingStats.recentBookings.map((booking) => {
                const checkInDate = new Date(booking.check_in_date);
                const checkOutDate = new Date(booking.check_out_date);
                const status = booking.status || "pending";
                const isUpcoming = checkInDate > new Date();
                const isActive =
                  checkInDate <= new Date() && checkOutDate >= new Date();

                return (
                  <div
                    key={booking.id}
                    className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-3 sm:p-4 hover:bg-gray-700/50 transition-all duration-200"
                  >
                    {/* Header with Guest Name and Status */}
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <h4 className="text-white font-semibold text-sm sm:text-base truncate flex-1">
                        {booking.guest_name}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ${
                          status === "cancelled"
                            ? "bg-red-500/20 text-red-400"
                            : status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : status === "confirmed" &&
                              checkOutDate < new Date()
                            ? "bg-green-500/20 text-green-400"
                            : status === "confirmed" && isActive
                            ? "bg-blue-500/20 text-blue-400"
                            : status === "confirmed" && isUpcoming
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {status === "cancelled"
                          ? "Cancelled"
                          : status === "pending"
                          ? "Pending"
                          : status === "confirmed" && checkOutDate < new Date()
                          ? "Completed"
                          : status === "confirmed" && isActive
                          ? "Active"
                          : status === "confirmed" && isUpcoming
                          ? "Confirmed"
                          : "Unknown"}
                      </span>
                    </div>

                    {/* Date Range */}
                    <div className="mb-3">
                      <p className="text-gray-300 text-xs sm:text-sm">
                        📅{" "}
                        {checkInDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {checkOutDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-1 sm:gap-2 text-xs">
                        <span className="bg-gray-600/50 text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                          <span>👥</span>
                          <span className="hidden sm:inline">
                            {booking.number_of_guests} guest
                            {booking.number_of_guests > 1 ? "s" : ""}
                          </span>
                          <span className="sm:hidden">
                            {booking.number_of_guests}
                          </span>
                        </span>
                      </div>
                      <p className="text-white font-bold text-xs sm:text-sm">
                        ₱{booking.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact & Support */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Need Help?
          </h3>

          {/* Emergency Contact Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="tel:+639662815123"
              className="group flex items-center gap-3 p-3 bg-green-600/20 hover:bg-green-600/30 rounded-lg border border-green-600/30 transition-all duration-200"
            >
              <div className="bg-green-600 p-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-green-400 font-semibold text-sm">
                  Call Resort
                </p>
                <p className="text-green-300 text-xs">0966 281 5123</p>
              </div>
            </a>

            <a
              href="mailto:kampoibayo@gmail.com"
              className="group flex items-center gap-3 p-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-600/30 transition-all duration-200"
            >
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-blue-400 font-semibold text-sm">
                  Email Support
                </p>
                <p className="text-blue-300 text-xs truncate">
                  kampoibayo@gmail.com
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Use global auth context to avoid conflicts
export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return <ProfilePageContent user={user} />;
}
