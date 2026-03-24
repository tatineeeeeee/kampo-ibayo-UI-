"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useBookingStats } from "../hooks/useBookingStats";
import { isMaintenanceMode } from "../utils/maintenanceMode";
import { useToastHelpers } from "../components/Toast";
import {
  formatPhoneForDisplay,
  validatePhilippinePhone,
  cleanPhoneForDatabase,
} from "../utils/phoneUtils";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
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

export interface UseProfileReturn {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  loadingProfile: boolean;
  maintenanceActive: boolean;
  editingName: boolean;
  newName: string;
  updating: boolean;
  editingPhone: boolean;
  newPhone: string;
  updatingPhone: boolean;
  signingOut: boolean;
  bookingStats: ReturnType<typeof useBookingStats>["stats"];
  statsLoading: boolean;
  setNewName: (value: string) => void;
  setNewPhone: (value: string) => void;
  formatPhoneNumber: (value: string) => string;
  handleSignOut: () => Promise<void>;
  handleUpdateName: () => Promise<void>;
  handleCancelEdit: () => void;
  handleStartEdit: () => void;
  handleUpdatePhone: () => Promise<void>;
  handleCancelPhoneEdit: () => void;
  handleStartPhoneEdit: () => void;
}

export function useProfile(): UseProfileReturn {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { success, error: showError, warning, info } = useToastHelpers();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const { stats: bookingStats, loading: statsLoading } = useBookingStats(user);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }

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
          return;
        }

        setUserProfile({
          name: user.user_metadata?.name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
          role: user.user_metadata?.role || "user",
        });
      } catch {
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

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const isActive = await isMaintenanceMode();
        setMaintenanceActive(isActive);
      } catch {
        setMaintenanceActive(false);
      }
    };

    checkMaintenanceMode();
    const interval = setInterval(checkMaintenanceMode, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatPhoneNumber = (value: string): string => {
    return formatPhoneForDisplay(value);
  };

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
    } catch {
      showError("An unexpected error occurred during sign out.");

      if (typeof window !== "undefined") {
        localStorage.clear();
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
        showError("Failed to update name. Please try again.");
        return;
      }

      const { error: dbError } = await supabase
        .from("users")
        .update({ full_name: newName.trim() })
        .eq("auth_id", user.id);

      if (dbError) {
        warning("Name updated in profile but may not appear in admin panel.");
      } else {
        success("Name updated successfully!");
      }

      setEditingName(false);
      setNewName("");

      setUserProfile((previous) =>
        previous
          ? {
              ...previous,
              name: newName.trim(),
            }
          : previous,
      );
    } catch {
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

    if (!validatePhilippinePhone(newPhone)) {
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
        showError("Failed to update phone number. Please try again.");
        return;
      }

      const { error: dbError } = await supabase
        .from("users")
        .update({ phone: cleanedPhone })
        .eq("auth_id", user.id);

      if (dbError) {
        warning("Phone updated in profile but may not appear in admin panel.");
      } else {
        success("Phone number updated successfully!");
      }

      setEditingPhone(false);
      setNewPhone("");

      setUserProfile((previous) =>
        previous
          ? {
              ...previous,
              phone: cleanedPhone,
            }
          : previous,
      );
    } catch {
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
    setNewPhone(formatPhoneForDisplay(currentPhone));
    setEditingPhone(true);
  };

  return {
    user,
    loading,
    userProfile,
    loadingProfile,
    maintenanceActive,
    editingName,
    newName,
    updating,
    editingPhone,
    newPhone,
    updatingPhone,
    signingOut,
    bookingStats,
    statsLoading,
    setNewName,
    setNewPhone,
    formatPhoneNumber,
    handleSignOut,
    handleUpdateName,
    handleCancelEdit,
    handleStartEdit,
    handleUpdatePhone,
    handleCancelPhoneEdit,
    handleStartPhoneEdit,
  };
}
