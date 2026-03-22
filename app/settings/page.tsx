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
} from "react-icons/fa";
import { useToastHelpers } from "../components/Toast";
import ProfileSection from "../components/settings/ProfileSection";
import PasswordSection from "../components/settings/PasswordSection";
import DataExportSection from "../components/settings/DataExportSection";
import DeleteAccountSection from "../components/settings/DeleteAccountSection";

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
        } else {
          console.warn("⚠️ Could not load user database record:", userError);
        }

        // Load user profile data - prioritize database phone over auth metadata
        const authPhone = data.session.user.user_metadata?.phone || "";
        const dbPhone = userRecord?.phone || "";
        const finalPhone = dbPhone || authPhone; // Database phone takes priority


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
      const scrollPos = window.scrollY + 300;

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

      const privacyElement = document.getElementById("privacy");
      if (privacyElement) {
        const privacyTop = privacyElement.offsetTop;
        const windowBottom = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (
          windowBottom >= documentHeight - 100 ||
          scrollPos >= privacyTop - 100
        ) {
          setActiveSection("privacy");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    info("Updating your profile...");

    if (profileData.phone && !validatePhoneNumber(profileData.phone)) {
      showError("Phone number must be exactly 11 digits long!");
      setSaving(false);
      return;
    }

    try {
      await validateAndRefreshSession();

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

      if (user?.id) {
        const { error: dbError } = await supabase
          .from("users")
          .update({
            full_name: profileData.name,
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
      await validateAndRefreshSession();

      if (!user?.email) {
        showError("Unable to verify your identity. Please log in again.");
        setSaving(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (verifyError) {
        showError("Current password is incorrect.");
        setSaving(false);
        return;
      }

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
      const headerOffset = 100;
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

      if (bookings && bookings.length > 0) {
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

        if (bookings.length > 0) {
          warning(
            `You have ${bookings.length} historical booking(s). Account deletion will remove all booking history permanently.`
          );
        }
      }

      const confirmed = confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      );

      if (!confirmed) return;

      const doubleConfirm = confirm(
        "This will permanently delete all your data including booking history. Are you absolutely sure?"
      );

      if (!doubleConfirm) return;

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

      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          confirmationToken:
            bookings && bookings.length > 0 ? "DELETE" : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
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

      if (result.success) {
        if (result.warning) {
          warning(result.warning);
        }

        if (result.clearStorage) {
          localStorage.clear();
          sessionStorage.clear();

          localStorage.removeItem("in_password_reset");
          sessionStorage.removeItem("recovery_access_token");
          sessionStorage.removeItem("recovery_refresh_token");
          sessionStorage.removeItem("recovery-info-shown");
        }

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
      const userProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        phone: user.user_metadata?.phone,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
      };

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingsError) {
        throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
      }

      const { data: userTableData, error: userTableError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      const userData = userTableError ? null : userTableData;

      if (format === "json") {
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
      } else if (format === "pdf") {
        const { getFreshSession } = await import("../utils/apiTimeout");
        const session = await getFreshSession(supabase);
        if (!session?.access_token) {
          showError("Authentication required. Please log in again.");
          setExporting(false);
          return;
        }

        const response = await fetch("/api/user/export-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            userProfile,
            userData,
            bookings: bookings || [],
            statistics: {
              total_bookings: bookings?.length || 0,
              cancelled_bookings:
                bookings?.filter((b) => b.status === "cancelled").length || 0,
              confirmed_bookings:
                bookings?.filter((b) => b.status === "confirmed").length || 0,
              pending_bookings:
                bookings?.filter((b) => b.status === "pending").length || 0,
              completed_bookings:
                bookings?.filter((b) => b.status === "completed").length || 0,
              total_amount_spent:
                bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) ||
                0,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate PDF");
        }

        const pdfBlob = await response.blob();
        downloadFile(
          pdfBlob,
          `kampo-ibayo-data-export-${
            new Date().toISOString().split("T")[0]
          }.pdf`
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-lg">Loading settings...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-muted-foreground hover:text-foreground transition"
            >
              <FaHome className="w-6 h-6" />
            </Link>
            <div className="text-foreground">
              <h1 className="text-3xl font-bold">Account Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences</p>
            </div>
          </div>
          <Link href="/profile">
            <button className="bg-muted text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition">
              Back to Profile
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl shadow-2xl p-6 sticky top-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Settings</h3>
            <nav className="space-y-2">
              <button
                onClick={() => scrollToSection("profile")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "profile"
                    ? "bg-primary text-foreground"
                    : "text-muted-foreground hover:bg-primary hover:text-foreground"
                }`}
              >
                <FaUser className="w-4 h-4" />
                Profile Information
              </button>
              <button
                onClick={() => scrollToSection("security")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "security"
                    ? "bg-primary text-foreground"
                    : "text-muted-foreground hover:bg-primary hover:text-foreground"
                }`}
              >
                <FaLock className="w-4 h-4" />
                Security & Password
              </button>
              <button
                onClick={() => scrollToSection("privacy")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "privacy"
                    ? "bg-primary text-foreground"
                    : "text-muted-foreground hover:bg-primary hover:text-foreground"
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
          <ProfileSection
            profileData={profileData}
            setProfileData={setProfileData}
            saving={saving}
            formatPhoneNumber={formatPhoneNumber}
            onSubmit={handleProfileUpdate}
          />

          <PasswordSection
            passwordData={passwordData}
            saving={saving}
            showCurrentPassword={showCurrentPassword}
            showNewPassword={showNewPassword}
            showConfirmPassword={showConfirmPassword}
            passwordsMatch={passwordsMatch}
            setShowCurrentPassword={setShowCurrentPassword}
            setShowNewPassword={setShowNewPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            setPasswordData={setPasswordData}
            handleNewPasswordChange={handleNewPasswordChange}
            handleConfirmPasswordChange={handleConfirmPasswordChange}
            validatePasswordStrength={validatePasswordStrength}
            onSubmit={handlePasswordUpdate}
          />

          {/* Privacy & Data */}
          <section
            id="privacy"
            className="bg-card rounded-xl shadow-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <FaShieldAlt className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Privacy & Data</h2>
            </div>

            <div className="space-y-6">
              <DataExportSection
                exporting={exporting}
                showExportDropdown={showExportDropdown}
                setShowExportDropdown={setShowExportDropdown}
                handleExportData={handleExportData}
              />

              <DeleteAccountSection
                onDeleteAccount={handleDeleteAccount}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
