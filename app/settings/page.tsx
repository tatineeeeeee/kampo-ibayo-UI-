"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";
import {
  formatPhoneForDisplay,
  validatePhilippinePhone,
  cleanPhoneForDatabase,
} from "../utils/phoneUtils";
import {
  FaHome,
  FaUser,
  FaLock,
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaTrash,
  FaDownload,
  FaChevronDown,
  FaFileCode,
  FaTable,
} from "react-icons/fa";
import { Check, X } from "lucide-react";
import { useToastHelpers } from "../components/Toast";

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

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  // Toast notification helpers
  const { success, error: showError, warning, info } = useToastHelpers();

  // Phone number validation function
  const validatePhoneNumber = (phone: string): boolean => {
    return validatePhilippinePhone(phone);
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    return formatPhoneForDisplay(value);
  };

  // Form states
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  // Password strength validation
  const validatePasswordStrength = (
    password: string
  ): {
    isValid: boolean;
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
    score: number;
  } => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const isValid = score === 5;

    return { isValid, requirements, score };
  };

  // Real-time password matching validation
  const handleNewPasswordChange = (value: string) => {
    setPasswordData((prev) => ({ ...prev, newPassword: value }));
    if (passwordData.confirmPassword) {
      setPasswordsMatch(value === passwordData.confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setPasswordData((prev) => ({ ...prev, confirmPassword: value }));
    if (value && passwordData.newPassword) {
      setPasswordsMatch(passwordData.newPassword === value);
    } else {
      setPasswordsMatch(null);
    }
  };

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null);
      if (!data.session?.user) {
        router.push("/auth");
      } else {
        // Load user database record to get phone and preferences
        const { data: userRecord, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", data.session.user.id)
          .single();

        if (!userError && userRecord) {
          console.log("📱 User database record loaded:", userRecord);
        } else {
          console.warn("⚠️ Could not load user database record:", userError);
        }

        // Load user profile data - prioritize database phone over auth metadata
        const authPhone = data.session.user.user_metadata?.phone || "";
        const dbPhone = userRecord?.phone || "";
        const finalPhone = dbPhone || authPhone; // Database phone takes priority

        console.log("📱 Phone loading:", { authPhone, dbPhone, finalPhone });

        setProfileData({
          name: data.session.user.user_metadata?.name || "",
          email: data.session.user.email || "",
          phone: formatPhoneNumber(finalPhone),
        });
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          router.push("/auth");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-export-dropdown]")) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showExportDropdown]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["profile", "security", "privacy"];
      const scrollPos = window.scrollY + 300; // Increased offset for better detection

      // Check sections from bottom to top to ensure proper priority
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.getElementById(section);
        if (element) {
          const elementTop = element.offsetTop;
          const elementBottom = elementTop + element.offsetHeight;

          if (scrollPos >= elementTop && scrollPos <= elementBottom) {
            setActiveSection(section);
            break;
          }
        }
      }

      // Special handling for the last section (privacy)
      const privacyElement = document.getElementById("privacy");
      if (privacyElement) {
        const privacyTop = privacyElement.offsetTop;
        const windowBottom = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // If we're near the bottom of the page, activate privacy section
        if (
          windowBottom >= documentHeight - 100 ||
          scrollPos >= privacyTop - 100
        ) {
          setActiveSection("privacy");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Call once to set initial state
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    info("Updating your profile...");

    // Validate phone number if provided
    if (profileData.phone && !validatePhoneNumber(profileData.phone)) {
      showError("Phone number must be exactly 11 digits long!");
      setSaving(false);
      return;
    }

    try {
      // Validate session with retry logic
      await validateAndRefreshSession();

      // Clean phone number for database storage (convert to international format)
      const cleanedPhone = profileData.phone
        ? cleanPhoneForDatabase(profileData.phone)
        : "";

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          phone: cleanedPhone,
        },
      });

      if (authError) {
        console.error("Error updating auth profile:", authError);
        throw authError;
      }

      // Also update the users table so admin panel shows the changes
      if (user?.id) {
        const { error: dbError } = await supabase
          .from("users")
          .update({
            name: profileData.name,
            phone: cleanedPhone,
          })
          .eq("auth_id", user.id);

        if (dbError) {
          console.error("Error updating database profile:", dbError);
          warning(
            "Profile updated in account but may not appear in admin panel. Please contact support."
          );
        } else {
          success("Profile updated successfully!");
        }
      } else {
        success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showError("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError("New passwords don't match!");
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(
      passwordData.newPassword
    );
    if (!passwordValidation.isValid) {
      showError(
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character!"
      );
      return;
    }

    setSaving(true);

    info("Updating your password...");

    try {
      // Validate session with retry logic
      await validateAndRefreshSession();

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      success("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      showError("Error updating password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100; // Offset for sticky header
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      showError("User session not found. Please refresh and try again.");
      return;
    }

    try {
      // First, check if user has any bookings (safety check)
      info("Checking account eligibility for deletion...");

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, status, check_in_date, check_out_date, guest_name")
        .eq("user_id", user.id);

      if (bookingsError) {
        console.error("Error checking bookings:", bookingsError);
        showError("Unable to verify account status. Please contact support.");
        return;
      }

      // Check if user has any bookings at all
      if (bookings && bookings.length > 0) {
        // Categorize bookings
        const activeBookings = bookings.filter(
          (b) =>
            b.status === "pending" ||
            b.status === "confirmed" ||
            b.status === "paid"
        );

        const upcomingBookings = bookings.filter((b) => {
          const checkInDate = new Date(b.check_in_date);
          const today = new Date();
          return checkInDate > today;
        });

        const recentBookings = bookings.filter((b) => {
          const checkOutDate = new Date(b.check_out_date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return checkOutDate > thirtyDaysAgo;
        });

        // Block deletion if user has active/upcoming/recent bookings
        if (activeBookings.length > 0) {
          showError(
            `Cannot delete account: You have ${activeBookings.length} active booking(s) (pending/confirmed/paid). Please cancel or complete your bookings first.`
          );
          return;
        }

        if (upcomingBookings.length > 0) {
          showError(
            `Cannot delete account: You have ${upcomingBookings.length} upcoming booking(s). Please cancel your future bookings first.`
          );
          return;
        }

        if (recentBookings.length > 0) {
          warning(
            `You have recent bookings within the last 30 days. For security and record-keeping purposes, please contact support to delete your account.`
          );
          return;
        }

        // If they have old completed bookings only, allow but warn
        if (bookings.length > 0) {
          warning(
            `You have ${bookings.length} historical booking(s). Account deletion will remove all booking history permanently.`
          );
        }
      }

      // Proceed with confirmation dialogs
      const confirmed = confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      );

      if (!confirmed) return;

      const doubleConfirm = confirm(
        "This will permanently delete all your data including booking history. Are you absolutely sure?"
      );

      if (!doubleConfirm) return;

      // Additional safety check - require them to type "DELETE" for accounts with any booking history
      if (bookings && bookings.length > 0) {
        const deleteConfirmation = prompt(
          `To confirm permanent deletion of your account and ${bookings.length} booking record(s), please type "DELETE" (in capital letters):`
        );

        if (deleteConfirmation !== "DELETE") {
          warning(
            "Account deletion cancelled. You must type 'DELETE' exactly to confirm."
          );
          return;
        }
      }

      info("Processing account deletion...");

      // Call the account deletion API
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          confirmationToken:
            bookings && bookings.length > 0 ? "DELETE" : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific business rule violations
        if (result.requiresSupport) {
          showError(`${result.error}. ${result.details}`);
          return;
        }

        if (result.requiresConfirmation) {
          showError(
            `${result.error}. You have ${result.bookingCount} historical bookings.`
          );
          return;
        }

        if (result.activeBookings || result.upcomingBookings) {
          showError(`${result.error}. ${result.details}`);
          return;
        }

        throw new Error(result.error || "Account deletion failed");
      }

      // Handle successful deletion
      if (result.success) {
        if (result.warning) {
          warning(result.warning);
        }

        // Sign out the user
        await supabase.auth.signOut();

        success(`${result.message}. You have been signed out.`);

        if (result.details?.bookingsAnonymized > 0) {
          info(
            `${result.details.bookingsAnonymized} booking record(s) have been anonymized for business records.`
          );
        }

        router.push("/");
      } else {
        throw new Error("Account deletion was not successful");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      showError("Error processing account deletion. Please contact support.");
    }
  };

  const handleExportData = async (format: "json" | "csv" | "pdf" = "json") => {
    if (!user?.id) return;

    setExporting(true);

    info(`Exporting your data as ${format.toUpperCase()}...`);

    try {
      // Get user profile data
      const userProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        phone: user.user_metadata?.phone,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
      };

      // Get user's bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingsError) {
        throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
      }

      // Get user's profile from the users table (if exists)
      const { data: userTableData, error: userTableError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      // Don't throw error if user doesn't exist in users table
      const userData = userTableError ? null : userTableData;

      if (format === "json") {
        // JSON Export (most complete)
        const exportData = {
          export_info: {
            generated_at: new Date().toISOString(),
            user_id: user.id,
            format: "JSON",
          },
          profile: userProfile,
          user_details: userData,
          bookings: bookings || [],
          statistics: {
            total_bookings: bookings?.length || 0,
            cancelled_bookings:
              bookings?.filter((b) => b.status === "cancelled").length || 0,
            confirmed_bookings:
              bookings?.filter((b) => b.status === "confirmed").length || 0,
            pending_bookings:
              bookings?.filter((b) => b.status === "pending").length || 0,
            total_amount_spent:
              bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
          },
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        downloadFile(
          dataBlob,
          `kampo-ibayo-data-export-${
            new Date().toISOString().split("T")[0]
          }.json`
        );
      } else if (format === "csv") {
        // CSV Export (bookings only, more readable)
        const csvHeaders = [
          "Booking ID",
          "Guest Name",
          "Email",
          "Phone",
          "Check-in",
          "Check-out",
          "Guests",
          "Amount",
          "Status",
          "Created",
          "Special Requests",
        ];

        const csvRows =
          bookings?.map((booking) => [
            booking.id,
            booking.guest_name,
            booking.guest_email || "No email",
            booking.guest_phone || "",
            booking.check_in_date,
            booking.check_out_date,
            booking.number_of_guests,
            booking.total_amount,
            booking.status || "pending",
            booking.created_at,
            booking.special_requests || "",
          ]) || [];

        const csvContent = [
          csvHeaders.join(","),
          ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
        ].join("\n");

        const csvBlob = new Blob([csvContent], { type: "text/csv" });
        downloadFile(
          csvBlob,
          `kampo-ibayo-bookings-${new Date().toISOString().split("T")[0]}.csv`
        );
      }

      success(
        `Your data has been exported successfully as ${format.toUpperCase()}!`
      );
    } catch (error) {
      console.error("Error exporting data:", error);
      showError("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading settings...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-gray-400 hover:text-white transition"
            >
              <FaHome className="w-6 h-6" />
            </Link>
            <div className="text-white">
              <h1 className="text-3xl font-bold">Account Settings</h1>
              <p className="text-gray-400">Manage your account preferences</p>
            </div>
          </div>
          <Link href="/profile">
            <button className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition">
              Back to Profile
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6 sticky top-6">
            <h3 className="text-lg font-bold text-white mb-4">Settings</h3>
            <nav className="space-y-2">
              <button
                onClick={() => scrollToSection("profile")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "profile"
                    ? "bg-red-600 text-white"
                    : "text-gray-300 hover:bg-red-600 hover:text-white"
                }`}
              >
                <FaUser className="w-4 h-4" />
                Profile Information
              </button>
              <button
                onClick={() => scrollToSection("security")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "security"
                    ? "bg-red-600 text-white"
                    : "text-gray-300 hover:bg-red-600 hover:text-white"
                }`}
              >
                <FaLock className="w-4 h-4" />
                Security & Password
              </button>
              <button
                onClick={() => scrollToSection("privacy")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "privacy"
                    ? "bg-red-600 text-white"
                    : "text-gray-300 hover:bg-red-600 hover:text-white"
                }`}
              >
                <FaShieldAlt className="w-4 h-4" />
                Privacy & Data
              </button>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Information */}
          <section
            id="profile"
            className="bg-gray-800 rounded-xl shadow-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <FaUser className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">
                Profile Information
              </h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label
                  htmlFor="full-name-input"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Full Name
                </label>
                <input
                  id="full-name-input"
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 "
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="email-input"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full bg-gray-600 border border-gray-600 text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone-input"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Phone Number
                </label>
                <input
                  id="phone-input"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setProfileData({ ...profileData, phone: formatted });
                  }}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 "
                  placeholder="09XX-XXX-XXXX (11 digits)"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                <FaSave className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>

          {/* Security & Password */}
          <section
            id="security"
            className="bg-gray-800 rounded-xl shadow-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <FaLock className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">
                Security & Password
              </h2>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <label
                  htmlFor="current-password-input"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 pr-12 "
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-password-input"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password-input"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 pr-12 "
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* Password Requirements & Strength */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Use 8+ characters with letters, numbers and symbols
                  </span>
                  {passwordData.newPassword && (
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">Strength:</span>
                      <div className="flex space-x-0.5">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                              level <=
                              validatePasswordStrength(passwordData.newPassword)
                                .score
                                ? level <= 1
                                  ? "bg-red-400"
                                  : level <= 2
                                  ? "bg-yellow-400"
                                  : level <= 3
                                  ? "bg-blue-400"
                                  : level <= 4
                                  ? "bg-green-400"
                                  : "bg-green-500"
                                : "bg-gray-500"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password-input"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password-input"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      handleConfirmPasswordChange(e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 pr-12 "
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* Password Match Validation */}
                {passwordData.confirmPassword && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Password confirmation</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">Match:</span>
                      {passwordsMatch ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                <FaLock className="w-4 h-4" />
                {saving ? "Updating..." : "Update Password"}
              </button>
            </form>
          </section>

          {/* Privacy & Data */}
          <section
            id="privacy"
            className="bg-gray-800 rounded-xl shadow-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <FaShieldAlt className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">Privacy & Data</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-700 p-6 rounded-lg">
                <div className="mb-2">
                  <h3 className="text-white font-semibold">Data Export</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Download a copy of your personal data and booking history in
                  your preferred format.
                </p>

                <div className="relative" data-export-dropdown>
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    disabled={exporting}
                    className="flex items-center justify-between w-full bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-500 transition disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <FaDownload className="w-4 h-4" />
                      {exporting ? "Exporting..." : "Export My Data"}
                    </div>
                    <FaChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showExportDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showExportDropdown && !exporting && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-600 rounded-lg shadow-xl border border-gray-500 z-10">
                      <button
                        onClick={() => {
                          handleExportData("json");
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-500 transition rounded-t-lg"
                      >
                        <FaFileCode className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="font-semibold">JSON Format</div>
                          <div className="text-xs text-gray-300">
                            Complete data with all details
                          </div>
                        </div>
                      </button>

                      <div className="border-t border-gray-500"></div>

                      <button
                        onClick={() => {
                          handleExportData("csv");
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-500 transition rounded-b-lg"
                      >
                        <FaTable className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="font-semibold">CSV Format</div>
                          <div className="text-xs text-gray-300">
                            Spreadsheet-friendly booking data
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Deletion Section */}
              <div className="bg-gradient-to-r from-red-900/20 via-red-900/10 to-red-900/20 border border-red-700/50 p-6 rounded-xl shadow-lg">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-600/20 rounded-lg">
                    <FaTrash className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-red-400 font-bold text-lg">
                      Delete Account
                    </h3>
                    <p className="text-red-300/80 text-sm">
                      Permanent account deletion
                    </p>
                  </div>
                </div>

                {/* Warning Card */}
                <div className="bg-red-950/50 border border-red-800/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-red-600/20 rounded-full mt-0.5">
                      <svg
                        className="w-4 h-4 text-red-400"
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
                    <div>
                      <h4 className="text-red-300 font-semibold text-sm mb-2">
                        This action cannot be undone
                      </h4>
                      <p className="text-red-200/80 text-sm leading-relaxed">
                        Deleting your account will permanently remove all your
                        personal data, booking history, and preferences. This
                        action is irreversible and your email can be reused for
                        new registrations.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deletion Policy Info */}
                <div className="bg-amber-950/30 border border-amber-700/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-amber-600/20 rounded-full mt-0.5">
                      <svg
                        className="w-4 h-4 text-amber-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-amber-300 font-semibold text-sm mb-2">
                        Account Deletion Requirements
                      </h4>
                      <ul className="text-amber-200/80 text-sm space-y-1.5">
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                          No pending, confirmed, or paid bookings
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                          No upcoming reservations
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                          No recent bookings completed within 30 days
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                          Accounts with booking history require confirmation
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* What Happens Section */}
                <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4 mb-6">
                  <h4 className="text-gray-300 font-semibold text-sm mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    What happens when you delete your account:
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="text-gray-400">
                      <div className="font-medium text-gray-300 mb-1">
                        ✓ Removed:
                      </div>
                      <ul className="space-y-1 text-xs">
                        <li>• Personal profile information</li>
                        <li>• Account preferences & settings</li>
                        <li>• Login access to your account</li>
                      </ul>
                    </div>
                    <div className="text-gray-400">
                      <div className="font-medium text-gray-300 mb-1">
                        📋 Business Records:
                      </div>
                      <ul className="space-y-1 text-xs">
                        <li>• Booking records anonymized</li>
                        <li>• Transaction history preserved</li>
                        <li>• Resort compliance maintained</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <button
                    onClick={handleDeleteAccount}
                    className="group flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-red-900/25 transform hover:-translate-y-0.5"
                  >
                    <FaTrash className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Delete My Account</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  <div className="text-gray-400 text-xs sm:ml-4 sm:max-w-xs">
                    <p>
                      Need help?{" "}
                      <span className="text-red-400 hover:text-red-300 cursor-pointer underline">
                        Contact our support team
                      </span>{" "}
                      for assistance with account management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
