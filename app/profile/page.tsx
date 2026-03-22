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
  FaHome,
  FaCalendarPlus,
  FaHistory,
  FaCog,
  FaSpinner,
  FaSignOutAlt,
} from "react-icons/fa";
import { useToastHelpers } from "../components/Toast";
import {
  formatPhoneForDisplay,
  validatePhilippinePhone,
  cleanPhoneForDatabase,
} from "../utils/phoneUtils";
import ProfileHeader from "../components/profile/ProfileHeader";
import StatsCards from "../components/profile/StatsCards";
import BookingHistory from "../components/profile/BookingHistory";

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
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw error;
      }

      if (session && session.access_token) {
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

  const { success, error: showError, warning, info } = useToastHelpers();

  const { stats: bookingStats, loading: statsLoading } = useBookingStats(user);

  const validatePhoneNumber = (phone: string): boolean => {
    return validatePhilippinePhone(phone);
  };

  const formatPhoneNumber = (value: string): string => {
    return formatPhoneForDisplay(value);
  };

  // Fetch user profile from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("full_name, email, phone, role")
          .eq("auth_id", user.id)
          .single();

        if (!error && data) {
          setUserProfile({
            name: data.full_name || "",
            email: data.email || "",
            phone: data.phone || "",
            role: data.role || "user",
          });
        } else {
          console.error("Error fetching user profile:", error);
          setUserProfile({
            name: user.user_metadata?.name || "",
            email: user.email || "",
            phone: user.user_metadata?.phone || "",
            role: user.user_metadata?.role || "user",
          });
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
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
    const interval = setInterval(checkMaintenanceMode, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    warning("Signing out...");

    try {
      const { safeLogout } = await import("../utils/apiTimeout");
      await safeLogout(supabase, 3000);

      success("Successfully signed out!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      console.error("Unexpected error during sign out:", err);
      showError("An unexpected error occurred during sign out.");

      if (typeof window !== "undefined") {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-pwgunyrvtpntsypqcwiq-auth-token');
        sessionStorage.clear();
      }
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) {
      warning("Please enter a valid name.");
      return;
    }

    setUpdating(true);
    info("Updating your name...");

    try {
      await validateAndRefreshSession();

      const { error: authError } = await supabase.auth.updateUser({
        data: { name: newName.trim() },
      });

      if (authError) {
        console.error("Error updating auth name:", authError);
        showError("Failed to update name. Please try again.");
        return;
      }

      const { error: dbError } = await supabase
        .from("users")
        .update({ full_name: newName.trim() })
        .eq("auth_id", user.id);

      if (dbError) {
        console.error("Error updating database name:", dbError);
        warning("Name updated in profile but may not appear in admin panel.");
      } else {
        success("Name updated successfully!");
      }

      setEditingName(false);
      setNewName("");

      if (userProfile) {
        setUserProfile({
          ...userProfile,
          name: newName.trim(),
        });
      }

      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        // User data updated
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
      await validateAndRefreshSession();

      const cleanedPhone = cleanPhoneForDatabase(newPhone.trim());

      const { error: authError } = await supabase.auth.updateUser({
        data: { phone: cleanedPhone },
      });

      if (authError) {
        console.error("Error updating auth phone:", authError);
        showError("Failed to update phone number. Please try again.");
        return;
      }

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

      if (userProfile) {
        setUserProfile({
          ...userProfile,
          phone: cleanedPhone,
        });
      }

      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        // User data updated
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view your profile.
          </p>
          <div className="space-y-3">
            <Link href="/auth">
              <button className="w-full bg-primary text-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition">
                Login
              </button>
            </Link>
            <Link href="/">
              <button className="w-full bg-muted text-foreground py-3 rounded-lg font-semibold hover:bg-gray-600 transition">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-card hover:bg-muted rounded-lg transition-colors"
              >
                <FaHome className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </Link>
              <div className="text-foreground">
                <h1 className="text-lg sm:text-xl font-bold">My Profile</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Manage your account
                </p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground text-right">
              {loading ? (
                <span className="inline-block bg-gray-600 text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
                  ● Loading...
                </span>
              ) : user ? (
                <span className="inline-block bg-green-600 text-foreground px-2 py-1 rounded-full text-xs font-semibold">
                  ● Signed In
                </span>
              ) : (
                <span className="inline-block bg-orange-600 text-foreground px-2 py-1 rounded-full text-xs font-semibold">
                  ● Guest
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile First */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        <ProfileHeader
          user={user}
          userProfile={userProfile}
          loadingProfile={loadingProfile}
          editingName={editingName}
          newName={newName}
          setNewName={setNewName}
          updating={updating}
          handleUpdateName={handleUpdateName}
          handleCancelEdit={handleCancelEdit}
          handleStartEdit={handleStartEdit}
          editingPhone={editingPhone}
          newPhone={newPhone}
          setNewPhone={setNewPhone}
          updatingPhone={updatingPhone}
          handleUpdatePhone={handleUpdatePhone}
          handleCancelPhoneEdit={handleCancelPhoneEdit}
          handleStartPhoneEdit={handleStartPhoneEdit}
          formatPhoneNumber={formatPhoneNumber}
          bookingStats={bookingStats}
        />

        <StatsCards
          bookingStats={bookingStats}
          statsLoading={statsLoading}
        />

        {/* Quick Actions */}
        <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border/50">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {maintenanceActive ? (
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-600/20 rounded-lg border border-border/30 opacity-50 cursor-not-allowed">
                <FaCalendarPlus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-muted-foreground font-semibold text-sm sm:text-base">
                    New Booking
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Temporarily disabled
                  </p>
                </div>
              </div>
            ) : (
              <Link
                href="/book"
                className="flex items-center gap-3 p-3 sm:p-4 bg-primary/20 hover:bg-primary/30 rounded-lg transition-all duration-200 border border-primary/30 group"
              >
                <FaCalendarPlus className="w-5 h-5 text-primary group-hover:text-primary/80 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-foreground font-semibold text-sm sm:text-base">
                    New Booking
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Reserve your stay
                  </p>
                </div>
              </Link>
            )}
            <Link
              href="/bookings"
              className="flex items-center gap-3 p-3 sm:p-4 bg-primary/20 hover:bg-primary/30 rounded-lg transition-all duration-200 border border-primary/30 group"
            >
              <FaHistory className="w-5 h-5 text-primary group-hover:text-primary/80 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-foreground font-semibold text-sm sm:text-base">
                  Booking History
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">
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
                <p className="text-foreground font-semibold text-sm sm:text-base">
                  Account Settings
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Manage preferences
                </p>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 p-3 sm:p-4 bg-gray-600/20 hover:bg-gray-600/30 rounded-lg transition-all duration-200 border border-border/30 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingOut ? (
                <FaSpinner className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
              ) : (
                <FaSignOutAlt className="w-5 h-5 text-muted-foreground group-hover:text-muted-foreground flex-shrink-0" />
              )}
              <div className="text-left min-w-0">
                <p className="text-foreground font-semibold text-sm sm:text-base">
                  {signingOut ? "Signing out..." : "Sign Out"}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {signingOut ? "Please wait..." : "Secure logout"}
                </p>
              </div>
            </button>
          </div>
        </div>

        <BookingHistory recentBookings={bookingStats.recentBookings} />

        {/* Contact & Support */}
        <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border/50">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
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
                  className="w-4 h-4 text-foreground"
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
              className="group flex items-center gap-3 p-3 bg-primary/20 hover:bg-primary/30 rounded-lg border border-primary/30 transition-all duration-200"
            >
              <div className="bg-primary p-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-foreground"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-primary font-semibold text-sm">
                  Email Support
                </p>
                <p className="text-primary/80 text-xs truncate">
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return <ProfilePageContent user={user} />;
}
