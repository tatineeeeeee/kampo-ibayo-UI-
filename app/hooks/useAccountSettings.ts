"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import {
  formatPhoneForDisplay,
  validatePhilippinePhone,
  cleanPhoneForDatabase,
} from "../utils/phoneUtils";
import { useToastHelpers } from "../components/Toast";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const validateAndRefreshSession = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
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
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error("No valid session found after multiple attempts");
};

export interface UseAccountSettingsReturn {
  user: User | null;
  loading: boolean;
  saving: boolean;
  exporting: boolean;
  showExportDropdown: boolean;
  activeSection: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  profileData: ProfileData;
  passwordData: PasswordData;
  passwordsMatch: boolean | null;
  setShowExportDropdown: (value: boolean) => void;
  setShowCurrentPassword: (value: boolean) => void;
  setShowNewPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  setPasswordData: React.Dispatch<React.SetStateAction<PasswordData>>;
  formatPhoneNumber: (value: string) => string;
  validatePasswordStrength: (password: string) => {
    isValid: boolean;
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
    score: number;
  };
  handleNewPasswordChange: (value: string) => void;
  handleConfirmPasswordChange: (value: string) => void;
  handleProfileUpdate: (e: React.FormEvent) => Promise<void>;
  handlePasswordUpdate: (e: React.FormEvent) => Promise<void>;
  scrollToSection: (sectionId: string) => void;
  handleDeleteAccount: () => Promise<void>;
  handleExportData: (format: "json" | "csv" | "pdf") => Promise<void>;
}

export function useAccountSettings(): UseAccountSettingsReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  const router = useRouter();
  const { success, error: showError, warning, info } = useToastHelpers();

  const formatPhoneNumber = (value: string): string => {
    return formatPhoneForDisplay(value);
  };

  const validatePasswordStrength = (password: string) => {
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

  const handleNewPasswordChange = (value: string) => {
    setPasswordData((previous) => ({ ...previous, newPassword: value }));
    if (passwordData.confirmPassword) {
      setPasswordsMatch(value === passwordData.confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setPasswordData((previous) => ({ ...previous, confirmPassword: value }));
    if (value && passwordData.newPassword) {
      setPasswordsMatch(passwordData.newPassword === value);
      return;
    }
    setPasswordsMatch(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null);

      if (!data.session?.user) {
        router.push("/auth");
        setLoading(false);
        return;
      }

      const { data: userRecord } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", data.session.user.id)
        .single();

      const authPhone = data.session.user.user_metadata?.phone || "";
      const dbPhone = userRecord?.phone || "";
      const finalPhone = dbPhone || authPhone;

      setProfileData({
        name: data.session.user.user_metadata?.name || "",
        email: data.session.user.email || "",
        phone: formatPhoneForDisplay(finalPhone),
      });

      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          router.push("/auth");
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-export-dropdown]")) {
        setShowExportDropdown(false);
      }
    };

    if (!showExportDropdown) {
      return;
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showExportDropdown]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["profile", "security", "privacy"];
      const scrollPos = window.scrollY + 300;

      for (let index = sections.length - 1; index >= 0; index--) {
        const section = sections[index];
        const element = document.getElementById(section);
        if (!element) {
          continue;
        }

        const elementTop = element.offsetTop;
        const elementBottom = elementTop + element.offsetHeight;

        if (scrollPos >= elementTop && scrollPos <= elementBottom) {
          setActiveSection(section);
          break;
        }
      }

      const privacyElement = document.getElementById("privacy");
      if (!privacyElement) {
        return;
      }

      const privacyTop = privacyElement.offsetTop;
      const windowBottom = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (
        windowBottom >= documentHeight - 100 ||
        scrollPos >= privacyTop - 100
      ) {
        setActiveSection("privacy");
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

    if (profileData.phone && !validatePhilippinePhone(profileData.phone)) {
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
          warning(
            "Profile updated in account but may not appear in admin panel. Please contact support.",
          );
        } else {
          success("Profile updated successfully!");
        }
      } else {
        success("Profile updated successfully!");
      }
    } catch {
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
      passwordData.newPassword,
    );
    if (!passwordValidation.isValid) {
      showError(
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character!",
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

      if (error) {
        throw error;
      }

      success("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordsMatch(null);
    } catch {
      showError("Error updating password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) {
      return;
    }

    const headerOffset = 100;
    const elementPosition = element.offsetTop;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });

    setActiveSection(sectionId);
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
        showError("Unable to verify account status. Please contact support.");
        return;
      }

      if (bookings && bookings.length > 0) {
        const activeBookings = bookings.filter(
          (booking) =>
            booking.status === "pending" ||
            booking.status === "confirmed" ||
            booking.status === "paid",
        );

        const upcomingBookings = bookings.filter((booking) => {
          const checkInDate = new Date(booking.check_in_date);
          const today = new Date();
          return checkInDate > today;
        });

        const recentBookings = bookings.filter((booking) => {
          const checkOutDate = new Date(booking.check_out_date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return checkOutDate > thirtyDaysAgo;
        });

        if (activeBookings.length > 0) {
          showError(
            `Cannot delete account: You have ${activeBookings.length} active booking(s) (pending/confirmed/paid). Please cancel or complete your bookings first.`,
          );
          return;
        }

        if (upcomingBookings.length > 0) {
          showError(
            `Cannot delete account: You have ${upcomingBookings.length} upcoming booking(s). Please cancel your future bookings first.`,
          );
          return;
        }

        if (recentBookings.length > 0) {
          warning(
            "You have recent bookings within the last 30 days. For security and record-keeping purposes, please contact support to delete your account.",
          );
          return;
        }

        if (bookings.length > 0) {
          warning(
            `You have ${bookings.length} historical booking(s). Account deletion will remove all booking history permanently.`,
          );
        }
      }

      const confirmed = confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      );
      if (!confirmed) {
        return;
      }

      const doubleConfirm = confirm(
        "This will permanently delete all your data including booking history. Are you absolutely sure?",
      );
      if (!doubleConfirm) {
        return;
      }

      if (bookings && bookings.length > 0) {
        const deleteConfirmation = prompt(
          `To confirm permanent deletion of your account and ${bookings.length} booking record(s), please type "DELETE" (in capital letters):`,
        );

        if (deleteConfirmation !== "DELETE") {
          warning(
            "Account deletion cancelled. You must type 'DELETE' exactly to confirm.",
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
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          confirmationToken:
            bookings && bookings.length > 0 ? "DELETE" : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (
          result.requiresSupport ||
          result.requiresConfirmation ||
          result.activeBookings ||
          result.upcomingBookings
        ) {
          showError(`${result.error}. ${result.details || ""}`.trim());
          return;
        }

        throw new Error(result.error || "Account deletion failed");
      }

      if (!result.success) {
        throw new Error("Account deletion was not successful");
      }

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
          `${result.details.bookingsAnonymized} booking record(s) have been anonymized for business records.`,
        );
      }

      router.push("/");
    } catch {
      showError("Error processing account deletion. Please contact support.");
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

  const handleExportData = async (format: "json" | "csv" | "pdf") => {
    if (!user?.id) {
      return;
    }

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
              bookings?.filter((booking) => booking.status === "cancelled")
                .length || 0,
            confirmed_bookings:
              bookings?.filter((booking) => booking.status === "confirmed")
                .length || 0,
            pending_bookings:
              bookings?.filter((booking) => booking.status === "pending")
                .length || 0,
            total_amount_spent:
              bookings?.reduce(
                (sum, booking) => sum + (booking.total_amount || 0),
                0,
              ) || 0,
          },
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        downloadFile(
          dataBlob,
          `kampo-ibayo-data-export-${new Date().toISOString().split("T")[0]}.json`,
        );
      }

      if (format === "csv") {
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
          `kampo-ibayo-bookings-${new Date().toISOString().split("T")[0]}.csv`,
        );
      }

      if (format === "pdf") {
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
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            userProfile,
            userData,
            bookings: bookings || [],
            statistics: {
              total_bookings: bookings?.length || 0,
              cancelled_bookings:
                bookings?.filter((booking) => booking.status === "cancelled")
                  .length || 0,
              confirmed_bookings:
                bookings?.filter((booking) => booking.status === "confirmed")
                  .length || 0,
              pending_bookings:
                bookings?.filter((booking) => booking.status === "pending")
                  .length || 0,
              completed_bookings:
                bookings?.filter((booking) => booking.status === "completed")
                  .length || 0,
              total_amount_spent:
                bookings?.reduce(
                  (sum, booking) => sum + (booking.total_amount || 0),
                  0,
                ) || 0,
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
          `kampo-ibayo-data-export-${new Date().toISOString().split("T")[0]}.pdf`,
        );
      }

      success(
        `Your data has been exported successfully as ${format.toUpperCase()}!`,
      );
    } catch {
      showError("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return {
    user,
    loading,
    saving,
    exporting,
    showExportDropdown,
    activeSection,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    profileData,
    passwordData,
    passwordsMatch,
    setShowExportDropdown,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    setProfileData,
    setPasswordData,
    formatPhoneNumber,
    validatePasswordStrength,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    handleProfileUpdate,
    handlePasswordUpdate,
    scrollToSection,
    handleDeleteAccount,
    handleExportData,
  };
}
