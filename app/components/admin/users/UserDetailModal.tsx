"use client";

import { useState } from "react";
import { supabase } from "../../../supabaseClient";
import {
  UserPlus,
} from "lucide-react";
import {
  validatePhilippinePhone,
} from "../../../utils/phoneUtils";
import { UserDeleteConfirm } from "./UserDeleteConfirm";
import { UserBookingsSection } from "./UserBookingsSection";
import { UserInfoSection } from "./UserInfoSection";
import { UserRoleSection } from "./UserRoleSection";
import { UserPasswordSection } from "./UserPasswordSection";
import { Tables } from "../../../../database.types";

type User = Tables<"users">;

// ---------------------------------------------------------------------------
// Re-export DeleteConfirmModal (delegates to UserDeleteConfirm)
// ---------------------------------------------------------------------------

export { UserDeleteConfirm as DeleteConfirmModal } from "./UserDeleteConfirm";

// ---------------------------------------------------------------------------
// Re-export UserBookingsModal (delegates to UserBookingsSection)
// ---------------------------------------------------------------------------

export { UserBookingsSection as UserBookingsModal } from "./UserBookingsSection";

// ---------------------------------------------------------------------------
// Re-export PasswordRevealModal (delegates to UserPasswordSection)
// ---------------------------------------------------------------------------

export { UserPasswordSection as PasswordRevealModal } from "./UserPasswordSection";

// ---------------------------------------------------------------------------
// Add User Modal — composes UserInfoSection + UserRoleSection
// ---------------------------------------------------------------------------

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
      <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-success/10 rounded-full">
            <UserPlus className="w-5 h-5 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Add New User</h2>
        </div>

        {generalError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {generalError}
          </div>
        )}

        <div className="space-y-4">
          <UserInfoSection
            firstName={firstName}
            lastName={lastName}
            email={email}
            phone={phone}
            errors={errors}
            isSubmitting={isSubmitting}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onEmailChange={setEmail}
            onPhoneChange={setPhone}
            clearFieldError={clearFieldError}
          />

          <UserRoleSection
            role={role}
            canCreateAdmin={canCreateAdmin}
            isSubmitting={isSubmitting}
            onRoleChange={setRole}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:bg-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
